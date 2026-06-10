# Screenie Agent Guide

## Product Context
- Screenie is a local-first web MVP for saving screenshots, links, and text snippets into an inbox.
- `screenie-capture.png` and `screenie-find.png` are the product UI references.
- `DESIGN.md` provides visual-system inspiration, but this is an app surface, not a landing page.
- `APP.md` is currently empty and should not be treated as a complete spec.

## Stack
- React, TypeScript, Vite, npm.
- Local persistence uses IndexedDB.
- Tests use Vitest, Testing Library, and Playwright.
- Icons use `lucide-react`.

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`
- E2E: `npm run e2e`

## Engineering Rules
- Main thread owns architecture, package/config files, app shell, shared contracts, integration, merges, and final verification.
- Helper engineers work on their own branch/worktree and update only their own status file under `docs/agents/`.
- Commit each verified slice with a descriptive message.
- Keep changes scoped. Do not refactor unrelated files.
- Use named exports for application modules.
- Prefer simple React state and typed pure functions before adding abstractions.
- All interactive UI must use semantic controls and accessible labels.
- No secrets, `.env` files, build output, or `node_modules` in git.

## File Ownership
- Main: `package.json`, config files, `src/App.tsx`, `src/main.tsx`, `src/styles/`, shared contracts, merges.
- Frontend engineer: `src/components/`, `src/features/inbox/`, `docs/agents/frontend.md`.
- Search/data engineer: `src/domain/`, `src/lib/storage/`, `src/lib/search/`, related tests, `docs/agents/search-data.md`.
- Quality engineer: `src/test/`, `e2e/`, test specs, `docs/agents/quality.md`.

## Status Updates
Each helper status file must keep these sections current:
- Now
- Done
- Blocked
- Next
- Files touched
- Needs from others

## Conflict Protocol
1. Stop before editing a file outside your ownership.
2. Update your status file with the need and exact file path.
3. Main thread decides whether to delegate, merge, or adjust ownership.
4. Never resolve merge conflicts by discarding another thread's work without review.
