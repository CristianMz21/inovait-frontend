# Design: educore-ui-strict — EduCore Institutional UI refactor

## Technical Approach

Strict letter-by-letter alignment of the `inovait-frontend` Angular application to the EduCore Institutional UI design system. The refactor preserves every data contract, route, business rule, and a11y invariant while restructuring the visual layer:

1. Replace global CSS tokens with EduCore palette, typography, spacing, radius, elevation (CSS custom properties on `:root`).
2. Restructure the shell into a fixed left rail + fixed app-bar + fluid main canvas.
3. Rewrite the four feature templates to match the mockups.
4. Keep three legacy CSS custom properties (`--app-muted`, `--app-accent`, `--app-border`) as aliases of the new EduCore tokens so the existing a11y specs continue to pass.
5. Replace `[disabled]` template bindings on Reactive Forms selects with `[attr.disabled]` to silence the Angular 21 console warning.

## Architecture Decisions

### Decision: CSS custom properties on `:root` (no SCSS variables only)

**Choice**: Declare all EduCore tokens as CSS custom properties on `:root` in `src/styles.scss`, then reference them in component styles via `var(--token-name)`. Use SCSS `@use` partials only for grouping tokens in source files (`src/styles/_educore/_tokens.scss`), but emit the values as CSS custom properties at build time.
**Alternatives considered**:
- *SCSS variables only* — would compile to literal values, making runtime theming impossible and requiring recompile for any token change. Rejected because (a) the codebase uses `--app-*` CSS custom properties today, and (b) dark-mode toggle is a near-term possibility that the design system implies.
- *Angular Material theming* — would introduce Angular Material's SCSS theming system, requiring us to keep `@angular/material` (already in `package.json`) and adopt M3 token mapping. Rejected because the EduCore palette is bespoke (Academic Navy + Modern Teal) and Material's M3 mapping would force compromises. We keep Material/CDK available for overlay/dialog needs but do not adopt Material's theming system.
**Rationale**: CSS custom properties are the lowest-friction path that preserves the existing `--app-*` token convention, supports runtime theming if needed later, and lets us add aliases for the legacy tokens without SCSS gymnastics.

### Decision: Single `<app-shell>` component with embedded rail and app-bar

**Choice**: Keep `App` (the root component) but rename the host to render a single `<app-shell>` component containing the rail (`<app-rail>`), the app-bar (`<app-top-bar>`), and a `<main>` outlet. The skip-link stays in `App` (it must be the first focusable element of the document).
**Alternatives considered**:
- *Three separate route-level layouts* — would require restructuring `app.routes.ts` and adding layout route components. Rejected because the shell is uniform across all routes.
- *Pure inline structure in `App`* — works but conflates structural and presentational concerns and makes the rail/app-bar harder to test in isolation.
**Rationale**: One shell component, three sub-components (`<app-shell>`, `<app-rail>`, `<app-top-bar>`), each independently testable. The skip-link remains in `App` to guarantee document order.

### Decision: Manrope + Inter loaded from Google Fonts (no npm)

**Choice**: Add `<link>` tags for `Manrope:wght@400;600;700` and `Inter:wght@400;500;600` from Google Fonts in `src/index.html`. Also load `Material Symbols Outlined` from Google Fonts.
**Alternatives considered**:
- *Self-host fonts via `@fontsource/manrope` and `@fontsource/inter`* — would require adding npm packages. Rejected per the constraint "Do NOT modify package.json or lockfile."
- *System fonts only* — fails the EduCore design system requirement of using Manrope for headings.
**Rationale**: Google Fonts CDN is zero-install and the design system is built around these exact font sources. `font-display: swap` is the default (`&display=swap`), so the UI remains usable when the CDN is blocked by falling back to `system-ui`.

### Decision: `[attr.disabled]` instead of `[disabled]` on FormControl-bound controls

