## Exploration: Robust responsive form control containment

### Current State

The Angular frontend renders native controls inside CSS Grid fieldsets using
`repeat(auto-fit, minmax(220px, 1fr))`. Most date-sensitive field wrappers are
`display: block`, while their controls are `display: inline-block`; commit
`40ed8fac` intentionally removed flex-column wrappers and `width: 100%` because
that combination distorted Chromium's native date-picker indicator.

The responsive defect is internal to the grid, not necessarily the document.
Headless Chromium reproduced these examples after catalog options loaded:

- At 1024 CSS px, student-search's school select was 258.19 px inside a
  225.50 px grid item and overlapped the next field.
- At 800 CSS px, enrollment text/select controls were 252.19–258.19 px inside
  230 px items and several overlapped adjacent fields.
- At 960 CSS px, teacher-contracts' teacher select was 292.19 px inside a
  269.33 px item and overlapped the following date field.
- The age-distribution report reproduced the same school-select collision as
  student search. At 320 CSS px, several routes also produced document
  overflow because intrinsic control sizing enlarged the single-column grid.

The existing Playwright test passed at its configured desktop and Pixel 5
viewports because it only checks
`document.documentElement.scrollWidth <= innerWidth`. That condition does not
detect one grid child painting into another grid cell.

A runtime-only CSS probe (no repository code changed) applied
`min-inline-size: 0` to the field wrappers and
`max-inline-size: 100%; min-inline-size: 0` to their non-checkbox form
controls. It eliminated every measured escape, overlap, and document overflow
across five routes and ten widths from 1280 to 320 CSS px. The measured date
input and calendar-indicator computed geometry was unchanged before and after
the probe.

Styling ownership is currently split:

- `src/styles.scss` owns the shared fieldset/control rules for
  teacher-contracts and student-history, plus the global Chromium date-picker
  indicator rules.
- Enrollment, student search, age distribution, teacher counts by sector, and
  top schools own comparable field rules in component stylesheets.
- All three report forms are present together under `/reports`, so that route
  provides one seam for report-wide containment checks.

### Affected Areas

- `src/styles.scss` — best boundary for a narrowly scoped, cross-route
  containment invariant; already contains shared control and native date-input
  rules.
- `src/app/features/enrollments/enrollment-create.component.scss` — local grid
  and date-sensitive field styling; collisions reproduce in both fieldsets.
- `src/app/features/student-search/student-search.component.scss` — local grid
  whose school select collides in “Filtros académicos”.
- `src/app/features/teacher-contracts/teacher-contracts.component.scss` — route
  structure and checkbox styling; text/select/date control sizing is shared
  globally.
- `src/app/features/student-history/student-history.component.scss` — uses the
  global field rules and must remain contained at 320 CSS px.
- `src/app/features/reports/age-distribution/age-distribution.component.scss` —
  local select/date grid with a reproduced school-select collision.
- `src/app/features/reports/teacher-counts-by-sector/teacher-counts-by-sector.component.scss`
  — local date-control grid sharing the same native-input constraints.
- `src/app/features/reports/top-schools/top-schools.component.scss` — select-only
  grid with a flex-column wrapper; it should receive containment without
  changing its layout model.
- `e2e/frontend-remediation.spec.ts` — existing mock-backed Playwright fixture,
  terminal-state waits, and route loop are the appropriate regression seam,
  but its current document-overflow assertion is insufficient.
- `playwright.config.ts` — already supplies desktop/mobile Chromium projects,
  screenshots and traces; no configuration change is required.

### Approaches

1. **Central scoped containment invariant** — add one selector group in
   `src/styles.scss` for the seven existing field-wrapper classes and one group
   for their relevant `input`, `select`, and `textarea` descendants.
   - Pros: fixes all current routes consistently; minimal diff; logical
     properties express the actual sizing invariant; preserves component
     visuals and date-control display mechanics.
   - Cons: the explicit class list must be extended when a new form-field
     convention is introduced.
   - Effort: Low

2. **Repeat containment in every component stylesheet** — add the same two
   declarations beside each route's current field rules.
   - Pros: keeps every rule inside Angular component encapsulation and makes
     local ownership obvious.
   - Cons: duplicates the invariant across at least seven field variants,
     increases drift risk, and requires more review for no behavioral benefit.
   - Effort: Medium

