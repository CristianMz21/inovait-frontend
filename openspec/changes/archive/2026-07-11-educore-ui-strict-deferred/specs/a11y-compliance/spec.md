# Capability: `a11y-compliance`

## Purpose

Define the WCAG 2.2 AA accessibility invariants that the EduCore refactor MUST preserve, the new automated checks that the refactor MUST add, and the manual verification steps required before each phase gate. This capability is the contract between the design system and the existing a11y specs (`p0-a11y.routes.spec.ts`, `p0-a11y-reports.routes.spec.ts`, `p1-a11y-history.routes.spec.ts`).

## Requirements

### Requirement: A11Y-001 — Preserved P0/P1 invariants

Every accessibility invariant currently asserted by the existing P0 / P1 a11y specs MUST continue to hold after the refactor. The full enumeration of preserved invariants is listed below.

#### Scenario: Shell invariants preserved

- GIVEN the app is loaded in any route,
- WHEN the DOM is inspected,
- THEN `<a class="skip-link" href="#main">Saltar al contenido principal</a>` is the first focusable element AND `<main id="main" tabindex="-1">` exists with `role="main"` AND `<nav aria-label="Navegación principal">` exists with the five nav labels "Matrículas", "Consulta de estudiantes", "Contratos docentes", "Reportes", "Historia".

#### Scenario: Per-route h1 invariants preserved

- GIVEN any of the five routes is loaded,
- WHEN the DOM is inspected,
- THEN there is exactly one `<h1>` element with `tabindex="-1"` AND `h1.tabIndex === -1` AND the visible text matches: "Nueva matrícula" (enrollments), "Consulta de estudiantes" (student-search), "Contratos docentes" (teacher-contracts), "Municipal Overview" or aligned text (reports), "Historial académico-docente" (student-history).

#### Scenario: Form grouping invariants preserved

- GIVEN any route with a form renders,
- WHEN the DOM is inspected,
- THEN each form group is wrapped in a `<fieldset>` with a non-empty `<legend>` AND each required control has `aria-required="true"` AND each submit button has `type="submit"` AND `aria-busy="false"` in the idle state.

#### Scenario: Remote-state ARIA invariants preserved

- GIVEN any route is in a remote state (loading / empty / success / error),
- WHEN the DOM is inspected,
- THEN the corresponding region has the asserted `data-testid` AND `role="status"` for loading/empty/success AND `role="alert"` for error AND `aria-live` is set appropriately (`polite` for status, `assertive` for alert).

#### Scenario: Reports table invariants preserved

- GIVEN the reports route renders a results table,
- WHEN the DOM is inspected,
- THEN each table has `<caption class="visually-hidden">` with descriptive text AND every column header has `scope="col"` AND the count of `th[scope="col"]` matches the spec assertions (3 for age distribution, 2 for sector report, 3 for top schools, plus the existing student-search and teacher-contracts assertions).

### Requirement: A11Y-002 — Token alias invariants preserved

The refactor MUST keep three legacy CSS custom property names available as aliases of the new EduCore tokens, because the existing a11y specs grep these names literally.

#### Scenario: Legacy token aliases are present

- GIVEN the global stylesheet is compiled,
- WHEN the stylesheet text is inspected,
- THEN the substring `--app-muted` appears AND the substring `--app-accent` appears AND the substring `--app-border` appears, AND each alias resolves to its documented EduCore target (`var(--on-surface-variant)`, `var(--secondary)`, `var(--outline-variant)` respectively).

### Requirement: A11Y-003 — Responsive and motion invariants preserved

The refactor MUST preserve the 320 px media query and the `prefers-reduced-motion` rule already required by the a11y specs.

#### Scenario: 320 px media query is present

- GIVEN the global stylesheet is compiled,
- WHEN the stylesheet text is inspected,
- THEN the substring `max-width: 320px` appears (asserted by `p0-a11y-reports.routes.spec.ts` and `p1-a11y-history.routes.spec.ts`).

