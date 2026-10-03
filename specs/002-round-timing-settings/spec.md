# Feature Specification: Configurable Round Timing

**Feature Branch**: `002-round-timing-settings`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description (rendered in English per Constitution Principle II — English Only):

> The application must have a pair of extra fields in the setup section. These fields affect the performance of the application, because they are in charge of configuring the time the animation takes to run, and the second one modifies the time the timer waits for a person to answer. In the play view, the next round button is always visible in case a user answers before the indicated time.
>
> **Use case**:
>
> - With these two new fields, the host enters the names and the questions, but now also indicates the animation time, which she fills in with 0 so it is immediate, and then sets the timer time to 10 because she wants participants to have little time to answer.
> - Luis has 30 seconds to answer a question and answers it in 10 seconds, so the host moves on to the next round quickly without waiting for the full time.

## Relationship to Previous Specification

This feature builds on `001-improv-round-draw`. Every requirement of that specification keeps applying unless it is listed as superseded below.

| Superseded requirement from 001                                                                                          | Replaced by                                 | Reason                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| FR-017 — the animation "MUST last long enough to build anticipation" and MUST NOT exceed 5 seconds, with no host control | FR-002 and FR-005 in this specification     | The host now sets the animation time, including 0 for an immediate result.                                  |
| FR-024 — every round MUST give exactly 60 seconds and the system MUST NOT offer the host any way to change it            | FR-003 and FR-006 in this specification     | The host now sets the answer time per session.                                                              |
| FR-023 — the host may acknowledge or move past the current round                                                         | FR-014 through FR-022 in this specification | The move-on control is now always visible and usable during a running round, not only after the time is up. |

FR-001, FR-004, FR-005, FR-006, FR-008, FR-009, FR-010, FR-011, FR-014, FR-015, FR-018 through FR-022, and FR-025 through FR-038 of `001-improv-round-draw` are unchanged and still in force. The three requirements in the table above are the **only** exceptions: 001's FR-017, FR-023 and FR-024 no longer apply in any form, and every other requirement of `001-improv-round-draw` carries over as written.

## Clarifications

### Session 2026-09-26

- Q: A host who played before this update already has participants and questions saved in her browser. When she opens the app after this update, what should she find? → A: Her participants, questions, and disabled states are all still there. The two timing fields show their defaults (3 seconds animation, 60 seconds answer) and she can change them whenever she likes.
- Q: When the host types a new number into the animation time or answer time field, when does that value actually take effect? → A: As soon as she leaves the field, by clicking elsewhere or pressing Enter. The value is kept immediately and there is no separate save button.
- Q: If the host clears the answer time field completely, what value should the field show and what should the next round use? → A: The field goes back to its default: 3 seconds for the animation, 60 seconds for the answer time. The next round uses the default.
- Q: Once the answer time has run out, does the play view show one control to move on, or two — the always-available one and a separate "time is up" acknowledgement? → A: One control. It is available the whole time a round is on screen, and pressing it after the time is up ends the round exactly as pressing it early does.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Set the animation time and the answer time before playing (Priority: P1)

Maria opens the setup view where she already enters her participants and questions. Next to those lists she now finds two more fields: the animation time and the answer time. For a fast round-based session she sets the animation time to 0, so the assignment appears instantly, and the answer time to 10, so participants have little time to answer. For a relaxed meeting she leaves the values as they come.

**Why this priority**: Without configurable timing, a host who wants a quick game cannot run one at all, and the pacing of every session is imposed on her. Both values are the reason this feature exists, and the early move-on control in User Story 2 is only useful once the answer time can be set low.

**Independent Test**: Open the setup view on a fresh browser, set the animation time to 0 and the answer time to 10, draw a round, and verify that no animation is shown and that the countdown starts at 10 seconds. Delivers the full value of this feature without touching anything else.

**Acceptance Scenarios**:

