# Tasks: Configurable Round Timing

**Input**: Design documents from `/specs/002-round-timing-settings/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The feature spec does not request TDD explicitly, but Constitution Development Workflow step 4 mandates "tests alongside the code they cover" and step 5 requires tests to pass — so every story carries test tasks, written before the implementation they cover (the same ordering used in `001-improv-round-draw`).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project, web app (frontend-only, client-only SPA): `src/`, `tests/` at repository root, per plan.md §Project Structure. Components in `src/components/` (PascalCase, one component per file, no inline functions, Constitution Principle VII), domain logic in `src/domain/` (camelCase), hooks in `src/hooks/`, storage in `src/storage/`, tests in `tests/unit/` (pure functions) and `tests/integration/` (rendered flows) sharing `tests/setup.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the inherited 001 baseline and the toolchain before changing anything

- [x] T001 Verify the inherited 001 baseline is green before any change: `npm run lint && npm run typecheck && npm test` all pass against the untouched `src/` and `tests/` trees, so any later failure is attributable to this feature (Constitution Development Workflow step 5)
- [x] T002 [P] Confirm no new runtime dependency is introduced — `package.json` `dependencies` stays exactly `react` and `react-dom`; the two timing fields are `type="text"` with `inputMode="numeric"` validated by a pure function, not a numeric-stepper or validation library (plan.md Technical Context, research R1, Constitution §2 "No new runtime dependencies")
- [x] T003 [P] Confirm no CI change is needed: `.github/workflows/ci.yml` already runs lint, type-check, and tests, which is the verification this feature requires (Constitution §Development Workflow step 5)

**Checkpoint**: Baseline green — foundation can start

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Storage schema v2 with the version 1 → 2 upgrade, the timing domain module, and the per-round answer time — every user story depends on these (plan.md Design Notes 1 and 2)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (write first, confirm they fail)

- [x] T004 [P] Write unit tests for `parseSeconds` and the message builders in `tests/unit/timing.test.ts`, covering both kinds: valid whole seconds in range (`0`, `3`, `5` for animation; `5`, `60`, `300` for answer), `out-of-range` (`6`, `9` for animation; `4`, `301` for answer), `not-a-whole-number` (`3.5`, `-5`, `1e2`, `3,5`, `abc`, `+3`), and `empty` for `''` and whitespace; assert the always-visible hints read exactly "Whole seconds from 0 to 5. Use 0 to skip the animation." and "Whole seconds from 5 to 300.", and that the two rejection messages name the field, state its range, and use the **currently committed value** in the "still in use" figure rather than the default (FR-002, FR-006, FR-007, SC-009)
- [x] T005 [P] Write unit tests for the version 1 → 2 upgrade in `tests/unit/sessionStore.test.ts`: a valid `version: 1` document with one disabled participant, an interrupted `currentRound` (`remainingMs: 42000`), and `view: "play"` upgrades to `version: 2` with `timing = { animationSeconds: 3, answerSeconds: 60 }` and round `answerMs: 60_000`; every other value copied through unchanged; a valid `version: 2` document is used as is; invalid v2, invalid v1, missing, unparseable, absent, and `version: 3` all yield `emptySession()`; `loadSession` never throws (FR-013, research R4, quickstart V7b)
- [x] T006 [P] Update `tests/unit/roundState.test.ts` to the per-round model: `startRound('p1', 'q1', drawnAt, answerMs)` sets `deadline = drawnAt + answerMs` and `remainingMs = answerMs`; clamps in `remainingOf`, `interruptRound`, and `resumeRound` use the round's own `answerMs`, asserted with a non-default `answerMs` of `10_000` and `300_000`; `0 ≤ remainingMs ≤ round.answerMs` and never negative; `ROUND_DURATION_MS` is no longer imported or exported (research R6, SC-003, data-model Invariant 3)

### Implementation

