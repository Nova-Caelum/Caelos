// POST /api/queue/complete {id}: Daniel marks one of his own queue rows done. This is the console's
// existing done path (REST PATCH as the console client, stamped completed_by = caelos-console), made
// reachable from the dashboard without the browser holding a token. Narrow on purpose: only an OPEN
// row assigned to daniel can be closed here, and the only change written is state = done.

import { verifyAccess } from "./dashboard/access.ts";
import { readConfig, type Env } from "./dashboard/config.ts";

const OPEN = new Set(["pending-review", "ready", "in-progress", "blocked"]);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" } });

export async function completeQueueRow(request: Request, env: Env & { CONSOLE_OPS_BEARER?: string }, fetchFn: typeof fetch = fetch): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const { config, missing } = readConfig(env);
  if (!config) return json({ error: "misconfigured", missing }, 500);
  const access = await verifyAccess(request, config, fetchFn);
  if (!access.ok) return json({ error: access.error }, access.status);
  if (!env.CONSOLE_OPS_BEARER) return json({ error: "not_configured", secret: "CONSOLE_OPS_BEARER" }, 503);

  let id: unknown;
  try {
    id = ((await request.json()) as { id?: unknown }).id;
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (typeof id !== "string" || !id || id.length > 300) return json({ error: "bad_request" }, 400);

  const call = (method: string, body?: unknown) =>
    fetchFn(`${config.opsUrl}/api/work-items/${encodeURIComponent(id as string)}`, {
      method,
      headers: { Authorization: `Bearer ${env.CONSOLE_OPS_BEARER}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });

  try {
    const got = await call("GET");
    if (got.status === 404) return json({ error: "row_not_found" }, 404);
    if (!got.ok) return json({ error: `ops_http_${got.status}` }, 502);
    const row = (await got.json()) as { assignee_agent?: string; state?: string };
    if (row.assignee_agent !== "daniel") return json({ error: "not_your_row" }, 403);
    if (row.state === "done") return json({ ok: true, id, state: "done", already_done: true });
    if (!OPEN.has(String(row.state))) return json({ error: "row_not_open", state: row.state }, 409);

    const patched = await call("PATCH", { state: "done" });
    if (!patched.ok) return json({ error: `ops_http_${patched.status}` }, 502);
    return json({ ok: true, id, state: "done", already_done: false });
  } catch {
    return json({ error: "ops_unreachable" }, 502);
  }
}
