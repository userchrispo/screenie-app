# Screenie Quality Coverage Plan

## Executable now
- App shell component test in `src/App.test.tsx` (main): inbox shell and Find navigation with seeded pricing results.
- Component tests in `src/test/features/`: `CapturePanel` validation/save feedback, `FindView` search and sort accessibility.
- Playwright foundation smoke: Inbox shell load with zero console errors (`e2e/screenie-foundation.spec.ts`).
- Playwright MVP core flows from main (`e2e/screenie.spec.ts`): link save+find, snippet persistence, trash restore.
- Playwright quality gap flows (`e2e/screenie-mvp-flows.spec.ts`): seeded search result count + sort, sidebar Favorites/Trash navigation, top-bar search routing to Find.

## Still blocked
- Responsive visual regression against `screenie-capture.png` and `screenie-find.png` (no snapshot tooling yet).

## Added in functional pass
- `e2e/screenie-functional.spec.ts`: favorite toggle, settings panel, Ctrl/Cmd+K search focus, tag browser filter, permanent delete from trash, image upload + find.
- Projects in IndexedDB, filter menu, library/tags views, item detail panel, integrations/templates/settings/notifications panels.

## Visual/runtime checkpoints (manual until automated)
- Check 320, 768, 1024, and 1440 px widths.
- Verify no console errors or warnings before release.
- Compare Inbox against `screenie-capture.png` and Find against `screenie-find.png` for hierarchy, spacing, and interaction affordances.
