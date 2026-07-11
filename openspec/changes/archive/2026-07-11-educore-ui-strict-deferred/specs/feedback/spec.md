# Capability: `feedback`

## Purpose

Define the EduCore-aligned feedback primitives used across the application: alerts mapped to RFC 9457 `ProblemDetails`, skeleton loaders on Warm Ivory, and the optional toast surface (currently unused but reserved). Every feedback region MUST continue to expose the correct ARIA semantics (`role="status"` for success/loading/empty, `role="alert"` for error) and `data-testid` values asserted by the existing a11y specs.

## Requirements

### Requirement: FDB-001 — Alert primitive mapped to ProblemDetails

A reusable alert primitive (`<app-alert>`) MUST accept a `problem` input typed as the existing `ProblemDetails` interface (`title`, `detail`, `status`, `code`, `instance`, `errors?`). The primitive MUST render a region whose `role` and `aria-live` depend on the severity of the status code.

#### Scenario: 4xx / 5xx ProblemDetails renders as `role="alert"`

- GIVEN the alert primitive receives a `ProblemDetails` with `status >= 400`,
- WHEN the component renders,
- THEN the root element has `role="alert"`, `aria-live="assertive"`, `border-radius: var(--radius-lg)` (`16px`), `padding: var(--space-md) var(--space-lg)`, `background-color: var(--error-container)`, `color: var(--on-error-container)`, AND a title `<strong>{problem.title}</strong>` is rendered followed by a `<span class="alert-status">(HTTP {problem.status})</span>` in muted text.

#### Scenario: Field-level errors rendered as `<ul>`

- GIVEN the `ProblemDetails.errors` map is non-empty,
- WHEN the alert primitive renders,
- THEN a `<ul class="alert-fields">` is rendered below the detail, with one `<li>` per `(field, messages[])` entry containing `<code>{field}</code>: {message}`.

#### Scenario: Success message renders as `role="status"`

- GIVEN the alert primitive receives a success message (no ProblemDetails, or a custom `tone="success"` input),
- WHEN the component renders,
- THEN the root element has `role="status"`, `aria-live="polite"`, `border-radius: var(--radius-lg)`, `padding: var(--space-md) var(--space-lg)`, `background-color: rgba(125, 213, 207, 0.2)` (`bg-tertiary-fixed-dim/20`), `color: var(--on-tertiary-container)`.

### Requirement: FDB-002 — Skeleton loader primitive

A reusable skeleton primitive (`<app-skeleton>`) MUST accept inputs for `width`, `height`, and `shape` (`rect` | `circle` | `pill`). The skeleton MUST render with `background-color: var(--surface-container-highest)`, the appropriate border radius per shape, and a `pulse` animation (2 s, ease-in-out, infinite).

#### Scenario: Skeleton renders with pulse animation

- GIVEN `<app-skeleton width="100%" height="44px" shape="rect">` is rendered,
- WHEN the component mounts,
- THEN the root element has computed `background-color: var(--surface-container-highest)`, `height: 44px`, `width: 100%`, `border-radius: var(--radius-control)`, AND the `@keyframes pulse` animation runs at 2 s ease-in-out infinite.

#### Scenario: Circle skeleton renders

- GIVEN `<app-skeleton width="64px" height="64px" shape="circle">` is rendered,
- WHEN the component mounts,
- THEN the root element has `border-radius: 50%`, `width: 64px`, `height: 64px`, `background-color: var(--surface-container-highest)`.

#### Scenario: Reduced-motion disables the pulse animation

- GIVEN the user's OS reports `prefers-reduced-motion: reduce`,
- WHEN any skeleton renders,
- THEN the `animation` property is `none` and the element renders as a static tile (consistent with the existing global `prefers-reduced-motion` rule in `src/styles.scss`).

### Requirement: FDB-003 — Optional toast surface (stub)

The application MUST NOT introduce a toast surface unless explicitly requested by a future change. For this refactor, the only feedback channels are: alert regions (success/error/empty), skeleton loaders, and inline helper text.

#### Scenario: No toast container is rendered

- GIVEN any route renders,
- WHEN the DOM is inspected,
- THEN there is NO `<app-toast-host>` or equivalent toast container in the document, AND feedback is delivered only via the alert and skeleton primitives defined above.

### Requirement: FDB-004 — Preserved `data-testid` values

Every feedback region MUST continue to expose the existing `data-testid` values asserted by `p0-a11y.routes.spec.ts`, `p0-a11y-reports.routes.spec.ts`, and `p1-a11y-history.routes.spec.ts`.

#### Scenario: Existing data-testid values are present

- GIVEN each route renders in each remote state (loading, success, empty, error),
- WHEN the DOM is inspected,
- THEN the following `data-testid` values are found on the appropriate region root: `enrollment-success`, `enrollment-error`, `search-loading`, `search-empty`, `search-error`, `search-results`, `contracts-create-success`, `contracts-create-error`, `contracts-query-loading`, `contracts-query-empty`, `contracts-query-error`, `contracts-query-results`, `age-loading`, `age-error`, `age-context`, `sector-loading`, `sector-error`, `sector-context`, `top-loading`, `top-empty`, `top-error`, `top-context`, `history-loading`, `history-empty`, `history-error`, `history-context`.

### Requirement: FDB-005 — Alert retry action

Every error region MUST expose a "Reintentar" button (`<button type="button" class="alert-retry">Reintentar</button>`) bound to the existing retry handler. The button MUST use the EduCore tertiary style: transparent background, 1 px `var(--error)` border, `var(--on-error-container)` text, `--radius-control` border radius.

#### Scenario: Retry button is accessible and styled

- GIVEN an error region is rendered,
- WHEN the "Reintentar" button is inspected,
- THEN it has `type="button"`, `background: transparent`, `border: 1px solid var(--error)`, `color: var(--on-error-container)`, `border-radius: 10px`, `padding: 6px 12px`, AND clicking it invokes the existing `onRetry()` / `onRetryCreate()` / `onRetryQuery()` handler.
