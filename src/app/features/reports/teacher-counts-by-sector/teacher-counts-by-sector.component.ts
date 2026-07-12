import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
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
import type { RemoteState } from "../../../core/api/remote-state";
import { AppIconComponent } from "../../../layout/educore-shell/app-icon.component";
import { ReportFacade } from "../report.facade";
import { teacherCountsBySectorFiltersToParams } from "../report.mappers";
import type {
  SectorCountVm,
  TeacherCountsBySectorFiltersVm,
  TeacherCountsBySectorVm,
} from "../report.vm";

interface SectorFiltersFormShape {
  periodStart: FormControl<string>;
  periodEnd: FormControl<string>;
}

type SectorFiltersFormGroup = FormGroup<SectorFiltersFormShape>;

/**
 * Vista del recorrido **Docentes distintos por sector** (FR-RPT-003, WU08).
 *
 * Responsabilidades de UI:
 *
 * - Renderizar el formulario de período (`periodStart` + `periodEnd`
 *   opcionales pero simétricos: si se envía uno, el otro también debe
 *   estar definido) respetando `fieldset + legend`, `aria-busy` durante
 *   el envío y `aria-describedby` para la regla de simetría.
 * - Exponer los estados remotos (`loading`, `error`, `success`) en
 *   regiones `aria-live` separadas, conservando los filtros para
 *   corrección.
 * - Presentar los dos sectores canónicos (público y privado) con sus
 *   conteos exactos, sin recalcular ni deduplicar — la deduplicación
 *   por `teacherId` la realiza el backend.
 * - Permitir `Reintentar` tras un error usando los mismos filtros.
 *
 * El recorrido nunca emite `empty`: el DTO canónico garantiza dos
 * sectores con conteos (posiblemente `0`); `0`+`0` se mapea a
 * `success`, nunca a `error`.
 *
 * Esta vista NO incluye la navegación shell (eso se monta en WU10).
 * Como WU08 implementa el segundo reporte, este componente está
 * pensado para ser hijo de `ReportsShellComponent` (PR5), pero puede
 * ejercitarse en aislamiento porque la fachada es proveda localmente.
 */
