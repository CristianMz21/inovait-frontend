# Proposal: Fix Responsive Form Collisions

## Intent

Prevent native controls from escaping CSS Grid cells at common viewport/zoom combinations. Collisions disrupt enrollment, student search, teacher contracts, student history, and municipal report workflows across 320–1024 CSS px and 200% zoom-equivalent layouts.

## Scope

### In Scope

- Add one shared containment invariant for existing field wrappers and non-checkbox native controls.
- Preserve layouts, semantics, focus indicators, and Chromium's native date-picker indicator.
- Add Playwright geometry and focus coverage at reproduced thresholds.

### Out of Scope

- Redesigning density, breakpoints, labels, route content, tables, or navigation.
- Forcing equal widths/one-column layouts or migrating to a shared form component.
- Changing forms, APIs, catalogs, HTML semantics, browser projects, or adding broad snapshots.

## Capabilities

### New Capabilities

- `responsive-form-containment`: Cross-route containment, reflow, unobscured focus, and native date-picker preservation.

### Modified Capabilities

None; workflow and domain behavior remain unchanged.

## Approach

First slice: add scoped selectors in `src/styles.scss` applying `min-inline-size: 0` to seven wrapper classes and `max-inline-size: 100%; min-inline-size: 0` to relevant descendants. Exclude checkboxes. Do not add `width: 100%`, clipping, display changes, or picker pseudo-element changes.

Extend `e2e/frontend-remediation.spec.ts` with a compact Chromium route/viewport matrix. Assert controls stay within fields, avoid same-row intersections, and retain visible, unobscured keyboard focus. Keep document overflow secondary, retain date behavior coverage, and manually smoke-test the Chromium picker icon.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/styles.scss` | Modified | Shared containment invariant. |
| `e2e/frontend-remediation.spec.ts` | Modified | Browser geometry and focus coverage. |

## Accessibility Implications

Protect WCAG 2.2 reflow at 320 CSS px/200% zoom equivalence and non-obscured focus. Avoiding clipping keeps focus indicators perceivable and controls operable.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Intrinsic sizing varies | Medium | Use loaded catalogs and small geometry tolerances. |
| Long select text truncates | Medium | Inspect longest options at compact widths. |
| Date picker regresses | Low | Preserve CSS constraints and smoke-test Chromium. |
| New wrappers miss the rule | Medium | Document the wrapper convention. |

## Rollback Plan

Revert the selector group and focused Playwright cases; no migration is involved.

## Dependencies

- Existing mock-backed Playwright fixture and loaded catalog states.

## Success Criteria

- [ ] Controls remain contained and collision-free at reproduced thresholds and 320 CSS px.
- [ ] Focus stays visible/unobscured and document overflow does not regress.
- [ ] Native date inputs and Chromium's picker indicator remain usable and unchanged.
- [ ] Delivery stays near 80–130 changed lines, below 400, in one PR.
