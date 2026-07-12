# Responsive Form Containment Specification

## Purpose

Specify observable containment, reflow, focus, and native date-control behavior.

## Requirements

### Requirement: Responsive Grid-Cell Containment

Every text, select, textarea, and date control in a responsive grid MUST remain within its field cell from 320 through 1024 CSS px, including after catalogs load.

#### Scenario: Enrollment controls remain contained

- GIVEN `/enrollments` has loaded contract-valid options at 800 CSS px
- WHEN control and field-cell border boxes are measured
- THEN each control is fully contained within its own field cell

#### Scenario: Student-search controls remain contained

- GIVEN `/student-search` has loaded contract-valid options at 1024 CSS px
- WHEN the academic filter controls are measured
- THEN each control is fully contained within its own field cell

### Requirement: Same-Row Separation and Focus Visibility

Same-row controls MUST NOT intersect. Keyboard focus rendering MUST remain visible and MUST NOT intersect or be obscured by an adjacent field or control.

#### Scenario: Same-row controls remain separate

- GIVEN populated controls occupy the same responsive grid row
- WHEN their rendered border boxes are compared
- THEN no control border box intersects another field or control on that row

#### Scenario: Focus rendering remains unobscured

- GIVEN a control has an adjacent field on the same row
- WHEN keyboard navigation places visible focus on that control
- THEN its focus indicator is visible around the control
- AND no part of that indicator intersects or is painted over by the adjacent control

### Requirement: Usable Reflow with Long Labels

Forms MUST preserve responsive wrapping while every field remains visible, reachable, and operable at 320, 800, 960, and 1024 CSS px. Long contract-valid option labels MUST NOT force selects beyond their cells.

#### Scenario: Fields wrap at narrow and intermediate widths

- GIVEN a form is displayed at a specified narrow or intermediate width
- WHEN its fields wrap onto additional rows
- THEN each label and control remains visible, reachable, operable, and collision-free

#### Scenario: Long catalog option remains usable

- GIVEN the longest contract-valid option label in a loaded catalog exceeds the available cell width
- WHEN the option is selected at 320 CSS px or an intermediate width
- THEN the select remains contained and preserves the selected value and native selection interaction

### Requirement: Native Chromium Date Picker Preservation

Chromium date controls MUST retain their native calendar indicator, picker activation, keyboard operability, and selected-value behavior at every covered width.

#### Scenario: Native date picker remains available

- GIVEN a date control is visible in Chromium at a covered width
- WHEN an operator activates its calendar indicator
- THEN the native date picker opens and permits a valid date selection
- AND the selected date remains available to the form

#### Scenario: Date control remains keyboard operable

- GIVEN a date control is reached by keyboard navigation
- WHEN the operator enters a contract-valid date
- THEN the control accepts the date without losing its visible focus indication

### Requirement: Browser Regression Evidence and Document Reflow

Automated Chromium evidence MUST cover loaded `/enrollments` at 800 and 320 CSS px and `/student-search` at 1024 and 320 CSS px. Documents MUST NOT expose horizontal page overflow.

#### Scenario: Chromium regression matrix passes

- GIVEN contract-valid catalog states are loaded on the enrollment and student-search surfaces
- WHEN browser-level containment, same-row separation, focus, and reflow checks run at their required widths
- THEN every geometry and focus check passes without relying solely on document width

#### Scenario: Document-level no-overflow remains intact

- GIVEN either covered surface is rendered at a required width
- WHEN document scroll width is compared with viewport width
- THEN document scroll width does not exceed viewport width
