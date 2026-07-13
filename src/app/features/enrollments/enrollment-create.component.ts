/* Copyright (c) 2026. All rights reserved. */
import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  type OnInit,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { distinctUntilChanged } from "rxjs";
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
  calendarDateToTimestamp,
} from "../../core/dates/calendar-date";
import { AppIconComponent } from "../../layout/educore-shell/app-icon.component";
import type { RemoteState } from "../../core/api/remote-state";
import { EnrollmentCreateFacade } from "./enrollment-create.facade";
import { enrollmentFormToRequest } from "./enrollment.mappers";
import type {
  EnrollmentFieldVm,
  EnrollmentFormVm,
} from "./enrollment-create.vm";

const DOCUMENT_TYPE_MAX_LENGTH = 20;
const DOCUMENT_NUMBER_MAX_LENGTH = 32;
const PERSON_NAME_MAX_LENGTH = 120;

const requiredValidator: ValidatorFn = (control: AbstractControl<unknown>) =>
  Validators.required(control);

function localTodayTimestamp(): number {
  const now = new Date();
  const today = new Date(0);
  today.setUTCHours(0, 0, 0, 0);
  today.setUTCFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  return today.getTime();
}

const notFutureDateValidator: ValidatorFn = (
  control: AbstractControl<unknown>,
) => {
  if (typeof control.value !== "string") {
    return null;
  }

  const birthDateTimestamp = calendarDateToTimestamp(control.value);
  if (birthDateTimestamp === null) {
    return { invalidCalendarDate: true };
  }
  if (birthDateTimestamp > localTodayTimestamp()) {
    return { futureDate: true };
  }
  return null;
};

interface EnrollmentFormShape {
  documentType: FormControl<string>;
  documentNumber: FormControl<string>;
  firstNames: FormControl<string>;
  lastNames: FormControl<string>;
  birthDate: FormControl<string>;
  schoolId: FormControl<number | null>;
  academicYearId: FormControl<number | null>;
  gradeId: FormControl<number | null>;
  classGroupId: FormControl<number | null>;
}

type EnrollmentFormGroup = FormGroup<EnrollmentFormShape>;
type EnrollmentControlName = keyof EnrollmentFormShape;

const ENROLLMENT_CONTROL_ORDER: readonly EnrollmentControlName[] = [
  "documentType",
  "documentNumber",
  "firstNames",
  "lastNames",
  "birthDate",
  "schoolId",
  "academicYearId",
  "gradeId",
  "classGroupId",
];

const SERVER_ERROR_KEY = "server";

const ENROLLMENT_FIELD_ALIASES: Readonly<
  Record<string, EnrollmentControlName>
> = {
  documenttype: "documentType",
  studentdocumenttype: "documentType",
  documentnumber: "documentNumber",
  studentdocumentnumber: "documentNumber",
  firstnames: "firstNames",
  studentfirstnames: "firstNames",
  lastnames: "lastNames",
  studentlastnames: "lastNames",
  birthdate: "birthDate",
  studentbirthdate: "birthDate",
  schoolid: "schoolId",
  academicyearid: "academicYearId",
  gradeid: "gradeId",
  classgroupid: "classGroupId",
};

function enrollmentControlName(field: string): EnrollmentControlName | null {
  const normalized = field
    .trim()
    .toLocaleLowerCase("en-US")
    .replaceAll(/[^a-z0-9]/g, "");
  return ENROLLMENT_FIELD_ALIASES[normalized] ?? null;
}

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every((message: unknown) => typeof message === "string")
  );
}

function withoutServerError(
  errors: Readonly<Record<string, unknown>>,
): Record<string, unknown> | null {
  const remainingErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => key !== SERVER_ERROR_KEY),
  );
  if (Object.keys(remainingErrors).length === 0) {
    return null;
  }
  return remainingErrors;
}

