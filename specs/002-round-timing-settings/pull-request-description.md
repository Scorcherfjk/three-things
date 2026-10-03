# Pull Request: Configurable Round Timing Settings

**Branch**: `002-round-timing-settings` → `main`
**Spec**: `specs/002-round-timing-settings/spec.md`
**Plan**: `specs/002-round-timing-settings/plan.md`
**Tasks**: `specs/002-round-timing-settings/tasks.md` (T001–T036 complete)
**Validation**: `specs/002-round-timing-settings/quickstart-results.md`

## Summary

Adds two session-wide timing settings and a single always-available **Next round** control, so the host can match the game to the room instead of the room matching a hard-coded 60-second round.

- **Timing panel on the setup view** — _Animation time_ `0`–`5` s (default `3`) and _Answer time_ `5`–`300` s (default `60`), each a text field with `inputMode="numeric"`, a persistent range hint, commit on blur or <kbd>Enter</kbd>, empty-to-default, and a **Restore default timing** action. No stepper buttons and no save button.
- **Zero-second animation** — `0` reveals the pair synchronously with no animation frame and no placeholder flash.
- **Always-available move-on** — one shared `MoveOnButton` labelled **Next round** appears in the running, time-up, and interrupted states, and in no other state. The old _Discard round_ control and the old time-up-only control are gone; nothing advances a round automatically.
- **Storage v2** — `SessionData` gains a required `timing` block and `Round` gains `answerMs`, with an explicit v1 → v2 upgrade so existing hosts keep their lists, statuses, view, and interrupted round.

## Verification

`npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all pass locally — the exact four steps in `.github/workflows/ci.yml`. The suite is 14 files / 116 tests (up from 43), covering the parser and message wording, the schema upgrade, the per-round duration, every move-on state, the zero-animation path, and a 20-round fast session. Scenario-by-scenario evidence is in `quickstart-results.md`.

## Deliberate, justified deviation from the spec's Key Entities

**`Round` does not persist `animationMs`.** The spec's Key Entities section says a round carries both the animation time and the answer time it was started with. This PR omits the animation half on purpose, and the omission should be reviewed as a conscious decision rather than an oversight.

**Why:**

- `answerMs` is load-bearing after the reveal. `deadline` is `reveal + answerMs`, and the clamps in `remainingOf` and `resumeRound` must use it (SC-003, 5–300 s). Freezing it on the round is exactly what makes FR-010 true: a timing value the host puts in effect mid-round cannot alter, extend, shorten, or restart the round already on screen.
- `animationMs` has **no consumer after the reveal**. Its entire effect is consumed at the moment the reveal timestamp is chosen, and FR-024 forbids adding an indicator that would display it. Persisting it would add a field that nothing reads, along with a migration and a validator to maintain for dead state — a direct violation of Constitution Principle I (YAGNI).
- The requirement is satisfied in substance: the round is the product of an animation of that length, revealed at `drawnAt`, and the value that outlives the animation phase is the one that is frozen.

**Alternatives considered:**

- _Persist both_ — an unread field, with a migration and validator to maintain for nothing.
- _Persist neither and read the live settings_ — directly violates FR-010, because a mid-round change would alter a countdown the participants are relying on.
- _Defer with `setTimeout(fn, 0)`, a zero-duration CSS transition, or letting `DrawAnimation`'s own timeout resolve_ — each still paints a cycling frame before the reveal, which is the visible flash FR-003 forbids. Hence the synchronous branch in `useRound`.

This deviation was identified during Phase 0/1, recorded in `research.md` R5, and carried through `plan.md` §Post-design re-check (verdict: PASS with justification). Constitution §Governance requires a written justification for a departure from the letter of the spec, which is what this section and those two documents provide.

## Notes for the reviewer

- **No new runtime dependencies.** `parseSeconds` in `src/domain/timing.ts` replaces what a validation library would have done (Constitution §2).
- **Ranges and messages cannot drift.** The hint text, the rejection messages, and the enforced limits all derive from the single `TIMING_RANGES` record, so FR-002 / FR-006 / FR-007 cannot contradict each other.
- **DRY over duplication.** One `TimingField` serves both fields via a `kind` discriminator; one `MoveOnButton` serves every round state, so a second differently-labelled control cannot appear.
- **Layering preserved.** Components → hooks → domain/storage; `src/domain` never learns that the storage format changed.
- **Privacy unchanged.** No network calls in `src/` at all. The only storage access in the app is `globalThis.localStorage` inside `src/storage/sessionStore.ts` under the single unchanged key `three-things.session`; the new timing values live in that same local document. `PRIVACY_LINE` is byte-identical and still asserted.
- **Data safety.** The v1 → v2 upgrade is a first-class deliverable with its own unit tests. The pre-existing parser rejected any `version !== 1` by returning `null`, which `loadSession` turned into an empty session — so adding `timing` without an explicit upgrade would have silently wiped every existing host's lists.
- **Scope.** Nothing outside FR-001–FR-026: no sounds, thresholds, second timer, per-round override, import/export, cloud sync, or migration wizard.

## Manual checks still open for a human

Automated evidence and the exact method are recorded in `quickstart-results.md`; these need real eyes in a browser:

- V12 step 3 (SC-012) — the subjective judgement that the labels and hints alone suffice to run a fast session.
- V13 — watching the DevTools Network tab across V1–V12.
- V7a — closing and fully reopening the browser (reload is the automated equivalent).
- A visual pass at 1280×720 for the new Timing panel.
