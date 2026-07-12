import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  type OnInit,
} from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import {
  type AbstractControl,
  type FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidatorFn,
  Validators,
} from "@angular/forms";
import { map } from "rxjs";
import { CatalogFacade } from "../../core/catalogs/catalog.facade";
import { CatalogStatusComponent } from "../../core/catalogs/catalog-status.component";
import { AppIconComponent } from "../../layout/educore-shell/app-icon.component";
import type { RemoteState } from "../../core/api/remote-state";
import { StudentSearchFacade } from "./student-search.facade";
import {
  isCalendarDateOnly,
  studentSearchFiltersFromQueryValues,
  studentSearchFiltersToQueryParams,
} from "./student-search.navigation";
import { studentSearchFiltersEqual } from "./student-search.mappers";
import { StudentHistoryNavigationHandoff } from "../student-history/student-history.navigation";
import type {
  StudentSearchFieldVm,
  StudentSearchFiltersVm,
  StudentSearchResultVm,
} from "./student-search.vm";

const requiredValidator: ValidatorFn = (control: AbstractControl<unknown>) =>
  Validators.required(control);
const calendarDateValidator: ValidatorFn = (
  control: AbstractControl<unknown>,
) => {
  const value = control.value;
  return typeof value !== "string" ||
    value.length === 0 ||
    isCalendarDateOnly(value)
    ? null
    : { calendarDate: true };
};

interface StudentSearchFormShape {
  schoolId: FormControl<number | null>;
  gradeId: FormControl<number | null>;
  academicYearId: FormControl<number | null>;
  asOfDate: FormControl<string>;
}

type StudentSearchFormGroup = FormGroup<StudentSearchFormShape>;

/**
 * Vista principal del recorrido de **Consulta de estudiantes** (US2).
 *
 * Responsabilidades de UI:
 * - Renderizar los filtros académicos `School → Grade → AcademicYear` con
 *   un campo opcional `asOfDate` para calcular la edad contra una fecha
 *   distinta a la actual. Los tres filtros principales son obligatorios
 *   porque el contrato los declara `required: true`.
 * - Bloquear el botón "Buscar" hasta que la combinación esté completa.
 *   El `reset` se hace a través del `CatalogFacade` para que las opciones
 *   mostradas reflejen exactamente los catálogos disponibles.
 * - Mantener los filtros académicos no sensibles en query params. La ruta es
 *   la fuente de verdad: submit reemplaza la URL actual y cada emisión válida
 *   ejecuta exactamente una consulta, incluido browser Back.
 * - Renderizar resultados en una tabla accesible que respeta el orden
 *   canónico del backend. Cada fila expone una acción "Ver historial"
 *   que registra identidad en el handoff volátil y navega con un token opaco.
 *   La página de historial resuelve ese token y consulta automáticamente.
 * - Mantener los cuatro estados remotos excluyentes (`loading`, `error`,
 *   `empty`, `success`) en regiones `aria-live` separadas. El error
 *   expone un botón "Reintentar" que re-envía la última consulta con los
 *   filtros vigentes.
 *
 * La forma del formulario se controla con Reactive Forms (no Signal Forms)
 * para mantener paridad con el plan técnico acordado.
 */
