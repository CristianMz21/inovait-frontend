# Archive Report — `001-school-enrollment-management` (P0)

## Summary

| Field | Value |
|---|---|
| Change | `001-school-enrollment-management` |
| Status | `ARCHIVED_WITH_WARNINGS` — P0 frontend closed; P1 tasks intentionally deferred |
| Date | 2026-07-11 |
| Scope | Frontend-only archive for P0 (`/enrollments`, `/student-search`, `/teacher-contracts`) with P1 report/history requirements preserved as future canonical candidates |
| Artifact mode | OpenSpec filesystem + Engram archive report |

This archive syncs the completed P0 delta specs into canonical `openspec/specs/` and records the remaining non-blocking evidence gaps. Tasks T001–T035 are complete for P0; T036–T048 remain unchecked by design and are explicitly out of scope for this archive.

## Synced specs

The following canonical specs were created from the delta specs and annotated with `**Source change**: 001-school-enrollment-management (P0)`:

- `openspec/specs/enrollment-management/spec.md`
- `openspec/specs/student-search/spec.md`
- `openspec/specs/teacher-contracts/spec.md`
- `openspec/specs/municipal-reports/spec.md`

## Verification reference

- Verification report: [`verify-report.md`](./verify-report.md)
- Verdict inherited from verification: `PASS_WITH_WARNINGS`, `READY TO ARCHIVE`
- Build/tests evidence: 158/158 tests passing; development build OK
- Contract evidence: tracking + clean directory OK; local backend commit-check warning documented

## Manual evidence gaps still open

| Task | Status | Reference | Archive decision |
|---|---|---|---|
| T033 Walkthrough teclado/320px/200%/contraste | `manual evidence pending` | `docs/evaluator-execution.md` → `Walkthrough Script` | Not hidden; carried as an explicit post-archive manual validation item |
| T034 Validar backend real | `manual integration pending` | `docs/evaluator-execution.md` → `Backend integration`; `scripts/dev-check-backend.mjs` | Not hidden; carried as an explicit post-archive backend integration validation item |

T033 and T034 are marked complete in `tasks.md` because the P0 implementation delivered the scripts/procedures and evidence tables required for those tasks. The human walkthrough and live backend run remain open evidence gaps for the maintainer, not blockers for archiving the closed P0 frontend slice.

## Known warnings inherited

| ID | Warning | Impact | Recommended timing |
|---|---|---|---|
| W-1 | `verify-openapi-contract.mjs` still lists latent P1 report `operationId`s as `getTeacherCountsBySector` and `getTopSchools`, while the backend contract declares `getDistinctTeacherCountsBySector` and `getTopSchoolsByEnrollment`. | Will fail once the operationId check reaches reports. | Fix before any P1 report PR. |
| W-2 | `extractOperationIds()` reads `openapi.yaml`, but operation IDs live under `paths/*.yaml`. | Will report zero operation IDs after the backend commit-check passes. | Fix before any P1 report PR / CI contract gate. |
| S-2 | Shell footer still mentions WU03. | Cosmetic only; does not affect behavior, tests, contract, or accessibility gate. | Update in the next cleanup or P1 kickoff. |

## Future work / next change candidates

- `P1 municipal-reports`: implement age distribution, teacher counts by sector, and top schools using the canonical report requirements now synced to `openspec/specs/municipal-reports/spec.md`.
- `P1 student-history`: implement the historical academic-docente flow using a separate change with its own P1 DTOs, fixtures, service, route, component, tests, and manual evidence.
- Pre-P1 hardening: fix W-1 and W-2 in `src/app/scripts/verify-openapi-contract.mjs` before the first P1 PR so the contract verifier does not inherit known latent failures.
