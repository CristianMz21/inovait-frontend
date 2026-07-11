# Gap Analysis — EduCore Institutional UI refactor

**Change**: `educore-ui-strict`
**Status**: planning only — no source files modified
**Source of truth**: `Templates/stitch_educore_academy_operations_system/educore_institutional_ui/DESIGN.md`

---

## 1. EduCore mockup component inventory

### 1.1 Cross-mockup shell components (every mockup)

| Component | Mockups | EduCore details |
|-----------|---------|-----------------|
| Brand block | All four | 40px square rounded container with `school` icon, "EduCore" h1 (card-title), "Academy Management" subtitle (label-xs uppercase) |
| Side nav rail | All four | Fixed left, `260px`, `bg-surface`, `border-r border-outline-variant`, vertical padding `md` |
| Nav item (inactive) | All four | 24px `material-symbols-outlined` icon + label-sm label, `opacity-80`, hover `bg-surface-container-high`, `rounded-lg` |
| Nav item (active) | All four | `bg-tertiary-fixed-dim/20`, `text-on-tertiary-container`, `border-l-4 border-tertiary-container`, `rounded-r-lg` (or `rounded-r-full` in enrollments), `rounded-r-lg` in reports/student-search/teacher-contracts |
| Top app bar | All four | Fixed top, `h-app-bar-height` (`64px`), `bg-surface-bright`, `border-b border-outline-variant`; brand title + Academic Year chip + "Switch School" button + notifications + account buttons |
| Page header | All four | `h1 page-title` (Manrope 32px / 700 / -0.02em) + `body-md` subtitle (`on-surface-variant`) |
| Skip-link | Required by a11y | First focusable, hidden until focused |

### 1.2 Enrollments mockup (`enrollments_desktop`)

| Component | Position | EduCore details |
|-----------|----------|-----------------|
| Page title | Header | "Enroll a Student" (page-title) + body-md subtitle |
| Section A — Student Identity | Left card, `col-span-7` | `bg-surface-container-lowest`, `border border-outline-variant`, `rounded-xl` (16px), padding `lg`; header row with `badge` icon (24px, `text-secondary`) + section-title "Student Identity"; divider `border-b border-outline-variant/50` |
| Field grid | Inside section A | 2 cols (`col-span-2 sm:col-span-1`), gap `md`; fields: Document Type (select), Document Number (input), First Names, Last Names, Date of Birth |
| Input control | All fields | 1px `border-outline-variant`, `rounded` (10-12px), `body-md` (15px), padding `py-[10px] px-3`, focus `border-secondary focus:ring-1 focus:ring-secondary` |
| Select with chevron | DocType, etc | Native `<select>` with absolutely positioned `arrow_drop_down` icon, `pl-3 pr-10` |
| Helper text | Below DocNumber, DateOfBirth | label-xs, `text-on-surface-variant` |
| Section B — Academic Placement | Right card, `col-span-5` | Same container styling; header with `domain` icon + section-title "Academic Placement" |
| Field with disabled state | AcademicYear, Grade | `opacity-50`, `pointer-events-none`, `bg-surface-container-low`, `border-outline-variant/50`, `cursor-not-allowed`, `lock` icon overlay |
| Skeleton loader | ClassGroup | `bg-surface-container-highest`, `rounded`, `h-[44px]`, `animate-pulse` |
| Primary CTA | Footer of form | "Enroll Student" with `how_to_reg` icon, `bg-on-tertiary-container` (`#002725`), white text, `rounded`, padding `px-6 py-3` |

### 1.3 Student Search mockup (`student_search_desktop`)

| Component | Position | EduCore details |
|-----------|----------|-----------------|
| Page title | Header | "Student Search" (page-title) + body-md subtitle |
| Filter panel | Below header | `bg-surface`, `border border-[#D7DCE5]`, `rounded-lg`, padding `lg`, ambient-shadow `0px 4px 12px rgba(20,33,61,0.08)` |
| Filter grid | Inside panel | `grid-cols-1 md:grid-cols-4 gap-md items-end`; fields: School, Grade, Academic Year |
| Filter labels | Above each select | label-xs uppercase, `text-on-surface-variant`, `tracking-wider` |
| Primary filter CTA | Last grid cell | `bg-tertiary-container` (`#002725`), `text-on-tertiary`, full width, `rounded`, `py-3`, `search` icon |
| Initial state panel | Below filter | `bg-surface-container-low`, `border-outline-variant`, `rounded-lg`, centered, `py-[100px]`; 64px circular icon container + section-title "Ready to Search" + body-md description |
| Results table | After successful search | `bg-surface`, `rounded-lg`, sticky `bg-surface-container-lowest` header, `text-label-xs` uppercase bold headers (`text-primary`), `divide-y divide-[#D7DCE5]` rows, hover `bg-surface-container-lowest/50` |

