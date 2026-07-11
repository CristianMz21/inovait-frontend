# Proposal: educore-ui-strict — strict EduCore Institutional UI refactor

## Intent

Align the entire `inovait-frontend` Angular application to the **EduCore Institutional UI** design system, **letter-by-letter**. Today the app uses generic blue/green/red tokens, a single Inter font, 4px radii, and a horizontal top nav. The EduCore design system specifies a two-font stack (Manrope + Inter), a strict 8pt scale, Academic Navy + Institutional Indigo + Modern Teal palette, a 260px left rail with a 64px app-bar, exact shape conventions (10-12px controls, 16px containers, 6px badges), and specific component layouts for enrollments, student search, teacher contracts, and reports.

The change brings the UI to the design-system standard while preserving every a11y invariant codified by the existing P0 and P1 a11y specs, every DTO/mapper/service, every route, and every public contract.

## Scope

### In Scope

- Replace global CSS tokens in `src/styles.scss` with the EduCore palette, typography, spacing, radius, elevation, and shadow tokens. Preserve `--app-muted`, `--app-accent`, `--app-border` as **aliases** of the new tokens so existing a11y specs that grep these names continue to pass.
- Load **Manrope** and **Material Symbols Outlined** from Google Fonts in `src/index.html` (CSS-only, no npm package added).
- Restructure `src/app/app.component.{html,scss,ts}` into a fixed left rail (260px) + fixed app-bar (64px) + fluid main content layout. Replace the top horizontal nav with the EduCore rail. Keep the skip-link as the first focusable element.
- Rewrite `src/app/features/enrollments/enrollment-create.component.{html,scss}` to the two-column grid (Student Identity `col-span-7` + Academic Placement `col-span-5`) with section icons, status badges, and the EduCore CTA hierarchy (Modern Teal primary, transparent secondary). Replace `[disabled]` attribute bindings on Reactive Forms selects with `[attr.disabled]` to remove the Angular 21+ warning.
- Rewrite `src/app/features/student-search/student-search.component.{html,scss}` to a 4-col filter grid inside a single filter panel and add the "Ready to Search" centered initial state. Restyle the results table headers per the mockup (label-xs uppercase bold navy). Preserve `asOfDate` end-to-end.
- Rewrite `src/app/features/teacher-contracts/teacher-contracts.component.{html,scss}` to a 12-col split (`col-span-4` create form + `col-span-8` contracts table). Replace the checkbox school selector with a chip multiselect matching the mockup. Add the segmented "Active | All History" control in the table header.
- Rewrite `src/app/features/reports/reports-shell.component.{html,scss}` and the three sub-component templates to match the mockup: top segmented control in the page header, Bento 12-col grid for age distribution (`col-span-3` filter + `col-span-9` KPI cards), and KPI cards for sector report.
- Add reusable SCSS partials under `src/styles/_educore/` for tokens, primitives (button, input, card, badge, skeleton, segmented-control), and shell pieces. No new npm packages.
- Address the Angular 21 console warning about `disabled` on Reactive Forms selects in `enrollment-create.component.html` and any other occurrence.
- Add unit tests asserting token presence, contrast pairings documented, 320 px media query, and `prefers-reduced-motion`.
- Manual verification of WCAG 2.2 AA contrast on every documented token pairing used in the new templates.

### Out of Scope

- Changes to data model (DTOs, mappers, facades, services) — untouched.
- Routing shape, route guards, HTTP contracts — untouched.
- Test framework, build tool, package manager — unchanged.
- Adding axe-core or any new npm dependency (handled outside this change; see Open Questions).
- Deleting `src/app/layout/placeholders/*` (kept until confirmed no longer referenced).
- P1 features (student-history UI, student-search "Ver historial" wiring) — untouched.
- Dark mode toggle (mockup implies one; not in scope for this refactor).
- New behaviour for `Switch School`, `Notifications`, `Account`, `Settings`, `Support` (rendered as buttons but not wired).

## Capabilities

This change introduces **8 new capabilities** (each gets its own spec file in `specs/<capability>/spec.md`). No existing capability spec is modified at the requirement level — the existing `enrollment-management`, `student-search`, `teacher-contracts`, and `municipal-reports` specs continue to describe behaviour; the new `feature-*` capabilities describe the **UI fidelity** to the EduCore design system.

### New Capabilities

