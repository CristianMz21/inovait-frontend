import { Injectable, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import { ApiProblemError } from '../../core/api/api-problem-error';
import {
  empty as emptyState,
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
  type GetTopSchoolsByEnrollmentParams,
} from './report.api.service';
import {
  ageDistributionFiltersToParams,
  ageDistributionResponseToVm,
  teacherCountsBySectorFiltersToParams,
  teacherCountsBySectorResponseToVm,
  topSchoolsFiltersToParams,
  topSchoolsResponseToVm,
} from './report.mappers';
import type {
  AgeDistributionFiltersVm,
  AgeDistributionVm,
  TeacherCountsBySectorFiltersVm,
  TeacherCountsBySectorVm,
  TopSchoolsFiltersVm,
  TopSchoolsVm,
} from './report.vm';

/**
 * Fachada reactiva de los recorridos de **Reportes municipales** dentro
 * del shell `/reports`.
 *
 * Coordina las operaciones P1 habilitadas hasta el momento:
 *
 * - WU07 — `getAgeDistribution` → slot `age`.
 * - WU08 — `getDistinctTeacherCountsBySector` → slot `sector`.
 * - WU09 — `getTopSchoolsByEnrollment` → slot `top`.
 *
 * Disciplina común a los tres slots:
 *
 * - `RemoteState<T>` exclusivo (`idle|loading|success|empty|error`).
 * - Cancelación del envío previo ante un nuevo `load*()`.
 * - Descarte de respuesta tardía por `requestKey`: si la operadora
 *   cambia los filtros mientras hay una consulta en curso, sólo la
 *   última respuesta muta el estado.
 * - Mapeo de `ApiProblem` desde `problemDetailsInterceptor`. Códigos
 *   canónicos respetados: `invalid_request` (400), `resource_not_found`
 *   (404), `as_of_date_invalid` (422), `period_invalid` (422).
 * - Los slots `age` y `sector` nunca emiten `empty` (sus DTOs son
 *   estructuralmente no vacíos); el slot `top` sí emite `empty` cuando
 *   el backend responde `200 []` (año académico sin inscripciones).
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

  private readonly top = signal<RemoteState<TopSchoolsVm>>(idle());
  private topSubscription: Subscription | null = null;
  private topSequence = 0;

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

  /** Filtros vigentes del recorrido de escuelas líderes. */
  private lastTopFilters: TopSchoolsFiltersVm = {
    academicYearId: null,
  };

  /** Estado remoto del slot `age` (sólo lectura). */
  readonly ageState = this.age.asReadonly();

  /** Estado remoto del slot `sector` (sólo lectura). */
  readonly sectorState = this.sector.asReadonly();

  /** Estado remoto del slot `top` (sólo lectura). */
  readonly topState = this.top.asReadonly();

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
   * Indica si los filtros de escuelas líderes son consultables. La UI
   * usa este predicado para activar/desactivar el botón "Consultar
   * escuelas líderes" antes de invocar el endpoint.
   */
  canLoadTop(filters: TopSchoolsFiltersVm): boolean {
    return topSchoolsFiltersToParams(filters) !== null;
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

  /**
   * Carga las escuelas líderes por matrícula del año académico
   * indicado. Si ya hay una consulta en curso, la cancela y descarta
   * cualquier respuesta tardía. No-op cuando los filtros son inválidos
   * (falta `academicYearId`).
   *
   * A diferencia de `loadAge`/`loadSector`, este recorrido emite el
   * estado `empty` cuando el backend responde `200 []` (año sin
   * inscripciones). La UI muestra un mensaje "Sin escuelas líderes"
   * con un botón `Reintentar` para que la operadora pueda volver a
   * intentar la consulta sin cambiar los filtros.
   */
  loadTop(filters: TopSchoolsFiltersVm): void {
    const params = topSchoolsFiltersToParams(filters);
    if (params === null) {
      return;
    }
    this.lastTopFilters = filters;
    this.dispatchTop(params);
  }

  /**
   * Reintenta la última consulta de escuelas líderes con los filtros
   * vigentes. No-op si el estado actual no es `error` o `empty` o si
   * los filtros previos son inválidos.
   */
  retryTop(): void {
    const current = this.top();
    if (current.status !== 'error' && current.status !== 'empty') {
      return;
    }
    const params = topSchoolsFiltersToParams(this.lastTopFilters);
    if (params === null) {
      return;
    }
    this.dispatchTop(params);
  }

  /**
   * Cancela la consulta en curso del slot de escuelas líderes y vuelve
   * el estado a `idle`. La UI debe llamar a este método antes de
   * `form.reset()` para que la cancelación y la limpieza ocurran en
   * orden.
   */
  resetTop(): void {
    this.topSubscription?.unsubscribe();
    this.topSubscription = null;
    this.top.set(idle());
    this.lastTopFilters = {
      academicYearId: null,
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

  private dispatchTop(params: GetTopSchoolsByEnrollmentParams): void {
    this.topSubscription?.unsubscribe();
    this.topSequence += 1;
    const requestKey = `report-top#${this.topSequence}`;
    this.top.set(loading<TopSchoolsVm>(requestKey));

    this.topSubscription = this.api.getTopSchoolsByEnrollment(params).subscribe({
      next: (dto) => {
        if (this.isStale(this.top(), requestKey)) {
          return;
        }
        // El DTO canónico admite `200 []` cuando el año académico no
        // tiene inscripciones. La fachada mapea ese caso a `empty`
        // (con `reason: 'noResults'`); una lista no vacía se mapea a
        // `success` preservando el orden estable y los empates.
        if (dto.length === 0) {
          this.top.set(emptyState<TopSchoolsVm>('noResults'));
          return;
        }
        const vm = topSchoolsResponseToVm(dto);
        this.top.set(success(vm));
      },
      error: (err: unknown) => {
        if (this.isStale(this.top(), requestKey)) {
          return;
        }
        const problem = err instanceof ApiProblemError ? err.problem : null;
        if (!problem) {
          return;
        }
        this.top.set(errorState<TopSchoolsVm>(problem));
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