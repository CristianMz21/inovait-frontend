# Capability: `feature-teacher-contracts`

## Purpose

Define the EduCore-aligned layout and behavior of the **Teacher Contracts** route (`/teacher-contracts`). The implementation reproduces `teacher_contracts_desktop/code.html` at the component-template level while preserving every accessibility invariant codified by `p0-a11y.routes.spec.ts` and every business rule from `teacher-contracts/spec.md` — including the atomic multischool create contract behaviour.

## Requirements

### Requirement: TC-UI-001 — Page header matches EduCore

The page MUST render a `<h1 class="page-title" tabindex="-1">` with the text "Contratos docentes", followed by a body-lg subtitle (max-width 768 px) describing atomic multischool creation and the per-teacher history query.

#### Scenario: Page title and subtitle render

- GIVEN the user is on `/teacher-contracts`,
- WHEN the route renders,
- THEN exactly one `<h1>` exists with `tabindex="-1"`, text "Contratos docentes", Manrope 32 px / 700 / -0.02em, AND the subtitle uses Inter 16 px / 400 (`--type-body-lg`), `color: var(--on-surface-variant)`, `max-width: 768px`.

### Requirement: TC-UI-002 — Split layout (12-col grid)

The route MUST render a 12-column CSS grid (`grid-template-columns: repeat(12, minmax(0, 1fr))`) where the **Create Contract** form spans `grid-column: span 4` and the **Existing Contracts** table card spans `grid-column: span 8`, with a gutter of `--space-lg` (`24px`).

#### Scenario: Split layout renders on desktop

- GIVEN the viewport is at least `1280px` wide,
- WHEN the route renders,
- THEN two cards are visible side-by-side: the left card contains the Create Contract form (Teacher searchable select + school multiselect + start date + end date + Initialize Contracts button) and the right card contains the Existing Contracts table, AND the left card uses `grid-column: span 4`, the right card uses `grid-column: span 8`.

#### Scenario: Cards stack on viewports below 1280 px

- GIVEN the viewport is below `1280px`,
- WHEN the route renders,
- THEN the two cards stack vertically, preserving all form fields and the table.

### Requirement: TC-UI-003 — Create Contract form card styling

The Create Contract card MUST render with `bg-surface-container-lowest`, `border: 1px solid var(--outline-variant)`, `border-radius: var(--radius-lg)` (`16px`), padding `--space-lg` (`24px`), and a header row containing an `add_circle` Material Symbols icon (24 px, `--secondary`) and a card-title "Crear contrato".

#### Scenario: Create form card has EduCore styling

- GIVEN the route renders,
- WHEN the Create Contract card is inspected,
- THEN computed `background-color` is `var(--surface-container-lowest)`, `border-radius` is `16px`, `padding` is `24px`, AND the header row contains `<span class="material-symbols-outlined">add_circle</span>` and `<h2 class="card-title">Crear contrato</h2>`, with a `border-bottom: 1px solid var(--outline-variant)` divider below.

### Requirement: TC-UI-004 — Searchable teacher selector

The Teacher field MUST render as a searchable selector matching the mockup: a relative-positioned wrapper containing a `search` Material Symbols icon at the left edge, an `<input type="text">` with `padding-left: 40px` and `padding-right: 32px`, and a clear (X) button at the right edge.

#### Scenario: Searchable teacher input renders

- GIVEN the Create Contract form renders,
- WHEN the Teacher field is inspected,
- THEN the wrapper contains a `<span class="material-symbols-outlined">search</span>` icon at `left: 12px`, an `<input>` with `padding-left: 40px` and `padding-right: 32px`, AND a clear `<button>` with `<span class="material-symbols-outlined">close</span>` at `right: 12px` whenever the input has a value.

### Requirement: TC-UI-005 — School multiselect with chips

