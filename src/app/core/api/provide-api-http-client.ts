import type { EnvironmentProviders } from "@angular/core";
import {
  type HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { mockBackendInterceptor } from "../mocks/mock-backend.interceptor";
import { problemDetailsInterceptor } from "./problem-details.interceptor";

/**
 * Helper para `provideHttpClient` que registra el interceptor de
 * `ProblemDetails`. La UI sólo debe usar esta forma de configurar el
 * cliente HTTP para asegurar el manejo uniforme de errores.
 */
export const withApiProblemDetails = (): ReturnType<typeof withInterceptors> =>
  withInterceptors([problemDetailsInterceptor]);

/**
 * Helper combinado para `bootstrapApplication` / `TestBed`: provee un
 * `HttpClient` ya conectado al interceptor `problemDetailsInterceptor`.
 *
 * When `environment.useMocks` is true, the mock backend interceptor is
 * added BEFORE `problemDetailsInterceptor` so mocks can short-circuit
 * requests and ProblemDetails handling only runs for error cases.
 */
export const provideApiHttpClient = (): EnvironmentProviders => {
  const interceptors: HttpInterceptorFn[] = [];
  if (environment.useMocks) {
    interceptors.push(mockBackendInterceptor);
  }
  interceptors.push(problemDetailsInterceptor);
  return provideHttpClient(withInterceptors(interceptors));
};

export type { HttpInterceptorFn };
