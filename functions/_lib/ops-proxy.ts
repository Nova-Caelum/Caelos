// Same-origin proxy: console (browser) -> /ops/* -> ops server. The ops bearer lives here as a Pages
// secret (CONSOLE_OPS_BEARER) and is attached server-side; the browser never holds it. Access is
// verified on every call because the production alias caelos-console.pages.dev is not behind Access.

import { verifyAccess } from "./dashboard/access.ts";
import { readConfig, type Env } from "./dashboard/config.ts";

const METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);
// Only what the console uses: the REST facade and the MCP endpoint. Never /keys, /deploy, /admin, ...
const ALLOWED = /^(api\/[A-Za-z0-9._~%\-\/]*|mcp)$/;

const deny = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });

export async function proxyToOps(request: Request, env: Env & { CONSOLE_OPS_BEARER?: string }, fetchFn: typeof fetch = fetch): Promise<Response> {
  if (!METHODS.has(request.method)) return deny(405, "method_not_allowed");
  const { config, missing } = readConfig(env);
  if (!config) return deny(500, `misconfigured:${missing.join(",")}`);
  const access = await verifyAccess(request, config, fetchFn);
  if (!access.ok) return deny(access.status, access.error);
  if (!env.CONSOLE_OPS_BEARER) return deny(503, "not_configured:CONSOLE_OPS_BEARER");

  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/ops\/?/, "");
  if (rest.split("/").some((seg) => seg === ".." || seg === ".") || !ALLOWED.test(rest)) return deny(404, "not_found");
  if (rest === "mcp" && request.method !== "POST") return deny(405, "method_not_allowed");

  const headers = new Headers({ Authorization: `Bearer ${env.CONSOLE_OPS_BEARER}` });
  for (const h of ["content-type", "accept"]) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  const hasBody = request.method === "POST" || request.method === "PATCH";
  let upstream: Response;
  try {
    upstream = await fetchFn(`${config.opsUrl}/${rest}${url.search}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    return deny(502, "ops_unreachable");
  }
  const out = new Headers({ "Cache-Control": "private, no-store" });
  const ct = upstream.headers.get("content-type");
  if (ct) out.set("Content-Type", ct);
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
