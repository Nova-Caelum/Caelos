# Level 1 migration ledger — 2026-09-09

**Status: approved slices integrated for release review; full Level 1 remains incomplete pending primitive decisions.** The September 9 lab record below describes the original migration. See [release integration](../../docs/RELEASE-INTEGRATION-2026-09-09.md) for the current branch, preserved production fixes, verification and deployment status.

## Workspace and evidence

Checkout: `/Users/danieleghdami/NovaCaelum_code/Caelos-console`; origin `https://github.com/Nova-Caelum/Caelos.git`; branch `lab/primitives-review-2026-09-06`. Pre-existing modifications were preserved. Source snapshots and hashes are in `/private/tmp/caelos-level1-20260909/baseline-source/` and `baseline-hashes.json`.

Preview 5193 belongs to this checkout and uses a dummy API at 5199 with no bearer token. Application tests intercept service traffic; mutating tests do not contact the real backend. Existing previews 5182/5183 and atlas 5181 were preserved. Test artifacts stay under `/private/tmp/caelos-level1-20260909/`, outside the vault.

## Destination ledger

| Destination / old implementation | Approved replacement | Preserved behavior / evidence | Status |
| --- | --- | --- | --- |
| Project Info / NcInput, NcTextarea, buttons | Input, TextArea, Select, Button, PersonChip | Name/status save and reload, clean disabled, failed draft/retry, labels, Manage Team navigation; `project-info.mjs` | Fixture verified; typography pending |
| Task and module create/detail / local overlays and fields | Dialog, Drawer, shared fields, Select, Buttons, ScrollArea | Validation, hydration, save failure/retry, narrow bounds, focus return, Escape; `task-create`, `task-detail`, `module` | Fixture verified; typography/progress pending |
| Inline title, related documents, heavy task fields | Input, Card, IconButton, SharedTaskRow | Title Escape edits without dismissing drawer; rejected draft retained; unsupported-only save rejects; Related Docs maps to source references; failed hydration cannot clear description/criteria; `task-detail-guards` | Fixture verified; source-reference anchors preserved |
| Task rows, toolbar and quick subtask | TaskRow, Badge, StatusSelect, Input, ScrollArea | Status/assignee reload, filtering, subtask draft/retry, drag reorder, move/archive failure/retry, portal events do not open detail; `task-rows` | Fixture verified |
| Module header / raw card buttons | Card, Row, IconButton, Button, ContextMenu | Expand/collapse, module task launcher, keyboard context menu, preserved placement; `task-rows` | Fixture verified; progress pending |
| Sidebar project/module navigation | ScrollArea, Row, Input, IconButton, ContextMenu | Search, persisted group expansion, project/module selection, context dismissal; `sidebar-navigation` | Fixture verified; task/initiative dots and resize pending |
| Project / initiative create and edit | Dialog, shared fields and buttons | Validation, drafts, error/retry, reload and focus; `project-initiative` | Fixture verified |
| Team and cycle screens | UserCard, Card, ScrollArea, Dialog, shared controls | Team session operations; cycle create/edit/archive failure/retry; `team-cycles` | Fixture verified; Team remains session-local |
| Cycle assignment / picker | Dialog, Row, ScrollArea, create controls | Failed creation/assignment retain draft; retry reuses created cycle; module assignment batches descendants; `cycle-assignment` | Fixture verified; readback limitation below |
| Initiative linking / document controls | Dialog, Row, Card, Input, Button | Three link pickers, unlink error/retry, narrow/focus, document draft/retry/reload; `initiative-links` | UUID writes, MCP reads and fixture reload verified |
| Archive browser / Settings menu | ActionMenu, Dialog, Row, Badge, Button | Closed/completed remain read-only; restore failure/retry/reload; `archive-browser` | Fixture verified |
| Foundry administrative frame | Card, Row, Select, Input, Buttons, Dialog, Disclosure, ScrollArea | Target selection, collapse persistence/focus/inert, staging failure/retry, promotion busy/dismiss/retry, token disclosure; `foundry-admin` | Fixture verified; all administrative writes intercepted |
| Foundry Components / old showcases | Actual shared package and Composer | Shared browser checks, Foundry rebuild/reload, five old bookmark aliases; `showcase-routes` | Shared gallery sole active showcase; canvas defect below |
| Old component definitions and styles | Archival reference outside active graph | No active src/primitives import; app build; old route modules absent from browser requests | Retired; remaining styling enumerated below |

Script names without extensions refer to `tests/migration/<name>.mjs`.

## Primitive decisions

Approved and implemented: minimal **Dialog/Drawer and ContextMenu**, using approved Card/menu treatment and installed Radix dependencies. Approval does not extend to the following open requests:

| Pending request | Existing capability / precise gap | Smallest proposed addition |
| --- | --- | --- |
| Popover | Activity is an anchored editable panel; menus cannot host this form and Card lacks anchoring/dismissal/focus | Installed Radix Popover with approved Card treatment |
| Range and Checkbox | Foundry tuning needs numeric ranges and a native boolean field; existing Input/Select do not supply those contracts | Shared native controls preserving ranges, steps and values |
| Heading, Text, Separator | Product headings/body roles and dividers still use host typography/rules; no corresponding public exports | Expose the existing approved typography and rule treatment |
| Progress and Loading | Module progress bars and pending indicators; no approved public equivalent | Accessible determinate progress and static Loading text, no custom spinner |
| ResizeHandle and dot Badge | Sidebar stored width 200–480 and compact state markers; Badge currently always encloses text | Shared keyboard/pointer resizing and dot-only Badge variant |
| LinkButton and Toaster | Foundry normal anchor semantics and application notification lifecycle | Approved button recipe rendered as anchor; installed Sonner wrapped with shared treatment |
| Surface | Sidebar/main canvas are full-bleed regions; Card is a rounded bounded panel and Provider has no background surface | Minimal shared theme surface with existing placement/dimensions |

