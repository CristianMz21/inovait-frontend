import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { Subscription } from "rxjs";
import { toSafeApiProblem } from "../../core/api/to-safe-api-problem";
import type { CreateEnrollmentRequest } from "../../core/api/dtos/create-enrollment-request.dto";
import {
  type RemoteState,
  errorState,
  idle,
  loading,
  success,
} from "../../core/api/remote-state";
import {
  enrollmentFormToRequest,
  enrollmentResponseToResult,
} from "./enrollment.mappers";
import type {
  EnrollmentFormVm,
  EnrollmentResultVm,
} from "./enrollment-create.vm";
import { EnrollmentApiService } from "./enrollment.api.service";

/**
 * Fachada del ciclo de vida de la creación de matrícula.
 *
 * Responsabilidades:
 * - Mantener `RemoteState<EnrollmentResultVm>` exclusivo del recorrido
 *   (`idle` / `loading` / `success` / `empty` / `error`).
 * - Mantener un único `POST` en curso. Un segundo submit se ignora porque
 *   cancelar una petición cliente no implica rollback en el backend.
 * - Descartar respuestas obsoletas comparando la `requestKey` actual con
 *   la emitida al iniciar la solicitud. Si el usuario envía dos veces
 *   seguidas, sólo la última respuesta muta el estado.
 * - Exponer `submit`, `retry` y `reset` como puntos de entrada
 *   deterministas para la UI.
 *
 * La fachada se provee a nivel de componente (`providedIn` por defecto),
 * no en el inyector raíz: cada `EnrollmentCreateComponent` debe tener su
 * propio estado para que dos pestañas no compartan el resultado.
 */
@Injectable()
export class EnrollmentCreateFacade {
  private readonly api = inject(EnrollmentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly state = signal<RemoteState<EnrollmentResultVm>>(idle());
  private subscription: Subscription | null = null;
  private sequence = 0;

  /** Estado remoto expuesto a la vista. Sólo lectura. */
  readonly result = this.state.asReadonly();

  /**
   * Indica si la VM actual es submittable. La UI usa este predicado para
   * activar/desactivar el botón "Confirmar matrícula" antes incluso de
   * ejecutar el `submit`, evitando peticiones inválidas.
   */
  canSubmit(form: EnrollmentFormVm): boolean {
    return enrollmentFormToRequest(form) !== null;
  }

  /**
   * Envía la matrícula. Si ya hay un envío en curso, lo cancela y
   * descarta cualquier respuesta tardía. No-op cuando la VM es inválida
   * (formulario incompleto).
   */
  submit(form: EnrollmentFormVm): void {
    if (this.state().status === "loading") {
      return;
    }
    const request = enrollmentFormToRequest(form);
    if (request === null) {
      return;
    }
    this.dispatch(request);
  }

  /**
   * Reintenta el último envío a partir del formulario vigente. No-op si
   * no hay un error previo o si la VM actual es inválida.
   */
  retry(form: EnrollmentFormVm): void {
    const current = this.state();
    if (current.status !== "error") {
      return;
    }
    this.submit(form);
  }

  /**
   * Limpia el estado remoto y cancela cualquier envío en curso. La UI
   * debe llamar a este método antes de `form.reset()` para que la
   * cancelación y la limpieza ocurran en orden.
   */
  reset(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.state.set(idle());
  }

  private dispatch(request: CreateEnrollmentRequest): void {
    this.subscription?.unsubscribe();
    this.sequence += 1;
    const requestKey = `enrollment#${this.sequence}`;
    this.state.set(loading<EnrollmentResultVm>(requestKey));

    this.subscription = this.api
      .create(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (this.isStale(requestKey)) {
            return;
          }
          this.state.set(success(enrollmentResponseToResult(response)));
        },
        error: (err: unknown) => {
          if (this.isStale(requestKey)) {
            return;
          }
          this.state.set(errorState<EnrollmentResultVm>(toSafeApiProblem(err)));
        },
        complete: () => {
          // El backend cierra el observable tras la respuesta única; no
          // se requiere lógica adicional aquí.
        },
      });
  }

  /**
   * Determina si la respuesta pertenece todavía al envío vigente.
   * Sólo durante `loading` la `requestKey` está vigente; cualquier otro
   * estado implica que la respuesta debe descartarse.
   */
  private isStale(requestKey: string): boolean {
    const current = this.state();
    return current.status !== "loading" || current.requestKey !== requestKey;
  }
}
