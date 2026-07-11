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
  type GetTeacherCountsBySectorParams,
} from './report.api.service';
import {
  ageDistributionFiltersToParams,
  ageDistributionResponseToVm,
  teacherCountsBySectorFiltersToParams,
  teacherCountsBySectorResponseToVm,
} from './report.mappers';
import type {
  AgeDistributionFiltersVm,
  AgeDistributionVm,
  TeacherCountsBySectorFiltersVm,
  TeacherCountsBySectorVm,
} from './report.vm';

/**
 * Fachada reactiva de los recorridos de **Reportes municipales** dentro
 * del shell `/reports`.
 *
 * Coordina las operaciones P1 habilitadas hasta el momento:
 *
 * - WU07 — `getAgeDistribution` → slot `age`.
 * - WU08 — `getDistinctTeacherCountsBySector` → slot `sector`.
 *
 * La operación `getTopSchoolsByEnrollment` se añade en WU09 como slot
 * adicional del mismo `ReportFacade`.
 *
 * Disciplina común a ambos slots:
 *
 * - `RemoteState<T>` exclusivo (`idle|loading|success|empty|error`).
 * - Cancelación del envío previo ante un nuevo `load*()`.
 * - Descarte de respuesta tardía por `requestKey`: si la operadora
 *   cambia los filtros mientras hay una consulta en curso, sólo la
 *   última respuesta muta el estado.
 * - Mapeo de `ApiProblem` desde `problemDetailsInterceptor`. Códigos
 *   canónicos respetados: `invalid_request` (400), `resource_not_found`
 *   (404), `as_of_date_invalid` (422), `period_invalid` (422).
 * - Ningún recorrido emite `empty` cuando la respuesta canónica es
 *   estructuralmente no vacía; `age` devuelve siempre tres bandas y
 *   `sector` siempre dos sectores (con conteos posiblemente en `0`).
 *
 * La fachada se provee a nivel de componente (no en el inyector raíz)
 * para que cada instancia de la vista tenga sus propios slots.
 */
@Injectable()
export class ReportFacade {
  private readonly api = inject(ReportApiService);

  private readonly age = signal<RemoteState<AgeDistributionVm>>(idle());
  private ageSubscription: Subscription | null = null;
  private ageSequence = 0;

  private readonly sector = signal<RemoteState<TeacherCountsBySectorVm>>(idle());
  private sectorSubscription: Subscription | null = null;
  private sectorSequence = 0;

  /** Filtros vigentes del recorrido de edad. */
  private lastAgeFilters: AgeDistributionFiltersVm = {
    academicYearId: null,
    asOfDate: null,
    schoolId: null,
    gradeId: null,
  };

  /** Filtros vigentes del recorrido de sector. */
  private lastSectorFilters: TeacherCountsBySectorFiltersVm = {
    periodStart: null,
    periodEnd: null,
  };

  /** Estado remoto del slot `age` (sólo lectura). */
  readonly ageState = this.age.asReadonly();

  /** Estado remoto del slot `sector` (sólo lectura). */
  readonly sectorState = this.sector.asReadonly();

  /**
   * Indica si la VM actual es consultable. La UI usa este predicado para
   * activar/desactivar el botón "Consultar" antes de ejecutar la consulta.
   */
  canLoadAge(filters: AgeDistributionFiltersVm): boolean {
    return ageDistributionFiltersToParams(filters) !== null;
  }

  /**
   * Indica si los filtros del sector son consultables. La UI usa este
   * predicado para activar/desactivar el botón "Consultar sector" antes
   * de invocar el endpoint.
   */
  canLoadSector(filters: TeacherCountsBySectorFiltersVm): boolean {
    return teacherCountsBySectorFiltersToParams(filters) !== null;
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

  /**
   * Carga el conteo de docentes distintos por sector con los filtros
   * indicados. Si ya hay una consulta en curso, la cancela y descarta
   * cualquier respuesta tardía. No-op cuando los filtros son
   * asimétricos (sólo uno de los dos extremos del período definido).
   */
  loadSector(filters: TeacherCountsBySectorFiltersVm): void {
    const params = teacherCountsBySectorFiltersToParams(filters);
    if (params === null) {
      return;
    }
    this.lastSectorFilters = filters;
    this.dispatchSector(params);
  }

  /**
   * Reintenta la última consulta de sector con los filtros vigentes.
   * No-op si el estado actual no es `error` o si los filtros previos
   * son inválidos.
   */
  retrySector(): void {
    const current = this.sector();
    if (current.status !== 'error') {
      return;
    }
    const params = teacherCountsBySectorFiltersToParams(this.lastSectorFilters);
    if (params === null) {
      return;
    }
    this.dispatchSector(params);
  }

  /**
   * Cancela la consulta en curso del slot de sector y vuelve el estado a
   * `idle`. La UI debe llamar a este método antes de `form.reset()` para
   * que la cancelación y la limpieza ocurran en orden.
   */
  resetSector(): void {
    this.sectorSubscription?.unsubscribe();
    this.sectorSubscription = null;
    this.sector.set(idle());
    this.lastSectorFilters = {
      periodStart: null,
      periodEnd: null,
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

  private dispatchSector(params: GetTeacherCountsBySectorParams): void {
    this.sectorSubscription?.unsubscribe();
    this.sectorSequence += 1;
    const requestKey = `report-sector#${this.sectorSequence}`;
    this.sector.set(loading<TeacherCountsBySectorVm>(requestKey));

    this.sectorSubscription = this.api
      .getDistinctTeacherCountsBySector(params)
      .subscribe({
        next: (dto) => {
          if (this.isStale(this.sector(), requestKey)) {
            return;
          }
          // El DTO canónico siempre devuelve los dos sectores con
          // conteos (incluido `0`); no existe estado `empty` para este
          // recorrido — se mapea directo a `success`.
          const vm = teacherCountsBySectorResponseToVm(dto);
          this.sector.set(success(vm));
        },
        error: (err: unknown) => {
          if (this.isStale(this.sector(), requestKey)) {
            return;
          }
          const problem = err instanceof ApiProblemError ? err.problem : null;
          if (!problem) {
            return;
          }
          this.sector.set(errorState<TeacherCountsBySectorVm>(problem));
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