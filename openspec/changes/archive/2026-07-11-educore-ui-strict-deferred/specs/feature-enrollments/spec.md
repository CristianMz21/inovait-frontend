# Capability: `feature-enrollments`

## Purpose

Define the EduCore-aligned layout and behavior of the **Enrollments** route (`/enrollments`). The implementation reproduces `enrollments_desktop/code.html` at the component-template level while preserving every accessibility invariant codified by `p0-a11y.routes.spec.ts` and every business rule from `enrollment-management/spec.md`.

## Requirements

### Requirement: ENR-UI-001 — Page header matches EduCore

The page MUST render a `<h1 class="page-title" tabindex="-1">` with the text "Nueva matrícula" (or equivalent aligned with EduCore copy decisions documented in `design.md`), followed by a body-md subtitle (`<p class="page-subtitle">`) describing the cascade behaviour.

#### Scenario: Page title and subtitle render

- GIVEN the user is on `/enrollments`,
- WHEN the route renders,
- THEN exactly one `<h1>` exists with `tabindex="-1"` AND the computed `font-family` is `Manrope` AND `font-size` is `32px` AND `font-weight` is `700` AND `letter-spacing` is `-0.02em`, AND the subtitle is rendered with `font-family: Inter`, `font-size: 15px`, `color: var(--on-surface-variant)`, `max-width: 768px`.

### Requirement: ENR-UI-002 — Two-column form layout (12-col grid)

The form MUST render inside a 12-column CSS grid where the **Student Identity** card spans `grid-column: span 7` and the **Academic Placement** card spans `grid-column: span 5`, with a gutter of `--space-lg` (`24px`).

#### Scenario: Two-column grid renders on desktop

- GIVEN the viewport is at least `1024px` wide,
- WHEN the form renders,
- THEN two `<section>` cards are present: the left card contains the Student Identity fields (Document Type, Document Number, First Names, Last Names, Date of Birth) and the right card contains the Academic Placement fields (School, Academic Year, Grade, Class Group), AND the two cards sit side-by-side with a 24 px gap, AND each card has `background-color: var(--surface-container-lowest)`, `border: 1px solid var(--outline-variant)`, `border-radius: 16px` (`--radius-lg`), and `padding: var(--space-lg)`.

#### Scenario: Cards stack on viewports below 1024 px

- GIVEN the viewport is below `1024px`,
- WHEN the form renders,
- THEN the Student Identity card and Academic Placement card stack vertically (single column), preserving all internal field groups.

### Requirement: ENR-UI-003 — Section headers with icons

Each section card MUST render a header row with a 24 px Material Symbols Outlined icon in `--secondary` color and a section-title heading (`Manrope 22px / 600`).

#### Scenario: Student Identity header renders

- GIVEN the form renders,
- WHEN the Student Identity card header is inspected,
- THEN it contains a `<span class="material-symbols-outlined">badge</span>` icon at 24 px in `--secondary` color followed by a `<h2 class="section-title">Student Identity</h2>` (or "Datos del estudiante" if Spanish copy is kept; the exact text is decided in `design.md`), AND a 1 px `border-bottom: var(--outline-variant)` divider below the header.

#### Scenario: Academic Placement header renders

- GIVEN the form renders,
- WHEN the Academic Placement card header is inspected,
- THEN it contains a `<span class="material-symbols-outlined">domain</span>` icon at 24 px in `--secondary` color followed by a `<h2 class="section-title">Academic Placement</h2>`, AND a 1 px `border-bottom: var(--outline-variant)` divider below.

### Requirement: ENR-UI-004 — Form inputs styled to EduCore

Every text input, date input, and select MUST use a 10-12 px border radius (`--radius-control`), 1 px `var(--outline-variant)` border, 12 px vertical padding, `body-md` typography, and a 2 px focus ring in `--secondary` color. Focus state MUST use both `border-color: var(--secondary)` and `box-shadow: 0 0 0 2px var(--secondary)`.

#### Scenario: Inputs use EduCore control radius

- GIVEN any input, date input, or select in the form,
- WHEN the computed style is read,
- THEN `border-radius` is between `10px` and `12px` (inclusive) AND `padding-top` is `12px` AND `padding-bottom` is `12px` AND `border-color` is `var(--outline-variant)` (`#c5c6ce`).

#### Scenario: Focus ring is visible

- GIVEN an input has focus via keyboard,
- WHEN the focus state is observed,
- THEN `outline: none` is applied (so the custom ring takes over) AND `border-color: var(--secondary)` is set AND `box-shadow: 0 0 0 2px var(--secondary)` is set.

### Requirement: ENR-UI-005 — Fieldset grouping preserved

Each form group (Student Identity, Academic Placement) MUST continue to render inside a `<fieldset>` with a `<legend>` so that the existing a11y invariant (`expect(fieldsets.length).toBeGreaterThanOrEqual(2)`) remains green.

#### Scenario: Fieldsets and legends preserved

- GIVEN the form renders,
- WHEN the DOM is inspected,
- THEN there are at least two `<fieldset>` elements, each containing a non-empty `<legend>`.

### Requirement: ENR-UI-006 — Disabled cascade via FormControl API

