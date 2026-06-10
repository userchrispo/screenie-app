# Screenie Quality Coverage Plan

## Current executable coverage
- App shell component renders the main landmark and heading.
- Playwright smoke test loads `/`, verifies the foundation state, and fails on browser console errors.

## MVP flow coverage to enable when UI lands
- Inbox capture: save link, save snippet, drop/select screenshot image.
- Persistence: saved items remain visible after reload via IndexedDB.
- Find: search seeded OCR-like pricing content, matched text is visible, sort changes do not drop results.
- Navigation: sidebar filters for Inbox, Library, Favorites, Tags, and Trash use semantic controls and update headings/results.
- Accessibility: search input has a searchbox role/name, capture actions are buttons, icon-only controls have accessible names, and tab order reaches primary workflows.

## Visual/runtime checkpoints
- Check 320, 768, 1024, and 1440 px widths.
- Verify no console errors or warnings before release.
- Compare Inbox against `screenie-capture.png` and Find against `screenie-find.png` for hierarchy, spacing, and interaction affordances.
