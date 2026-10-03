# Research: Configurable Round Timing

**Branch**: `002-round-timing-settings` | **Date**: 2026-09-26
**Status**: All `NEEDS CLARIFICATION` items from the Technical Context are resolved.
**Baseline**: extends `001-improv-round-draw`; the decisions of `001`'s `research.md` (R1–R7) stay in force unless overridden below.

## R1. Timing input control type

**Decision**: `type="text"` with `inputMode="numeric"`, validated by a pure integer-parsing function. Not `type="number"`.

**Rationale**:

- FR-007 forbids rounding, clamping, and silently storing anything the host did not enter, and requires whole seconds only. A `type="number"` input lets the browser do its own normalization before the app ever sees the value: `3.` collapses to `3`, `3,5` and locale decimal separators are accepted and then coerced, `e`/`+`/`-` survive as intermediate states, and the spinner steps outside the accepted range. Each of those is a stored value the host did not type.
- A text input keeps the raw keystrokes under application control, so "the last valid value is kept" (FR-006/FR-007) and "0 rejected values are stored" (SC-009) are decisions this codebase makes, not the browser's.
- `inputMode="numeric"` still gives the host a numeric keypad on a phone without any behavior change on desktop.
- The whole rule collapses into one pure function `parseSeconds(raw, kind)`, which is directly unit-testable — FR-002/FR-006/FR-007 and SC-009 are then properties of a function rather than of a DOM interaction.

**Alternatives considered**:

- _`type="number"` with `step={1}` and `min`/`max`_: the browser's own validation and normalization are non-deterministic across engines and do not cover the negative/non-numeric case the spec groups with the whole-number message; a rejected value can still reach `onChange` as `''`.
- _`type="range"` slider_: cannot express an exact 300-second answer time or a typed 0 sensibly, and drags on a shared screen.
- _Custom stepper with `+`/`−` buttons_: 300 taps for the maximum answer time; a new control with no spec basis (Principle I, YAGNI).

## R2. Commit semantics for the two fields

**Decision**: Each field owns a local draft string. It commits on **blur** and on **Enter**, through `parseSeconds`; on rejection it restores the last committed value in the input and shows a message inline under that field. There is no save control (FR-008, SC-015).

**Rationale**:

- FR-008 requires the value to take effect the moment the host leaves the field, with no separate save action, and the app's other setup-view inputs all persist on change — so "save on leave" is the consistent shape for a host who never reads instructions (SC-012).
- Writing through on every keystroke is impossible to satisfy: typing `10` passes through `1`, which is out of range for the answer field, so the app would store and then reject intermediate values and flash an error at a host who typed something perfectly valid. FR-007 forbids storing what she did not mean to store.
- A debounce would work but invents a delay the spec never mentions and would make "in effect for the very next draw" (SC-015) depend on how fast she typed.
- A local draft also gives the empty-field case (FR-007, SC-016) a natural home: an empty draft parses to the default and the field is re-rendered with the default value.

**Alternatives considered**:

- _Commit on every keystroke with the previous value kept as fallback_: stores out-of-range intermediate values and shows an error mid-typing (see above).
- _Commit on blur only_: a host who types `10` and presses Enter expects it to apply (US1 AS10); Enter is handled explicitly.
- _Commit on blur with a Save button as well_: FR-008 explicitly forbids requiring a save action.

## R3. Where the two fields live

**Decision**: A dedicated `TimingSettings` panel in the setup view, rendered as a full-width row above the two list panels, holding two `TimingField` inputs side by side plus one **Restore default timing** action.

**Rationale**:

- FR-001 requires the fields "alongside the participant and question lists", and the setup view already establishes the panel-in-a-grid convention (`ListPanel` + `.panels`), so a third panel is the consistent shape rather than a new layout idea.
- A third equal column would squeeze the two paste areas on the 1280-wide floor size that 001's play-view contract fixes; a full-width row keeps both fields, their range hints, and the restore action readable while leaving the existing two-column grid untouched.
- Grouping both values in one panel is what makes FR-011's "single action that restores both fields" a one-button affair instead of two buttons.
- It keeps `ListPanel` single-purpose (participants/questions) and avoids splitting one concern across two files (Principle III, SRP).

**Alternatives considered**:

- _One field inside each `ListPanel`_: splits timing across two files, duplicates the range hint and the commit logic, and makes "restore both" impossible as one action.
- _A dialog opened from the setup footer_: adds a step to a flow the spec requires to be immediate, and hides the current values from the host (SC-012).
- _Inline in the setup footer next to **Clear all data**_: crowds a destructive action with two benign numeric fields.

## R4. Storage schema version and migration of existing sessions

