# Data Model: Configurable Round Timing

**Branch**: `002-round-timing-settings` | **Date**: 2026-09-26
**Source**: spec.md § Key Entities, FR-001–FR-026; research R4–R6

All types live in `src/domain/types.ts` (TypeScript `strict`, no `any`). This model **extends** the one in `../../001-improv-round-draw/data-model.md`; `Participant`, `Question`, `ItemStatus`, `ItemKind`, `View` and their rules are unchanged and are not repeated here. The timing rules live in `src/domain/timing.ts` (research R1, R10).

## Entities

### TimingSettings (new)

The pair of session-wide values the host configures in the setup view.

| Field              | Type     | Rules                                                                                                                                                                              |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `animationSeconds` | `number` | Whole seconds, `0`–`5` inclusive. Default `3`. `0` means the draw reveals the assignment immediately, with no visible animation; the assignment is still drawn and shown (FR-003). |
| `answerSeconds`    | `number` | Whole seconds, `5`–`300` inclusive. Default `60` (FR-004, FR-005).                                                                                                                 |

Rules:

- Session-wide. Never per round, per participant, or per question (FR-023, FR-026).
- In effect from the moment the host leaves the field — blur or Enter — with no save action (FR-008, SC-015). Applies to every draw made after that point.
- A change NEVER touches a round that is already on screen (FR-010). Freezing happens by copy-on-draw, not by reference: the round stores its own `answerMs`.
- Both values are host-local and never transmitted (FR-025).
- Values in effect are always within their range. Range enforcement is a boundary check, never a normalization step (FR-007): a rejected entry changes nothing.

**Derived (never stored)**: the effective animation in milliseconds (`animationSeconds * 1000`) and the effective answer time in milliseconds (`answerSeconds * 1000`), both computed once at draw time.

### Round (extended)

| Field           | Type          | Rules                                                                                                                                                                                                                               |
| --------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `participantId` | `string`      | Unchanged from 001 — references a Participant that was eligible at draw time.                                                                                                                                                       |
| `questionId`    | `string`      | Unchanged from 001.                                                                                                                                                                                                                 |
| `drawnAt`       | `number`      | Epoch ms of the reveal. Chosen only after the animation phase completes, or immediately when the animation time is 0.                                                                                                               |
| `answerMs`      | `number`      | **New.** The `answerSeconds` in effect at draw time, in ms. Immutable for the life of the round; this is the mechanism that satisfies FR-010. A round migrated from a `version: 1` document gets `60_000`, the value 001 hardcoded. |
| `deadline`      | `number`      | Epoch ms = `drawnAt + answerMs`. Was `drawnAt + 60_000` in 001.                                                                                                                                                                     |
| `remainingMs`   | `number`      | Frozen value used only while `status === 'interrupted'`; `answerMs` otherwise.                                                                                                                                                      |
| `status`        | `RoundStatus` | `'running' \| 'interrupted' \| 'timeup'` — unchanged from 001.                                                                                                                                                                      |

**RoundStatus**: `'running' | 'interrupted' | 'timeup'` (unchanged)

Rules:

- The round does **not** disable its participant or question, in any status, including after an early move-on (FR-018, FR-019).
- `answerMs` is **not** persisted for `animationSeconds`: the animation phase is fully consumed at reveal and nothing reads it afterwards (research R5, Principle I).

### SessionData (extended, schema version 2)

The single persisted document (localStorage key `three-things.session`, unchanged):

| Field          | Type                | Rules                                                                                                                                 |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `version`      | `2`                 | Schema version. A `version: 1` document is upgraded on read (FR-013); an unknown or newer version yields an empty session, as in 001. |
| `participants` | `Participant[]`     | Unchanged from 001.                                                                                                                   |
| `questions`    | `Question[]`        | Unchanged from 001.                                                                                                                   |
| `timing`       | `TimingSettings`    | **New, required.** Never optional, so no read site needs a defaulting branch.                                                         |
| `currentRound` | `Round \| null`     | Unchanged from 001, with `answerMs` added inside `Round`.                                                                             |
| `view`         | `'setup' \| 'play'` | Unchanged from 001.                                                                                                                   |

### Version 1 → 2 upgrade (research R4)

`sessionStore.ts` validates a `version: 1` document with the 001 rules, then attaches defaults:

| Target field              | Value from a v1 document        |
| ------------------------- | ------------------------------- |
| `version`                 | `2`                             |
| `timing.animationSeconds` | `3` (FR-005, FR-013)            |
| `timing.answerSeconds`    | `60` (FR-005, FR-013)           |
| `currentRound.answerMs`   | `60_000` (001's fixed duration) |
| everything else           | copied through unchanged        |

The upgrade is the **only** place that knows a document format ever changed; `src/domain` is unaware of it (SRP). It is not a data migration in the destructive sense: no participant, question, status, `currentRound` or `view` value is modified, cleared, or re-derived (FR-013, SC-014).

## Validation Rules

### Timing entries

Parsing is one pure function, `parseSeconds(raw, kind)` in `src/domain/timing.ts`, returning a discriminated result. `raw` is trimmed first; the app performs no other normalization (FR-007).

| Input                                                                            | Result                             | Behavior                                                                                      | Source         |
| -------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- | -------------- |
| Whole number inside the field's range                                            | `{ status: 'valid', seconds }`     | Committed; applies from the next draw (FR-008)                                                | FR-003, FR-004 |
| Empty / whitespace-only                                                          | `{ status: 'empty' }`              | Field returns to its default — `3` / `60` — and that default applies from the next draw       | FR-007, SC-016 |
| Whole number outside the range (`9` for animation, `2` for answer time)          | `{ status: 'out-of-range' }`       | Range stated in plain language; **last valid value kept**; nothing stored                     | FR-006, SC-009 |
| Not a whole number, negative, or not a number (`3.5`, `-5`, `abc`, `1e2`, `3,5`) | `{ status: 'not-a-whole-number' }` | Whole-seconds requirement stated in plain language; **last valid value kept**; nothing stored | FR-007, SC-009 |

Additional rules:

| Rule                                                                                                   | Source                 |
| ------------------------------------------------------------------------------------------------------ | ---------------------- |
| No rounding, clamping, or silent substitution of a rejected entry — a refused value is never persisted | FR-007, SC-009         |
| One action restores both fields to `3` and `60`                                                        | FR-011                 |
| Timing never blocks the draw control, and an unconfigured session plays with the defaults              | FR-012                 |
| A timing value the host has left the field applies to the very next draw, not the one on screen        | FR-008, FR-010, SC-015 |

### Persistence

| Rule                                                                                                                         | Source             |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `loadSession` never throws; corrupt, unknown-version, or unparseable data yields an empty session (unchanged from 001)       | 001 FR-007         |
| A `version: 1` document is upgraded, never discarded — no saved content is cleared and nothing is re-entered                 | FR-013, SC-014     |
| A stored `Round` without a valid `answerMs` is invalid; within a v1 document the upgrade supplies `60_000`                   | research R4        |
| `saveSession` failure keeps in-memory state and surfaces the plain-language error — never a silent loss (unchanged from 001) | 001 FR-007         |
| Writes happen on every mutation, so both values survive reload and full browser restart                                      | FR-009, SC-008     |
| Nothing in this model is ever transmitted — there is no network layer in the codebase                                        | FR-025, 001 FR-011 |

## State Transitions

### View state (unchanged from 001)

```
setup ⇄ play     (host toggles; a running round becomes interrupted, never discarded)
```

Leaving the play view interrupts a running round. The host can change timing in the setup view and return; the round keeps the timing it started with (FR-010).

### Draw phase (new branch for animation time 0)

```
(none)
  │ draw pressed & ≥1 eligible participant & ≥1 eligible question
  │
  ├─ animationSeconds > 0 → [DrawAnimation for animationSeconds × 1000 ms] → REVEAL
  └─ animationSeconds = 0 → REVEAL immediately (no animation, no pending frame)
                                                                              │
                                                                              ▼
   select pair → startRound(participantId, questionId, revealAt, answerSeconds × 1000)
```

The pair is selected before the animation begins, exactly as in 001; the animation only delays the reveal. With 0 the reveal happens in the same handler, so the assignment is on screen in the same paint (FR-003, SC-001). The move-on control does not exist in either animation state (FR-017).

### Round lifecycle

```
RUNNING
  │ leave play view / reload / tab close → INTERRUPTED (freeze remainingMs)      (001 FR-026)
  │ remainingMs hits 0 → TIMEUP (signal visible; round stays on screen)          (001 FR-022)
  │ MOVE ON (any time, incl. final second) → NONE                               (FR-016, FR-022)
TIMEUP
  │ MOVE ON (same single control) → NONE                                        (FR-014, FR-022)
INTERRUPTED
  │ host chooses "Resume countdown" → RUNNING (continue from remainingMs)       (001 FR-026)
  │ MOVE ON (same single control) → NONE                                       (FR-014, US2 AS5)

NONE  ← every path above lands here: no round on screen, Draw available,
         no automatic draw has happened (FR-022)
```

Notes:

- **MOVE ON is one transition** from every round state, and it is exactly 001's `discardRound` → `null` (research R9). It never touches items, so counts are unchanged and the skipped pair stays drawable (FR-018, FR-019, SC-006).
- A MOVE ON while already in `NONE` is ignored (FR-021). Because the transition never starts a draw, a double press cannot skip two rounds.
- TIMEUP remains a signal, not an automatic advance: the round waits for the host (001 FR-022, spec Assumptions).

### Timing settings

```
(defaults 3 / 60)
   │ host leaves field with a valid whole number → that value, from the next draw
   │ host leaves field empty                   → default, from the next draw
   │ host leaves field with a rejected entry   → NO CHANGE, message shown
   │ "Restore default timing"                   → 3 / 60
   └─ none of these transitions touch currentRound (FR-010)
```

## Invariants

1. `currentRound.participantId` / `questionId` always resolve to existing entries (unchanged from 001).
2. No draw selects an item with `status === 'disabled'` (unchanged from 001).
3. `0 ≤ remainingMs ≤ round.answerMs` and `remainingMs` never goes negative — the clamp is the round's own `answerMs`, not a module constant (research R6, SC-003).
4. `round.answerMs` never changes after the round is created (FR-010).
5. `timing.animationSeconds ∈ [0, 5]` and `timing.answerSeconds ∈ [5, 300]` at all times, including immediately after an upgrade or a restore (FR-003, FR-004, FR-013).
6. The countdown displayed to the host differs from `round.answerMs` by no more than one tick interval (SC-003).
7. No value that failed validation is ever present in `timing` (SC-009).
8. Exactly one round may be on screen at a time, and exactly one move-on control exists whenever it is (001 FR-036, FR-014, SC-017).
9. Persistence writes happen on every mutation, so reload never loses a timing value or acknowledged work.
10. Nothing in this model is ever transmitted (FR-025).