- [x] T007 Add `TimingSettings` (`animationSeconds` — whole seconds `0`–`5` inclusive, default `3`; `answerSeconds` — whole seconds `5`–`300` inclusive, default `60`), `Round.answerMs: number` (the `answerSeconds` in effect at draw time, in ms, immutable for the life of the round), and `SessionData` with `version: 2` and a **required** `timing` field so no read site needs a defaulting branch; make `emptySession()` return version 2 with the default timing in `src/domain/types.ts` (data-model.md §Entities)
- [x] T008 [P] Create `src/domain/timing.ts` exporting `TimingKind = 'animation' | 'answer'`, the `TimingRange` constants, `defaultTiming()`, `parseSeconds(raw, kind)` returning `{ status: 'valid', seconds } | { status: 'empty' } | { status: 'out-of-range' } | { status: 'not-a-whole-number' }` after trimming only, and the hint and rejection-message builders — every plain-language string generated from the same range object the app enforces, so the shown limit and the enforced limit cannot drift (FR-002, FR-006, FR-007, research R1, R10)
- [x] T009 [P] Implement the schema-v2 validator and an internal `upgradeToCurrent` step in `src/storage/sessionStore.ts`: keep the v1 shape in a `LegacySessionData` type inside the storage layer, attach `timing` defaults and `answerMs: 60_000` to a validated v1 document, copy every other value through unchanged, export **no new function**, and keep `loadSession` non-throwing — a missing or unparseable, corrupt, or unknown-version document still yields an empty session (FR-013, SC-014, research R4, contracts/session-storage-v2.md)
- [x] T010 [P] Make the round duration per-round in `src/domain/roundState.ts`: delete the module constant `ROUND_DURATION_MS`, add the `answerMs` parameter to `startRound`, and clamp `remainingOf`, `interruptRound`, and `resumeRound` with the round's own `answerMs` so a 5 s and a 300 s round are both counted down correctly and the displayed value never differs from the configured answer time by more than one tick (FR-004, SC-003, research R6)
- [x] T011 [P] Update every seeded `SessionData` literal in `tests/integration/round-flow.test.tsx`, `tests/integration/setup-flow.test.tsx`, `tests/integration/disable-flow.test.tsx`, `tests/integration/game-over-flow.test.tsx`, and `tests/integration/performance.test.tsx` to `version: 2` with a `timing` object, and add `answerMs` to any seeded round so the existing suite type-checks against the new schema
- [x] T012 Run `npm run lint && npm run typecheck && npm test` and confirm `src/domain/timing.ts`, `src/domain/types.ts`, `src/domain/roundState.ts`, `src/storage/sessionStore.ts`, and the three touched `tests/unit/` files plus the five `tests/integration/` seeds are green before starting Phase 3

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Set the animation time and the answer time before playing (Priority: P1) 🎯 MVP

**Goal**: The setup view carries two session-wide fields — animation time `0`–`5` (default `3`) and answer time `5`–`300` (default `60`), each committing on blur or Enter with no save button, each showing its range and a plain-language rejection message, plus a single **Restore default timing** action; the next draw honours both values and a round already on screen is never altered.

**Independent Test**: Open the setup view on a fresh browser, set the animation time to `0` and the answer time to `10`, draw a round, and verify that no animation is shown and that the countdown starts at `00:10` (spec US1 Independent Test; quickstart V1–V8).

### Tests for User Story 1

