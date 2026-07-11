# Archive: educore-ui-strict (DEFERRED — not applied)

**Archived on**: 2026-07-11
**Status**: planning artifacts produced but **not applied** to the codebase.
**Decision**: user opted to improve the existing UX instead of adopting the EduCore Institutional UI design system.

## What was produced

Full SDD planning artifacts (13 files, 2,122 lines):
- `gap-analysis.md`
- `proposal.md`
- `design.md`
- `tasks.md`
- `README.md`
- `specs/ui-tokens/spec.md`
- `specs/app-shell/spec.md`
- `specs/feature-enrollments/spec.md`
- `specs/feature-student-search/spec.md`
- `specs/feature-teacher-contracts/spec.md`
- `specs/feature-reports/spec.md`
- `specs/feedback/spec.md`
- `specs/a11y-compliance/spec.md`

## Why deferred

- The EduCore design system (navy/indigo/teal palette, Manrope+Inter typography, fixed rail 260px, app-bar 64px) is a wholesale UI rewrite.
- The existing app is green with 432 tests passing; preserving every a11y P0/P1 invariant under a wholesale UI change carries significant risk.
- User preference: invest effort in incremental improvements to what already works rather than a redesign.

## How to reuse later

If the team later decides to adopt EduCore:

1. `mv openspec/changes/archive/2026-07-11-educore-ui-strict-deferred openspec/changes/educore-ui-strict`
2. Re-validate the 6 open questions (brand text, logo asset, settings/support rail, axe-core, pagination, "Ver historial" button) — defaults are recorded in `design.md` §Open Questions.
3. Re-validate the gap analysis against current source (mockups are versioned in `Templates/stitch_educore_academy_operations_system/`).
4. Cut `feat/educore-ui-strict` from `main` and execute `tasks.md` phase by phase.

Until then, this folder is reference-only and **must not** be re-activated without an explicit decision.