/* Copyright (c) 2026. All rights reserved. */
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import { map } from "rxjs";
import { API_CONFIG } from "../../core/api/api-config";
import type { EnrollmentListItem } from "../../core/api/dtos/enrollment-list-item.dto";

/**
 * Parámetros de la operación canónica `listEnrollments`. Los tres filtros
 * académicos son obligatorios porque el contrato los declara `required: true`;
 * `asOfDate` es opcional y sólo aplica cuando la operadora desea calcular la
 * edad contra una fecha distinta a la actual.
 */
export interface ListEnrollmentsParams {
  readonly schoolId: number;
  readonly gradeId: number;
  readonly academicYearId: number;
  readonly asOfDate?: string;
}

function toHttpParams(params: ListEnrollmentsParams): HttpParams {
  let httpParams = new HttpParams()
    .set("schoolId", String(params.schoolId))
    .set("gradeId", String(params.gradeId))
    .set("academicYearId", String(params.academicYearId));
  if (params.asOfDate) {
    httpParams = httpParams.set("asOfDate", params.asOfDate);
  }
  return httpParams;
}

/**
 * Servicio de transporte HTTP para `listEnrollments` (operationId del
 * contrato canónico). Emite un `GET` contra `${apiBaseUrl}/api/enrollments`
 * con los filtros académicos como query string y devuelve la colección
 * canónica del backend.
 *
 * Esta clase no aplica reglas de UI ni mutación de estado: su única
 * responsabilidad es mantener la trazabilidad exacta con el
 * `operationId` declarado en `paths/enrollments.yaml`. El manejo uniforme
 * de errores 4xx/5xx queda delegado al `problemDetailsInterceptor`.
 */
@Injectable({ providedIn: "root" })
export class StudentSearchApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  list(
    params: ListEnrollmentsParams,
  ): Observable<readonly EnrollmentListItem[]> {
    return this.http
      .get<readonly EnrollmentListItem[]>(
        `${this.config.apiBaseUrl}/api/enrollments`,
        { params: toHttpParams(params) },
      )
      .pipe(map(data => [...data]));
  }
}