3. **Introduce a shared utility class or form-field component** — update every
   template to use a new shared styling contract.
   - Pros: gives future forms a single semantic hook and could enable broader
     form-style consolidation later.
   - Cons: creates template churn and migration risk disproportionate to this
     defect; a shared component would also have to preserve native labels,
     Angular forms, help text, and date controls.
   - Effort: High

4. **Restore full-width controls or force one-column layouts** — use
   `width: 100%`, flex-column wrappers, or broader breakpoints.
   - Pros: superficially aligns controls and can hide the collision at selected
     widths.
   - Cons: directly reopens the Chromium date-picker regression documented by
     `40ed8fac`, changes layout rather than fixing intrinsic sizing, and does
     not encode a reusable containment guarantee.
   - Effort: Low, but rejected

### Recommendation

Use approach 1. Keep visual styling and date-sensitive `display`/font behavior
where it is today, but centralize only the containment invariant in
`src/styles.scss`:

- Apply `min-inline-size: 0` to `.enrollment-field`, `.search-field`,
  `.contracts-field`, `.history-field`, `.age-field`, `.sector-field`, and
  `.top-field`.
- Apply `max-inline-size: 100%` and `min-inline-size: 0` to relevant native
  controls under those wrappers, excluding fixed-size checkboxes.
- Do not add `width: 100%`, change wrapper display modes, modify the global
  picker pseudo-element rules, or clip overflow. Overflow clipping would hide
  keyboard focus indicators rather than solve sizing.

Add a focused Playwright regression to `e2e/frontend-remediation.spec.ts` using
its existing `appPage` fixture. Exercise a compact route/viewport matrix that
hits the observed thresholds (enrollment at 800, student search and reports at
1024, teacher contracts at 960, plus 320 CSS px coverage for the shared and
single-column paths). For each relevant field/control pair, assert that the
control border box stays within its label/grid-item border box and that it does
not intersect another field on the same row. Keep the document-overflow check
as a secondary assertion, not the regression oracle.

The same test should focus representative native controls and verify they are
focusable, have a visible computed outline, and that the outline footprint is
not obscured by an adjacent control. This protects WCAG 2.2 reflow/focus
concerns without introducing `overflow: hidden`. Retain the existing
`type="date"` behavioral assertion and include a manual Chromium picker-icon
smoke check in verification, because Playwright has no stable semantic locator
for the native calendar pseudo-element.

Expected implementation size is approximately 80–130 changed text lines (CSS,
one parameterized E2E test/helper, and task/spec updates), well below the
400-line review budget. A single reviewable PR is feasible; chained PRs are not
recommended by the current forecast.

Non-goals:

- Redesigning form density, grid breakpoints, labels, or route content.
- Stretching every control to equal width or converting forms to one column.
- Refactoring all duplicated form styling into a new component/design system.
- Changing Angular form behavior, API/catalog logic, or HTML semantics.
- Redesigning table overflow or report navigation.
- Adding Firefox/WebKit projects or brittle multi-snapshot visual coverage in
  this change.

### Risks

- Native select intrinsic sizing varies by browser and option text; geometry
  assertions should use a small pixel tolerance and test loaded catalog states.
- Shrinking a native select can truncate its closed-state text visually; labels
  and the opened native option list remain available, but verification should
  inspect the longest current options at 320 CSS px and 200% zoom equivalence.
- A future form using a new wrapper class could miss the centralized selector;
  the proposal/design should document the containment convention.
- Focus checks can become brittle if they assert exact colors or pixels. Assert
  visible outline semantics and non-obscuration, not a screenshot-perfect ring.
- The native Chromium date-picker icon is not directly exposed to Playwright;
  preserving the known CSS constraints plus a manual verification remains
  necessary.

### Ready for Proposal

Yes. The bug is reproducible, the existing test gap is demonstrated, the
runtime containment hypothesis is validated across current routes and
responsive widths, and the recommended scope is small enough for one PR under
the 400-line budget. The proposal should formalize cross-route containment,
320 CSS px/zoom-equivalent reflow, focus non-obscuration, and preservation of
native date-picker behavior as acceptance boundaries.
