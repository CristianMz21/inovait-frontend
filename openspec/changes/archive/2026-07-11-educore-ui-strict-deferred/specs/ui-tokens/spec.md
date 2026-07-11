# Capability: `ui-tokens`

## Purpose

Define every visual token of the EduCore Institutional UI design system, load them as CSS custom properties on `:root`, and require WCAG 2.2 AA contrast verification on every documented token pairing actually used in the new templates. Tokens are the contract; no component is allowed to use a literal hex value or arbitrary rem/px that is not declared here.

## Requirements

### Requirement: TKN-001 — Color tokens (palette)

The system MUST expose every color from `DESIGN.md` as a CSS custom property on `:root` with the exact hex value documented below. No component MAY use a literal hex value in its template or stylesheet; every color reference MUST resolve to one of these tokens (directly or via a documented alias).

#### Scenario: All required color tokens declared

- GIVEN `src/styles.scss` is the global stylesheet,
- WHEN the stylesheet is compiled and rendered in the browser,
- THEN `:root` declares every CSS custom property listed in the "Required color tokens" table below with the exact hex value, AND a static assertion in `a11y/educore-tokens.spec.ts` finds every token name in the stylesheet text.

#### Scenario: Legacy token aliases preserved

- GIVEN the existing a11y specs (`p0-a11y-reports.routes.spec.ts`, `p1-a11y-history.routes.spec.ts`) reference `--app-muted`, `--app-accent`, and `--app-border` by literal name,
- WHEN the stylesheet is compiled,
- THEN `:root` ALSO declares `--app-muted`, `--app-accent`, and `--app-border` as aliases of the documented EduCore tokens (see alias table), so the existing a11y specs continue to pass without modification.

##### Required color tokens

| Token | Hex | Source name in DESIGN.md |
|-------|-----|---------------------------|
| `--surface` | `#f9f9ff` | surface |
| `--surface-dim` | `#d1daf4` | surface-dim |
| `--surface-bright` | `#f9f9ff` | surface-bright |
| `--surface-container-lowest` | `#ffffff` | surface-container-lowest |
| `--surface-container-low` | `#f1f3ff` | surface-container-low |
| `--surface-container` | `#e9edff` | surface-container |
| `--surface-container-high` | `#e1e8ff` | surface-container-high |
| `--surface-container-highest` | `#d9e2fc` | surface-container-highest |
| `--on-surface` | `#121b2e` | on-surface |
| `--on-surface-variant` | `#45464d` | on-surface-variant |
| `--inverse-surface` | `#273044` | inverse-surface |
| `--inverse-on-surface` | `#edf0ff` | inverse-on-surface |
| `--outline` | `#75777e` | outline |
| `--outline-variant` | `#c5c6ce` | outline-variant |
| `--surface-tint` | `#525e7d` | surface-tint |
| `--primary` | `#000a24` | primary |
| `--on-primary` | `#ffffff` | on-primary |
| `--primary-container` | `#14213d` | primary-container |
| `--on-primary-container` | `#7c89aa` | on-primary-container |
| `--inverse-primary` | `#b9c6ea` | inverse-primary |
| `--secondary` | `#4555b7` | secondary |
| `--on-secondary` | `#ffffff` | on-secondary |
| `--secondary-container` | `#8999ff` | secondary-container |
| `--on-secondary-container` | `#182a8e` | on-secondary-container |
| `--tertiary` | `#000e0d` | tertiary |
| `--on-tertiary` | `#ffffff` | on-tertiary |
| `--tertiary-container` | `#002725` | tertiary-container |
| `--on-tertiary-container` | `#3a9791` | on-tertiary-container |
| `--error` | `#ba1a1a` | error |
| `--on-error` | `#ffffff` | on-error |
| `--error-container` | `#ffdad6` | error-container |
| `--on-error-container` | `#93000a` | on-error-container |
| `--primary-fixed` | `#d9e2ff` | primary-fixed |
| `--primary-fixed-dim` | `#b9c6ea` | primary-fixed-dim |
| `--on-primary-fixed` | `#0d1b36` | on-primary-fixed |
| `--on-primary-fixed-variant` | `#3a4664` | on-primary-fixed-variant |
| `--secondary-fixed` | `#dee0ff` | secondary-fixed |
| `--secondary-fixed-dim` | `#bbc3ff` | secondary-fixed-dim |
| `--on-secondary-fixed` | `#000e5e` | on-secondary-fixed |
| `--on-secondary-fixed-variant` | `#2c3c9e` | on-secondary-fixed-variant |
| `--tertiary-fixed` | `#99f2eb` | tertiary-fixed |
| `--tertiary-fixed-dim` | `#7dd5cf` | tertiary-fixed-dim |
| `--on-tertiary-fixed` | `#00201e` | on-tertiary-fixed |
| `--on-tertiary-fixed-variant` | `#00504c` | on-tertiary-fixed-variant |
| `--background` | `#f9f9ff` | background |
| `--on-background` | `#121b2e` | on-background |
| `--surface-variant` | `#d9e2fc` | surface-variant |

