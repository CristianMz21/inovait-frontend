# Tasks: educore-ui-strict — EduCore Institutional UI refactor

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,200 – 1,800 (human) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | One PR per phase (7 PRs total) |
| Delivery strategy | `ask-on-risk` (default) |
| Chain strategy | `feature-branch-chain` (PRs target the previous PR's branch; only the tracker merges to `main`) |
| Decision needed before apply | Yes |
| 400-line budget risk | High |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Token layer + font loading + token-presence spec | PR 1 | Base branch: `feat/educore-ui-strict` (tracker). Touches `src/styles.scss`, `src/index.html`, new `src/styles/_educore/*` |
| 2 | Shell restructure (rail + app-bar + breadcrumb) | PR 2 | Base branch: PR 1 branch. Touches `src/app/app.component.*`, new `src/app/layout/educore-shell/*` |
| 3 | Enrollments feature refactor | PR 3 | Base branch: PR 2 branch. Touches `src/app/features/enrollments/enrollment-create.component.*` |
| 4 | Student Search feature refactor | PR 4 | Base branch: PR 3 branch. Touches `src/app/features/student-search/student-search.component.*` |
| 5 | Teacher Contracts feature refactor | PR 5 | Base branch: PR 4 branch. Touches `src/app/features/teacher-contracts/teacher-contracts.component.*` |
| 6 | Reports feature refactor | PR 7 | Base branch: PR 5 branch. Touches `src/app/features/reports/**` and adds new `kpi-card` primitive |
| 7 | Verification: contrast checks + final gate | PR 8 | Base branch: PR 7 branch. No source files; updates `design.md` contrast table |

If the user prefers a single PR with `size:exception`, that path is also viable (the forecast is High but bounded — total human lines are ~1,500, which is below the chained-PR total but above the 400-line budget). The default recommendation is `feature-branch-chain` to keep each PR reviewable.

---

## Phase 1 — Tokens (PR 1, base: `feat/educore-ui-strict`)

- [ ] 1.1 Create `src/styles/_educore/_tokens.scss` with every EduCore color, typography, spacing, radius, and shadow token declared as a CSS custom property on `:root`, with the exact hex / px / em values from `DESIGN.md`.
  - Files: `src/styles/_educore/_tokens.scss` (new)
  - Dependencies: none
  - Verification: visual inspection of the file; spot-check three random tokens against `DESIGN.md`.
  - Rollback: delete the file.
- [ ] 1.2 Replace `:root` token block in `src/styles.scss` with `@use './styles/educore' as *;` (or equivalent `@import`), keep `:focus-visible` and `@media (prefers-reduced-motion: reduce)` rules, and add three legacy aliases: `--app-muted: var(--on-surface-variant)`, `--app-accent: var(--secondary)`, `--app-border: var(--outline-variant)`.
  - Files: `src/styles.scss` (modify)
  - Dependencies: 1.1
  - Verification: `npm run lint:style` passes; manual check that `--app-muted`, `--app-accent`, `--app-border` strings exist in the compiled stylesheet.
  - Rollback: revert file, keep new partial as orphan.
- [ ] 1.3 Add `<link>` tags to `src/index.html` for Google Fonts: `Manrope:wght@400;600;700`, `Inter:wght@400;500;600`, `Material Symbols Outlined`.
  - Files: `src/index.html` (modify)
  - Dependencies: none
  - Verification: `npm run build` succeeds; manual check in browser DevTools that fonts load.
  - Rollback: revert file.
- [ ] 1.4 Create `src/app/a11y/educore-tokens.spec.ts` that greps the compiled stylesheet for every required token name (50+ colors, 8 typography roles, 10 spacing tokens, 6 radius tokens, 3 legacy aliases, 320 px media query, `prefers-reduced-motion`) and asserts each is present.
  - Files: `src/app/a11y/educore-tokens.spec.ts` (new)
  - Dependencies: 1.2
  - Verification: `npm test -- educore-tokens` passes; the assertion list mirrors the table in `ui-tokens/spec.md`.
  - Rollback: delete the file.
- [ ] **Phase 1 gate**: `npm run lint` exits 0; `npm test -- educore-tokens` passes; `npm test -- p0-a11y` passes; `npm run build` succeeds.

## Phase 2 — Shell (PR 2, base: PR 1 branch)

- [ ] 2.1 Create `src/app/layout/educore-shell/app-rail.component.{ts,html,scss}` standalone component. Render brand block (text "Inovait · Gestión escolar municipal" or aligned EduCore copy — see `design.md` open questions) + five nav items (Enrollments, Student Search, Teacher Contracts, Reports, History) + decorative Settings/Support stubs at bottom. Active item uses Soft Teal background + 4 px indicator bar.
  - Files: `src/app/layout/educore-shell/app-rail.component.{ts,html,scss}` (new)
  - Dependencies: 1 (tokens must be available)
  - Verification: unit test asserts 5 `<a>` links in correct order, active class on the matching route.
  - Rollback: delete the files.
- [ ] 2.2 Create `src/app/layout/educore-shell/app-top-bar.component.{ts,html,scss}` standalone component. Render brand title + Academic Year chip + Switch School button + Notifications icon button + Account icon button. `background-color: var(--surface-bright)`, `height: 64px`.
  - Files: `src/app/layout/educore-shell/app-top-bar.component.{ts,html,scss}` (new)
  - Dependencies: 1
  - Verification: unit test asserts 5 child elements in correct order; computed style assertion for `height: 64px`.
  - Rollback: delete the files.
- [ ] 2.3 Create `src/app/layout/educore-shell/breadcrumb.component.{ts,html,scss}` standalone component. Reads active route label from `Router.events` and renders `<nav aria-label="Ruta de navegación"><span aria-current="page">label</span></nav>`.
  - Files: `src/app/layout/educore-shell/breadcrumb.component.{ts,html,scss}` (new)
  - Dependencies: 1, 2.1
  - Verification: unit test using `RouterTestingHarness` asserts label matches active route.
  - Rollback: delete the files.
- [ ] 2.4 Create `src/app/layout/educore-shell/app-shell.component.{ts,html,scss}` standalone component. Render `<app-rail>`, `<app-top-bar>`, and `<main><router-outlet /></main>`. The main has `margin-left: var(--space-rail-width)`, `margin-top: var(--space-app-bar-height)`.
  - Files: `src/app/layout/educore-shell/app-shell.component.{ts,html,scss}` (new)
  - Dependencies: 2.1, 2.2
  - Verification: unit test asserts `<main id="main" tabindex="-1">` exists with correct computed margins.
  - Rollback: delete the files.
- [ ] 2.5 Restructure `src/app/app.component.{ts,html,scss}` to render skip-link → `<app-shell>` (which renders `<app-rail>`, `<app-top-bar>`, breadcrumb above outlet, main outlet). Preserve `<main id="main" tabindex="-1">`, `<nav aria-label="Navegación principal">`, footer with "Reportes operativos · Historia operativa".
  - Files: `src/app/app.component.{ts,html,scss}` (modify)
  - Dependencies: 2.1, 2.2, 2.3, 2.4
  - Verification: `npm test -- p0-a11y.routes.spec.ts` passes; `npm test -- p0-a11y-reports.routes.spec.ts` passes; `npm test -- p1-a11y-history.routes.spec.ts` passes.
  - Rollback: revert files.
- [ ] **Phase 2 gate**: `npm run lint` exits 0; all three existing a11y specs pass; `npm test -- educore-tokens` passes; `npm run build` succeeds.

## Phase 3a — Enrollments (PR 3, base: PR 2 branch)

- [ ] 3a.1 Restructure `src/app/features/enrollments/enrollment-create.component.html` to two-column 12-col grid (Student Identity `col-span-7` + Academic Placement `col-span-5`). Add section icons (`badge`, `domain`). Replace every `[disabled]` binding on FormControl-bound controls with `[attr.disabled]="condition ? '' : null"`.
  - Files: `src/app/features/enrollments/enrollment-create.component.html` (modify)
  - Dependencies: 2
  - Verification: `npm test -- enrollment-create.component.spec.ts` passes; `npm test -- p0-a11y.routes.spec.ts` passes.
  - Rollback: revert file.
- [ ] 3a.2 Update `src/app/features/enrollments/enrollment-create.component.scss` to use EduCore tokens (10-12 px control radius, 12 px padding, `--secondary` focus ring, two-column grid, section header with bottom divider, success/error tinted regions with 16 px radius).
  - Files: `src/app/features/enrollments/enrollment-create.component.scss` (modify)
  - Dependencies: 3a.1
  - Verification: visual snapshot in browser matches `enrollments_desktop/code.html` structure; computed style assertions in spec for radius / padding / focus ring.
  - Rollback: revert file.
- [ ] 3a.3 Add ClassGroup skeleton loader (placeholder for new `<app-skeleton>` primitive from Phase 4 — for this phase, inline a div with `bg-surface-container-highest` and `animate-pulse`).
  - Files: `src/app/features/enrollments/enrollment-create.component.html` + `.scss` (modify)
  - Dependencies: 3a.1, 3a.2
  - Verification: `npm test -- enrollment-create.component.spec.ts` still passes; manual visual check shows skeleton during loading.
  - Rollback: revert files.
- [ ] **Phase 3a gate**: `npm run lint` exits 0; `npm test -- enrollment-create` passes; `npm test -- p0-a11y.routes.spec.ts` passes; `npm run build` succeeds with anyComponentStyle ≤ 4 kB.

## Phase 3b — Student Search (PR 4, base: PR 3 branch)

- [ ] 3b.1 Restructure `src/app/features/student-search/student-search.component.html` to single filter panel with 4-col grid (School, Grade, Academic Year, Search CTA). Add `data-testid="search-initial"` panel with "Ready to Search" centered content. Replace static `disabled` attribute on the "Ver historial" button with `aria-disabled="true"` only. Preserve `asOfDate` field with `id="as-of-help"`.
  - Files: `src/app/features/student-search/student-search.component.html` (modify)
  - Dependencies: 2
  - Verification: `npm test -- student-search.component.spec.ts` passes; `npm test -- p0-a11y.routes.spec.ts` passes.
  - Rollback: revert file.
- [ ] 3b.2 Update `src/app/features/student-search/student-search.component.scss` to use EduCore tokens: filter panel with 16 px radius + ambient shadow; 4-col grid (`grid-cols-4 gap-md`); initial-state panel (`py-[100px]`, centered); label-xs uppercase tracking-wider on filter labels; EduCore table styling (label-xs uppercase bold navy headers, sticky `bg-surface-container-lowest` header).
  - Files: `src/app/features/student-search/student-search.component.scss` (modify)
  - Dependencies: 3b.1
  - Verification: visual snapshot matches `student_search_desktop/code.html` structure.
  - Rollback: revert file.
- [ ] **Phase 3b gate**: `npm run lint` exits 0; `npm test -- student-search` passes; `npm test -- p0-a11y.routes.spec.ts` passes; `npm run build` succeeds with anyComponentStyle ≤ 4 kB.

## Phase 3c — Teacher Contracts (PR 5, base: PR 4 branch)

- [ ] 3c.1 Create the chip multiselect primitive as an inline structure inside `teacher-contracts.component.html` (no separate component for this phase): relative-positioned container with `min-height: 48px`, one `<span class="chip">` per selected school with cancel icon, trailing `<input>` for adding more.
  - Files: `src/app/features/teacher-contracts/teacher-contracts.component.html` (modify)
  - Dependencies: 2
  - Verification: `npm test -- teacher-contracts.component.spec.ts` passes; existing `onToggleSchool(id, false)` is wired to chip removal.
  - Rollback: revert file.
- [ ] 3c.2 Restructure `src/app/features/teacher-contracts/teacher-contracts.component.html` to split 12-col layout (`col-span-4` Create Contract form + `col-span-8` Existing Contracts table). Add dates 2-col grid. Add segmented control "Activo | Todo el historial" in the table header. Add status badge with dot indicator and validity pill badge per row.
  - Files: `src/app/features/teacher-contracts/teacher-contracts.component.html` (modify)
  - Dependencies: 3c.1
  - Verification: `npm test -- teacher-contracts.component.spec.ts` passes; `npm test -- p0-a11y.routes.spec.ts` passes.
  - Rollback: revert file.
- [ ] 3c.3 Update `src/app/features/teacher-contracts/teacher-contracts.component.scss` to use EduCore tokens: split layout grid, chip multiselect styling, segmented control, badge primitives (rounded-full pill for validity, dot indicator for persisted status), EduCore button styling.
  - Files: `src/app/features/teacher-contracts/teacher-contracts.component.scss` (modify)
  - Dependencies: 3c.2
  - Verification: visual snapshot matches `teacher_contracts_desktop/code.html` structure; anyComponentStyle ≤ 4 kB.
  - Rollback: revert file.
- [ ] 3c.4 Add `onSegmentClick(segment)` handler to `teacher-contracts.component.ts` that updates a local `activeSegment` signal and re-filters the existing contracts list. Re-uses the existing `selectedSchoolIds` set and `onToggleSchool` for chip removal.
  - Files: `src/app/features/teacher-contracts/teacher-contracts.component.ts` (modify)
  - Dependencies: 3c.2
  - Verification: unit test for `onSegmentClick` updates `activeSegment` signal; existing tests still pass.
  - Rollback: revert file.
- [ ] **Phase 3c gate**: `npm run lint` exits 0; `npm test -- teacher-contracts` passes; `npm test -- p0-a11y.routes.spec.ts` passes; `npm run build` succeeds with anyComponentStyle ≤ 4 kB.

## Phase 3d — Reports (PR 6, base: PR 5 branch)

- [ ] 3d.1 Create `src/app/features/reports/kpi-card/kpi-card.component.{ts,html,scss}` standalone component. Inputs: `title`, `value`, `icon`, `trend?`, `variant?` (`default` | `featured`). Renders default (white surface) or featured (gradient) variant.
  - Files: `src/app/features/reports/kpi-card/kpi-card.component.{ts,html,scss}` (new)
  - Dependencies: 1
  - Verification: unit test renders both variants; computed style assertions match design tokens.
  - Rollback: delete files.
- [ ] 3d.2 Restructure `src/app/features/reports/reports-shell.component.html` to page-header segmented control (Distribución por edad | Docentes por sector | Escuelas líderes | Historial del estudiante) + three `<section>` landmarks. Replace fragment-based internal nav.
  - Files: `src/app/features/reports/reports-shell.component.html` (modify)
  - Dependencies: 2
  - Verification: `npm test -- reports-shell.component.spec.ts` passes; `npm test -- p0-a11y-reports.routes.spec.ts` passes; section labels unchanged.
  - Rollback: revert file.
- [ ] 3d.3 Update `src/app/features/reports/reports-shell.component.ts` to add `activeSection` signal and `onSegmentClick(sectionId)` handler that scrolls to the matching section.
  - Files: `src/app/features/reports/reports-shell.component.ts` (modify)
  - Dependencies: 3d.2
  - Verification: unit test for `onSegmentClick` updates `activeSection`; existing tests pass.
  - Rollback: revert file.
- [ ] 3d.4 Restructure `src/app/features/reports/age-distribution/age-distribution.component.html` to Bento 12-col grid (`col-span-3` filter panel + `col-span-9` KPI cards grid of 3). Use `<app-kpi-card>` for Ages 3-7 (featured), Ages 8-12 (default), Over 12 (default).
  - Files: `src/app/features/reports/age-distribution/age-distribution.component.{html,scss}` (modify)
  - Dependencies: 3d.1
  - Verification: `npm test -- age-distribution.component.spec.ts` passes; `npm test -- p0-a11y-reports.routes.spec.ts` passes.
  - Rollback: revert files.
- [ ] 3d.5 Restructure `src/app/features/reports/teacher-counts-by-sector/teacher-counts-by-sector.component.html` to 2-col grid of 2 KPI cards (Public, Private) using `<app-kpi-card>`.
  - Files: `src/app/features/reports/teacher-counts-by-sector/teacher-counts-by-sector.component.{html,scss}` (modify)
  - Dependencies: 3d.1
  - Verification: `npm test -- teacher-counts-by-sector.component.spec.ts` passes; `npm test -- p0-a11y-reports.routes.spec.ts` passes.
  - Rollback: revert files.
- [ ] 3d.6 Restructure `src/app/features/reports/top-schools/top-schools.component.html` to keep the existing filter panel and table, but add a single KPI card ("Matrícula máxima") above the table.
  - Files: `src/app/features/reports/top-schools/top-schools.component.{html,scss}` (modify)
  - Dependencies: 3d.1
  - Verification: `npm test -- top-schools.component.spec.ts` passes; `npm test -- p0-a11y-reports.routes.spec.ts` passes; `<th scope="col">` count assertion (3) still passes.
  - Rollback: revert files.
- [ ] **Phase 3d gate**: `npm run lint` exits 0; all three report component specs pass; `npm test -- p0-a11y-reports.routes.spec.ts` passes; `npm run build` succeeds with anyComponentStyle ≤ 4 kB per component.

## Phase 4 — Verification (PR 7, base: PR 6 branch)

- [ ] 4.1 Manually verify WCAG 2.2 AA contrast for every documented pairing in `ui-tokens/spec.md` TKN-006 using WebAIM Contrast Checker. Update the contrast table in `design.md` with measured values. If any pairing fails, fix the token value in `_tokens.scss` and re-run 4.1.
  - Files: `design.md` (modify — table fill-in), possibly `src/styles/_educore/_tokens.scss` (modify — adjust failing tokens)
  - Dependencies: 3 (all phases complete)
  - Verification: every row in the contrast table is filled with a measured value ≥ required threshold.
  - Rollback: revert design.md changes; failing tokens are tracked as known deviations.
- [ ] 4.2 Run `npm run lint`; capture exit code. Run `npm test --reporter=verbose`; capture full output and grep for `console.warn` / `console.error` and "NG0913" or similar Angular 21 disabled warning.
  - Files: none modified (read-only verification)
  - Dependencies: 4.1
  - Verification: `npm run lint` exits 0; `console.warn` and `console.error` greps return zero expected lines.
  - Rollback: not applicable.
- [ ] 4.3 Run `npm run build` and verify the bundle is within the documented budgets (initial 500 kB warn / 1 MB error, anyComponentStyle 4 kB warn / 8 kB error). If anyComponentStyle exceeds the budget, extract more styles to global partials in `src/styles/_educore/`.
  - Files: `src/styles/_educore/*.scss` (possibly new) + component `.scss` (possibly modify to import partial)
  - Dependencies: 4.1
  - Verification: `npm run build` exits 0; bundle sizes within budgets.
  - Rollback: revert files.
- [ ] **Phase 4 gate**: all five pre-apply gates pass; `design.md` contrast table fully populated; the change is ready for merge to `main`.
