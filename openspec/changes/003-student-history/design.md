# Design: Historial académico-docente P1 (`003-student-history`)

**Change**: `003-student-history` · **Frontend-only** · **Strict TDD off**
**Source changes**: 001 archived · 002 archived · 003 in flight
**Contract commit**: backend `1223630ab99bf1bfaa4f5919fccf5ff539379c8e`

## Technical Approach

Single read-only view under `/student-history` consuming `getStudentHistory`
(`paths/enrollments.yaml:111-165`). Reuses `RemoteState<T>`,
`problemDetailsInterceptor`, `provideApiHttpClient`, `ApiProblemError`,
and the WCAG 2.2 AA invariants from WU05/WU10 (skip-link, landmark
`<main tabindex="-1">`, `<fieldset><legend>`, `aria-required`/`busy`,
`role=status/alert` + `aria-live`, 320 px, tokens de contraste).
ReactiveForms para los dos inputs `documentType` + `documentNumber`.

Feature folder `src/app/features/student-history/` (DTO + mapper + VM +
service + facade + componente). Mapper preserva el orden contractual:
inscripciones desc por `academicYear.startDate` y asc por
`enrollmentId`; asignaciones asc por `subject.name`,
`teacher.lastNames`, `teacher.firstNames`, `assignmentId`. Sin backend
changes; `404 student_not_found`, `400 invalid_request` mapeados vía
`ApiProblem`; `200 enrollments: []` → `RemoteState.empty` con botón
`Reintentar`. `REQUIRED_OPERATION_IDS` del verificador ya incluye
`getStudentHistory`; PR6 rerun sin diff en `verify-openapi-contract.mjs`.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope filesystem | `src/app/features/student-history/` (no shell) | Single-view P1; reusa App shell + skip-link ya provistos en P0 (no navegar aquí duplica landmark). |
| Estado | `RemoteState<StudentHistoryVm>` exclusivo (no `ReportsFacade` compartido) | Sólo esta vista consume `getStudentHistory`; `ReportFacade` ya está sobre-llenado con 3 slots; alumno aislado evita acoplamiento. |
| Forms | Reactive Forms (`Validators.minLength/maxLength`) | Forma P1 del proyecto; mismo baseline que `student-search` (3 selects) y `reports/*` (1-3 campos). |
| Mapper purity | DTO → VM 1:1 sin reordenar | Contrato backend fija el orden estable; mappers ya deben "preservar sin recalcular" per `verify-report.md` design conformance de 002. |
| Cancel + stale | `Subscription` + `requestKey#seq` por slot | Idéntico a `ReportFacade.dispatchTop` (`report.facade.ts:344-376`); reuso directo del patrón. |
| `200 []` | `RemoteState.empty('noResults')` con botón `Reintentar` | Escenario "Identidad sin inscripciones" (`spec.md:21-27`); comportamiento ya probado en `top-schools` (CT-A11Y-RPT-TOP). |
| A11y timeline | `<ol>` semántica con `<time>` + `.visually-hidden` para fechas | Lista cronológica de eventos; consistente con escenario `CT-A11Y-RPT-HIST` que permite `<ol>` o `<table>` (`spec.md:55`). |
| Path param URL | `${apiBaseUrl}/api/students/{documentType}/{documentNumber}/history` | **Canonical contract** (`backend/specs/.../paths/enrollments.yaml:111`); la spec prompt original mencionaba schoolId/gradeId/academicYearId pero **no existen** en `getStudentHistory` — el contrato es la fuente de verdad y `verify-openapi-contract.mjs` validaría esta URL exacta. |

**Alcance del contrato**: spec prompt mencionó filtros académicos que no
existen en `getStudentHistory`. Sólo `documentType` (1-20) +
`documentNumber` (1-32) en path; opcional `asOfDate` (ISO) en query.
Proposal.md línea 8 ya está correcto al listar sólo identidad.

## Data Flow

```
StudentHistoryComponent
   ├─ ReactiveForms (documentType, documentNumber)
   └─ StudentHistoryFacade ──► StudentHistoryApiService
                                  │
                                  ▼
                          GET /api/students/{documentType}
                              /{documentNumber}/history
                                  │
                                  ▼  HttpClient
                          problemDetailsInterceptor
                                  │
                                  ▼
                          StudentHistoryDto ──► studentHistoryResponseToVm
                                  │
                                  ▼
                          RemoteState<StudentHistoryVm>
                                  │
                                  ▼
                          <ol> timeline (success/empty/error)
```

## File Changes

| File | Action |
|---|---|
| `src/app/features/student-history/index.ts` | Create (re-export público). |
| `src/app/features/student-history/student-history.vm.ts` | Create (`StudentHistoryFiltersVm`, `StudentHistoryVm`, `EnrollmentHistoryItemVm`, `TeachingAssignmentVm`, `StudentIdentityVm`, `WEEKDAY_LABELS`). |
| `src/app/features/student-history/student-history.api.service.ts` | Create (1 endpoint `getStudentHistory`, params path + asOfDate? query). |
| `src/app/features/student-history/student-history.mappers.ts` | Create (`studentHistoryFiltersToParams`, `studentHistoryFiltersAreValid`, `studentHistoryResponseToVm` 1:1). |
| `src/app/features/student-history/student-history.facade.ts` | Create (`RemoteState` 1-slot + `requestKey` + `retryHistory` + `resetHistory`). |
| `src/app/features/student-history/student-history.component.{ts,html,scss,spec.ts}` | Create (ReactiveForms + `<ol>` timeline, WCAG invariants). |
| `src/app/core/api/dtos/student-history-item.dto.ts` | Create (`StudentHistoryResponseDto` + `EnrollmentHistoryItemDto` + `HistoryTeachingAssignmentDto`). |
| `src/app/core/api/dtos/student-history-item.dto.spec.ts` | Create (CT-STU-CONTRACT vs `components/enrollments.yaml:131-145`). |
| `src/testing/fixtures/student-history.fixture.ts` | Create (`studentHistoryFixture` happy 2-year + `emptyStudentHistoryFixture` + `apiProblemStudentNotFoundFixture`). |
| `src/testing/fixtures/index.ts` | Modify: re-export. |
| `src/app/core/api/dtos/index.ts` | Modify: re-export DTO. |
| `src/app/app.routes.ts` | Modify: `/student-history` → `StudentHistoryComponent` (drop `P1LockedComponent`). |
| `src/app/app.component.html` | Modify: nav `aria-disabled="false"` para Historia; footer "Reportes operativos · Historia operativa". |
| `src/app/scripts/verify-openapi-contract.mjs` | Rerun only (sin diff). |
| `docs/evaluator-execution.md` | Modify: añadir T033-STU/T034-STU manual tables (análoga a T033-RPT/T034-RPT). |

