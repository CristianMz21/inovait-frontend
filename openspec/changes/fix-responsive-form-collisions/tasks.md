# Tasks: Fix Responsive Form Collisions

## Review Workload Forecast

| Field                   | Value                                              |
| ----------------------- | -------------------------------------------------- |
| Estimated changed lines | 689 intended lines after OpenSpec artifacts        |
| 400-line budget risk    | Accepted size exception                            |
| Chained PRs recommended | No                                                 |
| Suggested split         | One PR with three reviewable work-unit commits     |
| Delivery strategy       | auto-forecast                                      |
| Chain strategy          | pending (not required unless the forecast changes) |

Decision needed before apply: No
Chained PRs recommended: No; user explicitly prioritized fastest push to `main` over the 400-line review budget.
Chain strategy: not required for this urgent fix.
400-line budget risk: Accepted size exception.

### Suggested Work Units

| Unit | Goal                                                      | Likely PR | Notes                                              |
| ---- | --------------------------------------------------------- | --------- | -------------------------------------------------- |
| 1    | Reproduce enrollment collision and add shared containment | PR 1      | Keep the RED geometry check and CSS fix together.  |
| 2    | Complete route matrix, focus, and date evidence           | PR 1      | Keep all behavioral assertions with their helpers. |
| 3    | Verify and remove diagnostics                             | PR 1      | No unrelated SCSS or route expansion.              |

## Phase 1: Regression and Centralized Containment

- [x] 1.1 In `e2e/frontend-remediation.spec.ts`, add reusable rectangle/tolerance helpers and a focused `responsive form containment` enrollment check at 800 px; load catalogs, select the longest enabled non-placeholder label, and record the pre-fix containment failure.
- [x] 1.2 In `src/styles.scss`, add one low-specificity `:where(...)` rule for `.enrollment-field`, `.search-field`, `.contracts-field`, `.history-field`, `.age-field`, `.sector-field`, and `.top-field`; set wrapper `min-inline-size: 0` and direct `input:not([type="checkbox"])`, `select`, and `textarea` children to `min-inline-size: 0; max-inline-size: 100%`.
- [x] 1.3 Leave grid breakpoints, component presentation, checkbox sizing, and date-picker pseudo-element rules unchanged; make the focused 800 px regression pass with a 1 px border-box tolerance.

## Phase 2: Chromium Geometry, Focus, and Date Evidence

- [x] 2.1 Extend `e2e/frontend-remediation.spec.ts` to cover loaded `/enrollments` at 800/320 px and `/student-search` at 1024/320 px, selecting longest valid loaded labels and asserting cell containment, same-row non-intersection, reachable wrapping, selected-value preservation, and `scrollWidth <= innerWidth`.
- [x] 2.2 Add keyboard-focus checks that confirm a visible computed outline and prove its rectangle, inflated by outline width plus offset, is not intersected or obscured by an adjacent same-row field/control.
- [ ] 2.3 Preserve native date behavior in the same matrix: automated `type="date"`, keyboard focus, valid fill/value retention, and containment pass at all five widths; manual confirmation of the Chromium calendar popup remains pending.
- [x] 2.4 Run `npm run e2e:mock -- e2e/frontend-remediation.spec.ts --project=desktop-chromium --grep "responsive form containment"`.

## Phase 3: Focused Verification and Cleanup

- [x] 3.1 Run `npm run typecheck`, `npx prettier --check src/styles.scss e2e/frontend-remediation.spec.ts`, `npm run build`, and `npm run e2e:mock -- e2e/frontend-remediation.spec.ts --project=desktop-chromium`.
- [ ] 3.2 The focused headed command passes 5/5; retain the task open until a human confirms the native calendar popup because browser chrome is not reliably inspectable by Playwright.
- [x] 3.3 Remove temporary logging/reproduction instrumentation and confirm the implementation diff is limited to `src/styles.scss` and `e2e/frontend-remediation.spec.ts`, with no snapshots, fixture mutations, or feature-SCSS deduplication.
