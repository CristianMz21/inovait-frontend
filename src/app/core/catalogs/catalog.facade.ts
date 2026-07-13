/* Copyright (c) 2026. All rights reserved. */
import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subscription, type Observable } from "rxjs";
import { toSafeApiProblem } from "../api/to-safe-api-problem";
import type { AcademicYearSummary } from "../api/dtos/academic-year-summary.dto";
import type { ClassGroupSummary } from "../api/dtos/class-group-summary.dto";
import type { GradeSummary } from "../api/dtos/grade-summary.dto";
import type { SchoolSummary } from "../api/dtos/school-summary.dto";
import type { SubjectSummary } from "../api/dtos/subject-summary.dto";
import type { TeacherSummary } from "../api/dtos/teacher-summary.dto";
import {
  empty,
  errorState,
  idle,
  loading,
  success,
  type RemoteState,
} from "../api/remote-state";
import {
  CatalogApiService,
  type ListClassGroupsParams,
} from "./catalog-api.service";

type Slot =
  | "schools"
  | "grades"
  | "academicYears"
  | "classGroups"
  | "teachers"
  | "subjects";

interface SlotBinding<T> {
  state: ReturnType<typeof signal<RemoteState<T>>>;
  subscription: Subscription | null;
  sequence: number;
}

function nextRequestKey(slot: Slot, sequence: number): string {
  return `${slot}#${sequence}`;
}

/**
 * Fachada reactiva para los catálogos canónicos.
 *
 * - Aplica cancelación: cada nueva llamada cancela la suscripción previa
 *   del mismo slot vía `Subscription.unsubscribe()`, lo que descarta la
 *   petición HTTP subyacente.
 * - Descarta respuestas obsoletas (stale) comparando la `requestKey`
 *   asociada al emitir; si la respuesta llega tras una nueva carga, se
 *   ignora silenciosamente.
 * - Expone el estado vía Signals para que los componentes P0 reaccionen
 *   sin necesidad de suscribirse manualmente.
 */
@Injectable({ providedIn: "root" })
export class CatalogFacade {
  private readonly api = inject(CatalogApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly schools: SlotBinding<readonly SchoolSummary[]> = {
    state: signal(idle()),
    subscription: null,
    sequence: 0,
  };

  private readonly grades: SlotBinding<readonly GradeSummary[]> = {
    state: signal(idle()),
    subscription: null,
    sequence: 0,
  };

  private readonly academicYears: SlotBinding<readonly AcademicYearSummary[]> =
    {
      state: signal(idle()),
      subscription: null,
      sequence: 0,
    };

  private readonly classGroups: SlotBinding<readonly ClassGroupSummary[]> = {
    state: signal(idle()),
    subscription: null,
    sequence: 0,
  };

  private readonly teachers: SlotBinding<readonly TeacherSummary[]> = {
    state: signal(idle()),
    subscription: null,
    sequence: 0,
  };

  private readonly subjects: SlotBinding<readonly SubjectSummary[]> = {
    state: signal(idle()),
    subscription: null,
    sequence: 0,
  };

  readonly schoolsState = this.schools.state.asReadonly();
  readonly gradesState = this.grades.state.asReadonly();
  readonly academicYearsState = this.academicYears.state.asReadonly();
  readonly classGroupsState = this.classGroups.state.asReadonly();
  readonly teachersState = this.teachers.state.asReadonly();
  readonly subjectsState = this.subjects.state.asReadonly();

  loadSchools(): void {
    this.dispatch<readonly SchoolSummary[]>(
      this.schools,
      "schools",
      this.api.listSchools(),
    );
  }

  loadGrades(): void {
    this.dispatch<readonly GradeSummary[]>(
      this.grades,
      "grades",
      this.api.listGrades(),
    );
  }

  loadAcademicYears(): void {
    this.dispatch<readonly AcademicYearSummary[]>(
      this.academicYears,
      "academicYears",
      this.api.listAcademicYears(),
    );
  }

  loadClassGroups(params?: ListClassGroupsParams): void {
    this.dispatch<readonly ClassGroupSummary[]>(
      this.classGroups,
      "classGroups",
      this.api.listClassGroups(params),
    );
  }

  loadTeachers(): void {
    this.dispatch<readonly TeacherSummary[]>(
      this.teachers,
      "teachers",
      this.api.listTeachers(),
    );
  }

  loadSubjects(): void {
    this.dispatch<readonly SubjectSummary[]>(
      this.subjects,
      "subjects",
      this.api.listSubjects(),
    );
  }

  /**
   * Cancela manualmente la suscripción del slot (si existe) y vuelve el
   * estado a `idle`. Útil cuando una vista se destruye antes de tiempo.
   */
  cancel(slot: "classGroups" | "teachers" | "subjects"): void {
    const binding = this.resolveSlot(slot);
    binding.subscription?.unsubscribe();
    binding.subscription = null;
    binding.state.set(idle());
  }

  private dispatch<T>(
    binding: SlotBinding<T>,
    slot: Slot,
    source$: Observable<T>,
  ): void {
    binding.subscription?.unsubscribe();
    binding.sequence += 1;
    const requestKey = nextRequestKey(slot, binding.sequence);
    binding.state.set(loading<T>(requestKey));

    // CatalogFacade is root-scoped: this cleanup runs only when its owning
    // injector/application is destroyed, not on ordinary route navigation.
    binding.subscription = source$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          // Descarte de respuesta obsoleta: si la secuencia cambió,
          // esta respuesta ya no corresponde al estado actual.
          const current = binding.state();
          if (
            current.status !== "loading" ||
            current.requestKey !== requestKey
          ) {
            return;
          }
          if (Array.isArray(data) && data.length === 0) {
            binding.state.set(empty<T>("noResults"));
          } else {
            binding.state.set(success(data));
          }
        },
        error: (err: unknown) => {
          const current = binding.state();
          if (
            current.status !== "loading" ||
            current.requestKey !== requestKey
          ) {
            return;
          }
          binding.state.set(errorState<T>(toSafeApiProblem(err)));
        },
      });
  }

  private resolveSlot(
    slot: "classGroups" | "teachers" | "subjects",
  ):
    | SlotBinding<readonly ClassGroupSummary[]>
    | SlotBinding<readonly TeacherSummary[]>
    | SlotBinding<readonly SubjectSummary[]> {
    switch (slot) {
      case "classGroups":
        return this.classGroups;
      case "teachers":
        return this.teachers;
      case "subjects":
        return this.subjects;
    }
  }
}