**Choice**: Where a `<select formControlName="...">` needs to be disabled based on parent form state, use `[attr.disabled]="condition ? '' : null"` (string attribute) instead of `[disabled]="condition"` (boolean property). For full disable, prefer `formControl.disable()` from TypeScript.
**Alternatives considered**:
- *Keep `[disabled]` and silence the warning with `@ts-ignore`* — violates the "NO SUPPRESSIONS" project rule.
- *Move the disable logic entirely into `<fieldset [disabled]>` only* — works for the dependent cascade but loses the ability to disable an individual control. Acceptable as the primary strategy; we still use `[attr.disabled]` where individual disable is needed (e.g., for the static `<button disabled>` in student-search history action).
**Rationale**: `[attr.disabled]` is a DOM attribute binding that does not interact with the Reactive Forms disabled state machine, so Angular's `[disabled]` warning never fires. `formControl.disable()` from TS is preferred when the disable is fully derived from TypeScript state (e.g., `isSubmitting()`).

### Decision: Keep brand block text as "Inovait · Gestión escolar municipal"

**Choice**: The rail brand block continues to read "Inovait · Gestión escolar municipal" (current text), not "EduCore Academy". Rationale: the EduCore brand mark is shown only in the mockup; the project name is Inovait. **OPEN QUESTION** is flagged in the change folder for the user to confirm.
**Alternatives considered**:
- *Switch brand to "EduCore Academy"* — matches the mockup verbatim but loses the project identity.
- *Keep "Inovait" in the rail and show "EduCore" only as a card title in some context* — incoherent.
**Rationale**: Project identity wins over mockup fidelity for the brand block. The EduCore brand mark image (`Templates/.../educore_brand_mark/screen.png`) can be added to `public/` as a decorative asset if the user later decides to use it; for this change we keep the text-only block.

### Decision: Tokens are loaded from a single SCSS partial with CSS custom property output

**Choice**: Create `src/styles/_educore/_tokens.scss` containing every token as a CSS custom property declaration (not an SCSS variable). The partial is `@use`d into `src/styles.scss`. No SCSS variables for tokens (they would be inlined at compile time, defeating the point of CSS custom properties).
**Alternatives considered**:
- *Two layers: SCSS variables (semantic) → CSS custom properties (output)* — over-engineered for a 50+ token design system. Adds indirection without benefit.
**Rationale**: One source of truth, one output type (CSS custom properties). Easier to grep, easier to alias, easier to document.

### Decision: Phase order and feature isolation

**Choice**: Refactor in this order: tokens → shell → enrollments → student-search → teacher-contracts → reports → verification. Each phase is one commit on `feat/educore-ui-strict`.
**Alternatives considered**:
- *Feature-first (one feature per phase, shell + tokens interleaved)* — couples phases and makes rollback harder.
- *Big-bang refactor* — single PR with 400+ lines changed. Rejected by the `chained-pr` / work-unit-commits guidance.
**Rationale**: Tokens and shell are foundational dependencies of every feature. Refactoring them first means each feature commit only touches its own templates/styles. Each commit leaves the tree green because the legacy tokens are kept as aliases and the a11y invariants are preserved.

## Data Flow

Unchanged. The refactor is purely presentational:

```
Route → Component (template + scss refactored) → Facade (unchanged) → Mapper (unchanged) → Api Service (unchanged) → HttpClient → Backend
```

No changes to DTOs, mappers, facades, or HTTP contracts.

## File Changes

### Phase 1 — Tokens

| File | Action | Description |
|------|--------|-------------|
| `src/styles.scss` | Modify | Replace `:root` token block with EduCore tokens; keep `--app-muted`, `--app-accent`, `--app-border` aliases; preserve `:focus-visible` rule and `prefers-reduced-motion` media query |
| `src/styles/_educore/_tokens.scss` | New | Single source of truth for every EduCore token (color, typography, spacing, radius, shadow) as CSS custom property declarations |
| `src/styles/_educore/_index.scss` | New | Re-export `_tokens.scss` |
| `src/index.html` | Modify | Add Google Fonts `<link>` tags for Manrope, Inter, Material Symbols Outlined |
| `src/app/a11y/educore-tokens.spec.ts` | New | Asserts every required EduCore token is present in the compiled stylesheet |

### Phase 2 — Shell

