# Contract: Session Storage (schema version 2)

**Source**: spec FR-009, FR-013, FR-025, US1 AS5, SC-008, SC-014; research R4, R5, R6
**Type**: Module contract (`src/storage/sessionStore.ts`) + persistence format
**Extends**: `../../001-improv-round-draw/contracts/session-storage.md`. The storage backend, the key, the `SaveResult` shape, and the "never silently lose data" guarantee are unchanged. This contract documents schema version 2 and the version 1 → 2 upgrade.

## Persistence format

- **Backend**: browser `localStorage`, single key `three-things.session` — unchanged.
- **Value**: `JSON.stringify(SessionData)` at `version: 2`; see `../data-model.md` for the schema.
- **Scope**: still the only storage access point in the codebase; components and hooks never touch `localStorage` directly.
- **New fields**: `timing` (required) and `Round.answerMs` (required inside a stored round).

## Module API

```ts
loadSession(): SessionData            // validate; upgrade a v1 document; empty session on missing/corrupt/unknown version
saveSession(data: SessionData): SaveResult
clearSession(): SaveResult            // used only behind the 001 clear-all confirmation flow
type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' | 'serialize' }
```

No new exported function is added. The upgrade is an internal step of `loadSession`, so the only entry point into storage remains the same three functions (research R4, SRP).

## Version 1 → 2 upgrade

| Source document                                                | Result                                                                                                                      |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `version: 1`, valid under 001's rules                          | Upgraded: `version: 2`, `timing` = `{ animationSeconds: 3, answerSeconds: 60 }`, every stored round gets `answerMs: 60_000` |
| `version: 1`, participants/questions/view/currentRound invalid | Empty session (unchanged 001 behavior)                                                                                      |
| `version: 2`, valid under the current rules                    | Used as is                                                                                                                  |
| `version: 2`, any field invalid                                | Empty session                                                                                                               |
| Missing / unparseable / `version` absent or greater than 2     | Empty session                                                                                                               |

**The upgrade copies every other value through unchanged.** No participant, question, eligible-or-disabled state, `currentRound`, or `view` is modified, cleared, re-derived, or re-validated against the new timing rules. Nothing is asked of the host to re-enter (FR-013, SC-014).

A `version: 1` round receives `answerMs: 60_000` because that is the only duration the previous version could produce, so a restored interrupted round keeps exactly the remaining time it had (001 SC-017, FR-013).

The upgrade is not written back on load. It is applied in memory and persisted by the next ordinary save, which the existing auto-save effect performs on the first mutation — or, for an untouched session, on the next mutation of any kind. Nothing depends on the write-back timing.

## Behavioral guarantees

| Guarantee                                                                                                                                                | Requirement            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| A session saved by the previous version is never discarded: lists, statuses, the interrupted round, and the active view all survive the upgrade          | FR-013, SC-014         |
| For upgraded data the two timing fields show 3 and 60, and the host is never blocked from playing                                                        | FR-005, FR-012, FR-013 |
| Both timing values survive a page reload and a full browser restart                                                                                      | FR-009, SC-008         |
| A rejected timing entry is never written: the stored value is always the last valid one or the default                                                   | FR-006, FR-007, SC-009 |
| A round's stored `answerMs` is never rewritten by a later timing change                                                                                  | FR-010                 |
| `loadSession` never throws; corrupt or unknown-version data yields an empty session                                                                      | 001 FR-007             |
| `saveSession` failure returns `{ ok: false, reason }`; the caller keeps in-memory state and shows the plain-language error — data is never silently lost | 001 FR-007             |
| `clearSession` removes only this app's key and resets timing to the defaults along with the lists                                                        | 001 FR-008, FR-011     |
| No network calls exist anywhere in this module or its callers                                                                                            | FR-025, 001 FR-011     |

## Out of scope

- No second storage key, no key rename, and no cache of the pre-upgrade document.
- No cloud sync, export, or import of the session document.
- No version 3 handling beyond treating it as unknown.
