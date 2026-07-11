# Capability: `feature-reports`

## Purpose

Define the EduCore-aligned layout and behavior of the **Reports** route (`/reports`). The implementation reproduces `reports_overview_desktop/code.html` at the component-template level while preserving every accessibility invariant codified by `p0-a11y-reports.routes.spec.ts` and every business rule from `municipal-reports/spec.md` (age distribution, teacher counts by sector, top schools by enrollment).

## Requirements

### Requirement: RPT-UI-001 — Page header matches EduCore

The page MUST render a `<h1 class="page-title" tabindex="-1">` with the text "Municipal Overview" (or aligned Spanish copy decided in `design.md`), followed by a body-md subtitle "Reportes consolidados para distribución por edad y docentes por sector."

#### Scenario: Page title and subtitle render

- GIVEN the user is on `/reports`,
- WHEN the route renders,
- THEN exactly one `<h1>` exists with `tabindex="-1"`, Manrope 32 px / 700 / -0.02em, AND the subtitle uses Inter 15 px / 400, `color: var(--on-surface-variant)`.

### Requirement: RPT-UI-002 — Page header segmented control

The page header MUST render a horizontal segmented control on the right side with four items: "Distribución por edad", "Docentes por sector", "Escuelas líderes", "Historial del estudiante". The active segment MUST have `bg-surface` background, `text-primary` color, `shadow-sm`.

#### Scenario: Segmented control renders with four items

- GIVEN the page header renders,
- WHEN the segmented control is inspected,
- THEN four buttons are present in this order: Distribución por edad, Docentes por sector, Escuelas líderes, Historial del estudiante, AND the active item (default: Distribución por edad) has `background-color: var(--surface)` AND `color: var(--primary)` AND `box-shadow: var(--shadow-elevated)`.

#### Scenario: Segmented control switches active section

- GIVEN the user clicks "Docentes por sector",
- WHEN the click handler runs,
- THEN the active segment becomes "Docentes por sector" AND the page scrolls smoothly to the `#sector-report` section, AND the other three segments render in the inactive style.

### Requirement: RPT-UI-003 — Age Distribution section (Bento 12-col grid)

The Age Distribution section MUST render a 12-column CSS grid (`grid-template-columns: repeat(12, minmax(0, 1fr))`) where the **Filter Parameters** panel spans `grid-column: span 3` and the **KPI Cards area** spans `grid-column: span 9`, with a gutter of `--space-gutter` (`24px`).

#### Scenario: Bento grid renders on desktop

- GIVEN the viewport is at least `1024px` wide,
- WHEN the Age Distribution section renders,
- THEN a left panel (`grid-column: span 3`) contains the filter parameters (Academic Year required select, School searchable input, Grade select) and an "Aplicar filtros" primary button, AND a right area (`grid-column: span 9`) contains a `grid-cols-3 gap-gutter` grid of three KPI cards (Ages 3-7, Ages 8-12, Over 12).

#### Scenario: Bento grid stacks below 1024 px

- GIVEN the viewport is below `1024px`,
- WHEN the Age Distribution section renders,
- THEN the filter panel and KPI cards area stack vertically, AND KPI cards become single-column.

### Requirement: RPT-UI-004 — Filter panel styled as glass card

The Filter Parameters panel MUST render with `background-color: rgba(255, 255, 255, 0.7)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--outline-variant)`, `border-radius: var(--radius-lg)` (`16px`), `padding: var(--space-lg)` (`24px`), and `box-shadow: 0px 4px 12px rgba(20, 33, 61, 0.03)`.

#### Scenario: Filter panel has glass-card styling

- GIVEN the Age Distribution section renders,
- WHEN the filter panel is inspected,
- THEN `background-color` is `rgba(255, 255, 255, 0.7)`, `backdrop-filter: blur(12px)`, `border-radius: 16px`, AND the panel header shows label-xs uppercase "Parámetros de filtro" with a 1 px bottom divider.

### Requirement: RPT-UI-005 — KPI cards (3 per age section)

The Age Distribution MUST render three KPI cards in a `grid-cols-3 gap-gutter` grid: **Ages 3-7** (featured, gradient `from-tertiary-container to-primary-container`, page-title value, trend indicator), **Ages 8-12** (standard, `bg-surface`, border `outline-variant/60`, page-title value, stable trend), **Over 12** (standard, `bg-surface`, page-title value, trend indicator).

#### Scenario: Featured KPI card (Ages 3-7) renders with gradient

- GIVEN the Age Distribution section is in success state,
- WHEN the Ages 3-7 KPI card is inspected,
- THEN `background` is `linear-gradient(135deg, var(--tertiary-container), var(--primary-container))`, `color` is `var(--on-tertiary-container)`, `border-radius: 16px`, `padding: 24px`, AND the value uses `font-family: Manrope`, `font-size: 32px`, `font-weight: 700`, `letter-spacing: -0.02em`, AND a trend indicator with a `trending_up` Material Symbol icon and "+X.X% desde el año pasado" text is present.

#### Scenario: Standard KPI card renders with surface background

- GIVEN the Age Distribution section is in success state,
- WHEN the Ages 8-12 or Over 12 KPI card is inspected,
- THEN `background-color` is `var(--surface)`, `border: 1px solid var(--outline-variant)`, `border-radius: 16px`, AND the value uses the same Manrope 32 px / 700 / -0.02em typography, AND a small icon container (`bg-secondary/10` with 24 px Material Symbol icon) is rendered.

### Requirement: RPT-UI-006 — "As of" date chip

