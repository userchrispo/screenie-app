# Screenie Quality Coverage Plan

## Executable now
- App shell component test in `src/App.test.tsx` (main): inbox shell and Find navigation with seeded pricing results.
- Component tests in `src/test/features/`: `CapturePanel` validation/save feedback, `FindView` search and sort accessibility.
- Product Beta component/contract tests:
  - OCR-ready search finds items by `extractedText` and surfaces the OCR marker in `src/test/features/FindView.test.tsx`.
  - Stubbed external-intake prefill for link/snippet capture in `src/test/features/CapturePanel.test.tsx`.
  - Project create/rename/delete data behavior in `src/test/productBetaContracts.test.ts`.
- Playwright foundation smoke: Inbox shell load with zero console errors (`e2e/screenie-foundation.spec.ts`).
- Playwright MVP core flows from main (`e2e/screenie.spec.ts`): link save+find, snippet persistence, trash restore.
- Playwright quality gap flows (`e2e/screenie-mvp-flows.spec.ts`): seeded search result count + sort, sidebar Favorites/Trash navigation, top-bar search routing to Find.
- Playwright Product Beta smoke (`e2e/screenie-beta-regression.spec.ts`): app-native project creation persistence and responsive console-clean checks at 320, 768, 1024, and 1440 px.
- Current search/data tests cover OCR metadata, capture bridge draft parsing, workspace snapshots, and repository import/export/reset round trips.

## Still blocked
- Responsive visual regression against `screenie-capture.png` and `screenie-find.png` (no snapshot tooling yet).
- Extension bridge end-to-end intake needs broader Playwright coverage, but the app-side postMessage listener and review dialog are now wired.
- Project rename/delete end-to-end workflows need broader Playwright coverage, but app-native controls and repository behavior are now wired.
- Import/export end-to-end workflow needs broader Playwright coverage, but Settings controls now call app-shell snapshot handlers.

## Added in functional pass
- `e2e/screenie-functional.spec.ts`: favorite toggle, settings panel, Ctrl/Cmd+K search focus, tag browser filter, permanent delete from trash, image upload + find.
- Projects in IndexedDB, filter menu, library/tags views, item detail panel, integrations/templates/settings/notifications panels.
- App-native permanent-delete confirmation, Settings export/import/reset handlers, extension bridge review, and project create/rename/delete controls.

## Visual/runtime checkpoints (manual until automated)
- Check 320, 768, 1024, and 1440 px widths.
- Verify no console errors or warnings before release.
- Compare Inbox against `screenie-capture.png` and Find against `screenie-find.png` for hierarchy, spacing, and interaction affordances.
