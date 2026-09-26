# Implementation Plan: Improv Round Draw

**Branch**: `001-improv-round-draw` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-improv-round-draw/spec.md`

## Summary

Build "Three Things", a browser-only improv icebreaker game where a host loads participant and question lists (bulk paste or single entries), presses one draw button, watches a short animation, and gets a random name/question pair with a fixed 60-second countdown. All data persists in the host's browser (localStorage) with zero network transmission; the host can disable/enable individual items to control repeats, edit items in setup, and see eligible/disabled counts. Technical approach: a client-side React + TypeScript SPA scaffolded with Vite, two views (setup, play) held in a single-page state machine, no backend, no accounts, CSS-only draw animation.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 18/19

**Primary Dependencies**: React, Vite (scaffolding/dev/build), ESLint + Prettier, Husky + lint-staged + commitlint. No UI framework, no state library, no animation library — the platform (React state + CSS animations) suffices (Constitution Principle I).

**Storage**: Browser `localStorage` (client-only; spec FR-005/FR-011 forbid any transmission). Scale is at most a few hundred short strings — far below localStorage limits. Failure (private browsing/full storage) surfaces a plain-language error per FR-007.

**Testing**: Vitest + React Testing Library (industry standard for Vite/React TypeScript projects) — confirmed in Phase 0 research.

**Target Platform**: Modern desktop/laptop browsers only (spec FR-038: phone/tablet out of scope); minimum viewport 1280×720, no horizontal scrolling (SC-016).

**Project Type**: Web application (frontend only — no backend, no API; spec FR-037 forbids accounts/network services).

**Performance Goals**: Draw activation → result visible within 1 s for 200 participants + 200 questions (SC-006); countdown accurate to ±1 s (SC-004); animation ≤ 5 s (FR-017).

**Constraints**: Fully offline-capable after load; 100% of data stays on device (FR-011, SC-015); English-only UI (Constitution Principle II); fixed 60 s round, not configurable (FR-024).

**Scale/Scope**: 2 views (setup, play), ~4 entities, single host, single device, 200 items per list must stay responsive.

**Open Questions Resolved**: all `NEEDS CLARIFICATION` items were moved to Phase 0 research (`research.md`): storage mechanism, animation technique, view routing, test runner, and interrupted-round persistence. No unresolved clarifications remain at gate time.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Simplicity First (NON-NEGOTIABLE) | PASS | Client-only SPA, localStorage, CSS animation, no backend/DB/state library. Every dependency earns its place. |
| II | English Only (NON-NEGOTIABLE) | PASS | All identifiers, UI strings, docs, commits in English. |
| III | KISS, DRY, SOLID (NON-NEGOTIABLE) | PASS | Two views, shared list component for participants/questions, domain logic in plain modules, handlers hoisted to named functions. |
| IV | Node.js Stack (NON-NEGOTIABLE) | PASS | React + TypeScript frontend; no server needed, so NestJS/database provisions are N/A by the principle's own wording. |
| V | Industry-Standard Scaffolding (NON-NEGOTIABLE) | PASS | Vite-generated layout, ESLint+Prettier, `.editorconfig`, Husky+lint-staged+commitlint, `Dockerfile`, CI running lint/type-check/tests, strict TS, `@/` path alias. |
| VI | Conventional Commits (NON-NEGOTIABLE) | PASS | commitlint enforces Conventional Commits 1.0.0. |
| VII | One Component Per File, No Inline Functions (NON-NEGOTIABLE) | PASS | One exported component per `.tsx`; all handlers/hooks named top-level; no lambdas in JSX props. |

**Gate result**: PASS — no violations, no Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/001-improv-round-draw/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── App.tsx              # Root: view switch (setup | play), session state owner
│   └── AppStyles.module.css
├── domain/
│   ├── types.ts             # Participant, Question, Round, SessionData
│   ├── draw.ts              # uniform random selection from eligible items
│   └── roundState.ts        # countdown/interrupted/resume/discard transitions
├── storage/
│   ├── sessionStore.ts      # load/save SessionData to localStorage + error surfacing
│   └── storageKeys.ts
├── hooks/
│   ├── useSessionData.ts    # list CRUD, edit, enable/disable, restore-all, clear-all
│   └── useRound.ts          # draw, timer, interruption, acknowledge
├── components/
│   ├── SetupView.tsx        # lists, paste import, edit, privacy line, clear-all
│   ├── PlayView.tsx         # counts, lists, draw control, round display
│   ├── ParticipantList.tsx  # shared list renderer (eligible/disabled, toggles)
│   ├── QuestionList.tsx
│   ├── DrawAnimation.tsx    # CSS animation, ≤5 s, resolves into pair
│   ├── RoundDisplay.tsx     # name + question + countdown, time-up signal
│   ├── InterruptedRound.tsx # resume-or-discard choice
│   └── StatusBanner.tsx     # game-over / storage-error messages
├── main.tsx
├── styles/global.css
└── vite-env.d.ts

tests/
├── unit/                    # domain, storage, hooks
├── integration/             # view flows (setup→play, draw→interrupt→resume)
└── setup.ts

public/
.github/workflows/ci.yml     # lint + type-check + test
Dockerfile                   # static build served by nginx (scaffolding standard)
eslint.config.js  .prettierrc  .editorconfig  .env.example  README.md
```

**Structure Decision**: Single-project frontend-only SPA (template Option 1 adapted to web app). No `backend/` — the spec forbids servers and network transmission (FR-011, FR-037). Layering follows the dependency rule: `components` → `hooks` → `domain`/`storage`; `domain` has no outward dependencies. Participants and questions share one generic list component to satisfy DRY without speculative abstraction.

## Complexity Tracking

None — Constitution Check passed with no violations.
