# Feature Specification: Improv Round Draw

**Feature Branch**: `001-improv-round-draw`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description (rendered in English per Constitution Principle II — English Only):

> The system is the improv icebreaker game "three things", in which participants are asked three things they must say within a limited time.
>
> **Normal use**: The user of this application is someone who administers the game session. They enter a group of participant names and a group of questions and, when they press a button, the system — through a nice animation — assigns a person and a question that the selected person must answer within a limited time.
>
> **User**: A non-technical user who has a list of names and a list of questions they want to use to play using the system.
>
> **Use case**: Maria is in her Zoom meeting and wants to play with her coworkers. She has a list of questions she can load in one view and a list of her coworkers' names. After loading the data, which persists in her browser, she goes to another page where all the data is visible and, when she presses a button, the system — after running an animation — gives her a pair of name and question, which the coworker identified by that name must answer. Then she decides whether she wants to disable the user or the question so that they are not repeated. She repeats the flow until the questions, the people, or the time for the game run out.

## Clarifications

### Session 2026-09-26

- Q: What should the system do when the host's list contains the same name or the same question more than once? → A: Keep every line as a separate entry, even when identical. Each duplicate is an independent item that can be drawn and disabled on its own.
- Q: When the host wants to fix a name or question that is already in her list, what should the system let her do? → A: Let the host edit the text of an existing item in the setup view; the change applies immediately and the item keeps its eligible or disabled state. The play view offers only disabling and returning an item to eligible.
- Q: Should the system promise the host that the participant names and questions never leave her device, and show that promise on screen? → A: Yes. Nothing entered may ever be sent anywhere, no account is needed, and the setup view carries a short plain-language line saying the lists stay on this device and are never sent, with a one-click action to clear all stored data.
- Q: Which screen sizes must the game look right on, given that the host shares it for the whole group to read? → A: Laptop and desktop screens only. The host shares a laptop or external monitor where the name and question can be shown very large; phone-sized screens are out of scope.
- Q: If the host switches to the setup view while a round's 60 seconds are still counting down, what should happen to the countdown? → A: Stop it and mark the round as interrupted; on returning, show the round with an explicit choice to resume the countdown or discard the round.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draw a pair and play a timed round (Priority: P1)

Maria, hosting a remote meeting, opens the play view where her participants and questions are listed, presses a single button, and watches a short animation that resolves into one participant name and one question. That participant answers the question while a visible countdown runs, and Maria decides when the round is over.

**Why this priority**: This is the game itself. Without the draw there is no product; every other capability only feeds or wraps this moment. A first-time host can run a complete game with this story alone if the lists are already loaded.

**Independent Test**: Seed the application with a fixed set of participant names and questions, press the draw button, and verify that exactly one eligible participant and one eligible question are presented with a running countdown. Delivers a playable round and full value on its own.

**Acceptance Scenarios**:

1. **Given** a play view with at least one eligible participant and one eligible question, **When** the host presses the draw button, **Then** the system runs an animation and then presents exactly one participant name and one question, together with a visible countdown for the response time.
2. **Given** a draw button that has just been pressed, **When** the host presses it again during the animation or while a round is displayed, **Then** the system ignores the extra press and the displayed round does not change.
3. **Given** a round is displayed, **When** the response time elapses, **Then** the system visibly signals that time is up and waits for the host, without discarding the round.
4. **Given** a round is displayed, **When** the host is satisfied and continues, **Then** she can proceed to the next draw and the previous round leaves the screen.
5. **Given** a round whose countdown is still running, **When** the host leaves the play view, **Then** the countdown stops and the round is marked as interrupted, and when she returns the round is shown with the time it had left, clearly marked as interrupted, together with a choice to resume the countdown or to discard the round.

---

### User Story 2 - Load and manage the participant and question lists (Priority: P2)

Before playing, Maria opens a setup view where she pastes the list of her coworkers' names and the list of questions she prepared. The application keeps this data in her browser, so she does not retype it for the next session, and she can correct a typo, add an item, or remove an item.

**Why this priority**: Manual re-entry on every session is the fastest way to make the tool unusable, and the host's real asset is her prepared list. It ranks after the draw because the draw is the value being delivered, but it is a prerequisite for any real use.

