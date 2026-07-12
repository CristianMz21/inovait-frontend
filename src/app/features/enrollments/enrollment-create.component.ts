import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
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
import type { RemoteState } from "../../core/api/remote-state";
import { EnrollmentCreateFacade } from "./enrollment-create.facade";
import { enrollmentFormToRequest } from "./enrollment.mappers";
import type {
  EnrollmentFieldVm,
  EnrollmentFormVm,
} from "./enrollment-create.vm";

const requiredValidator: ValidatorFn = (control: AbstractControl<unknown>) =>
  Validators.required(control);

const notFutureDateValidator: ValidatorFn = (
  control: AbstractControl<unknown>,
) => {
  if (
    typeof control.value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(control.value)
  ) {
    return null;
  }
  const now = new Date();
  const today = [
    String(now.getFullYear()).padStart(4, "0"),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return control.value > today ? { futureDate: true } : null;
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
  imports: [ReactiveFormsModule, CatalogStatusComponent],
  providers: [EnrollmentCreateFacade],
  templateUrl: "./enrollment-create.component.html",
  styleUrl: "./enrollment-create.component.scss",
})
export class EnrollmentCreateComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalog = inject(CatalogFacade);
  private readonly enrollment = inject(EnrollmentCreateFacade);
  private readonly destroyRef = inject(DestroyRef);

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
      Validators.maxLength(20),
    ]),
    documentNumber: this.fb.control("", [
      requiredValidator,
      Validators.maxLength(32),
    ]),
    firstNames: this.fb.control("", [
      requiredValidator,
      Validators.maxLength(120),
    ]),
    lastNames: this.fb.control("", [
      requiredValidator,
      Validators.maxLength(120),
    ]),
    birthDate: this.fb.control("", [
      requiredValidator,
      Validators.pattern(/^\d{4}-\d{2}-\d{2}$/),
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
    return state.status === "success" ? state.data : null;
  });
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const vm = this.toVm();
    if (enrollmentFormToRequest(vm) === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.enrollment.submit(vm);
  }

  onRetry(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
    this.setDisabled(
      this.form.controls.academicYearId,
      this.isAcademicYearDisabled(),
    );
    this.setDisabled(this.form.controls.gradeId, this.isGradeDisabled());
    this.setDisabled(
      this.form.controls.classGroupId,
      this.isClassGroupDisabled(),
    );
  }

  private setDisabled(
    control: FormControl<number | null>,
    disabled: boolean,
  ): void {
    if (disabled && control.enabled) {
      control.disable({ emitEvent: false });
    } else if (!disabled && control.disabled) {
      control.enable({ emitEvent: false });
    }
  }

  // -- Signals derivados de catálogos ------------------------------------

  private schoolOptionsSignal(): ReturnType<
    typeof computed<readonly EnrollmentFieldVm<number>[]>
  > {
    return computed(() =>
      mapOptions(this.catalog.schoolsState(), (school) => ({
        value: school.id,
        label: `${school.name} · ${school.sector === "Public" ? "Público" : "Privado"}`,
      })),
    );
  }

  private academicYearOptionsSignal(): ReturnType<
    typeof computed<readonly EnrollmentFieldVm<number>[]>
  > {
    return computed(() =>
      mapOptions(this.catalog.academicYearsState(), (year) => ({
        value: year.id,
        label: year.isCurrent ? `${year.name} (actual)` : year.name,
      })),
    );
  }

  private gradeOptionsSignal(): ReturnType<
    typeof computed<readonly EnrollmentFieldVm<number>[]>
  > {
    return computed(() =>
      mapOptions(this.catalog.gradesState(), (grade) => ({
        value: grade.id,
        label: grade.name,
      })),
    );
  }

  private classGroupOptionsSignal(): ReturnType<
    typeof computed<readonly EnrollmentFieldVm<number>[]>
  > {
    return computed(() =>
      mapOptions(this.catalog.classGroupsState(), (group) => ({
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