Dependent items remain in their existing implementation. No local substitute was introduced. Foundry tuning specimens intentionally visualize the authored legacy seed data; they are not alternative approved component designs. Their remaining control treatment is still pending.

## Known visual and integration limits

- **Foundry light canvas defect:** the gallery switches its shared text/materials to light, but its host background still uses dark `--sys-ground`. Light text is hard to read. The existing Foundry test checked light Card and portal behavior, not canvas contrast. Visual review found this; remediation is dependent on the Surface request. Whole-product light mode is not implemented or claimed.
- Typography still includes legacy page titles/body styling, and the original main/sidebar canvas remains. Final cross-screen typography and visual sign-off cannot precede their primitive decisions.
- Activity's legacy portal/outside-click handling can dismiss while interacting with its form. Its Popover migration is pending; no claim that Activity is verified.
- Work-item PATCH does not support `blocked_by` or `priority`. Related Docs now uses the release adapter mapping from `doc_paths` to `source_references`, preserving anchors for retained URIs. Unsupported-only updates now reject rather than falsely succeed; mixed supported/unsupported payload behavior remains an adapter limitation. No claim of real persistence for those fields.
- Cycle assignment now uses the adapter's dedicated operation, with module descendants batched to the server's 1–500 item limit. The read adapter still returns null cycle IDs/zero counts, so real assignment readback remains unverified.
- Initiative links retain the current release adapter: UUID-keyed single-target writes, MCP reads and UUID unlink. Fixture tests assert these contracts and reload; authenticated backend mutation tests were not run.
- Team roster is session-local. Cross-project task moves require backend verification; fixtures cover module reassignment only. Module cross-project move remains unavailable as before.
- Application type diagnostics retain 9 pre-existing errors in mock data and design tooling. The source baseline had 12; a handler prop collision, invalid initiative default, and Foundry cleanup return type were repaired during migration. Shared package typecheck passes.
- Production build has an existing chunk-size warning. No production service or hosted infrastructure was changed.

## Verification record

Baseline: shared typecheck, application build, and all 15 existing shared browser checks passed. Baseline full-app diagnostics were captured separately.

Final verification for the currently authorized slices: all 14 application fixture scripts passed; all 15 shared browser checks passed; all 10 Foundry integration checks passed, including package rebuild/reload. Shared typecheck and final application build passed. Full-app TypeScript retains the 9 pre-existing diagnostics described above. `git diff --check` passed after removing an extra stylesheet EOF blank line. Project Info was rechecked with downloaded fonts and a top-of-scroll label-boundary assertion. These results do not close the pending primitive or backend gaps.

Visual evidence includes desktop and 768px task rows, Project Info, sidebar, project/cycle/initiative flows, 390px move/archive/create/detail/promotion dialogs, title draft focus, and Foundry admin. The latest module header, narrow promotion, and desktop/narrow Project Info were visually reviewed after migration. Project Info screenshots explicitly start at the top of its scrollable pane; the previous partial Name label was caused by retained scroll position after test interactions. Early fixture images blocked remote fonts. An opt-in font-only network check successfully downloaded IBM Plex Sans, IBM Plex Mono and Yrsa; offline fixture checks still block external traffic by default.

See `tests/migration/README.md` for commands and isolation limits. Checks are executable coverage, not automated enforcement or proof of unexercised workflows.

## Retired code

`docs/archive/legacy-ui/` preserves historical local sources (trailing blank lines normalized) for DesignLab 1/2/3, LockedStudio, PrimitivesReview, PrimitiveGallery, the old demonstration-only ChatComposer, and `src/primitives`. Historical relative imports are intentionally not runnable. Old bookmarks now load the shared Foundry Components view in development; production continues to load the ordinary app.

Removed active NcInput/NcTextarea/NcSelect/button/StateBadge helpers and the unused CyclesNavButton. Removed confirmed-unused matte, ghost, glass-pill/menu, old search, shelf, kbd, grid utility, and locked primitive CSS. The before-cleanup stylesheet is archived as text, outside the build graph. `nc-input` remains for Activity and the preserved multi-state filter; `nc-glass-menu` was restored for that filter pending approval of a shared checkbox menu item; `nc-nav-active` remains for initiative navigation. Legacy token/seed bridge and guarded global rules remain while dependent consumers exist. Current package `nc-composer-*` styling is retained.

See [LEVEL2-OPPORTUNITIES.md](LEVEL2-OPPORTUNITIES.md) for deferred product refinements.

## Approved menu sizing refinement

User requested content-sized right-click/action menus and closely grouped, left-aligned icons and labels. The shared action menu recipe now uses intrinsic width with a viewport cap and an 8px icon gap; selection-menu indicators keep their existing layout. ContextMenu, composable ActionMenu, and the convenience ActionMenu use this recipe. Application fixture measurements were approximately 176px for task actions, 117px for project actions, and 105px for Add. All three screenshots were visually checked. The task-row interaction fixture, 15 shared browser checks, shared build/typecheck, application build, and diff check passed. Evidence: `compact-menu-task.png`, `compact-menu-project.png`, and `compact-menu-add.png` under the existing temporary evidence directory. This approval is specific to menu sizing; other primitive gates remain pending.
