import type { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiProblemError } from './api-problem-error';
import { toApiProblem } from './to-api-problem';

/**
 * Interceptor funcional que normaliza respuestas 4xx/5xx a `ApiProblemError`.
 *
 * Mantiene el contrato: cualquier error remoto que la UI observe es un
 * `ApiProblem` con `status`, `code`, `title`, `detail` y `errors` opcionales.
 * La UI nunca debe inferir un código canónico: si el backend lo declara,
 * se respeta; si no, se usa un fallback por estado HTTP.
 */
export const problemDetailsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof ApiProblemError) {
        return throwError(() => error);
      }
      const httpError = error as HttpErrorResponse;
      if (httpError && typeof httpError.status === 'number') {
        return throwError(() => new ApiProblemError(toApiProblem(httpError)));
      }
      return throwError(() => error);
    }),
  );
