# Tasks: Historial académico-docente P1 (`003-student-history`)

**Change**: `003-student-history` · **Frontend-only** · **Strict TDD off** · **PR6 stacked-to-main**

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium

~830 LOC total; PR6 único con 6 sub-commits (6.1–6.6); commit 6.5 ≈340 LOC bajo umbral. Decisión cacheada en `design.md:142-170` y `proposal.md:38-39`.

### Suggested Work Units

| Unit | Scope | Commit |
|---|---|---|
| 6.1 | DTO + spec + fixture | 1 |
| 6.2 | Service layer | 2 |
| 6.3 | Mappers + VM types | 3 |
| 6.4 | Facade 1-slot | 4 |
| 6.5 | Component + a11y spec | 5 |
| 6.6 | Routing + docs + gate | 6 |

## Phase 1: Contratos y fixtures (T074–T075)

- [x] 1.1 T074 — Crear `src/app/core/api/dtos/student-history-item.dto.ts` con `StudentHistoryResponseDto`, `EnrollmentHistoryItemDto`, `HistoryTeachingAssignmentDto` alineados a `components/enrollments.yaml:131-145`. Spec `student-history-item.dto.spec.ts` cubre CT-HIST-CONTRACT (equality vs ejemplo canónico).
- [x] 1.2 T075 — Crear `src/testing/fixtures/student-history.fixture.ts` con `studentHistoryFixture` (happy 2-year + asignaciones múltiples), `emptyStudentHistoryFixture`, `apiProblemStudentNotFoundFixture`. Re-exportar en `src/testing/fixtures/index.ts`.

## Phase 2: Servicio y mappers (T076–T077)

- [x] 2.1 T076 — Crear `src/app/features/student-history/student-history.api.service.ts` con `getStudentHistory(documentType, documentNumber, asOfDate?)` y URL `${apiBaseUrl}/api/enrollments/students/{documentType}/{documentNumber}/history`. Spec con `HttpTestingController` cubre ST-HIST-GET (path-encoding, asOfDate omitida cuando `undefined`).
- [x] 2.2 T077 — Crear `src/app/features/student-history/student-history.mappers.ts` con VM types co-localizados (`StudentHistoryVm`, `StudentHistoryFiltersVm`, `EnrollmentHistoryItemVm`, `TeachingAssignmentVm`, `StudentIdentityVm`, `WEEKDAY_LABELS`), `studentHistoryFiltersToParams`, `studentHistoryFiltersAreValid` y `studentHistoryResponseToVm` 1:1. Spec cubre orden contractual y `teachingAssignments: []` para años sin asignaciones.

## Phase 3: Fachada (T078)

- [x] 3.1 T078 — Crear `src/app/features/student-history/student-history.facade.ts` con `RemoteState<StudentHistoryVm>` (1-slot), `requestKey` por sequence, `retryHistory()`, `resetHistory()`. Spec cubre loading→success, `200 []`→`empty('noResults')`, cancel-on-switch, descarte stale por `requestKey`, errores `400`/`404` mapeados a `ApiProblem` con `code`.

## Phase 4: Componente y accesibilidad (T079–T080)

- [x] 4.1 T079 — Crear `src/app/features/student-history/student-history.component.{ts,html,scss,spec.ts}`. ReactiveForms `documentType`/`documentNumber` con `Validators.minLength/maxLength` (1–20 / 1–32). Timeline `<ol>` con `<time>` + `.visually-hidden`; `<fieldset><legend>`; `aria-required="true"` × 2; `aria-busy`; `role="status"` loading/empty/success; `role="alert"` error; 320 px media query; tokens `--app-muted`/`--app-accent`/`--app-border`; `prefers-reduced-motion`. Spec cubre success + empty + 404 + 400.
- [x] 4.2 T080 — Crear `src/app/a11y/p1-a11y-history.routes.spec.ts` (CT-A11Y-RPT-HIST) cubriendo success, empty, 404 `student_not_found`, 400 y retry flow desde error.

## Phase 5: Routing y shell (T081–T082)

- [x] 5.1 T081 — Actualizar `src/app/app.routes.ts`: reemplazar `/student-history` placeholder por `loadComponent: () => import('./features/student-history').then((m) => m.StudentHistoryComponent)`; quitar `P1LockedComponent` de esa ruta.
- [x] 5.2 T082 — Actualizar `src/app/app.component.html`: footer "Reportes operativos · Historia operativa"; nav Historia con `aria-disabled="false"`.

## Phase 6: Documentación y gate (T083–T085)

- [x] 6.1 T083 — Actualizar `docs/evaluator-execution.md` con matriz P1 history y walkthrough T033-STU (Bloques H-A a H-C con tabla de registro manual) + T034-STU (procedimiento backend real + 5 verificaciones), análogo a T033-RPT/T034-RPT.
- [x] 6.2 T084 — Reejecutar gate verbatim: `npm test --no-watch --no-progress`, `npx ng build --configuration=development`, `npm run contract:verify`. Capturar output y referenciar en `verify-report.md`.
- [x] 6.3 T085 — WU11 evidence + commit `feat(003): student-history timeline with WCAG 2.2 AA and gate rerun` + push a `main` (`stacked-to-main`).