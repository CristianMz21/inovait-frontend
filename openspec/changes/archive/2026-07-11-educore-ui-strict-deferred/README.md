# Change: `educore-ui-strict`

**Intent**: align the `inovait-frontend` Angular application to the EduCore Institutional UI design system, strict letter-by-letter, while preserving every data contract, route, business rule, and a11y invariant.

**Status**: planning only — no source code modified.

## Navigation

| Document | Purpose | When to read |
|----------|---------|--------------|
| [`gap-analysis.md`](./gap-analysis.md) | Component inventory, current→EduCore mapping, conflicts with current code, risks to existing a11y specs | Before reading the proposal — establishes "what changes and why at the component level" |
| [`proposal.md`](./proposal.md) | Intent, scope, capabilities, approach, risks, rollback plan, success criteria | High-level overview; the entry point for reviewers |
| [`design.md`](./design.md) | Architecture decisions with rationale, file-by-file change list, test strategy, WCAG 2.2 AA contrast verification table | Before implementation — answers "how will this be built and why these choices" |
| [`tasks.md`](./tasks.md) | Ordered, dependency-tagged implementation tasks grouped by phase with per-phase gates | Before/during implementation — the work plan |
| [`specs/ui-tokens/spec.md`](./specs/ui-tokens/spec.md) | Every color, typography, spacing, radius, shadow token with exact hex / px values; token aliasing rules; documented WCAG pairings | Source of truth for design tokens |
| [`specs/app-shell/spec.md`](./specs/app-shell/spec.md) | Rail 260 px + app-bar 64 px layout, nav items and targets, skip-link, breadcrumb, active-state indicator | Source of truth for shell structure |
| [`specs/feature-enrollments/spec.md`](./specs/feature-enrollments/spec.md) | Layout matching `enrollments_desktop/code.html` | Source of truth for the Enrollments feature UI |
| [`specs/feature-student-search/spec.md`](./specs/feature-student-search/spec.md) | Layout matching `student_search_desktop/code.html`; preserves `asOfDate` end-to-end | Source of truth for the Student Search feature UI |
| [`specs/feature-teacher-contracts/spec.md`](./specs/feature-teacher-contracts/spec.md) | Layout matching `teacher_contracts_desktop/code.html`; chip multiselect for schools | Source of truth for the Teacher Contracts feature UI |
| [`specs/feature-reports/spec.md`](./specs/feature-reports/spec.md) | Layout matching `reports_overview_desktop/code.html`; KPI cards per section | Source of truth for the Reports feature UI |
| [`specs/feedback/spec.md`](./specs/feedback/spec.md) | Alerts mapped to `ProblemDetails`, skeleton loader on Warm Ivory | Source of truth for cross-cutting feedback primitives |
| [`specs/a11y-compliance/spec.md`](./specs/a11y-compliance/spec.md) | Preserved P0/P1 invariants, token-presence spec, manual WCAG verification, zero-console-warning gate | Source of truth for accessibility compliance |

## Phases

The implementation is split into 7 phases (one commit per phase):

1. **Phase 1 — Tokens**: replace global CSS tokens; load Google Fonts; add token-presence spec.
2. **Phase 2 — Shell**: restructure into fixed rail + app-bar + main canvas; preserve every a11y invariant.
3. **Phase 3a — Enrollments**: two-column layout per mockup; fix Angular 21 disabled warning.
4. **Phase 3b — Student Search**: filter panel + initial state + EduCore-styled table.
5. **Phase 3c — Teacher Contracts**: split layout + chip multiselect + segmented control.
6. **Phase 3d — Reports**: Bento grid + KPI cards + page-header segmented control.
7. **Phase 4 — Verification**: manual WCAG contrast checks; final lint/test/build gate.

See [`tasks.md`](./tasks.md) for the full task breakdown with dependencies and per-phase gates.

## Capability ↔ spec mapping

| Capability | Spec file | Scenarios |
|------------|-----------|-----------|
| `ui-tokens` | [`specs/ui-tokens/spec.md`](./specs/ui-tokens/spec.md) | 6 |
| `app-shell` | [`specs/app-shell/spec.md`](./specs/app-shell/spec.md) | 7 |
| `feature-enrollments` | [`specs/feature-enrollments/spec.md`](./specs/feature-enrollments/spec.md) | 11 |
| `feature-student-search` | [`specs/feature-student-search/spec.md`](./specs/feature-student-search/spec.md) | 10 |
| `feature-teacher-contracts` | [`specs/feature-teacher-contracts/spec.md`](./specs/feature-teacher-contracts/spec.md) | 12 |
| `feature-reports` | [`specs/feature-reports/spec.md`](./specs/feature-reports/spec.md) | 11 |
| `feedback` | [`specs/feedback/spec.md`](./specs/feedback/spec.md) | 5 |
| `a11y-compliance` | [`specs/a11y-compliance/spec.md`](./specs/a11y-compliance/spec.md) | 7 |
| **Total** | — | **69 scenarios across 8 capabilities** |

## Existing specs preserved

This change does NOT modify any existing capability spec. The following specs continue to govern business behaviour and MUST stay green throughout the refactor:

- `openspec/specs/enrollment-management/spec.md` — atomic enrollment business rules
- `openspec/specs/student-search/spec.md` — joint search filters and no-groups handling
- `openspec/specs/teacher-contracts/spec.md` — atomic multischool contract creation
- `openspec/specs/municipal-reports/spec.md` — three reports (age, sector, top schools) + history

The corresponding a11y specs (in `src/app/a11y/`) MUST also stay green:

- `p0-a11y.routes.spec.ts` — shell + 3 P0 routes
- `p0-a11y-reports.routes.spec.ts` — reports shell + 3 report routes
- `p1-a11y-history.routes.spec.ts` — history route

## Open questions (blocking phase 1)

See [`design.md` → Open Questions](./design.md#open-questions) for the full list. Summary:

1. Brand block text: "Inovait · Gestión escolar municipal" (default) vs "EduCore Academy" (mockup).
2. Brand logo image: text-only (default) vs decorative asset from `educore_brand_mark/`.
3. Settings + Support nav items: decorative-only (default) vs route placeholders.
4. axe-core integration: manual verification this change (default) vs follow-up change with `axe-core` added to devDeps.
5. Pagination on teacher-contracts table: keep showing all (default) vs implement in this change.
6. Student-search "Ver historial" button: keep disabled with `aria-disabled="true"` (default) vs remove entirely.

Each is currently defaulted; user can override any of them before phase 1 begins.

## Source of truth

The EduCore design system is documented at `Templates/stitch_educore_academy_operations_system/educore_institutional_ui/DESIGN.md`. The four mockup files (HTML + PNG) live in:

- `Templates/.../enrollments_desktop/code.html` + `screen.png`
- `Templates/.../student_search_desktop/code.html` + `screen.png`
- `Templates/.../teacher_contracts_desktop/code.html` + `screen.png`
- `Templates/.../reports_overview_desktop/code.html` + `screen.png`

Every token in `specs/ui-tokens/spec.md` and every layout in the feature specs is traced back to one of these files.
