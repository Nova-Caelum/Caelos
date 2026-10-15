# Dashboard data layer and ops proxy: deploy notes

**Daniel reviewed:** no

Pages Functions on the console origin (`functions/`). Deploying = merging to the branch Cloudflare Pages builds
(`main` of the repo the `caelos-console` project is connected to). Secrets are set on the Pages project, not in the repo.

## Endpoints

| Route | What | Auth |
|---|---|---|
| `GET /api/dashboard` | One JSON, one section per panel. Contract: `docs/dashboard/dashboard.contract.json` | Cloudflare Access JWT, verified in the function |
| `GET /api/queue` | Open Task Graph rows assigned to daniel, full description | same |
| `/ops/api/*`, `POST /ops/mcp` | Same-origin proxy to the ops server; the SPA no longer holds any token | same |

The production alias `caelos-console.pages.dev` is not behind Access. The functions verify the Access token themselves
(signature, `aud`, `iss`, `exp`), so that alias answers 401 instead of serving data.

## Pages secrets (names only; values come from Bitwarden Secrets, entered by Daniel)

| Pages secret | BWS entry | Notes |
|---|---|---|
| `CF_ACCESS_AUD` | not a secret; Zero Trust > Access > Applications > console > Application Audience (AUD) Tag | required, functions fail closed (500) without it |
| `CONSOLE_OPS_BEARER` | `FRONTEND_DANIEL_BEARER` (new value) | must be a key of client_id `frontend-daniel` so the console keeps its write door and `completed_by: caelos-console` |
| `DASHBOARD_OPS_BEARER` | `DASHBOARD_OPS_BEARER` (new) | read-only ops key: `allowed_tools` = `list_work_items`, `get_work_item`, `search_worklog` |
| `DASHBOARD_VAULT_BEARER` | `novacaelum_vault_ro_bearer` (exists) | vault MCP read-only tier; write is refused by the server |
| `DASHBOARD_GITHUB_TOKEN` | `DASHBOARD_GITHUB_RO` (new) | fine-grained PAT, org Nova-Caelum, all repos, read-only: Metadata, Pull requests, Contents, Checks, Commit statuses, Actions |

Optional: `DASHBOARD_ALLOWED_EMAILS` (comma list), `CF_ACCESS_TEAM_DOMAIN` (default `novacaelum.cloudflareaccess.com`).
A missing source secret makes only that panel `unavailable`; a missing `CF_ACCESS_AUD` makes everything 500.

Set all five in one go (values piped from BWS, never printed; entries not yet created are skipped and named):

```sh
bash ~/NovaCaelum_code/caelos-staging-dashboard/scripts/set-pages-secrets.sh <AUD tag>
```

Or one at a time:

```sh
bws secret list | jq -r '.[]|select(.key=="NAME_IN_BWS").value' | npx wrangler pages secret put PAGES_SECRET_NAME --project-name caelos-console
```

## Order

1. Mint the new keys (admin): `POST /keys` for `frontend-daniel` (unrestricted, as today) and for `dashboard-ro` with the `allowed_tools` above. Daniel records both values in BWS.
2. Run the script above. The Access login redirect for console.novacaelum.com carries `kid=5bf487b0a75e5164030e6d367b888b7173344dd0a52f518e2bb253ba348c5dc1`, which should be the AUD tag; confirm it in the Zero Trust dashboard (unverified).
3. Merge the PR; Pages builds and deploys. The build fails if a credential could reach the client bundle (`npm run check:client-secrets -- --require-dist`).
4. Verify on console.novacaelum.com: the task graph loads, and the response of `GET /api/dashboard` is 200 JSON.
5. Delete `VITE_BEARER_TOKEN` and `VITE_API_BASE_URL` from the Pages project (Settings > Environment variables, Production and Preview): the leaked value was injected into the build from there, and the repo no longer reads either. Then revoke the OLD `frontend-daniel` key (the one that was in the public bundle) by hash. `DELETE /keys/frontend-daniel` revokes every active key of that client, including the new one, so use SQL on `api_keys` instead: `update api_keys set active=false, revoked_at=now() where key_hash='<sha256 of the old value>'`.
6. Put `caelos-console.pages.dev` behind Access or disable the alias.

## Local

`npm run test:dashboard` (31 tests, no network). `npx wrangler pages dev dist --binding CF_ACCESS_AUD=x` serves the functions locally.
