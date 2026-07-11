# Capability: `feature-student-search`

## Purpose

Define the EduCore-aligned layout and behavior of the **Student Search** route (`/student-search`). The implementation reproduces `student_search_desktop/code.html` at the component-template level while preserving every accessibility invariant codified by `p0-a11y.routes.spec.ts` and every business rule from `student-search/spec.md` — including the `asOfDate` filter end-to-end.

## Requirements

### Requirement: SRCH-UI-001 — Page header matches EduCore

The page MUST render a `<h1 class="page-title" tabindex="-1">` with the text "Consulta de estudiantes", followed by a body-md subtitle describing the search filters and the optional `asOfDate` filter.

#### Scenario: Page title and subtitle render

- GIVEN the user is on `/student-search`,
- WHEN the route renders,
- THEN exactly one `<h1>` exists with `tabindex="-1"`, text "Consulta de estudiantes", `font-family: Manrope`, `font-size: 32px`, `font-weight: 700`, `letter-spacing: -0.02em`, AND the subtitle is rendered with `font-family: Inter`, `font-size: 15px`, `color: var(--on-surface-variant)`.

### Requirement: SRCH-UI-002 — Filter panel layout

The filter form MUST render inside a single panel (`<section class="filter-panel">`) with `background-color: var(--surface-container-lowest)`, `border: 1px solid var(--outline-variant)`, `border-radius: var(--radius-lg)` (`16px`), and `box-shadow: var(--shadow-ambient-card)`.

#### Scenario: Filter panel renders with EduCore styling

- GIVEN the route renders,
- WHEN the filter panel is inspected,
- THEN its computed `background-color` is `var(--surface-container-lowest)` AND `border-radius` is `16px` AND `box-shadow` equals `var(--shadow-ambient-card)` (`0px 4px 12px rgba(20, 33, 61, 0.08)`).

### Requirement: SRCH-UI-003 — Four-column filter grid

The filter form MUST render a 4-column CSS grid (`grid-template-columns: repeat(4, minmax(0, 1fr))`) with `gap: var(--space-md)`. The four columns MUST be: School, Grade, Academic Year, Search button. Each filter label MUST use the label-xs uppercase tracking-wider styling (`text-transform: uppercase`, `letter-spacing: 0.05em`, `font-weight: 600`).

#### Scenario: Four-column grid renders

- GIVEN the viewport is at least `1024px` wide,
- WHEN the filter form renders,
- THEN four `<label>` cells are present in this order: School (with `aria-required="true"`), Grade (with `aria-required="true"`), Academic Year (with `aria-required="true"`), and a primary search button cell, AND each label's text uses `text-transform: uppercase` AND `letter-spacing: 0.05em`.

#### Scenario: Filter grid collapses below 1024 px

- GIVEN the viewport is below `1024px`,
- WHEN the filter form renders,
- THEN the grid collapses to a single column with stacked fields, preserving the order.

### Requirement: SRCH-UI-004 — Searchable School selector

The School field MUST render as a searchable selector matching the mockup: a relative-positioned wrapper containing a `search` Material Symbols icon at the left edge (24 px), an `<input type="text">` with `pl-10 pr-8` padding, and a clear (X) button at the right edge when text is present.

#### Scenario: Searchable School renders with icons

- GIVEN the School field renders,
- WHEN the DOM is inspected,
- THEN the wrapper contains a `<span class="material-symbols-outlined">search</span>` icon at `left: 12px`, an `<input>` with `padding-left: 40px` and `padding-right: 32px`, AND a `<button>` with `<span class="material-symbols-outlined">close</span>` at `right: 12px` is present whenever the input has a value.

### Requirement: SRCH-UI-005 — Search CTA matches EduCore

The Search button MUST use `--tertiary-container` background, `--on-tertiary` text, label-sm typography, `--radius-control` border radius, full width within its grid cell, and a `search` Material Symbols icon prefix.

#### Scenario: Search CTA is styled

- GIVEN the Search button renders,
- WHEN the computed style is read,
- THEN `background-color` is `var(--tertiary-container)`, `color` is `var(--on-tertiary)`, `border-radius` is `10px` to `12px`, `width` is `100%` of its grid cell, AND the visible text is "Buscar" followed by a `search` icon.

#### Scenario: Submit preserves a11y invariants

- GIVEN the form renders,
- WHEN the submit button is inspected,
- THEN it has `type="submit"`, `aria-busy="false"` (idle), and `[disabled]` is bound only when the form is invalid OR loading.

### Requirement: SRCH-UI-006 — Initial state panel ("Ready to Search")

