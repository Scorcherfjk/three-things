# Tasks: Improv Round Draw

**Input**: Design documents from `/specs/001-improv-round-draw/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. The feature spec does not request TDD explicitly, but Constitution Development Workflow step 4 mandates "tests alongside the code they cover" and step 5 requires tests to pass — so every story carries test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project, web app (frontend-only): `src/`, `tests/` at repository root, per plan.md structure. Components in `src/components/` (PascalCase, one component per file, no inline functions), domain logic in `src/domain/` (camelCase), hooks in `src/hooks/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and toolchain per Constitution Principle V and Section 2

- [ ] T001 Scaffold the Vite React-TS project in the repository root (`npm create vite@latest . -- --template react-ts`) producing the `src/`, `tests/` layout from plan.md, keeping existing `specs/` and `.specify/` intact
- [ ] T002 [P] Configure ESLint (typescript-eslint + react-hooks + react-refresh) and Prettier in `eslint.config.js` and `.prettierrc`, plus `.editorconfig`
- [ ] T003 [P] Configure Husky with lint-staged and commitlint (@commitlint/config-conventional) in `.husky/pre-commit`, `.lintstagedrc`, and `commitlint.config.js`
- [ ] T004 [P] Enable TypeScript `strict` mode and the `@/` path alias in `tsconfig.json` and `vite.config.ts`
- [ ] T005 [P] Add production `Dockerfile` (multi-stage `npm run build` → nginx static serve of `dist/`)
- [ ] T006 [P] Add GitHub Actions CI workflow running lint, type-check, and tests in `.github/workflows/ci.yml`
- [ ] T007 [P] Add `.env.example`, `.gitignore`, and `README.md` baseline per constitution Section 2

**Checkpoint**: Toolchain ready — foundation can start

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities, storage, and app shell that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create domain entities in `src/domain/types.ts`: `Participant` and `Question` (`id` unique/immutable, `text` non-empty after trim with accents preserved, `status: 'eligible' | 'disabled'`), `Round` (`participantId`, `questionId`, `drawnAt`, `deadline`, `remainingMs`, `status: 'running' | 'interrupted' | 'timeup'`), `SessionData` (`version: 1`, `participants`, `questions`, `currentRound: Round | null`, `view: 'setup' | 'play'`) exactly as specified in data-model.md
- [ ] T009 Implement the session storage contract in `src/storage/sessionStore.ts` (plus `src/storage/storageKeys.ts`): `loadSession()` never throws and returns empty `SessionData` on missing/corrupt/unknown version; `saveSession()`/`clearSession()` return `SaveResult` (`{ ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'serialize' }`); single localStorage key `three-things.session` — see contracts/session-storage.md
- [ ] T010 [P] Configure Vitest with jsdom environment and React Testing Library in `vitest.config.ts` (test config merged with `vite.config.ts`) and `tests/setup.ts` importing `@testing-library/jest-dom`
- [ ] T011 Implement `useSessionData` hook in `src/hooks/useSessionData.ts`: load persisted session on mount, add item, remove item by `id`, edit text by `id` (status unchanged), persist every mutation via `saveSession`, and expose a storage-error state for failed writes (FR-007)
- [ ] T012 Create the App shell owning `view: 'setup' | 'play'` state (restored from `SessionData.view`) with the "Three Things" header and view switch in `src/app/App.tsx`, mounted by `src/main.tsx`, plus `src/styles/global.css`
- [ ] T013 [P] Create the shared item list renderer (one generic component used for participants and questions: text, status badge, slot for trailing controls) in `src/components/ItemList.tsx`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Draw a pair and play a timed round (Priority: P1) 🎯 MVP

**Goal**: Host presses one Draw button, watches an animation, and gets one participant + one question with a visible 60-second countdown; extra presses ignored; time-up signal; interrupted rounds resume or discard.

**Independent Test**: Seed the application with a fixed set of participant names and questions, press the draw button, and verify that exactly one eligible participant and one eligible question are presented with a running countdown (spec US1 Independent Test; quickstart V2/V3).

