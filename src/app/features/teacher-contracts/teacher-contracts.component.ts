/* Copyright (c) 2026. All rights reserved. */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
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
import { CatalogFacade } from "../../core/catalogs/catalog.facade";
import { CatalogStatusComponent } from "../../core/catalogs/catalog-status.component";
import {
  CALENDAR_DATE_PATTERN,
  isCalendarDateBefore,
  isCalendarDateOnly,
} from "../../core/dates/calendar-date";
import { AppIconComponent } from "../../layout/educore-shell/app-icon.component";
import { TableSkipDirective } from "../../layout/educore-shell/table-skip.directive";
import type { RemoteState } from "../../core/api/remote-state";
import { TeacherContractsFacade } from "./teacher-contracts.facade";
import { teacherContractsFormToRequest } from "./teacher-contracts.mappers";
import type {
  TeacherContractResultVm,
  TeacherContractsFieldVm,
  TeacherContractsFormVm,
} from "./teacher-contracts.vm";

const requiredValidator: ValidatorFn = (control: AbstractControl<unknown>) =>
  Validators.required(control);

const calendarDateValidator: ValidatorFn = (
  control: AbstractControl<unknown>,
) => {
  if (typeof control.value !== "string" || control.value.length === 0) {
    return null;
  }
  if (!isCalendarDateOnly(control.value)) {
    return { invalidCalendarDate: true };
  }
  return null;
};

interface TeacherContractsFormShape {
  teacherId: FormControl<number | null>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
}

type TeacherContractsFormGroup = FormGroup<TeacherContractsFormShape>;

interface TeacherQueryFormShape {
  teacherId: FormControl<number | null>;
  asOfDate: FormControl<string>;
}

type TeacherQueryFormGroup = FormGroup<TeacherQueryFormShape>;

/**
 * Vista principal del recorrido de **Contratos docentes** (US3).
 *
 * Responsabilidades de UI:
 * - Renderizar el formulario de creación multiescuela con identidad
 *   docente, escuelas elegibles, fechas y envío atómico. La selección
 *   de escuelas se gestiona con un set de checkboxes accesible para
 *   permitir la selección múltiple sin perder foco.
 * - Validar localmente que `endDate` no sea anterior a `startDate` y
 *   que `schoolIds` no contenga duplicados. La regla de duplicados se
 *   aplica en el cliente para evitar `409` por la UI.
 * - Renderizar la consulta histórica por docente con filtros opcionales
 *   (`asOfDate`).
 * - Exponer los cuatro estados remotos excluyentes (`loading`, `error`,
 *   `empty`, `success`) en regiones `aria-live` separadas, manteniendo
 *   la atomicidad visual: ningún contrato nuevo se muestra si el
 *   backend rechaza la solicitud.
 *
 * La forma del formulario se controla con Reactive Forms (no Signal
 * Forms) para mantener paridad con el plan técnico acordado.
 */
