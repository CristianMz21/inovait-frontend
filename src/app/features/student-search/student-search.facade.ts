/* Copyright (c) 2026. All rights reserved. */
import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  EMPTY,
  Subject,
  catchError,
  map,
  of,
  switchMap,
  type Observable,
} from "rxjs";
import { toSafeApiProblem } from "../../core/api/to-safe-api-problem";
import {
  empty as emptyState,
  errorState,
  idle,
  loading,
  success,
  type RemoteState,
} from "../../core/api/remote-state";
import type { EnrollmentListItem } from "../../core/api/dtos/enrollment-list-item.dto";
import {
  enrollmentListItemToResult,
  studentSearchFiltersToParams,
} from "./student-search.mappers";
import {
  STUDENT_SEARCH_NO_GROUPS_REASON,
  STUDENT_SEARCH_NO_RESULTS_REASON,
  STUDENT_SEARCH_REMOTE_STATUS,
} from "./student-search.constants";
import { CatalogApiService } from "../../core/catalogs/catalog-api.service";
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
 *   dispara otra búsqueda. Un único `switchMap` gobierna la consulta de
 *   grupos y la consulta condicional de inscripciones, por lo que reemplazar
 *   la búsqueda cancela la cadena completa y descarta respuestas tardías.
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
  private readonly catalogApi = inject(CatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly state =
    signal<RemoteState<readonly StudentSearchResultVm[]>>(idle());
  private readonly requests = new Subject<ListEnrollmentsParams | null>();
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

  constructor() {
    this.requests
      .pipe(
        switchMap(params => {
          if (params === null) {
            return EMPTY;
          }
          return this.execute(params);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(nextState => this.state.set(nextState));
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
    if (current.status !== STUDENT_SEARCH_REMOTE_STATUS.error) {
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
    this.requests.next(null);
    this.state.set(idle());
    this.filters.set({
      schoolId: null,
      gradeId: null,
      academicYearId: null,
      asOfDate: null,
    });
  }

  private dispatch(params: ListEnrollmentsParams): void {
    this.requests.next(params);
  }

  private execute(
    params: ListEnrollmentsParams,
  ): Observable<RemoteState<readonly StudentSearchResultVm[]>> {
    this.sequence += 1;
    const requestKey = `student-search#${this.sequence}`;
    this.state.set(loading<readonly StudentSearchResultVm[]>(requestKey));

    return this.catalogApi
      .listClassGroups({
        schoolId: params.schoolId,
        gradeId: params.gradeId,
        academicYearId: params.academicYearId,
      })
      .pipe(
        switchMap(groups => {
          if (groups.length === 0) {
            return of(
              emptyState<readonly StudentSearchResultVm[]>(
                STUDENT_SEARCH_NO_GROUPS_REASON,
              ),
            );
          }
          return this.api
            .list(params)
            .pipe(map(items => this.toResultState(items)));
        }),
        catchError((error: unknown) =>
          of(
            errorState<readonly StudentSearchResultVm[]>(
              toSafeApiProblem(error),
            ),
          ),
        ),
      );
  }

  private toResultState(
    items: readonly EnrollmentListItem[],
  ): RemoteState<readonly StudentSearchResultVm[]> {
    if (items.length === 0) {
      return emptyState(STUDENT_SEARCH_NO_RESULTS_REASON);
    }
    return success(items.map(enrollmentListItemToResult));
  }
}
