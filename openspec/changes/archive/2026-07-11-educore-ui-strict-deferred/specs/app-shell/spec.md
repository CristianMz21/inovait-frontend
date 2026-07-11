# Capability: `app-shell`

## Purpose

Define the EduCore Institutional UI app shell — a fixed 260 px left rail, a fixed 64 px app-bar, and a fluid main content canvas. The shell must preserve every accessibility landmark and invariant codified by the existing P0 / P1 a11y specs while restructuring the navigation from horizontal to vertical rail.

## Requirements

### Requirement: SHL-001 — Layout structure

The shell MUST render three regions: a fixed left nav rail of exactly `--space-rail-width` (`260px`), a fixed top app-bar of exactly `--space-app-bar-height` (`64px`), and a fluid main content canvas that fills the remaining viewport. The main canvas MUST cap its inner content at a sensible max width (e.g., `max-width: 1280px`) so ultra-wide displays do not break typographic line length.

#### Scenario: Three regions render with exact dimensions

- GIVEN the app is loaded,
- WHEN the shell renders,
- THEN `<nav class="app-rail">` occupies exactly `260px` of horizontal space on the left edge, anchored to the top and bottom of the viewport (`position: fixed`), AND `<header class="app-top-bar">` occupies exactly `64px` of vertical space at the top, anchored to the right of the rail, AND `<main id="main" tabindex="-1" role="main">` fills the remaining viewport area with `margin-left: 260px` and `margin-top: 64px`, AND the inner content has `max-width: 1280px` and is centered horizontally.

#### Scenario: Responsive collapse below 768 px

- GIVEN the viewport width is below `768px`,
- WHEN the shell renders,
- THEN the rail collapses to a vertical icon-only state (rail width stays `260px` but labels become hidden) OR the rail becomes a top hamburger menu (decision recorded in `design.md`); in either case the skip-link remains first focusable and the `<main id="main" tabindex="-1">` landmark is preserved.

### Requirement: SHL-002 — Skip-link and main landmark preserved

The shell MUST keep the skip-link as the first focusable element of the document, MUST keep `<main id="main" tabindex="-1">` as the main landmark, and MUST keep the primary navigation landmark with `aria-label="Navegación principal"` so that the existing P0 / P1 a11y specs continue to pass without modification.

#### Scenario: Skip-link first focusable

- GIVEN the app is loaded,
- WHEN the user presses `Tab` from the document's initial focus,
- THEN the first focused element is `<a class="skip-link" href="#main">Saltar al contenido principal</a>`, AND activating it moves focus to `<main id="main" tabindex="-1">`.

#### Scenario: Primary nav landmark preserved

- GIVEN the app is loaded,
- WHEN the DOM is inspected,
- THEN there is exactly one `<nav aria-label="Navegación principal">` element, AND it contains a link with visible text matching each of the five route labels: "Matrículas", "Consulta de estudiantes", "Contratos docentes", "Reportes", "Historia".

### Requirement: SHL-003 — Rail nav items and targets

The rail MUST expose five nav items in this fixed order: Enrollments (`/enrollments`), Student Search (`/student-search`), Teacher Contracts (`/teacher-contracts`), Reports (`/reports`), History (`/student-history`). Each item MUST render a 24 px Material Symbols Outlined icon AND a label-sm text label.

#### Scenario: Rail items present and ordered

- GIVEN the rail renders,
- WHEN the DOM is inspected,
- THEN the rail contains exactly five `<a>` elements with `routerLink` values `/enrollments`, `/student-search`, `/teacher-contracts`, `/reports`, `/student-history` in that order, AND each link contains exactly one `<span class="material-symbols-outlined">` icon (24 px) followed by a `<span class="app-rail-label">` text label.

#### Scenario: Route activation marks the correct item active

- GIVEN the user navigates to `/student-search`,
- WHEN the rail renders,
- THEN the `/student-search` link has the active styling (`bg-tertiary-fixed-dim/20`, `border-l-4 border-tertiary-container`, `text-on-tertiary-container`), AND the other four links render in the inactive styling (`opacity-80`, hover `bg-surface-container-high`).

### Requirement: SHL-004 — Active-state indicator

The active rail item MUST use a Soft Teal background and a 4 px vertical "indicator bar" on its left edge, matching the EduCore design system. The indicator bar MUST use `--tertiary-container` (`#002725`).

#### Scenario: Active item has indicator bar

- GIVEN a route is active,
- WHEN the corresponding rail item renders,
- THEN the item has `background-color: rgba(125, 213, 207, 0.2)` (i.e., `bg-tertiary-fixed-dim/20` against `--surface`), AND a `border-left: 4px solid var(--tertiary-container)` (the indicator bar), AND the text and icon colors use `--on-tertiary-container` (`#3a9791`).

#### Scenario: Inactive items have no indicator bar

- GIVEN a route is not active,
- WHEN the rail item renders,
- THEN the item has no left border, `opacity: 0.8`, `color: var(--on-surface-variant)`, AND hovering or focusing it transitions to `background-color: var(--surface-container-high)` (`#e1e8ff`).

### Requirement: SHL-005 — App-bar contents

The app-bar MUST contain: a brand title on the left ("EduCore Academy" or the project-equivalent decided in `design.md`); an "Academic Year" indicator chip on the right (label-xs uppercase); a "Switch School" tertiary button (label-sm, `--secondary` color); a notifications icon button; and an account icon button.

#### Scenario: App-bar elements render in order

- GIVEN the app-bar renders,
- WHEN the DOM is inspected from left to right,
- THEN the elements appear in this order: brand title (card-title `--primary`), Academic Year chip (label-xs uppercase `--on-surface-variant`), Switch School button (label-sm `--secondary`), notifications icon button (Material Symbol `notifications`), account icon button (Material Symbol `account_circle`).

#### Scenario: App-bar background matches EduCore

- GIVEN the app-bar renders,
- WHEN the computed style is read,
- THEN `background-color` equals `var(--surface-bright)` (`#f9f9ff`), `border-bottom: 1px solid var(--outline-variant)`, `height: 64px`.

### Requirement: SHL-006 — Breadcrumb behavior (page title reflection)

The main canvas MUST render a breadcrumb above each route's page title, reflecting the active rail item. The breadcrumb MUST use the documented label-sm styling where the current page is shown in `--secondary` (Institutional Indigo) and parent items (when present) in `--on-surface-variant`. For this change, only one level of breadcrumb is required (the active route label) since the app has no nested routes.

#### Scenario: Breadcrumb reflects active route

- GIVEN the user is on `/enrollments`,
- WHEN the main canvas renders,
- THEN a `<nav class="breadcrumb" aria-label="Ruta de navegación">` element appears directly above the page `<h1>`, containing a single `<span aria-current="page">` with the text "Matrículas" in `--secondary` color.

### Requirement: SHL-007 — Footer preserved

The shell MUST keep the existing `<footer role="contentinfo">` element with the text "Reportes operativos · Historia operativa" (verified by `p0-a11y-reports.routes.spec.ts` and `p1-a11y-history.routes.spec.ts`).

#### Scenario: Footer text unchanged

- GIVEN the app renders,
- WHEN the footer is inspected,
- THEN the footer text contains the substring "Reportes operativos · Historia operativa".