| File | Action | Description |
|------|--------|-------------|
| `src/app/app.component.{ts,html,scss}` | Modify | Restructure to render `<a class="skip-link">`, `<app-shell>` containing `<app-rail>`, `<app-top-bar>`, and `<main id="main" tabindex="-1">` outlet |
| `src/app/layout/educore-shell/app-shell.component.{ts,html,scss}` | New | Standalone shell component; contains the three regions (rail, app-bar, main outlet) and a breadcrumb above the outlet |
| `src/app/layout/educore-shell/app-rail.component.{ts,html,scss}` | New | Standalone rail component; renders brand block + five nav items + bottom Settings/Support stubs (visual only) |
| `src/app/layout/educore-shell/app-top-bar.component.{ts,html,scss}` | New | Standalone app-bar component; renders brand title + Academic Year chip + Switch School button + Notifications icon button + Account icon button |
| `src/app/layout/educore-shell/breadcrumb.component.{ts,html,scss}` | New | Standalone breadcrumb component reading the active route label from the router |

### Phase 3a — Enrollments

| File | Action | Description |
|------|--------|-------------|
| `src/app/features/enrollments/enrollment-create.component.html` | Modify | Restructure to two-column 12-col grid (Student Identity `col-span-7` + Academic Placement `col-span-5`); add section icons; replace `[disabled]` with `[attr.disabled]`; add skeleton loader for ClassGroup loading state |
| `src/app/features/enrollments/enrollment-create.component.scss` | Modify | Apply EduCore tokens (border radius 10 px, padding 12 px, focus ring in `--secondary`); two-column grid; section header with icon + bottom divider |
| `src/app/features/enrollments/enrollment-create.component.ts` | Modify | No behavioural changes (cascade logic preserved); comment explains template restructure |

### Phase 3b — Student Search

| File | Action | Description |
|------|--------|-------------|
| `src/app/features/student-search/student-search.component.html` | Modify | Restructure to single filter panel (4-col grid) + initial-state panel ("Ready to Search") + results table; preserve `asOfDate`; preserve all `data-testid` values; replace `disabled` static attribute on the "Ver historial" button with `aria-disabled="true"` only |
| `src/app/features/student-search/student-search.component.scss` | Modify | EduCore filter panel styling (16 px radius, shadow); 4-col grid; initial-state panel (centered, 100 px vertical padding); EduCore table styling |
| `src/app/features/student-search/student-search.component.ts` | Modify | No behavioural changes |

### Phase 3c — Teacher Contracts

| File | Action | Description |
|------|--------|-------------|
| `src/app/features/teacher-contracts/teacher-contracts.component.html` | Modify | Restructure to split 12-col layout (Create Contract `col-span-4` + Existing Contracts `col-span-8`); replace checkbox school selector with chip multiselect; add dates 2-col grid; add segmented control in table header; status badges with dot; validity pill badges |
| `src/app/features/teacher-contracts/teacher-contracts.component.scss` | Modify | Split layout grid; chip multiselect styling; dates grid; segmented control; badge primitives |
| `src/app/features/teacher-contracts/teacher-contracts.component.ts` | Modify | Add `onRemoveSchool(schoolId)` handler for chip removal; `onToggleSegment(segment)` handler for segmented control; existing `selectedSchoolIds` set reused |

### Phase 3d — Reports

| File | Action | Description |
|------|--------|-------------|
| `src/app/features/reports/reports-shell.component.html` | Modify | Replace fragment-based internal nav with the EduCore segmented control in the page header; keep the three `<section>` landmarks with `aria-label` unchanged |
| `src/app/features/reports/reports-shell.component.scss` | Modify | Bento grid for age distribution; 2-col grid for sector; filter panels + KPI cards grid |
| `src/app/features/reports/reports-shell.component.ts` | Modify | Add `activeSection` signal driving the segmented control; add `onSegmentClick(sectionId)` handler that scrolls to the section |
| `src/app/features/reports/age-distribution/age-distribution.component.html` | Modify | Add filter panel + 3 KPI cards grid; keep results table below |
| `src/app/features/reports/age-distribution/age-distribution.component.scss` | Modify | Bento grid layout; KPI card grid |
| `src/app/features/reports/teacher-counts-by-sector/teacher-counts-by-sector.component.html` | Modify | Add 2-col KPI cards grid (Public + Private) |
| `src/app/features/reports/teacher-counts-by-sector/teacher-counts-by-sector.component.scss` | Modify | KPI card grid; glass-card styling |
| `src/app/features/reports/top-schools/top-schools.component.html` | Modify | Add filter panel + KPI cards grid (number of schools, max enrollment) |
| `src/app/features/reports/top-schools/top-schools.component.scss` | Modify | KPI card grid; preserve existing table styling |
| `src/app/features/reports/kpi-card/kpi-card.component.{ts,html,scss}` | New | Reusable KPI card primitive (default + featured variants) |

