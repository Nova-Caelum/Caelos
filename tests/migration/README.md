# Application migration fixture checks

Run from the external code checkout, never the synced vault. Existing dependencies and Playwright Chromium are required; these scripts do not install anything.

Use the dedicated local preview with a dummy API and no token:

```sh
VITE_API_BASE_URL=http://127.0.0.1:5199 VITE_BEARER_TOKEN= ./node_modules/.bin/vite --host 127.0.0.1 --port 5194 --strictPort
MIGRATION_PREVIEW_URL=http://127.0.0.1:5194 node tests/migration/task-rows.mjs
MIGRATION_PREVIEW_URL='http://127.0.0.1:5194/?foundry=1' node tests/migration/foundry-admin.mjs
MIGRATION_PREVIEW_URL=http://127.0.0.1:5194 node tests/migration/showcase-routes.mjs
```

Each `.mjs` file is directly runnable. `MIGRATION_PREVIEW_URL` can override the local URL; for Foundry admin include `?foundry=1`. Do not point these tests at a production application. Scripts intercept API/MCP requests; Foundry admin also intercepts staging and promotion endpoints. The returned PR URL is fictitious and is never opened. No script creates a real PR or changes service data.

To check actual font downloads, opt in to requests only to Google Fonts in the Info or showcase fixture:

```sh
VERIFY_REMOTE_FONTS=1 node tests/migration/project-info.mjs
VERIFY_REMOTE_FONTS=1 MIGRATION_PREVIEW_URL=http://127.0.0.1:5194 node tests/migration/showcase-routes.mjs
```

Screenshots go to `/private/tmp/caelos-release-20260909/`. They include deliberate failures and pending legacy visuals; screenshots alone are not a complete visual sign-off. The ledger distinguishes verified UI contracts from missing backend integration. Initiative link UUID writes, MCP reads, document source references and reload are covered by fixtures. Cross-project moves, cycle readback and unsupported work-item fields still need suitable backend support/verification. These checks do not prove production persistence.

Shared checks remain separate:

```sh
PREVIEW_URL=http://127.0.0.1:5184 node packages/ui/tests/browser.mjs
FOUNDRY_URL=http://127.0.0.1:5194/?foundry=1 node packages/ui/tests/foundry.mjs
./node_modules/.bin/vite build
```

The Foundry shared suite performs a real local package rebuild and refresh. Do not run another package build concurrently. Other application fixtures must be finished before this refresh test. The app's full temporary TypeScript diagnostics retain pre-existing mock/design-tool errors; shared package typecheck is part of its build. There is no installed remote enforcement.

`completed-modules.mjs` covers Hide done across completed, mixed, empty, nested-module, and subtask cases, including reload and completing the last task. `project-initiative.mjs` rejects the retired `add_project` tool and models HTTP 200 MCP errors; it also verifies blank folder paths and independent same-name project creation. Use the production bundle for application regressions as documented in the release notes.
