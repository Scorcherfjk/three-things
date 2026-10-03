# Implementation Plan: Configurable Round Timing

**Branch**: `002-round-timing-settings` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-round-timing-settings/spec.md`

**Baseline**: extends `001-improv-round-draw`, whose implementation already exists in `src/`. This plan changes what it must.

## Summary

Add two session-wide timing values to the existing setup view — an animation time (0–5 s, default 3) and an answer time (5–300 s, default 60) — and make the play view's end-of-round control a single always-available **Next round** button so a host can end a round the moment a participant answers.

**Technical approach**: the two values live in the existing `SessionData` document as a required `timing` object, so they persist and survive reload with no new storage mechanism. A `version: 1 → 2` upgrade in `sessionStore.ts` attaches the defaults to sessions written by the previous version, so no host loses her lists. Each round copies the answer time in effect at draw time into `Round.answerMs`, which is what makes a mid-round change invisible to the round on screen and lets the countdown clamps follow the configured value instead of the hardcoded 60 s. Validation is a single pure function, `parseSeconds`, driven by the same range objects the on-screen hints and error messages are generated from, so the number a host is told and the number the app enforces cannot drift. The two text inputs commit on blur and on Enter, keeping a local draft string so that typing `10` never passes through an invalid intermediate value. One shared `MoveOnButton` component renders the same labelled control in the running, time-up, and interrupted states, so a second control cannot appear.

## Technical Context

**Language/Version**: TypeScript ~6.0.2, `strict`, no `any` (Constitution Section 2)

**Primary Dependencies**: React 19.2 + React DOM 19.2, Vite 8.3. No new runtime dependency is added (Constitution Section 2, Principle I).

**Storage**: browser `localStorage`, single key `three-things.session`, via the existing `src/storage/sessionStore.ts`. Schema version bumped `1 → 2`. No server, no database (FR-025, 001 FR-011).

**Testing**: Vitest 5 + jsdom + React Testing Library + `@testing-library/user-event`, with fake timers — the existing stack, unchanged (research R11)

**Target Platform**: modern desktop/laptop browser, ≥ 1280×720 (001 FR-038, 001 SC-016)

**Project Type**: single-page web application (client-only React SPA, no backend)

**Performance Goals**: reveal within 1 s of pressing **Draw** at animation time 0 (SC-001); **Next round** available within 1 s of an assignment appearing, at every point of the countdown (SC-004); assignment gone within 1 s of the move-on press (SC-005); countdown within ±1 s of the configured answer time for every value 5–300 (SC-003)

**Constraints**: nothing leaves the device (FR-025); no network layer exists; a rejected timing entry is never stored (SC-009); a round on screen is never altered, extended, shortened, or restarted by a later timing change (FR-010); no added sounds, warnings, thresholds, or second timer (FR-024); existing sessions are never cleared (FR-013)

**Scale/Scope**: 1 new domain module (`timing.ts`), 2 new components plus 1 shared control, 4 modified source modules, 3 new/updated test areas; ~200 host-facing words, all English (Constitution Principle II)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

### Pre-research gate

| Principle / standard                             | Applicable | Assessment                                                                                                                                                                                                                                                                                                                                                                   | Verdict |
| ------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| I. Simplicity First                              | Yes        | Reuses `localStorage`, the existing `SessionData` document, the existing countdown tick, the existing animation, and the existing `discardRound` path. No new state store, no new library, no dialog, no stepper, no spinner.                                                                                                                                                | PASS    |
| II. English Only                                 | Yes        | All new labels, hints, messages, identifiers, and test names are English.                                                                                                                                                                                                                                                                                                    | PASS    |
| III. KISS / DRY / SOLID                          | Yes        | Ranges and their messages come from one source (`timing.ts`), so the enforced limit and the shown limit are the same fact. The move-on label and enabled state live in one `MoveOnButton` instead of three copies. Early move-on reuses `discardRound` rather than adding a second path to the same state. `RoundDisplay`/`InterruptedRound` do not know about timing rules. | PASS    |
| IV. Node.js Stack                                | Yes        | React 19 + TypeScript, client-only. No server is introduced, so NestJS is not required; the spec forbids transmission (FR-025).                                                                                                                                                                                                                                              | PASS    |
| V. Industry-Standard Scaffolding                 | Yes        | No layout, tooling, or config change; CSS Modules continue alongside the existing toolchain.                                                                                                                                                                                                                                                                                 | PASS    |
| VI. Conventional Commits                         | Yes        | Task commits use `feat(timing): …` / `fix(play): …` / `docs(spec): …`.                                                                                                                                                                                                                                                                                                       | PASS    |
| VII. One Component Per File, No Inline Functions | Yes        | Two new components, one per file (`TimingSettings.tsx`, `TimingField.tsx`, `MoveOnButton.tsx`). Every handler is a named `useCallback` const or a module-level function, matching `ListPanel.tsx` / `PlayView.tsx`; the existing `data-*` + one delegated handler pattern is reused for the two field inputs so the commit logic is written once.                            | PASS    |
| §2 Code Organization                             | Yes        | Dependencies point inward only: components → hooks → domain → storage. `timing.ts` is domain and imports nothing from UI or storage. The storage format concern (the v1 shape) stays inside `src/storage`.                                                                                                                                                                   | PASS    |
| §2 No new runtime dependency                     | Yes        | `parseSeconds` replaces what a validation library would do; the text input replaces a numeric-stepper component.                                                                                                                                                                                                                                                             | PASS    |
| §3 Development Workflow                          | Yes        | Specify (done) → Plan (this document) → Task → Implement → Verify.                                                                                                                                                                                                                                                                                                           | PASS    |

**Pre-research verdict: PASS.** No unresolved clarification, no violation requiring justification, so the Complexity Tracking table is omitted.

### Post-design re-check (after Phase 0 and Phase 1)

| Item re-examined                                         | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Verdict                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Principle I — the zero-second animation branch           | Considered: `setTimeout(fn, 0)`, a zero-duration CSS transition, or letting `DrawAnimation`'s own timeout resolve. Each still paints a cycling frame before the reveal, which is the visible flash FR-003 forbids. The synchronous branch adds one conditional and no state.                                                                                                                                                                                                                          | PASS (research R7)                    |
| Principle I — persisting the animation time on the round | The spec's Key Entities say a round carries both times. Only `answerMs` has a consumer after the reveal; the animation's effect is fully consumed when the reveal timestamp is chosen, and FR-024 forbids showing it. Persisting it would be a field nothing reads, so it is deliberately omitted. **This is a written, justified deviation from a literal reading of the spec's Key Entities section and must be restated in the pull request description** (Principle I, Constitution §Governance). | PASS with justification (research R5) |
| Principle III DRY — the single move-on control           | One shared component rather than three near-identical buttons in `RoundDisplay` (running + time-up) and `InterruptedRound`.                                                                                                                                                                                                                                                                                                                                                                           | PASS (research R8)                    |
| Principle III DRY — range and message coupling           | The two are generated from the same `TimingRange` constants, so FR-002/FR-006/FR-007 cannot contradict the enforced limits.                                                                                                                                                                                                                                                                                                                                                                           | PASS (research R10)                   |
| Principle VII — the two timing inputs                    | `TimingField` is one component reused for both fields with a `kind` discriminator, so the commit logic, the draft state, and the message rendering exist once.                                                                                                                                                                                                                                                                                                                                        | PASS (research R1, R2)                |
| §2 layering — the storage upgrade                        | The v1 document shape and the upgrade step live in `sessionStore.ts`; `src/domain` never learns that a format ever changed, and `SessionData.timing` is required, so no read site carries a defaulting branch.                                                                                                                                                                                                                                                                                        | PASS (research R4)                    |
| FR-013 data safety                                       | The current parser rejects any `version !== 1` by returning `null`, which `loadSession` turns into an empty session. Adding `timing` without an explicit upgrade would silently wipe every existing host's lists. The plan therefore treats the upgrade as a first-class deliverable with its own unit tests, not as an afterthought.                                                                                                                                                                 | PASS (research R4, quickstart V7)     |
| Scope creep                                              | No sounds, no thresholds, no second timer, no per-round override, no import/export, no cloud sync, no migration wizard — all explicitly excluded by FR-023/FR-024/FR-025.                                                                                                                                                                                                                                                                                                                             | PASS                                  |

**Post-design verdict: PASS**, with one item that is a deliberate, justified reading of the spec (round does not persist `animationMs`) and must be disclosed in the pull request.

## Project Structure

### Documentation (this feature)

```text
specs/002-round-timing-settings/
├── plan.md                          # This file (/speckit.plan command output)
├── research.md                      # Phase 0 output — R1–R11
├── data-model.md                    # Phase 1 output — entities, validation, transitions
├── quickstart.md                    # Phase 1 output — V1–V13 validation scenarios
├── contracts/
│   ├── timing-settings-ui.md        # Phase 1 output — the two fields, commit rules, messages
│   ├── move-on-control.md           # Phase 1 output — the single Next round control
│   └── session-storage-v2.md        # Phase 1 output — schema v2 and the v1 → v2 upgrade
└── tasks.md                         # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