**Independent Test**: Open the setup view on a fresh browser, paste 10 names and 10 questions, reload the page, and verify every item is still present. Delivers the "prepare once, reuse always" value without touching the draw.

**Acceptance Scenarios**:

1. **Given** the setup view and a block of text with one name per line, **When** the host pastes it and saves, **Then** the system stores one participant per non-empty line, ignoring blank lines and surrounding spaces.
2. **Given** the setup view and a block of text with one question per line, **When** the host pastes it and saves, **Then** the system stores one question per non-empty line, ignoring blank lines and surrounding spaces.
3. **Given** participants and questions already stored, **When** the host closes and reopens the application, **Then** all participants and all questions are still listed exactly as saved.
4. **Given** a participant or question list, **When** the host adds a single item or removes an existing one, **Then** the change is reflected immediately in the stored list and in the play view.
5. **Given** a host entering data, **When** a line is empty, whitespace-only, or a name longer than the allowed length, **Then** the system either ignores it or explains the problem in plain language without discarding the rest of the input.
6. **Given** a participant or question that contains a typo, **When** the host replaces its text in the setup view, **Then** the corrected text takes effect immediately, the item keeps the eligible or disabled state it already had, and the play view shows the corrected text from the next draw onward.
7. **Given** the host is on the setup view, **When** she looks for how her data is handled, **Then** a short plain-language line states that the lists stay on this device and are never sent to anyone, and a single action clears all stored content once she confirms.

---

### User Story 3 - Control repeats by disabling a participant or a question (Priority: P3)

After a participant has answered, Maria does not want that person picked again for a while, and she may also want to retire a question that is not landing. She toggles a participant or a question off, and the draw immediately stops considering it, while the item stays visible so she can turn it back on.

**Why this priority**: It gives the host control over pacing and prevents awkward repeats, but the game is fully playable without it — the host can simply live with the odds. Disabling is what turns a random picker into a host-driven game.

**Independent Test**: Seed at least three participants, disable two of them, draw repeatedly, and verify the third participant is the only one ever drawn; then return one to eligible and verify it can be drawn again. Delivers repeat control without any other capability.

**Acceptance Scenarios**:

1. **Given** a play view with several participants, **When** the host disables one participant, **Then** that participant is marked as disabled, remains visible, and is never selected by subsequent draws until it is returned to eligible.
2. **Given** a play view with several questions, **When** the host disables one question, **Then** that question is marked as disabled, remains visible, and is never selected by subsequent draws until it is returned to eligible.
3. **Given** a disabled participant or question, **When** the host returns it to eligible, **Then** it can be selected by the next draw.
4. **Given** disabled items and a reloaded application, **When** the host returns, **Then** every eligible and disabled state is preserved.
5. **Given** a host who has disabled items and wants to start over, **When** the host restores all items, **Then** every participant and question becomes eligible again.

---

### User Story 4 - See what is left and finish the session (Priority: P4)

Maria needs to know at a glance how much of the game is left, and she needs a clear ending. She sees the count of eligible and disabled participants and questions, is told when the game cannot continue, and can end the session and keep her lists for the next meeting.

**Why this priority**: It prevents confusing dead ends and gives the session a clear close, but it does not add play value while the draw works. It completes the loop rather than starting it.

**Independent Test**: Disable every remaining question on a seeded session and verify the application clearly reports that the game is over and offers a way to continue with new questions. Delivers a clean ending without any other capability.

**Acceptance Scenarios**:

1. **Given** a play view with any participants and questions, **When** the host views it, **Then** the system shows how many participants and how many questions are eligible and how many are disabled.
2. **Given** a session where no eligible question remains, **When** the host presses the draw button, **Then** the system explains that the game is over because the questions ran out and does not present a pair.
3. **Given** a session where no eligible participant remains, **When** the host presses the draw button, **Then** the system explains that the game is over because the participants ran out and does not present a pair.
4. **Given** a session with exactly one eligible participant and several eligible questions, **When** the host draws, **Then** the system presents that participant with one of the eligible questions.
5. **Given** an ended session, **When** the host chooses to keep playing with the same lists, **Then** she can restore the disabled items and continue drawing.

