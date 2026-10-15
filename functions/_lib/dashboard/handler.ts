// Shared request wrapper for the two endpoints: method check, Access verification, config, JSON out.

import { verifyAccess } from "./access.ts";
import { readConfig, type Config, type Env } from "./config.ts";
import { NotConfigured, SourceError, makeSources, type Sources } from "./sources.ts";

const HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" };

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });

export async function serve(
  request: Request,
  env: Env,
  run: (src: Sources, config: Config, email: string | null) => Promise<unknown>,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, { Allow: "GET" });
  const { config, missing } = readConfig(env);
  if (!config) return json({ error: "misconfigured", missing }, 500); // names only, never values
  const access = await verifyAccess(request, config, fetchFn);
  if (!access.ok) return json({ error: access.error }, access.status);
  const src = makeSources(
    config,
    { ops: env.DASHBOARD_OPS_BEARER, vault: env.DASHBOARD_VAULT_BEARER, github: env.DASHBOARD_GITHUB_TOKEN },
    fetchFn,
  );
  try {
    return json(await run(src, config, access.email));
  } catch (e) {
    if (e instanceof NotConfigured) return json({ error: "not_configured", secret: e.secret }, 503);
    if (e instanceof SourceError) return json({ error: e.code }, 502);
    return json({ error: "internal" }, 500);
  }
}