- [x] T013 [P] [US1] Write the setup timing flow integration test in `tests/integration/timing-settings-flow.test.tsx`, covering: defaults `3` and `60` shown with both range hints on a fresh browser (V1, FR-005, SC-010); `0` committed by clicking elsewhere and `10` committed by pressing Enter with no error and no save control anywhere on screen (V2, FR-008, US1 AS10); the next draw revealing with no visible animation and a countdown reading `00:10`, and with an animation time of `5` revealing only after 5 s (V2, V3, FR-003, SC-001, SC-002); `9` rejected with the `0`–`5` range and the field showing `0` again, `2` rejected in the answer field with the `5`–`300` range, and `3.5`, `abc`, `-5` each rejected with the whole-seconds message and never persisted across a reload (V4, FR-006, FR-007, SC-009); an emptied answer field returning to `60` and an emptied animation field returning to `3` (V5, FR-007, SC-016); **Restore default timing** setting both fields back with no dialog (V6, FR-011); `0`/`10` surviving a reload (V7a, FR-009, SC-008); a hand-seeded `version: 1` document keeping every participant, question, disabled state, `currentRound`, and `view` while the two fields read `3`/`60` and **Draw** is not blocked (V7b, FR-012, FR-013, SC-014); a mid-round change leaving the interrupted round frozen at `00:20` and applying `02:00` only to the next draw (V8, FR-010, SC-015); and the countdown matching the configured answer time exactly for `5`, `10`, and `300` (SC-003)
- [x] T014 [P] [US1] Extend `tests/integration/performance.test.tsx` with the SC-001 assertion: with the animation time at `0` and 200 participants plus 200 questions, the current-round region is on screen within 1 s of pressing **Draw** and no cycling placeholder text is ever rendered (see T016 for the import cleanup this file needs once the export is deleted)

### Implementation for User Story 1

- [x] T015 [US1] Expose `timing`, `setTiming(kind, seconds)`, and `restoreDefaultTiming()` from `src/hooks/useSessionData.ts`, each routing through the existing auto-save effect so both values are written on every mutation and survive a page reload and a full browser restart; `restoreDefaultTiming` must not touch `currentRound` (FR-008, FR-009, FR-010, FR-011, SC-008)
- [x] T016 [US1] Rework `src/hooks/useRound.ts` to accept the configured timing: pass `animationSeconds * 1000` to the animation path, copy `answerSeconds * 1000` into the round via the new `startRound` argument at draw time, and add the `animationSeconds === 0` branch that reveals synchronously in the same handler with no `setTimeout` and `DrawAnimation` never mounted. **In this same task delete the `ANIMATION_DURATION_MS` export and every importer of it** — `src/components/PlayView.tsx`, `tests/integration/performance.test.tsx`, and `tests/integration/round-flow.test.tsx`, the two test files taking a local test constant instead — because `tsconfig.app.json` includes `tests`, so a dangling import would break `npm run typecheck` for every remaining task in this phase (FR-003, FR-010, SC-001, research R7)
- [x] T017 [P] [US1] Create `src/components/TimingField.tsx` **and `src/components/TimingField.module.css`**: one labelled `type="text"` + `inputMode="numeric"` input with a local draft string, committing on blur and on Enter through `parseSeconds`, restoring the last committed value in the input on rejection, clearing the message once a later entry is accepted, and rendering the always-visible range hint plus the `role="alert"` rejection message under the field; every handler a named `useCallback` const and the two fields wired through one delegated handler with a `data-*` discriminator, never `type="number"`; the field owns all of its own styling, so no parent stylesheet reaches into it (FR-002, FR-006, FR-007, FR-008, Constitution Principle VII, research R1, R2)
- [x] T018 [US1] Create `src/components/TimingSettings.tsx` and `src/components/TimingSettings.module.css`: one full-width panel holding both `TimingField` instances side by side plus the single **Restore default timing** button to their right, containing no validation logic of its own — every limit and message comes from `src/domain/timing.ts` — and no styling of the field's internals, which belong to `TimingField.module.css` (FR-001, FR-002, FR-011, SC-015, research R3, R10)
- [x] T019 [US1] Render the Timing panel as a full-width row above the Participants and Questions panels in `src/components/SetupView.tsx`, leaving the existing two-column list grid, the privacy line, and **Clear all data** unchanged (FR-001, contracts/timing-settings-ui.md §Placement)
- [x] T020 [US1] Pass `timing` into `useRound` and the configured `durationMs` into `DrawAnimation` from `src/components/PlayView.tsx` (FR-003, SC-001, research R7)

**Checkpoint**: `npm run lint && npm run typecheck && npm test` green — User Story 1 is fully functional and testable independently (MVP) — quickstart V1–V8

---

## Phase 4: User Story 2 - Move on when the participant answers early (Priority: P2)