@Component({
  selector: "app-teacher-contracts",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CatalogStatusComponent,
    AppIconComponent,
    TableSkipDirective,
  ],
  providers: [TeacherContractsFacade],
  templateUrl: "./teacher-contracts.component.html",
  styleUrl: "./teacher-contracts.component.scss",
})
export class TeacherContractsComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogFacade);
  private readonly contracts = inject(TeacherContractsFacade);
  private readonly destroyRef = inject(DestroyRef);

  readonly createResult = this.contracts.createResult;
  readonly listResult = this.contracts.listResult;
  readonly teachersState = this.catalog.teachersState;
  readonly schoolsState = this.catalog.schoolsState;

  // -- Formulario de creación -----------------------------------------

  readonly createForm: TeacherContractsFormGroup = this.fb.group({
    teacherId: this.fb.control<number | null>(null, [requiredValidator]),
    startDate: this.fb.control("", [
      requiredValidator,
      Validators.pattern(CALENDAR_DATE_PATTERN),
      calendarDateValidator,
    ]),
    endDate: this.fb.control("", [
      Validators.pattern(CALENDAR_DATE_PATTERN),
      calendarDateValidator,
    ]),
  });

  /** Conjunto de escuelas seleccionadas para el envío atómico. */
  private readonly selectedSchoolIds = signal<ReadonlySet<number>>(
    new Set<number>(),
  );
  readonly selectedSchoolsCount = computed(() => this.selectedSchoolIds().size);

  readonly createTeacherOptions = computed(() =>
    this.mapOptions(this.catalog.teachersState(), teacher => ({
      value: teacher.id,
      label: `${teacher.firstNames} ${teacher.lastNames} · ${teacher.documentType} ${teacher.documentNumber}`,
    })),
  );

  readonly schoolOptions = computed(() =>
    this.mapOptions(this.catalog.schoolsState(), school => {
      let sectorLabel = "Privado";
      if (school.sector === "Public") {
        sectorLabel = "Público";
      }
      return {
        value: school.id,
        label: `${school.name} · ${sectorLabel}`,
      };
    }),
  );

  readonly isCreating = computed(
    () => this.createResult().status === "loading",
  );
  readonly createSuccess = computed(() => {
    const state = this.createResult();
    if (state.status === "success") {
      return state.data;
    }
    return null;
  });
  readonly hasCreateError = computed(
    () => this.createResult().status === "error",
  );
  readonly createErrorProblem = computed(() => {
    const state = this.createResult();
    if (state.status === "error") {
      return state.problem;
    }
    return null;
  });
  readonly createErrorFields = computed(() => {
    const problem = this.createErrorProblem();
    if (!problem?.errors) {
      return [];
    }
    return Object.entries(problem.errors).map(([field, messages]) => ({
      field,
      messages,
    }));
  });

  // -- Formulario de consulta -----------------------------------------

  readonly queryForm: TeacherQueryFormGroup = this.fb.group({
    teacherId: this.fb.control<number | null>(null, [requiredValidator]),
    asOfDate: this.fb.control("", [
      Validators.pattern(CALENDAR_DATE_PATTERN),
      calendarDateValidator,
    ]),
  });

  constructor() {
    effect(() => {
      const state = this.createResult();
      if (state.status !== "success") {
        return;
      }
      const [createdContract] = state.data;
      if (createdContract === undefined) {
        return;
      }
      this.queryForm.patchValue(
        {
          teacherId: createdContract.teacherId,
          asOfDate: "",
        },
        { emitEvent: false },
      );
    });
  }

  readonly queryTeacherOptions = computed(() =>
    this.mapOptions(this.catalog.teachersState(), teacher => ({
      value: teacher.id,
      label: `${teacher.firstNames} ${teacher.lastNames} · ${teacher.documentType} ${teacher.documentNumber}`,
    })),
  );

  readonly isQuerying = computed(() => this.listResult().status === "loading");
  readonly isQueryEmpty = computed(() => this.listResult().status === "empty");
  readonly querySuccess = computed<readonly TeacherContractResultVm[] | null>(
    () => {
      const state = this.listResult();
      if (state.status === "success") {
        return state.data;
      }
      return null;
    },
  );
  readonly hasQueryError = computed(() => this.listResult().status === "error");
  readonly queryErrorProblem = computed(() => {
    const state = this.listResult();
    if (state.status === "error") {
      return state.problem;
    }
    return null;
  });

  /** Etiqueta humana del estado efectivo. */
  effectiveLabel(status: TeacherContractResultVm["effectiveStatus"]): string {
    switch (status) {
      case "Upcoming":
        return "Próximo";
      case "Effective":
        return "Vigente";
      case "Expired":
        return "Vencido";
      case "Cancelled":
        return "Cancelado";
    }
  }

  /** Etiqueta humana del estado persistido. */
  persistedLabel(status: TeacherContractResultVm["persistedStatus"]): string {
    switch (status) {
      case "Confirmed":
        return "Vigente";
      case "Cancelled":
        return "Cancelado";
    }
  }

  /**
   * Tono visual (`.ec-badge--*`) del estado persistido. Presentacional
   * puro: no altera el valor del dominio, sólo elige qué modificador de
   * color/forma aplica sobre el texto existente (`persistedLabel()`).
   */
  persistedTone(
    status: TeacherContractResultVm["persistedStatus"],
  ): "active" | "closed" {
    switch (status) {
      case "Confirmed":
        return "active";
      case "Cancelled":
        return "closed";
    }
  }

  /**
   * Tono visual (`.ec-badge--*`) del estado efectivo. Presentacional puro,
   * igual que {@link persistedTone}.
   *
   * La paleta temporal (`current`/`upcoming`/`expired`) no modela un
   * contrato cancelado como un estado propio: "expired" es el tono más
   * cercano ("ya no vigente"), y el texto (`effectiveLabel()` sigue
   * devolviendo "Cancelado") es la señal que lo distingue de un
   * vencimiento natural — el color nunca es la única señal.
   */
  effectiveTone(
    status: TeacherContractResultVm["effectiveStatus"],
  ): "current" | "upcoming" | "expired" {
    switch (status) {
      case "Upcoming":
        return "upcoming";
      case "Effective":
        return "current";
      case "Expired":
        return "expired";
      case "Cancelled":
        return "expired";
    }
  }

  /** Etiqueta del rango de fechas (con `vigente` cuando `endDate` es null). */
  dateRangeLabel(contract: TeacherContractResultVm): string {
    if (contract.endDate === null) {
      return `Desde ${contract.startDate} · vigente`;
    }
    return `Desde ${contract.startDate} hasta ${contract.endDate}`;
  }

  ngOnInit(): void {
    // Cargar catálogos canónicos al entrar a la ruta. La fachada de
    // catálogos se encarga de cancelar cualquier solicitud previa.
    this.catalog.loadTeachers();
    this.catalog.loadSchools();

    // Mantener el campo docente en sincronía entre el formulario de
    // creación y el de consulta: el catálogo es el mismo y la identidad
    // del docente es la referencia canónica.
    this.createForm.controls.teacherId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // El reset del createResult es opcional: se omite para no
        // perder un resultado exitoso al cambiar de docente en el
        // formulario de creación. El resetCreate() se invoca
        // explícitamente desde `onResetCreate()`.
      });
  }

  retryTeachers(): void {
    this.catalog.loadTeachers();
  }

  retrySchools(): void {
    this.catalog.loadSchools();
  }

  // -- Acciones de creación --------------------------------------------

  onSubmitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const vm = this.toCreateVm();
    if (teacherContractsFormToRequest(vm) === null) {
      // Marca todas las escuelas como tocadas para mostrar feedback de
      // validación (e.g., al menos una escuela requerida).
      this.createForm.markAllAsTouched();
      return;
    }
    this.contracts.submit(vm);
  }

  onRetryCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.contracts.retrySubmit(this.toCreateVm());
  }

  onResetCreate(): void {
    this.contracts.resetCreate();
    this.createForm.reset({
      teacherId: null,
      startDate: "",
      endDate: "",
    });
    this.selectedSchoolIds.set(new Set<number>());
  }

  selectSchool(schoolId: number): void {
    this.selectedSchoolIds.update(current => {
      if (current.has(schoolId)) {
        return current;
      }
      const next = new Set(current);
      next.add(schoolId);
      return next;
    });
  }

  deselectSchool(schoolId: number): void {
    this.selectedSchoolIds.update(current => {
      if (!current.has(schoolId)) {
        return current;
      }
      const next = new Set(current);
      next.delete(schoolId);
      return next;
    });
  }

  onSchoolCheckboxChange(schoolId: number, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    if (event.target.checked) {
      this.selectSchool(schoolId);
    } else {
      this.deselectSchool(schoolId);
    }
  }

  isSchoolSelected(schoolId: number): boolean {
    return this.selectedSchoolIds().has(schoolId);
  }

  /** Validez de la VM de creación considerando escuelas seleccionadas. */
  isCreateSubmittable(): boolean {
    return teacherContractsFormToRequest(this.toCreateVm()) !== null;
  }

  /** Etiqueta legible del rango de fechas para el preview. */
  createRangeHint(): string {
    const start = this.createForm.controls.startDate.value;
    const end = this.createForm.controls.endDate.value;
    if (!start) {
      return "";
    }
    if (!end) {
      return `Desde ${start} · sin fecha de fin`;
    }
    if (!isCalendarDateOnly(start) || !isCalendarDateOnly(end)) {
      return "Ingrese fechas calendario válidas.";
    }
    if (isCalendarDateBefore(end, start)) {
      return "La fecha de fin debe ser igual o posterior a la fecha de inicio.";
    }
    return `Desde ${start} hasta ${end}`;
  }

  contractCountLabel(count: number): string {
    if (count === 1) {
      return "contrato";
    }
    return "contratos";
  }

  // -- Acciones de consulta --------------------------------------------

  onSubmitQuery(): void {
    if (this.queryForm.invalid) {
      this.queryForm.markAllAsTouched();
      return;
    }
    const teacherId = this.queryForm.controls.teacherId.value;
    if (teacherId === null) {
      this.queryForm.markAllAsTouched();
      return;
    }
    const asOf = this.queryForm.controls.asOfDate.value;
    let asOfDate: string | null = null;
    if (asOf.length > 0) {
      asOfDate = asOf;
    }
    this.contracts.searchByTeacher(teacherId, asOfDate);
  }

  onRetryQuery(): void {
    this.contracts.retryList();
  }

  onResetQuery(): void {
    this.contracts.resetList();
    this.queryForm.reset({
      teacherId: null,
      asOfDate: "",
    });
  }

  // -- Helpers ---------------------------------------------------------

  private toCreateVm(): TeacherContractsFormVm {
    const raw = this.createForm.getRawValue();
    let endDate: string | null = null;
    if (raw.endDate.length > 0) {
      endDate = raw.endDate;
    }
    return {
      teacherId: raw.teacherId,
      schoolIds: [...this.selectedSchoolIds()],
      startDate: raw.startDate,
      endDate,
    };
  }

  private mapOptions<T, TValue extends number | string>(
    state: RemoteState<readonly T[]>,
    project: (item: T) => TeacherContractsFieldVm<TValue>,
  ): readonly TeacherContractsFieldVm<TValue>[] {
    if (state.status === "success") {
      return state.data.map(project);
    }
    return [];
  }
}
