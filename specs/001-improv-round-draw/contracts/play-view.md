# Contract: Play View UI

**Source**: spec FR-013–FR-038, US1/US3/US4
**Type**: UI contract (host-facing)

## Layout (desktop ≥ 1280×720, no horizontal scroll — SC-016)

- Header: "Three Things" (FR-025) + view switch to Setup.
- Counts bar (always): `Eligible participants: N · Eligible questions: N · Disabled: N participants, N questions` (FR-032).
- Main area: one of the states below.
- Side lists: all participants and all questions with status (FR-013), each with an Eligible⇄Disabled toggle (FR-027), plus one **Restore all to eligible** action (FR-030).

## Draw control

- Exactly **one** draw button labeled **Draw** (FR-015).
- Disabled when: a draw/round is active, or either eligible count is 0 (FR-015, FR-021).
- On activation: runs animation (2–3 s, hard cap < 5 s, FR-017) then reveals pair; extra presses during animation or while a round is displayed are ignored (FR-021).

## Main states

| State | Content | Requirement |
|-------|---------|-------------|
| **Idle (pre-draw)** | Draw button enabled (if eligible items exist); counts visible | — |
| **Animating** | Cycling placeholder names/questions; draw button disabled | FR-016 |
| **Round running** | Participant name and question, equal visual prominence, both large enough to read on a shared screen; countdown `MM:SS` ticking from 60 s, accurate ±1 s | FR-019, FR-020, FR-024 |
| **Time up** | Loud "Time's up!" signal; pair remains on screen; **Next round** action enabled | FR-022, FR-023 |
| **Interrupted** | Round shown with frozen remaining time, marked "Round interrupted — countdown paused", two explicit actions: **Resume countdown** (continues from remaining time) and **Discard round** (returns to idle; pair stays eligible) | FR-026, SC-017 |
| **Game over (questions)** | *"The game is over — you have no eligible questions left. Restore questions or add more to keep playing."* No pair, no animation, draw disabled | FR-033, SC-012 |
| **Game over (participants)** | Same message naming participants instead | FR-033 |
| **Empty setup** | *"Add participants and questions in the setup view to start."* Draw disabled | Edge case |

## Rules

- One round on screen at a time; **Next round** acknowledges and returns to Idle (FR-023, FR-036).
- Toggling disable/restore never removes items; disabled items stay listed (FR-028).
- Draw selection: uniform random over eligible items only (FR-018); never a disabled item (FR-029).
- Ending/restoring session keeps lists intact (FR-035); **Restore all** enables continuing after game over (US4 AS5).
- No text editing anywhere in this view (FR-010).