1. **Given** the setup view with participants and questions already entered, **When** the host looks for the timing settings, **Then** two extra fields are visible alongside the lists, one for the animation time and one for the answer time, each showing its current value and that the value is in seconds.
2. **Given** the host has never changed the timing values, **When** she plays, **Then** the animation lasts 3 seconds and every round gives the participant 60 seconds to answer, exactly as the application behaved before this feature.
3. **Given** the host sets the animation time to 0 and the answer time to 10, **When** the next round is drawn, **Then** the assignment appears with no visible animation and the countdown starts at 10 seconds.
4. **Given** the host sets the animation time to 5, **When** the next round is drawn, **Then** the animation runs for 5 seconds before the assignment is revealed.
5. **Given** a saved animation time and answer time, **When** the host reloads the page or reopens the application on another day, **Then** both values are exactly as she last saved them.
6. **Given** the host types a value outside the accepted range, such as 9 for the animation time or 2 for the answer time, **When** she leaves the field, **Then** the system states the accepted range in plain language and keeps the last valid value instead of accepting what she typed.
7. **Given** the host types a value that is not a whole number of seconds, **When** she leaves the field, **Then** the system explains that whole seconds are required and keeps the last valid value.
8. **Given** a round is on screen with its countdown running, **When** the host changes either timing value in the setup view and comes back, **Then** that round keeps the timing it started with and the new values apply from the next draw onward.
9. **Given** the host no longer wants custom timing, **When** she uses the single action that restores the defaults, **Then** the animation time returns to 3 seconds and the answer time returns to 60 seconds.
10. **Given** the host types 10 in the answer time field, **When** she clicks outside the field or presses Enter, **Then** 10 is in effect immediately, the next round uses it, and the setup view shows no separate save action she has to find first.
11. **Given** the host has set the answer time to 10, **When** she selects everything in the answer time field and deletes it so the field is empty, **Then** the field shows 60 seconds again and the next round gives 60 seconds to answer.

---

### User Story 2 - Move on when the participant answers early (Priority: P2)

Luis has 30 seconds to answer and finishes in 10. Maria sees the assignment on the shared screen, hears Luis's answer, and moves on to the next round straight away instead of sitting through the remaining 20 seconds. The control she uses to do this is already on screen the whole time, so she never waits for it to appear.

**Why this priority**: It removes dead time from every round that ends early, which is the difference between a game that drags and a game that keeps the group's attention. It ranks after the timing fields because an answer time the host cannot choose makes early finishing less useful, but the control is valuable on its own at any answer time.

**Independent Test**: Seed a session, set the answer time to 30, draw a round, and press the move-on control with 20 seconds still on the clock; verify the assignment leaves the screen immediately and the session is ready for the next draw. Delivers the value without any other capability.

**Acceptance Scenarios**:

1. **Given** an assignment is on screen with the countdown running, **When** the host looks at the play view, **Then** a clearly labeled control for moving to the next round is visible and available, no matter how much time is left.
2. **Given** an assignment with 20 of 30 seconds still remaining, **When** the host activates the move-on control, **Then** the countdown stops at once, the current assignment leaves the screen without waiting for the remaining time, and the play view shows the draw control ready for the next round.
3. **Given** the play view is ready and no assignment is on screen, **When** the host activates the draw control, **Then** the next round is drawn in the ordinary way, with the configured animation time and the configured answer time, and no assignment is drawn by itself before she asks for it.
4. **Given** the answer time has already run out, **When** the host looks at the play view, **Then** the same move-on control she used earlier is still there, no second control has appeared, and pressing it ends the round exactly as pressing it early does.
5. **Given** a round that was interrupted by the host leaving the play view, **When** she comes back, **Then** the move-on control is still available so she can drop that round instead of resuming it.
6. **Given** the draw animation is still running, **When** the host looks for the move-on control, **Then** it is not available yet, because no assignment is on screen to move past.
7. **Given** the host moved on before the time was up, **When** the next round is drawn, **Then** the participant and the question from the skipped round are still listed, still hold the eligible or disabled state they had, and can be drawn again.
8. **Given** the host moved on before the time was up, **When** the counts of eligible and disabled participants and questions are read, **Then** they are the same as before the move-on.

---

### User Story 3 - Run a fast round-based session end to end (Priority: P3)

Maria runs a 20-round session with the animation time at 0 and the answer time at 10. Each assignment appears instantly, each participant has 10 seconds, and each time someone answers early she moves on and starts the next round right away, so the session never sits waiting.

**Why this priority**: It is the payoff that only exists once User Stories 1 and 2 work together, so it is demonstrated rather than built. It is still listed because it is the outcome the host is actually buying, and it must be verifiable.

**Independent Test**: Configure animation time 0 and answer time 10, then run 20 rounds in which the answer is given almost immediately each time, pressing the move-on control every round. Verify no round ever waits longer than the configured answer time and no animation ever appears. Delivers the complete value of the feature.

**Acceptance Scenarios**:

1. **Given** the animation time is 0 and the answer time is 10, **When** the host draws a round, **Then** the assignment is on screen within 1 second of pressing the draw control, with no visible animation.
2. **Given** the answer time is 10, **When** any round of the session runs, **Then** the countdown never starts above 10 seconds and never lasts longer than 10 seconds on its own.
3. **Given** the host moved on early in 20 consecutive rounds, **When** the session is reviewed, **Then** no round in the session cost more waiting time than the configured answer time, and the host never had to wait for a control to become available.
4. **Given** the host has not touched the timing fields in a session, **When** any round is played, **Then** neither a 0-second animation nor a shorter answer time appears; the default behaviour is preserved.

### Edge Cases

- What happens when the host sets the animation time to 0? Is the result still revealed, or does the round never start?
- What happens when the host sets the answer time to its lowest or highest accepted value, and when she types one more or one less?
- What happens when the host types a negative value, a value with letters, or an empty field? (Resolved: a negative or non-numeric value is refused with a plain-language message and the last valid value is kept, while an empty field is treated as no preference and returns to the default of 3 or 60 seconds.)
- What happens when the host changes the timing values while a round's countdown is running, while it is interrupted, or while it has already run out?
- What happens when the host presses the move-on control twice in quick succession?
- What happens when the host presses the move-on control in the last second before the time is up?
- What happens when the host moves on early and no eligible participant or no eligible question remains for the following draw?
- What happens when the host moves on early and the browser is reloaded immediately afterwards?
- What happens when a saved timing value cannot be read back, for example after a browser restart in private mode?
- What happens when two hosts share the same device and the second one plays a session left by the first?

## Requirements _(mandatory)_

### Functional Requirements

**Timing Settings in the Setup View**

- **FR-001**: The system MUST provide two additional fields in the setup view, one for the animation time and one for the answer time, shown alongside the participant and question lists.
- **FR-002**: The system MUST label each field in plain language, MUST show that its value is expressed in seconds, and MUST show the accepted range next to the field.
- **FR-003**: The animation time MUST accept whole seconds from 0 to 5 inclusive. A value of 0 MUST mean that the draw reveals the assignment immediately, with no visible animation, and the assignment MUST still be drawn and shown.
- **FR-004**: The answer time MUST accept whole seconds from 5 to 300 inclusive.
- **FR-005**: When the host has never set a value, the animation time MUST be 3 seconds and the answer time MUST be 60 seconds, so an unconfigured session behaves exactly as it did before this feature.
- **FR-006**: When a value is a non-negative whole number outside the accepted range for its field, the system MUST explain the accepted range in plain language and MUST keep the last valid value.
- **FR-007**: When a value is not a whole number, is negative, or is not a number, the system MUST explain that a whole number of seconds within the accepted range is required and MUST keep the last valid value. A value carrying a minus sign belongs to this requirement and not to FR-006, because a sign is not part of a whole number of seconds; the accepted form of an entry is digits only, so `-1` is reported with this message rather than as a value outside the range. The system MUST NOT round, clamp, or silently store a value the host did not enter. When the host leaves a field empty, the system MUST instead return that field to its default value, 3 seconds for the animation and 60 seconds for the answer time, and that default MUST apply from the next draw onward.
- **FR-008**: A timing value MUST take effect from the moment the host leaves the field, whether by clicking outside it or by pressing Enter, and the system MUST NOT require a separate save action for either field. Once in effect, a value MUST apply to every draw made after that point, and MUST apply to the whole session rather than per round, per participant, or per question.
- **FR-009**: The system MUST persist both values in the host's browser and MUST restore them after a page reload and after the application is closed and reopened.
- **FR-010**: A round that is already on screen MUST keep the animation time and the answer time it was started with. A value the host puts in effect afterwards MUST apply from the next draw onward, and MUST NOT alter, extend, shorten, or restart a round already on screen.
- **FR-011**: The system MUST provide a single action in the setup view that restores both fields to their default values, 3 seconds and 60 seconds.
- **FR-012**: The system MUST NOT require the host to configure either value in order to play, and MUST NOT block the draw control because of an unconfigured or empty timing field.
- **FR-013**: Data saved by an earlier version of the application MUST remain readable and unchanged: every participant, every question, and every eligible-or-disabled state MUST be preserved. For such data the two timing fields MUST show their default values of 3 seconds and 60 seconds. The update MUST NOT clear any saved content, MUST NOT ask the host to re-enter anything, and MUST NOT require her to configure timing before she can play.