### 1.4 Teacher Contracts mockup (`teacher_contracts_desktop`)

| Component | Position | EduCore details |
|-----------|----------|-----------------|
| Page title | Header | "Teacher Contracts" + body-lg subtitle (max-width 3xl) |
| Split layout grid | Main content | `grid-cols-1 xl:grid-cols-12 gap-gutter items-start` |
| Create form card | Left, `col-span-4` | `bg-surface-container-lowest`, `border-outline-variant`, `rounded-xl`, padding `lg`; header with `add_circle` icon + card-title "Create Contract" + bottom divider |
| Searchable teacher input | Inside form | `bg-surface`, `pl-10` for search icon, `pr-10` for clear X icon, `rounded-lg` |
| School multiselect chips | Inside form | `min-h-[48px]`, `p-2`, `border-outline-variant`, `rounded-lg`; each chip `bg-surface-container`, `px-3 py-1`, `rounded-md`, with `cancel` icon; trailing text input "Add school..." |
| Dates grid | Inside form | `grid-cols-2 gap-4`; each date input `border-outline-variant`, `rounded-lg`, `py-3` |
| Primary CTA | Form footer | "Initialize Contracts", `bg-secondary` (`#4555b7`), `text-on-secondary`, `rounded-lg`, `py-3 px-4`, full width, `arrow_forward` icon |
| Contracts table card | Right, `col-span-8` | `bg-surface-container-lowest`, `rounded-xl`, `min-h-[500px]`; header row with section-title + segmented control "Active | All History" |
| Segmented control | Header right | `bg-surface-container-highest`, `p-1`, `rounded-lg`; active button `bg-surface-container-lowest`, `text-primary`, `rounded`, `shadow-sm` |
| Contracts table | Body | Sticky `bg-surface`, label-xs uppercase `text-on-surface-variant` headers; row hover `bg-surface-container-low` |
| Status badges | Persisted Status column | `rounded-full`, label-xs, dot indicator; Active = `bg-surface-container-high` + `bg-secondary` dot; Closed = `bg-surface-container` + `bg-outline` dot |
| Validity badges | Validity column | `rounded-full`, label-xs; Currently Active = `bg-tertiary-fixed-dim/20`, Upcoming = `bg-surface-container`, Expired = `bg-surface-container` opacity-70 |
| Row action | Actions column | `more_vert` icon button |
| Pagination footer | Table footer | label-sm, "Showing X to Y of Z" + chevron_left/chevron_right buttons |

### 1.5 Reports Overview mockup (`reports_overview_desktop`)

| Component | Position | EduCore details |
|-----------|----------|-----------------|
| Page title | Header | "Municipal Overview" + body-md subtitle |
| Section nav (segmented) | Header right | `bg-surface-container-low`, `p-1`, `rounded-lg`, `border-outline-variant/50`; active button `bg-surface`, `text-primary`, `shadow-sm`; items: Age Distribution, Teachers by Sector, Leading Schools, Student History |
| Section header | Each section | section-title + body-md helper + icon (groups/domain) |
| "As of" date chip | Age Distribution header | `bg-surface-container`, label-xs, `rounded-full`, `border-outline-variant/30`, padding `px-3 py-1.5` |
| Bento grid | Section body | `grid-cols-1 md:grid-cols-12 gap-gutter` |
| Filter panel | Left, `col-span-3` | `glass-card` (rgba white, backdrop-filter blur, soft shadow); header label-xs uppercase "Filter Parameters"; fields: Academic Year (required *), School (search input), Grade (select); footer "Apply Filters" `bg-primary` `text-on-primary` `rounded-md` button |
| KPI cards area | Right, `col-span-9` | `grid-cols-3 gap-gutter` |
| Featured KPI | First (Ages 3-7) | Gradient `from-tertiary-container to-primary-container`, `text-on-tertiary-container`, `rounded-xl`, `p-6`, soft glow blur, card-title + page-title value + trend indicator |
| Standard KPI | Subsequent | `bg-surface`, `border-outline-variant/60`, `rounded-xl`, `p-6`, hover `shadow-md` |
| Sector report section | Below age | section-title with `domain` icon + helper "Each teacher is counted once per sector." + segmented control "Current Date | Custom Period" |
| Sector KPI card | Public Schools | `glass-card`, 64px circular icon container + label-xs uppercase title + page-title value + small "Active" badge |
| Sector KPI card | Private Schools | Same layout, different icon (`account_balance`) |

