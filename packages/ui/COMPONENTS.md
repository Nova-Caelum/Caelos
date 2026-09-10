# Nova Caelum UI primitives — component catalog

Updated 2026-09-10. These are implemented public exports, not proposed designs. Import from `@nova-caelum/ui` and load `@nova-caelum/ui/styles.css` once. See [README](README.md) for fonts, provider setup and the locked design contract. Source interfaces are authoritative for exact props.

## Choose by purpose

| Purpose | Public building blocks | Contract and ownership |
| --- | --- | --- |
| Theme | `CaelosProvider`, `useCaelosTheme`, `themeAttributes`, `approvedTokens` | Provider scopes dark/light, glass and reduced motion; portals retain those attributes. |
| Actions | `Button`, `IconButton`, `LinkButton` | Primary/tonal/text, sm/md, danger. IconButton needs `label` and `icon`. LinkButton preserves native anchor navigation. Application owns action and pending state. |
| Bounded panels | `Card` | Flat/lifted/glass. A visual panel; use Dialog/Drawer for modal behavior. |
| Full-bleed regions | `Surface` | `layer`: ground/chrome/elevated; `texture`: plain/graph/glass; `as`: div/main/aside/section. Host owns placement and dimensions. |
| Typography | `Heading`, `Text` | Heading semantic h1–h6 independent of display/page/section/title size. Text span/p/div, body/small/label/mono. Both support default/muted/dim/accent tone. |
| Rules and status | `Separator`, `Progress`, `Loading` | Horizontal/vertical separator, decorative by default. Progress requires label/value, optional max and clamps invalid bounds. Loading is a quiet polite status; no custom spinner. |
| Text entry | `Input`, `TextArea` | Native field attributes, refs, labels/help/error/disabled state; text/search Input. Application owns value and validation. |
| Native choices | `Range`, `Checkbox` | Native controlled/default props, min/max/step and keyboard behavior. Supply visible associated label or accessible name. |
| Informational marks | `Badge` | Label badge or `variant="dot"`, semantic tone. Dot cannot be the sole accessible status label. |
| Interactive chips | `Chip` | Button semantics and selection treatment; use Badge for noninteractive information. |
| Single choices | `Select`, `SelectMenu`, `StatusSelect`, `STATUS_OPTIONS` | Select supports form-trigger attributes; SelectMenu is a button-triggered choice menu. StatusSelect uses product-supplied enum/options. Demo defaults must not remap persisted values. |
| Actions / multi-choice menus | `ActionMenu`, `ActionMenuRoot`, `ActionMenuTrigger`, `ActionMenuContent`, `ActionMenuItem`, `ActionMenuCheckboxItem`, `ActionMenuSeparator` | Convenience or composable form. Checkbox items preserve multi-selection. Intrinsic action menu width and 8px icon gap. |
| Context actions | `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuSeparator` | Right-click, Context Menu key, Shift+F10; pointer placement, dismissal and focus. Trigger supports asChild. |
| Anchored content | `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverClose` | Editable content and information anchored to trigger. Controlled open optional, collision-aware themed portal. Supply content accessible name; business writes stay in host. |
| Modal content | `Dialog`, `Drawer` | Controlled open/onOpenChange/title; description/actions/bodyLabel; initialFocusRef/returnFocusRef and nested Escape handling. Drafts and accepted saves remain host-owned. |
| Hints | `Tooltip` | Accessible label, optional detail/path variant. Avoid repeating visible labels or reintroducing removed sidebar project tooltips. |
| Navigation / rows | `Row`, `RowGroup`, `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbSeparator` | Row is a button with decorative slots: no nested buttons; use onClick, not a custom onSelect callback. RowGroup is layout, not selection semantics. |
| Tabs | `Tabs`, `TabsRoot`, `TabsList`, `TabsTrigger`, `TabsContent` | Controlled value/onValueChange; compound exports allow separate list/panel ancestors. Host owns route synchronization. |
| Expandable content | `Disclosure` | Shared expansion and chevron motion; closed content inert, child state retained, reduced motion supported. |
| Task presentation | `TaskRow` | Auto-height title, controls wrap when space is constrained, independent status/actions/metadata/owner; onOpen for main activation. Drag/drop and persistence belong to application. |
| Identity | `Avatar`, `PersonChip`, `UserCard` | Initials/image fallback; identity, remove action and user/agent presentation. Host supplies records/actions. |
| Viewports | `ScrollArea` | Named keyboard-scrollable viewport, quiet thumb and larger hit target. Host controls bounds. |
| Pane sizing | `ResizeHandle` | Vertical separator controls left pane width; value/min/max/step/label/onValueChange. Pointer capture, arrows, Home/End. Host persists width. |
| Notifications | `Toaster` | Shared themed Sonner host. Mount once under provider; existing Sonner toast API owns notifications. Loading uses static ellipsis. |
| Conversation | `Composer`, `PermissionControl`, `PermissionsIcon` | Controlled draft/model/reasoning/reply options and callbacks. Does not implement model calls, recording, authorization or storage. Never clear a draft before acceptance. |

Public prop types are exported alongside components from [src/index.ts](src/index.ts). Detailed implementations: [components](src/components.tsx), [overlays](src/overlays.tsx), [foundations](src/foundation.tsx), [composer](src/Composer.tsx), [theme](src/theme.tsx).

## Minimal composition

```tsx
import { CaelosProvider, Surface, Card, Heading, Text, Progress } from '@nova-caelum/ui';
import '@nova-caelum/ui/styles.css';

<CaelosProvider theme="dark">
  <Surface as="main" layer="ground" texture="graph">
    <Card variant="glass">
      <Heading as="h1" size="page">Project</Heading>
      <Text as="p" tone="muted">Three of eight tasks completed</Text>
      <Progress label="Project completion" value={3} max={8} />
    </Card>
  </Surface>
</CaelosProvider>
```

Use layout-only host rules for widths, gaps, grid placement and responsive wrapping. Component materials, typography, states and motion belong to shared recipes. A matching color does not substitute for a shared behavior contract.

## Examples and verification

- [Preview](preview/main.tsx): actual package components and Composer; [foundations](preview/Foundations.tsx): typography, surfaces, native inputs, progress, popover and resize examples.
- Caelos Foundry Components imports the same built package. Legacy app tuning shows seed-authoring specimens; those specimens are not a second public library.
- [Browser acceptance](tests/browser.mjs), [foundation checks](tests/foundations.mjs), [host integration checks](tests/foundry.mjs).
- [Interaction contract](INTERACTION-PATTERNS.md), [planned behavior components](BEHAVIOR-ROADMAP.md), [migration scope](LEVEL1-MIGRATION.md), [source ownership](SOURCE-OWNERSHIP.md).

`ProgressiveSelector`, `InlineEditor`, `AsyncSubmission`, and `FilterGroup` are not public exports. Their status and prerequisites are documented in the roadmap. Do not import invented APIs.
