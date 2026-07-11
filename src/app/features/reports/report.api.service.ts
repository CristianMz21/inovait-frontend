import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { API_CONFIG } from '../../core/api/api-config';
import type { AgeDistributionResponseDto } from '../../core/api/dtos/age-distribution.dto';
import type { TeacherCountsBySectorResponseDto } from '../../core/api/dtos/sector-counts.dto';

/**
 * Parámetros de la operación canónica `getAgeDistribution`. Sólo
 * `academicYearId` es obligatorio; `asOfDate`, `schoolId` y `gradeId`
 * viajan como query params sólo cuando la operadora los define. El
 * backend rellena con `null` los filtros omitidos (forma parte del
 * shape canónico del DTO de respuesta).
 */
export interface GetAgeDistributionParams {
  readonly academicYearId: number;
  readonly asOfDate?: string;
  readonly schoolId?: number;
  readonly gradeId?: number;
}

/**
 * Parámetros de la operación canónica `getDistinctTeacherCountsBySector`.
 * `periodStart` y `periodEnd` son opcionales: cuando la operadora los
 * omite ambos, el backend usa la fecha actual y replica ese valor en
 * ambos extremos del DTO de respuesta. Si sólo se envía uno de los dos,
 * se invoca igual y el backend devuelve 400 `invalid_request`.
 */
export interface GetTeacherCountsBySectorParams {
  readonly periodStart?: string;
  readonly periodEnd?: string;
}

function toAgeDistributionHttpParams(
  params: GetAgeDistributionParams,
): HttpParams {
  let httpParams = new HttpParams().set(
    'academicYearId',
    String(params.academicYearId),
  );
  if (params.asOfDate) {
    httpParams = httpParams.set('asOfDate', params.asOfDate);
  }
  if (params.schoolId !== undefined) {
    httpParams = httpParams.set('schoolId', String(params.schoolId));
  }
  if (params.gradeId !== undefined) {
    httpParams = httpParams.set('gradeId', String(params.gradeId));
  }
  return httpParams;
}

function toSectorHttpParams(
  params: GetTeacherCountsBySectorParams,
): HttpParams {
  let httpParams = new HttpParams();
  if (params.periodStart) {
    httpParams = httpParams.set('periodStart', params.periodStart);
  }
  if (params.periodEnd) {
    httpParams = httpParams.set('periodEnd', params.periodEnd);
  }
  return httpParams;
}

/**
 * Servicio de transporte HTTP para las operaciones canónicas del slot P1
 * declaradas en `paths/reports.yaml`:
 *
 * - `getAgeDistribution` (operationId en
 *   `paths/reports.yaml#/api/reports/age-distribution.get`).
 * - `getDistinctTeacherCountsBySector` (operationId en
 *   `paths/reports.yaml#/api/reports/teacher-counts-by-sector.get`).
 *
 * Emite `GET` contra `${apiBaseUrl}/api/reports/...` con los filtros
 * como query string y devuelve los payloads canónicos del backend.
 *
 * Esta clase no aplica reglas de UI ni mutación de estado: su única
 * responsabilidad es mantener la trazabilidad exacta con cada
 * `operationId` declarado en `paths/reports.yaml`. El manejo uniforme
 * de errores 4xx/5xx queda delegado al `problemDetailsInterceptor`.
 *
 * La operación `getTopSchoolsByEnrollment` llega en WU09.
 */
@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  getAgeDistribution(
    params: GetAgeDistributionParams,
  ): Observable<AgeDistributionResponseDto> {
    const url = `${this.config.apiBaseUrl}/api/reports/age-distribution`;
    return this.http
      .get<AgeDistributionResponseDto>(url, {
        params: toAgeDistributionHttpParams(params),
      })
      .pipe(map((data) => ({ ...data })));
  }

  getDistinctTeacherCountsBySector(
    params: GetTeacherCountsBySectorParams = {},
  ): Observable<TeacherCountsBySectorResponseDto> {
    const url = `${this.config.apiBaseUrl}/api/reports/teacher-counts-by-sector`;
    return this.http
      .get<TeacherCountsBySectorResponseDto>(url, {
        params: toSectorHttpParams(params),
      })
      .pipe(map((data) => ({ ...data })));
  }
}