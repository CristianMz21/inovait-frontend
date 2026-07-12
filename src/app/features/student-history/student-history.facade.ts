import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { Subscription } from "rxjs";
import { toSafeApiProblem } from "../../core/api/to-safe-api-problem";
import {
  empty as emptyState,
  errorState,
  idle,
  loading,
  success,
  type RemoteState,
} from "../../core/api/remote-state";
import {
  StudentHistoryApiService,
  type GetStudentHistoryParams,
} from "./student-history.api.service";
import {
  studentHistoryFiltersToParams,
  studentHistoryResponseToVm,
} from "./student-history.mappers";
import type {
  StudentHistoryFiltersVm,
  StudentHistoryVm,
} from "./student-history.vm";

/**
 * Fachada del ciclo de vida de **Historial académico-docente** (FR-RPT-004,
 * WU11-STU).
 *
 * Responsabilidades:
 *
 * - Mantener `RemoteState<StudentHistoryVm>` exclusivo (`idle` / `loading` /
 *   `success` / `empty` / `error`) en un único slot.
 * - Cancelar el `GET` en curso cuando la operadora cambia los filtros o
 *   dispara otra búsqueda. Esto descarta cualquier respuesta tardía si
 *   llegara después de la cancelación.
 * - Descartar respuestas obsoletas comparando la `requestKey` actual con
 *   la emitida al iniciar la solicitud. Sólo la última búsqueda muta
 *   el estado.
 * - Exponer `loadHistory`, `retryHistory` y `resetHistory` como puntos
 *   de entrada deterministas para la UI. `loadHistory` es no-op cuando
 *   los filtros no satisfacen las longitudes canónicas.
 * - Mapear `200 enrollments: []` al estado `empty('noResults')` (NO a
 *   `error`) para mantener la paridad con `top-schools-report`.
 * - Mapear `400 invalid_request` y `404 student_not_found` (vía
 *   `problemDetailsInterceptor`) a `error(ApiProblem)` con `code`
 *   preservado.
 *
 * La fachada se provee a nivel de componente (`providedIn` por defecto),
 * no en el inyector raíz: cada `StudentHistoryComponent` debe tener su
 * propio estado para que dos pestañas no compartan el resultado.
 */
@Injectable()
export class StudentHistoryFacade {
  private readonly api = inject(StudentHistoryApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly state = signal<RemoteState<StudentHistoryVm>>(idle());
  private subscription: Subscription | null = null;
  private sequence = 0;

  /** Estado remoto expuesto a la vista. Sólo lectura. */
  readonly result = this.state.asReadonly();

  /** Filtros vigentes que la UI debe reflejar en el formulario. */
  readonly filters = signal<StudentHistoryFiltersVm>({
    documentType: "",
    documentNumber: "",
    asOfDate: null,
  });

  /**
   * Indica si la VM actual es consultable. La UI usa este predicado para
   * activar/desactivar el botón "Buscar" antes de ejecutar la consulta.
   */
  canLoadHistory(filters: StudentHistoryFiltersVm): boolean {
    return studentHistoryFiltersToParams(filters) !== null;
  }

  /**
   * Ejecuta una consulta con los filtros indicados. Si ya hay una
   * búsqueda en curso, la cancela y descarta cualquier respuesta tardía.
   * No-op cuando la VM es inválida (filtros sin completar).
   */
  loadHistory(filters: StudentHistoryFiltersVm): void {
    const params = studentHistoryFiltersToParams(filters);
    if (params === null) {
      return;
    }
    this.filters.set(filters);
    this.dispatchHistory(params);
  }

  /**
   * Reintenta la última consulta con los filtros vigentes. No-op si el
   * estado actual no es `error` o `empty` o si los filtros previos son
   * inválidos.
   */
  retryHistory(): void {
    const current = this.state();
    if (current.status !== "error" && current.status !== "empty") {
      return;
    }
    const params = studentHistoryFiltersToParams(this.filters());
    if (params === null) {
      return;
    }
    this.dispatchHistory(params);
  }

  /**
   * Limpia el estado remoto y cancela cualquier búsqueda en curso. La UI
   * debe llamar a este método antes de `form.reset()` para que la
   * cancelación y la limpieza ocurran en orden.
   */
  resetHistory(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.state.set(idle());
    this.filters.set({
      documentType: "",
      documentNumber: "",
      asOfDate: null,
    });
  }

  private dispatchHistory(params: GetStudentHistoryParams): void {
    this.subscription?.unsubscribe();
    this.sequence += 1;
    const requestKey = `student-history#${this.sequence}`;
    this.state.set(loading<StudentHistoryVm>(requestKey));

    this.subscription = this.api
      .getStudentHistory(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dto) => {
          if (this.isStale(requestKey)) {
            return;
          }
          if (dto.enrollments.length === 0) {
            // El contrato declara `200 []` como respuesta válida para
            // "identidad sin inscripciones". Se mapea a `empty('noResults')`,
            // NO a `error`, para mantener la paridad con `top-schools`.
            this.state.set(emptyState<StudentHistoryVm>("noResults"));
            return;
          }
          const vm = studentHistoryResponseToVm(dto);
          this.state.set(success(vm));
        },
        error: (err: unknown) => {
          if (this.isStale(requestKey)) {
            return;
          }
          this.state.set(errorState<StudentHistoryVm>(toSafeApiProblem(err)));
        },
        complete: () => {
          // El backend cierra el observable tras la respuesta única; no
          // se requiere lógica adicional aquí.
        },
      });
  }

  /**
   * Determina si la respuesta pertenece todavía a la búsqueda vigente.
   * Sólo durante `loading` la `requestKey` está vigente; cualquier otro
   * estado implica que la respuesta debe descartarse.
   */
  private isStale(requestKey: string): boolean {
    const current = this.state();
    return current.status !== "loading" || current.requestKey !== requestKey;
  }
}