---

## 2. Current Angular codebase inventory

### 2.1 App shell (`src/app/app.component.*`)

| Element | Current | File |
|---------|---------|------|
| Selector | `app-root` | `app.component.ts` |
| Change detection | OnPush | `app.component.ts` |
| Imports | RouterLink, RouterLinkActive, RouterOutlet | `app.component.ts` |
| Skip-link | First focusable, `href="#main"`, text "Saltar al contenido principal" | `app.component.html:1` |
| Header | `<header role="banner">` + h1 "Inovait · Gestión escolar municipal" + subtitle + `<nav aria-label="Navegación principal">` | `app.component.html:3-41` |
| Nav layout | Horizontal `<ul>` with 5 `<a>` links (Matrículas, Consulta de estudiantes, Contratos docentes, Reportes, Historia) | `app.component.html:8-40` |
| Active state | `is-active` class via `routerLinkActive` → border + soft accent background | `app.component.scss:43-46` |
| Main | `<main id="main" tabindex="-1" role="main">` | `app.component.html:43` |
| Footer | `<footer role="contentinfo">` with "Reportes operativos · Historia operativa" | `app.component.html:47-48` |
| Layout | Flex column, header sticky top, main `max-width: 1200px`, padding `1.25rem` | `app.component.scss` |

### 2.2 Global styles (`src/styles.scss`)

| Token | Current value | Notes |
|-------|---------------|-------|
| `--app-bg` | `#f7f8fa` | Background |
| `--app-header-bg` | `#ffffff` | Header surface |
| `--app-muted` | `#4a4f55` | Secondary text |
| `--app-text` | `#111827` | Primary text |
| `--app-border` | `#d0d4d9` | Default border |
| `--app-accent` | `#1d4ed8` | Primary accent (blue) |
| `--app-accent-soft` | `#eff6ff` | Accent background |
| `--app-error` | `#b91c1c` | Error |
| `--app-error-soft` | `#fef2f2` | Error background |
| `--app-success` | `#166534` | Success |
| `--app-success-soft` | `#f0fdf4` | Success background |
| Font family | `Inter`, system-ui fallback stack | Single font, no Manrope |
| Base font size | `16px`, line-height `1.45` | Single scale |
| Focus | `2px solid var(--app-accent)`, offset `2px` | Global |
| Reduced motion | `0.001ms` transitions | Honored |
| High contrast media query | Forces darker muted + black border + darker accent | Honored |

### 2.3 Enrollments feature (`src/app/features/enrollments/`)

| Element | Current | File |
|---------|---------|------|
| Component | `EnrollmentCreateComponent`, standalone, OnPush, ReactiveFormsModule imported, `EnrollmentCreateFacade` provider | `enrollment-create.component.ts` |
| Title | `<h1>Nueva matrícula</h1>` with `tabindex="-1"` | `enrollment-create.component.html:2` |
| Layout | Single column `flex-direction: column gap: 1rem max-width: 960px` | `enrollment-create.component.scss:1-6` |
| Form structure | `<form [formGroup]="form">` with 2 `<fieldset>` (Datos del estudiante, Cadena académica) | `enrollment-create.component.html:57-191` |
| Fields | documentType, documentNumber, firstNames, lastNames, birthDate, schoolId, academicYearId, gradeId, classGroupId | `enrollment-create.component.ts:87-112` |
| Cascading disable | Methods `isAcademicYearDisabled()`, `isGradeDisabled()`, `isClassGroupDisabled()` driven by parent values | `enrollment-create.component.ts:204-221` |
| Select disabled binding | BOTH `<fieldset [disabled]>` AND `[disabled]="isXxxDisabled()"` on each select | `enrollment-create.component.html:140-184` |
| Submit button | `enrollment-submit` class, `bg: var(--app-accent)`, white text, border-radius `4px` | `enrollment-create.component.scss:92-95` |
| Cancel/reset buttons | Transparent, accent text | `enrollment-create.component.scss:97-101` |
| Success block | `enrollment-success` class, soft-green background, `role="status"`, `data-testid="enrollment-success"`, summary `<dl>` + reset button | `enrollment-create.component.html:10-55` |
| Error block | `enrollment-error` class, soft-red background, `role="alert"`, `data-testid="enrollment-error"`, title + detail + per-field `<ul>` + retry button | `enrollment-create.component.html:216-248` |
| Field radii | `border-radius: 4px` on inputs/selects, `6px` on fieldsets | `enrollment-create.component.scss:21-22, 50, 112` |
| Field padding | `padding: 0.45rem 0.6rem` | `enrollment-create.component.scss:49` |

