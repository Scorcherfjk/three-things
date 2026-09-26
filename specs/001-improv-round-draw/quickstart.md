# Quickstart: Improv Round Draw

**Branch**: `001-improv-round-draw` | **Date**: 2026-09-26
**Purpose**: Run the app and validate the feature end-to-end against the spec. Implementation details live in `plan.md`/`tasks.md`; contracts in `contracts/`.

## Prerequisites

- Node.js ≥ 22.12 (Vitest requirement), npm
- Desktop/laptop browser (Chrome/Firefox/Safari, latest) — phone sizes are out of scope (FR-038)
- Window ≥ 1280×720

## Setup & Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server (Vite) → open printed localhost URL
npm run lint         # ESLint — must pass
npm run typecheck    # tsc --noEmit (strict) — must pass
npm test             # Vitest run — must pass
npm run build        # production build (used by Dockerfile/CI)
```

## Validation Scenarios

Map: scenario → spec requirement. Expected outcomes reference `contracts/`.

### V1 — Load lists and persist (US2)
1. Fresh browser profile → open app → Setup view.
2. Paste 10 names (one per line, with blank lines, leading spaces, accents e.g. `José Muñoz`) into Participants → **Add lines**; same for 10 questions.
3. **Expect**: exactly 10+10 items, trimmed, accents intact, no blank entries (FR-002/004).
4. Reload the page. **Expect**: all items present (FR-006, SC-005).
5. Edit one name in place; reload. **Expect**: corrected text kept (SC-014).

### V2 — Draw with animation and countdown (US1, P1)
1. Switch to Play view → press **Draw**.
2. **Expect**: animation runs (2–3 s, never > 5 s, SC-008) → exactly one name + one question shown with equal prominence, countdown starts at 01:00 (FR-019/020/024).
3. Press Draw again during animation and during the round. **Expect**: nothing changes (FR-021).
4. Wait for 00:00. **Expect**: "Time's up!" signal, pair stays on screen (FR-022); **Next round** returns to idle (FR-023).

### V3 — Interrupt and resume a round (FR-026, SC-017)
1. During a running countdown, switch to Setup view. **Expect**: countdown stops; returning to Play shows the round marked "interrupted" with its frozen remaining time and **Resume** / **Discard** actions.
2. **Resume** → countdown continues from the frozen value.
3. Repeat, then **Discard** → back to idle; draw again. **Expect**: both discarded items can be drawn again (SC-017).
4. Reload mid-round → same interrupted restore (FR-026).

### V4 — Disable / restore items (US3, P3)
1. Seed ≥ 3 participants; disable 2 from Play view. Draw repeatedly.
2. **Expect**: only the third is ever drawn; disabled items remain visible (FR-028/029, SC-003).
3. Re-enable one → it becomes drawable again (FR-027).
4. Reload → disabled states preserved (FR-031).
5. **Restore all to eligible** → all eligible (FR-030).

### V5 — Counts and game over (US4, P4)
1. Check counts bar matches list states (FR-032).
2. Disable all questions → press Draw.
3. **Expect**: no animation, no pair; message states questions ran out (FR-033, SC-012). Repeat for participants.
4. **Restore all** → draws work again, lists intact (FR-035).

### V6 — Privacy and clear-all (FR-011/012, SC-015)
1. Open Setup: privacy line visible — *"Your lists stay on this device and are never sent to anyone."*
2. DevTools → Network tab: perform every action above. **Expect**: zero outgoing requests carrying names/questions (only Vite dev assets).
3. **Clear all data** → confirm dialog → confirm. **Expect**: both lists empty after reload (FR-008).

### V7 — Duplicate entries (FR-009, SC-013)
1. Paste the same name twice → two independent rows.
2. Disable one copy → the other stays eligible and drawable; disable/restore affect only their own entry.

### V8 — Performance (SC-006)
1. Paste 200 names + 200 questions → press Draw.
2. **Expect**: pair appears within 1 s of activation, UI stays responsive.

### V9 — Full-screen legibility (SC-016, SC-011)
1. At 1280×720 shared/full screen: name and question both fully visible without scrolling; a viewer identifies who answers and what within 2 seconds; no horizontal scrollbars in either view.

## CI Parity

`npm run lint && npm run typecheck && npm test` must pass locally — identical to the CI workflow (Constitution: verify before review).