**Goal**: The play view shows exactly one end-of-round control, labelled **Next round**, present and enabled from the instant the assignment appears through the final second, after time is up, and when an interrupted round is presented again; pressing it stops the countdown at once, clears the screen, leaves counts and item states untouched, and returns the view to the ready state without drawing anything.

**Independent Test**: Seed a session, set the answer time to `30`, draw a round, and press the move-on control with 20 seconds still on the clock; verify the assignment leaves the screen immediately and the session is ready for the next draw (spec US2 Independent Test; quickstart V9–V11).

### Tests for User Story 2

- [x] T021 [P] [US2] Write the move-on flow integration test in `tests/integration/move-on-flow.test.tsx`, covering: exactly one control labelled **Next round** in the running, final-second, and time-up states and **none** while the draw animation runs, with **Draw** disabled during the animation (V10, FR-014, FR-015, FR-017, SC-017); pressing it with 20 of 30 seconds left stopping the countdown at once, removing the pair, enabling **Draw** immediately, and drawing nothing by itself (V9, FR-016, FR-022, SC-005); eligible and disabled counts unchanged afterwards and the skipped participant and question still listed and drawable again (FR-018, FR-019, SC-006); **Resume countdown** plus **Next round** in the interrupted state, with **Next round** dropping the round (V10 step 4, US2 AS5); a rapid double press ending exactly one round so the next **Draw** produces one new pair (V11, FR-021); and, after moving on early until one eligible question remains, disabling it and pressing **Draw** reporting questions as exhausted with no pair and no animation (V11, FR-020)
- [x] T022 [P] [US2] Update `tests/integration/round-flow.test.tsx` for the shared control: the interrupted "Discard round" click becomes **Next round**, and an assertion is added that the control is already present and enabled while the round is still counting down (FR-015, SC-004)

### Implementation for User Story 2

- [x] T023 [P] [US2] Create `src/components/MoveOnButton.tsx` and `src/components/MoveOnButton.module.css`: the single shared control carrying the label **Next round**, never disabled while a round is on screen, and styled at the same size and prominence as the play view's other primary action so it needs no searching on a shared screen (FR-014, SC-004, SC-013, research R8)
- [x] T024 [US2] Render `MoveOnButton` unconditionally in `src/components/RoundDisplay.tsx` — present while running, unchanged in the final second, and still the same single control at time up — and delete the time-up-only button branch so no second control can appear when the answer time elapses (FR-014, FR-015, FR-018, SC-017)
- [x] T025 [US2] Replace the "Discard round" button with `MoveOnButton` in `src/components/InterruptedRound.tsx`, keeping **Resume countdown** as the only other control that can appear with a round, and rename the `onDiscard` prop accordingly (FR-014, US2 AS5)
- [x] T026 [US2] Wire the move-on handler in `src/components/PlayView.tsx` to the existing `closeRound`/`discardRound` path — `setCurrentRound(null)` and nothing else, so no item status changes and no draw is started — and rely on the existing `currentRound === null` early return as the double-press guard (FR-016, FR-018, FR-019, FR-021, FR-022, research R9)
- [x] T027 [P] [US2] Remove the now-unused button rules from `src/components/RoundDisplay.module.css` and `src/components/InterruptedRound.module.css`, keeping the "Time's up!" signal styling (FR-024, Constitution Principle I)

**Checkpoint**: `npm run lint && npm run typecheck && npm test` green — User Stories 1 AND 2 both work independently — quickstart V1–V11

---

## Phase 5: User Story 3 - Run a fast round-based session end to end (Priority: P3)

**Goal**: The combined payoff: with the animation time at `0` and the answer time at `10`, a 20-round session reveals instantly, never waits longer than the configured answer time, and never makes the host wait for a control to become available.

**Independent Test**: Configure animation time `0` and answer time `10`, then run 20 rounds in which the answer is given almost immediately each time, pressing the move-on control every round. Verify no round ever waits longer than the configured answer time and no animation ever appears (spec US3 Independent Test; quickstart V12).

