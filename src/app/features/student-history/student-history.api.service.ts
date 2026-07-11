import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import { map } from "rxjs";
import { API_CONFIG } from "../../core/api/api-config";
import type { StudentHistoryResponseDto } from "../../core/api/dtos/student-history-item.dto";

/**
 * Parámetros de la operación canónica `getStudentHistory`. Sólo
 * `documentType` (1–20) y `documentNumber` (1–32) son obligatorios y
 * viajan en el path; `asOfDate` (ISO date, opcional) viaja como query.
 *
 * El orden de los campos refleja la firma declarada en
 * `paths/enrollments.yaml#/api/students/{documentType}/{documentNumber}/history`.
 */
export interface GetStudentHistoryParams {
  readonly documentType: string;
  readonly documentNumber: string;
  readonly asOfDate?: string;
}

function toStudentHistoryHttpParams(
  params: GetStudentHistoryParams,
): HttpParams {
  let httpParams = new HttpParams();
  if (params.asOfDate) {
    httpParams = httpParams.set("asOfDate", params.asOfDate);
  }
  return httpParams;
}

/**
 * Servicio de transporte HTTP para la operación canónica `getStudentHistory`
 * (`paths/enrollments.yaml`). Emite un `GET` contra
 * `${apiBaseUrl}/api/students/{documentType}/{documentNumber}/history`
 * con `asOfDate` opcional como query string y devuelve el payload canónico
 * del backend.
 *
 * Esta clase no aplica reglas de UI ni mutación de estado: su única
 * responsabilidad es mantener la trazabilidad exacta con el
 * `operationId` declarado en el contrato canónico. El manejo uniforme
 * de errores 4xx/5xx queda delegado al `problemDetailsInterceptor`.
 */
@Injectable({ providedIn: "root" })
export class StudentHistoryApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  /**
   * `GET /api/students/{documentType}/{documentNumber}/history`
   * — devuelve la `StudentHistoryResponseDto` con las inscripciones del
   * estudiante, ordenadas por `academicYear.startDate` descendente.
   *
   * `asOfDate` se omite cuando es `undefined` para que el backend use la
   * fecha actual. El `documentType` y `documentNumber` viajan en el path
   * — Angular `HttpClient` aplica el encoding correspondiente.
   */
  getStudentHistory(
    params: GetStudentHistoryParams,
  ): Observable<StudentHistoryResponseDto> {
    const url =
      `${this.config.apiBaseUrl}/api/students/` +
      `${encodeURIComponent(params.documentType)}/` +
      `${encodeURIComponent(params.documentNumber)}/history`;
    return this.http
      .get<StudentHistoryResponseDto>(url, {
        params: toStudentHistoryHttpParams(params),
      })
      .pipe(map((data) => ({ ...data })));
  }
}
