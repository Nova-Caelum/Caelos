# TME-71 — Console "Failed to save: not_found" on Done

**Daniel reviewed:** no
**Row:** `task-management-elevation:console-done-not-found` (TME-71) · **Author:** engineer · **Date:** 2026-10-18
**Evidence base:** Caelos `origin/main` = `81b8bb5` (the deployed commit). Line numbers below are that commit's, unless marked "after fix".

## Answer

The Pages `/ops` proxy refuses the request before it reaches the ops server. Its route allow-list, `ALLOWED` in `functions/_lib/ops-proxy.ts:10`, has no `:` in its path-character class, but every conventional external_id is `<project-code>:<slug>` and the console puts the id raw in the path. The proxy answers `404 {"error":"not_found"}`; the ops server never sees the request. It is not the verifier-only done door, not the row, and not the acceptance-criteria ref shape.

## The failing request

```
PATCH https://console.novacaelum.com/ops/api/work-items/market-context-dashboard:mcd-review-round2
Content-Type: application/json
{"state":"done"}
```

Answered `404 {"error":"not_found"}`, zero upstream calls (see Reproduction).

## Causal chain, click to toast

| # | Link | Where |
|---|---|---|
| 1 | Daniel sets Done in the state control | `src/app/App.tsx:2940` (`onSaveState`) and `:3015` (`onSaveTaskState`) → `saveTask(id, { state })` |
| 2 | `saveTask` PATCHes the work item | `App.tsx:2717-2719`: `api("/work-items/${id}", { method: "PATCH", body: {"state":"done"} })`; `id` is the row's `external_id` (`adaptWorkItemRead`, `App.tsx:308`) |
| 3 | `api()` builds the REST call; the id is not encoded | `App.tsx:697` (`wiMatch`), `:721` (`patchBody.state`), `:764` `restFetch(\`/api/work-items/${external_id}\`, patchBody)`. Compare `:685` and `:747`, which do `encodeURIComponent(...)` and so were never affected |
| 4 | Sent same-origin to the proxy | `App.tsx:215` (`API_BASE = "/ops"` in production), `:464` `fetch(\`${API_BASE}${backendPath}\`)`. A raw `:` stays raw in a URL path (RFC 3986 `pchar`; WHATWG `URL.pathname` does not encode it) |
| 5 | Pages routes `/ops/*` to the proxy | `functions/ops/[[path]].ts:4-5` → `proxyToOps` (`ops-proxy.ts:15`) |
| 6 | **The lookup that returns not_found** | `ops-proxy.ts:24-25`: `rest = "api/work-items/market-context-dashboard:mcd-review-round2"`; `ALLOWED = /^(api\/[A-Za-z0-9._~%\-\/]*|mcp)$/` (`:10`) does not match because of the `:`; line 25 returns `deny(404, "not_found")` |
| 7 | Body to toast | `restFetch` throws `apiErrorFromResponse` (`App.tsx:472`) → `reasonFromBody` takes `parsed.error` verbatim (`failures.tsx:42`) → `ApiError.reason = "not_found"` → `saveTask` catch `App.tsx:2723` `reportFailure("Failed to save", …)` → toast "Failed to save — not_found" |

### Why the layer is certain

- The bare string `not_found` is emitted in exactly one place in the console code (`ops-proxy.ts:25`; `queue-complete.ts:39` says `row_not_found`). The ops server never emits it: `grep -rn not_found ops-server/*.py` finds only a test name. Its own miss is `work_item not found: <external_id>` (`_rest_single_external_id`, `main.py:6902-6920`), which the toast would have shown in full.
- Server route the request was meant to reach: `PATCH /api/work-items/{external_id}` → `rest_patch_work_item` (`ops-server/main.py:7268`). It accepts the console identity (`GRAPH_MACHINE_CONSOLE_CLIENT_ID`, default `frontend-daniel`, `:7275-7279`), looks the row up by `external_id` (`_rest_single_external_id`, `:6902`), and stamps `completed_by = "caelos-console"` on a done result (`:7438-7443`). The "verifier is the only door to done" rule (0.9.15) exempts this console door by design; `test_rest_facade.py:933-940` proves a console PATCH to `done` stamps `caelos-console`.

## Bisect (why it worked on 2026-10-15 and broke after)

