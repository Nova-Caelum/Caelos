import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { resetAccessCache } from "../../functions/_lib/dashboard/access.ts";
import { onRequest as opsRoute } from "../../functions/ops/[[path]].ts";
import { proxyToOps } from "../../functions/_lib/ops-proxy.ts";
import { ENV, SECRETS, makeAccess, req } from "./fixtures.mjs";

const OPS = "https://nova-caelum-ops-production.up.railway.app";

describe("/ops proxy (the only door from the browser to the ops server)", () => {
  let access, token, seen, fetchFn;
  beforeEach(async () => {
    resetAccessCache();
    access = await makeAccess();
    token = await access.sign();
    seen = [];
    fetchFn = async (url, init = {}) => {
      const u = String(url);
      if (u.includes("/certs")) return new Response(JSON.stringify(access.certs));
      seen.push({ url: u, method: init.method, headers: Object.fromEntries(new Headers(init.headers)), body: init.body ? Buffer.from(init.body).toString() : undefined });
      return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { "Content-Type": "application/json", "Set-Cookie": "leak=1" } });
    };
  });

  it("401 without Access; nothing reaches the ops server", async () => {
    const res = await proxyToOps(req("/ops/api/projects"), ENV, fetchFn);
    assert.equal(res.status, 401);
    assert.equal(seen.length, 0);
  });

  it("forwards /ops/api/* with the SERVER-held bearer, dropping the caller's own Authorization and cookies", async () => {
    const res = await proxyToOps(
      req("/ops/api/projects?status=planned", token, { headers: { Authorization: "Bearer attacker-supplied", cookie: "CF_Authorization=zzz", accept: "application/json" } }),
      ENV,
      fetchFn,
    );
    assert.equal(res.status, 201);
    assert.equal(res.headers.get("set-cookie"), null); // upstream cookies are not passed to the browser
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, `${OPS}/api/projects?status=planned`);
    assert.equal(seen[0].headers.authorization, `Bearer ${SECRETS.proxy}`);
    assert.equal(seen[0].headers.cookie, undefined);
  });

  it("forwards POST bodies to /ops/mcp", async () => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_agents", arguments: {} } });
    await proxyToOps(req("/ops/mcp", token, { method: "POST", body, headers: { "content-type": "application/json" } }), ENV, fetchFn);
    assert.equal(seen[0].url, `${OPS}/mcp`);
    assert.equal(seen[0].body, body);
  });

  it("refuses everything outside /api/* and /mcp (no /keys, /deploy, /admin, traversal)", async () => {
    for (const path of ["/ops/keys", "/ops/deploy", "/ops/admin/graph-machine-conversion", "/ops/graph-machine/runs/claim", "/ops/api/../keys", "/ops/", "/ops/apix"]) {
      const res = await proxyToOps(req(path, token, { method: "POST", body: "{}" }), ENV, fetchFn);
      assert.equal(res.status, 404, path);
    }
    assert.equal(seen.length, 0);
  });

  it("GET /ops/mcp and PUT are 405", async () => {
    assert.equal((await proxyToOps(req("/ops/mcp", token), ENV, fetchFn)).status, 405);
    assert.equal((await proxyToOps(req("/ops/api/projects", token, { method: "PUT", body: "{}" }), ENV, fetchFn)).status, 405);
  });

  it("503 naming the secret when CONSOLE_OPS_BEARER is not set; no value in any response", async () => {
    const res = await proxyToOps(req("/ops/api/projects", token), { ...ENV, CONSOLE_OPS_BEARER: undefined }, fetchFn);
    assert.equal(res.status, 503);
    assert.match(await res.text(), /CONSOLE_OPS_BEARER/);
  });

  it("the exported route is wired to the proxy", () => {
    assert.equal(typeof opsRoute, "function");
  });
});
