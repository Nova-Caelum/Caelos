# Caelos UI migration map

2026-09-10: Level 1 source cutover covers the active Caelos product and Foundry administrative controls. Shared public components now own the formerly outstanding typography, separators, range/checkbox fields, progress/loading, Activity popover, sidebar resizing/state dots, notifications, links and full-bleed surfaces. See [LEVEL1-MIGRATION.md](LEVEL1-MIGRATION.md) for evidence and limits.

| Destination | Shared replacements |
| --- | --- |
| Create/edit/detail, Project Info, Team, cycles and linking/archive | Button, IconButton, Input, TextArea, Select, Dialog, Drawer, Text, Heading, Loading |
| Project/task/module panels | Card, Row, TaskRow, Progress, Badge, shared menus, typography |
| Sidebar/main shell | Surface, ResizeHandle, Row, Badge, ScrollArea |
| Activity | Popover family, ScrollArea, Loading, Text; read-only where no save adapter exists |
| Filters and actions | StatusSelect, ActionMenuCheckboxItem, ActionMenu, ContextMenu |
| Foundry administration | Range, Checkbox, Select, Input, Disclosure, Heading/Text, LinkButton, Dialog |
| Foundry Components | Actual shared exports and Composer; themed Surface supports light gallery canvas |
| Notifications | Shared Toaster, existing Sonner dispatch API |

Legacy visual authoring specimens still visualize editable seed values. Their swatches, size labels, texture previews and motion examples are intentional authoring data, not active alternative primitives. Product layout and the legacy seed/surface bridge remain host-owned. Archived showcase sources are outside the active build graph. Current `nc-composer-*` classes belong to the shared Composer and are retained.

Level 2 behavioral extraction is planned in [BEHAVIOR-ROADMAP.md](BEHAVIOR-ROADMAP.md). Whole-product light mode, backend feature completion, deployment and mandatory enforcement are outside this cutover claim.
