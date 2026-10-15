// Server-side clients for the three sources. Errors carry a short code only: exception text can echo
// request details, so it is never put in a response.

import type { Config } from "./config.ts";

export class SourceError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "SourceError";
  }
}

export class NotConfigured extends Error {
  secret: string;
  constructor(secret: string) {
    super(secret);
    this.secret = secret;
    this.name = "NotConfigured";
  }
}

const TIMEOUT_MS = 8000;

function unwrapRpc(raw: string): any {
  let text = raw.trimStart();
  if (!text.startsWith("{")) {
    const lines = raw.split("\n").filter((l) => l.startsWith("data:"));
    if (!lines.length) throw new SourceError("bad_response");
    text = lines[lines.length - 1].slice(5).trim();
  }
  return JSON.parse(text);
}

async function rpcToolCall(
  url: string,
  bearer: string,
  name: string,
  args: Record<string, unknown>,
  fetchFn: typeof fetch,
  who: string,
): Promise<any> {
  let res: Response;
  try {
    res = await fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new SourceError(`${who}_unreachable`);
  }
  if (res.status === 401 || res.status === 403) throw new SourceError(`${who}_denied`);
  if (!res.ok) throw new SourceError(`${who}_http_${res.status}`);
  let payload: any;
  try {
    payload = unwrapRpc(await res.text());
  } catch {
    throw new SourceError(`${who}_bad_response`);
  }
  if (payload.error) throw new SourceError(`${who}_denied`);
  const result = payload.result || {};
  if (result.isError) throw new SourceError(`${who}_tool_error`);
  try {
    return JSON.parse(result.content[0].text);
  } catch {
    throw new SourceError(`${who}_bad_response`);
  }
}

export interface Sources {
  ops(name: string, args: Record<string, unknown>): Promise<any>;
  vaultRead(path: string): Promise<string>;
  vaultSearch(query: string, path: string, max?: number): Promise<{ path: string; snippet: string; line_number: number }[]>;
  github(path: string, init?: { method?: string; body?: unknown }): Promise<any>;
}

export function makeSources(
  config: Config,
  secrets: { ops?: string; vault?: string; github?: string },
  fetchFn: typeof fetch = fetch,
): Sources {
  return {
    async ops(name, args) {
      if (!secrets.ops) throw new NotConfigured("DASHBOARD_OPS_BEARER");
      return rpcToolCall(`${config.opsUrl}/mcp`, secrets.ops, name, args, fetchFn, "ops");
    },
    async vaultRead(path) {
      if (!secrets.vault) throw new NotConfigured("DASHBOARD_VAULT_BEARER");
      const r = await rpcToolCall(config.vaultUrl, secrets.vault, "vault_read", { path }, fetchFn, "vault");
      if (typeof r.content !== "string") throw new SourceError("vault_bad_response");
      return r.content;
    },
    async vaultSearch(query, path, max = 200) {
      if (!secrets.vault) throw new NotConfigured("DASHBOARD_VAULT_BEARER");
      const r = await rpcToolCall(config.vaultUrl, secrets.vault, "vault_search", { query, path, max_results: max }, fetchFn, "vault");
      return Array.isArray(r.results) ? r.results : [];
    },
    async github(path, init = {}) {
      if (!secrets.github) throw new NotConfigured("DASHBOARD_GITHUB_TOKEN");
      let res: Response;
      try {
        res = await fetchFn(`https://api.github.com${path}`, {
          method: init.method || "GET",
          headers: {
            Authorization: `Bearer ${secrets.github}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "caelos-dashboard",
            ...(init.body ? { "Content-Type": "application/json" } : {}),
          },
          body: init.body ? JSON.stringify(init.body) : undefined,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        throw new SourceError("github_unreachable");
      }
      if (res.status === 401 || res.status === 403) throw new SourceError("github_denied");
      if (!res.ok) throw new SourceError(`github_http_${res.status}`);
      return res.json();
    },
  };
}
