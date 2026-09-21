# Level 1 migration — final source cutover

Updated 2026-09-10. Scope: active Caelos product UI and Foundry administrative controls, preserving the live-sync baseline and recent application fixes. This is local work on `feat/complete-ui-primitives`; no commit, PR, merge or deployment is claimed.

## Outstanding families now migrated

| Family | Shared implementation | Active destinations / behavior |
| --- | --- | --- |
| Anchored content | Popover family with themed Card | Activity load-on-open, UUID task scope, loading/error/retry, Escape/focus and viewport bounds |
| Tuning controls | Range, Checkbox | Foundry controlled values, min/max/step, native keyboard behavior |
| Typography/rules | Heading, Text, Separator | Product page/body/metadata, project shell, dialogs, Foundry administrative labels/dividers |
| Progress/pending | Progress, Loading | Task/module totals and pending states; determinate accessible progress, static loading |
| Sidebar | ResizeHandle, Row, dot Badge | Width bounds 200–480, pointer/keyboard resizing with persisted host width, selection/navigation |
| Notifications/links | Toaster, LinkButton | Existing toast lifecycle, theme boundary and ordinary anchor navigation |
| Full-bleed canvas | Surface | Main/sidebar regions and Foundry gallery; existing placement and seed texture bridge retained |

Previously migrated buttons, fields, Card, TaskRow, menus (including multi-state checkbox filtering), overlays, tabs, scrolling, identities and Composer remain in use. Module cards enclose expanded tasks; long task titles retain auto-height rows; stronger task hover and removal of sidebar project tooltips remain preserved. Initiative navigation uses Row's native onClick contract. No active product consumer depends on the retired input/menu helpers.

## Verification

See [VALIDATION.md](VALIDATION.md) for the dated check record, commands and limitations. Package typecheck and production build pass. The 15-check shared browser suite passes, including portaled light theme, reduced motion, tooltip typography/material, Composer behavior and narrow/bottom-edge positioning. Foundation checks cover range/checkbox keyboard use, progress, pointer/keyboard resize, editable popover/focus, toast, light surfaces and narrow layout. Application fixtures cover the affected workflows; all network writes are intercepted.

Raw-control/typography scans of App and ProjectViewLayeredShell show no remaining product button/input/textarea/select/heading/progress implementations. Foundry's raw visual values are limited to intentional seed-authoring specimens. This inventory is scoped to active application imports, not unused generated/demo dependencies elsewhere in the repository.

## Honest limits

- Fresh dependency installation and frozen-lockfile verification could not run because the environment's vault-hygiene hook rejected package-manager commands even in the external checkout. Existing installed tools built and tested the source. Lockfile consistency checks are structural, not a substitute for a clean installation.
- Full application TypeScript retains nine pre-existing mock-data/design-tooling diagnostics; shared package TypeScript passes. Production build retains the existing large-chunk warning.
- Activity has no working note-save adapter at its task/module destinations. No-op save callbacks were removed, and the UI explicitly shows read-only instead of discarding drafts. The shared Activity composition still supports an actual async callback. Project/module activity uses the existing approximate project rollup; exact entity-scoped backend retrieval is not implemented.
- Work-item PATCH priority/blocked_by support, cycle assignment readback (null IDs/zero counts), session-local Team roster and authenticated cross-project moves remain pre-existing backend/integration limits. Fixture success is not proof of live backend mutations.
- Shared/light gallery behavior is checked; whole-product light mode is not claimed. Legacy seed tuning and layout are retained intentionally.
- This work installs no skill, merge-blocking CI, remote repository or published package. The planned independent repository was dropped on 2026-09-10: `packages/ui` is the sole source and uses the Caelos root harness (see [SOURCE-OWNERSHIP.md](SOURCE-OWNERSHIP.md)).

The earlier ledger is retained in [history](history/LEVEL1-before-final-cutover.md). Its pending-gate statements are historical. Future behavior work is in [BEHAVIOR-ROADMAP.md](BEHAVIOR-ROADMAP.md); component availability is in [COMPONENTS.md](COMPONENTS.md).
