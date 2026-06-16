# Frontend Engineer Status

## Now
- Product Beta UI audit pass complete for owned frontend files.

## Done
- Added capture metadata fields for link, snippet, and image intake without changing app/storage contracts.
- Replaced browser prompt project creation with an app-native project dialog in the sidebar.
- Replaced settings `window.confirm` clear flow with an app-native confirmation dialog.
- Added Settings import/export/reset UI states and documented that real actions need main-thread data wiring.
- Added Inbox intake review metrics for unassigned items, OCR queued/ready, and extension intake readiness.
- Added OCR ready/queued badges on saved item cards and OCR copy/queued actions in item detail.
- Added colocated tests for capture metadata, settings clear dialog, and sidebar project dialog.

## Blocked
- Working Settings import/export/reset needs the app shell/storage layer to pass workspace items, projects, import handlers, and reset/seed handlers into `SettingsView`.

## Next
- Main can wire Settings data actions when storage ownership is available.
- Quality can decide whether to mirror the colocated tests into `src/test/` conventions.

## Files touched
- `docs/agents/frontend.md`
- `src/components/SavedItemCard.tsx`
- `src/components/Sidebar.test.tsx`
- `src/components/Sidebar.tsx`
- `src/features/inbox/CapturePanel.test.tsx`
- `src/features/inbox/CapturePanel.tsx`
- `src/features/inbox/InboxView.tsx`
- `src/features/item/ItemDetailPanel.tsx`
- `src/features/settings/SettingsView.test.tsx`
- `src/features/settings/SettingsView.tsx`
- `src/styles/global.css`

## Needs from others
- Main: add SettingsView props/handlers for real archive export, archive import review, and reset-to-seed flows.