##### Required token aliases (legacy)

| Alias | Maps to | Justification |
|-------|---------|---------------|
| `--app-muted` | `var(--on-surface-variant)` (`#45464d`) | `p0-a11y-reports.routes.spec.ts` greps this name |
| `--app-accent` | `var(--secondary)` (`#4555b7`) | `p0-a11y-reports.routes.spec.ts` greps this name |
| `--app-border` | `var(--outline-variant)` (`#c5c6ce`) | `p1-a11y-history.routes.spec.ts` greps this name |

### Requirement: TKN-002 — Typography tokens

The system MUST expose every typography role from `DESIGN.md` as a CSS custom property triplet (`-family`, `-size`, `-line-height`, and `-weight` where applicable). The font family stack MUST include `Manrope` for heading roles and `Inter` for body and label roles, with `system-ui` fallback so the UI remains usable when Google Fonts is blocked.

#### Scenario: Required typography tokens declared

- GIVEN the global stylesheet,
- WHEN compiled,
- THEN every token name in the "Required typography tokens" table is declared on `:root` with the documented font family, size, line height, and weight, AND the rendered computed style of a representative element using each token matches the documented values within 1 px / 1 px line-height tolerance.

##### Required typography tokens

| Role | Token family prefix | font-family | font-size | line-height | font-weight | letter-spacing |
|------|---------------------|-------------|-----------|-------------|-------------|----------------|
| Page title | `--type-page-title` | `Manrope, system-ui, sans-serif` | `32px` | `40px` | `700` | `-0.02em` |
| Page title (mobile ≤ 480px) | `--type-page-title-mobile` | `Manrope, system-ui, sans-serif` | `24px` | `32px` | `700` | `0` |
| Section title | `--type-section-title` | `Manrope, system-ui, sans-serif` | `22px` | `28px` | `600` | `0` |
| Card title | `--type-card-title` | `Manrope, system-ui, sans-serif` | `18px` | `24px` | `600` | `0` |
| Body large | `--type-body-lg` | `Inter, system-ui, sans-serif` | `16px` | `24px` | `400` | `0` |
| Body medium | `--type-body-md` | `Inter, system-ui, sans-serif` | `15px` | `22px` | `400` | `0` |
| Label small | `--type-label-sm` | `Inter, system-ui, sans-serif` | `14px` | `20px` | `500` | `0` |
| Label extra-small | `--type-label-xs` | `Inter, system-ui, sans-serif` | `12px` | `16px` | `600` | `0.05em` |

#### Scenario: Google Fonts loaded for Manrope and Material Symbols

- GIVEN `src/index.html` is the document root,
- WHEN the document is loaded by the browser,
- THEN a `<link rel="stylesheet">` tag references the Google Fonts CSS for `Manrope:wght@400;600;700` AND `Inter:wght@400;500;600` AND `Material Symbols Outlined`, AND `font-display: swap` is implied by Google's default query parameters (`&display=swap`).

### Requirement: TKN-003 — Spacing tokens (8pt scale)

The system MUST expose the documented spacing scale as CSS custom properties on `:root`, and the component templates MUST use ONLY these tokens (or SCSS variables that resolve to them) for padding, margin, and gap.

#### Scenario: Required spacing tokens declared

- GIVEN the global stylesheet,
- WHEN compiled,
- THEN every token in the "Required spacing tokens" table is declared on `:root` with the documented value, AND a grep of `src/**/*.{scss,html}` finds no literal `padding: Npx` or `margin: Npx` value outside this scale (exceptions: `1px` borders, `2px` outlines documented in TKN-005).

##### Required spacing tokens

| Token | Value | Use |
|-------|-------|-----|
| `--space-unit` | `8px` | Base unit (documentation) |
| `--space-xs` | `4px` | Tight inline spacing |
| `--space-sm` | `8px` | Default inline spacing |
| `--space-md` | `16px` | Card / form field spacing |
| `--space-lg` | `24px` | Card padding, gutter between sections |
| `--space-xl` | `32px` | Page section spacing |
| `--space-xxl` | `48px` | Hero / page header spacing |
| `--space-rail-width` | `260px` | Left nav rail width |
| `--space-app-bar-height` | `64px` | Top app-bar height |
| `--space-gutter` | `24px` | Default content gutter (alias of `--space-lg`) |

