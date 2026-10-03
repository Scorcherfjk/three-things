# Contract: Timing Settings UI

**Source**: spec FR-001–FR-013, FR-023, US1 (P1); research R1–R3, R10
**Type**: UI contract (host-facing)
**Extends**: `../../001-improv-round-draw/contracts/setup-view.md` — every control in that contract is unchanged. This contract adds one panel to the setup view.

## Placement

One **Timing** panel in the setup view, rendered as a full-width row above the Participants and Questions panels. Both fields sit side by side; the restore action sits to the right of them. The existing two-column list grid is unchanged (research R3).

Nothing is added to the play view, the footer, or the lists themselves: the two values are session-wide, not per list (FR-023).

## Controls

| Element                           | Behavior                                                                                     | Requirement            |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------- |
| **Animation time** text input     | Whole seconds, `0`–`5`. Commits on blur or Enter. No spinner, no stepper, no save button.    | FR-001, FR-003, FR-008 |
| Range hint under the field        | Always visible: _"Whole seconds from 0 to 5. Use 0 to skip the animation."_                  | FR-002                 |
| **Answer time** text input        | Whole seconds, `5`–`300`. Commits on blur or Enter. No spinner, no stepper, no save button.  | FR-001, FR-004, FR-008 |
| Range hint under the field        | Always visible: _"Whole seconds from 5 to 300."_                                             | FR-002                 |
| **Restore default timing** button | One action setting both fields to 3 and 60. No confirmation, no dialog.                      | FR-011                 |
| Rejection message                 | Inline under the offending field, `role="alert"`; disappears when a later entry is accepted. | FR-006, FR-007, SC-009 |

The inputs are `type="text"` with `inputMode="numeric"` — never `type="number"` (research R1). The browser is not allowed to normalize, round, or clamp what the host typed.

## Commit rules

| Event                                                                      | Result                                                                                 | Requirement      |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------- |
| Host types a valid whole number and clicks elsewhere                       | Value is in effect immediately; the next draw uses it                                  | FR-008, SC-015   |
| Host types a valid whole number and presses Enter                          | Identical to clicking elsewhere                                                        | FR-008, US1 AS10 |
| Host types a whole number outside the range and leaves the field           | Rejected; the field shows the last valid value again                                   | FR-006           |
| Host types letters, a sign, a decimal, or an exponent and leaves the field | Rejected; the field shows the last valid value again                                   | FR-007           |
| Host clears the field completely and leaves it                             | Field returns to its default — 3 or 60 — and the next draw uses the default            | FR-007, SC-016   |
| Host presses Enter on an unchanged field                                   | No change, no message                                                                  | FR-008           |
| Host never touches either field                                            | Play behaves exactly as before this feature: 3-second animation, 60-second answer time | FR-005, SC-010   |

No rejected entry is ever persisted, and the value the host typed is never rounded into a value she did not enter (FR-007, SC-009).

## Messages (plain language, English — Constitution Principle II)

Both messages name the field, state the accepted range, and state that the previous value is still in use. They are generated from the same range objects the app validates against, so the text and the enforced limits cannot drift apart (research R10).

| Situation                                     | Message (animation field shown; the answer field substitutes its own name and range)                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Whole number outside the range                | _"Animation time must be a whole number of seconds between 0 and 5. 9 was not saved, so 3 seconds is still in use."_                 |
| Not a whole number, negative, or not a number | _"Animation time must be a whole number of seconds between 0 and 5. Only whole seconds are accepted, so 3 seconds is still in use."_ |

The "still in use" figure is the current committed value, not the default, so the message is accurate after the host has set a custom value.

The two rows above partition every rejection. A **negative whole number** such as `-1` belongs to the second row, not to the range message of the first: a minus sign is not part of a whole number of seconds, so the accepted form of an entry is digits only (`FR-007`). The same applies to a bare sign such as `-` or `+`. A **non-negative** whole number outside the range — `6` for animation, `301` for answer time — is the only case that receives the range message (`FR-006`).

No other message is added: there is no success confirmation, no unsaved-changes warning, and no dialog (FR-008, SC-015).

## Out of scope for this panel

- No per-round, per-participant, or per-question override (FR-023).
- No sounds, warnings, countdown thresholds, or second timer (FR-024).
- No import, export, or file handling of timing values.
- No server round trip: the values stay in `localStorage` with the rest of the session and are never transmitted (FR-025).
