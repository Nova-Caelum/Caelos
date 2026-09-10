# Caelos UI

The shared implementation of Caelos’ approved September 2026 design system. New UI imports `@nova-caelum/ui`. The approved atlas is design evidence; this package is the component implementation.

## Run and use

From the repository root:

```sh
npm install
npm run build:ui
npm run preview:ui
```

Preview: http://localhost:5182. It imports the built package, not the atlas source. Rebuild after changing package source. `npm run build` builds the package before the existing app. `npm run typecheck:ui` checks public TypeScript components. With the preview running, `npm run test:ui` runs the browser acceptance suite (install Chromium with `npx playwright install chromium` once). `PREVIEW_URL` overrides the test URL; `PLAYWRIGHT_MODULE` optionally selects a shared Playwright runtime.

```tsx
import { CaelosProvider, Button, Input, Card } from '@nova-caelum/ui'
import '@nova-caelum/ui/styles.css'

export function ProjectForm() {
  return (
    <CaelosProvider theme="dark">
      <Card variant="glass">
        <Input label="Project name" placeholder="A new direction" />
        <Button variant="primary">Create project</Button>
      </Card>
    </CaelosProvider>
  )
}
```

Load IBM Plex Sans (including Medium 500), IBM Plex Mono, and Yrsa once in the application. Fonts are not downloaded by the component runtime. The preview includes font loading; the app should keep its established font assets. Only import the stylesheet once. Wrap the app in `CaelosProvider`; portal menus and tooltips inherit its theme, glass preference, and reduced-motion settings.

## Foundry

The application Foundry now imports this package directly. Its Components view includes a local **Rebuild library** action. See [FOUNDRY.md](FOUNDRY.md) for the edit → build → review workflow and integration checks.

## Components

| Family | Exports | Notes |
| --- | --- | --- |
| Actions | Button, IconButton | Primary, tonal, text; semantic danger; icon controls require an accessible label. |
| Materials | Card | Flat, lifted, glass. |
| Inputs | Input, TextArea | Text/search variants; labels, descriptions, invalid/disabled states; large fields resize vertically. |
| Selection | Chip, Badge, StatusSelect | Chip is an action; Badge is information. Status selector uses a chevron without a redundant dot. |
| Navigation | Row, RowGroup, Tabs, TabsRoot/List/Trigger/Content, Breadcrumb, BreadcrumbItem, BreadcrumbSeparator | Tonal pill tabs; soft selection; breadcrumb path tooltip is opt-in. |
| People & agents | Avatar, PersonChip, UserCard | Shared identity recipes; initials/image fallback, removable person chips, user or agent cards with application-owned actions. |
| Task structure | TaskRow | Status-colored indicator, dimmed/struck-through done title, owner tooltip. |
| Overlays | Tooltip, SelectMenu, ActionMenu, Select, Dialog, Drawer, ContextMenu | Keyboard navigation, Escape, focus restoration, collision handling. |
| Scrolling | ScrollArea | Quiet rounded thumb, wider invisible interaction area, keyboard scrolling. |
| Conversation | Composer, PermissionControl, PermissionsIcon | Controlled composer and key permissions token; settings and reply choices remain independent. |
| System | CaelosProvider, useCaelosTheme, approvedTokens | Theme scope, material and motion preferences. |

The source types document supported props. Avoid speculative prop aliases. `Row` renders a button; its leading/trailing slots are decorative. Use sibling action controls or `TaskRow` when a row needs independent controls—never nest buttons. `RowGroup` is a simple layout container, not an ARIA selection widget; use `Tabs` for tab semantics.

## Required interaction patterns

[INTERACTION-PATTERNS.md](INTERACTION-PATTERNS.md) defines the **Progressive Selector**: selected icon at rest → icon choices on hover → icons and labels on click. This is the required pattern for matching compact, reversible settings. The composer output-mode control is the approved reference; reuse it through the shared package, not copied application code.

## Composer integration

The application owns the draft, model, reasoning, reply format, live-conversation state, and all effects. Supply `value/onValueChange`, `model/models/onModelChange`, `reasoning/reasoningLevels/onReasoningChange`, `replyFormat/onReplyFormatChange`, and `onSend`.

`onSend` receives `{ text, model, reasoning, replyFormat }`. The package never clears a draft automatically; clear after the application accepts submission. Enter sends; Shift+Enter adds a line; IME composition does not send. Writing grows from one to eight lines, then scrolls. Controls retain their positions as the writing area grows.

Optional `onAdd`, `onDictate`, and `onLiveChange` expose the approved actions. Add offers file/folder, agent, goal, and session instruction. These callbacks do not install tools, start recording, change permissions, or invoke a model. Implement those effects in the application. `disabled` prevents writing/submitting and audio actions; settings can still be inspected/adjusted.

Use `context` for reversible pending context, and `header`/`footer` for surrounding content. Place `PermissionControl` and the agent profile in the conversation header during ordinary chat; the launch surface may use the composer header slot. Attachment management and agent-profile content are application compositions.

Model/reasoning and reply pickers prefer below the composer; near the lower viewport edge they flip above while their trigger stays still. Add and permissions menus prefer above. Compact hover views can be pinned by click; labeled selectors support keyboard use. Tooltips describe unlabeled controls, without repeating text already visible in expanded choices.

## Locked design contract

