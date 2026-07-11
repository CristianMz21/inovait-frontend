import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { API_CONFIG } from '../../core/api/api-config';
import type { AgeDistributionResponseDto } from '../../core/api/dtos/age-distribution.dto';

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

function toHttpParams(params: GetAgeDistributionParams): HttpParams {
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

/**
 * Servicio de transporte HTTP para la operación canónica
 * `getAgeDistribution` (operationId declarado en
 * `paths/reports.yaml#/api/reports/age-distribution.get`). Emite un
 * `GET` contra `${apiBaseUrl}/api/reports/age-distribution` con los
 * filtros académicos como query string y devuelve el payload canónico
 * del backend.
 *
 * Esta clase no aplica reglas de UI ni mutación de estado: su única
 * responsabilidad es mantener la trazabilidad exacta con el
 * `operationId` declarado en `paths/reports.yaml`. El manejo uniforme
 * de errores 4xx/5xx queda delegado al `problemDetailsInterceptor`.
 *
 * Las otras dos operaciones del slot P1 (`getDistinctTeacherCountsBySector`
 * y `getTopSchoolsByEnrollment`) llegan en WU08 y WU09; este servicio
 * sólo expone la operación de WU07.
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
      .get<AgeDistributionResponseDto>(url, { params: toHttpParams(params) })
      .pipe(map((data) => ({ ...data })));
  }
}