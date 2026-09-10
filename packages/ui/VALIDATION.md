# Validation record — September 10, 2026

Scope: local Level 1 source cutover on `feat/complete-ui-primitives`, based on live-sync main `9579ac4`. This is not a deployment record. The [September 9 record](history/VALIDATION-2026-09-09.md) is historical and does not validate the current dependency changes.

## Verified

- Shared package: Panda generation, TypeScript `--noEmit`, tsup ESM/declarations and stylesheet extraction pass using existing installed tools. CSS extraction covers 12 files.
- Application production bundle: Vite build passes (1,796 modules). Existing chunk warning remains, approximately 539 KB main JavaScript before compression.
- Shared Chromium acceptance: 15/15 checks pass for variants, Composer selection/submission/IME, independent instances, tooltip, keyboard/focus, scrolling, portal light theme, reduced motion, narrow and bottom-edge placement; no runtime errors.
- Foundation Chromium checks pass: labeled typography/progress, native range/checkbox keyboard behavior, pointer/keyboard resizing, editable Popover and focus restoration, toast, dark/light surfaces, reduced motion and narrow bounds.
- Foundry host integration: 9/9 executed checks pass, including shared styles, menus, theme, tooltip, admin separation and rebuild endpoint origin/method rejection. The real rebuild/refresh check was explicitly SKIPPED because of the environment package-manager hook. The direct package build above is a separate check.
- Application fixtures pass: archive-browser, completed-modules, cycle-assignment, module, project-info, project-initiative, sidebar-navigation, task-create, task-detail-guards, task-detail, task-ordering, team-cycles, initiative-links, task-rows, showcase-routes, foundry-admin, activity. API/MCP writes are intercepted; no production data mutation is claimed.
- Activity checks include UUID scoping, failed-load retry, explicit read-only state without a save adapter, Escape/focus preserving the parent drawer and narrow bounds. Stabilized screenshot confirms the approved frosted material.
- Shared task rows wrap controls when title space is constrained. The narrow fixture requires the new markup and checks title widths, in addition to existing status, expansion, pointer reorder, move/archive failure/retry and persistence checks.
- Lockfiles parse as JSON/YAML; both workspace importer declarations match manifests; 44 transitive snapshots for the added UI dependencies resolve structurally. This does not prove a frozen or clean installation.

Screenshots and temporary fixture logs are in `/private/tmp/caelos-level1-foundations` and `/private/tmp/caelos-release-20260909`. They are temporary local evidence, not a permanent CI artifact. The reproducible tests are checked into the source folders.

## Reproduction

Run from the external Caelos checkout with existing dependencies; never install inside the vault. Package build steps from `packages/ui`:

```sh
node ../../node_modules/@pandacss/dev/bin.js codegen
node ../../node_modules/typescript/bin/tsc --noEmit
node ../../node_modules/tsup/dist/cli-default.js
node ../../node_modules/@pandacss/dev/bin.js cssgen --outfile dist/styles.css
```

From the Caelos repository root, start the documented preview and an isolated fixture app; see the root `tests/migration/README.md`. Browser examples:

```sh
PREVIEW_URL=http://127.0.0.1:5186 node packages/ui/tests/browser.mjs
PREVIEW_URL=http://127.0.0.1:5186 node packages/ui/tests/foundations.mjs
FOUNDRY_URL='http://127.0.0.1:5195/?foundry=1' SKIP_FOUNDRY_REBUILD=1 node packages/ui/tests/foundry.mjs
node node_modules/vite/bin/vite.js build
MIGRATION_PREVIEW_URL=http://127.0.0.1:5196 node tests/migration/task-rows.mjs
```

Use the freshly built production preview for final app checks. Restart dev servers with forced dependency optimization after shared package rebuilds; otherwise Vite can serve an older optimized copy. Tests must assert expected new markup rather than pass with an empty locator list.

## Limits

The environment's PreToolUse vault-hygiene hook rejects package-manager commands even when the requested working directory is the external code checkout. It was not bypassed. Fresh installation and frozen-lockfile verification therefore remain unverified; repeat them in a correctly configured external environment before release.

Full-application TypeScript has nine pre-existing diagnostics in App mock data and design tooling (`inject.ts`, `override.ts`); shared package TypeScript passes. No claim of a clean full-app typecheck is made. Whole-product light mode, other browsers, assistive-technology testing and the backend limitations in [LEVEL1-MIGRATION.md](LEVEL1-MIGRATION.md) remain outside this source cutover. Composer internal JavaScript is not covered by `checkJs`.

No skill, remote repository, merge-blocking CI, PR, commit or deployment was created for this handoff. The standalone source folder referred to at the time was retired on 2026-09-10; `packages/ui` is now the sole source and runs through the Caelos root harness. See [SOURCE-OWNERSHIP.md](SOURCE-OWNERSHIP.md).


Slash autocomplete verified September 10, 2026:

- Shared Panda generation, TypeScript checking, ESM/declaration output and stylesheet build passed. Application production build passed with the existing large-chunk warning.
- Expanded browser acceptance suite: **23 checks passed**. New coverage includes name-only rows and right-side hover summaries; filtering and skill insertion without submission; keyboard wraparound and list scrolling; preservation of surrounding text and caret position; empty results, paths, selection ranges and IME; Tab/outside-control dismissal; narrow viewport/light portal bounds; and touch selection with retained focus.
- Additional targeted browser checks passed for autocomplete fallback below a top-edge composer and reduced-motion behavior.
- Actual Foundry integration check passed for slash selection, tooltip stacking above the overlay, light portal inheritance, and absence of runtime errors. The full rebuild-endpoint Foundry suite was not rerun for this interaction change.
- Inspected rendered desktop dark, narrow dark, and Foundry dark/light states. The previously documented Foundry light-host canvas defect remains outside this interaction change.
- Preview and Foundry catalogs are labeled samples. Real installed-catalog discovery and command execution are application integrations; this verification covers supplied data and draft insertion. No dependency installation or deployment was performed.


Agent mention autocomplete verified September 10, 2026:

- Shared package generation, TypeScript checking, ESM/declaration output, stylesheet build, and application production build passed. The existing application large-chunk warning remains.
- Expanded browser suite: **27 checks passed**, covering the existing interactions plus participant-only name rows and right-side summaries, case-insensitive name/handle matching, keyboard and touch insertion without sending, multiple mentions alongside slash commands, surrounding draft/caret preservation, email exclusion, unmatched drafts, and independent chat rosters.
- Targeted narrow/light checks passed for menu and summary bounds and theme inheritance; desktop dark and narrow light screenshots were inspected.
- Actual Foundry agent selection passed with no runtime errors after refreshing Vite’s cached shared package. The full rebuild-endpoint suite was not rerun.
- Preview and Foundry participants are samples. Hosts supply their current chat roster through `agents`; actual routing of tagged messages remains an application integration.


Per-agent composer settings verified September 10, 2026 in the Caelos-console execution harness:

- Shared Panda generation, TypeScript checking, ESM/declaration output and stylesheet build passed. Application production build passed with the existing bundle-size warning.
- All 30 browser checks passed, including avatar-only hover, pinned agent name, participant selection, independent saved model/reasoning values, keyboard navigation and focus restoration, and the existing slash/@ behavior. No browser runtime errors.
- Focused actual-app Foundry checks passed for roster visibility and independent settings persistence. A 360 px touch/light check passed, including viewport fit and reduced-motion label expansion. Both rendered results were inspected.
- Reviewed composer source, Compose preview fixture, new composer test cases, Tooltip sideOffset support and composer docs were promoted to NovaCaelum-UI-Primitives (folder retired 2026-09-10; `packages/ui` is now the sole source — see [SOURCE-OWNERSHIP.md](SOURCE-OWNERSHIP.md)). Unrelated newer primitive/demo/test work there was preserved. This verifies the Caelos-console harness, not a clean standalone library installation or complete synchronization with another integration worktree.


Click-opened submenu placement verified September 10, 2026:

- Agent, model and reasoning menus dock above the complete settings card, with their bottom edge at the card top. Available-space fallback docks below the card; menus scroll within the viewport and keep the clicked field uncovered. The shared interaction contract now records this as the general rule for click-opened popups.
- All 31 Chromium browser checks passed. New geometry coverage exercises all three menus at 1280, 360 and 280 px, individual Escape dismissal, horizontal viewport bounds and top-edge fallback. Existing keyboard selection, per-agent settings, slash commands and mentions passed with no runtime errors.
- TypeScript checking, shared ESM/declaration/stylesheet build and application production build passed. The existing application bundle-size warning remains.
- Targeted actual-app Foundry checks passed for all three menu edges, overlay stacking, individual dismissal and absence of runtime errors. Desktop preview and Foundry renders were inspected.
- Verified source and the new regression case were selectively synchronized between NovaCaelum-UI-Primitives and the Caelos-console consumer (folder retired 2026-09-10; `packages/ui` is now the sole source — see [SOURCE-OWNERSHIP.md](SOURCE-OWNERSHIP.md)); unrelated library differences were preserved. This change implements the rule for these three submenus, not an audit of every existing popup in the application.


Selector motion correction verified September 10, 2026: model and reasoning now opt into the same shared emergence/retreat animation as the agent menu. Dock state remains available throughout exit. Built-package browser checks confirmed all three use the approved 260 ms entry easing and 160 ms exit, retain visible intermediate exit opacity, keep the parent pinned, and honor reduced motion. All 31 existing browser checks passed again; shared ESM/declaration and stylesheet builds passed. The refreshed preview was inspected.


Outside-click composer dismissal verified September 10, 2026:

- Fixed the parent settings card being repinned by a closing child. Nested selectors allow outside clicks to focus the editor and do not steal focus after exit. Escape and reopening during retreat preserve keyboard navigation.
- Closing menus start from their current rendered opacity and transform, including interrupted entry. Nested floating wrappers retain their captured position while the settings card retreats; entry/exit retain the approved 260/160 ms timings and reduced-motion behavior.
- All 32 built-package Chromium browser checks passed. Added coverage checks normal and interrupted outside dismissal for agent, model, reasoning, permissions and add menus, stationary submenu positioning and clicked-editor focus. Existing keyboard, narrow-placement, slash and mention checks passed with no runtime errors. Dedicated animation timing and reduced-motion checks passed.
- Shared ESM/declaration and stylesheet builds passed. Changed source and the new test were selectively synchronized to the durable library (the NovaCaelum-UI-Primitives folder retired 2026-09-10; `packages/ui` is now the sole source — see [SOURCE-OWNERSHIP.md](SOURCE-OWNERSHIP.md)); the visible localhost:5182 preview was refreshed and inspected. Application production and Foundry checks were not rerun for this correction.
