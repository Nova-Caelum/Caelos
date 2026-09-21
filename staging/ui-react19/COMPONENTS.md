# Nova Caelum UI primitives — component catalog

Updated 2026-09-10. These are implemented public exports, not proposed designs. Import from `@nova-caelum/ui` and load `@nova-caelum/ui/styles.css` once. See [README](README.md) for fonts, provider setup and the locked design contract. Source interfaces are authoritative for exact props.

## Choose by purpose

| Purpose | Public building blocks | Contract and ownership |
| --- | --- | --- |
| Theme | `CaelosProvider`, `useCaelosTheme`, `themeAttributes`, `approvedTokens` | Provider scopes dark/light, glass and reduced motion; portals retain those attributes. |
| Actions | `Button`, `IconButton`, `LinkButton` | Primary/tonal/text, sm/md, danger. IconButton needs `label` and `icon`. LinkButton preserves native anchor navigation. Application owns action and pending state. |
| Bounded panels | `Card` | Flat/lifted/glass. A visual panel; use Dialog/Drawer for modal behavior. |
| Full-bleed regions | `Surface` | `layer`: ground/chrome/elevated/elevated-2/top; `texture`: auto/plain/graph/glass. Default `auto` uses graph paper for ground/chrome and glass for raised layers, with the corresponding elevation shadow. `as`: div/main/aside/section. Host owns placement and dimensions. |
| Typography | `Heading`, `Text` | Heading semantic h1–h6 independent of display/page/section/title size. Text span/p/div, body/small/label/mono. Both support default/muted/dim/accent tone. |
| Rules and status | `Separator`, `Progress`, `Loading` | Horizontal/vertical separator, decorative by default. Progress requires label/value, optional max and clamps invalid bounds. Loading is a quiet polite status; no custom spinner. |
| Inline activity | `RippleLoader` | User-approved 2026-09-19 as the small inline activity mark beside 12–13px text (file rows, background jobs, subagents); this later decision supersedes "no custom spinner" for that use only. 3×3 cells rippling corner to corner, 1.5s. Inherits text colour (dawn cream on Caelos text). Props: `size` (12 default), `gap`, `label`, `paused`. Reduced motion or paused holds a still diagonal. `NovaLoader` stays the large expressive loader. |
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
| Activity | `ActivityChain`, `ActivityStep`, `ActivityStepKind` | 01, approved 2026-09-20 (option A + Iter 3.5). Operational summary rows and the step chain: status mark and chevron beside the label, count summary only at 3+ steps, check when complete and `RippleLoader` while live. The icon glossary is enforced by `kind`: thinking→Zap, action→Flame, tool→Wrench, agent→Bot. Controlled `open`/`openStepId` with internal fallback. `codeSurface` names the tier a `code` detail sits on — one above its holder. |
| Conversation body | `ConversationColumn`, `ConversationMessage`, `MessageProse`, `MessageActions`, `ArrivingText` | 02, approved 2026-09-20. Inline agent name floated beside unboxed indented text; 24px between turns; 15/1.75 prose. A DIFFERENT layout from `AgentMessage`, which keeps its circular avatar and 12px byline and is unchanged. `ArrivingText` splits on clause boundaries; the provider owns reduced motion. |
| User messages | `UserMessage` | 03, approved 2026-09-20 (option A). Composer-matched fill: the composer's own `--il-fill` and `--il-focus`, one hairline edge, the diffusion behind the content. Controlled `value`/`editing`; host owns the draft. Editing focus is carried by the bubble's own edge (`--nc-focus`), never by an outline rectangle inside the surface, and the editor's padding is zeroed so the editing text sits exactly where the reading text sat (round 1 correction, 2026-09-20). |
| Artifacts | `ArtifactPreview`, `ArtifactWorkspace`, `WorkspacePanel`, `WorkspaceToolPill`, `WorkspaceToolButton`, `WorkspaceEditor` | 04 and 05, approved 2026-09-20 (option B, "Strip and paper", glass-to-paper blend). One glass card, a strip, and a plain paper plane fading in over 30px. Preview caps at a reading window and fades only real overrun; `fit="content"` lets an interactive body grow. The panel is non-modal: no scrim, no border, no cast shadow, outside clicks do not dismiss, ground dissolves over 36px. `WorkspacePanel frame` decides only WHERE it sits: `"overlay"` (default) is the approved Atlas specimen — fixed, right-anchored, `min(100vw, 850px)`, portalled; `"slot"` positions nothing and fills the box its host gives it, so an application can lay the conversation column and the panel out side by side and the panel never covers its opener. Material, dissolve, Escape, non-modality and focus return are identical in both. Pass `codeSurface="top"` to an `ActivityChain` inside either. `placement="panel"` insets the card 18px from the panel's trailing edge (15px inline); in a panel that padding is the only cushion between the card and the edge the panel is anchored to, because the leading side already carries the 36px dissolve (round 1 correction, 2026-09-20). The strip's panel toggle is the host's to pass: use Lucide `PanelRight` (right-hand panels) or `PanelLeft` (left-hand), labelled "Toggle right side panel" / "Toggle left side panel", for BOTH the open and the close state — one generic mark per side, never the directional `PanelRightClose` / `PanelLeftOpen` family (approved mapping, 2026-09-20). |
| Alerts | `Alert`, `AlertStage` | 06 and 07, locked 2026-09-20 (Iter 4 option A). One anatomy, `material` (tonal \| glass) × `tone` drawn from the existing `-tint / -line / -glow / -on-tint` sets, plus `edge` and `glow`. The system's neutral hairline always owns the edge. Approved members: permission = tonal/progress/system/glow; question = glass/none. `AlertStage` carries the composer's measure and the size container. |
| Files | `FileCard`, `RetryButton` | 08, approved 2026-09-20 (option A, two-line). Name first, type and size below. The failed state is the danger token set complete, with an 18px glow; `RetryButton` rests on the danger tint's glow and lifts to the danger set's hover ink, line and 18px glow. |
| Sources | `InlineSource` | 09, direction A. A quiet chip inside the sentence; name and URL on hover or focus. |
| Orientation and recovery | `UnreadDivider`, `CompactError`, `JumpToLatest` | 10, **UNCONFIRMED** — direction A was recorded in Iter 2 but the same note asked for changes the specimen does not implement. Unread divider, compact error on the danger token set, and a glass jump control. |
| Conversation header | `ConversationHeader`, `ContextRing`, `ConversationParticipant` | Approved 2026-09-20 (Atlas 2) — Daniel: "The header is flawless." One identity: a Yrsa 21/24/500 title that truncates at rest and completes on hover, an asymmetric avatar composite that holds a fixed 88x76 field from one to six participants, and a click that separates the roster. Footprint 420x112 at rest, 468x142 pinned, in both shapes. One spring (stiffness 280 / damping 34 / mass 1) drives surface, roster and reserved space together; the 260ms disclosure is a separate clock. Avatar buttons are live only once pinned. Controlled `pinned` / `activeParticipant` with internal fallback. **Requires `motion` as a peer.** |
| Agent detail | `AgentDetailCard`, `AgentPermissionOption`, `AgentSubagent`, `AgentBackgroundProcess` | Approved 2026-09-20 (Atlas 2, "profile" layout; the older "triage" layout is deliberately not packaged). 376px, two planes joined by a 30px material fade rather than a rule. Agent INFORMATION only — permission is a setting here, prompts belong to a later fleet interface. Status reads icon → word (Tooltip) → detail (popover); the bot mark appears only with subagents; context uses the 80 / 90 thresholds and a dashed track for unknown telemetry; model and reasoning reuse the composer's own `ComposerChoice`. Work rows are closed by default and anything in progress shows through beneath the closed header with a 12px `RippleLoader`. The two planes are 21px apart, owned solely by the session plane's own inset: the fade begins at the join (round 1 correction, 2026-09-20). |
| Linked work | `LinkedWorkTrigger`, `LinkedWorkLinks`, `LinkedWorkDivider` | Approved 2026-09-20 (Atlas 2). The trigger and the preview SHELL only: the preview anchors to the nearest `[data-nc-conversation-card]` through a virtual Radix anchor tracked every frame, `side="bottom" align="start" sideOffset={0}`, collision avoidance off with a measured `alignOffset`, `updatePositionStrategy="always"`, 260ms enter against a 130ms exit, resizable 340-760px. The body is `children`: the Atlas's Task Graph content stays in the Atlas. |
| Working files | `WorkingFilesList`, `WorkingFileDrawerBody`, `FileCode`, `FileMoveForm`, `WorkingFile`, `WorkingFileView` | Approved 2026-09-20 (Atlas 2). Name / disclosure / dead-zone / diff row at 36px, with the context menu (File viewer, External app, Copy pathname, Move file) returning focus to the row it came from. The list never opens a panel: `onOpenFile(file, view, trigger)` is the drawer hook and the host renders its own `Drawer`. `WorkingFileDrawerBody` carries `data-agent-file-layer`, which is what stops the header treating the panel as an outside click. |
| Agent messages | `AgentMessage`, `AgentIdentity` | Open, indented content with a circular shared Avatar and agent name. Host supplies stable `agent.id`, `name`, optional `avatarSrc`, `continued`, and `responding`. Completed continuations omit repeated identity; active messages show identity with the shared activity loader. No message panel or backend orchestration. |

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