Single project, client-only SPA. Legend: `[new]` created by this feature, `[mod]` modified, unchanged files omitted.

```text
src/
├── app/
│   └── App.tsx                                  # unchanged — view switch, interruption on leave
├── components/
│   ├── SetupView.tsx                            # [mod] renders the Timing panel above the lists
│   ├── TimingSettings.tsx                       # [new] panel: the two fields + restore-defaults action
│   ├── TimingSettings.module.css                # [new] panel layout (full-width row)
│   ├── TimingField.tsx                          # [new] one labelled numeric field: draft, commit, message
│   ├── TimingField.module.css                   # [new] field layout, label, range hint, inline alert
│   ├── MoveOnButton.tsx                         # [new] the single labelled move-on control
│   ├── MoveOnButton.module.css                  # [new] shared control styling
│   ├── RoundDisplay.tsx                         # [mod] always-on MoveOnButton; time-up shows no second control
│   ├── RoundDisplay.module.css                  # [mod] drop the now-unused time-up button style
│   ├── InterruptedRound.tsx                     # [mod] "Discard round" replaced by MoveOnButton
│   ├── InterruptedRound.module.css              # [mod] drop the discard-button style
│   ├── PlayView.tsx                             # [mod] pass timing into useRound; drop the removed constant
│   ├── DrawAnimation.tsx                        # unchanged — already takes durationMs as a prop
│   ├── StatusBanner.tsx                         # unchanged — timing messages are generated in domain/timing.ts
│   └── (ClearAllDialog, ItemList, ListPanel)    # unchanged
├── domain/
│   ├── timing.ts                                # [new] ranges, defaults, parseSeconds, message builders
│   ├── types.ts                                 # [mod] TimingSettings; Round.answerMs; SessionData v2
│   ├── roundState.ts                            # [mod] per-round answerMs; remove ROUND_DURATION_MS
│   ├── clock.ts                                 # unchanged — already renders up to 05:00
│   ├── draw.ts / counts.ts / ids.ts / importLines.ts   # unchanged
├── hooks/
│   ├── useSessionData.ts                        # [mod] timing in session state, setTiming, restoreDefaultTiming
│   └── useRound.ts                              # [mod] configured animation/answer; zero-animation branch
└── storage/
    ├── sessionStore.ts                          # [mod] validate v2; upgrade v1 → v2 with defaults
    └── storageKeys.ts                           # unchanged — same key, no rename

tests/
├── unit/
│   ├── timing.test.ts                           # [new] parseSeconds + message derivation, both ranges
│   ├── sessionStore.test.ts                     # [new] v1 → v2 upgrade preserves data and adds defaults
│   └── (draw, counts, importLines, itemStatus, roundState)   # roundState tests extended for a custom answerMs
├── integration/
│   ├── timing-settings-flow.test.tsx            # [new] set, reject, empty, restore, persist, upgrade in the UI
│   ├── move-on-flow.test.tsx                    # [new] one control in every state; early move-on; double press
│   └── (round-flow, setup-flow, disable-flow, game-over-flow, performance)  # unchanged
└── setup.ts                                     # unchanged
```