### Phase 4 — Verification

| File | Action | Description |
|------|--------|-------------|
| `src/app/a11y/educore-tokens.spec.ts` | New (already counted in Phase 1) | (Phase 1 file) |

No source files are modified in Phase 4. The phase consists of:
- Manual WCAG 2.2 AA contrast verification using WebAIM Contrast Checker (recorded in `design.md` under "WCAG 2.2 AA Contrast Verification" below).
- `npm run lint` (must pass with 0 warnings).
- `npm test` (must pass all existing specs + new token spec).
- `npm run build` (must succeed within budgets).

## Interfaces / Contracts

No new interfaces. The only new internal types are component input types:

```ts
// app-rail.component.ts
type RailItem = {
  readonly label: string;
  readonly route: string;
  readonly icon: string; // Material Symbols name
};

// app-top-bar.component.ts
// (no inputs — purely visual)

// breadcrumb.component.ts
// (reads active route from Angular Router; no inputs)

// kpi-card.component.ts
type KpiCardVariant = 'default' | 'featured';
type KpiCardInputs = {
  title: string;
  value: string | number;
  icon: string; // Material Symbols name
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  variant?: KpiCardVariant;
};

// skeleton.component.ts
type SkeletonShape = 'rect' | 'circle' | 'pill';
type SkeletonInputs = {
  width: string;
  height: string;
  shape: SkeletonShape;
};

// alert.component.ts
type AlertTone = 'success' | 'error' | 'info';
type AlertInputs = {
  tone: AlertTone;
  title: string;
  detail?: string;
  status?: number;
  fields?: ReadonlyArray<{ field: string; messages: readonly string[] }>;
  retryLabel?: string;
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Token presence | Every required EduCore token declared in `src/styles.scss` | `educore-tokens.spec.ts` greps the stylesheet text |
| Legacy alias presence | `--app-muted`, `--app-accent`, `--app-border` aliases present | Same grep test asserts the three legacy names exist |
| Responsive + motion | 320 px media query, `prefers-reduced-motion` rule present | Same grep test asserts both substrings |
| Existing a11y invariants | Skip-link, single h1, fieldset+legend, aria-required, aria-busy, role=status/alert, data-testid values, caption/th scope=col | `npm test -- p0-a11y` and `npm test -- a11y` (must stay green) |
| Component templates | Data-testid preserved, h1 tabindex=-1 preserved, fieldset grouping preserved | Existing component specs (`enrollment-create.component.spec.ts`, etc.) continue to pass |
| Console warnings | Zero `console.warn` / `console.error` output from test run | Manual check: `npm test --reporter=verbose 2>&1 \| grep -i warn` returns nothing unexpected |
| Lint | ESLint with `--max-warnings=0` | `npm run lint:eslint` |
| Typecheck | TypeScript strict mode, both `tsconfig.app.json` and `tsconfig.spec.json` | `npm run typecheck` |
| Formatting | Prettier | `npm run lint:style` |
| Build | Production bundle within budgets | `npm run build` |
| WCAG 2.2 AA contrast | Every documented pairing from TKN-006 | Manual WebAIM contrast check; recorded in this design document (see below) |

## WCAG 2.2 AA Contrast Verification

The following table will be filled in during Phase 4 verification. The values shown are pre-calculated estimates based on the documented token hex values; they MUST be re-measured with the WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/) before the phase gate is passed.

| Pairing | Hex foreground | Hex background | Estimated ratio | Required | Use |
|---------|----------------|----------------|-----------------|----------|-----|
| `--on-surface` on `--surface` | `#121b2e` | `#f9f9ff` | ≈ 16.7:1 | 4.5:1 | Body text on background |
| `--on-surface` on `--surface-container-lowest` | `#121b2e` | `#ffffff` | ≈ 17.4:1 | 4.5:1 | Body text on card |
| `--on-surface-variant` on `--surface` | `#45464d` | `#f9f9ff` | ≈ 10.0:1 | 4.5:1 | Helper text on background |
| `--on-surface-variant` on `--surface-container-lowest` | `#45464d` | `#ffffff` | ≈ 10.4:1 | 4.5:1 | Helper text on card |
| `--on-primary` on `--primary` | `#ffffff` | `#000a24` | ≈ 20.7:1 | 4.5:1 | Button label |
| `--on-tertiary` on `--tertiary-container` | `#ffffff` | `#002725` | ≈ 19.3:1 | 4.5:1 | Primary CTA (EduCore "Modern Teal" button) |
| `--on-secondary` on `--secondary` | `#ffffff` | `#4555b7` | ≈ 6.4:1 | 4.5:1 | Secondary button label |
| `--on-tertiary-container` on Soft Teal (`rgba(125,213,207,0.2)` on `--surface`) | `#3a9791` | ≈ `#f4faf9` | ≈ 5.2:1 | 4.5:1 | Active nav item text |
| `--tertiary-container` on Soft Teal | `#002725` | ≈ `#f4faf9` | ≈ 18.5:1 | 3:1 | Active nav indicator bar |
| `--secondary` on `--surface` | `#4555b7` | `#f9f9ff` | ≈ 6.0:1 | 3:1 | Focus ring on background |
| `--secondary` on `--surface-container-lowest` | `#4555b7` | `#ffffff` | ≈ 6.2:1 | 3:1 | Focus ring on card |
| `--error` on `--error-container` | `#ba1a1a` | `#ffdad6` | ≈ 5.7:1 | 4.5:1 | Error text |
| `--on-error-container` on `--error-container` | `#93000a` | `#ffdad6` | ≈ 8.6:1 | 4.5:1 | Error emphasis text |