- CLS-7 (`caelos-launch-…:ink-indigo-commits-home`) and MKT-23 (`company-marketing-efforts:brand-root-vs-locked-copy`) were set done by the console at 2026-10-15T20:37:08Z and 20:36:51Z, `completed_by = caelos-console`. Both have colon external_ids. The live bundle then was pre-proxy.
- `4476b41^` has no `functions/` directory: the browser called the ops server directly with a client bearer, so no path allow-list existed. `4476b41` (#1, same-origin proxy, committed 2026-10-15 11:31 -0400) introduced `ALLOWED` and moved `API_BASE` to `/ops` (`git diff 4476b41^ 4476b41 -- src/app/App.tsx`). The request path in `App.tsx` was not changed by #1; only the host, the bearer and the new gate in between.
- `git log --oneline 4476b41^..81b8bb5 -- functions/_lib/ops-proxy.ts src/app/App.tsx` → `77390f7`, `4476b41`; `git diff 4476b41 81b8bb5 -- functions/_lib/ops-proxy.ts` is empty, so the allow-list is the same at `4476b41` and `81b8bb5`.
- Pages deployed 81b8bb5 about 2026-10-15T23:12Z; the failures were seen 2026-10-18.

## Reproduction (no production data touched)

Probe against the real handler with a fake upstream (`proxyToOps`, `tests/dashboard/fixtures.mjs`):

```
pathname: /ops/api/work-items/market-context-dashboard:mcd-review-round2
404 {"error":"not_found"}   upstream calls: 0
pathname: /ops/api/work-items/market-context-dashboard%3Amcd-review-round2
200 …                       upstream calls: 1     (encoded id: passes — why detail reads at App.tsx:685 worked)
pathname: /ops/api/work-items/MCD-6
200 …                       upstream calls: 2     (short id: passes)
```

Regression test: `tests/dashboard/proxy.test.mjs`, "WHOLE-PATH: the console's done-flip reaches the ops server…". RED: `{"error":"not_found"}` 404 for `graph-machine-testbed:console-test-b`. GREEN after the fix. With the fix reverted it is RED again.

## Fix

`functions/_lib/ops-proxy.ts`: add `:` to the `ALLOWED` character class (`[A-Za-z0-9._~%:\-\/]`). It is the narrowest change at the layer that is wrong: the class was meant to restrict routes (`api/*`, `mcp`) but also restricted identifier characters, narrower than the alphabet external_ids use. `..`/`.` traversal rejection is unchanged. The path is appended after `${config.opsUrl}/`, so a colon in a later segment cannot alter the host. Extra tests: a short id and an already-encoded id still forward byte-for-byte; a colon opens no route outside `api/*` and `mcp`.

## Blast radius

Not only Done. `App.tsx:764` is the single PATCH door for every work-item write, so on 2026-10-15 23:12Z onward **every console work-item save** for a namespaced row (rename, reassign, state, reorder `position`, move) and the archive/delete path (`:704-707`) returned the same `not_found`. Initiative PATCH (`:881`, `:892`) sends its id raw too and is covered by the same fix. Unaffected: the dashboard queue drawer (`queue-complete.ts` encodes the id and calls the ops server directly) and drawer detail reads (`:685`, `:747`, encoded). Short-ID and non-namespaced ids were never affected. The market-context-dashboard rows MCD-5/6/7 were not special; the "ref-shape difference" in the original report is unrelated.

## Residual risk and the verification owed after deploy

- The fix lands in a Pages Function; it takes effect only after Pages deploys it (CTO).
- After the proxy admits the request, the ops server still requires the proxy's bearer to belong to client `frontend-daniel` (`rest_patch_work_item` returns 403 "direct work-item writes are restricted to the console" otherwise). `docs/dashboard/DEPLOY.md:24` states `CONSOLE_OPS_BEARER` must be such a key; I could not read the secret and did not verify it. If the identity were wrong the failure would read as that 403 message, not `not_found`.
- Live check for the row's second criterion (use a testbed row, never a real one): in the console set a `graph-machine-testbed` row to Done; expect the row `done`, `completed_by = caelos-console`. TME-71's second criterion names MCD-6, which is already `done`; CTO repairs it.
- Not fixed, noted: the toast for a bare `not_found` carries no next step (`failures.tsx` `NEXT_STEPS` matches "not found" with a space, not `not_found`), and nothing says which layer refused. Separate, small.
