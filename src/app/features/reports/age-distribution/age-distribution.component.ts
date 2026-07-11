import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  type OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  type FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CatalogFacade } from "../../../core/catalogs/catalog.facade";
import type { RemoteState } from "../../../core/api/remote-state";
import { ReportFacade } from "../report.facade";
import { ageDistributionFiltersToParams } from "../report.mappers";
import type {
  AgeBandVm,
  AgeDistributionFiltersVm,
  AgeDistributionVm,
  AgeDistributionFieldVm,
} from "../report.vm";

interface AgeFiltersFormShape {
  academicYearId: FormControl<number | null>;
  asOfDate: FormControl<string>;
  schoolId: FormControl<number | null>;
  gradeId: FormControl<number | null>;
}

type AgeFiltersFormGroup = FormGroup<AgeFiltersFormShape>;

/**
 * Vista del recorrido **Distribución por edad** (FR-RPT-002, WU07).
 *
 * Responsabilidades de UI:
 * - Renderizar el formulario de filtros académicos (`AcademicYear`
 *   obligatorio; `School`, `Grade` y `AsOfDate` opcionales) respetando
 *   `fieldset + legend`, `aria-required="true"` en el campo obligatorio
 *   y `aria-busy` durante el envío.
 * - Exponer los tres estados remotos relevantes (`loading`, `error`,
 *   `success`) en regiones `aria-live` separadas, conservando los
 *   filtros para corrección. El reporte nunca emite `empty`: el
 *   escenario canónico de "0 inscripciones en todas las bandas" se
 *   presenta como `success` con conteos visibles en `0`.
 * - Presentar las tres bandas canónicas (`3 a 7`, `8 a 12`, `Mayores
 *   de 12`) con sus conteos exactos, sin recalcular ni reagrupar.
 * - Permitir `Reintentar` tras un error usando los mismos filtros.
 *
 * Esta vista NO incluye la navegación shell (eso se monta en WU10).
 * Como WU07 implementa un único reporte, este componente está pensado
 * para ser el primer hijo de `ReportsShellComponent` (PR5), pero puede
 * ejercitarse en aislamiento porque la fachada es proveda localmente.
 */
@Component({
  selector: "app-age-distribution",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  providers: [ReportFacade],
  templateUrl: "./age-distribution.component.html",
  styleUrl: "./age-distribution.component.scss",
})
export class AgeDistributionComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogFacade);
  private readonly reports = inject(ReportFacade);
  private readonly destroyRef = inject(DestroyRef);

  readonly result = this.reports.ageState;

  readonly form: AgeFiltersFormGroup = this.fb.group({
    academicYearId: this.fb.control<number | null>(null, [Validators.required]),
    asOfDate: this.fb.control("", [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]),
    schoolId: this.fb.control<number | null>(null),
    gradeId: this.fb.control<number | null>(null),
  });

  readonly academicYearOptions = computed(() =>
    this.mapOptions(this.catalog.academicYearsState(), (year) => ({
      value: year.id,
      label: year.isCurrent ? `${year.name} (actual)` : year.name,
    })),
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

  readonly isLoading = computed(() => this.result().status === "loading");
  readonly isSuccess = computed(() => this.result().status === "success");
  readonly hasError = computed(() => this.result().status === "error");

  readonly successData = computed<AgeDistributionVm | null>(() => {
    const state = this.result();
    return state.status === "success" ? state.data : null;
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
    this.catalog.loadAcademicYears();
    this.catalog.loadSchools();
    this.catalog.loadGrades();

    // Mantener el formulario sincronizado: el reset del estado remoto
    // se invoca explícitamente desde `onReset()`; las teclas
    // individuales no emiten cambios que disparen un reset implícito.
    this.form.controls.academicYearId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // No-op: el cambio de filtros sólo se materializa al pulsar
        // "Consultar" para mantener la disciplina de cancel-on-switch.
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const vm = this.toFiltersVm();
    if (ageDistributionFiltersToParams(vm) === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.reports.loadAge(vm);
  }

  onRetry(): void {
    this.reports.retryAge();
  }

  onReset(): void {
    this.reports.resetAge();
    this.form.reset({
      academicYearId: null,
      asOfDate: "",
      schoolId: null,
      gradeId: null,
    });
  }

  /**
   * Etiqueta legible del rango de cada banda para el template.
   * Mantiene paridad con `AgeBandVm.label` (centralizado en `report.vm`).
   */
  bandLabel(band: AgeBandVm): string {
    return band.label;
  }

  /**
   * Cadena del rango etario para el template. Conserva el shape
   * canónico (incluye el `null` para la banda abierta).
   */
  bandRange(band: AgeBandVm): string {
    if (band.maximumAge === null) {
      return `Desde ${band.minimumAge} años (sin tope)`;
    }
    return `${band.minimumAge} a ${band.maximumAge} años`;
  }

  // -- Helpers -----------------------------------------------------------

  private toFiltersVm(): AgeDistributionFiltersVm {
    const raw = this.form.getRawValue();
    return {
      academicYearId: raw.academicYearId,
      asOfDate: raw.asOfDate.length === 0 ? null : raw.asOfDate,
      schoolId: raw.schoolId,
      gradeId: raw.gradeId,
    };
  }

  private mapOptions<T, TValue extends number | string>(
    state: RemoteState<readonly T[]>,
    project: (item: T) => AgeDistributionFieldVm<TValue>,
  ): readonly AgeDistributionFieldVm<TValue>[] {
    if (state.status === "success") {
      return state.data.map(project);
    }
    return [];
  }
}