@Component({
  selector: "app-student-search",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CatalogStatusComponent, AppIconComponent],
  providers: [StudentSearchFacade],
  templateUrl: "./student-search.component.html",
  styleUrl: "./student-search.component.scss",
})
export class StudentSearchComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogFacade);
  private readonly search = inject(StudentSearchFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly historyHandoff = inject(StudentHistoryNavigationHandoff);
  private suppressNextQuerylessRouteReset = false;

  readonly result = this.search.result;
  readonly schoolsState = this.catalog.schoolsState;
  readonly gradesState = this.catalog.gradesState;
  readonly academicYearsState = this.catalog.academicYearsState;

  readonly form: StudentSearchFormGroup = this.fb.group({
    schoolId: this.fb.control<number | null>(null, [requiredValidator]),
    gradeId: this.fb.control<number | null>(null, [requiredValidator]),
    academicYearId: this.fb.control<number | null>(null, [requiredValidator]),
    asOfDate: this.fb.control("", [calendarDateValidator]),
  });

  /**
   * Reflejo en signal del valor vigente del formulario (no necesariamente
   * enviado). Se recalcula de forma síncrona en cada `valueChanges`, ya
   * que la suscripción de `toSignal` se activa en el constructor —antes de
   * `ngOnInit`— por lo que también captura los `setValue`/`reset`
   * programáticos que disparan la restauración de filtros desde la URL.
   * Es la base de `isStale`: compara este valor contra el snapshot que
   * guarda la fachada para la última búsqueda ejecutada.
   */
  private readonly formFilters = toSignal(
    this.form.valueChanges.pipe(map(() => this.toVm())),
    { initialValue: this.toVm() },
  );

  readonly schoolOptions = computed(() =>
    this.mapOptions(this.catalog.schoolsState(), (school) => ({
      value: school.id,
      label: `${school.name} · ${school.sector === "Public" ? "Público" : "Privado"}`,
    })),
  );
  readonly gradeOptions = computed(() =>
    this.mapOptions(this.catalog.gradesState(), (grade) => ({
      value: grade.id,
      label: grade.name,
    })),
  );
  readonly academicYearOptions = computed(() =>
    this.mapOptions(this.catalog.academicYearsState(), (year) => ({
      value: year.id,
      label: year.isCurrent ? `${year.name} (actual)` : year.name,
    })),
  );

  readonly successData = computed<readonly StudentSearchResultVm[] | null>(
    () => {
      const state = this.result();
      return state.status === "success" ? state.data : null;
    },
  );

  readonly isLoading = computed(() => this.result().status === "loading");
  readonly isSuccess = computed(() => this.result().status === "success");
  readonly isEmpty = computed(() => this.result().status === "empty");
  readonly hasError = computed(() => this.result().status === "error");

  /**
   * True cuando hay resultados visibles (`result().status === "success"`)
   * pero el formulario ya no refleja los filtros de esa búsqueda. Al
   * apoyarse en una comparación de snapshots (formulario vigente vs.
   * `search.filters()`), tanto re-ejecutar la búsqueda como devolver los
   * filtros a los valores ya buscados hacen desaparecer el banner —no hace
   * falta una bandera "dirty" separada.
   */
  readonly isStale = computed(() => {
    if (this.result().status !== "success") {
      return false;
    }
    return !studentSearchFiltersEqual(
      this.formFilters(),
      this.search.filters(),
    );
  });

  readonly errorProblem = computed(() => {
    const state = this.result();
    return state.status === "error" ? state.problem : null;
  });

  readonly errorFields = computed(() => {
    const problem = this.errorProblem();
    if (!problem?.errors) {
      return [];
    }
    return Object.entries(problem.errors).map(([field, messages]) => ({
      field,
      messages,
    }));
  });

  ngOnInit(): void {
    // Cargar catálogos globales al entrar a la ruta. La fachada de
    // catálogos se encarga de cancelar cualquier solicitud previa.
    this.catalog.loadSchools();
    this.catalog.loadGrades();
    this.catalog.loadAcademicYears();
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const filters = studentSearchFiltersFromQueryValues({
          schoolId: params.get("schoolId"),
          gradeId: params.get("gradeId"),
          academicYearId: params.get("academicYearId"),
          asOfDate: params.get("asOfDate"),
        });
        if (filters === null && this.suppressNextQuerylessRouteReset) {
          this.suppressNextQuerylessRouteReset = false;
          return;
        }
        this.applyRouteFilters(filters);
      });
  }

  // -- Acciones de UI -----------------------------------------------------

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const vm = this.toVm();
    const queryParams = studentSearchFiltersToQueryParams(vm);
    if (queryParams === null) {
      this.form.markAllAsTouched();
      return;
    }
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });
  }

  onRetry(): void {
    this.search.retry();
  }

  retrySchools(): void {
    this.catalog.loadSchools();
  }

  retryGrades(): void {
    this.catalog.loadGrades();
  }

  retryAcademicYears(): void {
    this.catalog.loadAcademicYears();
  }

  async onReset(): Promise<void> {
    this.applyRouteFilters(null);
    if (this.route.snapshot.queryParamMap.keys.length === 0) {
      return;
    }

    this.suppressNextQuerylessRouteReset = true;
    try {
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    } finally {
      this.suppressNextQuerylessRouteReset = false;
    }
  }

  /** Delegates private identity handoff and opaque-token navigation. */
  async viewHistory(row: StudentSearchResultVm): Promise<void> {
    await this.historyHandoff.navigateToHistory({
      documentType: row.documentType,
      documentNumber: row.documentNumber,
    });
  }

  // -- Helpers ------------------------------------------------------------

  private toVm(): StudentSearchFiltersVm {
    const raw = this.form.getRawValue();
    return {
      schoolId: raw.schoolId,
      gradeId: raw.gradeId,
      academicYearId: raw.academicYearId,
      asOfDate: raw.asOfDate.length === 0 ? null : raw.asOfDate,
    };
  }

  private applyRouteFilters(filters: StudentSearchFiltersVm | null): void {
    if (filters === null) {
      this.search.reset();
      this.form.reset({
        schoolId: null,
        gradeId: null,
        academicYearId: null,
        asOfDate: "",
      });
      return;
    }
    this.form.setValue({
      schoolId: filters.schoolId,
      gradeId: filters.gradeId,
      academicYearId: filters.academicYearId,
      asOfDate: filters.asOfDate ?? "",
    });
    this.search.search(filters);
  }

  private mapOptions<T, TValue extends number | string>(
    state: RemoteState<readonly T[]>,
    project: (item: T) => StudentSearchFieldVm<TValue>,
  ): readonly StudentSearchFieldVm<TValue>[] {
    if (state.status === "success") {
      return state.data.map(project);
    }
    return [];
  }
}