## Single-copy requirement for the Radix primitives (2026-09-20)

Every Radix package this library uses is an exact-pinned `dependency`, so a normal install gives a
consumer one copy of each and they share one `@radix-ui/react-dismissable-layer`. **A bundler alias
that redirects one of them — and not the others — breaks that, and the failure is silent.**

Radix tracks open overlays in a module-level layer registry. Two copies of that module means two
registries that cannot see each other, so closing a layer owned by copy A reads as an outside
interaction to a layer owned by copy B and dismisses it. The visible symptom is a surface that opens
and vanishes in the same frame, with **no console error**. `Composer`'s `+` menu -> Goal / Session
instruction is the one flow in this library that crosses from a `DropdownMenu` into a `Popover`, so
it is the first thing to break and the canary worth testing. Observed 2026-09-20 in Design Atlas 2,
whose Vite config aliased `@radix-ui/react-popover` to a second checkout while
`@radix-ui/react-dropdown-menu` resolved normally.

**If you must alias a Radix package, alias it to the same install tree the others resolve from.**
Check before shipping a host:

```bash
# every entry must resolve into the SAME install tree (pnpm: the same .pnpm store)
ls -la <host>/node_modules/@radix-ui/ | grep -E 'popover|dropdown-menu|dismissable-layer'
```

