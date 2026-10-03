# Three Things

A browser-only improv icebreaker game: load participant and question lists, press **Draw**, watch a short animation, and play a timed round. The host sets the animation and answer times up front, can disable or enable individual participants and questions to control repeats, always sees eligible/disabled counts, and can move to the next round at any moment with **Next round**.

## Requirements

- Node.js ≥ 22.12, npm
- Desktop/laptop browser (latest Chrome/Firefox/Safari), window ≥ 1280×720

## Setup and commands

```bash
npm install        # install dependencies
npm run dev        # start dev server (Vite)
npm run lint       # ESLint
npm run typecheck  # tsc (strict mode)
npm test           # Vitest run
npm run format     # Prettier write
npm run build      # production build (used by Dockerfile/CI)
```

## Timing

Two session-wide settings live on the setup view, above the participants and questions panels:

| Setting            | Range       | Default | Notes                                                  |
| ------------------ | ----------- | ------- | ------------------------------------------------------ |
| **Animation time** | `0`–`5` s   | `3` s   | `0` skips the animation and reveals the pair instantly |
| **Answer time**    | `5`–`300` s | `60` s  | How long the host has to play the round                |

- Each value is a whole number of seconds typed into a text field; values commit when you leave the field or press <kbd>Enter</kbd>. There are no stepper buttons.
- Leaving a field empty restores that field's default. A rejected value (non-numeric, fractional, or out of range) is not applied and shows a short message; the last valid value stays in effect.
- **Restore default timing** sets both fields back to `3` / `60`.
- Changing the timing never affects a round that is already on screen. Each round captures the answer time when it is drawn, so a running or interrupted round keeps its own countdown after you change the settings.
- **Next round** is available at any time while a pair is on screen — while the countdown runs, after it hits zero, and if you left the round interrupted — so a slow group is never forced to wait.

## Docker

```bash
docker build -t three-things .
docker run --rm -p 8080:80 three-things   # serves the static build on nginx
```

## Deployment

The `Deploy to GitHub Pages` workflow publishes the production build when changes are pushed to `main`, or when run manually from GitHub Actions. It configures GitHub Pages and builds with the repository's Pages base path. Once the workflow completes, the site is available at <https://scorcherfjk.github.io/three-things/>.

## Privacy

Your lists stay on this device and are never sent to anyone. All data is stored in your browser's localStorage under the key `three-things.session`. The codebase contains no network calls that transmit names or questions, and there are no accounts.

## Validation

End-to-end validation scenarios live in each feature's quickstart:

- Round draw, interruption, and resume: [`specs/001-improv-round-draw/quickstart.md`](specs/001-improv-round-draw/quickstart.md) (V1–V9)
- Timing settings, migration, and **Next round**: [`specs/002-round-timing-settings/quickstart.md`](specs/002-round-timing-settings/quickstart.md) (V1–V13)

CI runs `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` on every push and pull request.