Dependent selects (`academicYearId`, `gradeId`, `classGroupId`) MUST be disabled using the Reactive Forms API (`formControl.disable()` / `formControl.enable()`), NOT via the template `[disabled]` attribute. This removes the Angular 21 console warning about the `disabled` attribute on Reactive Forms controls.

#### Scenario: No `[disabled]` attribute on FormControl-bound selects

- GIVEN the form renders,
- WHEN the template source is inspected,
- THEN no `<select formControlName="...">` element also has `[disabled]` (template property binding) — disable state is achieved via `formControl.disable()` from TypeScript or via the parent `<fieldset [disabled]>` only.

#### Scenario: Angular 21 disabled-attribute warning is gone

- GIVEN the test suite runs,
- WHEN `enrollment-create.component.spec.ts` executes,
- THEN no `console.warn` / `console.error` output mentions the `disabled` attribute on Reactive Forms controls, AND `npm test` exits with zero unexpected console messages.

### Requirement: ENR-UI-007 — Primary CTA hierarchy

The form MUST render exactly one primary submit button ("Enroll Student" or equivalent Spanish copy) using `--tertiary-container` (`#002725`) as background and `--on-tertiary` (`#ffffff`) as text color. The button MUST include the `how_to_reg` Material Symbols icon.

#### Scenario: Primary CTA styled to EduCore

- GIVEN the form is ready for submission,
- WHEN the primary button is rendered,
- THEN `background-color` is `var(--tertiary-container)` (`#002725`), `color` is `var(--on-tertiary)` (`#ffffff`), `border-radius` is `var(--radius-control)` (10 px), `padding` is `12px 24px` (`--space-md` horizontal, 12 px vertical), AND the button content is a `<span class="material-symbols-outlined">how_to_reg</span>` icon followed by the label "Confirmar matrícula" (or aligned English copy).

#### Scenario: Submit button preserves a11y invariants

- GIVEN the form renders,
- WHEN the submit button is inspected,
- THEN it has `type="submit"`, `aria-busy="false"` (idle), and `[disabled]` is bound only when the form is invalid OR submitting.

### Requirement: ENR-UI-008 — Success region

On successful POST, the form MUST be replaced by a success card styled with the EduCore "success" tone: a green-tinted background (using `bg-tertiary-fixed-dim/20` or similar approved tint), a section-title heading "Inscripción registrada", and a `<dl>` summary block.

#### Scenario: Success card uses EduCore success tone

- GIVEN the form has submitted successfully,
- WHEN the success block renders,
- THEN the root element is `<div class="enrollment-success" role="status" aria-live="polite" data-testid="enrollment-success">`, AND `background-color` uses the soft-teal/success tint, AND `border-radius` is `var(--radius-lg)` (`16px`), AND a `<button type="button" class="enrollment-reset">` "Registrar otra matrícula" is present.

### Requirement: ENR-UI-009 — Error region mapped to ProblemDetails

On error (HTTP 400 / 404 / 409 / 422), the form MUST render an alert region with `role="alert"`, `aria-live="assertive"`, `data-testid="enrollment-error"`, displaying the canonical `ProblemDetails.title`, `ProblemDetails.detail`, and `ProblemDetails.errors` mapped from `errors` map to a `<ul>` of `<code>{field}</code>: {message}` entries. The alert MUST use the EduCore error tone (`--error-container` background, `--on-error-container` text).

#### Scenario: Error region uses EduCore error tone

- GIVEN the backend has returned a ProblemDetails 409 / 404 / 422,
- WHEN the error block renders,
- THEN the root element has `background-color: var(--error-container)`, `color: var(--on-error-container)`, `border-radius: var(--radius-lg)`, `role="alert"`, `aria-live="assertive"`, `data-testid="enrollment-error"`, AND the title is rendered as `<strong>{problem.title}</strong>` followed by `<span>(HTTP {problem.status})</span>` in muted text, AND the field list is rendered as a `<ul>` with `<code>{field}</code>: {message}` per entry, AND a "Reintentar" button is present.

### Requirement: ENR-UI-010 — Skeleton loader for ClassGroup

When the ClassGroup select is loading from the backend, the implementation MUST render a skeleton loader using `--surface-container-highest` background and a subtle pulse animation, instead of an empty select.

#### Scenario: ClassGroup skeleton renders during loading

- GIVEN the user has selected School, Academic Year, and Grade, triggering `loadClassGroups`,
- WHEN the loading state is active,
- THEN a 44 px tall, full-width, `border-radius: var(--radius-control)` element with `background-color: var(--surface-container-highest)` and `animation: pulse 2s ease-in-out infinite` is rendered in place of the ClassGroup select.

### Requirement: ENR-UI-011 — Disabled field styling

When School is unset, the Academic Year select MUST render with `opacity: 0.5`, `pointer-events: none`, a `lock` Material Symbols icon overlay on the right, and helper text "Seleccione una escuela y un año académico antes." The same pattern applies to Grade (needs School + Academic Year) and ClassGroup (needs all three parents).

#### Scenario: Locked field renders correctly

- GIVEN the School is unset,
- WHEN the Academic Year select renders,
- THEN its `opacity` is `0.5`, `pointer-events: none`, AND a `<span class="material-symbols-outlined">lock</span>` icon is positioned at the right edge, AND a `<p class="helper-text">` explains the prerequisite.
