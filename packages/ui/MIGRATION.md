# Caelos UI migration map

**Status: partial application cutover; Level 1 is not complete.** New UI uses the public `@nova-caelum/ui` package. The detailed destination inventory, verification evidence, and unresolved gates are in [LEVEL1-MIGRATION.md](LEVEL1-MIGRATION.md).

## Implemented local cutover

| Family | Current shared consumer |
| --- | --- |
| Buttons and fields | App create/edit/detail, Project Info, Team, cycle, linking/archive and Foundry administrative operations |
| Cards, rows and navigation | Project shells, task/module rows, project/module sidebar navigation, cycle cards, archive/link pickers |
| Dialogs and drawers | Task/module create/detail, project/initiative/cycle/member creation and editing, move/archive/link dialogs, Foundry promotion |
| Menus | StatusSelect, shared action menus, approved pointer/keyboard ContextMenu |
| Tabs and scrolling | Project sections, task pane, sidebar, picker and detail viewports |
| Composer | Actual shared Composer in Foundry; local demonstration only, no live chat workflow was removed |
| Showcases | Shared Foundry Components is the sole active collection; retired lab URLs resolve there in development |

Historical implementations were moved to `docs/archive/legacy-ui/` and removed from active imports. The shared package remains a private local workspace package; it is not assumed published.

## Remaining consumers

Activity's anchored form; Foundry range/checkbox and remaining tuning control treatment; page/body typography and separators; progress/loading; sidebar compact state dots and resize handle; notifications and anchor CTA; full-bleed surfaces. These depend on explicit primitive requests recorded in the ledger. Foundry's light gallery has a known dark-canvas mismatch awaiting Surface approval.

## Completion requirements

1. Preserve handlers, state, placement, semantics and error recovery at every destination.
2. Review appearance in the real application, including focus, overlays, narrow layouts, supported themes and reduced motion.
3. Remove definitions/styles only after their final consumer has migrated.
4. Keep historical references archival; do not offer legacy designs as active choices.
5. Run relevant build/type/browser/application checks and distinguish backend limitations from fixture evidence.

A passing Foundry gallery is not application completion. Current `nc-composer-*` package classes are legitimate and must not be deleted by a prefix sweep. Documentation and tests are not remote enforcement.