**Moving On Before the Time Is Up**

- **FR-014**: The play view MUST show exactly one control for moving to the next round, and that control MUST be visible and available at every moment a round is on screen: while the countdown is running, in its final second, after the answer time has elapsed, and when an interrupted round is presented again. The system MUST NOT reveal a separate acknowledgement control once the time is up; the same single control MUST end the round in every one of these states.
- **FR-015**: The move-on control MUST be visible and available from the moment the assignment appears, so the host never waits for it to appear and never has to look for it.
- **FR-016**: Activating the move-on control MUST stop the countdown immediately and MUST remove the current assignment from the screen without waiting for the remaining time.
- **FR-017**: The move-on control MUST NOT be available while the draw animation is running, because no assignment is on screen yet. The draw control remains the only way forward at that moment, as required by FR-021 of `001-improv-round-draw`.
- **FR-018**: Moving on early MUST count exactly like acknowledging a completed round. It MUST NOT disable, remove, or mark as answered the participant or the question of the round being left, and both MUST keep the eligible or disabled state they already had and MUST remain available for later draws.
- **FR-019**: Moving on early MUST NOT change the counts of eligible and disabled participants and questions shown on the play view.
- **FR-020**: If the host moves on early and no eligible participant or no eligible question remains, the system MUST explain which resource ran out and MUST NOT present a pair, as required by FR-033 of `001-improv-round-draw`.
- **FR-021**: The system MUST ignore an activation of the move-on control received while no assignment is on screen, so that a rapid double press ends exactly one round and cannot skip two rounds. Because activating the control never starts a draw (FR-022), the state a second press reaches is the ready state with no assignment on screen, and that is the state in which the extra activation MUST be ignored.
- **FR-022**: Activating the move-on control MUST only end the current round. The system MUST NOT start a new draw on its own. After the move-on, the play view MUST return to the ready state required by FR-015 of `001-improv-round-draw`, with the draw control available, and the next assignment MUST appear only when the host activates that draw control.

**Scope Boundaries**

- **FR-023**: The two values MUST apply to the whole session. The system MUST NOT offer a different animation time or answer time per round, per participant, or per question.
- **FR-024**: The system MUST NOT add configurable sounds, warnings, countdown thresholds, or a second timer in this version.
- **FR-025**: Both values MUST stay on the host's device along with the rest of the session data, and MUST NOT be transmitted anywhere, as required by FR-011 of `001-improv-round-draw`.
- **FR-026**: The system MUST NOT change the way a participant or a question is drawn, the way items are disabled, or the way the session ends, as specified in `001-improv-round-draw`.

### Key Entities

- **Timing Settings**: The pair of session-wide values the host configures in the setup view. Attributes: the animation time in whole seconds (0 to 5, default 3) and the answer time in whole seconds (5 to 300, default 60). Persisted with the session data, survives reload and browser restart, in effect as soon as the host leaves the field, and applies from the next draw onward. Data saved by an earlier version of the application is read as it is, and the two fields take their default values.
- **Round**: A single assignment produced by one draw, extended by this feature. In addition to the selected participant and question, a round carries the animation time and the answer time it was started with, so that changing the settings mid-round never alters the round already on screen.
- **Move-on action**: The host's decision to end a round before its answer time has elapsed. It has no lasting effect on the lists; the round's participant and question stay exactly as they were.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: With the animation time set to 0, 100% of draws present the assignment with no visible animation and within 1 second of the host pressing the draw control.
- **SC-002**: With the answer time set to 10, 100% of rounds show a countdown that starts at 10 seconds and never displays more than 10 seconds.
- **SC-003**: The countdown shown to the host never differs from the configured answer time by more than 1 second, for every accepted value from 5 to 300 seconds.
- **SC-004**: The move-on control is visible and available within 1 second of an assignment appearing, in 100% of rounds, at every point of the countdown including the final second.
- **SC-005**: When the host moves on with time still remaining on the clock, the assignment leaves the screen within 1 second of her press, in 100% of observed moves, and the draw control for the next round is available immediately afterwards without any further waiting.
- **SC-006**: 100% of moves on leave the participant and question counts unchanged, and the skipped round's participant and question remain drawable afterwards.
- **SC-007**: 100% of sessions in which the host moves on early contain no round that ends without either the answer time elapsing or the host choosing to move on.
- **SC-008**: 100% of both timing values survive a page reload and a full browser restart.
- **SC-009**: 100% of rejected entries are reported to the host in plain language, and 0 rejected values are stored.
- **SC-010**: A session in which the host never touches the timing fields is indistinguishable from a session run before this feature: 3-second animation, 60-second answer time.
- **SC-011**: A 20-round session configured with an animation time of 0 and an answer time of 10 completes with no round costing the host more waiting time than the configured answer time.
- **SC-012**: A host with no prior training configures both values and plays a full round on the first attempt, with no external instructions, in at least 9 out of 10 observed sessions.
- **SC-013**: In 10 out of 10 observed sessions, the host finds and uses the move-on control without searching for it or being told it exists.
- **SC-014**: After the update, 100% of participants, questions, and eligible-or-disabled states saved by the previous version of the application are still present, and the two timing fields show 3 seconds and 60 seconds, with no list cleared and nothing asked of the host to re-enter.
- **SC-015**: A timing value the host has left the field is in effect for the very next draw in 100% of cases, and the setup view offers no separate save control for the two fields.
- **SC-016**: A timing field the host empties shows 3 seconds or 60 seconds again within 1 second, and the next round uses that default in 100% of cases.
- **SC-017**: In 100% of observed rounds, exactly one control for moving on is on screen at every moment an assignment is shown, and no additional control appears when the time is up.

