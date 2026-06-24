# Screenie

Screenie is a local-first web app for capturing screenshots, links, and text snippets into a personal inbox. Everything stays on your device—no account, no backend, no cloud sync required.

## Features

- **Inbox capture** — Save links, notes, and images via an omnibox-style capture panel. Paste from the clipboard or drag and drop screenshots.
- **Library & organization** — Browse all saves, star favorites, filter by type or tag, and assign items to projects.
- **Find** — Search across titles, tags, URLs, snippet text, and OCR-extracted text from images.
- **Local OCR** — Run Tesseract in the browser to extract text from screenshots and images.
- **Templates** — Start from curated capture templates or create your own (stored locally in IndexedDB).
- **Integrations hub** — Monitor local storage usage, OCR queue status, clipboard auto-capture, and test the browser extension bridge.
- **Settings** — Workspace insights, theme and density, capture defaults, OCR language, import/export, and data controls.
- **Command palette** — Quick navigation and actions (`Ctrl/Cmd + K`).

## Tech stack

- React 19 + TypeScript
- Vite
- IndexedDB (`idb`) for items, projects, and custom templates
- `localStorage` for theme and device preferences
- Tesseract.js for client-side OCR
- Vitest + Testing Library + Playwright for tests

## Getting started

**Requirements:** Node.js 20+ and npm.

```bash
git clone https://github.com/userchrispo/screenie-app.git
cd screenie-app
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run e2e` | Run Playwright end-to-end tests |

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + Shift + S` | Focus capture (Inbox) |
| `Esc` | Close panels and dialogs |

## Data & privacy

- All workspace data (items, projects, custom templates) is stored in **IndexedDB** in your browser.
- Theme, density, sidebar state, and capture defaults live in **localStorage**.
- Use **Settings → Import and export** to download or restore a JSON workspace archive.
- Clearing browser data for this site removes your local workspace.

## Browser extension bridge

Extensions can post captures to Screenie using the `screenie.captureDraft.v1` message protocol. Test the connection from **Integrations** or see the copyable snippet in that view.

## Project structure

```
src/
  components/     Shared UI primitives
  domain/         Types and pure domain logic
  features/       Screen-level views (inbox, find, settings, …)
  lib/            Storage, search, OCR, preferences, theme
  styles/         Global CSS and design tokens
  test/           Additional test specs
e2e/              Playwright tests
```

## Contributing

See [AGENTS.md](AGENTS.md) for engineering conventions and file ownership used in this repo.

## License

ISC
