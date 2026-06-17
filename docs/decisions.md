# Screenie Decisions

## 2026-06-10
- Build a local-first React/TypeScript web MVP before desktop, extension, auth, or backend work.
- Use npm because it is available in the local environment.
- Use IndexedDB for saved items and uploaded image blobs.
- Use local branches and worktrees for helper engineers, then merge locally before pushing `main`.
- Use repo status files as the shared communication board.
- Main thread remains architect and merge owner.
- Helper worktrees:
  - Frontend: `C:\Users\ladol\Desktop\screenie-app-frontend`, branch `feature/frontend-inbox`, thread `019eb3a4-e377-7fb3-828c-d8d2db598475`.
  - Search/Data: `C:\Users\ladol\Desktop\screenie-app-search-data`, branch `feature/search-data`, thread `019eb3a5-5f80-7301-acd5-096647348735`.
  - Quality: `C:\Users\ladol\Desktop\screenie-app-quality-e2e`, branch `feature/quality-e2e`, thread `019eb3a5-d70d-7513-bac2-81b6f14c7e5b`.
- Helper branches started from commit `e5d4418`; `main` later integrated the MVP at `8c9ca97`. Do not merge helper branches wholesale without rebasing/review because they predate the integrated UI and tests.

## 2026-06-16
- Product Beta remains local-first: no auth, backend sync, or cloud OCR in this phase.
- Add real OCR through a browser-side worker dependency and keep OCR failures non-blocking so image capture still saves immediately.
- Use additive optional fields for beta metadata so existing IndexedDB records migrate safely.
- Treat extension support as an app-side capture intake contract for now; installable extension packaging is a later phase.
- Replace native browser prompts/confirms with app-native dialogs for beta workflows.
- Add JSON export/import and reset-demo controls to make local-first data portable and recoverable.