**Decision**: Bump `SessionData.version` to `2`, add a required `timing` field, and add one `upgradeToCurrent` step inside `sessionStore.ts` that converts a validated `version: 1` document into `version: 2` by attaching the default timing. A document with a newer/unknown version still loads as an empty session (unchanged 001 behavior). A v1 round migrates with `answerMs: 60_000`, the value 001 hardcoded.

**Rationale**:

- FR-013 and SC-014 forbid losing a saved session and require the two fields to appear with their defaults for data written by the previous version. The current parser rejects any `version !== 1` by returning `null`, and `loadSession` turns that into `emptySession()` — so simply adding the field without a migration would silently wipe every existing host's participants, questions, and disabled states. This is the single highest-risk requirement in the feature.
- The `version` field already exists for exactly this purpose, so a version bump plus one upgrade function is the smallest change that honours both the requirement and the existing schema intent.
- Keeping the v1 shape (`LegacySessionData`) and the upgrade inside `sessionStore.ts` keeps the storage-format concern out of the domain: `src/domain` must not know that a document format ever changed. The module's responsibility stays "read, validate, upgrade, write the session document".
- `answerMs: 60_000` for a migrated round preserves the previous behaviour exactly: 001's clamp was `ROUND_DURATION_MS = 60_000`, so a restored interrupted round keeps the same remaining time it had (FR-013, 001 SC-017).

**Alternatives considered**:

- _Keep `version: 1` and make `timing` optional_: defeats the purpose of the version field and forces a null check plus a default at every read site — worse DRY/SOLID than one upgrade function.
- _Patch the raw JSON in `loadSession` before validation_: splits validation across two places and makes corrupt-data handling ambiguous.
- _Migrate by writing a second key and merging on load_: two sources of truth for one document; more code for no benefit.

## R5. What a round persists about its timing

**Decision**: `Round` gains `answerMs` (the answer time in effect when the round was drawn). It does **not** gain `animationMs`.

**Rationale**:

- `answerMs` is load-bearing after the reveal: `deadline` is `reveal + answerMs`, and the clamps in `remainingOf` and `resumeRound` must use it (SC-003, 5–300 s). Freezing it on the round is precisely what makes FR-010 true — a value the host puts in effect mid-round cannot alter, extend, shorten, or restart the round on screen.
- `animationMs` has no consumer after the reveal. Its entire effect is consumed when the reveal timestamp is chosen, and FR-024 forbids adding an indicator that would display it. Persisting it would be a field nothing reads — Principle I (YAGNI) — so it is deliberately omitted, with the spec's "a round carries the animation time and the answer time it was started with" satisfied in substance: the round is the product of an animation of that length, revealed at `drawnAt`.
- Storing seconds and converting to milliseconds once, at draw time, keeps the persisted document in the same unit the host types, and makes the migration defaults trivial (`3` / `60`).

**Alternatives considered**:

- _Persist both_: an unread field (Principle I) with a migration and validator to maintain for nothing.
- _Persist neither and read the live settings_: directly violates FR-010 — a mid-round change would alter a countdown the participant is relying on.
- _Store the animation deadline too_: the reveal is not a timed phase after it completes; there is nothing to freeze.

## R6. Per-round answer-time clamping

**Decision**: Delete the module constant `ROUND_DURATION_MS` and clamp with the round's own `answerMs` in `remainingOf`, `interruptRound`, and `resumeRound`.

**Rationale**:

- SC-003 requires the displayed countdown to match the configured value for every accepted value from 5 to 300 s. The current clamps are hardcoded to `60_000` and would truncate a 300-second round and mis-handle a 5-second one.
- The constant encodes exactly the 001 FR-024 rule ("every round MUST give exactly 60 seconds and MUST NOT offer the host any way to change it") that this specification supersedes, so removing it prevents the superseded rule from surviving as dead-but-authoritative-looking code.
- `formatClock` is unchanged: it already renders `MM:SS` up to `05:00`.

**Alternatives considered**:

- _Keep the constant and scale it at each use site_: multiplies a magic number at four call sites; the next reader cannot tell which value is authoritative.

## R7. Zero-second animation

**Decision**: Branch in `useRound.draw` — when `animationSeconds === 0`, reveal synchronously in the same handler (no `animating` state, no `setTimeout`, `DrawAnimation` never mounted). Otherwise the existing timeout path runs unchanged.

**Rationale**:

- FR-003 says 0 "MUST mean that the draw reveals the assignment immediately, with no visible animation"; SC-001 requires the assignment on screen within 1 s. `setTimeout(fn, 0)` still defers to the next macrotask, and `DrawAnimation` would still mount one frame of cycling placeholder text before revealing — a visible flash, which is the exact thing the host asked 0 to opt out of.
- Branching on the value is the simplest correct behaviour and adds no state, no flag, and no code path inside `DrawAnimation`.
- `DrawAnimation` itself needs no change: it already takes `durationMs` as a prop, so the only edit is passing the configured value instead of the removed constant.

