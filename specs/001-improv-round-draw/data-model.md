# Data Model: Improv Round Draw

**Branch**: `001-improv-round-draw` | **Date**: 2026-09-26
**Source**: spec.md § Key Entities, FR-001–FR-038

All types live in `src/domain/types.ts` (TypeScript `strict`, no `any`). Identifiers are opaque strings generated at entry time (`crypto.randomUUID()` or a monotonic counter fallback); identity is the list entry, never the text (FR-009).

## Entities

### Participant

| Field | Type | Rules |
|-------|------|-------|
| `id` | `string` | Unique, immutable. Two entries with identical `text` are distinct participants (FR-009). |
| `text` | `string` | Name exactly as entered: accents, internal punctuation preserved (FR-004). Non-empty after trim; trimmed on import (FR-002). Max length: 200 chars (validation message in plain language, FR-007-style; longer lines rejected individually without discarding the rest). |
| `status` | `'eligible' \| 'disabled'` | Set by host toggle; default `'eligible'` (FR-027). Editing text never changes `status` (FR-010). |

### Question

Same shape as Participant (`id`, `text`, `status`) with the same rules; text max length 500 chars. One question = one complete turn (FR-036).

### Round

| Field | Type | Rules |
|-------|------|-------|
| `participantId` | `string` | References a Participant that was eligible at draw time. |
| `questionId` | `string` | References a Question that was eligible at draw time. |
| `drawnAt` | `number` | Epoch ms of the draw reveal. |
| `deadline` | `number` | Epoch ms = reveal time + 60 000 (FR-024, fixed 60 s, not configurable). |
| `remainingMs` | `number` | Frozen value used only while `status === 'interrupted'`; 60 000 otherwise. |
| `status` | `RoundStatus` | See state transitions below. |

**RoundStatus**: `'running' | 'interrupted' | 'timeup'`

Rules:
- A round is the unit acknowledged before the next draw (FR-023, FR-036); exactly one round may exist at a time.
- The round does **not** disable its participant/question (FR-026 discard restores them eligible; disabling is host-driven only).

### SessionData

The single persisted document (localStorage key `three-things.session`):

| Field | Type | Rules |
|-------|------|-------|
| `version` | `1` | Schema version for future migrations; unknown version → treat as empty + warn (FR-007). |
| `participants` | `Participant[]` | Ordered as entered; duplicates allowed (FR-009). |
| `questions` | `Question[]` | Same. |
| `currentRound` | `Round \| null` | `null` when no round is on screen (pre-draw or post-discard/acknowledge). |
| `view` | `'setup' \| 'play'` | Last active view; restored on load (supports FR-014/FR-026 interruption flow). |

Derived (never stored): eligible/disabled counts per kind (FR-032), game-over condition (FR-033).

## Validation Rules

| Rule | Source | Behavior |
|------|--------|----------|
| Paste splits on newlines; trims; drops empty/whitespace-only lines | FR-002 | Invalid lines dropped; rest kept. |
| Preserve characters/accents/internal punctuation exactly | FR-004 | No normalization beyond outer trim. |
| Duplicate texts kept as independent entries | FR-009 | Never merged/deduped/rejected. |
| Name > 200 chars / question > 500 chars | Spec edge case (long entries) | That line is reported in plain language and skipped; other lines saved. |
| Storage write fails (quota/private mode) | FR-007 | In-memory state kept; error surfaced; **no silent loss**. |
| Clear-all requires confirmation | FR-008/FR-012 | Dialog before `localStorage` wipe. |

## State Transitions

### View state
```
setup ⇄ play     (host toggles; round NOT discarded — interrupted instead, FR-014/FR-026)
```

### Round lifecycle
```
(none)
  │ draw pressed & ≥1 eligible participant & ≥1 eligible question
  │   → [animation ≤5s (FR-017)] → select pair (FR-018) → RUNNING
  │ draw pressed with 0 eligible of either kind → NONE + game-over message (FR-033, no animation)
  │
RUNNING
  │ leave play view / reload / tab close → INTERRUPTED (freeze remainingMs) (FR-026)
  │ remainingMs hits 0 → TIMEUP (signal visible; round stays on screen) (FR-022)
  │
INTERRUPTED
  │ host chooses "Resume" → RUNNING (continue from remainingMs)
  │ host chooses "Discard" → NONE; participant + question still eligible (FR-026, SC-017)
  │
TIMEUP
  │ host acknowledges / "Next round" → NONE (FR-023); lists untouched (FR-035)
```

Draw re-entrancy: while `status ∈ {RUNNING(after reveal), INTERRUPTED, TIMEUP}` or animation is active, extra draw activations are ignored (FR-021).

### Item status
```
eligible ⇄ disabled   (host toggle from play view, FR-027)
editing text          (setup view only; status unchanged, FR-010)
restore-all           → every item eligible (FR-030)
clear-all (confirmed) → document reset to empty (FR-008)
```

## Invariants

1. `currentRound.participantId` / `questionId` always resolve to existing entries (discard of an item never happens while it is in a displayed round — removal is only offered in setup for items, and setup edits keep identity).
2. No draw selects an item with `status === 'disabled'` (FR-029, SC-003).
3. `remainingMs` never exceeds 60 000 and never goes negative (SC-004).
4. Persistence writes happen on every mutation (auto-save), so reload never loses acknowledged work (spec Assumptions).
5. Nothing in this model is ever transmitted — there is no network layer in the codebase (FR-011, SC-015).
