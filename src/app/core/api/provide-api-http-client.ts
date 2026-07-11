import {
  type EnvironmentProviders,
  type HttpInterceptorFn,
  type Provider,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { problemDetailsInterceptor } from './problem-details.interceptor';

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
 */
export const provideApiHttpClient = (): EnvironmentProviders =>
  provideHttpClient(withInterceptors([problemDetailsInterceptor]));

export type { HttpInterceptorFn };
export type { Provider };