@Component({
  selector: "app-teacher-counts-by-sector",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppIconComponent],
  providers: [ReportFacade],
  templateUrl: "./teacher-counts-by-sector.component.html",
  styleUrl: "./teacher-counts-by-sector.component.scss",
})
export class TeacherCountsBySectorComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reports = inject(ReportFacade);
  private readonly destroyRef = inject(DestroyRef);

  readonly result = this.reports.sectorState;

  readonly form: SectorFiltersFormGroup = this.fb.group({
    periodStart: this.fb.control("", [
      Validators.pattern(/^\d{4}-\d{2}-\d{2}$/),
    ]),
    periodEnd: this.fb.control("", [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]),
  });

  readonly isIdle = computed(() => this.result().status === "idle");
  readonly isLoading = computed(() => this.result().status === "loading");
  readonly isSuccess = computed(() => this.result().status === "success");
  readonly hasError = computed(() => this.result().status === "error");

  /**
   * Puente reactivo del valor del período. `FormGroup` no es una señal:
   * sin este puente, `oneDateFilled`/`hasDateRangeError`/`describedByFor`
   * (que leen el formulario) no participarían del grafo de señales de
   * Angular y, en una app `zoneless` (ver `provideZonelessChangeDetection`
   * en `app.config.ts`), la vista `OnPush` nunca se marcaría para
   * re-chequeo tras un cambio de valor — el binding del template quedaría
   * desactualizado hasta el próximo evento ajeno. `ngOnInit()` mantiene
   * esta señal sincronizada con cada emisión de `form.valueChanges`.
   */
  private readonly rawPeriod = signal(this.form.getRawValue());

  /**
   * Indica si los filtros actuales son simétricos. La UI usa este
   * predicado para activar/desactivar el botón "Consultar". Se calcula
   * imperativamente — no como `computed()` — porque el formulario
   * reactivo no expone `Signal`s; un `computed` quedaría congelado en
   * el estado inicial del componente.
   */
  canSubmit(): boolean {
    return teacherCountsBySectorFiltersToParams(this.toFiltersVm()) !== null;
  }

  /**
   * Indica si `which` es el extremo del período que falta completar
   * cuando el otro ya está definido (exactamente uno de los dos lleno).
   * Se usa para marcar `[attr.aria-required]` sólo en el campo vacío —
   * ambos vacíos o ambos llenos devuelven `false` para los dos extremos,
   * conservando el conteo idle de `aria-required` en 0.
   */
  oneDateFilled(which: "start" | "end"): boolean {
    const raw = this.rawPeriod();
    const startFilled = raw.periodStart.trim().length > 0;
    const endFilled = raw.periodEnd.trim().length > 0;
    if (startFilled === endFilled) {
      return false;
    }
    return which === "start" ? !startFilled : !endFilled;
  }

  /**
   * `true` cuando ambos extremos están definidos y `periodEnd` es
   * anterior a `periodStart` (comparación de strings ISO `YYYY-MM-DD`,
   * válida porque el orden lexicográfico coincide con el cronológico).
   * Sólo controla el `[disabled]` del botón — `onSubmit()` no la
   * consulta, así que el envío directo sigue llegando al backend (que
   * aplica la regla canónica como `422 period_invalid`).
   */
  hasDateRangeError(): boolean {
    const raw = this.rawPeriod();
    const start = raw.periodStart.trim();
    const end = raw.periodEnd.trim();
    if (start.length === 0 || end.length === 0) {
      return false;
    }
    return end < start;
  }

  /**
   * `aria-describedby` del extremo `which`: siempre incluye la ayuda
   * compartida (`sector-period-help`) y, si corresponde, el id del
   * mensaje de error inline activo para ese campo.
   */
  describedByFor(which: "start" | "end"): string {
    const ids = ["sector-period-help"];
    if (which === "start") {
      if (this.oneDateFilled("start")) {
        ids.push("sector-period-start-error");
      }
    } else if (this.oneDateFilled("end") || this.hasDateRangeError()) {
      ids.push("sector-period-end-error");
    }
    return ids.join(" ");
  }

  readonly successData = computed<TeacherCountsBySectorVm | null>(() => {
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
    // El reset del estado remoto se invoca explícitamente desde
    // `onReset()`; el cambio de filtros sólo se materializa al pulsar
    // "Consultar" para mantener la disciplina de cancel-on-switch — este
    // subscriber NO dispara ninguna consulta. Sólo mantiene `rawPeriod`
    // (puente de sólo lectura hacia la UI: aria-required dinámico,
    // errores inline e idle prompt) alineado con el valor vigente de
    // ambos extremos.
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.rawPeriod.set(this.form.getRawValue());
      });
  }

  onSubmit(): void {
    const vm = this.toFiltersVm();
    if (teacherCountsBySectorFiltersToParams(vm) === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.reports.loadSector(vm);
  }

  onRetry(): void {
    this.reports.retrySector();
  }

  onReset(): void {
    this.reports.resetSector();
    this.form.reset({
      periodStart: "",
      periodEnd: "",
    });
  }

  /**
   * Etiqueta legible del sector para el template. Mantiene paridad con
   * `SectorCountVm.label` (centralizado en `report.vm`).
   */
  sectorLabel(sector: SectorCountVm): string {
    return sector.label;
  }

  /**
   * Estado remoto como `RemoteState` para usar en plantillas con
   * narrowing. Devuelve el mismo objeto que `result()`.
   */
  remote(): RemoteState<TeacherCountsBySectorVm> {
    return this.result();
  }

  // -- Helpers -----------------------------------------------------------

  private toFiltersVm(): TeacherCountsBySectorFiltersVm {
    const raw = this.form.getRawValue();
    return {
      periodStart: raw.periodStart.length === 0 ? null : raw.periodStart,
      periodEnd: raw.periodEnd.length === 0 ? null : raw.periodEnd,
    };
  }
}
