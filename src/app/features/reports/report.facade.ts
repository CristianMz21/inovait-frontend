import { Injectable, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import { ApiProblemError } from '../../core/api/api-problem-error';
import {
  errorState,
  idle,
  loading,
  success,
  type RemoteState,
} from '../../core/api/remote-state';
import {
  ReportApiService,
  type GetAgeDistributionParams,
} from './report.api.service';
import {
  ageDistributionFiltersToParams,
  ageDistributionResponseToVm,
} from './report.mappers';
import type {
  AgeDistributionFiltersVm,
  AgeDistributionVm,
} from './report.vm';

/**
 * Fachada reactiva del recorrido **Distribución por edad** dentro del
 * shell de reportes municipales.
 *
 * Coordina la única operación P1 implementada en WU07:
 * `getAgeDistribution`. Las operaciones `getDistinctTeacherCountsBySector`
 * y `getTopSchoolsByEnrollment` se añaden en WU08 y WU09 como slots
 * adicionales del mismo `ReportFacade`.
 *
 * Disciplina:
 *
 * - `RemoteState<AgeDistributionVm>` exclusivo (`idle|loading|success|
 *   empty|error`).
 * - Cancelación del envío previo ante un nuevo `loadAge()`.
 * - Descarte de respuesta tardía por `requestKey`: si la operadora
 *   cambia `academicYearId` mientras hay una consulta en curso, sólo la
 *   última respuesta muta el estado.
 * - Mapeo de `ApiProblem` desde `problemDetailsInterceptor`. Códigos
 *   canónicos respetados: `invalid_request` (400), `resource_not_found`
 *   (404), `as_of_date_invalid` (422), `business_rule_violation` (422).
 *
 * La fachada se provee a nivel de componente (no en el inyector raíz)
 * para que cada instancia de la vista tenga su propio slot.
 */
@Injectable()
export class ReportFacade {
  private readonly api = inject(ReportApiService);

  private readonly age = signal<RemoteState<AgeDistributionVm>>(idle());
  private ageSubscription: Subscription | null = null;
  private ageSequence = 0;

  /** Filtros vigentes del recorrido de edad. */
  private lastAgeFilters: AgeDistributionFiltersVm = {
    academicYearId: null,
    asOfDate: null,
    schoolId: null,
    gradeId: null,
  };

  /** Estado remoto del slot `age` (sólo lectura). */
  readonly ageState = this.age.asReadonly();

  /**
   * Indica si la VM actual es consultable. La UI usa este predicado para
   * activar/desactivar el botón "Consultar" antes de ejecutar la consulta.
   */
  canLoadAge(filters: AgeDistributionFiltersVm): boolean {
    return ageDistributionFiltersToParams(filters) !== null;
  }

  /**
   * Carga la distribución por edad con los filtros indicados. Si ya hay
   * una consulta en curso, la cancela y descarta cualquier respuesta
   * tardía. No-op cuando los filtros son inválidos (falta
   * `academicYearId`).
   */
  loadAge(filters: AgeDistributionFiltersVm): void {
    const params = ageDistributionFiltersToParams(filters);
    if (params === null) {
      return;
    }
    this.lastAgeFilters = filters;
    this.dispatchAge(params);
  }

  /**
   * Reintenta la última consulta con los filtros vigentes. No-op si el
   * estado actual no es `error` o si la VM vigente es inválida.
   */
  retryAge(): void {
    const current = this.age();
    if (current.status !== 'error') {
      return;
    }
    const params = ageDistributionFiltersToParams(this.lastAgeFilters);
    if (params === null) {
      return;
    }
    this.dispatchAge(params);
  }

  /**
   * Cancela la consulta en curso y vuelve el estado a `idle`. La UI debe
   * llamar a este método antes de `form.reset()` para que la cancelación
   * y la limpieza ocurran en orden.
   */
  resetAge(): void {
    this.ageSubscription?.unsubscribe();
    this.ageSubscription = null;
    this.age.set(idle());
    this.lastAgeFilters = {
      academicYearId: null,
      asOfDate: null,
      schoolId: null,
      gradeId: null,
    };
  }

  // -- Despacho interno ---------------------------------------------------

  private dispatchAge(params: GetAgeDistributionParams): void {
    this.ageSubscription?.unsubscribe();
    this.ageSequence += 1;
    const requestKey = `report-age#${this.ageSequence}`;
    this.age.set(loading<AgeDistributionVm>(requestKey));

    this.ageSubscription = this.api.getAgeDistribution(params).subscribe({
      next: (dto) => {
        if (this.isStale(this.age(), requestKey)) {
          return;
        }
        const vm = ageDistributionResponseToVm(dto);
        // El DTO canónico siempre devuelve las tres bandas; incluso con
        // count=0 se considera un resultado exitoso (`success`) — la UI
        // muestra los tramos en 0 sin tratarlo como error ni como vacío.
        this.age.set(success(vm));
      },
      error: (err: unknown) => {
        if (this.isStale(this.age(), requestKey)) {
          return;
        }
        const problem = err instanceof ApiProblemError ? err.problem : null;
        if (!problem) {
          return;
        }
        this.age.set(errorState<AgeDistributionVm>(problem));
      },
    });
  }

  /**
   * Determina si la respuesta pertenece todavía al envío vigente. Sólo
   * durante `loading` la `requestKey` está vigente; cualquier otro
   * estado implica que la respuesta debe descartarse.
   */
  private isStale<T>(state: RemoteState<T>, requestKey: string): boolean {
    return state.status !== 'loading' || state.requestKey !== requestKey;
  }
}