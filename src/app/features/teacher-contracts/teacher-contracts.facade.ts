import { Injectable, inject, signal } from '@angular/core';
import type { Subscription } from 'rxjs';
import { ApiProblemError } from '../../core/api/api-problem-error';
import type { TeacherContractResponse } from '../../core/api/dtos/teacher-contract-response.dto';
import {
  type RemoteState,
  empty,
  errorState,
  idle,
  loading,
  success,
} from '../../core/api/remote-state';
import {
  teacherContractResponseToResult,
  teacherContractsFormToRequest,
} from './teacher-contracts.mappers';
import {
  TeacherContractsApiService,
  type CreateTeacherContractsParams,
} from './teacher-contracts.api.service';
import type {
  TeacherContractResultVm,
  TeacherContractsFormVm,
} from './teacher-contracts.vm';

/**
 * Fachada del ciclo de vida de **Contratos docentes** (US3).
 *
 * Coordina los dos recorridos:
 *
 * - `submit()` para crear contratos multiescuela atómicos
 *   (`createTeacherContracts`).
 * - `searchByTeacher()` para listar contratos históricos por docente
 *   (`listTeacherContracts`).
 *
 * Ambos comparten la disciplina de `RemoteState` exclusivo
 * (`idle|loading|success|empty|error`), cancelación del envío previo
 * ante nuevas solicitudes y descarte de respuestas obsoletas vía
 * `requestKey`. La invariante crítica de US3 —atomicidad: no debe
 * representarse ninguna creación parcial si el backend rechaza la
 * solicitud— se garantiza porque:
 *
 * - El estado `success` sólo se emite cuando el `POST` devuelve `201`
 *   con el array canónico. Cualquier `4xx/5xx` queda mapeado a
 *   `error` y el resultado anterior (si lo había) no se conserva.
 * - La cancelación previa a un nuevo `submit` descarta la respuesta
 *   tardía de un envío obsoleto (cambio de escuelas, fechas, docente).
 * - La validación local (`teacherContractsFormToRequest`) evita
 *   peticiones inválidas antes de invocar al backend.
 *
 * La fachada se provee a nivel de componente (`providedIn` por defecto),
 * no en el inyector raíz: cada `TeacherContractsComponent` debe tener
 * su propio estado para que dos pestañas no compartan el resultado.
 */
@Injectable()
export class TeacherContractsFacade {
  private readonly api = inject(TeacherContractsApiService);

  private readonly create = signal<
    RemoteState<readonly TeacherContractResultVm[]>
  >(idle());
  private createSubscription: Subscription | null = null;
  private createSequence = 0;

  private readonly list = signal<
    RemoteState<readonly TeacherContractResultVm[]>
  >(idle());
  private listSubscription: Subscription | null = null;
  private listSequence = 0;

  /** Último docente consultado por `searchByTeacher`. */
  private lastListTeacherId: number | null = null;
  private lastListAsOfDate: string | null = null;

  /** Estado remoto del recorrido de creación. Sólo lectura. */
  readonly createResult = this.create.asReadonly();
  /** Estado remoto del recorrido de consulta por docente. Sólo lectura. */
  readonly listResult = this.list.asReadonly();

  /**
   * Indica si la VM actual es submittable. La UI usa este predicado
   * para activar/desactivar el botón "Crear contratos" antes de
   * ejecutar el submit.
   */
  canSubmit(form: TeacherContractsFormVm): boolean {
    return teacherContractsFormToRequest(form) !== null;
  }

  /**
   * Envía la solicitud de creación multiescuela. Si ya hay un envío
   * en curso, lo cancela y descarta cualquier respuesta tardía. No-op
   * cuando la VM es inválida (formulario incompleto o con
   * inconsistencias locales).
   */
  submit(form: TeacherContractsFormVm): void {
    const params = teacherContractsFormToRequest(form);
    if (params === null) {
      return;
    }
    this.dispatchCreate(params);
  }

  /**
   * Reintenta la última creación a partir del formulario vigente.
   * No-op si no hay un error previo o si la VM actual es inválida.
   */
  retrySubmit(form: TeacherContractsFormVm): void {
    if (this.create().status !== 'error') {
      return;
    }
    this.submit(form);
  }