## Assumptions

- This feature changes the pacing of a session, not its rules. One round is still exactly one participant and one question, chosen the same way, and the eligible-or-disabled behaviour of `001-improv-round-draw` is untouched.
- The two values are entered in whole seconds because a host setting a timer thinks in whole seconds, and a fractional value has no useful meaning for either the animation or the answer time.
- The ranges are 0 to 5 seconds for the animation and 5 to 300 seconds for the answer time. The animation range keeps the previous upper bound of 5 seconds so the reveal is never a long wait, and adds 0 so a host can opt out of the animation entirely. The answer-time range is wide enough for a long reflective answer (5 minutes) and narrow enough that a round can never sit on screen indefinitely; a value below 5 seconds is refused because it leaves no time to read the question aloud.
- The defaults are 3 seconds of animation and 60 seconds of answer time, so an existing host who never touches the new fields gets the behaviour the application had before, with no migration step and no change to how a session feels.
- The host is the only person configuring timing, and the values apply to the whole session. Per-round or per-participant timing would multiply the decisions a host has to make during a live meeting, which is the opposite of what a non-technical host needs.
- Changing a value mid-round affects the next draw only. Applying it to the round already on screen would either shorten a countdown the participant is relying on or extend a round the host has already decided about, and both are surprising.
- The answer time elapsing still signals that time is up and still waits for the host; the system does not move on by itself. The host deciding when a round ends is what the always-visible control is for, and automatic advancing would remove the host from her own game. For the same reason, moving on ends the round and nothing more: the next assignment is drawn only when the host asks for it with the draw control, so the host always decides when the next pair appears.
- Both values are stored on the host's device with the rest of the session data, exactly as `001-improv-round-draw` requires for participants and questions, so no new privacy promise is introduced and the existing one still holds.
- A host who needs two different answer times in one session, for example a warm-up round and a final round, achieves it by changing the value in the setup view between rounds. A per-round or per-question override is out of scope for this version.
- The play view carries a single control for ending a round, whatever state the round is in. A second control appearing only after the time is up would give the host two similar-looking choices at the exact moment she is least inclined to study the screen, and it would grow the play view's controls for no gain.
- An empty timing field means the host has no preference, so it returns to the default rather than keeping the previous value. The alternative would leave her with a blank field she has to fix, and a session that quietly runs on a number she can no longer see.
- A host who already played before this update keeps everything she saved. The update only adds the two values to what is stored, so participants, questions, and disabled states are read exactly as they were written and the two new fields arrive at their defaults; no list is ever cleared and the host is never asked to re-enter anything. Losing a prepared list would cost a host more than the whole feature gives her.
- A timing value takes effect the moment the host leaves the field, with no save button, because every other change in the setup view of `001-improv-round-draw` is kept immediately. A host configuring timing between rounds should not have to hunt for a save action and then wonder whether it worked, and a value that only took effect on a later save would make the next draw disagree with what she sees on screen.
- The application is written in English, following Constitution Principle II (English Only), which governs the field labels and every message this feature adds, just as it governs the rest of the on-screen text.