- **`ui-tokens`** — Defines every color, typography, spacing, radius, elevation, and shadow token with exact hex/px values from `DESIGN.md`. Specifies how tokens are loaded (CSS custom properties + SCSS partial) and which documented pairings must pass WCAG 2.2 AA contrast.
- **`app-shell`** — Layout structure (rail 260px, app-bar 64px, content fluid with max-width), nav items and targets, skip-link behaviour, breadcrumb behaviour, active-state indicator (Soft Teal background + 4px vertical bar).
- **`feature-enrollments`** — Layout matches `enrollments_desktop/code.html`: School → Year → Grade → Group cascade, two-column form, section icons, CTA hierarchy, status badges, success/error mapping to ProblemDetails.
- **`feature-student-search`** — Layout matches `student_search_desktop/code.html`: filter panel with 4-col grid + searchable School + searchable select chevron + initial "Ready to Search" state + results table. `asOfDate` preserved end-to-end.
- **`feature-teacher-contracts`** — Layout matches `teacher_contracts_desktop/code.html`: split layout (4 create + 8 table), chip multiselect for schools, dates grid, segmented "Active | All History" control, status/validity badges.
- **`feature-reports`** — Layout matches `reports_overview_desktop/code.html`: shell with 3 sections (age-distribution, top-schools, teacher-counts-by-sector), Bento grid for age distribution, KPI cards per section, page-header segmented nav.
- **`feedback`** — Alerts mapped to `ProblemDetails` (Title, Detail, Instance), skeleton loaders on Warm Ivory, optional toasts (none required by mockups — toasts stub only).
- **`a11y-compliance`** — WCAG 2.2 AA preservation of every P0/P1 invariant codified by existing a11y specs; new axe-core-style assertions (token presence, contrast pairings, reduced motion, 320 px media query).

### Modified Capabilities

None. The existing `enrollment-management`, `student-search`, `teacher-contracts`, and `municipal-reports` capability specs are **not** modified by this change. They continue to govern business behaviour; this change adds new UI-fidelity capabilities layered on top.

## Approach

1. **Phase 1 — Tokens**: replace `src/styles.scss` tokens with the EduCore palette and font stack; add `src/styles/_educore/_tokens.scss` partial; keep `--app-muted`, `--app-accent`, `--app-border` as aliases.
2. **Phase 2 — Shell**: split `app.component` into a structural shell (rail + app-bar + main outlet) with extracted `app-rail`, `app-top-bar`, and `app-shell` standalone components; preserve skip-link and `<main id="main" tabindex="-1">` landmarks.
3. **Phase 3a — Enrollments**: rewrite template + scss to two-column layout per mockup; convert select `[disabled]` bindings to `[attr.disabled]`; add section icons.
4. **Phase 3b — Student Search**: rewrite template to filter panel + initial state + results table; preserve `asOfDate` and `data-testid` values.
5. **Phase 3c — Teacher Contracts**: rewrite to split layout; replace checkbox selector with chip multiselect; add segmented control and badges.
6. **Phase 3d — Reports**: rewrite shell and three sub-components to Bento grid + KPI cards; add page-header segmented nav.
7. **Phase 4 — Verification**: add token-presence and reduced-motion tests, manually verify contrast pairings, run `npm run lint` and `npm test`.

