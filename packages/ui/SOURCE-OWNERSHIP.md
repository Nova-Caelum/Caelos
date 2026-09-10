# Source ownership

Updated 2026-09-10.

- **Sole source:** `packages/ui` in the Nova-Caelum/Caelos repository: <https://github.com/Nova-Caelum/Caelos/tree/main/packages/ui>. Edit the library here and nowhere else.
- App dependency: the repository-local `packages/ui`, imported as `@nova-caelum/ui`. Cloudflare builds this self-contained copy; do not introduce machine-specific absolute imports/symlinks.
- Vault pointer: `AgentSecretBase/brand_library/UI_Primitives.md`.
- Workflow draft: `AgentSecretBase/inbox/Caelos_UI_Component_Workflow_Protoskill_2026-09-09.md` (documentation only, not installed).

## Retired standalone folder

The standalone `NovaCaelum-UI-Primitives` folder (`/Users/danieleghdami/NovaCaelum_code/NovaCaelum-UI-Primitives`) was retired on 2026-09-10. Its work, together with work from the Caelos-console checkout, was consolidated into this directory on branch `feat/complete-ui-primitives`. A read-only snapshot of all three pre-consolidation copies is at `/Users/danieleghdami/NovaCaelum_code/_snapshots/ui-standardize-2026-09-10/` (`standalone/`, `main-checkout/`, `live-worktree/`). Do not edit the retired folder or reinstate it as a second copy. No separate library repository is planned.

## No sync step

There is one copy, so no synchronization step exists. Library changes follow the normal Caelos flow: edit `packages/ui`, build and test from the repository root (see [README.md](README.md) and [VALIDATION.md](VALIDATION.md)), review the Foundry and affected application destinations, then commit and open a pull request.

`tools/check-sync.py` is kept as a legacy, read-only comparison tool from the two-copy period. It is not part of any workflow, and its result neither gates nor authorizes anything.

## Dependency hygiene

Never create `node_modules` inside `NovaCaelum_Obs`. Check resolved destination/workspace roots before any install. The execution harness is the Caelos repository root: `npm run build:ui`, `npm run typecheck:ui`, `npm run preview:ui` and `npm run test:ui` build, check, serve and test this package.