- Ordinary UI: IBM Plex Sans 500, 13px / 19.5px, .019em tracking and .055em extra word spacing. Yrsa headings and Plex Mono identifiers retain their roles; the primary button retains its approved 650 / 10.5px treatment.
- Glass panels/menus: dark base transparency 76%, blur 19px, violet tint 14%; light 24%, 2px, 23%. Transparency describes the base fill, not the combined tint layer. Text remains opaque.
- Sage tooltips: 20% transparency, 10px blur, cream text in dark mode, uniform 1px edge, 11px corners, 10px × 13px padding. No top-only inset stripe.
- Scrollbars: atmospheric violet at 15% for rest and hover, 24% while dragging; light uses structural violet. Visible thumb 6px inside a 22px interaction track, fully rounded, minimum 28px height. No hover glow/expansion.
- Freestanding tabs reuse tonal selection, without glass. Selected cream lettering and soft backgrounds provide hierarchy.
- Motion: stable controls, quick decelerating emergence, reduced-motion support. No custom loading animation.

`src/tokens.ts` stores the approved palette/typography values. `src/recipes.ts` contains Panda recipes and slot recipes. `src/preset.ts` scopes materials and theme variables, including portaled components. `src/composer-styles.ts` contains the extracted approved composer styles as Panda global rules; `composer-internal.jsx` retains its interactive behavior behind the typed `Composer.tsx` API. Generated code lives in ignored `styled-system/`; output goes to ignored `dist/`. Do not edit generated output.

The optional `@nova-caelum/ui/preset` export lets another Panda application share these recipes/tokens. Consumers of the React package only need its compiled CSS and React exports. Avoid generating a second copy of the same CSS in an application that already imports `styles.css`.

## Scope and migration

This release implements the approved primitive and composer scope. It does **not** mean every live application component has been replaced. See [MIGRATION.md](MIGRATION.md) for the explicit cutover map. Foundry composer callbacks remain demonstration-only; this migration does not create a live chat capability. Remaining application consumers and integration limits are listed in the Level 1 ledger. Whole-product light mode needs review in its real contexts. React 18 is the verified runtime for this release.

Approved evidence is recorded in [DESIGN-REFERENCES.md](DESIGN-REFERENCES.md).

`Disclosure` wraps expandable content with the approved 380 ms gentle acceleration, a rotating chevron, and reduced-motion support. Closed content is inert; child state is preserved. Foundry demonstrates it in People & agents.

## Host style boundary

`data-caelos-theme` marks package-owned styling, both on the provider subtree and on portaled menu/tooltip roots. Legacy application rules for focus, scrollbars, popup shadows, and popup motion must exclude both the themed element itself and its descendants using `:not(:where([data-caelos-theme], [data-caelos-theme] *))`. Do not add host-wide Radix overrides or patch the package with legacy `nc-glass-*` classes. Change approved appearances in the package source.

Every new package portal must carry `themeAttributes(settings)`. Verify integrations in the actual host application: focus after dismissing a menu, opening/closing motion, popup shadows, scrollbars, and reduced motion. A standalone preview cannot catch host stylesheet conflicts. Remove obsolete legacy rules as their last consumers are migrated.

## Controlled product compositions

`Dialog` and `Drawer` use controlled `open/onOpenChange`, `title`, optional `description`, `actions`, and a scrolling body. `bodyLabel` names that scroll region. Use `initialFocusRef` for a specific field and `returnFocusRef` when a menu launcher opens the overlay. Otherwise focus starts at the first editable field and returns to the previously focused element when it still exists. Keep asynchronous saves and drafts in the application; close only after success. Both overlays carry the provider theme into their portal and use the shared Card glass material.

`ContextMenu`, `ContextMenuTrigger` (`asChild`), `ContextMenuContent`, `ContextMenuItem`, and `ContextMenuSeparator` preserve pointer-positioned and keyboard contextual actions. Button-triggered compositions use `ActionMenuRoot/Trigger/Content/Item/Separator`. Use these exports instead of legacy host menu wrappers.

`TaskRow` accepts native div attributes/ref, `leading`, `afterTitle`, `metadata`, `actions`, and `trailing` slots. Use independent controls in these slots; `onOpen` handles the title and noninteractive row body. Events from portaled menus cannot open the row. `onStatusChange` is optional: omitting it renders the saved status as a Badge. Supply the product's complete `options` enum rather than mapping persisted values to the demonstration defaults. Drag/drop remains application-owned; attach its handle ref in `trailing`.

`TabsRoot/List/Trigger/Content` preserve layouts where the tab list and panel have different ancestors. The higher-level `Tabs` is suitable when its composition matches the destination. `Select` forwards trigger attributes/ref, supports `name/required/disabled`, and associates its `label` with the trigger; set `showLabel` for a visible form label.

`Dialog`/`Drawer` expose `onEscapeKeyDown` for nested editors that must consume Escape before the overlay dismisses. Prevent the event only while that editor owns the keystroke; retain ordinary Escape dismissal otherwise. `ContextMenuTrigger` supports the Context Menu key and Shift+F10 in addition to pointer invocation. Shared menus use their own portal theme/stacking, with no host z-index override.

`Disclosure` is also used by Foundry's token ledger. `Row` is already a button: expand controls, add actions and drag handles must be siblings or independent TaskRow slots, never nested buttons.

ActionMenu and ContextMenu size to their longest item, bounded by the viewport. Icons and labels form a left-aligned group with an 8px gap. Use the shared action recipe rather than setting fixed menu widths in consumers; selection menus retain their trailing indicator layout.
