# Project creation and completed modules — September 10, 2026

Based on production merge `4138929966ebfab6a14486eb3ac4e529fed2ef50` (PR #18).

The live MCP `tools/list` response confirms `add_project` is retired and `upsert_project` is the supported project creation/update operation. The UI now calls it for creation. New project codes combine the name slug with a UUID so same-name creation cannot overwrite an existing project through upsert. Existing project IDs and update behavior are unchanged. MCP `isError` responses now reject, including HTTP 200 validation failures; project creation retains the draft and displays the error.

Hide done now also hides completed modules, using the existing done/deferred/archived grouping. Completion is evaluated from all loaded tasks and descendants, independent of search or other state exclusions. Empty active modules and modules containing unfinished subtasks or child modules remain. Empty modules explicitly marked done are hidden. Turning Hide done off restores the rows. Hidden modules are excluded from drag anchors and position writes.

Verification: both regressions failed before their application fixes. The production Vite build and browser fixtures for project/initiative creation, module completion, task ordering, and task rows passed with intercepted API/MCP data and zero page errors. These cover optional folder paths, backend validation errors, draft retry, same-name protection, filter persistence, immediate completion, unfinished descendants, and hidden-row position preservation. The build retains the existing chunk-size warning. A development-only pointer-lock issue after initiative edit is already documented in the previous release; this flow passed against the production bundle. No live records were created or modified for verification.

Release through a follow-up PR and successful Cloudflare preview build before merge. No backend migration or dependency change.