Each phase is one conventional commit that leaves the tree green.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/styles.scss` | Modified | Replace token block; keep three legacy aliases |
| `src/index.html` | Modified | Add Google Fonts links for Manrope + Material Symbols Outlined |
| `src/app/app.component.{ts,html,scss}` | Modified | Restructure into shell + rail + top-bar (likely split into multiple files) |
| `src/app/features/enrollments/enrollment-create.component.{ts,html,scss}` | Modified | Two-column layout, EduCore tokens, `[attr.disabled]` on selects |
| `src/app/features/student-search/student-search.component.{ts,html,scss}` | Modified | Filter panel + initial state + EduCore-styled table |
| `src/app/features/teacher-contracts/teacher-contracts.component.{ts,html,scss}` | Modified | Split layout + chip multiselect + segmented control |
| `src/app/features/reports/reports-shell.component.{ts,html,scss}` | Modified | Bento grid + KPI cards + segmented page nav |
| `src/app/features/reports/{age-distribution,top-schools,teacher-counts-by-sector}/*` | Modified | Sub-component templates and scss to match mockup sections |
| `src/styles/_educore/**` | New | SCSS partials (tokens, primitives, shell pieces) |
| `src/app/layout/educore-shell/**` | New | `<app-rail>`, `<app-top-bar>` standalone components |
| `src/app/a11y/educore-tokens.spec.ts` | New | Asserts every documented token CSS variable present in stylesheet |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Token rename breaks existing a11y specs that grep `--app-muted`, `--app-accent`, `--app-border` | Med | Keep all three as aliases of the EduCore tokens; verify with grep |
| Angular 21 warning about `[disabled]` on Reactive Forms selects persists after refactor | Med | Replace every `[disabled]` with `[attr.disabled]` on FormControl-bound controls; rely on `formControl.disable()` API where appropriate |
| Existing `data-testid` values get renamed by accident, breaking a11y tests | Med | Enumerate every `data-testid` in gap analysis (section 5 R-A11Y-7) and assert preservation in code review |
| Page-title typography loads but Manrope font does not (CDN blocked, network failure) | Low | Use `font-display: swap` and `system-ui` fallback in stack so UI remains usable |
| Production build exceeds the 4kB anyComponentStyle warning due to expanded styles | Med | Keep template-level styles minimal; move shared primitives to global partial |
| Contrast on a documented pairing (e.g., `on-surface-variant` on `surface`) fails WCAG 2.2 AA at body-md | Low | Manual WebAIM contrast check before merge; documented in `design.md` |
| Mockup brand block uses a logo image; current brand says "Inovait · Gestión escolar municipal" | Med | **OPEN QUESTION** — flagged for user decision |
| Existing a11y specs get false-green if `--app-muted`/`--app-accent` aliases point to wrong color (pass grep, fail contrast) | Med | After aliasing, manually check that aliased color matches the documented intent |
| Refactor accidentally removes `<nav aria-label="Navegación principal">` | Low | Phase 2 PR is gated by `p0-a11y.routes.spec.ts` running green before merge |
| Teacher-contracts chip multiselect adds complexity that breaks the existing checkbox selector logic | Med | Chip multiselect reuses the existing `selectedSchoolIds` set; only the template and event handlers change |
| Reports KPI cards require data shape decisions (KPI label, value, trend) not in mockup | Med | KPI cards render whatever number the API returns + a static label; no trend indicator required for P0 of this change |

## Rollback Plan

Each phase is one commit on `feat/educore-ui-strict`. To roll back a single phase, revert that commit (e.g., `git revert <phase-sha>`). Each commit leaves the tree green, so any intermediate state is shippable. To roll back the entire change, revert the merge commit or reset the branch to `main`. No migration is required because tokens, components, and routes are renamed in place — there is no schema or persisted data affected.

If a critical regression is found after merge to `main`, the safest fast-rollback is `git revert` of the merge commit, which preserves history. Feature flags are not used (Angular project does not have a flag system today).

## Dependencies

- **Internal**: existing `core/api`, `core/catalogs`, facades, mappers, services — read-only.
- **External (CDN, not npm)**: Google Fonts for `Manrope` and Material Symbols Outlined. Loaded via `<link>` in `src/index.html`; no install needed.
- **Test infrastructure**: existing `vitest` + `TestBed` + `HttpTestingController` — sufficient for new tests.

## Success Criteria

- [ ] `npm run lint` exits 0 (typecheck, eslint with `--max-warnings=0`, prettier).
- [ ] `npm test` passes every existing spec, including `p0-a11y.routes.spec.ts`, `p0-a11y-reports.routes.spec.ts`, `p1-a11y-history.routes.spec.ts`.
- [ ] `npm test` produces zero `console.warn` / `console.error` output from tests (Angular 21 disabled-attribute warning is gone).
- [ ] `npm run build` succeeds within the existing budgets (initial 500kB warn / 1MB error, anyComponentStyle 4kB warn / 8kB error).
- [ ] Every documented token pairing listed in `ui-tokens/spec.md` passes WCAG 2.2 AA at body sizes (≥ 4.5:1) or large/UI sizes (≥ 3:1), verified manually with the WebAIM contrast checker and recorded in `design.md`.
- [ ] All four mockup layouts (`enrollments_desktop`, `student_search_desktop`, `teacher_contracts_desktop`, `reports_overview_desktop`) are reproduced at the component-template level, with the documented deviations called out in `design.md`.
- [ ] Conventional commits: one commit per phase (Phase 1 tokens / Phase 2 shell / Phase 3a enrollments / Phase 3b student-search / Phase 3c teacher-contracts / Phase 3d reports / Phase 4 verification). Each commit leaves the tree green.
