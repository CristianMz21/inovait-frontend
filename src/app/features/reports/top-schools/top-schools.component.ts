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
  type AbstractControl,
  type FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidatorFn,
  Validators,
} from "@angular/forms";
import { CatalogFacade } from "../../../core/catalogs/catalog.facade";
import { CatalogStatusComponent } from "../../../core/catalogs/catalog-status.component";
import { AppIconComponent } from "../../../layout/educore-shell/app-icon.component";
import type { RemoteState } from "../../../core/api/remote-state";
import { ReportFacade } from "../report.facade";
import { topSchoolsFiltersToParams } from "../report.mappers";
import type { TopSchoolsFiltersVm, TopSchoolsVm } from "../report.vm";

const requiredValidator: ValidatorFn = (control: AbstractControl<unknown>) =>
  Validators.required(control);

interface TopFiltersFormShape {
  academicYearId: FormControl<number | null>;
}

type TopFiltersFormGroup = FormGroup<TopFiltersFormShape>;

/**
 * Vista del recorrido **Escuelas líderes por matrícula** (FR-RPT-003, WU09).
 *
 * Responsabilidades de UI:
 *
 * - Renderizar un formulario mínimo (`AcademicYear` obligatorio) con
 *   `fieldset + legend`, `aria-required="true"` en el campo obligatorio
 *   y `aria-busy` durante el envío.
 * - Exponer los cuatro estados remotos (`loading`, `error`, `empty`,
 *   `success`) en regiones `aria-live` separadas, conservando los
 *   filtros para corrección.
 * - Presentar la lista de escuelas líderes en una `<table>` con
 *   `<caption class="visually-hidden">` y `<th scope="col">`. La UI NO
 *   reordena ni empata/desempata — preserva el orden estable que el
 *   backend emite (`school.name` ASC y luego `school.id`).
 * - Mostrar un botón `Reintentar` tanto en el estado `error` como en el
 *   estado `empty` (el contrato declara `200 []` como respuesta válida
 *   para año sin inscripciones; el botón permite a la operadora volver
 *   a intentar la consulta sin cambiar los filtros).
 *
 * El recorrido es el primero en admitir un estado `empty` real: las
 * vistas WU07 (`age`) y WU08 (`sector`) siempre reciben DTOs
 * estructuralmente no vacíos y, por lo tanto, no exponen `empty`.
 *
 * Esta vista NO incluye la navegación shell (eso se monta en WU10).
 * Como WU09 implementa el tercer reporte, este componente está pensado
 * para ser hijo de `ReportsShellComponent` (PR5), pero puede ejercitarse
 * en aislamiento porque la fachada es proveda localmente.
 */
@Component({
  selector: "app-top-schools",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CatalogStatusComponent, AppIconComponent],
  providers: [ReportFacade],
  templateUrl: "./top-schools.component.html",
  styleUrl: "./top-schools.component.scss",
})
export class TopSchoolsComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogFacade);
  private readonly reports = inject(ReportFacade);
  private readonly destroyRef = inject(DestroyRef);

  readonly result = this.reports.topState;
  readonly academicYearsState = this.catalog.academicYearsState;

  readonly form: TopFiltersFormGroup = this.fb.group({
    academicYearId: this.fb.control<number | null>(null, [requiredValidator]),
  });

  readonly academicYearOptions = computed(() => {
    const state = this.catalog.academicYearsState();
    if (state.status === "success") {
      return state.data.map((year) => ({
        value: year.id,
        label: year.isCurrent ? `${year.name} (actual)` : year.name,
      }));
    }
    return [];
  });

  readonly isLoading = computed(() => this.result().status === "loading");
  readonly isSuccess = computed(() => this.result().status === "success");
  readonly isEmpty = computed(() => this.result().status === "empty");
  readonly hasError = computed(() => this.result().status === "error");

  readonly successData = computed<TopSchoolsVm | null>(() => {
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

  /**
   * Indicador derivado del estado remoto para soportar el control de
   * retry desde la plantilla. Devuelve `true` cuando el botón
   * "Reintentar" debe estar habilitado (error o empty).
   */
  readonly canRetry = computed(() => this.hasError() || this.isEmpty());

  ngOnInit(): void {
    this.catalog.loadAcademicYears();

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
    if (topSchoolsFiltersToParams(vm) === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.reports.loadTop(vm);
  }

  onRetry(): void {
    this.reports.retryTop();
  }

  retryAcademicYears(): void {
    this.catalog.loadAcademicYears();
  }

  onReset(): void {
    this.reports.resetTop();
    this.form.reset({
      academicYearId: null,
    });
  }

  /**
   * Estado remoto como `RemoteState` para usar en plantillas con
   * narrowing. Devuelve el mismo objeto que `result()`.
   */
  remote(): RemoteState<TopSchoolsVm> {
    return this.result();
  }

  // -- Helpers -----------------------------------------------------------

  private toFiltersVm(): TopSchoolsFiltersVm {
    const raw = this.form.getRawValue();
    return {
      academicYearId: raw.academicYearId,
    };
  }
}
