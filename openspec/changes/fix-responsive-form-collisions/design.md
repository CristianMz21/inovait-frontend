# Design: Fix Responsive Form Collisions

## Technical Approach

Add one low-specificity containment invariant to `src/styles.scss`. Target the seven field wrappers (`enrollment`, `search`, `contracts`, `history`, `age`, `sector`, and `top`), set `min-inline-size: 0` on each, and constrain direct native-control children with `min-inline-size: 0; max-inline-size: 100%`. Include `input:not([type="checkbox"])`, `select`, and `textarea`.

This removes intrinsic minimums without changing `repeat(auto-fit, minmax(220px, 1fr))`, the 320 px single-column rules, semantics, or styling. Global `box-sizing: border-box` makes the maximum apply to the control border box. Feature SCSS remains responsible for presentation and focus appearance.

## Architecture Decisions

### Decision: Centralize only the containment invariant

| Option | Tradeoff | Decision |
|---|---|---|
| Scoped global rule over known wrappers | One maintenance point; new wrapper classes must be added deliberately | Chosen |
| Duplicate fixes in every feature SCSS | Preserves encapsulation but invites drift across seven copies | Rejected |
| Shared form component migration | Stronger long-term abstraction but changes markup and exceeds this defect's scope | Rejected |

Use `:where(...)` for the wrapper list and a direct-child combinator before native controls. This keeps specificity below component selectors and prevents leakage into nested widgets such as `.contracts-school` checkboxes. Do not consolidate duplicated feature SCSS; it contains presentation and date-input safeguards beyond this invariant.

### Decision: Remove intrinsic pressure, not impose widths

| Option | Tradeoff | Decision |
|---|---|---|
| Logical min/max inline sizes | Allows shrinkage while retaining each control's natural width below the cell limit | Chosen |
| `width: 100%` | Forces every control to fill its cell and can alter date-control/picker geometry | Rejected |
| Breakpoint-specific patches | Fixes sampled widths only and duplicates rules around intrinsic-size failures | Rejected |
| Overflow clipping | Hides collisions but can cut off focus outlines and native UI | Rejected |

Chromium may elide long selected text, but its value and native interaction remain intact. No pseudo-element, `appearance`, font shorthand, or display change will touch date inputs, preserving existing calendar-indicator rules.

### Decision: Verify border boxes and focus geometry separately

| Option | Tradeoff | Decision |
|---|---|---|
| Playwright geometry assertions with small tolerance | Tests the actual failure while tolerating subpixel rounding | Chosen |
| Document `scrollWidth` alone | Misses collisions that remain inside the page | Rejected as primary evidence |
| Screenshots | Broad and brittle; do not prove containment | Rejected |

## Data Flow

```text
loaded catalog option -> native control intrinsic size
                      -> wrapper min-inline-size: 0
                      -> grid track chooses/wraps available cell
                      -> control min/max inline constraint
                      -> contained border box + focus ring in grid gap
```

The existing grid continues to auto-fit 220 px tracks and wrap them; at 320 px its existing media rule uses one flexible track. No breakpoint or column-count behavior changes.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/styles.scss` | Modify | Add the scoped wrapper/control containment invariant; leave date-picker pseudo-element rules unchanged. |
| `e2e/frontend-remediation.spec.ts` | Modify | Add reusable rectangle helpers and the required Chromium route/viewport matrix. |

## Interfaces / Contracts

No application API or markup contract changes. The CSS contract is: a recognized field wrapper can shrink as a grid item, and each direct non-checkbox native control cannot exceed that wrapper's inline border-box size.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| E2E geometry | `/enrollments` at 800/320 and `/student-search` at 1024/320 after catalogs load | Compare control and wrapper rectangles with a 1 px tolerance; compare same-row rectangles for non-intersection. |
| E2E content | Longest loaded option and responsive wrapping | Select the longest contract-valid label, assert value preservation, containment, reachability, and no horizontal document overflow. |
| E2E focus/date | Unobscured keyboard focus and native date behavior | Enter focus through keyboard, verify computed visible outline, inflate the control rectangle by outline width plus offset, and prove it does not intersect an adjacent field/control. Assert date type, fill/value, focus, and geometry. |
| Manual Chromium smoke | Browser-owned calendar indicator and picker popup | In headed Chromium, confirm the icon remains visible/clickable and a selected date persists; Playwright cannot reliably inspect native browser chrome. |

## Migration / Rollout

No migration or feature flag is required. Deliver as one PR, targeting roughly 20–30 CSS lines and 60–100 Playwright lines (about 80–130 changed lines, below the 400-line review budget). Avoid unrelated SCSS deduplication, snapshots, or route expansion.

Rollback is limited to removing the new global selector block and its focused Playwright helpers/cases. No component markup, local feature SCSS, data, or browser configuration needs restoration.

## Open Questions

None.