The "Asignar escuelas" field MUST render as a chip multiselect matching the mockup: a `min-height: 48px` container with `border: 1px solid var(--outline-variant)`, `border-radius: var(--radius-md)` (`12px`), `background-color: var(--surface)`, containing one chip per selected school. Each chip MUST be `bg-surface-container`, `border: 1px solid var(--outline-variant)`, `border-radius: 6px`, with a `cancel` icon for removal. A trailing `<input type="text">` with placeholder "Añadir escuela…" allows adding more.

#### Scenario: Selected schools render as removable chips

- GIVEN the user has selected two schools via the multiselect,
- WHEN the field renders,
- THEN two `<span class="chip">` elements are visible inside the multiselect container, each with the school name as text and a `<button>` containing `<span class="material-symbols-outlined">cancel</span>` for removal, AND a trailing `<input type="text" placeholder="Añadir escuela…">` is present.

#### Scenario: Chip removal triggers selectedSchoolIds update

- GIVEN a chip is rendered,
- WHEN the user clicks the chip's cancel icon,
- THEN `onToggleSchool(schoolId, false)` is invoked (re-using the existing `selectedSchoolIds` set) AND the chip disappears from the DOM on the next change detection cycle.

### Requirement: TC-UI-006 — Dates grid

The Start Date and End Date inputs MUST render in a 2-column grid (`grid-template-columns: 1fr 1fr`) inside the Create Contract card, with `gap: var(--space-md)` (`16px`).

#### Scenario: Dates grid renders side-by-side

- GIVEN the Create Contract form renders,
- WHEN the dates grid is inspected,
- THEN two `<label>` cells are present side-by-side: Start Date (with `aria-required="true"`) and End Date (optional), each with its own `<input type="date">` styled per TKN-004 (10-12 px radius, 12 px vertical padding, focus ring in `--secondary`).

### Requirement: TC-UI-007 — Primary CTA (Initialize Contracts)

The "Inicializar contratos" submit button MUST render with `--secondary` background (`#4555b7`), `--on-secondary` text, full width within its container, `--radius-md` (`12px`) border radius, label-sm typography, and an `arrow_forward` Material Symbols icon suffix.

#### Scenario: Primary CTA uses EduCore secondary color

- GIVEN the form is ready for submission,
- WHEN the Initialize Contracts button is inspected,
- THEN computed `background-color` is `var(--secondary)` (`#4555b7`), `color` is `var(--on-secondary)` (`#ffffff`), `width: 100%`, `border-radius: 12px`, AND the button content is the label "Inicializar contratos" followed by an `<span class="material-symbols-outlined">arrow_forward</span>` icon.

#### Scenario: Submit preserves a11y invariants

- GIVEN the form renders,
- WHEN the submit button is inspected,
- THEN it has `type="submit"`, `aria-busy="false"` (idle), and `[disabled]` is bound only when the form is invalid OR submitting.

### Requirement: TC-UI-008 — Existing Contracts table card

The Existing Contracts card MUST render on the right side of the split layout, with `bg-surface-container-lowest`, `border: 1px solid var(--outline-variant)`, `border-radius: var(--radius-lg)` (`16px`), `min-height: 500px`, and a header row containing a section-title "Contratos existentes" and a segmented control "Activo | Todo el historial".

#### Scenario: Existing Contracts card renders

- GIVEN the route renders,
- WHEN the right card is inspected,
- THEN it has `min-height: 500px`, `background-color: var(--surface-container-lowest)`, `border-radius: 16px`, AND the header row contains `<h2 class="section-title">Contratos existentes</h2>` and a segmented control with two buttons: "Activo" and "Todo el historial".

### Requirement: TC-UI-009 — Segmented control

The segmented control MUST render with `bg-surface-container-highest` background, `padding: 4px`, `border-radius: var(--radius-md)`, containing two buttons. The active button MUST have `bg-surface-container-lowest`, `text-primary`, `shadow-sm`. The inactive button MUST have `text-on-surface-variant` and `hover: text-primary`.

#### Scenario: Active button has EduCore styling