### Edge Cases

- What happens when the host presses the draw button with an empty participant list, an empty question list, or both empty?
- What happens when every participant or every question is disabled, or when only one item remains eligible on either side?
- How does the system behave when the host pastes a list with blank lines, leading or trailing spaces, or non-Latin characters and accents in names?
- How does the system behave when a list holds two entries with identical text and the host disables only one of them? (Resolved: the two entries are independent, so the remaining copy stays eligible and can still be drawn.)
- What happens when a name or question is extremely long, or when the list is very large (hundreds of items)?
- How does the system behave when the browser cannot store the data, for example in private browsing or when storage is full?
- What happens if the host reloads the page or closes the tab in the middle of a round, or during the draw animation? (Resolved for a running round by FR-026: it comes back interrupted with the time it had left and the resume-or-discard choice. An animation interrupted by a reload or a tab close simply ends, and the draw is not applied.)
- What happens when the host opens the application on a phone screen during a session? (Resolved: phone-sized screens are out of scope and are not a supported way to run a session; the host is expected to share a laptop or desktop screen.)
- What happens when the countdown reaches zero while the host is answering, and how does the host acknowledge it?
- How does the system handle an accidental double press of the draw button, or a press on a disabled control?
- What happens when the host corrects a name or question while a round is on screen? (Resolved: she edits it in the setup view, the item keeps its eligible or disabled state, the round on screen is untouched, and the corrected text is used from the next draw onward.)

## Requirements *(mandatory)*

### Functional Requirements

**Data Entry and Persistence**

- **FR-001**: The system MUST provide a dedicated setup view where the host manages two independent lists: participants and questions.
- **FR-002**: The system MUST accept a multi-line block of text in the setup view and split it into one item per non-empty line, trimming surrounding whitespace and discarding empty or whitespace-only lines.
- **FR-003**: The system MUST allow a host to add a single item and to remove a single existing item from either list.
- **FR-004**: The system MUST preserve the characters, accents, and internal punctuation of names and questions exactly as the host entered them.
- **FR-005**: The system MUST persist the participant list, the question list, and the eligible-or-disabled state of every item in the host's browser, and MUST restore them when the host returns to the application.
- **FR-006**: The system MUST make the persisted data survive a page reload without any action from the host.
- **FR-007**: The system MUST show the host a clear, plain-language message and MUST NOT silently lose data when the browser cannot save it.
- **FR-008**: The system MUST provide a way for the host to remove all stored participants and all stored questions, and MUST ask for confirmation before doing so.
- **FR-009**: The system MUST treat every saved line as an independent entry, so two entries with identical text in the same list MUST remain two separate items, each eligible or disabled on its own. Disabling one of them MUST NOT disable the other, and the system MUST NOT merge, skip, or reject repeated lines.
- **FR-010**: The system MUST let the host replace the text of an existing participant or question from the setup view. The corrected text MUST replace the previous text, MUST take effect immediately, and MUST NOT change that item's eligible-or-disabled state. The system MUST NOT offer text editing on the play view.

**Data Privacy**

- **FR-011**: The system MUST NOT transmit, upload, synchronize, share, or otherwise send any participant name, question, or round content to any other device, service, or person. All stored content MUST stay on the host's own device.
- **FR-012**: The setup view MUST display a short, plain-language statement that the lists stay on this device and are never sent to anyone, and MUST offer the host a single action that clears all stored content after confirmation, as required by FR-008.

**Play View**