Before any search is performed, the route MUST render a centered initial-state panel with a 64 px circular icon container (`bg-surface-container`), a section-title "Listo para buscar" (or aligned Spanish copy), and a body-md description.

#### Scenario: Initial state renders before first search

- GIVEN the user has not yet performed a search,
- WHEN the route renders,
- THEN a `<div data-testid="search-initial">` element is visible with `display: flex; flex-direction: column; align-items: center; padding: 100px var(--space-lg)`, AND contains a `<span class="material-symbols-outlined">travel_explore</span>` icon inside a 64 px circular container, AND a section-title heading, AND a body-md description.

#### Scenario: Initial state hidden after search

- GIVEN the user has performed at least one search,
- WHEN the route renders the result state (`loading`, `empty`, `success`, `error`),
- THEN the initial-state panel is NOT visible (`@if (searchState() === "idle")` in the template).

### Requirement: SRCH-UI-007 — Results table styled to EduCore

The results table MUST use the EduCore table styling: `bg-surface` body, `bg-surface-container-lowest` sticky header, label-xs uppercase bold navy headers (`text-primary`, `text-transform: uppercase`, `letter-spacing: 0.05em`, `font-weight: 700`), `border-bottom: 1px solid var(--outline-variant)` row dividers, and `hover: bg-surface-container-lowest/50` row hover.

#### Scenario: Results table headers use label-xs uppercase

- GIVEN the results table renders,
- WHEN the table header row is inspected,
- THEN each `<th scope="col">` has computed `text-transform: uppercase`, `letter-spacing: 0.05em`, `font-weight: 700`, `color: var(--primary)`, AND `font-size: 12px`.

#### Scenario: Results table preserves existing a11y invariants

- GIVEN the results table renders,
- WHEN the DOM is inspected,
- THEN the table contains a `<caption class="visually-hidden">` with descriptive text AND every column header has `scope="col"` AND the results root element has `role="region"`, `aria-labelledby="results-title"`, `data-testid="search-results"`.

### Requirement: SRCH-UI-008 — `asOfDate` filter preserved end-to-end

The optional `asOfDate` input MUST remain in the filter form, MUST pass its value through the facade to the request, MUST survive a retry, and MUST be preserved on error (the existing a11y spec asserts `expect(component.form.controls.documentType.value).toBe(...)` for this).

#### Scenario: `asOfDate` field is present and labelled

- GIVEN the filter form renders,
- WHEN the DOM is inspected,
- THEN a label with the text "Fecha de referencia (opcional)" is associated with an `<input type="date" formControlName="asOfDate">`, AND helper text "Si la deja vacía, se usa la fecha actual." is present with `id="as-of-help"` referenced by `aria-describedby`.

#### Scenario: `asOfDate` is preserved on error

- GIVEN the user submits a search with a non-empty `asOfDate`,
- WHEN the backend returns a 404 ProblemDetails,
- THEN the rendered form retains the same `asOfDate` value AND the error region renders with `role="alert"`.

### Requirement: SRCH-UI-009 — Empty state

On a 200 response with empty results, the implementation MUST render an empty region with `role="status"`, `aria-live="polite"`, `data-testid="search-empty"`, section-title "Sin coincidencias", body-md description, and a "Reintentar" button.

#### Scenario: Empty state renders after 200 []

- GIVEN the backend returned 200 with an empty list,
- WHEN the route renders the empty state,
- THEN the root element has `role="status"`, `aria-live="polite"`, `data-testid="search-empty"`, AND a "Reintentar" button is present.

### Requirement: SRCH-UI-010 — Loading and error regions

The route MUST continue to expose a loading region with `data-testid="search-loading"` and an error region with `data-testid="search-error"` styled per EduCore tones (loading: `--surface-container` background; error: `--error-container` background, `--on-error-container` text, `border-radius: var(--radius-lg)`).

#### Scenario: Loading region renders during fetch

- GIVEN a search is in flight,
- WHEN the route renders,
- THEN a `<p data-testid="search-loading" role="status" aria-live="polite">` is visible with the text "Consultando inscripciones…", `background-color: var(--surface-container)`, `border-radius: var(--radius-lg)`.

#### Scenario: Error region renders on failure

- GIVEN the backend returned a 404 ProblemDetails,
- WHEN the route renders,
- THEN the error region has `role="alert"`, `aria-live="assertive"`, `data-testid="search-error"`, `background-color: var(--error-container)`, `color: var(--on-error-container)`, `border-radius: var(--radius-lg)`, AND a "Reintentar" button is present.
