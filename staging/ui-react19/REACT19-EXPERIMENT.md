# React 19 template integration — validation report

Validated on 2026-09-18 in `caelos-chat-react19`, branch
`experiment/nova-ui-react19`. This is an independent experimental copy of
`Caelos-console/packages/ui`. The September 19 staging comparison now uses this React 19 candidate; see SOURCE-OWNERSHIP.md. This copy does not receive automatic updates; the initial setup below is historical. The chatbot's existing uncommitted
OpenRouter and artifact work is preserved.

## Initial compatibility result (2026-09-18)

The library builds and runs in the Next.js 16.2.10 host with React and React DOM
19.2.7 and React 19 declarations. `/ui-lab` imports the built workspace package
and its scoped Panda CSS. The supplied orbital loader v6 is integrated through
`NovaLoader`; its original source files remain beside the ESM adapter.

The initial compatibility experiment previewed the library at
http://127.0.0.1:3101/ui-lab. The subsequent full-template migration below now
applies the approved design to http://127.0.0.1:3101 as well.

## Compatibility changes

- Typed the select trigger's event props explicitly for React 19 `ReactElement`.
- Used boolean `inert` values in the composer to remove the observed React warning.
- Preserved `"use client"` in the built component entry by disabling tsup's extra
  Rollup tree-shaking pass; the Panda preset has a separate server-safe export.
- Exported `toast` from the same Sonner instance as the library's notification
  viewport so host/library version differences cannot swallow preview notifications.
- Updated the host document-preview ref to admit `null`, initialized its toolbar
  timeout ref, and replaced the React-18-typed outside-click hook with an effect
  retaining window `mousedown`, connected-target and containment checks.
- Added a loader fixture with pause, mount/unmount, multiple sizes and StrictMode.
  The adapter responds to system and provider reduced motion and destroys renderer
  resources on cleanup.

No type suppressions were added. These initial compatibility changes were local
to this copy. The approved composer was subsequently locked into the canonical
Panda library in a separate task; the template migration does not modify it.

## Tab and dropdown refinements

- Tabs use normal-case labels, a sliding selection highlight and a short panel
  fade. The highlight follows keyboard selection, wrapping and resizing; both
  system and provider reduced-motion settings disable animation.
- `Select` accepts `variant="field"` for a full-width boxed trigger and matching
  dropdown. A Workspace example appears in the form fixtures.
- The host's root overflow rule left a scrollbar gutter in place while Radix
  also compensated for it on the body. Opening a menu therefore narrowed the
  page, and selecting an option shifted it back. The UI lab now hides root
  overflow during the existing body scroll lock, preventing the double gutter.
  This was reproduced in the in-app browser and in Chromium with visible
  scrollbars enabled.

## Verification

All commands below passed from this worktree with the preview running:

```sh
corepack pnpm --filter @nova-caelum/ui build
corepack pnpm exec tsc --noEmit
git diff --check
PREVIEW_URL=http://127.0.0.1:3101/ui-lab node packages/ui/tests/browser.mjs
PREVIEW_URL=http://127.0.0.1:3101/ui-lab node packages/ui/tests/foundations.mjs
PREVIEW_URL=http://127.0.0.1:3101/ui-lab node packages/ui/tests/react19.mjs
PREVIEW_URL=http://127.0.0.1:3101/ui-lab node packages/ui/tests/tabs-dropdowns.mjs
```

- Composer suite: 32 checks passed covering menus, keyboard/focus, IME, draft
  behavior, command/agent pickers, touch, portals, scrolling, independent instances,
  light theme, reduced motion and narrow viewport bounds; zero page errors.
- Foundations: range/checkbox keyboard controls, progress, resize by pointer and
  keyboard, editable popover, Escape/focus restoration, notifications, light scope,
  narrow bounds and reduced motion passed; zero page errors.
- Tabs/dropdowns: selection preserves page width and scroll position at 1280px
  and 353px; focus return, Escape, field/menu alignment, sliding highlight,
  normal-case labels, keyboard navigation, wrapping, both reduced-motion settings
  and light-theme portal styling passed; zero page errors.
- React 19 suite: animated/static 32px and 64px loaders, explicit pause/resume,
  system/provider reduced motion, and three StrictMode client remount cycles passed.
  Instrumentation observes setup–cleanup–setup for every fresh client mount and
  verifies observer, event-listener and animation-frame counts return to baseline
  on unmount. Initial server hydration is not used as the effect-replay assertion.
- Desktop 1440px and narrow 390px light/dark screenshots were reviewed; no observed
  clipping or horizontal overflow. Additional composer tests cover 360px bounds.
- Chat route loaded and accepted a draft without React or page errors. No paid
  model request was submitted as part of this UI validation.
- Component output begins with `"use client"`; importing `@nova-caelum/ui/preset`
  in Node succeeds. The workspace package resolves to this isolated copy.
- At the initial compatibility checkpoint, all 39 production files matched the saved SHA-256 baseline.
  The original app's port 3100 `/ping` returned HTTP 200 and `pong`.

