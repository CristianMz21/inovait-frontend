# Design: Municipal Reports Frontend (P1 — age / sector / top schools)

## Technical Approach

Three read-only views under `/reports` consuming `getAgeDistribution`,
`getDistinctTeacherCountsBySector`, `getTopSchoolsByEnrollment`
(contract commit `1223630ab`). Reuses `RemoteState<T>`,
`problemDetailsInterceptor`, and `SlotBinding<T>` from `CatalogFacade`.
Standalone `ReportsShellComponent` (sections, no child routes) hosts
three report components; each owns its own `ReportsFacade` slot with
cancel-on-switch and stale discard via `requestKey`.

Mappers preserve the DTO exactly — no client recalculation, reordering,
or deduplication. Canonical `422` (`as_of_date_invalid`, `period_invalid`)
and `400/404` surface via `ApiProblem` with `problem.title` as user
message. `/reports` flips from `P1LockedComponent`; `/student-history`
stays locked. Footer + verifier rerun land in PR5.

## Architecture Decisions

| Decision | Rationale |
| --- | --- |
| One `ReportsFacade` with 3 slots (vs 3 facades / NgRx) | Mirror `CatalogFacade.dispatch<T>`: 3 `SlotBinding<VM>`, shared DI graph. |
| Standalone shell with sections (vs sibling routes or child outlet) | Single route, three `<section>` blocks; nav anchors inside shell — no back-stack risk. |
| DTO + VM + mapper pipeline (vs mega-DTO file) | Service returns `Observable<DTO>`; mappers flatten to VM — mirrors `teacher-contracts`. |
| Cancel-on-switch via subscription + `requestKey` | Reject `requestKey` mismatch before mutating signal (same as `TeacherContractsFacade.listSubscription`). |
| Hardening pass in PR5 (not inline with PR2) | PR5 only reruns the verifier, flips route/footer, adds shell + a11y spec. |

## Data Flow

```
ReportsShellComponent (sections)
   ├── AgeDistributionComponent ─► getAgeDistribution          ─► /api/reports/age-distribution
   ├── SectorReportComponent    ─► getDistinctTeacher…         ─► /api/reports/teacher-counts-by-sector
   └── TopSchoolsComponent      ─► getTopSchoolsByEnrollment   ─► /api/reports/top-schools
                                                              │
                                                              ▼
                                                 ReportsFacade (3 RemoteState slots)
                                                    cancel + stale discard via requestKey
                                                              │
                                                              ▼
                                              Active ─► Mapper ─► VM ─► Template

ReportApiService ─► HttpClient ─► problemDetailsInterceptor ─► Backend
```

## File Changes

| File | Action |
| --- | --- |
| `src/app/features/reports/{index.ts, report.vm.ts, report.api.service.ts, report.mappers.ts, report.facade.ts}` | Create (infra). |
| `src/app/features/reports/{age-distribution,sector-report,top-schools}/component.{ts,html,scss,spec}.ts` | Create (3 components). |
| `src/app/features/reports/reports-shell.component.{ts,html,scss,spec.ts}` | Create (shell). |
| `src/app/core/api/dtos/{age-distribution,sector-counts,top-schools}.dto.ts` | Create (per `components/reports.yaml`). |
| `src/testing/fixtures/{age-distribution,sector-counts,top-schools}.fixture.ts` | Create (happy + empty top-schools + 400/404/422 fixtures). |
| `src/app/a11y/p0-a11y-reports.routes.spec.ts` | Create (`CT-A11Y-RPT-AGE/SECTOR/TOP`). |
| `src/app/app.routes.ts` | Modify: `/reports` → `ReportsShellComponent`; drop placeholder. |
| `src/app/app.component.html` | Modify: Reportes nav enabled; footer copy. |
| `src/app/scripts/verify-openapi-contract.mjs` | Re-run only (no code change). |
| `docs/evaluator-execution.md` | Update: P1 Gate Reportes + T033-RPT / T034-RPT pending. |

## Interfaces / Contracts

```ts
export interface AgeBandResponse { readonly minimumAge: number; readonly maximumAge: number | null; readonly count: number; }
export interface AgeDistributionResponseDto {
  readonly academicYearId: number;
  readonly schoolId: number | null; readonly gradeId: number | null;
  readonly asOfDate: string;
  readonly age3To7: AgeBandResponse; readonly age8To12: AgeBandResponse; readonly ageOver12: AgeBandResponse;
}
export interface TeacherCountsBySectorResponseDto {
  readonly periodStart: string; readonly periodEnd: string;
  readonly publicDistinctTeacherCount: number; readonly privateDistinctTeacherCount: number;
}
export interface TopSchoolResponseDto { readonly school: SchoolSummary; readonly academicYearId: number; readonly enrollmentCount: number; }
```

`ReportsFacade` exposes `ageState`, `sectorState`, `topState` (readonly
signals) and typed `loadAge`/`loadSector`/`loadTop`. No DTO escapes
`report.api.service.ts` except via `report.mappers.ts`.

## Testing Strategy

| Layer | Approach |
| --- | --- |
| Unit (mappers) | Exact equality vs fixtures; no recompute. |
| Unit (`ReportsFacade` 3 slots) | loading→success; cancel-on-switch; stale discard; error mapping `400/404/422`. |
| Integration (`ReportApiService` ST-RPT-AGE/SECTOR/TOP) | `method=GET`, exact URL + query params (omit absent), ProblemDetails shape per status. |
| Component (shell + 3 children) | One `<h1 tabindex="-1">`; `<fieldset><legend>`; `aria-required`/`busy`; `role="status"` loading/empty/success, `role="alert"` error; 320 px media query. top-schools adds `<table>` with `<caption class="visually-hidden">` + `<th scope="col">`. |
| A11y (`CT-A11Y-RPT-AGE/SECTOR/TOP`) | Mirrors `p0-a11y.routes.spec.ts`: success, empty (`[]`), 422 (`as_of_date_invalid`/`period_invalid`), 404. |
| Contract | `verify-openapi-contract.mjs`: 18 operationIds + checksum + commit; rerun in PR5. |

Strict TDD off per `testing-capabilities.md`. Tests adjacent as `*.spec.ts`; runner install (deferred) gates `npm test`.

## Migration / Rollout

No migration. PR5 flips `/reports`; revert restores P0 via the unchanged `P1LockedComponent` guard.

## Work-Unit Decomposition

| PR | Scope | Δ lines |
| --- | --- | --- |
| PR2 | `age-distribution` × 4 + `report.vm.ts` + age service method + DTO + fixture + mapper slice + age slot | ~360 |
| PR3 | `sector-report` × 4 + mapper extension + sector slot | ~310 |
| PR4 | `top-schools` × 4 (with `<table>`) + mapper extension + top slot + complete `index.ts` | ~340 |
| PR5 | shell × 4 + a11y spec + route flip + footer + contract rerun + docs | ~380 |

Chain: `stacked-to-main` for every PR. Per-unit LOC derived from `teacher-contracts.component.{ts,html,scss,spec}.ts` (333+342+340+363 LOC for a 2-form component) halved for single-form simplicity.

## Review Workload Forecast

- Total Δ: ~1.4k LOC across 4 stacked PRs
- **Decision needed before apply: No** (chain pinned in `proposal.md`)
- **Chained PRs recommended: Yes**
- **400-line budget risk: Medium** (PR2 binding; split mapper/tests before opening if > 400 LOC)
- Chain: `stacked-to-main` — child PRs target `main`; rebase before merge if base drifts.
