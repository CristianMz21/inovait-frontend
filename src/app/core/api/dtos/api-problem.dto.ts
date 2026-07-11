/**
 * ProblemDetails canónico devuelto por el backend para errores 4xx/5xx.
 * Refleja `components/problems.yaml` del contrato OpenAPI.
 *
 * `errors` es un mapa opcional de campo → mensajes; puede no estar presente.
 */
export interface ApiProblem {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly code: string;
  readonly detail?: string | null;
  readonly instance?: string | null;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}