Screenshots are in `/private/tmp/caelos-react19/` (desktop/narrow light/dark,
loader detail and chat), `/private/tmp/caelos-level1-foundations/`, and
`/private/tmp/caelos-panda-verified.png`. These are local temporary QA artifacts.

## Composer context follow-up

Goal and Instruction now have controlled, removable pills inside the composer,
with exact saved text on hover or keyboard focus and an anchored click/tap editor.
The pills wrap above the controls on narrow screens. Sending includes optional
`goal` and `instruction` metadata and leaves their controlled state intact.
The Add menu suppresses its focus restoration when handing off to the editor;
outside dismissal preserves the clicked control's focus. Lucide Goal is the approved default
in both the Add menu and saved pill. Preview fixtures use the library default;
the temporary icon comparison controls have been removed. Existing installed
dependencies were reused.

`tests/composer-context.mjs` passed against port 3101: add/edit/save/cancel/remove,
exact multiline hover and keyboard text, editor focus after menu dismissal,
outside-click focus, touch editing, independent instances, draft preservation,
context persistence after sending, default Goal icons in the pill and menu, 353px/390px layouts,
and light-theme portal inheritance, with no page errors. The package build and
host TypeScript check passed, as did the complete `tests/browser.mjs` regression
suite after adapting its bottom-edge fixture to hide the icon comparison row.
Screenshots were visually inspected in
`/private/tmp/caelos-composer-context/`. At that checkpoint, all 39 recorded production-library file
hashes matched the pre-experiment baseline.

## Runtime and remaining scope

`../../scripts/local-dev.sh` uses port 3101, refuses port 3100, requires the
existing local PostgreSQL server and runs no migrations. Runtime settings were
copied into an ignored `.env.local` with mode 600. OpenRouter credentials are
injected from BWS in memory. No dependencies were installed in the Obsidian vault.

The workspace install and lockfile update succeeded from the outside-vault
worktree. The earlier vault-hook block was caused by a combined command that
mentioned the vault path; separating the path check from the package command
allowed the normal guard to validate the actual installation destination.

Existing host peer warnings remain: `next-themes@0.3.0` declares React through 18,
`next-auth@5.0.0-beta.25` declares Next 14/15, and `@vercel/otel@1.14.2` declares an
OpenTelemetry logs range below the installed 0.200.0. These packages were not
upgraded as part of the UI experiment. Panda's optional update check cannot write
its config store in the sandbox; code generation, compilation and CSS generation
still finish successfully.

The initial evidence covered Chromium development mode and local type/build checks.
The full-template follow-up below adds a Next production build and artifact-panel
interaction. Other browser engines and paid chat/tool inference remain unverified. The normal host `build`
script includes database migration and was deliberately not used. Resolve the
host peer ranges and run release checks before promoting the experiment.

`react-day-picker@8.10.1` belongs to the production application, not the shared
UI package; it is not required here. No production calendar was replaced.
Historical reports copied with the library are not evidence for this experiment;
this report records its current validation.


## Full-template integration (2026-09-19)

The approved styling now covers the chat shell, sidebar, message surfaces,
composer, menus, dialogs, form fields, tooltips, and artifact surfaces. Shared
Panda recipes are exposed through `@nova-caelum/ui/recipes` so the host retains
its own Radix context tree. Panda tokens bridge the host's semantic colors, and
bundled IBM Plex Sans, IBM Plex Mono, and Yrsa replace external font links.
Cascade order preserves host spacing utilities. Root scroll-lock compensation
now covers the entire template, including portaled menus and dialogs.

The host uses the shared Composer with real send/stop, models, reasoning,
attachments, and existing slash commands. Goal and Instruction use the approved
Lucide Goal icon, editable pills, exact hover/focus text, and mobile wrapping.
Context persists per user/chat in local storage; drafts use session storage.
Context is included in outgoing chat requests as user-priority content, and the
reasoning choice reaches the model adapter. Image additions follow model
capabilities. All approved composer controls remain visible, including dictation, reply format, live conversation, Agent, File or folder, and conversation permissions. Unconnected features explain their availability on activation and do not pretend to change backend behavior. The host reserves space for the approved below-composer popup dock.

The composer fills the chat column; a discovered auto-margin shrink was fixed in
this local package. System theme and reduced-motion changes update both provider
and portal scopes live. Attachment removal remains visible on touch layouts and
keyboard focus, and artifact icon buttons have accessible names.

Validation is recorded in `../../LOCAL_SETUP.md`. Browser coverage includes
mocked sending and stop state, exact request context, message rendering, chat
isolation and persistence, stable dropdown coordinates, dialog spacing, narrow
353px/390px layouts, theme changes, live reduced motion, artifact opening/closing,
and sign-in form layout. The production build runs directly through Next to
avoid the upstream build script's database migration step.

Paid inference, live Blob uploads, other browser engines, and deployment are not
part of this UI validation. The code remains local; nothing was pushed or deployed.
