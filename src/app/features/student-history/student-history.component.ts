import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import {
  type FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { StudentHistoryFacade } from "./student-history.facade";
import { studentHistoryFiltersToParams } from "./student-history.mappers";
import type {
  StudentHistoryFiltersVm,
  StudentHistoryVm,
} from "./student-history.vm";

interface StudentHistoryFormShape {
  documentType: FormControl<string>;
  documentNumber: FormControl<string>;
  asOfDate: FormControl<string>;
}

type StudentHistoryFormGroup = FormGroup<StudentHistoryFormShape>;

/**
 * Vista principal del recorrido **Historial académico-docente** (FR-RPT-004,
 * WU11-STU).
 *
 * Responsabilidades de UI:
 *
 * - Renderizar el formulario de identidad (`documentType`, `documentNumber`)
 *   con dos campos de texto obligatorio (rangos 1–20 / 1–32) y un campo
 *   opcional `asOfDate`.
 * - Bloquear el botón "Buscar" hasta que la combinación sea válida
 *   (`canLoadHistory() === true`).
 * - Exponer los cuatro estados remotos excluyentes (`loading`, `error`,
 *   `empty`, `success`) en regiones `aria-live` separadas. El error
 *   expone un botón "Reintentar" que re-envía la última consulta con
 *   los filtros vigentes.
 * - Renderizar la línea de tiempo de la estudiante con `<ol>` semántica
 *   y `<time datetime="...">` por inscripción. La fecha de la inscripción
 *   se marca como `.visually-hidden` para que el lector de pantalla
 *   reconozca el orden cronológico sin saturar la lectura.
 * - Conservar las invariantes WCAG 2.2 AA ya presentes en las vistas
 *   P1: skip-link, landmark `<main tabindex="-1">`, `<fieldset><legend>`,
 *   `aria-required="true"`, `aria-busy`, `role="status"` y `role="alert"`,
 *   `aria-live`, media query 320 px y `prefers-reduced-motion`.
 *
 * La fachada se provee localmente (`providers: [StudentHistoryFacade]`)
 * para que cada componente tenga su propio slot de estado.
 */
@Component({
  selector: "app-student-history",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  providers: [StudentHistoryFacade],
  templateUrl: "./student-history.component.html",
  styleUrl: "./student-history.component.scss",
})
export class StudentHistoryComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly history = inject(StudentHistoryFacade);

  readonly result = this.history.result;

  readonly form: StudentHistoryFormGroup = this.fb.group({
    documentType: this.fb.control("", [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(20),
    ]),
    documentNumber: this.fb.control("", [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(32),
    ]),
    asOfDate: this.fb.control("", [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]),
  });

  readonly isLoading = computed(() => this.result().status === "loading");
  readonly isSuccess = computed(() => this.result().status === "success");
  readonly isEmpty = computed(() => this.result().status === "empty");
  readonly hasError = computed(() => this.result().status === "error");

  readonly successData = computed<StudentHistoryVm | null>(() => {
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
   * Estado del botón "Reintentar" — habilitado en `error` o `empty`.
   * Mantiene paridad con `top-schools.component.canRetry`.
   */
  readonly canRetry = computed(() => this.hasError() || this.isEmpty());

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const vm = this.toFiltersVm();
    if (studentHistoryFiltersToParams(vm) === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.history.loadHistory(vm);
  }

  onRetry(): void {
    this.history.retryHistory();
  }

  onReset(): void {
    this.history.resetHistory();
    this.form.reset({
      documentType: "",
      documentNumber: "",
      asOfDate: "",
    });
  }

  private toFiltersVm(): StudentHistoryFiltersVm {
    const raw = this.form.getRawValue();
    return {
      documentType: raw.documentType,
      documentNumber: raw.documentNumber,
      asOfDate: raw.asOfDate.length === 0 ? null : raw.asOfDate,
    };
  }
}