### Tests for User Story 1

- [ ] T014 [P] [US1] Unit test for uniform random selection over eligible items only, with injected deterministic RNG, in `tests/unit/draw.test.ts`
- [ ] T015 [P] [US1] Unit test for round lifecycle transitions (running → interrupted freezes `remainingMs`; resume continues; discard returns to none with pair still eligible; timeup holds) in `tests/unit/roundState.test.ts`

### Implementation for User Story 1

- [ ] T016 [P] [US1] Implement `selectRound` uniform random selection from eligible items with injectable RNG in `src/domain/draw.ts` (FR-018; never selects `status === 'disabled'`, FR-029)
- [ ] T017 [P] [US1] Implement pure round state machine with fixed 60 000 ms (`deadline` epoch math, freeze/resume/discard, ±1 s accuracy, no configurable duration) in `src/domain/roundState.ts` (FR-022, FR-024, FR-026)
- [ ] T018 [US1] Implement `useRound` hook: start draw (guard re-entrancy per FR-021), run animation phase, reveal pair, tick countdown only while `running` on the play view, pause on view change/reload, resume/discard, acknowledge → next round; persist `currentRound` via `useSessionData`/`sessionStore` (FR-026) in `src/hooks/useRound.ts`
- [ ] T019 [P] [US1] Create draw animation component cycling candidate names/questions with CSS `@keyframes`, total duration 2–3 s hard-capped below 5 s, resolving deterministically into the pre-selected pair in `src/components/DrawAnimation.tsx` + `src/components/DrawAnimation.module.css` (FR-016, FR-017)
- [ ] T020 [US1] Create round display showing participant name and question with equal visual prominence and an `MM:SS` countdown starting at `01:00`, plus a visible time-up signal that keeps the pair on screen, in `src/components/RoundDisplay.tsx` (FR-019, FR-020, FR-022, FR-024)
- [ ] T021 [US1] Create interrupted-round component showing frozen remaining time, "Round interrupted — countdown paused" label, and explicit **Resume countdown** / **Discard round** actions in `src/components/InterruptedRound.tsx` (FR-026)
- [ ] T022 [US1] Implement Play view with exactly one Draw control (disabled during animation/round, FR-015), all round states, list rendering, and ignored extra activations in `src/components/PlayView.tsx` per contracts/play-view.md (FR-013, FR-021, FR-023, FR-036)
- [ ] T023 [US1] Wire the view switch in `src/app/App.tsx` so leaving the play view while a countdown runs stops it and marks the round interrupted, and returning shows the resume-or-discard choice with the exact time left (FR-014, FR-026)
- [ ] T024 [US1] Add integration test covering draw → countdown → leave view → interrupted restore → resume and discard, and double-press guard, in `tests/integration/round-flow.test.tsx`

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Load and manage the participant and question lists (Priority: P2)

**Goal**: Host pastes bulk lists, adds/removes/edits single items, data persists in the browser across reloads; privacy line and clear-all with confirmation; storage failures surfaced.

**Independent Test**: Open the setup view on a fresh browser, paste 10 names and 10 questions, reload the page, and verify every item is still present (spec US2 Independent Test; quickstart V1/V6).

### Tests for User Story 2

- [ ] T025 [P] [US2] Unit test for line import rules (split per line, trim surrounding whitespace, drop empty/whitespace-only lines, keep duplicates as independent entries, skip name > 200 chars / question > 500 chars individually, preserve accents/internal punctuation) in `tests/unit/importLines.test.ts`

### Implementation for User Story 2

