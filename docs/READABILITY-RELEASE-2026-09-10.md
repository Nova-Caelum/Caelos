# Task readability follow-up — September 10, 2026

Based directly on production commit `425ac4b657731ddc74c232ecb0e10dc449b4b34f` (PR #17). The September 9 integration and its earlier behavior fixes remain in place.

## Changes

- Expanded modules retain one dark card and border around their header and tasks.
- Shared task titles grow with wrapped text. Hover and keyboard focus add a stronger full-row highlight and brighter title text; completed tasks retain their strike-through.
- Sidebar project-name tooltips are removed. Task-state filtering uses the shared compact checkbox menu, retaining multiple selections, Hide done, and persisted visibility.
- Foundry offers independent project/module Current, Plain, Graph paper, and Glass previews. Choices are temporary, resettable, and excluded from staging/promotion. Production keeps the approved card surfaces.
- Keyboard fixtures wait for opening animations before dismissal and explicitly verify menu closure.

No API adapter, data model, dependency, build configuration, or workflow changes. No production database writes were made during verification.

## Verification

Shared UI code generation, TypeScript check, JavaScript/declaration build, CSS generation, and application Vite production build passed. Vite retains its existing large-chunk warning; this is not a claim of a clean full-app TypeScript check (the earlier release documents existing mock/design-tool diagnostics).

Read-only live-data checks at viewport widths 1600, 1200, 1000, 800, and 1600 verified 18 task rows each time: no text escaping its title, no title escaping its row, and no overlapping rows. Row height grew with wrapping and returned on resize. Computed styles and a screenshot confirmed stronger hover and equivalent keyboard focus without changing row height.

The task-row, task-ordering, module, and sidebar-navigation fixtures passed against the production bundle with intercepted API/MCP requests. Foundry admin checks passed against the development server with intercepted staging/promotion requests. Separate visual checks verified module containment and independent texture previews/reset.

An initial development-server run retained a pointer lock after the move dialog; the same flow passes against the built production bundle. The release fixtures use the production bundle for application behavior. Foundry remains a local development surface.

## Release

Use the existing PR review and Cloudflare Pages preview flow. Require successful hosted build on the exact PR head and required review before merge. After merge, verify its Cloudflare deployment and perform a read-only smoke check. Rollback is a reviewed revert; there is no backend migration.