### 2.4 Student Search feature (`src/app/features/student-search/`)

| Element | Current | File |
|---------|---------|------|
| Component | `StudentSearchComponent`, standalone, OnPush, `StudentSearchFacade` provider | `student-search.component.ts` |
| Title | `<h1>Consulta de estudiantes</h1>` | `student-search.component.html:2` |
| Form | 1 `<fieldset>` "Filtros académicos" with 3 required selects (school, grade, academicYear) + optional asOfDate input | `student-search.component.html:16-60` |
| Submit | `search-submit`, accent background, blue/white | `student-search.component.scss` (estimated) |
| "Ver historial" action in rows | `<button disabled aria-disabled="true>` (P1-blocked) — note this is one source of `disabled`-attribute warnings | `student-search.component.html:191-203` |
| Empty state | `data-testid="search-empty"` with `role="status"` | `student-search.component.html:129-142` |
| Error state | `data-testid="search-error"` with `role="alert"` | `student-search.component.html:97-127` |
| Results table | `<caption class="visually-hidden">` + `<th scope="col">`, 8 columns | `student-search.component.html:156-208` |

### 2.5 Teacher Contracts feature (`src/app/features/teacher-contracts/`)

| Element | Current | File |
|---------|---------|------|
| Component | `TeacherContractsComponent`, standalone, OnPush, `TeacherContractsFacade` provider | `teacher-contracts.component.ts` |
| Title | `<h1>Contratos docentes</h1>` | `teacher-contracts.component.html:2` |
| Layout | Two sections (create + query) stacked, not split | `teacher-contracts.component.html:13-339` |
| Create form | 2 fieldsets (Identidad y período + Escuelas with checkbox list) | `teacher-contracts.component.html:53-118` |
| School selection | Checkbox list (one `<label><input type="checkbox">` per school) — does NOT match mockup's chip multiselect | `teacher-contracts.component.html:101-117` |
| Query form | 1 fieldset (Filtros) with teacher + optional asOfDate | `teacher-contracts.component.html:194-218` |
| Results table | `<caption class="visually-hidden">` + `<th scope="col">`, 5 columns | `teacher-contracts.component.html:305-336` |
| Empty / error / loading regions | `data-testid` + `role` per state | `teacher-contracts.component.html:244-291` |

### 2.6 Reports feature (`src/app/features/reports/`)

| Element | Current | File |
|---------|---------|------|
| Shell | `ReportsShellComponent` with internal `<nav>` linking to section fragments (`age-report`, `sector-report`, `top-schools-report`) | `reports-shell.component.html:1-48` |
| Sub-components | `<app-age-distribution />`, `<app-teacher-counts-by-sector />`, `<app-top-schools />` rendered as 3 sections | `reports-shell.component.html:25-47` |
| Section styling | `reports-shell-section--age/sector/top-schools` modifier classes | `reports-shell.component.html:27, 35, 43` |
| Internal nav labels | "Distribución por edad", "Docentes distintos por sector", "Escuelas líderes por matrícula" | `reports-shell.component.ts` (sections signal) |
| Layout | Single column stack, no KPI cards, no filter panel grouping | `reports-shell.component.html` |

### 2.7 Layout placeholders (`src/app/layout/placeholders/`)