- [ ] T026 [P] [US2] Implement bulk line import returning `{ accepted, rejected }` per the constraints quoted in T025 in `src/domain/importLines.ts` (FR-002, FR-004, FR-009)
- [ ] T027 [US2] Create Setup view with bulk paste textarea + **Add lines** button, single-item add input, per-item remove, and in-place text edit that keeps the item's eligible/disabled status in `src/components/SetupView.tsx` per contracts/setup-view.md (FR-001, FR-003, FR-010)
- [ ] T028 [P] [US2] Create clear-all confirmation dialog ("Clear all participants and questions from this device? This cannot be undone." → Clear everything / Cancel) in `src/components/ClearAllDialog.tsx` (FR-008)
- [ ] T029 [US2] Add the always-visible privacy line "Your lists stay on this device and are never sent to anyone." and wire clear-all to `sessionStore.clearSession` after confirmation in `src/components/SetupView.tsx` (FR-011, FR-012)
- [ ] T030 [US2] Create status banner for plain-language messages (storage failure: "We couldn't save your changes in this browser. Your last saved lists are unchanged."; long-line rejection notice) in `src/components/StatusBanner.tsx` (FR-007)
- [ ] T031 [US2] Add integration test for paste → items appear → reload restores everything → edit persists → clear-all wipes after confirm in `tests/integration/setup-flow.test.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Control repeats by disabling a participant or a question (Priority: P3)

**Goal**: Host disables/enables individual items from the play view; disabled items stay visible but are never drawn; restore-all re-enables everything; states survive reload.

**Independent Test**: Seed at least three participants, disable two of them, draw repeatedly, and verify the third participant is the only one ever drawn; then return one to eligible and verify it can be drawn again (spec US3 Independent Test; quickstart V4).

### Tests for User Story 3

- [ ] T032 [P] [US3] Unit test for item status transitions (toggle sets `disabled`/`eligible`, restore-all sets every item `eligible`, editing text never changes status) in `tests/unit/itemStatus.test.ts`

### Implementation for User Story 3

- [ ] T033 [US3] Implement disable/enable toggle by `id` and restore-all in `src/hooks/useSessionData.ts`, persisted on every change (FR-027, FR-030, FR-031)
- [ ] T034 [US3] Add per-item Eligible/Disabled toggle controls and a single **Restore all to eligible** action to the play-view lists in `src/components/PlayView.tsx` and `src/components/ItemList.tsx` (FR-027, FR-028, FR-030)
- [ ] T035 [US3] Add integration test for disable → subsequent draws never select it → re-enable → drawable again → reload preserves states → restore-all re-enables all in `tests/integration/disable-flow.test.tsx`

**Checkpoint**: All user stories through P3 are independently functional

---

## Phase 6: User Story 4 - See what is left and finish the session (Priority: P4)

**Goal**: Play view always shows eligible/disabled counts; drawing with zero eligible questions or participants reports which resource ran out without animating or presenting a pair; session can continue via restore-all with lists intact.

**Independent Test**: Disable every remaining question on a seeded session and verify the application clearly reports that the game is over and offers a way to continue with new questions (spec US4 Independent Test; quickstart V5).

### Tests for User Story 4

- [ ] T036 [P] [US4] Unit test for count derivation (eligible/disabled per kind) and game-over detection (zero eligible questions vs zero eligible participants vs both, single eligible of either kind still drawable) in `tests/unit/counts.test.ts`

### Implementation for User Story 4

- [ ] T037 [P] [US4] Implement pure count/eligibility derivation functions in `src/domain/counts.ts` (FR-032, FR-033, FR-034)
- [ ] T038 [US4] Add the counts bar (`Eligible participants: N · Eligible questions: N · Disabled: N participants, N questions`) and game-over states in `src/components/PlayView.tsx` and `src/components/StatusBanner.tsx`: message names the exhausted resource, draw control disabled, no animation, no pair (FR-032, FR-033, SC-012)
- [ ] T039 [US4] Add integration test for counts display → all questions disabled → game-over message without pair → restore-all → draws resume with lists intact in `tests/integration/game-over-flow.test.tsx`

**Checkpoint**: All four user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 [P] Apply desktop legibility styling: participant name and question fully visible at 1280×720 without scrolling, equal prominence, large shared-screen text, no horizontal scrollbars in either view, in `src/styles/global.css` and component CSS modules (SC-016, SC-011, FR-038)
- [ ] T041 [P] Audit English-only across identifiers, UI strings, comments, and docs (Constitution Principle II) and fix any violations in `src/` and `tests/`
- [ ] T042 [P] Extend `tests/unit/draw.test.ts` with a seeded-RNG check for disabled-item exclusion over 30 rounds (SC-003) and the SC-007 fairness band: 10,000 draws over 10 eligible participants with every selection count between 850 and 1,150
- [ ] T043 Validate performance with 200 participants + 200 questions: draw activation to result within 1 s, no list-render jank, in `tests/integration/performance.test.tsx` plus manual timing (SC-006)
- [ ] T044 Update `README.md` with setup/run/test commands, the privacy statement, and a pointer to `specs/001-improv-round-draw/quickstart.md`
- [ ] T045 Run full verification: `npm run lint && npm run typecheck && npm test && npm run build` must all pass
- [ ] T046 Execute quickstart.md scenarios V1–V9 manually against the dev server and record results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational completion
  - US1 (P1) first → MVP
  - US2 (P2) next: supplies the data entry that US1 consumes in real use (story code itself does not import US1 code beyond the App shell)
  - US3 (P3): extends play-view lists; reuses `useSessionData` (Foundational) and `PlayView` (US1)
  - US4 (P4): extends `PlayView`/`StatusBanner`; counts logic is standalone
- **Polish (Phase 7)**: Depends on all desired user stories being complete (T040–T044 can start as soon as the relevant story lands; T045–T046 need everything)

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational — no dependencies on other stories (seed lists directly for independent testing)
- **User Story 2 (P2)**: Starts after Foundational — independently testable; integrates with US1 only through shared `SessionData`
- **User Story 3 (P3)**: Starts after Foundational + US1 (`PlayView` exists to host toggles); toggle logic itself lives in Foundational `useSessionData`
- **User Story 4 (P4)**: Starts after Foundational + US1 (`PlayView` exists to host counts/game-over states)

### Within Each User Story

- Tests before/alongside implementation (constitution: tests alongside the code they cover)
- Domain modules before hooks, hooks before components, components before integration tests
- Story complete and verified before moving to next priority

### Parallel Opportunities

- Phase 1: T002–T007 all parallel (different files)
- Phase 2: T010 and T013 parallel
- US1: T014+T015 parallel (tests); T016+T017+T019 parallel (three different files)
- US2: T025 and T028 parallel; T025+T026 can pair with T028
- US3: T032 parallel with implementation
- US4: T036+T037 parallel
- Polish: T040–T044 all parallel (different files)
- With multiple developers: after Foundational, US1 // US2 can proceed simultaneously; US3 // US4 after their respective `PlayView` prerequisites

---

## Parallel Example: User Story 1

```bash
# Launch tests for US1 together (different files, no dependencies):
Task: "Unit test for uniform random selection in tests/unit/draw.test.ts"
Task: "Unit test for round lifecycle transitions in tests/unit/roundState.test.ts"

# Launch independent implementation tasks together:
Task: "Implement selectRound in src/domain/draw.ts"
Task: "Implement round state machine in src/domain/roundState.ts"
Task: "Create DrawAnimation.tsx + DrawAnimation.module.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: quickstart V2/V3 — draw, countdown, interrupt/resume/discard
5. Demo: a seeded session is fully playable

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → validate (MVP! playable with seeded lists)
3. Add US2 → validate quickstart V1/V6 (lists load and persist)
4. Add US3 → validate quickstart V4 (repeat control)
5. Add US4 → validate quickstart V5 (counts and clean ending)
6. Polish → quickstart V7–V9, full verification (T045–T046)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (critical path to MVP)
   - Developer B: US2 (independent of US1 code)
3. After US1 lands: Developer A takes US3, Developer B takes US4
4. Everyone converges on Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map tasks to specific user stories for traceability
- Each user story is independently completable and testable (spec "Independent Test" copied into each phase)
- Commit after each task or logical group (Conventional Commits, Constitution Principle VI)
- Stop at any checkpoint to validate the story independently
- No backend/server tasks exist by design: FR-011/FR-037 forbid network transmission and accounts