## Interfaces / Contracts

```ts
// params: path mandatory, asOfDate optional ISO date
export interface GetStudentHistoryParams {
  readonly documentType: string;
  readonly documentNumber: string;
  readonly asOfDate?: string;
}

// DTO reflect `components/enrollments.yaml:131-145` (no recompute)
export interface StudentHistoryResponseDto {
  readonly studentId: number; readonly documentType: string;
  readonly documentNumber: string; readonly firstNames: string;
  readonly lastNames: string; readonly birthDate: string;
  readonly enrollments: readonly EnrollmentHistoryItemDto[];
}
export interface EnrollmentHistoryItemDto {
  readonly enrollmentId: number;
  readonly academicYear: AcademicYearSummary;
  readonly school: SchoolSummary;
  readonly grade: GradeSummary;
  readonly classGroup: ClassGroupSummary;
  readonly teachingAssignments: readonly HistoryTeachingAssignmentDto[];
}
export interface HistoryTeachingAssignmentDto {
  readonly assignmentId: number;
  readonly teacher: TeacherSummary;
  readonly subject: SubjectSummary;
  readonly weekdays: readonly number[];
}

// VM ordered as backend emits
export interface StudentHistoryVm { readonly identity: StudentIdentityVm;
  readonly enrollments: readonly EnrollmentHistoryItemVm[]; }
```

## Testing Strategy

| Layer | Approach |
|---|---|
| DTO spec | Equality vs `components/enrollments.yaml:131-145` example (CT-STU-CONTRACT). |
| Mappers | Equality vs `studentHistoryFixture`: orden preservado; años sin asignaciones → `teachingAssignments: []`. |
| Service | `HttpTestingController` + `provideApiProblemDetails`: `method=GET`; URL exacta con path-encoding; `asOfDate` omitida cuando `undefined`. |
| Facade | `loading → success`; `200 []` → `empty('noResults')`; `cancel-on-switch`; `stale discard` vía `requestKey`; errores `400/404` mapean a `ApiProblem` con `code`. |
| Component | h1 `<h1 tabindex="-1">`, fieldset+legend, `aria-required="true"` × 2, `aria-busy`, `role="status"` loading/empty/success, `role="alert"` error; `<ol>` con `<time>` + `.visually-hidden` fechas; 320 px media query. |
| A11y routes | `src/app/a11y/p1-a11y-history.routes.spec.ts` (CT-A11Y-RPT-HIST): success, empty, 404 `student_not_found`, 400, retry flow. |
| Gate | `npm test --no-watch`; `ng build --configuration=development`; `contract:verify` (warning commit-check preexistente). |

## Migration / Rollout

No migration. PR6 flips `/student-history`; revert restores `P1LockedComponent`.

## Work-Unit Decomposition

Single WU for 003 (`PR6`) — already-stated chain: `stacked-to-main`
directo a `main`; ≤ 400-line threshold per `work-unit-commits` (1 PR
deliverable, ~800 LOC reported). Sub-divisiones internas como
**commits independientes** dentro de PR6:

| Commit | Scope | Δ lines (est.) |
| --- | --- | --- |
| 6.1 | DTO + spec + fixture (CT-STU-CONTRACT) | ~90 |
| 6.2 | `student-history.api.service` + spec | ~70 |
| 6.3 | `student-history.vm` + `student-history.mappers` + spec | ~150 |
| 6.4 | `student-history.facade` + spec | ~110 |
| 6.5 | `student-history.component.{ts,html,scss,spec}` + CT-A11Y-RPT-HIST | ~340 |
| 6.6 | route flip + footer + `evaluator-execution.md` update + gate rerun | ~70 |

Total Δ: ~830 LOC (single PR aceptable bajo stacking directo a `main`;
alineado con forecast de propuesta).

## Review Workload Forecast

- **Total Δ**: ~830 LOC (single PR `stacked-to-main` a `main`).
- **Chained PRs**: No (1 PR entrega todo el recorrido; chain innecesaria).
- **400-line budget risk**: Medium (commit 6.5 ~340 LOC — bajo umbral).
- **Chain strategy**: `stacked-to-main` — child commit set rolls up into
  single PR6 targeting `main`; rebases triviales porque depende sólo de
  `main @ 3a44875`.
- **Decisión antes de apply**: No — chain fijado en
  `openspec/changes/003-student-history/proposal.md:38-39`.

## Open Questions

Ninguna. Contrato canónico (`getStudentHistory`) es fuente de verdad;
no se requieren aclaraciones con backend antes de `sdd-tasks`.