- **FR-013**: The system MUST provide a separate play view that lists every participant and every question, showing each item's name or text and whether it is eligible or disabled.
- **FR-014**: The play view MUST always be reachable, and navigating between the setup view and the play view MUST NOT discard the round currently displayed; an interrupted round is kept in the state required by FR-026.
- **FR-015**: The system MUST have exactly one control that starts a draw, and that control MUST be unavailable when a draw cannot be performed.
- **FR-016**: When the host activates the draw control, the system MUST run a visible animation before revealing the result.
- **FR-017**: The animation MUST last long enough to build anticipation and MUST NOT exceed 5 seconds.
- **FR-018**: The system MUST select the participant and the question at random from the eligible items only, with no bias toward any item.
- **FR-019**: The system MUST present the result as a single pair: one participant name and one question, shown together as the assignment for the round.
- **FR-020**: The system MUST show the participant name and the question with equal visual prominence, so the whole group can read the assignment from a shared screen.
- **FR-021**: The system MUST ignore additional activations of the draw control while an animation is running or while a round is waiting to be acknowledged, leaving the displayed round unchanged.
- **FR-022**: When the response time elapses, the system MUST visibly signal that time is up and MUST keep the round's participant and question on screen.
- **FR-023**: The system MUST let the host acknowledge or move past the current round and start a new draw.
- **FR-024**: Every round MUST give the participant exactly 60 seconds of answer time, and the system MUST NOT offer the host any way to change that allotted duration. The visible countdown MUST be accurate to within 1 second of the time remaining, and MUST count down only while an uninterrupted round is on the play view, as required by FR-026.
- **FR-025**: The system MUST present the system name "Three Things" as the product identity.
- **FR-026**: The system MUST stop the countdown and mark the round as interrupted as soon as the host leaves the play view while a round is counting down, whether she switches to the setup view, reloads the page, or closes the tab. When she returns to the play view, the system MUST show that round with exactly the time it had left, MUST clearly mark it as interrupted, and MUST offer her an explicit choice to resume the countdown or to discard the round. Resuming MUST continue from the remaining time, and discarding MUST return the system to the state it was in before the draw, with that participant and that question still eligible for future draws.

**Repeat Control**

- **FR-027**: The host MUST be able to disable any individual participant or question, and return it to eligible, directly from the play view.
- **FR-028**: A disabled participant or question MUST remain visible and MUST remain listed; disabling MUST NOT delete it.
- **FR-029**: The system MUST never select a disabled participant or a disabled question in a draw.
- **FR-030**: The system MUST provide a single action that returns all disabled participants and questions to eligible.
- **FR-031**: The system MUST preserve disabled states across a page reload.

**Session Awareness**

- **FR-032**: The play view MUST display the number of eligible participants, the number of eligible questions, and the number of disabled items of each kind.
- **FR-033**: When no eligible question or no eligible participant remains, the system MUST state which resource ran out, MUST NOT run the animation, and MUST NOT present a pair.
- **FR-034**: The system MUST support continuing a session with one eligible participant and multiple eligible questions, and with multiple eligible participants and one eligible question.
- **FR-035**: The system MUST keep the host's lists intact when a session ends, so the host can start a new session with the same data.

**Scope Boundaries**

- **FR-036**: A round MUST consist of exactly one participant and exactly one question, and the host MUST start every subsequent round by activating the draw control again. The system MUST NOT deal several questions to the same participant in a row and MUST NOT count how many questions each participant has answered. The "three things" of the game name are carried by the wording of the questions themselves, each of which already asks the participant to name three things.
- **FR-037**: The system MUST NOT require the host to create an account, sign in, or connect to a network service to run a session.
- **FR-038**: The system MUST present the setup view and the play view for laptop and desktop screens, showing the participant name and the question large enough to read on a shared screen. Phone-sized and tablet-sized screens are out of scope: the system MUST NOT be optimized for them, and they MUST NOT be accepted as a supported way to run a session.

### Key Entities

