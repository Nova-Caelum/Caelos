# Caelos Foundry — the component foundry

**Launch:** double-click `Foundry.command` at the repository root. No agent session needed. It opens `http://127.0.0.1:5199/`; close its Terminal window to stop it. If it is already running, double-clicking just opens it.

The Foundry is a full-page browser for every primitive, variant and token in the Caelos design system, and a place to prototype with them. Source: `staging/foundry/`.

**Generated, not hand-authored.** Every recipe Panda emits carries `__name__` and `variantMap`. The Foundry reads those and nothing else, so a recipe or variant added to either package appears on screen with no Foundry edit — verified by adding a throwaway variant to `card` and watching it appear, then reverting it. Slot recipes are shown as an anatomy, each slot rendered on its own, because a slot recipe's layout depends on the real component's nesting and a flat render of its classes is misleading.

**Both tracks — the chat interface and the taskgraph interface.** The chat track is `staging/ui-react19` (`@nova-caelum/ui-react19`, React 19). The task-graph track is `packages/ui` (`@nova-caelum/ui`, React 18). The two are different React majors and cannot share a React root, so live specimens render from the chat package — which contains every task-graph recipe by name — while the task-graph package's recipe metadata is read separately and compared. Each recipe is labelled with the tracks it belongs to, and where the two definitions differ the difference is listed (`avatar` gains a `shape` axis in chat; `foundation`'s `surface` kind exists only in the task graph, where Surface had not yet become its own recipe).

**Sections:**

- **Components** — every recipe, grouped *shared* and *chat only*; each variant rendered; click any specimen for its provenance (recipe, variant values, generated classes, and every token it resolves, with current values). *See it on every surface* renders the selection on all five surface layers × paper, glass, plain and auto.
- **Tokens** — every custom property the package declares on its theme scope, read from the live stylesheet, resolved against the current theme, grouped (colour, glow, fill and gradient, typography, space, radius, elevation, motion), with the recipes that consume each.
- **Drafts** — compose from existing recipes and variants on any backdrop, and save. Drafts are JSON files in `foundry-drafts/` at the repository root: durable across restarts and committable.
- **Proposals** — the ✎ beside any recipe, axis, variant, slot or token name stages a rename to `foundry-proposals/names.json`. **Nothing is applied to source.** An agent reads that file and implements renames as a reviewed change.

**Live.** Each launch rebuilds both packages first. While the Foundry runs, editing either package's `src/` rebuilds it and reloads the page once the build finishes.

**Local only.** The draft and proposal endpoints accept requests from this machine only; any other origin is refused.

---

# Shared UI in the Foundry

The Foundry Components view renders `@nova-caelum/ui` and its compiled stylesheet. It uses local demonstration state; sending, permissions and voice controls do not call real services.

## Review and update

1. Run `npm run build:ui` once after installing dependencies.
2. Start the existing app with `npm run dev -- --host 127.0.0.1 --port 5183 --strictPort` and open `http://localhost:5183/?foundry=1`.
3. Edit the shared package source: `src/tokens.ts`, `src/recipes.ts`, `src/preset.ts`, the component files, or composer styles/behavior as appropriate.
4. Click **Rebuild library** in the Foundry. It builds the shared package, then reloads the preview only after every artifact is ready. Demo inputs reset on reload. A failed build displays an error and leaves details in the development server output.
5. Review the real controls, theme, material and motion preferences in the panel. Package changes reach each application consumer that imports the package after its next build.

The rebuild action is local development only. It accepts a fixed build command, rejects foreign origins, and prevents simultaneous builds. Generated package output is excluded from the development server watcher so intermediate files do not cause partial reloads. After a manual command-line package build, use the Foundry rebuild action or restart the app server to invalidate its module cache.

The legacy app tuning controls change the old seed system; they do not author the shared package. They are explicitly separated from Components. The previous save/promote workflow is not the shared library update mechanism. A hosted production Foundry receives changes through the normal application build and deployment.

## Files

- `src/app/FoundryPandaGallery.tsx`: compositions importing public package exports.
- `src/app/foundryPanda.css`: panel layout; shared portaled components own stacking and themed appearance.
- `src/app/Foundry.tsx`: shared administrative Card/controls/Dialog/Disclosure integration and legacy seed tuning separation.
- `vite-plugins/foundry-dev.ts`: local rebuild endpoint and complete-build refresh handling.

## Interaction reference

The conversation composer demonstrates the approved [Progressive Selector](INTERACTION-PATTERNS.md#progressive-selector). Use its state and acceptance contract when reviewing matching controls; the hover and click behavior is part of the design system, not a demo-only flourish.

The composer also demonstrates the [slash command autocomplete](INTERACTION-PATTERNS.md#slash-command-autocomplete). Type `/` for the sample command/skill catalog; names are the only row content, and hover or arrow navigation exposes a summary tooltip. Selection edits the local draft without invoking an agent. Installed catalogs are supplied by the host application.

Type `@` in the primary composer to tag one of three sample participants using the same name-only picker and summary tooltip. The secondary composer has an empty roster to demonstrate per-chat scope. The host supplies real participants via `Composer.agents`.

## Verification

With the local Foundry running, execute from the repository root:

```sh
node packages/ui/tests/foundry.mjs
```

`FOUNDRY_URL` can select another local port. `PLAYWRIGHT_MODULE` can select a shared Playwright runtime. Chromium must be installed. The suite performs a real package rebuild and reloads the demo; run it without another package build in progress.

Checks cover actual generated styles and typography, persistent permission/model/reasoning menus, portal stacking, reply selection and demo submission, light-mode materials and portal theme, tooltips, separation of legacy controls, endpoint request restrictions, a successful rebuild/reload, and browser runtime errors.

This integration does not replace the live application’s remaining legacy consumers. Track that work in [MIGRATION.md](MIGRATION.md).

## Application migration status

The administrative frame now uses shared Card, Row, Select, Input, Buttons, Dialog, Disclosure and ScrollArea. Existing save/promotion operations are preserved; migration tests intercept all such writes. The old lab/locked/primitives bookmarks open this shared collection in development. Archived source is outside the active graph.

Range/checkbox, typography, link/notification and full-bleed surface support are pending primitive decisions. **Known visual defect:** the light gallery still inherits a dark host canvas even though its controls and portals switch to light; this awaits the Surface decision. The broader application remains partially migrated. See [LEVEL1-MIGRATION.md](LEVEL1-MIGRATION.md).