**Alternatives considered**:

- _`setTimeout(fn, 0)`_: deferred reveal plus a cycling frame — violates FR-003.
- _A CSS transition/keyframes with duration 0_: the intermediate keyframe is still painted.
- _Let `DrawAnimation`'s internal timeout resolve_: same flash, plus a second timing mechanism that must agree with `useRound`'s.

## R8. The single move-on control

**Decision**: One `MoveOnButton` component with the single label **Next round**, rendered by `RoundDisplay` in the running and time-up states and by `InterruptedRound` in place of the current "Discard round". It is never disabled while a round is on screen, and it is not rendered during the animation or when no round exists. "Resume countdown" remains only in the interrupted state (001 FR-026, unchanged by this specification).

**Rationale**:

- FR-014, FR-015 and SC-017 demand exactly one move-on control in every state a round can be in — running, final second, time up, interrupted — and forbid a separate acknowledgement control appearing at time up. A single shared component makes the label and the always-enabled state one source of truth, so a second control cannot appear by accident.
- FR-017 requires the control to be unavailable during the animation, which is satisfied structurally: the animation renders `DrawAnimation` instead of any round display, so the control does not exist in that state.
- FR-021's double-press guard is the existing `currentRound === null` early return plus the idempotent `discardRound`. Because the move-on never starts a draw (FR-022), a second press finds no round and returns — a double press cannot skip two rounds.
- The label "Next round" is kept from 001's time-up control so the host meets the same word in every state; "Discard round" reads as a data-destruction action for a round that merely ended, and renaming it would make the interrupted state inconsistent with the others.

**Alternatives considered**:

- _Keep "Next round" hidden until time up and add an early "Skip" button_: two controls in the same state family, explicitly forbidden by FR-014 and SC-017.
- _Reuse "Discard round" as the shared label_: misleading wording for the normal end-of-round path.
- _Three copies of the button in three components_: duplicated label and enabled logic — a DRY violation and the exact way a second control later creeps in.

## R9. Ending a round early

**Decision**: The move-on control calls the existing `discardRound` path — `setCurrentRound(null)` — and nothing else.

**Rationale**:

- FR-018, FR-019 and FR-022 require that ending a round early behaves exactly like acknowledging a completed one: no item status change, counts untouched, no automatic draw. `discardRound` already returns `null` and never touches the lists, so reusing it satisfies all three with no new code path.
- FR-020's "which resource ran out" message already exists in the play-view banner and is driven by the unchanged eligible counts, so the next draw after an early move-on reports exhaustion through the existing mechanism with no new message.
- FR-013's guarantee that skipped items stay drawable is inherited from 001 unchanged (001 SC-017).

**Alternatives considered**:

- _A new `endRoundEarly` transition_: a second path to the same state, with a risk of the two drifting apart.

## R10. Message strings derived from the validated ranges

**Decision**: The range objects and the plain-language messages live together in `src/domain/timing.ts`; each message is produced by a function of the range, so the text a host reads is generated from the numbers the app enforces.

**Rationale**:

- FR-002, FR-006 and FR-007 all require the range shown to the host and the range the app enforces to be the same fact. Deriving one from the other makes a mismatch impossible to introduce.
- It keeps every added string in one English-only module (Principle II), consistent with the existing `StatusBanner` message-constant convention.

**Alternatives considered**:

- _Hardcoded strings in the component_: a range change silently desynchronizes the message from the validation — the precise defect FR-006 exists to prevent.

## R11. Testing strategy for this feature

**Decision**: Extend the existing Vitest + React Testing Library suite with fake timers. Unit tests for `parseSeconds` (ranges, non-integer, negative, letters, empty), the `version: 1 → 2` upgrade (data preserved, defaults added, legacy round gets `answerMs: 60_000`), and `startRound`/`remainingOf`/`resumeRound` with a non-default `answerMs`. Integration tests for the setup timing flow, persistence across a reload, the zero-second animation, and the move-on flow.

**Rationale**:

- The suite already runs with fake timers and a seeded `Math.random`, and every numeric success criterion (SC-001, SC-002, SC-003, SC-015, SC-016) is a deterministic property of a pure function, so it belongs in `tests/unit/` rather than in a browser.
- The interaction criteria (SC-004, SC-005, SC-017) are one round of draw → press → assert, which the existing integration tests already model end to end.
- No new tooling: Principle I forbids adding a dependency the platform or an existing one already solves, and 001's research already rejected a Playwright layer for the same reason.

**Alternatives considered**:

- _Playwright/Cypress end-to-end_: heavier scaffolding for criteria that are already deterministic under fake timers (YAGNI).
- _Manual verification only_: SC-009 ("0 rejected values are stored") and the migration guarantee are not reliably checkable by eye.

## Open items

None. All Technical Context unknowns are resolved above.