The Age Distribution section header MUST render a date chip with the text "Edades calculadas al DD de month, YYYY" (or "asOfDate" value if provided), using `bg-surface-container`, `border: 1px solid var(--outline-variant)`, `border-radius: 9999px` (pill), `padding: 6px 12px`, label-xs typography.

#### Scenario: Date chip renders with current date

- GIVEN the Age Distribution section renders,
- WHEN the date chip is inspected,
- THEN it has `border-radius: 9999px`, `background-color: var(--surface-container)`, `border: 1px solid var(--outline-variant)`, `padding: 6px 12px`, `font-size: 12px`, AND the text is either the user-provided `asOfDate` formatted in Spanish long-form OR the current date in the same format.

### Requirement: RPT-UI-007 — Teachers by Sector section

The Teachers by Sector section MUST render after Age Distribution, with a section-title "Docentes por sector" (with `domain` Material Symbols icon) and helper text "Cada docente se cuenta una vez por sector." The section MUST render a 2-column grid (`grid-cols-1 md:grid-cols-2 gap-gutter`) of two glass-card KPI panels (Public, Private).

#### Scenario: Sector section header and helper render

- GIVEN the sector section renders,
- WHEN the header is inspected,
- THEN it contains a `<span class="material-symbols-outlined">domain</span>` icon (24 px, `--secondary`) and `<h3 class="section-title">Docentes por sector</h3>`, AND a `<p>` helper with the text "Cada docente se cuenta una vez por sector." in label-xs uppercase muted style.

#### Scenario: Sector KPI cards render (Public + Private)

- GIVEN the sector section is in success state,
- WHEN the two KPI cards are inspected,
- THEN they render side-by-side (`grid-cols-2`) with glass-card styling (rgba white + blur + soft shadow + 16 px radius), AND each card contains a 64 px circular icon container with a `public` (Public Schools) or `account_balance` (Private Schools) Material Symbol icon, AND a label-xs uppercase title, AND a page-title value with a small "Activo" badge.

### Requirement: RPT-UI-008 — Top Schools section

The Top Schools section MUST render after Teachers by Sector, with a section-title "Escuelas líderes por matrícula" (with `domain` Material Symbols icon) and helper text "Matrícula máxima del año académico seleccionado." The section MUST render a filter panel (Academic Year required select) and a table of top schools.

#### Scenario: Top schools section header and helper render

- GIVEN the top schools section renders,
- WHEN the header is inspected,
- THEN it contains a `<span class="material-symbols-outlined">domain</span>` icon (24 px, `--secondary`) and `<h3 class="section-title">Escuelas líderes por matrícula</h3>`, AND a `<p>` helper with the explanatory text in label-xs uppercase muted style.

#### Scenario: Top schools table preserves EduCore styling and a11y invariants

- GIVEN the top schools section is in success state,
- WHEN the table is inspected,
- THEN it has `<caption class="visually-hidden">` with descriptive text, AND each column header has `scope="col"` (preserving the `p0-a11y-reports.routes.spec.ts` invariant `expect(compiled.querySelectorAll('th[scope="col"]').length).toBe(3)`), AND label-xs uppercase bold navy header cells with `bg-surface-container-lowest` sticky header.

### Requirement: RPT-UI-009 — KPI card primitive

A reusable KPI card component (`<app-kpi-card>`) MUST be introduced under `src/app/features/reports/kpi-card/` and used by all three report sections. The component MUST accept inputs for `title`, `value`, `icon`, `trend` (optional), `variant` (default | featured), and MUST render the EduCore styling for each variant.

#### Scenario: KPI card primitive renders default variant

- GIVEN `<app-kpi-card title="Ages 8–12" value="15820" icon="backpack" variant="default">` is rendered,
- WHEN the component mounts,
- THEN it renders with `bg-surface` background, `border: 1px solid var(--outline-variant)`, `border-radius: 16px`, AND a 24 px icon inside `bg-secondary/10` container, AND the value in Manrope 32 px / 700 / -0.02em.

#### Scenario: KPI card primitive renders featured variant

- GIVEN `<app-kpi-card title="Ages 3–7" value="12450" icon="child_care" variant="featured" trend="up +4.2%">` is rendered,
- WHEN the component mounts,
- THEN it renders with gradient `from-tertiary-container to-primary-container` background, `color: var(--on-tertiary-container)`, AND a `trending_up` icon + trend label below the value.

### Requirement: RPT-UI-010 — `data-testid` values preserved

The route MUST preserve the existing `data-testid` values exactly so the existing a11y tests pass without modification: `age-loading`, `age-error`, `age-context`, `sector-loading`, `sector-error`, `sector-context`, `top-loading`, `top-empty`, `top-error`, `top-context`.

#### Scenario: All `data-testid` values present

- GIVEN the route renders each section in each state (loading, success, empty, error),
- WHEN the DOM is inspected,
- THEN the corresponding `data-testid` value is found on the appropriate root element, AND `role="status"` is on loading/success/empty regions AND `role="alert"` is on error regions.

### Requirement: RPT-UI-011 — Section labels match a11y spec

The three report section labels (used for `aria-label` on each `<section>` and on the existing nav-with-fragments) MUST continue to be: "Distribución por edad", "Docentes distintos por sector", "Escuelas líderes por matrícula" (matches the existing shell assertion `find(s => s.label === "...")` and the per-section a11y tests).

#### Scenario: Section labels are unchanged

- GIVEN the reports shell renders,
- WHEN the internal nav-with-fragments is inspected,
- THEN each link's label text matches one of: "Distribución por edad", "Docentes distintos por sector", "Escuelas líderes por matrícula", AND each `<section>` has `aria-label` matching the corresponding label.