### Tests for User Story 3

- [x] T028 [P] [US3] Add the end-to-end fast-session test in `tests/integration/timing-settings-flow.test.tsx`: set animation time `0` and answer time `10`, play 20 consecutive rounds pressing **Next round** a few seconds into each, and assert that no animation placeholder is ever rendered, that no round's countdown starts above `00:10` or runs past 10 s on its own, that the draw control is available immediately after every move-on, and that no round ever ended without either the answer time elapsing or the host choosing to move on (SC-002, SC-007, SC-011)
- [x] T029 [P] [US3] Add the default-behaviour regression test in `tests/integration/round-flow.test.tsx`: a session where neither timing field is ever touched still reveals after the default 3 s animation and counts down from `01:00`, and the **Next round** control is present from the first paint of the assignment (US3 AS4, SC-010, FR-005)
- [x] T030 [US3] Add the first-paint availability assertions to `tests/integration/move-on-flow.test.tsx`: with the animation time at `0`, the assignment and an enabled **Next round** control are on screen in the same render with no waiting, and with an answer time of `10` the control is still present in the final second without flickering or disabling (contract move-on-control.md §Timing interaction, SC-004)

**Checkpoint**: `npm run lint && npm run typecheck && npm test` green — all user stories through P3 are independently functional and the feature's stated outcome is demonstrable — quickstart V12

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and verification that affect all user stories

- [x] T031 [P] Audit English-only across the new identifiers, UI strings, validation messages, test names, and documentation in `src/`, `tests/`, and `specs/002-round-timing-settings/` and fix any violations (Constitution Principle II)
- [x] T032 [P] Update `README.md` to describe the two timing fields and the always-available **Next round** control, and add a pointer to `specs/002-round-timing-settings/quickstart.md` alongside the existing 001 pointer
- [x] T033 [P] Verify the privacy guarantee still holds: during quickstart V1–V12 in DevTools → Network no request carries the timing values, the names, or the questions, and `PRIVACY_LINE` in `src/components/SetupView.tsx` is still exactly "Your lists stay on this device and are never sent to anyone." (FR-025, quickstart V13)
- [x] T034 Run `npm run lint && npm run typecheck && npm test && npm run build` from the repository root — all four must pass, matching `.github/workflows/ci.yml` (Constitution §Development Workflow step 5)
- [x] T035 Execute quickstart.md scenarios V1–V13 manually against `npm run dev`, using the `version: 1` seed document from quickstart.md §V7b, and record the results in `specs/002-round-timing-settings/quickstart-results.md`
- [x] T036 Write the pull-request description disclosing the deliberate, justified deviation from a literal reading of the spec's Key Entities: `Round` does **not** persist `animationMs` because the animation phase is fully consumed at the reveal and nothing reads the value afterwards, while `answerMs` is frozen on the round and is the mechanism that satisfies FR-010 (plan.md §Post-design re-check, research R5, Constitution Principle I and §Governance written-justification rule)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational completion
  - US1 (P1) first → MVP
  - US2 (P2) next: replaces the end-of-round affordances in `RoundDisplay` and `InterruptedRound`, which exist from 001
  - US3 (P3): the combined outcome of US1 and US2 — verified rather than built, so it adds no production code
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational — no dependencies on other stories. The timing panel, its validation, and the per-round freeze are all delivered here
- **User Story 2 (P2)**: Starts after Foundational — independently testable; it changes the play view's controls but no timing logic, so it does not import US1 code
- **User Story 3 (P3)**: Starts after Foundational + US1 + US2 — exercises the animation time, the answer time, and the always-available control together; carries no production tasks of its own

### Within Each User Story

- Tests MUST be written and confirmed to fail before the implementation they cover
- Domain modules before hooks, hooks before components, components before integration wiring
- `timing.ts` before `TimingField`, `TimingField` before `TimingSettings`, `TimingSettings` before `SetupView`
- `MoveOnButton` before the three call sites that render it
- Story complete and verified before moving to the next priority

### Parallel Opportunities

