# Screenie Local Beta

Screenie is a local-first web app for saving screenshots, images, links, and text snippets into a searchable inbox. This beta is meant for local use and review before any hosted backend, auth, sync, or packaged browser extension work.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the local Vite URL printed in the terminal.

For a production-style local build:

```bash
npm run build
npm run preview
```

## Supported Workflows

- Capture a link, text snippet, screenshot, or image from the Inbox.
- Search saved content across titles, URLs, text, tags, and OCR text in Find.
- Favorite, trash, restore, permanently delete, and edit saved items.
- Create, rename, delete, and filter by projects.
- Browse Library, Favorites, Tags, Trash, Integrations, Templates, and Settings.
- Export a local JSON archive, import a Screenie archive, clear local data, or restore starter demo data.
- Review app-side extension bridge captures before saving them.

## Local Data Model

- All user data is stored in the browser's IndexedDB database named `screenie-local`.
- Uploaded image data is stored locally as data URLs in IndexedDB.
- Clear all data removes local saves and projects and keeps demo reseeding disabled after reload.
- Reset workspace clears local data and restores the starter demo projects and captures.
- Export/import is a full workspace archive flow, not cloud sync.

## OCR Behavior

- OCR runs locally in the browser through `tesseract.js`.
- Image and screenshot captures save immediately, then OCR is queued and processed in the background when supported.
- OCR failures are non-blocking. Users can retry OCR from the item detail panel.
- OCR quality depends on the image, browser, device performance, and worker availability.

## Keyboard and Accessibility

- `Ctrl/Cmd + K`: go to Find and focus search.
- `Ctrl/Cmd + Shift + S`: return to the Inbox capture area.
- `Escape`: closes active panels and dialogs.
- Dialogs use semantic controls and accessible labels for icon-only actions.

## Verification Commands

Run the local beta readiness suite before sharing the app:

```bash
npm test
npm run lint
npm run build
npm run e2e
npm audit --audit-level=high
```

## Current Non-Goals

- No user accounts, auth, hosted backend, multi-device sync, or team permissions.
- No cloud OCR or cloud storage.
- No installable browser extension package yet; the current extension support is the app-side capture bridge contract.
- No strict pixel snapshot testing against `screenie-capture.png` or `screenie-find.png`; those files are visual references.
