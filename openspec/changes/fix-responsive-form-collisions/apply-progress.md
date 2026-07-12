# Apply Progress: Fix Responsive Form Collisions

## Status

- Mode: Standard (`strict TDD` is disabled; `openspec/config.yaml` is absent).
- Delivery: One urgent push to `main`; the implementation diff is 177 changed lines, and the full intended OpenSpec-backed change is 689 lines. The user explicitly accepted exceeding the 400-line review budget.
- Progress: 8 of 10 tasks complete.

## Completed Tasks

- [x] 1.1 Added the focused enrollment regression and recorded the pre-fix failure.
- [x] 1.2 Added the centralized wrapper and direct-control containment invariant.
- [x] 1.3 Preserved breakpoints, checkbox sizing, presentation rules, and date-picker pseudo-element rules.
- [x] 2.1 Added the required enrollment and student-search viewport matrix with loaded long labels, containment, separation, value, and overflow checks.
- [x] 2.2 Added keyboard-focus outline geometry checks against same-row peers.
- [x] 2.4 Ran the focused Chromium regression command.
- [x] 3.1 Ran the requested type, formatting, build, and full focused-spec checks.
- [x] 3.3 Confirmed no temporary diagnostics, snapshots, fixture changes, or feature-SCSS deduplication remain.

## Remaining Tasks

- [ ] 2.3 Automated date type, keyboard focus, value retention, and containment pass at all four widths. A human still needs to confirm that Chromium's native calendar indicator opens and a picker-selected value persists.
- [ ] 3.2 The headed suite passes, but no human manual picker result was available to record.

## Commands and Evidence

| Command                                                                                                                           | Result                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run e2e:mock -- e2e/frontend-remediation.spec.ts --project=desktop-chromium --grep "responsive form containment"` before CSS | Failed as expected: enrollment at 800 px and student search at 1024 px exposed controls beyond their field right edges; both 320 px cases exposed document overflow. |
| Same focused command after CSS                                                                                                    | Passed: 4 tests.                                                                                                                                                     |
| `npm run typecheck`                                                                                                               | Passed.                                                                                                                                                              |
| `npx prettier --check src/styles.scss e2e/frontend-remediation.spec.ts`                                                           | Passed.                                                                                                                                                              |
| `npm run build`                                                                                                                   | Passed.                                                                                                                                                              |
| `npm run e2e:mock -- e2e/frontend-remediation.spec.ts --project=desktop-chromium`                                                 | Passed: 12 tests.                                                                                                                                                    |
| Focused command with `--headed`                                                                                                   | Passed: 4 tests. The first chained launch raced prior web-server cleanup and exited early; a standalone rerun passed.                                                |
| `git diff --check`                                                                                                                | Passed.                                                                                                                                                              |

## Files Changed

- `src/styles.scss` — centralized low-specificity wrapper/control containment.
- `e2e/frontend-remediation.spec.ts` — required geometry, focus, long-option, date, and viewport regression matrix.
- `openspec/changes/fix-responsive-form-collisions/tasks.md` — completed-task checkboxes.
- `openspec/changes/fix-responsive-form-collisions/apply-progress.md` — cumulative apply evidence.

## Deviations and Risks

- No design deviation. The implementation does not add `width: 100%`, clipping, display changes, or date pseudo-element changes.
- Manual browser-chrome picker confirmation remains because Playwright cannot reliably inspect the native popup.
- Unrelated generated `.atl` registry/cache drift was excluded from the intended commit scope because it is local tooling output and not part of the responsive-form fix.
