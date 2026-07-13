/* Copyright (c) 2026. All rights reserved. */
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import { API_CONFIG } from "../../core/api/api-config";
import type { CreateEnrollmentRequest } from "../../core/api/dtos/create-enrollment-request.dto";
import type { CreateEnrollmentResponse } from "../../core/api/dtos/create-enrollment-response.dto";

/**
 * Servicio de transporte HTTP para `createEnrollment` (operationId del
 * contrato canónico). Emite un `POST` contra
 * `${apiBaseUrl}/api/enrollments` y devuelve el payload canónico del
 * backend. El manejo uniforme de errores 4xx/5xx queda delegado al
 * `problemDetailsInterceptor` registrado en el cliente HTTP.
 *
 * Esta clase no aplica reglas de UI ni mutación de estado: su única
 * responsabilidad es mantener la trazabilidad exacta con el
 * `operationId` declarado en `paths/enrollments.yaml`.
 */
@Injectable({ providedIn: "root" })
export class EnrollmentApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  create(
    request: CreateEnrollmentRequest,
  ): Observable<CreateEnrollmentResponse> {
    return this.http.post<CreateEnrollmentResponse>(
      `${this.config.apiBaseUrl}/api/enrollments`,
      request,
    );
  }
}