  /**
   * Cancela la creación en curso y vuelve el estado a `idle`. La UI
   * debe llamar a este método antes de `form.reset()` para que la
   * cancelación y la limpieza ocurran en orden.
   */
  resetCreate(): void {
    this.createSubscription?.unsubscribe();
    this.createSubscription = null;
    this.create.set(idle());
  }

  /**
   * Consulta los contratos históricos de un docente. Si ya hay una
   * búsqueda en curso, la cancela y descarta cualquier respuesta
   * tardía. `teacherId` debe ser un entero positivo (la UI debe
   * deshabilitar el botón cuando no hay selección).
   */
  searchByTeacher(teacherId: number, asOfDate?: string | null): void {
    if (!Number.isInteger(teacherId) || teacherId <= 0) {
      return;
    }
    this.lastListTeacherId = teacherId;
    this.lastListAsOfDate = asOfDate ?? null;
    this.dispatchList(teacherId, asOfDate ?? undefined);
  }

  /**
   * Reintenta la última consulta con los parámetros vigentes. No-op si
   * no hay un error previo o si nunca se consultó un docente.
   */
  retryList(): void {
    if (this.list().status !== 'error') {
      return;
    }
    if (this.lastListTeacherId === null) {
      return;
    }
    this.dispatchList(this.lastListTeacherId, this.lastListAsOfDate ?? undefined);
  }

  /**
   * Cancela la consulta en curso y vuelve el estado a `idle`. La UI
   * debe llamar a este método antes de limpiar el formulario de
   * consulta.
   */
  resetList(): void {
    this.listSubscription?.unsubscribe();
    this.listSubscription = null;
    this.list.set(idle());
    this.lastListTeacherId = null;
    this.lastListAsOfDate = null;
  }

  // -- Despacho interno ---------------------------------------------------

  private dispatchCreate(
    params: CreateTeacherContractsParams,
  ): void {
    this.createSubscription?.unsubscribe();
    this.createSequence += 1;
    const requestKey = `teacher-contracts-create#${this.createSequence}`;
    this.create.set(loading(requestKey));

    this.createSubscription = this.api.create(params).subscribe({
      next: (response: readonly TeacherContractResponse[]) => {
        if (this.isStale(this.create(), requestKey)) {
          return;
        }
        if (response.length === 0) {
          this.create.set(empty<readonly TeacherContractResultVm[]>('noContracts'));
          return;
        }
        this.create.set(success(response.map(teacherContractResponseToResult)));
      },
      error: (err: unknown) => {
        if (this.isStale(this.create(), requestKey)) {
          return;
        }
        const problem = err instanceof ApiProblemError ? err.problem : null;
        if (!problem) {
          return;
        }
        this.create.set(
          errorState<readonly TeacherContractResultVm[]>(problem),
        );
      },
    });
  }

  private dispatchList(teacherId: number, asOfDate: string | undefined): void {
    this.listSubscription?.unsubscribe();
    this.listSequence += 1;
    const requestKey = `teacher-contracts-list#${this.listSequence}`;
    this.list.set(loading(requestKey));

    this.listSubscription = this.api
      .list({ teacherId, ...(asOfDate ? { asOfDate } : {}) })
      .subscribe({
        next: (response: readonly TeacherContractResponse[]) => {
          if (this.isStale(this.list(), requestKey)) {
            return;
          }
          if (response.length === 0) {
            this.list.set(empty<readonly TeacherContractResultVm[]>('noContracts'));
            return;
          }
          this.list.set(success(response.map(teacherContractResponseToResult)));
        },
        error: (err: unknown) => {
          if (this.isStale(this.list(), requestKey)) {
            return;
          }
          const problem = err instanceof ApiProblemError ? err.problem : null;
          if (!problem) {
            return;
          }
          this.list.set(
            errorState<readonly TeacherContractResultVm[]>(problem),
          );
        },
      });
  }

  /**
   * Determina si la respuesta pertenece todavía al envío vigente.
   * Sólo durante `loading` la `requestKey` está vigente; cualquier otro
   * estado implica que la respuesta debe descartarse.
   */
  private isStale<T>(
    state: RemoteState<T>,
    requestKey: string,
  ): boolean {
    return state.status !== 'loading' || state.requestKey !== requestKey;
  }
}