| File | Current use | EduCore impact |
|------|-------------|----------------|
| `p1-locked.component.ts` | Used during P0 to block routes | Likely removed once `/student-history` and `/reports` are fully active; not needed for this change |
| `enrollments-placeholder.component.ts` | No longer wired (real component is mounted) | Likely deleted during this change |
| `student-search-placeholder.component.ts` | No longer wired | Likely deleted |
| `teacher-contracts-placeholder.component.ts` | No longer wired | Likely deleted |

### 2.8 Routing (`src/app/app.routes.ts`)

| Path | Component | Notes |
|------|-----------|-------|
| `/` | redirect → `/enrollments` | Unchanged |
| `/enrollments` | `EnrollmentCreateComponent` | Unchanged component, but template + scss rewritten |
| `/student-search` | `StudentSearchComponent` | Unchanged |
| `/teacher-contracts` | `TeacherContractsComponent` | Unchanged |
| `/reports` | `ReportsShellComponent` | Unchanged |
| `/student-history` | `StudentHistoryComponent` | Unchanged |

### 2.9 A11y specs to preserve (`src/app/a11y/`)

| File | What it asserts | EduCore impact |
|------|----------------|----------------|
| `p0-a11y.routes.spec.ts` | shell skip-link, `<main id="main" tabindex="-1">`, `<nav aria-label="Navegación principal">`; per route: exactly one `<h1 tabindex="-1">`, `<fieldset><legend>`, `aria-required`, `aria-busy="false"` on submit, `role="status"` on success/empty, `role="alert"` on error | Must stay green — those exact DOM attributes remain |
| `p0-a11y-reports.routes.spec.ts` | Same plus `caption.visually-hidden`, `<th scope="col">`, 320 px media query, `--app-muted` and `--app-accent` tokens present in stylesheet | `--app-muted` and `--app-accent` are referenced by name — must keep them as aliases of the new EduCore tokens OR keep them as aliases (preferred to keep names + add EduCore tokens) |
| `p1-a11y-history.routes.spec.ts` | Same plus `--app-border`, `prefers-reduced-motion`, `max-width: 320px` | Same: keep aliases |

### 2.10 Lint / typecheck / test scripts (`package.json`)

| Script | Command | Notes |
|--------|---------|-------|
| `typecheck` | `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.spec.json --noEmit` | Must stay green |
| `lint:eslint` | `eslint "src/**/*.{ts,html}" --max-warnings=0 --no-inline-config --report-unused-disable-directives` | Must produce 0 warnings |
| `lint:style` | `prettier --check src` | Must produce 0 mismatches |
| `lint` | runs all three | Must pass |
| `test` | `ng test --no-watch --no-progress` | Must pass |

---

## 3. Current → EduCore mapping

