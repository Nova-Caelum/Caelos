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