**Structure Decision**: keep the existing single-project client-only layout (Constitution §2: no custom layout, no server). The feature adds files inside the established `src/components`, `src/domain`, `src/hooks`, `src/storage` layers and adds no new top-level directory, no new build config, and no new dependency. Every new component owns a sibling stylesheet — `TimingField.module.css`, `TimingSettings.module.css`, and `MoveOnButton.module.css` — so no component is styled through a parent's hashed class names, matching the existing `src/components/` convention where each component pairs with its own module. Tests follow the existing `tests/unit` (pure functions) and `tests/integration` (rendered flows) split, with the same `tests/setup.ts`.

## Design Notes

The load-bearing decisions live in `research.md`; these are the ones that shape the task order.

1. **Upgrade before feature** — `sessionStore.ts` gains the v2 validator and the v1 → 2 upgrade first. Every later change assumes `SessionData` always has a valid `timing` (research R4; quickstart V7).
2. **Domain before UI** — `timing.ts` and the `Round.answerMs` change come next, with unit tests, so validation and the per-round clamp are proven before any component reads them (research R1, R6).
3. **Round lifecycle before the control** — `useRound` takes the configured times and gains the zero-animation branch; the countdown is then correct for every accepted value (research R7).
4. **Then the setup panel** — two new components driven entirely by `parseSeconds`; no new validation logic in the view (research R2, R3, R10).
5. **Then the move-on control** — `MoveOnButton` replaces both existing end-of-round affordances, so exactly one control exists in every round state (research R8, R9).
6. **No refactoring of untouched code** — `DrawAnimation`, `StatusBanner`, `clock.ts`, `ListPanel`, and `draw.ts` are deliberately left alone; the feature is additive plus the four modules that must change (Principle I).
