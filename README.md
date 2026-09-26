# Three Things

A browser-only improv icebreaker game: load participant and question lists, press **Draw**, watch a short animation, and play a timed 60-second round. The host can disable or enable individual participants and questions to control repeats, and always sees eligible/disabled counts.

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

## Docker

```bash
docker build -t three-things .
docker run --rm -p 8080:80 three-things   # serves the static build on nginx
```

## Privacy

Your lists stay on this device and are never sent to anyone. All data is stored in your browser's localStorage under the key `three-things.session`. The codebase contains no network calls that transmit names or questions, and there are no accounts.

## Validation

End-to-end validation scenarios (V1–V9) live in
[`specs/001-improv-round-draw/quickstart.md`](specs/001-improv-round-draw/quickstart.md).
CI runs `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` on every push and pull request.