/**
 * Vista principal del recorrido de creación de matrícula (US1).
 *
 * Responsabilidades de UI:
 * - Renderizar los selects académicos dependientes en orden
 *   `School → AcademicYear → Grade → ClassGroup` deshabilitando los
 *   niveles inferiores hasta que el padre esté seleccionado.
 * - Limpiar selecciones y resultados descendientes cuando cambia un
 *   nivel superior. La cascada se delega al `CatalogFacade` para
 *   `classGroups`, que ya implementa cancelación + descarte de
 *   respuestas obsoletas.
 * - Enviar el formulario a través de `EnrollmentCreateFacade` con
 *   submit, retry y reset. Los estados remotos se muestran con regiones
 *   `aria-live` separadas para carga, éxito y error.
 * - Mantener el foco accesible: tras un error de submit el foco se
 *   devuelve al primer control inválido.
 *
 * La forma del formulario es controlada por Reactive Forms (no Signal
 * Forms) para mantener paridad con el plan técnico acordado.
 */
@Component({
  selector: "app-enrollment-create",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CatalogStatusComponent, AppIconComponent],
  providers: [EnrollmentCreateFacade],
  templateUrl: "./enrollment-create.component.html",
  styleUrl: "./enrollment-create.component.scss",
})
export class EnrollmentCreateComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogFacade);
  private readonly enrollment = inject(EnrollmentCreateFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly injector = inject(Injector);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly result = this.enrollment.result;
  readonly schoolsState = this.catalog.schoolsState;
  readonly academicYearsState = this.catalog.academicYearsState;
  readonly gradesState = this.catalog.gradesState;
  readonly classGroupsState = this.catalog.classGroupsState;

  readonly documentTypes: readonly EnrollmentFieldVm<string>[] = [
    { value: "DNI", label: "DNI" },
    { value: "PAS", label: "Pasaporte" },
    { value: "CE", label: "Cédula" },
  ];

  readonly form: EnrollmentFormGroup = this.fb.group({
    documentType: this.fb.control("", [
      requiredValidator,
      Validators.maxLength(DOCUMENT_TYPE_MAX_LENGTH),
    ]),
    documentNumber: this.fb.control("", [
      requiredValidator,
      Validators.maxLength(DOCUMENT_NUMBER_MAX_LENGTH),
    ]),
    firstNames: this.fb.control("", [
      requiredValidator,
      Validators.maxLength(PERSON_NAME_MAX_LENGTH),
    ]),
    lastNames: this.fb.control("", [
      requiredValidator,
      Validators.maxLength(PERSON_NAME_MAX_LENGTH),
    ]),
    birthDate: this.fb.control("", [
      requiredValidator,
      Validators.pattern(CALENDAR_DATE_PATTERN),
      notFutureDateValidator,
    ]),
    schoolId: this.fb.control<number | null>(null, [requiredValidator]),
    academicYearId: this.fb.control<number | null>(
      { value: null, disabled: true },
      [requiredValidator],
    ),
    gradeId: this.fb.control<number | null>({ value: null, disabled: true }, [
      requiredValidator,
    ]),
    classGroupId: this.fb.control<number | null>(
      { value: null, disabled: true },
      [requiredValidator],
    ),
  });

  readonly schoolOptions = this.schoolOptionsSignal();
  readonly academicYearOptions = this.academicYearOptionsSignal();
  readonly gradeOptions = this.gradeOptionsSignal();
  readonly classGroupOptions = this.classGroupOptionsSignal();

  readonly isSubmitting = computed(() => this.result().status === "loading");
  readonly isSuccess = computed(() => this.result().status === "success");
  readonly successData = computed(() => {
    const state = this.result();
    if (state.status === "success") {
      return state.data;
    }
    return null;
  });
  readonly hasError = computed(() => this.result().status === "error");
  readonly errorProblem = computed(() => {
    const state = this.result();
    if (state.status === "error") {
      return state.problem;
    }
    return null;
  });
  readonly errorFields = computed(() => {
    const problem = this.errorProblem();
    if (!problem?.errors) {
      return [];
    }
    return Object.entries(problem.errors)
      .filter(([field]) => enrollmentControlName(field) === null)
      .map(([field, messages]) => ({
        field,
        messages,
      }));
  });

  constructor() {
    effect(() => {
      const state = this.result();
      if (state.status === "success") {
        this.resetFormControls();
        this.focusAfterRender("documentType");
        return;
      }
      if (state.status === "error") {
        const firstInvalidControl = this.applyServerErrors(
          state.problem.errors,
        );
        if (firstInvalidControl !== null) {
          this.focusAfterRender(firstInvalidControl);
        }
      }
    });
  }

  ngOnInit(): void {
    // classGroups belongs to this dependent route flow; unlike global cached
    // catalogs, its pending request must not survive route destruction.
    this.destroyRef.onDestroy(() => this.catalog.cancel("classGroups"));
    // Cargar catálogos globales al entrar a la ruta. La fachada de
    // catálogos se encarga de cancelar cualquier solicitud previa.
    this.catalog.loadSchools();
    this.catalog.loadAcademicYears();
    this.catalog.loadGrades();

    // Cascada de dependencias: cada nivel superior tiene su propio
    // handler que invalida exactamente los descendientes del contrato
    // (School → AcademicYear → Grade → ClassGroup) y recarga
    // `classGroups` cuando hay contexto suficiente.
    this.form.controls.schoolId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onSchoolChange());
    this.form.controls.academicYearId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onAcademicYearChange());
    this.form.controls.gradeId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onGradeChange());
    this.syncCascadeControls();
  }

  // -- Acciones de UI -----------------------------------------------------

  onSubmit(): void {
    this.clearServerErrors();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidControl();
      return;
    }
    const vm = this.toVm();
    if (enrollmentFormToRequest(vm) === null) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidControl();
      return;
    }
    this.enrollment.submit(vm);
  }

  onRetry(): void {
    this.clearServerErrors();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidControl();
      return;
    }
    this.enrollment.retry(this.toVm());
  }

  retrySchools(): void {
    this.catalog.loadSchools();
  }

  retryAcademicYears(): void {
    this.catalog.loadAcademicYears();
  }

  retryGrades(): void {
    this.catalog.loadGrades();
  }

  retryClassGroups(): void {
    const { schoolId, academicYearId, gradeId } = this.form.getRawValue();
    if (schoolId !== null && academicYearId !== null && gradeId !== null) {
      this.catalog.loadClassGroups({ schoolId, academicYearId, gradeId });
    }
  }

  onReset(): void {
    this.enrollment.reset();
    this.resetFormControls();
  }

  fieldErrorMessages(controlName: EnrollmentControlName): readonly string[] {
    const control = this.form.controls[controlName];
    if (!control.invalid || (!control.touched && !control.dirty)) {
      return [];
    }

    const messages = [...this.serverErrorMessages(controlName)];
    if (control.hasError("required")) {
      messages.push("El campo es obligatorio.");
    }
    if (control.hasError("maxlength")) {
      messages.push("El valor supera la longitud máxima permitida.");
    }
    if (
      control.hasError("pattern") ||
      control.hasError("invalidCalendarDate")
    ) {
      messages.push("Ingrese una fecha calendario válida.");
    }
    if (control.hasError("futureDate")) {
      messages.push("La fecha no puede ser posterior a la fecha actual.");
    }
    return [...new Set(messages)];
  }

  isFieldInvalid(controlName: EnrollmentControlName): boolean {
    return this.fieldErrorMessages(controlName).length > 0;
  }

  private resetFormControls(): void {
    this.clearServerErrors();
    this.form.reset({
      documentType: "",
      documentNumber: "",
      firstNames: "",
      lastNames: "",
      birthDate: "",
      schoolId: null,
      academicYearId: null,
      gradeId: null,
      classGroupId: null,
    });
    this.syncCascadeControls();
  }

  private applyServerErrors(
    errors: Readonly<Record<string, readonly string[]>> | undefined,
  ): EnrollmentControlName | null {
    this.clearServerErrors();
    if (!errors) {
      return null;
    }

    const mappedErrors = new Map<EnrollmentControlName, string[]>();
    for (const [field, messages] of Object.entries(errors)) {
      const controlName = enrollmentControlName(field);
      if (controlName !== null && messages.length > 0) {
        const currentMessages = mappedErrors.get(controlName) ?? [];
        currentMessages.push(...messages);
        mappedErrors.set(controlName, currentMessages);
      }
    }

    let firstInvalidControl: EnrollmentControlName | null = null;
    for (const controlName of ENROLLMENT_CONTROL_ORDER) {
      const messages = mappedErrors.get(controlName);
      if (messages) {
        const control = this.form.controls[controlName];
        control.setErrors({
          ...control.errors,
          [SERVER_ERROR_KEY]: [...new Set(messages)],
        });
        control.markAsTouched();
        firstInvalidControl ??= controlName;
      }
    }
    this.changeDetectorRef.markForCheck();
    return firstInvalidControl;
  }

  private serverErrorMessages(
    controlName: EnrollmentControlName,
  ): readonly string[] {
    const serverErrors: unknown =
      this.form.controls[controlName].errors?.[SERVER_ERROR_KEY];
    if (isStringArray(serverErrors)) {
      return serverErrors;
    }
    return [];
  }

  private clearServerErrors(): void {
    for (const controlName of ENROLLMENT_CONTROL_ORDER) {
      const control = this.form.controls[controlName];
      const errors = control.errors;
      if (errors && SERVER_ERROR_KEY in errors) {
        control.setErrors(withoutServerError(errors));
      }
    }
  }

  private focusFirstInvalidControl(): void {
    const firstInvalidControl = ENROLLMENT_CONTROL_ORDER.find(
      controlName =>
        this.form.controls[controlName].enabled &&
        this.form.controls[controlName].invalid,
    );
    if (firstInvalidControl !== undefined) {
      this.focusAfterRender(firstInvalidControl);
    }
  }

  private focusAfterRender(controlName: EnrollmentControlName): void {
    this.changeDetectorRef.markForCheck();
    afterNextRender(
      {
        write: () => {
          this.hostElement.nativeElement
            .querySelector<HTMLElement>(`[formControlName="${controlName}"]`)
            ?.focus();
        },
      },
      { injector: this.injector },
    );
  }

  // -- Helpers ------------------------------------------------------------

  /** True si los selects inferiores deben estar deshabilitados por jerarquía. */
  isAcademicYearDisabled(): boolean {
    return this.form.controls.schoolId.value === null;
  }

  isGradeDisabled(): boolean {
    return (
      this.form.controls.schoolId.value === null ||
      this.form.controls.academicYearId.value === null
    );
  }

  isClassGroupDisabled(): boolean {
    return (
      this.form.controls.schoolId.value === null ||
      this.form.controls.academicYearId.value === null ||
      this.form.controls.gradeId.value === null
    );
  }

  /** Etiqueta legible del estado remoto del catálogo de grupos. */
  classGroupStatusMessage(): string | null {
    const state = this.catalog.classGroupsState();
    if (this.isClassGroupDisabled()) {
      return null;
    }
    if (state.status === "loading") {
      return "Cargando grupos…";
    }
    if (state.status === "empty") {
      return "No hay grupos para la combinación seleccionada.";
    }
    if (state.status === "error") {
      return "No se pudieron cargar los grupos. Reintente cambiando la selección.";
    }
    return null;
  }

  studentReusedLabel(studentReused: boolean): string {
    if (studentReused) {
      return "Sí";
    }
    return "No";
  }

  private toVm(): EnrollmentFormVm {
    return this.form.getRawValue();
  }

  /**
   * Limpia `AcademicYear`, `Grade` y `ClassGroup` cuando cambia
   * `School`. Cualquier selección vigente debajo del nivel cambiado
   * deja de tener sentido porque la cadena académica se reinicia.
   */
  private onSchoolChange(): void {
    this.form.controls.academicYearId.setValue(null, { emitEvent: false });
    this.form.controls.gradeId.setValue(null, { emitEvent: false });
    this.form.controls.classGroupId.setValue(null, { emitEvent: false });
    this.catalog.cancel("classGroups");
    this.syncCascadeControls();
  }

  /**
   * Limpia `Grade` y `ClassGroup` cuando cambia `AcademicYear`. Mantiene
   * `School` porque los catálogos de año son globales; el siguiente
   * paso del usuario es re-establecer grado (o no, si sólo quiere
   * cambiar año).
   */
  private onAcademicYearChange(): void {
    this.form.controls.gradeId.setValue(null, { emitEvent: false });
    this.form.controls.classGroupId.setValue(null, { emitEvent: false });
    this.catalog.cancel("classGroups");
    this.syncCascadeControls();
  }

  /**
   * Limpia `ClassGroup` cuando cambia `Grade` y, si la cadena padre
   * está completa, recarga los grupos. La fachada de catálogos cancela
   * cualquier solicitud pendiente y descarta respuestas obsoletas.
   */
  private onGradeChange(): void {
    this.form.controls.classGroupId.setValue(null, { emitEvent: false });
    this.catalog.cancel("classGroups");
    this.syncCascadeControls();
    const { schoolId, academicYearId, gradeId } = this.form.controls;
    if (
      schoolId.value !== null &&
      academicYearId.value !== null &&
      gradeId.value !== null
    ) {
      this.catalog.loadClassGroups({
        schoolId: schoolId.value,
        gradeId: gradeId.value,
        academicYearId: academicYearId.value,
      });
    }
  }

  private syncCascadeControls(): void {
    if (this.isAcademicYearDisabled()) {
      this.disableControl(this.form.controls.academicYearId);
    } else {
      this.enableControl(this.form.controls.academicYearId);
    }

    if (this.isGradeDisabled()) {
      this.disableControl(this.form.controls.gradeId);
    } else {
      this.enableControl(this.form.controls.gradeId);
    }

    if (this.isClassGroupDisabled()) {
      this.disableControl(this.form.controls.classGroupId);
    } else {
      this.enableControl(this.form.controls.classGroupId);
    }
  }

  private disableControl(control: FormControl<number | null>): void {
    if (control.enabled) {
      control.disable({ emitEvent: false });
    }
  }

  private enableControl(control: FormControl<number | null>): void {
    if (control.disabled) {
      control.enable({ emitEvent: false });
    }
  }

  // -- Signals derivados de catálogos ------------------------------------

  private schoolOptionsSignal(): ReturnType<
    typeof computed<readonly EnrollmentFieldVm<number>[]>
  > {
    return computed(() =>
      mapOptions(this.catalog.schoolsState(), school => {
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
  }

  private academicYearOptionsSignal(): ReturnType<
    typeof computed<readonly EnrollmentFieldVm<number>[]>
  > {
    return computed(() =>
      mapOptions(this.catalog.academicYearsState(), year => {
        let label = year.name;
        if (year.isCurrent) {
          label = `${year.name} (actual)`;
        }
        return {
          value: year.id,
          label,
        };
      }),
    );
  }

  private gradeOptionsSignal(): ReturnType<
    typeof computed<readonly EnrollmentFieldVm<number>[]>
  > {
    return computed(() =>
      mapOptions(this.catalog.gradesState(), grade => ({
        value: grade.id,
        label: grade.name,
      })),
    );
  }

  private classGroupOptionsSignal(): ReturnType<
    typeof computed<readonly EnrollmentFieldVm<number>[]>
  > {
    return computed(() =>
      mapOptions(this.catalog.classGroupsState(), group => ({
        value: group.id,
        label: `Grupo ${group.code}`,
      })),
    );
  }
}

function mapOptions<T, TValue extends number | string>(
  state: RemoteState<readonly T[]>,
  project: (item: T) => EnrollmentFieldVm<TValue>,
): readonly EnrollmentFieldVm<TValue>[] {
  if (state.status === "success") {
    return state.data.map(project);
  }
  return [];
}
