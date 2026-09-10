# Foundry release integration — September 9, 2026

The approved shared UI and compact menus are integrated onto current release code, preserving the fixes shipped in PRs 14 and 15. This branch is `integrate/foundry-release-2026-09-09`, based on `cee2078d39e7a998aca08586706aece6dc1c7216`. Integration used the common base `18e506c` and resolved overlapping behavior individually. Neither original checkout was overwritten.

The lab snapshot is preserved outside the synced vault, with a tracked and untracked source archive, SHA-256 manifest and Git history bundle. No dependency tree is placed in the vault. Generated outputs, local screenshots and environment files are excluded from this change.

## Preserved release behavior

| Released fix | Integration and verification |
| --- | --- |
| `c91461b` root and recursive task status | Both callback paths retained; task-row fixture checks changes and failed saves. |
| `a7385c6` Info description | Eight rows and vertical resize asserted in project-info fixture. |
| `78310ce` initiative archive | Explicit PATCH with archived state asserted in initiative-links fixture. |
| `5a16cc4` initiative status | Editable shared status control; save and reload asserted. |
| `a1d2bfc` combined module toggle | One 28px icon/chevron control; separate detail and task launch behavior exercised. |
| `2d8b2c8` module collapse | Default collapsed and stored expansion retained and exercised across reloads. |
| `18fe12e` order and filters | Position adapters, first-write/midpoint persistence, multi-state selection and Hide done retained; filtered pointer reorder/reload, hidden-row preservation, mixed module/root persistence, failed-drop recovery and persisted filter checks. |
| `c3190a5` drag timing | Synchronous order refs and drag-start index retained; actual HTML5 pointer drop and reload exercised. |
| `403d18d` initiative links | UUID single-target writes, MCP list/readback, UUID unlink; project/module/task fixtures assert contracts and failures. |
| `69d77d7` Related Docs | Read/create/PATCH source-reference mapping, retained URI anchors and empty-PATCH rejection preserved. Failure/retry and anchor payload asserted. |
| `09820ca` creation docs | Task and subtask creation retain docs, placement and reset state; fixture verifies saved payload and reload. |

The release API adapter implementation is preserved; the adapter diff only corrects an outdated comment. Migration-era error/draft guards, cycle assignment batching and shared focus handling are retained in the UI integration. A new failure regression exposed unhandled rejected status saves in root/recursive rows; those callbacks now catch the rejection after the existing save-error notification, matching module rows. The regression passes.

## Approved UI scope

Shared Panda package, provider/portal boundaries, controls, dialogs/drawers and context/action menus; content-sized menus with an 8px icon/label gap. Measured fixture widths: task ~176px, project ~117px, Add ~105px. Legacy showcases are archived outside the active build graph, and old development bookmarks point to the shared gallery. Production still opens the ordinary application.

The multi-state filter keeps its release checkbox menu and stylesheet. A shared checkbox menu item has not been approved, so its multi-select behavior is preserved in the existing implementation. Other primitive decisions listed in the [Level 1 ledger](../packages/ui/LEVEL1-MIGRATION.md) remain open. This is a release of approved slices, not a claim of complete Level 1 migration.

## Verification and limits

All 15 application fixture scripts pass. Application fixtures intercept API/MCP writes, including Foundry promotion. Shared browser checks cover 15 cases; Foundry checks cover 10, including actual local library rebuild/refresh. Application fixtures cover create/edit/archive, task status/order/filter, projects, modules, initiatives, cycles, docs, narrow dialogs and failure/retry. Desktop task/menu screenshots were visually inspected. Commands and isolation details are in [fixture README](../tests/migration/README.md).

Shared package typecheck/build and production Vite build pass. Full-app TypeScript diagnostics retain nine existing mock/design-tool errors; this is not a clean full-app typecheck. The production build retains its large-chunk warning. Existing local dependencies were reused; clean local installation was blocked by the workspace dependency hook, so a clean hosted preview build remains a release gate.

No production records were mutated by verification. Backend limitations remain for cycle readback, cross-project moves and unsupported work-item fields. Existing Activity interaction and Foundry light-canvas limitations are documented in the migration ledger. Fixture checks do not establish unexercised production behavior.

## Release gates and rollback

Submit this isolated branch for the existing GitHub review workflow and Cloudflare Pages preview. Do not merge until the exact PR head has a successful clean hosted build and review requirements are satisfied. Dependency/build files trigger the repository's escalation policy; do not change or bypass that policy.

After merge, verify the Cloudflare check for the actual merge commit and perform a read-only hosted smoke check. Rollback should revert the integration commit through the normal reviewed release path; the previous release is `cee2078d39e7a998aca08586706aece6dc1c7216`. This integration contains no backend or schema migration. At preparation time, nothing has been deployed by this branch.
