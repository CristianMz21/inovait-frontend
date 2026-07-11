---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include tests for critical business behavior and relevant errors. Do
not add tests solely to increase coverage or assert internal implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
- Reference at least one requirement ID in every implementation or verification task

## Path Conventions

- **Angular app**: `src/app/core/`, `src/app/shared/`, `src/app/features/`
- **Unit/integration tests**: colocated with behavior under test
- **E2E tests**: `tests/e2e/`
- Use the exact structure selected in `plan.md`; do not create a backend tree here

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (classified as P0 or P1)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize Angular standalone project with strict TypeScript
- [ ] T003 [P] Configure behavior testing, linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on `plan.md`):

- [ ] T004 Configure standalone application shell and feature routes
- [ ] T005 [P] Configure typed HTTP integration from canonical backend OpenAPI
- [ ] T006 [P] Implement consistent ProblemDetails presentation
- [ ] T007 [P] Establish accessible loading, error, success and empty states
- [ ] T008 Configure environment without secrets and with fictitious demo data
- [ ] T009 Document clean setup and evaluator execution

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P0) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Behavior Tests for User Story 1

- [ ] T010 [P] [US1] Test [requirement ID] API boundary behavior in [exact .spec.ts path]
- [ ] T011 [P] [US1] Test [requirement ID] evaluator journey in tests/e2e/[name].spec.ts

### Implementation for User Story 1

- [ ] T012 [P] [US1] Define typed API model for [requirement ID] in [exact .ts path]
- [ ] T013 [P] [US1] Create standalone view for [requirement ID] in [exact .ts path]
- [ ] T014 [US1] Implement typed HTTP service for [requirement ID] in [exact .ts path]
- [ ] T015 [US1] Implement Reactive Form and dependent selections in [exact .ts path]
- [ ] T016 [US1] Add accessible validation and ProblemDetails handling
- [ ] T017 [US1] Verify loading, error, success, empty and responsive states

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P0 or P1)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Behavior Tests for User Story 2

- [ ] T018 [P] [US2] Test [requirement ID] API boundary behavior in [exact .spec.ts path]
- [ ] T019 [P] [US2] Test [requirement ID] journey in tests/e2e/[name].spec.ts

### Implementation for User Story 2

- [ ] T020 [P] [US2] Define typed model for [requirement ID] in [exact .ts path]
- [ ] T021 [US2] Implement typed service for [requirement ID] in [exact .ts path]
- [ ] T022 [US2] Implement standalone feature view in [exact .ts path]
- [ ] T023 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P0 or P1)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Behavior Tests for User Story 3

- [ ] T024 [P] [US3] Test [requirement ID] API boundary behavior in [exact .spec.ts path]
- [ ] T025 [P] [US3] Test [requirement ID] journey in tests/e2e/[name].spec.ts

### Implementation for User Story 3

- [ ] T026 [P] [US3] Define typed model for [requirement ID] in [exact .ts path]
- [ ] T027 [US3] Implement typed service for [requirement ID] in [exact .ts path]
- [ ] T028 [US3] Implement standalone feature view in [exact .ts path]

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX [P] Accessibility and responsive verification
- [ ] TXXX [P] Additional behavior tests for identified risks
- [ ] TXXX Verify no secrets or real personal data are present
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Execute every P0 sequentially or in parallel as dependencies allow
  - P1 reports remain blocked until all P0 checkpoints pass
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **P0 stories**: Can start after Foundational (Phase 2) and remain independently testable
- **P1 stories**: Start only after all P0 checkpoints pass
- Integration between stories must not invalidate their independent verification

### Within Each User Story

- Critical business behavior and relevant errors MUST have verification tasks
- Typed models before services
- Services before feature views that consume them
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational completes, P0 stories can start in parallel when dependencies allow
- P1 stories cannot start in parallel with incomplete P0 work
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch independent behavior tests for User Story 1 together:
Task: "Test [requirement ID] API boundary behavior in [exact .spec.ts path]"
Task: "Test [requirement ID] journey in tests/e2e/[name].spec.ts"

# Launch independent UI work for User Story 1 together:
Task: "Define typed model for [requirement ID] in [exact .ts path]"
Task: "Create standalone view for [requirement ID] in [exact .ts path]"
```

---

## Implementation Strategy

### P0 First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete every P0 user story
4. **STOP and VALIDATE**: Run all P0 evaluator journeys independently
5. Begin P1 reports only after every P0 checkpoint passes

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add each P0 story → test independently → retain a demonstrable increment
3. Validate the complete P0 evaluator path
4. Add each authorized P1 report → test independently
5. Keep every increment executable without breaking prior behavior

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done, distribute only P0 stories that can proceed safely
3. Validate all P0 checkpoints
4. Then distribute independent P1 reports

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify business behavior rather than artificial coverage targets
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
