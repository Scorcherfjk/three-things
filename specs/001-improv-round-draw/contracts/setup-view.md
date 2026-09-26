# Contract: Setup View UI

**Source**: spec FR-001–FR-012, FR-038; US2
**Type**: UI contract (host-facing)

## Layout (desktop ≥ 1280×720, no horizontal scroll — SC-016)

Two side-by-side panels: **Participants** (left) and **Questions** (right). Header shows product name "Three Things" (FR-025) and a view switch to Play.

## Controls & Behavior

| Element | Behavior | Requirement |
|---------|----------|-------------|
| View switch | Toggles to Play view; an on-screen round is interrupted, not discarded | FR-014, FR-026 |
| Bulk paste textarea (per panel) + **Add lines** button | Splits input per line, trims, drops blank lines, appends items | FR-002 |
| Add single item (text input + button) | Appends one item | FR-003 |
| Per-item text field (edit in place, on change) | Replaces text immediately; keeps eligible/disabled status; only place text editing exists | FR-010 |
| Per-item **Remove** button | Deletes that entry only (identity-based, not text-based) | FR-003 |
| Item row | Shows text + status badge (Eligible/Disabled) | FR-013 |
| Privacy line (always visible) | Exact copy: *"Your lists stay on this device and are never sent to anyone."* | FR-012 |
| **Clear all data** button | Opens confirmation dialog; on confirm, wipes all stored content and resets both lists to empty | FR-008, FR-012 |
| Storage failure notice | Replaces silent failure: *"We couldn't save your changes in this browser. Your last saved lists are unchanged."* | FR-007 |

## Messages (plain language, English)

- Long-line rejection: *"This line is too long and was skipped. The rest of your list was saved."*
- Clear-all confirmation: *"Clear all participants and questions from this device? This cannot be undone."* → buttons **Clear everything** / **Cancel**.

## Out of scope for this view
- No draw control, no countdown, no disable toggles (play-view only), no import/export/file upload.
