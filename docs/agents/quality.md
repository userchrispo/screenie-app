# Quality Engineer Status

## Now
- Added executable smoke coverage for the current placeholder app and pending MVP flow specs for later implementation.

## Done
- Read AGENTS.md, DESIGN.md, screenshot references, App test, Playwright config, and current quality status.
- Added Playwright foundation smoke coverage that checks app load and console errors.
- Added skipped Playwright specs for critical MVP flows blocked on UI implementation.
- Added a quality coverage plan under `src/test/`.

## Blocked
- Full Inbox, capture, search, filter, persistence, and accessibility flow tests are skipped until the frontend/data branches expose the MVP UI controls and text.

## Next
- After implementation lands, unskip `e2e/screenie-mvp-flows.spec.ts`, align selectors to final accessible names, and add component-level tests for capture/search controls.

## Files touched
- `e2e/screenie-foundation.spec.ts`
- `e2e/screenie-mvp-flows.spec.ts`
- `src/test/quality-coverage-plan.md`
- `docs/agents/quality.md`

## Needs from others
- Frontend branch should provide semantic buttons/links/searchbox labels matching the MVP specs where possible.
- Search/data branch should ensure seeded pricing data is available in the UI before unskipping find-flow tests.
