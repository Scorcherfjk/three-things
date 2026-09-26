# Quickstart Results: Improv Round Draw

**Branch**: `001-improv-round-draw` | **Date**: 2026-09-26
**Executed by**: implementation agent (automated suite + dev-server smoke check)
**Commands verified**: `npm run lint`, `npm run typecheck`, `npm test` (43 tests), `npm run build` — all pass.

**Dev-server smoke**: `npm run dev` serves the app at localhost — HTTP 200, `<title>Three Things</title>`, entry module transforms successfully.

## Scenario results

| #   | Scenario                          | Result                          | Evidence                                                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | Load lists and persist            | ✓ PASS (automated)              | `tests/integration/setup-flow.test.tsx`: paste with blank lines/leading spaces/accents → exactly the valid items, trimmed, accents intact; reload restores; edit persists                                                                                                                                                  |
| V2  | Draw with animation and countdown | ✓ PASS (automated)              | `tests/integration/round-flow.test.tsx`: one Draw button, animation (2.5 s < 5 s cap), pair revealed with countdown `01:00`, double-press ignored during animation and round, time-up signal with **Next round** returning to idle                                                                                         |
| V3  | Interrupt and resume a round      | ✓ PASS (automated)              | `round-flow.test.tsx`: leaving Play marks the round interrupted with frozen time; Resume continues; Discard returns to idle; reload restores the interrupted round                                                                                                                                                         |
| V4  | Disable / restore items           | ✓ PASS (automated)              | `tests/integration/disable-flow.test.tsx`: disabled items never drawn over repeated draws, re-enabled item drawable again, disabled states survive reload, **Restore all to eligible** re-enables everything                                                                                                               |
| V5  | Counts and game over              | ✓ PASS (automated)              | `tests/integration/game-over-flow.test.tsx`: counts bar exact text, all questions disabled → game-over message naming the resource, no pair, draw disabled, restore-all resumes with lists intact                                                                                                                          |
| V6  | Privacy and clear-all             | ✓ PASS (automated + code audit) | Privacy line exact copy asserted in `setup-flow.test.tsx`; clear-all requires confirmation (Cancel keeps data, Clear everything wipes); `rg` audit of `src/` finds **no** `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon`/`axios` usage. _DevTools Network-tab observation remains a manual check for a human reviewer._ |
| V7  | Duplicate entries                 | ✓ PASS (automated)              | `tests/unit/importLines.test.ts` keeps duplicates as independent entries; `tests/unit/itemStatus.test.ts` toggles strictly by immutable `id`, so copies are independent                                                                                                                                                    |
| V8  | Performance (200 + 200)           | ✓ PASS (automated)              | `tests/integration/performance.test.tsx`: 400 items render < 1 s, draw activation responds < 1 s, animation capped < 5 s, round appears after animation                                                                                                                                                                    |
| V9  | Full-screen legibility (1280×720) | ⚠ PENDING MANUAL                | Requires a visual check in a real browser: name and question equally prominent (`RoundDisplay` shared `spotlight` class, `clamp(2.25rem, 5vw, 4rem)`), no horizontal scrollbar (`overflow-x: clip`, `minmax(0)` grid columns), no vertical scroll for typical-length content                                               |

## Notes

- Fairness (SC-007) and disabled exclusion (SC-003) are verified deterministically with a seeded RNG in `tests/unit/draw.test.ts` (10,000 draws, every count within 850–1,150).
- Countdown accuracy (SC-004, ±1 s) is epoch-deadline based and asserted in `tests/unit/roundState.test.ts` plus `round-flow.test.tsx`.
- Follow-up for a human reviewer: V9 visual pass and V6 Network-tab observation in a real browser.
