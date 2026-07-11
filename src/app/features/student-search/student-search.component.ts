import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type OnInit,
} from "@angular/core";
import {
  type AbstractControl,
  type FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidatorFn,
  Validators,
} from "@angular/forms";
import { CatalogFacade } from "../../core/catalogs/catalog.facade";
import type { RemoteState } from "../../core/api/remote-state";
import { StudentSearchFacade } from "./student-search.facade";
import { studentSearchFiltersToParams } from "./student-search.mappers";
import type {
  StudentSearchFieldVm,
  StudentSearchFiltersVm,
  StudentSearchResultVm,
} from "./student-search.vm";

const requiredValidator: ValidatorFn = (control: AbstractControl<unknown>) =>
  Validators.required(control);

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
 * - Renderizar resultados en una tabla accesible que respeta el orden
 *   canónico del backend. Cada fila expone un placeholder para la acción
 *   "Ver historial" (P1 bloqueado) sin revelar datos sensibles.
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
  imports: [ReactiveFormsModule],
  providers: [StudentSearchFacade],
  templateUrl: "./student-search.component.html",
  styleUrl: "./student-search.component.scss",
})
export class StudentSearchComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogFacade);
  private readonly search = inject(StudentSearchFacade);

  readonly result = this.search.result;

  readonly form: StudentSearchFormGroup = this.fb.group({
    schoolId: this.fb.control<number | null>(null, [requiredValidator]),
    gradeId: this.fb.control<number | null>(null, [requiredValidator]),
    academicYearId: this.fb.control<number | null>(null, [requiredValidator]),
    asOfDate: this.fb.control("", [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]),
  });

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
  }

  // -- Acciones de UI -----------------------------------------------------

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const vm = this.toVm();
    if (studentSearchFiltersToParams(vm) === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.search.search(vm);
  }

  onRetry(): void {
    this.search.retry();
  }

  onReset(): void {
    this.search.reset();
    this.form.reset({
      schoolId: null,
      gradeId: null,
      academicYearId: null,
      asOfDate: "",
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
