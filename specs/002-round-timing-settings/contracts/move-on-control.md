# Contract: Move-On Control

**Source**: spec FR-014–FR-022, US2 (P2); research R7–R9
**Type**: UI contract (host-facing)
**Extends**: `../../001-improv-round-draw/contracts/play-view.md`. The counts bar, side lists, toggles, **Draw** control, game-over messages, and the interrupted-round marker are unchanged. This contract replaces the round-ending control described there.

## The control

Exactly one control for ending a round exists, and it is the same control in every state a round can be in.

| Property                      | Value                                                                                                                                         | Requirement            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Label                         | **Next round** (identical in every state)                                                                                                     | FR-014, SC-017         |
| Component                     | One shared component used by the running, time-up, and interrupted displays — a single source of truth for the label and the enabled state    | FR-014                 |
| Enabled state                 | Never disabled while a round is on screen                                                                                                     | FR-014, FR-015         |
| Visibility                    | Present from the instant the assignment appears, through the final second, after time is up, and when an interrupted round is presented again | FR-014, FR-015, SC-004 |
| Absent                        | Not rendered at all while the draw animation runs, and when no round is on screen                                                             | FR-017                 |
| Appearance on a shared screen | Same size and prominence as the round's other primary action; reachable without searching                                                     | SC-004, SC-013         |

## Per-state behavior

| State             | What the host sees                                                                                                               | Requirement        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Animating**     | Cycling placeholder text and the **Draw** control disabled. No move-on control — there is no assignment to move past.            | FR-017, 001 FR-021 |
| **Round running** | Participant, question, countdown from the configured answer time, and **Next round** already on screen                           | FR-015, SC-004     |
| **Final second**  | Unchanged; the control does not flicker, disable, or move                                                                        | FR-014, SC-004     |
| **Time up**       | The pair, the "Time's up!" signal, and the **same single** **Next round** control. No second control appears.                    | FR-014, SC-017     |
| **Interrupted**   | The pair, the frozen remaining time, the "Round interrupted — countdown paused" marker, **Resume countdown**, and **Next round** | FR-014, US2 AS5    |

**Resume countdown** remains the only other control that can appear with a round, and only in the interrupted state, because it is 001 FR-026 behavior that this specification does not change.

## Effect of activating it

| Effect                       | Detail                                                                                                                             | Requirement    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Countdown stops              | Immediately; the interval is cleared and no further time-up transition occurs                                                      | FR-016, SC-005 |
| Assignment leaves the screen | Within the same interaction; no waiting for the remaining time                                                                     | FR-016, SC-005 |
| Play view returns to ready   | **Draw** is available immediately                                                                                                  | FR-022, SC-005 |
| No new draw starts           | The next assignment appears only when the host activates **Draw**                                                                  | FR-022         |
| Items untouched              | The participant and the question keep the eligible/disabled state they had and remain drawable                                     | FR-018, FR-006 |
| Counts unchanged             | Eligible and disabled counts read exactly as before the move-on                                                                    | FR-019, SC-006 |
| Exhaustion reported normally | If a later draw finds no eligible participant or question, the existing message names the exhausted resource; no pair is presented | FR-020         |

Activation is idempotent: while the system is already leaving the round, a further activation finds no round on screen and is ignored, so a double press cannot skip two rounds (FR-021).

## Timing interaction

- The countdown shown is the round's own answer time, frozen when the round was drawn. Changing either timing value afterwards does not alter, extend, shorten, or restart the round on screen; the new value applies from the next draw (FR-010).
- With an animation time of 0 the assignment is revealed with no animation, and **Next round** is on screen in that first paint — the host never waits for a control to appear (FR-003, SC-001, SC-004).
- With an answer time of 10, no round ever waits longer than 10 seconds unless the host chooses to move on (SC-002, SC-011).

## Out of scope

- No automatic advance when the answer time elapses — time up is a signal, and the host decides when a round ends (001 FR-022, spec Assumptions).
- No confirm dialog on the move-on: a host ending a round early is a normal action, not a destructive one (FR-016, Principle I).
- No per-round or per-question "end early" override of timing.
