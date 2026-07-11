import { Injectable, inject, signal } from "@angular/core";
import type { Subscription } from "rxjs";
import { ApiProblemError } from "../../core/api/api-problem-error";
import {
  empty as emptyState,
  errorState,
  idle,
  loading,
  success,
  type RemoteState,
} from "../../core/api/remote-state";
import {
  enrollmentListItemToResult,
  studentSearchFiltersToParams,
} from "./student-search.mappers";
import {
  StudentSearchApiService,
  type ListEnrollmentsParams,
} from "./student-search.api.service";
import type {
  StudentSearchFiltersVm,
  StudentSearchResultVm,
} from "./student-search.vm";

/**
 * Fachada del ciclo de vida de la **Consulta de estudiantes** (US2).
 *
 * Responsabilidades:
 * - Mantener `RemoteState<readonly StudentSearchResultVm[]>` exclusivo
 *   del recorrido (`idle` / `loading` / `success` / `empty` / `error`).
 * - Cancelar el `GET` en curso cuando la operadora cambia los filtros o
 *   dispara otra búsqueda. Esto descarta la respuesta tardía si llegara
 *   después de la cancelación.
 * - Descartar respuestas obsoletas comparando la `requestKey` actual con
 *   la emitida al iniciar la solicitud. Si la operadora cambia los filtros
 *   rápidamente, sólo la última respuesta muta el estado.
 * - Exponer `search`, `retry` y `reset` como puntos de entrada
 *   deterministas para la UI. `search` es no-op cuando los filtros
 *   académicos no están completos.
 *
 * La fachada se provee a nivel de componente (`providedIn` por defecto),
 * no en el inyector raíz: cada `StudentSearchComponent` debe tener su
 * propio estado para que dos pestañas no compartan el resultado.
 */
@Injectable()
export class StudentSearchFacade {
  private readonly api = inject(StudentSearchApiService);
  private readonly state =
    signal<RemoteState<readonly StudentSearchResultVm[]>>(idle());
  private subscription: Subscription | null = null;
  private sequence = 0;

  /** Estado remoto expuesto a la vista. Sólo lectura. */
  readonly result = this.state.asReadonly();

  /** Filtros vigentes que la UI debe reflejar en el formulario. */
  readonly filters = signal<StudentSearchFiltersVm>({
    schoolId: null,
    gradeId: null,
    academicYearId: null,
    asOfDate: null,
  });

  /**
   * Indica si la VM actual es consultable. La UI usa este predicado para
   * activar/desactivar el botón "Buscar" antes de ejecutar la consulta.
   */
  canSearch(filters: StudentSearchFiltersVm): boolean {
    return studentSearchFiltersToParams(filters) !== null;
  }

  /**
   * Ejecuta una consulta con los filtros indicados. Si ya hay una búsqueda
   * en curso, la cancela y descarta cualquier respuesta tardía. No-op
   * cuando la VM es inválida (filtros académicos incompletos).
   */
  search(filters: StudentSearchFiltersVm): void {
    const params = studentSearchFiltersToParams(filters);
    if (params === null) {
      return;
    }
    this.filters.set(filters);
    this.dispatch(params);
  }

  /**
   * Reintenta la última consulta a partir de los filtros vigentes. No-op
   * si no hay un error previo o si la VM actual es inválida.
   */
  retry(): void {
    const current = this.state();
    if (current.status !== "error") {
      return;
    }
    const params = studentSearchFiltersToParams(this.filters());
    if (params === null) {
      return;
    }
    this.dispatch(params);
  }

  /**
   * Limpia el estado remoto y cancela cualquier búsqueda en curso. La UI
   * debe llamar a este método antes de `form.reset()` para que la
   * cancelación y la limpieza ocurran en orden.
   */
  reset(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.state.set(idle());
    this.filters.set({
      schoolId: null,
      gradeId: null,
      academicYearId: null,
      asOfDate: null,
    });
  }

  private dispatch(params: ListEnrollmentsParams): void {
    this.subscription?.unsubscribe();
    this.sequence += 1;
    const requestKey = `student-search#${this.sequence}`;
    this.state.set(loading<readonly StudentSearchResultVm[]>(requestKey));

    this.subscription = this.api.list(params).subscribe({
      next: (items) => {
        if (this.isStale(requestKey)) {
          return;
        }
        if (items.length === 0) {
          this.state.set(emptyState("noResults"));
          return;
        }
        this.state.set(success(items.map(enrollmentListItemToResult)));
      },
      error: (err: unknown) => {
        if (this.isStale(requestKey)) {
          return;
        }
        const problem = err instanceof ApiProblemError ? err.problem : null;
        if (!problem) {
          return;
        }
        this.state.set(errorState<readonly StudentSearchResultVm[]>(problem));
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
