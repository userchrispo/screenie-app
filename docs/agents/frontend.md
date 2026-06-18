# Frontend Engineer Status

## Now
- Product Beta UI audit pass complete for owned frontend files.
- Local beta readiness modal keyboard/focus checks are wired for Settings, extension review, item detail, project dialogs, and permanent delete confirmation.

## Done
- Added capture metadata fields for link, snippet, and image intake without changing app/storage contracts.
- Replaced browser prompt project creation with an app-native project dialog in the sidebar.
- Replaced settings `window.confirm` clear flow with an app-native confirmation dialog.
- Added Settings import/export/reset UI states with main-thread data actions wired through the app shell.
- Added Inbox intake review metrics for unassigned items, OCR queued/ready, and extension intake readiness.
- Added OCR ready/queued badges on saved item cards and OCR copy/queued actions in item detail.
- Added colocated tests for capture metadata, settings clear dialog, and sidebar project dialog.
- Added local beta E2E coverage for project rename/delete, item detail edit lifecycle, invalid archive import, extension bridge rejection/confirmation, rejected image uploads, and modal keyboard behavior.
- Marked hidden Inbox floating previews decorative so users do not tab into or click controls hidden behind the capture panel.

## Blocked
- No known frontend blocker for the local beta readiness pass.

## Next
- Continue visual polish against `screenie-capture.png` and `screenie-find.png` if stricter design parity becomes a release requirement.

## Files touched
- `docs/agents/frontend.md`
- `src/components/SavedItemCard.tsx`
- `src/components/Sidebar.test.tsx`
- `src/components/Sidebar.tsx`
- `src/features/inbox/CapturePanel.test.tsx`
- `src/features/inbox/CapturePanel.tsx`
- `src/features/inbox/InboxView.tsx`
- `src/features/item/ItemDetailPanel.tsx`
- `src/features/inbox/ExtensionCaptureDialog.tsx`
- `src/features/settings/SettingsView.test.tsx`
- `src/features/settings/SettingsView.tsx`
- `src/styles/global.css`

## Needs from others
- None at this checkpoint.
