# Quickstart: Configurable Round Timing

**Branch**: `002-round-timing-settings` | **Date**: 2026-09-26
**Purpose**: Validate the feature end-to-end against the spec. Implementation details live in `plan.md` / `tasks.md`; behavior details in `contracts/`. This is a validation guide — it deliberately contains no implementation code.

## Prerequisites

- Node.js ≥ 22.12, npm
- Desktop/laptop browser (latest Chrome/Firefox/Safari); window ≥ 1280×720
- For V7: a browser profile that already holds a session saved by the previous version (see the seed snippet below)

## Setup & Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server (Vite) → open the printed localhost URL
npm run lint         # ESLint — must pass
npm run typecheck    # tsc -b (strict) — must pass
npm test             # Vitest run — must pass
npm run build        # production build (used by Dockerfile/CI)
```

## Validation Scenarios

Each scenario maps to spec requirements; expected copy is quoted from `contracts/`.

### V1 — Defaults on a fresh browser (US1 AS2, FR-005, SC-010)

1. Fresh profile → open the app → **Setup**.
2. **Expect**: the Timing panel shows **3** in _Animation time_ and **60** in _Answer time_, each with its range hint (FR-002).
3. Add 3 participants and 3 questions → **Play** → **Draw**.
4. **Expect**: the reveal takes about 3 seconds, and the countdown starts at `01:00` — indistinguishable from the previous version (SC-010).

### V2 — Set both values, effect on the next draw (US1 AS3, FR-008, SC-015)

1. Back to **Setup**: type `0` in _Animation time_, click elsewhere. **Expect**: no error, no save button anywhere.
2. Type `10` in _Answer time_ and press Enter. **Expect**: accepted immediately.
3. **Play** → **Draw**. **Expect**: the pair is on screen essentially at once with **no visible animation** (FR-003, SC-001) and the countdown reads `00:10` (SC-002).
4. **Expect**: **Next round** is on screen in that same view without any waiting (SC-004).

### V3 — A non-zero animation time (US1 AS4, FR-003)

1. Set _Animation time_ to `5` → **Draw**.
2. **Expect**: the reveal takes about 5 seconds; the countdown then starts at the configured answer time.

### V4 — Rejected entries keep the last valid value (US1 AS6/AS7, FR-006, FR-007, SC-009)

1. With _Animation time_ at `0`, type `9` and click elsewhere.
2. **Expect**: an inline alert under the field stating the 0–5 range and that `0` is still in use; the field shows `0` again.
3. Type `2` in _Answer time_ and leave the field. **Expect**: the 5–300 message and the previous answer time still in use.
4. Type `3.5`, then `abc`, then `-5`, leaving the field each time. **Expect**: the whole-seconds message each time; the field never shows the typed value afterwards, and no `3.5`-style value is ever stored (FR-007, SC-009).
5. Reload. **Expect**: the last valid values are still in effect — nothing rejected survived (FR-009).

### V5 — Empty field returns the default (US1 AS11, FR-007, SC-016)

1. Select everything in _Answer time_ and delete it, then click elsewhere.
2. **Expect**: the field shows `60` again within a second, and the next round gives 60 seconds.
3. Repeat for _Animation time_. **Expect**: `3` again.

### V6 — Restore defaults (US1 AS9, FR-011)

1. Set the values to `0` and `10`.
2. Press **Restore default timing** once.
3. **Expect**: the two fields read `3` and `60`; no dialog, no confirmation (one action restores both).

### V7 — Persistence and the upgrade from the previous version (FR-009, FR-013, SC-008, SC-014)

**7a — same version.** Set `0` / `10`, reload the page, then fully close and reopen the browser.

- **Expect**: both values are exactly as last saved (SC-008).

**7b — previous version.** In a profile holding a session from the previous version, open DevTools → Application → Local Storage and set a `version: 1` document by hand at key `three-things.session` with 2 participants, 1 of them `"status": "disabled"`, 2 questions, `currentRound: null`, `view: "play"`, then reload:

```json
{
  "version": 1,
  "participants": [
    { "id": "p1", "text": "Ada", "status": "eligible" },
    { "id": "p2", "text": "Grace", "status": "disabled" }
  ],
  "questions": [
    { "id": "q1", "text": "Tell a short story", "status": "eligible" },
    { "id": "q2", "text": "Do an impression", "status": "eligible" }
  ],
  "currentRound": null,
  "view": "play"
}
```

- **Expect**: both participants and both questions are still there, Grace is still **Disabled**, the app opens on **Play**, and the timing fields read `3` / `60` (FR-013, SC-014). Nothing was cleared and nothing was asked to be re-entered.
- **Expect**: pressing **Draw** works immediately — an unconfigured or default timing never blocks the draw control (FR-012).
- Repeat with a `version: 1` document whose `currentRound` is an interrupted round with `remainingMs: 42000`. **Expect**: it returns as an interrupted round still frozen at 42 seconds, with **Next round** available (research R4, R5).

### V8 — Changing timing mid-round does not disturb the round (US1 AS8, FR-010)

1. Set _Answer time_ to `30` → **Play** → **Draw** → let it run 10 seconds (`00:20` left).
2. Switch to **Setup**, set _Answer time_ to `120`, and return to **Play**.
3. **Expect**: the interrupted round resumes at `00:20`, not `02:00`; the round is not extended, shortened, or restarted (FR-010).
4. Press **Resume countdown**. **Expect**: it continues from `00:20`. Move on, then **Draw** again. **Expect**: the new round counts down from `02:00` — the new value applies from the next draw.

### V9 — Move on early (US2 AS1/AS2, FR-014–FR-016, SC-005)

1. Set _Answer time_ to `30` → **Draw** → with 20 seconds still on the clock, press **Next round**.
2. **Expect**: the countdown stops at once, the pair leaves the screen, and **Draw** is available immediately (SC-005). No new pair appears by itself (FR-022).
3. **Expect**: the eligible/disabled counts are unchanged, and both the participant and the question of the skipped round are still listed and can be drawn again (FR-018, FR-019, SC-006).

### V10 — One control in every state (US2 AS4, FR-014, SC-017)

Check each state in turn and count the move-on controls:

1. **Animating** (press **Draw** with _Animation time_ at `3`).
   - **Expect**: **no** move-on control is on screen, and **Draw** is disabled (FR-017).
2. **Running**, and again in the **final second**.
   - **Expect**: exactly one control, labeled **Next round**, enabled the whole time (SC-004).
3. **Time up** (wait out a short answer time such as `5`).
   - **Expect**: the "Time's up!" signal, and the **same single** **Next round** control — no second, differently labeled control appears (FR-014, SC-017). Pressing it ends the round exactly as pressing it early does.
4. **Interrupted** (leave the play view mid-round and return).
   - **Expect**: **Resume countdown** plus **Next round**, and pressing **Next round** drops the round (US2 AS5).

### V11 — Double press and exhaustion (FR-020, FR-021)

1. During a running round, double-press **Next round** quickly.
2. **Expect**: one round is ended; the next **Draw** produces exactly one new pair — nothing was skipped twice (FR-021).
3. Move on early until one eligible question remains, disable it, then move on and press **Draw**.
4. **Expect**: no pair and no animation; the message names **questions** as the exhausted resource (FR-020).

### V12 — A full fast session (US3, P3, SC-011, SC-012, SC-013)

1. Set _Animation time_ to `0` and _Answer time_ to `10`. Play 20 rounds, pressing **Next round** a few seconds into each.
2. **Expect**: no round ever waits longer than 10 seconds on its own, no animation ever appears, and **Next round** was available at every single round with no searching (SC-011, SC-013).
3. **Expect**: doing this required no instructions beyond the labels and hints on screen (SC-012).

### V13 — Privacy is unchanged (FR-025, 001 FR-011)

1. DevTools → Network: perform V1–V12 while watching requests.
2. **Expect**: no request carries the timing values, the names, or the questions — only Vite dev assets.
3. **Expect**: the setup privacy line is still exactly _"Your lists stay on this device and are never sent to anyone."_

## CI Parity

`npm run lint && npm run typecheck && npm test` must pass locally — identical to the CI workflow (Constitution: verify before review). The automated suite covering these scenarios is specified in `research.md` R11; `tasks.md` maps each scenario above to the task that delivers it.
