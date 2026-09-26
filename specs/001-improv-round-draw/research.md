# Research: Improv Round Draw

**Branch**: `001-improv-round-draw` | **Date**: 2026-09-26
**Status**: All `NEEDS CLARIFICATION` items from the Technical Context are resolved.

## R1. Browser storage mechanism (localStorage vs IndexedDB vs in-memory)

**Decision**: Use `localStorage` with a single JSON-serialized key (`three-things.session`) holding the whole `SessionData` document (participants, questions, current round state).

**Rationale**:
- Scale is bounded and tiny: spec targets 200 participants + 200 questions of short strings (SC-006), well under the ~5 MB per-origin localStorage limit; every source consulted states localStorage is the right tool for "small, simple key-value storage".
- The API is three synchronous methods (`getItem`/`setItem`/`removeItem`) — the simplest solution that works (Constitution Principle I). No async plumbing, no schema/versioning, no wrapper dependency.
- Persistence must survive reload and browser restart (FR-006, SC-005) — localStorage satisfies this natively.
- Wrap all access in one `sessionStore.ts` module that catches `QuotaExceededError`/`SecurityError` and reports failure so the UI can show the plain-language error required by FR-007.

**Alternatives considered**:
- *IndexedDB*: async, transactional, gigabyte quota — designed for large/structured data. Overkill here; more code = more bugs (Principle I/YAGNI).
- *In-memory state only*: fails FR-005/FR-006 persistence requirement.
- *URL/sessionStorage*: sessionStorage does not survive browser restart (violates SC-005).

## R2. Test runner and tooling

**Decision**: Vitest + jsdom + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`).

**Rationale**:
- The project is scaffolded with Vite; Vitest reuses the same `vite.config` pipeline (one config for dev/build/test) — Jest in a Vite app is explicitly called "a duplication of complexity" by the Vitest docs.
- Native TypeScript/ESM/JSX support with zero extra transform config; Jest-compatible API.
- Vitest is the ecosystem-recommended pairing for Vite + React; Playwright mentioned as the E2E option but not required by the spec (quickstart covers manual E2E validation).

**Alternatives considered**:
- *Jest*: requires ts-jest/babel + jsdom config duplication with Vite; no feature this project needs that Vitest lacks.
- *Playwright/Cypress E2E*: valuable but adds heavy scaffolding; the spec's success criteria are validated by unit/integration tests plus the manual quickstart. Can be added later if requested (YAGNI).

## R3. Draw animation technique

**Decision**: Pure CSS `@keyframes` animation in a CSS Module (cycling name/question text via a short JS interval driving class/state changes), total duration 2–3 seconds, hard-capped below the FR-017 5-second limit.

**Rationale**:
- CSS animations are the platform-native solution; smallest bundle, no runtime dependency (Principle I: do not add a dependency the platform already solves).
- A "slot machine" style reveal of large readable text is achievable with keyframes + a `setInterval` cycling candidates; the final reveal is the pre-selected result.
- `animationend`/timer resolves the animation phase deterministically, so an interrupted animation (reload/tab close) simply ends without applying the draw (spec edge case, FR-021).

**Alternatives considered**:
- *framer-motion / motion.dev*: richer orchestration, but a runtime dependency for one 2-second animation — YAGNI.
- *react-transition-group*: aimed at mount/unmount transitions, not needed for a single in-place animation.
- *Canvas/requestAnimationFrame*: more code for no visible benefit.

## R4. View switching (setup ↔ play)

**Decision**: No router library. `App.tsx` owns a `view: 'setup' | 'play'` state (persisted in `localStorage` so a reload returns the host to the view she left, per FR-014/FR-026 handling), toggled by a small tab/switch control.

**Rationale**:
- Two views, no deep links, no URLs, no back-button requirements in the spec — a state flag is the simplest mechanism (Principle I, KISS).
- Leaving the play view is the trigger for round interruption (FR-026), which is easier to implement from an explicit view-change handler than from router events.
- Host never needs shareable/bookmarkable URLs (single host, single device).

**Alternatives considered**:
- *React Router*: URL-based routing with two routes — adds a dependency and indirection for zero spec benefit.
- *Two separate HTML pages*: would break in-memory state continuity and complicate interruption handling.

## R5. Interrupted-round persistence across reload/close

**Decision**: Persist the active round (`participantId`, `questionId`, `drawnAtEpochMs`, `remainingMs`, `status: 'running' | 'interrupted' | 'timeup'`) inside the same `SessionData` document. A monotonically ticking deadline (`endsAtEpochMs`) is stored while running; on load, if the deadline is in the past or the view changed, the round is marked interrupted with the exact remaining time it had (FR-026, SC-017).

**Rationale**:
- FR-026 requires surviving page reload and tab close — round state therefore cannot live only in React memory.
- Storing an epoch deadline (not a decrementing counter) makes "time left" recomputable and freeze-able at any moment with no drift, keeping the countdown within ±1 s (FR-024, SC-004).
- Countdown ticks only while the round is `running` AND the play view is active; visibility/interleave events pause it — implemented in `roundState.ts` as pure functions for testability.

**Alternatives considered**:
- *Decrementing counter in memory only*: fails the reload requirement.
- *Storing ticks to storage every second*: unnecessary writes; epoch deadline is exact and cheaper.
- *`setInterval` wall-clock only*: drifts and does not survive reload; epoch deadline computed at resumption is the accurate source.

## R6. Random selection fairness

**Decision**: Filter eligible items, then pick with `Math.floor(Math.random() * eligible.length)` in `domain/draw.ts` (pure, injectable RNG for tests).

**Rationale**:
- Uniform, no bias, no dependency; SC-007 (selection frequency within the ±15% uniformity band over 10,000 draws) and SC-003 (never disabled items) are statistical properties of uniform sampling and are verified by tests with a seeded/deterministic RNG injection.
- `crypto.getRandomValues` is unnecessary for a party game; `Math.random` is sufficient and simplest (Principle I). RNG is injected as a parameter so tests can supply a deterministic sequence without mocking globals.

**Alternatives considered**:
- *crypto RNG*: statistically stronger, irrelevant for a non-security draw; still uniform.
- *Shuffle/bag (deal without replacement)*: prevents short-run clustering, but the spec explicitly says selection is uniformly random with no tracking of past answers (Assumptions), and SC-007 tests the uniformity of the sampler itself — a bag would add state for a guarantee no requirement asks for.

## R7. Scaffolding baseline

**Decision**: `npm create vite@latest` (react-ts template) as the industry-standard base, then add: ESLint (typescript-eslint + react hooks plugin) + Prettier + `.editorconfig`, Husky + lint-staged + commitlint (`@commitlint/config-conventional`), `Dockerfile` (multi-stage build → nginx static serve), GitHub Actions CI (lint, type-check, test), `strict` TS, `@/` path alias.

**Rationale**: Constitution Principle V and Section 2 mandate exactly this toolchain; Vite is the current industry-standard React/TS scaffold. No custom layout.

**Alternatives considered**: CRA (deprecated), Next.js (server framework — spec forbids server), custom config (explicitly prohibited).

## Open items

None. All Technical Context unknowns are resolved above.