- **Participant**: A person who may be asked to answer. Attributes: the name as entered by the host, and an eligible-or-disabled state. Identity is the list entry itself, not the name, so two entries with identical text are two different participants. One participant is selected per round.
- **Question**: A prompt the host wants to ask. Attributes: the question text as entered by the host, and an eligible-or-disabled state. Identity is the list entry itself, not the text, so two entries with identical text are two different questions. One question is selected per round.
- **Round**: A single assignment produced by one draw. Attributes: the selected participant, the selected question, when the draw happened, and how much response time is left. A round is the unit the host acknowledges before the next draw.
- **Session Data**: The full set of participants, questions, and their states that the host has saved. It is the unit that persists in the host's browser and survives closing and reopening the application.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A host who already has her lists prepared can go from opening the application to seeing the first assignment in under 60 seconds, without typing any participant or question individually.
- **SC-002**: 100% of draws on a session with eligible items produce exactly one participant and exactly one question, both drawn from the eligible items.
- **SC-003**: 100% of draws across a 30-round session avoid every disabled participant and every disabled question.
- **SC-004**: The countdown shown to the host never differs from the 60-second response time by more than 1 second.
- **SC-005**: 100% of stored participants, questions, and disabled states survive a page reload and a full browser restart.
- **SC-006**: A session of 200 participants and 200 questions starts drawing and presenting a result within 1 second of activation, with no perceptible delay.
- **SC-007**: The draw is unbiased: in an automated fairness test of 10,000 draws over 10 eligible participants with nothing disabled, every participant is selected between 850 and 1,150 times (±15% of the expected 1,000). No system guarantee is given for the spread of any single live session — preventing short-run repeats is the host's tool of disabling, as stated in the Assumptions.
- **SC-008**: The draw animation never exceeds 5 seconds and never leaves the host without a way forward.
- **SC-009**: In a full 30-round session, no round is lost to an accidental reload, view switch, or extra button press.
- **SC-010**: A host with no prior training completes list loading and reaches the first assignment on the first attempt, with no external instructions, in at least 9 out of 10 observed sessions.
- **SC-011**: The host can identify, within 2 seconds of looking at the screen, who must answer and what they must answer.
- **SC-012**: When a resource runs out, the host understands from the message alone that the game is over and why, without trial and error.
- **SC-013**: When a list holds two entries with identical text, each can be drawn and disabled independently, and disabling one never affects the other.
- **SC-014**: A text corrected in the setup view appears in the play view without a reload, and the corrected item keeps the same eligible or disabled state it had before the correction.
- **SC-015**: 100% of stored participants, questions, and rounds stay on the host's device for the whole session; none is ever sent to another device, service, or person, and the setup view states this in one line the host can read without opening instructions.
- **SC-016**: On a laptop or desktop screen of 1280 by 720 or larger, the participant name and the question are both fully visible at the same time with no scrolling, and neither view ever requires horizontal scrolling.
- **SC-017**: A round interrupted by leaving the play view returns to the host showing exactly the remaining time it had, and its countdown advances only after she explicitly resumes it; a discarded interrupted round leaves both its participant and its question eligible for the next draw.

## Assumptions

- The application runs entirely in the host's browser, on a single device, with no account, no sign-in, and no server dependency. This is stated by the user and keeps the tool usable during a meeting even on an unreliable connection.
- Only one host operates the application during a session; participants do not interact with it.
- The play view is shown on a screen the whole group can see, such as a shared screen in the meeting, so the assignment must be legible at a distance.
- The host runs the game from a laptop or desktop computer and shares that screen with the group. Phone and tablet screen sizes are out of scope for this version, so no effort is spent adapting the layout to them.
- Names and questions are entered in bulk from a prepared list, because the user described having a list ready to load. The host can also add or remove individual items.
- The 60-second response time is a fixed rule of the game rather than a setting, because a non-technical host should not have to configure anything to play, and because a single consistent limit is what makes the game a game. The host still controls pacing by disabling items and by choosing when to move to the next round. If group feedback later shows 60 seconds does not suit a group, a setting can be added at that time.
- The questions the host loads are self-contained prompts that already ask the participant to name three things, for example "Name 3 things that...". The application therefore treats one question as one complete turn and never assembles several questions for the same participant.
- Everything the application stores belongs to a single session's preparation; there is no sharing between devices, no export, and no import in this version, and no historical record of past rounds. Keeping past rounds is deliberately excluded to avoid speculative complexity.
- The application is written in English, following Constitution Principle II (English Only), which governs all artifacts of this project including on-screen text. The host is assumed to be comfortable with short English labels; if Spanish on-screen text is required, the constitution must be amended first.
- Selection among eligible items is uniformly random, and preventing a specific repeat is the host's decision through disabling, exactly as described in the use case. The system does not track who already answered in order to exclude them automatically.
- Only one item of each kind needs to remain eligible for a draw to work; the game does not stop merely because the two lists have different lengths.
- A session is never destroyed by the application itself; the host is the only one who can clear the stored data, and that action requires confirmation.
- Saving happens on the host's action and automatically as she edits, so a reload at any moment never loses work the host believes is saved.