- GIVEN the "Activo" segment is the default active state,
- WHEN the segmented control renders,
- THEN "Activo" has computed `background-color: var(--surface-container-lowest)` AND `color: var(--primary)` AND `box-shadow: var(--shadow-elevated)`, AND "Todo el historial" has `color: var(--on-surface-variant)`.

#### Scenario: Segmented control toggles filter state

- GIVEN the user clicks "Todo el historial",
- WHEN the click handler runs,
- THEN the active segment switches to "Todo el historial" AND the contracts list re-renders to show all contracts (including closed and expired), AND the existing per-state regions (`data-testid="contracts-query-empty"`, `data-testid="contracts-query-error"`, `data-testid="contracts-query-results"`) remain intact.

### Requirement: TC-UI-010 — Contracts table with status badges

The contracts table MUST render with seven columns: Escuela, Sector, Fecha de inicio, Fecha de fin, Estado persistido, Vigencia, Acciones. The "Estado persistido" column MUST render status badges with a colored dot indicator (Active = `--secondary` dot on `--surface-container-high` background; Closed = `--outline` dot on `--surface-container` background). The "Vigencia" column MUST render validity badges with rounded-full pill shape (Currently Active = `bg-tertiary-fixed-dim/20`; Upcoming = `bg-surface-container`; Expired = `bg-surface-container` opacity-70).

#### Scenario: Status badges render with dot indicator

- GIVEN a contract row is rendered,
- WHEN the "Estado persistido" cell is inspected,
- THEN it contains a `<span class="status-badge">` with `border-radius: 9999px` (or `var(--radius-badge)` `6px` — decision in design.md), `background-color: var(--surface-container-high)`, `border: 1px solid var(--outline-variant)`, containing a 6 px circular dot with `background-color: var(--secondary)` (for Active) or `var(--outline)` (for Closed), followed by the label "Vigente" or "Cancelado".

#### Scenario: Validity badges render with pill shape

- GIVEN a contract row is rendered,
- WHEN the "Vigencia" cell is inspected,
- THEN it contains a `<span class="validity-badge">` with `border-radius: 9999px`, label-xs typography, and one of: `bg-tertiary-fixed-dim/20` + `text-on-tertiary-fixed-variant` for "Actualmente vigente"; `bg-surface-container` for "Próximo"; `bg-surface-container opacity-70` for "Vencido".

### Requirement: TC-UI-011 — Fieldset grouping preserved

The route MUST continue to expose at least three `<fieldset><legend>` groups: "Identidad y período", "Escuelas", and the query form "Filtros" — matching the existing a11y invariant (`expect(fieldsets.length).toBeGreaterThanOrEqual(3)`).

#### Scenario: Three fieldsets and legends preserved

- GIVEN the route renders,
- WHEN the DOM is inspected,
- THEN there are at least three `<fieldset>` elements with non-empty `<legend>` children: one labeled "Identidad y período", one labeled "Escuelas", and one labeled "Filtros".

### Requirement: TC-UI-012 — Success, empty, and error regions

The route MUST preserve the existing `data-testid` values exactly: `contracts-create-success`, `contracts-create-error`, `contracts-query-empty`, `contracts-query-error`, `contracts-query-results`, `contracts-query-loading`.

#### Scenario: Create success region renders

- GIVEN the create POST returns 201 with a list of contracts,
- WHEN the success block renders,
- THEN the root element has `data-testid="contracts-create-success"`, `role="status"`, `aria-live="polite"`, AND it lists each created contract with school name, sector, date range, persisted status, and effective status, AND a "Crear otro contrato" button is present.

#### Scenario: Query error region renders ProblemDetails

- GIVEN the query GET returns 404 ProblemDetails,
- WHEN the error block renders,
- THEN the root element has `data-testid="contracts-query-error"`, `role="alert"`, `aria-live="assertive"`, AND the title and detail from ProblemDetails are rendered, AND a "Reintentar" button is present.