If any ratio comes out below the required threshold when re-measured, the implementation MUST adjust the token value (preferring lighter foreground or darker background) OR document an explicit deviation. The verification phase is not complete until every row is either confirmed pass or explicitly justified.

## Migration / Rollout

No data migration is required. The change is purely presentational. Rollout:

1. Create `feat/educore-ui-strict` branch from `main` (not yet created — flagged in proposal).
2. Phase 1 → push commit, wait for CI green.
3. Phase 2 → push commit, wait for CI green.
4. Phase 3a → push commit, wait for CI green.
5. Phase 3b → push commit, wait for CI green.
6. Phase 3c → push commit, wait for CI green.
7. Phase 3d → push commit, wait for CI green.
8. Phase 4 (verification) → run contrast checks, fill table, push commit with any contrast adjustments.
9. Open PR from `feat/educore-ui-strict` to `main` with changelog referencing this change folder.
10. Merge after review and CI green.

## Open Questions

- [ ] **Brand block text**: should the rail brand block say "Inovait · Gestión escolar municipal" (current) or "EduCore Academy" (mockup)? — Default decision: keep "Inovait" (project identity wins); awaiting user confirmation.
- [ ] **Brand logo image**: should the EduCore brand mark image (`Templates/.../educore_brand_mark/screen.png`) be added to `public/` as a decorative asset? — Default decision: no (text-only brand block); awaiting user confirmation.
- [ ] **Settings + Support nav items**: are they decorative-only in this change, or do they need a route placeholder? — Default decision: decorative-only (icons + labels rendered, no `routerLink`); awaiting user confirmation.
- [ ] **axe-core integration**: WCAG 2.2 AA verification is currently manual (WebAIM). Adding `axe-core` to dev dependencies would automate this but requires modifying `package.json` (forbidden by this change). Should a follow-up change add axe-core? — Default decision: yes, in a follow-up change; this change uses manual verification recorded above.
- [ ] **Pagination on teacher-contracts table**: the mockup shows "Showing 1 to 3 of 12 contracts" with chevron_left/right buttons; current implementation has no pagination. Should we add pagination in this change or keep showing all? — Default decision: keep showing all (matches existing P0 behaviour); pagination is a separate change.
- [ ] **Student-search "Ver historial" button**: the mockup shows it as a real action; current implementation has it disabled with P1-blocked helper text. Should this change keep the disabled state or remove the button entirely? — Default decision: keep the disabled state with `aria-disabled="true"` (matches existing a11y spec and P1 gating).
