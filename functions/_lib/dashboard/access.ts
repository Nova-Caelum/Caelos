// Cloudflare Access JWT verification (RS256, WebCrypto, no dependencies).
// Needed because the production alias caelos-console.pages.dev is NOT behind Access: the function
// must prove the caller passed Access instead of trusting that the edge already did.

import type { Config } from "./config.ts";

export type AccessResult =
  | { ok: true; email: string | null }
  | { ok: false; status: 401 | 403; error: string };

type Jwk = { kid: string; kty: string; n: string; e: string };
const certCache = new Map<string, { at: number; keys: Jwk[] }>();
const CERT_TTL_MS = 60 * 60 * 1000;

export function resetAccessCache(): void {
  certCache.clear();
}

function b64urlBytes(s: string): Uint8Array {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function b64urlJson(s: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
}

function tokenFrom(request: Request): string | null {
  const header = request.headers.get("cf-access-jwt-assertion");
  if (header) return header;
  const cookie = request.headers.get("cookie") || "";
  const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(cookie);
  return m ? m[1] : null;
}

async function certs(config: Config, fetchFn: typeof fetch, forceRefresh: boolean): Promise<Jwk[]> {
  const hit = certCache.get(config.teamDomain);
  if (hit && !forceRefresh && Date.now() - hit.at < CERT_TTL_MS) return hit.keys;
  const res = await fetchFn(`https://${config.teamDomain}/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("certs_unavailable");
  const body = (await res.json()) as { keys?: Jwk[] };
  const keys = body.keys || [];
  certCache.set(config.teamDomain, { at: Date.now(), keys });
  return keys;
}

export async function verifyAccess(
  request: Request,
  config: Config,
  fetchFn: typeof fetch = fetch,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<AccessResult> {
  const token = tokenFrom(request);
  if (!token) return { ok: false, status: 401, error: "no_access_token" };
  const bad: AccessResult = { ok: false, status: 401, error: "invalid_access_token" };
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return bad;
    const header = b64urlJson(parts[0]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") return bad;

    let jwk = (await certs(config, fetchFn, false)).find((k) => k.kid === header.kid);
    if (!jwk) jwk = (await certs(config, fetchFn, true)).find((k) => k.kid === header.kid); // key rotation
    if (!jwk) return bad;

    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return bad;

    const p = b64urlJson(parts[1]);
    const aud = Array.isArray(p.aud) ? p.aud : [p.aud];
    if (!aud.includes(config.aud)) return bad;
    if (p.iss !== `https://${config.teamDomain}`) return bad;
    if (typeof p.exp !== "number" || p.exp <= nowSeconds) return bad;
    if (typeof p.nbf === "number" && p.nbf > nowSeconds + 60) return bad;

    const email = typeof p.email === "string" ? p.email.toLowerCase() : null;
    if (config.allowedEmails.length && (!email || !config.allowedEmails.includes(email))) {
      return { ok: false, status: 403, error: "not_allowed" };
    }
    return { ok: true, email };
  } catch {
    return bad;
  }
}