#### Scenario: `prefers-reduced-motion` is honored

- GIVEN the global stylesheet is compiled,
- WHEN the stylesheet text is inspected,
- THEN a `@media (prefers-reduced-motion: reduce)` rule is present (asserted by `p1-a11y-history.routes.spec.ts`), AND animations and transitions are reduced to a near-zero duration inside that media query.

### Requirement: A11Y-004 — New token-presence spec

A new spec file `src/app/a11y/educore-tokens.spec.ts` MUST assert that every documented EduCore token (colors, typography, spacing, radius, shadow) is declared in the compiled stylesheet.

#### Scenario: Every required EduCore color token is declared

- GIVEN the global stylesheet is compiled,
- WHEN the spec runs,
- THEN it greps the stylesheet for each of the 50+ color token names listed in `ui-tokens/spec.md` (TKN-001) and asserts each is present.

#### Scenario: Every required EduCore typography token is declared

- GIVEN the global stylesheet is compiled,
- WHEN the spec runs,
- THEN it greps the stylesheet for each of the 8 typography role prefixes (`--type-page-title`, `--type-page-title-mobile`, `--type-section-title`, `--type-card-title`, `--type-body-lg`, `--type-body-md`, `--type-label-sm`, `--type-label-xs`) and asserts each is present.

#### Scenario: Every required spacing and radius token is declared

- GIVEN the global stylesheet is compiled,
- WHEN the spec runs,
- THEN it greps the stylesheet for each spacing token (`--space-xs` through `--space-xxl`, `--space-rail-width`, `--space-app-bar-height`, `--space-gutter`) and each radius token (`--radius-sm`, `--radius-default`, `--radius-md`, `--radius-lg`, `--radius-control`, `--radius-badge`) and asserts each is present.

### Requirement: A11Y-005 — Manual WCAG 2.2 AA contrast verification

For every documented color pairing listed in `ui-tokens/spec.md` (TKN-006), the contrast ratio MUST be measured manually with the WebAIM Contrast Checker (or equivalent) and recorded in `design.md` under "WCAG 2.2 AA Contrast Verification". If any pairing fails, the implementation MUST adjust the token value OR document an explicit deviation.

#### Scenario: All documented pairings pass WCAG 2.2 AA

- GIVEN the implementation is complete,
- WHEN the verification phase runs,
- THEN `design.md` lists every pairing from TKN-006 with its actual measured contrast ratio, AND every pairing meets the required threshold (≥ 4.5:1 for body text, ≥ 3:1 for UI components / large text), AND any deviation is explicitly justified.

### Requirement: A11Y-006 — Zero console warnings from test suite

The test suite MUST run with zero `console.warn` and zero `console.error` output (other than expected ones from intentional test fixtures). In particular, the Angular 21 warning about the `disabled` attribute on Reactive Forms controls MUST NOT appear.

#### Scenario: Angular 21 disabled-attribute warning is gone

- GIVEN `npm test` runs,
- WHEN the test output is captured,
- THEN there is no message containing the substrings "disabled" + "form control" / "NG0913" / equivalent Angular 21 warning text.

### Requirement: A11Y-007 — Material Symbols icons are decorative by default

Every Material Symbols Outlined icon used in the new templates MUST either be `aria-hidden="true"` (decorative) or have an `aria-label` / `aria-labelledby` association (semantic). Icons that are purely visual (e.g., section header icons, dropdown chevrons, KPI card icons) MUST be `aria-hidden="true"`.

#### Scenario: Decorative icons are aria-hidden

- GIVEN a section header icon (e.g., `badge`, `domain`, `groups`, `analytics`) renders,
- WHEN the DOM is inspected,
- THEN the icon's parent or the icon itself has `aria-hidden="true"`.

#### Scenario: Semantic icon buttons have accessible names

- GIVEN an icon-only button renders (e.g., notifications, account, more_vert),
- WHEN the DOM is inspected,
- THEN the button has an accessible name via `aria-label`, `aria-labelledby`, or visible text content.