### Requirement: TKN-004 — Radius, elevation, and shadow tokens

The system MUST expose the documented radius, elevation, and shadow tokens, matching `DESIGN.md` shape language and elevation rules.

#### Scenario: Required radius tokens declared

- GIVEN the global stylesheet,
- WHEN compiled,
- THEN every token in the "Required radius tokens" table is declared on `:root` with the documented value, AND the rendered border-radius of representative controls matches within 1 px tolerance.

##### Required radius tokens

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | `0.25rem` (4px) | Reserved (rare) |
| `--radius-default` | `0.5rem` (8px) | Reserved (rare) |
| `--radius-md` | `0.75rem` (12px) | Inputs, selects, buttons (small controls) |
| `--radius-lg` | `1rem` (16px) | Cards, modals, sections (large containers) |
| `--radius-control` | `10px` | Inputs, selects (small controls — matches mockup `rounded`) |
| `--radius-badge` | `6px` | Status badges |

#### Scenario: Required shadow tokens declared

- GIVEN the global stylesheet,
- WHEN compiled,
- THEN `--shadow-ambient-card` is declared with value `0px 4px 12px rgba(20, 33, 61, 0.08)` AND `--shadow-elevated` is declared with value `0px 4px 12px rgba(20, 33, 61, 0.16)` (raised layer, e.g., active dropdowns).

### Requirement: TKN-005 — Focus ring token (a11y)

The system MUST expose a single focus-ring token used by every interactive element (button, input, select, link, custom control) and preserve the `:focus-visible` global rule already required by the a11y specs.

#### Scenario: Focus ring visible on every interactive element

- GIVEN a user navigates with the keyboard to any interactive element,
- WHEN the element receives focus via `:focus-visible`,
- THEN a visible focus ring is drawn using `--secondary` (`#4555b7`) with a 2 px width and 2 px offset (matching the existing global rule), AND the focus ring color passes WCAG 2.2 AA non-text contrast (≥ 3:1) against the underlying surface.

### Requirement: TKN-006 — WCAG 2.2 AA contrast verification

For every documented pairing of `color` on `background` that is actually used by the new component templates, the contrast ratio MUST pass WCAG 2.2 AA (≥ 4.5:1 for body text, ≥ 3:1 for large text and UI components).

#### Scenario: Documented pairings recorded

- GIVEN the new templates are implemented,
- WHEN the verification phase runs,
- THEN `design.md` records every documented pairing (foreground token, background token, intended role, expected ratio, source) with the actual ratio measured by WebAIM Contrast Checker (or equivalent). If any pairing fails, the implementation MUST adjust the token value OR document an explicit deviation.

##### Required documented pairings

| Pairing | Expected ratio (≥) | Use |
|---------|--------------------|-----|
| `--on-surface` (`#121b2e`) on `--surface` (`#f9f9ff`) | 4.5:1 | Body text on background |
| `--on-surface` on `--surface-container-lowest` (`#ffffff`) | 4.5:1 | Body text on card |
| `--on-surface-variant` (`#45464d`) on `--surface` | 4.5:1 | Helper text on background |
| `--on-surface-variant` on `--surface-container-lowest` | 4.5:1 | Helper text on card |
| `--on-primary` (`#ffffff`) on `--primary` (`#000a24`) | 4.5:1 | Button label |
| `--on-primary` on `--tertiary-container` (`#002725`) | 4.5:1 | Primary CTA (EduCore "Modern Teal" button) |
| `--on-secondary` (`#ffffff`) on `--secondary` (`#4555b7`) | 4.5:1 | Secondary button label |
| `--on-tertiary-container` (`#3a9791`) on `--tertiary-fixed-dim/20` (active nav bg) | 4.5:1 | Active nav item text on Soft Teal background |
| `--tertiary-container` (`#002725`) on `--tertiary-fixed-dim/20` | 3:1 | Active nav item indicator bar (UI component) |
| `--secondary` (`#4555b7`) on `--surface` | 3:1 | Focus ring on background (UI component) |
| `--secondary` on `--surface-container-lowest` | 3:1 | Focus ring on card |
| `--error` (`#ba1a1a`) on `--error-container` (`#ffdad6`) | 4.5:1 | Error text |
| `--on-error-container` (`#93000a`) on `--error-container` | 4.5:1 | Error emphasis text |
