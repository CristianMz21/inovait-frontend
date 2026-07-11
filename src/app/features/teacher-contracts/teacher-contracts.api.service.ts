import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import { map } from "rxjs";
import { API_CONFIG } from "../../core/api/api-config";
import type { CreateTeacherContractsRequest } from "../../core/api/dtos/create-teacher-contracts-request.dto";
import type { TeacherContractResponse } from "../../core/api/dtos/teacher-contract-response.dto";

/**
 * Parámetros de la operación canónica `createTeacherContracts`. El
 * identificador del docente viaja en el `path`; el payload se mapea
 * exactamente al body declarado en `paths/teacher-contracts.yaml`.
 */
export interface CreateTeacherContractsParams {
  readonly teacherId: number;
  readonly request: CreateTeacherContractsRequest;
}

/**
 * Parámetros de la operación canónica `listTeacherContracts`. La fecha
 * opcional `asOfDate` sólo se incluye cuando la operadora la define.
 */
export interface ListTeacherContractsParams {
  readonly teacherId: number;
  readonly asOfDate?: string;
}

function toListParams(params: ListTeacherContractsParams): HttpParams {
  let httpParams = new HttpParams();
  if (params.asOfDate) {
    httpParams = httpParams.set("asOfDate", params.asOfDate);
  }
  return httpParams;
}

/**
 * Servicio de transporte HTTP para las operaciones canónicas
 * `createTeacherContracts` y `listTeacherContracts` (operationIds del
 * contrato). Emite `POST` y `GET` contra
 * `${apiBaseUrl}/api/teachers/{teacherId}/contracts` y devuelve los
 * payloads canónicos del backend.
 *
 * Esta clase no aplica reglas de UI ni mutación de estado: su única
 * responsabilidad es mantener la trazabilidad exacta con los
 * `operationId` declarados en `paths/teacher-contracts.yaml`. El manejo
 * uniforme de errores 4xx/5xx queda delegado al `problemDetailsInterceptor`.
 */
@Injectable({ providedIn: "root" })
export class TeacherContractsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  create(
    params: CreateTeacherContractsParams,
  ): Observable<readonly TeacherContractResponse[]> {
    const url = `${this.config.apiBaseUrl}/api/teachers/${params.teacherId}/contracts`;
    return this.http
      .post<readonly TeacherContractResponse[]>(url, params.request)
      .pipe(map((data) => [...data]));
  }

  list(
    params: ListTeacherContractsParams,
  ): Observable<readonly TeacherContractResponse[]> {
    const url = `${this.config.apiBaseUrl}/api/teachers/${params.teacherId}/contracts`;
    return this.http
      .get<readonly TeacherContractResponse[]>(url, {
        params: toListParams(params),
      })
      .pipe(map((data) => [...data]));
  }
}