and exercise the canary: open the composer's `+` menu, choose **Goal**, and confirm the editor stays
open and focused. It takes ten seconds and it is the only cheap test for this whole class.

Use layout-only host rules for widths, gaps, grid placement and responsive wrapping. Component materials, typography, states and motion belong to shared recipes. A matching color does not substitute for a shared behavior contract.

## Examples and verification

- [Preview](preview/main.tsx): actual package components and Composer; [foundations](preview/Foundations.tsx): typography, surfaces, native inputs, progress, popover and resize examples.
- Caelos Foundry Components imports the same built package. Legacy app tuning shows seed-authoring specimens; those specimens are not a second public library.
- [Browser acceptance](tests/browser.mjs), [foundation checks](tests/foundations.mjs), [host integration checks](tests/foundry.mjs).
- [Interaction contract](INTERACTION-PATTERNS.md), [planned behavior components](BEHAVIOR-ROADMAP.md), [migration scope](LEVEL1-MIGRATION.md), [source ownership](SOURCE-OWNERSHIP.md).

`ProgressiveSelector`, `InlineEditor`, `AsyncSubmission`, and `FilterGroup` are not public exports. Their status and prerequisites are documented in the roadmap. Do not import invented APIs.

## Spacing relationships (approved September 19)

`FieldGroup`, `SectionStack`, `Section`, `InlineCluster`, `ActionRow`, `ResponsiveGrid`, `Inset`, `Stack`, and `SpacingDensity` are exported. Start with Default; the optional provider supports `compact | default | comfortable`. [Usage and values](../../docs/design/SPACING-RELATIONSHIPS.md). Source: `src/spacing.tsx`, recipe: `src/spacing-recipe.ts`.