- Phase 1: T002 and T003 parallel (different concerns, no shared files)
- Phase 2: T004 + T005 + T006 parallel (three test files); T008 + T009 + T010 + T011 parallel (four source/test files, all gated only on T007)
- US1: T013 + T014 parallel (two test files); T015 + T016 parallel (two hook files, no shared dependency); T017 → T018 → T019 sequential (`TimingSettings` renders `TimingField`, which `SetupView` renders); T020 after T015 and T016
- US2: T021 + T022 + T023 parallel (three different files); T027 parallel
- US3: T028 + T029 parallel (two different test files); T030 after T021
- Polish: T031 + T032 + T033 parallel (three different targets)
- With multiple developers: after Foundational, US1 and US2 can proceed simultaneously — they touch `src/components/SetupView.tsx` and the play-view files respectively, with no shared file — and US3 follows once both land

---

## Parallel Example: User Story 1

```bash
# Launch both test files together (different files, no dependencies):
Task: "Write the setup timing flow integration test in tests/integration/timing-settings-flow.test.tsx"
Task: "Extend tests/integration/performance.test.tsx with the SC-001 assertion"

# Then the two hooks together — different files, neither imports the other:
Task: "Expose timing, setTiming and restoreDefaultTiming from src/hooks/useSessionData.ts"
Task: "Rework src/hooks/useRound.ts and delete the ANIMATION_DURATION_MS export with all three importers"

# Then the component chain, strictly in order:
Task: "Create src/components/TimingField.tsx and src/components/TimingField.module.css"
Task: "Create src/components/TimingSettings.tsx and src/components/TimingSettings.module.css"
Task: "Render the Timing panel in src/components/SetupView.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Launch the new test, the existing test update, and the new shared control together:
Task: "Write the move-on flow integration test in tests/integration/move-on-flow.test.tsx"
Task: "Update tests/integration/round-flow.test.tsx for the shared control"
Task: "Create src/components/MoveOnButton.tsx and src/components/MoveOnButton.module.css"

# Then wire the three call sites in order:
Task: "Render MoveOnButton unconditionally in src/components/RoundDisplay.tsx"
Task: "Replace the Discard round button in src/components/InterruptedRound.tsx"
Task: "Wire the move-on handler in src/components/PlayView.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: quickstart V1–V8 — set both values, watch the next draw honour them, confirm a mid-round change leaves the round alone
5. Demo: a host can run a fast session by setting `0` and `10`, with no dead time removed yet

### Incremental Delivery

1. Setup + Foundational → schema v2 in place, no existing host loses a list
2. Add US1 → validate quickstart V1–V8 (MVP! timing is configurable)
3. Add US2 → validate quickstart V9–V11 (dead time is gone)
4. Add US3 → validate quickstart V12 (the full fast session works end to end)
5. Polish → quickstart V13, full verification (T034–T036)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (setup panel, timing domain wiring — the critical path to MVP)
   - Developer B: US2 (play-view controls — different files, no overlap with US1)
3. After both land: one developer runs US3 verification, the other starts Polish
4. Everyone converges on Polish

---

## Notes

- [P] tasks = different files, no dependencies
- A task that removes an exported symbol removes **all** of its importers in the same task, because `tsconfig.app.json` includes `tests` and a dangling import fails `npm run typecheck` (T016 is the worked example)
- `npm run lint && npm run typecheck && npm test` must be green at every checkpoint, not only at the end of the feature (Constitution §Development Workflow step 5)
- [Story] labels map tasks to specific user stories for traceability
- Each user story is independently completable and testable (spec "Independent Test" copied into each phase)
- Commit after each task or logical group using Conventional Commits, e.g. `feat(timing): add configurable round timing`, `feat(play): make the next round control always available`, `fix(storage): upgrade version 1 sessions to version 2` (Constitution Principle VI)
- Stop at any checkpoint to validate the story independently
- No backend, server, import/export, per-round override, sound, or second-timer tasks exist by design: FR-023, FR-024 and FR-025 forbid them
