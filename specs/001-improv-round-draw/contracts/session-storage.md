# Contract: Session Storage

**Source**: spec FR-005–FR-011, FR-026, FR-031; research R1/R5
**Type**: Module contract (`src/storage/sessionStore.ts`) + persistence format

## Persistence format

- **Backend**: browser `localStorage`, single key `three-things.session`.
- **Value**: `JSON.stringify(SessionData)` — see `data-model.md` for the schema (`version`, `participants`, `questions`, `currentRound`, `view`).
- **Scope**: this is the only storage access point in the codebase; components/hooks never touch `localStorage` directly (DRY, single responsibility).

## Module API

```ts
loadSession(): SessionData            // parses + validates; returns empty SessionData on missing/corrupt/unknown version
saveSession(data: SessionData): SaveResult
clearSession(): SaveResult            // used only behind the FR-008 confirmation flow
type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'serialize' }
```

## Behavioral guarantees

| Guarantee | Requirement |
|-----------|-------------|
| `loadSession` never throws; corrupt/unknown-version data yields an empty session (and the UI may warn), never a crash | FR-007 |
| `saveSession` failure returns `{ ok: false, reason }`; caller keeps in-memory state and shows the plain-language error — data is never silently lost | FR-007 |
| Round state (`currentRound`) is persisted on every mutation so reload/tab-close restores an interrupted round with its exact remaining time | FR-026, SC-017 |
| Disabled states persist across reload | FR-031, SC-005 |
| `clearSession` removes only this app's key | FR-008 |
| No network calls exist anywhere in this module or its callers | FR-011, SC-015 |