| Current element | EduCore target | Mapping |
|-----------------|----------------|---------|
| Top nav with 5 horizontal links (`<nav>` inside `<header>`) | Fixed left rail (260px) with vertical nav + app-bar (64px) on top | **RESTRUCTURE** — entire shell layout changes |
| Active nav: blue border + `accent-soft` background | Soft Teal (`#E7F5F3` from `bg-tertiary-fixed-dim/20`) background + 4px left border (`#002725` / `border-tertiary-container`) + `rounded-r-lg` | **RESTYLE** |
| Single-color text + label hierarchy | Two-font stack: Manrope (headings, 700/600) + Inter (body, 400/500/600); strict scale (page-title 32px / -0.02em, section-title 22px / 600, card-title 18px / 600, body-lg 16px / 400, body-md 15px / 400, label-sm 14px / 500, label-xs 12px / 600 / 0.05em) | **REPLACE** font stack + scale |
| Colors: blue accent, red error, green success | Academic Navy + Institutional Indigo + Modern Teal + Warm Ivory surface; semantic colors | **REPLACE** |
| Spacing: arbitrary rem/rem values | 8-point scale (`xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `xxl: 48px`) | **REALIGN** |
| Radii: 4px / 6px mixed | 10-12px controls, 16px containers, 6px badges | **REALIGN** |
| Inputs: 4px radius, 0.45rem/0.6rem padding | 1px `outline-variant` border, 10-12px radius (Tailwind `rounded`), `py-[10px] px-3` (≈ 12px padding), focus ring `focus:ring-1 focus:ring-secondary` (`#4555b7`) | **RESTYLE** |
| Enrollments: single column | 12-col grid, `col-span-7` Student Identity + `col-span-5` Academic Placement, two cards side-by-side, 24px gutter | **RESTRUCTURE** |
| Enrollments form: select disabled via `[disabled]` on each control + `<fieldset [disabled]>` | Disable via `formControl.disable()` only (no template `[disabled]` on FormControl-bound controls) to remove Angular 21+ warning | **FIX** warning |
| Student Search: vertical filter list | 4-col grid (School / Grade / Academic Year / Search CTA) inside a single filter panel | **RESTRUCTURE** |
| Student Search: no initial state | "Ready to Search" centered initial state panel (`py-[100px]`) | **ADD** |
| Student Search: results table columns (Identidad, Nombre completo, Edad, Escuela, Año, Grado, Grupo, Acciones) | Columns (Document, Student, Age, School, Grade, Class Group, Academic Year, Actions) | **REALIGN** (column rename Document=Identidad, Student=Nombre completo) |
| Teacher Contracts: stacked two sections | Split 12-col grid: `col-span-4` create form (card-title "Create Contract") + `col-span-8` existing contracts table | **RESTRUCTURE** |
| Teacher Contracts: checkbox school selector | Chip multiselect (`min-h-[48px]`, removable chips with X icon, trailing "Add school..." text input) | **REPLACE** selector |
| Teacher Contracts: query table | Same shape but add segmented control "Active | All History" in card header | **ADD** |
| Teacher Contracts: query table badges (text only) | Status badges with dot + filled bg variants matching mockup (`bg-surface-container-high` + `bg-secondary` dot for Active, etc.) | **RESTYLE** |
| Reports shell: nav-with-fragments at top of page | Top-of-page segmented control matching mockup; KPI cards per section | **REPLACE** with mockup layout |
| Reports: text-only totals | KPI cards (page-title metric value + label-xs title + trend indicator) | **ADD** |
| Age distribution: filter form + plain results | Bento 12-col grid: `col-span-3` filter panel (glass-card) + `col-span-9` KPI cards grid | **RESTRUCTURE** |
| Sector report: filter form + plain cards | `grid-cols-2` of 2 glass-card KPI panels (Public, Private) | **RESTRUCTURE** |
| Top schools: filter form + table | Filter panel + KPI cards grid + table (not detailed in mockup; preserve existing table) | **RESTRUCTURE** filter + KPI |

---

## 4. Conflicts with current code

| # | Conflict | Severity | Required action |
|---|----------|----------|-----------------|
| C1 | Existing `<nav>` is horizontal inside `<header>`; EduCore requires a fixed 260px left rail | High | Restructure `app.component.html` |
| C2 | Existing 4px control radius does not match EduCore 10-12px | High | Override `--radius-control: 10px` (12px on inputs) and apply globally |
| C3 | Existing color tokens use `#1d4ed8` (blue) and `#b91c1c` (red); EduCore uses navy/indigo/teal/error `#ba1a1a` | High | Replace token values; **must keep `--app-accent` and `--app-muted` aliases** because a11y specs grep them |
| C4 | Existing single font (Inter only); EduCore requires dual-font (Manrope + Inter) | High | Load Manrope from Google Fonts and update `--font-heading`, `--font-body` |
| C5 | Existing forms do not use the 8pt scale; many paddings/margins in arbitrary rem | Medium | Standardize margins and paddings on the 8pt scale |
| C6 | Enrollments form: `[disabled]` binding on Reactive Forms controls causes Angular 21+ console warnings | Medium | Replace `[disabled]` with `formControl.disable()` via TS, or use only `<fieldset [disabled]>` |
| C7 | Teacher Contracts uses checkbox list for schools; mockup uses chip multiselect | Medium | Replace selector |
| C8 | Reports shell lacks KPI cards; mockup requires 3+ KPI cards | Medium | Build KPI card component, add to each report section |
| C9 | Existing alerts use raw red/green surfaces; EduCore uses tinted surface (`bg-tertiary-fixed-dim/20` for success) + darkened text | Low | Refactor alert components |
| C10 | No skeleton loader component exists; mockup requires `bg-surface-container-highest` pulse on Warm Ivory | Low | Add skeleton component |
| C11 | Existing typography scale is single (no labels uppercase tracking-wider); mockup requires `label-xs` uppercase + 0.05em tracking | Low | Add label-xs class |
| C12 | Teacher contracts query table lacks "Active | All History" segmented control | Low | Add segmented control |
| C13 | No icon font loaded; mockup uses Material Symbols Outlined throughout | High | Add Material Symbols Outlined link to `index.html` (CSS-only, no npm package) |
| C14 | `student-search.component.html` line 194 has `<button disabled>` static attribute | Medium | Use `aria-disabled="true"` only and a CSS class (remove the bare `disabled` attribute) |
| C15 | Reports section names differ in mockup vs implementation ("Age Distribution" vs "Distribución por edad"); OK because the Spanish label is the visible one, but the mockup internal nav uses English | Low | Keep Spanish visible labels; the EduCore icon mapping uses English semantic names in code |
| C16 | Brand block in mockups references "EduCore" logo image; current app brand says "Inovait · Gestión escolar municipal" | High | Brand block must switch to EduCore mark (or remain Inovait for header — decision flagged in open questions) |
| C17 | `tsconfig.spec.json` type-check likely passes today; refactor must not break template type-checking | Medium | Run `typecheck` after every phase |

---

## 5. Risks to existing a11y specs and mitigations

| Risk | Spec at risk | Mitigation |
|------|--------------|------------|
| R-A11Y-1 — Refactor of `app.component.html` removes `<nav aria-label="Navegación principal">` or skip-link | `p0-a11y.routes.spec.ts`, `p0-a11y-reports.routes.spec.ts`, `p1-a11y-history.routes.spec.ts` | Restructure preserves skip-link as first focusable element, keeps the `<main id="main" tabindex="-1">` landmark, and re-emits the same `<nav aria-label="Navegación principal">` (which now contains the rail items). The aria-label string is asserted literally by all three specs. |
| R-A11Y-2 — Token refactor removes or renames `--app-muted`, `--app-accent`, `--app-border` | `p0-a11y-reports.routes.spec.ts`, `p1-a11y-history.routes.spec.ts` | Keep the three legacy tokens as aliases of the new EduCore tokens: `--app-muted: var(--on-surface-variant)`, `--app-accent: var(--secondary)`, `--app-border: var(--outline-variant)`. Verify with grep after refactor. |
| R-A11Y-3 — `<h1 tabindex="-1">` removed when restructuring page headers | All a11y specs | Each feature keeps exactly one `<h1 tabindex="-1">` at the top of the page content. The brand block in the rail uses `<h1>` too, so the rail's brand heading is moved into the app-bar instead of being the route h1, or the rail uses a non-h1 element (decision: rail uses a div for brand to avoid double h1). |
| R-A11Y-4 — `<fieldset><legend>` grouping removed when refactoring forms | All a11y specs | Each form keeps fieldset+legend per logical group; templates preserve the existing `<legend>` text values (e.g., "Datos del estudiante", "Cadena académica", "Filtros académicos", "Identidad y período", "Escuelas", "Filtros") |
| R-A11Y-5 — `aria-required="true"` removed when re-styling inputs | All a11y specs | Add `aria-required="true"` on every required form control; assert in tests `>= 9` for enrollments, `>= 3` for student-search, `>= 3` for teacher-contracts (matches existing tests) |
| R-A11Y-6 — Submit button loses `aria-busy` | All a11y specs | Preserve `[attr.aria-busy]` binding on every submit button |
| R-A11Y-7 — Success region loses `role="status"` or `data-testid` | All a11y specs | Preserve existing `data-testid` values exactly: `enrollment-success`, `search-empty`, `search-results`, `search-loading`, `search-error`, `contracts-create-success`, `contracts-query-empty`, `contracts-query-error`, `age-loading`, `age-error`, `age-context`, `sector-loading`, `sector-error`, `sector-context`, `top-loading`, `top-empty`, `top-error`, `top-context`, `history-loading`, `history-empty`, `history-error`, `history-context` |
| R-A11Y-8 — `caption.visually-hidden` removed from results tables | `p0-a11y-reports.routes.spec.ts` (RPT-TOP) | Keep `<caption class="visually-hidden">` on tables |
| R-A11Y-9 — 320 px media query or `prefers-reduced-motion` removed | `p0-a11y-reports.routes.spec.ts`, `p1-a11y-history.routes.spec.ts` | Preserve both rules in `styles.scss` |
| R-A11Y-10 — "Ver historial" button on student search results has `disabled` static attribute removed differently than `[disabled]` — could change semantics | None directly | Replace static `disabled` with `aria-disabled="true"` + CSS class to keep accessibility behavior |
| R-A11Y-11 — Form IDs / `aria-describedby` change | None directly asserted | Preserve `aria-describedby` IDs: `enrollment-lede`, `search-lede`, `range-help`, `query-asof-help`, `as-of-help`, `contracts-lede`, `history-locked-help` |
| R-A11Y-12 — `Angular 21 warning about disabled attribute` may resurface after refactor | `npm run lint:eslint` is enforced with `--max-warnings=0` | All disabled selects must use `[attr.disabled]` instead of `[disabled]` OR rely solely on the FormControl `.disable()` API. ESLint template accessibility rules already flag `disabled` static attributes; the refactor must remove them. |
| R-A11Y-13 — Existing alert regions collapse into the new tinted surfaces — `aria-live` attribute lost | All a11y specs | Preserve `aria-live="polite"` on success/empty regions and `aria-live="assertive"` on error regions |

---

## 6. Items present only in mockups (N/A on app side)

| EduCore element | App-side equivalent | Action |
|-----------------|---------------------|--------|
| Brand logo image (left rail) | "Inovait" wordmark today | **OPEN**: keep as text or switch to EduCore brand mark (decide in proposal) |
| "Switch School" button in app-bar | Not implemented | New component, behaviour TBD (likely just a future button stub) |
| Notification icon with red dot in app-bar | Not implemented | New icon button, no behaviour in P0 of this change |
| Account/profile icon in app-bar | Not implemented | New icon button, no behaviour in P0 of this change |
| "Settings" + "Support" nav items at bottom of rail | Not implemented | New nav items, no behaviour in P0 of this change |
| Search icon inside searchable teacher select | Not implemented | Add decorative icon span inside input wrapper |
| Clear (X) icon inside searchable teacher select | Not implemented | Add button with `cancel` icon |
| "Reintentar" button on age/top/hist empty states | Already present | No action |
| Footer "Showing X to Y of Z" + pagination on teacher-contracts table | Not implemented | Add pagination stub OR keep showing all (no pagination in P0; matches current behaviour) |
| Dark mode toggle | Not in mockup scope | **OUT** of this change |

---

## 7. Items present in app but not in mockups

| App element | Mockup counterpart | Action |
|-------------|---------------------|--------|
| `<app-p1-locked>` placeholder | Not in mockups | Delete if no longer used after refactor |
| `EnrollmentCreateComponent.lede` paragraph above the form | Mockup has page title + body-md subtitle | Preserve as subtitle inside page header (mimics mockup) |
| Cancel button on each form (in addition to reset) | Mockup shows one primary CTA + (implied) tertiary text link "Cancel" | Keep two buttons (primary + secondary), but restyle per EduCore CTA hierarchy |
| `asOfDate` optional filter on student search and teacher query | Not explicitly in mockup | **PRESERVE** — contract requirement; mockup filter panel has "All Grades" and "All Schools" which act analogously |
| `data-testid` attributes | Mockups don't show them | **PRESERVE** — required by existing a11y specs |

---

## 8. Verification mapping

| Concern | Verification command | Pass criterion |
|---------|----------------------|----------------|
| Typecheck | `npm run typecheck` | Exit 0 |
| ESLint (template accessibility rules included) | `npm run lint:eslint` | Exit 0, 0 warnings (`--max-warnings=0`) |
| Prettier formatting | `npm run lint:style` | Exit 0 |
| Unit + integration tests | `npm test` | All specs pass, no `console.warn`/`console.error` |
| Existing a11y specs (P0, RPT, HIST) | `npm test -- p0-a11y` and `npm test -- a11y` | All `it()` blocks pass |
| Production build | `npm run build` | Exit 0, within budget (initial 500kB warn / 1MB error, anyComponentStyle 4kB warn / 8kB error) |
| Token alias presence | grep `--app-muted`, `--app-accent`, `--app-border` in compiled styles | All three found |
| 320 px media query | grep `max-width: 320px` in styles | Found |
| `prefers-reduced-motion` | grep `prefers-reduced-motion` in styles | Found |
| WCAG 2.2 AA contrast (manual in this change) | manual review of documented pairings using WebAIM contrast checker | All documented pairings pass at 4.5:1 (text) or 3:1 (large text/UI) |
