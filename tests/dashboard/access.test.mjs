import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { resetAccessCache, verifyAccess } from "../../functions/_lib/dashboard/access.ts";
import { readConfig } from "../../functions/_lib/dashboard/config.ts";
import { AUD, ENV, makeAccess, makeFetch, req } from "./fixtures.mjs";

const { config } = readConfig(ENV);

describe("Cloudflare Access verification", () => {
  let access, f;
  beforeEach(async () => {
    resetAccessCache();
    access = await makeAccess();
    f = makeFetch({ certs: access.certs });
  });

  it("accepts a correctly signed token for this app", async () => {
    const r = await verifyAccess(req("/", await access.sign()), config, f);
    assert.deepEqual(r, { ok: true, email: "daniel@novacaelum.com" });
  });

  it("accepts the CF_Authorization cookie when the header is absent", async () => {
    const t = await access.sign();
    const r = await verifyAccess(new Request("https://console.novacaelum.com/", { headers: { cookie: `a=b; CF_Authorization=${t}` } }), config, f);
    assert.equal(r.ok, true);
  });

  it("rejects: no token, wrong audience, wrong issuer, expired, not-yet-valid, tampered, wrong alg", async () => {
    const now = Math.floor(Date.now() / 1000);
    const cases = [
      [req("/"), "no_access_token"],
      [req("/", await access.sign({ aud: ["other-app"] })), "invalid_access_token"],
      [req("/", await access.sign({ iss: "https://evil.cloudflareaccess.com" })), "invalid_access_token"],
      [req("/", await access.sign({ exp: now - 5 })), "invalid_access_token"],
      [req("/", await access.sign({ nbf: now + 3600 })), "invalid_access_token"],
      [req("/", (await access.sign()).replace(/.$/, (c) => (c === "A" ? "B" : "A"))), "invalid_access_token"],
      [req("/", await access.sign({}, { alg: "none" })), "invalid_access_token"],
      [req("/", await access.sign({}, { kid: "unknown" })), "invalid_access_token"],
    ];
    for (const [request, error] of cases) {
      const r = await verifyAccess(request, config, f);
      assert.equal(r.ok, false);
      assert.equal(r.error, error);
      assert.equal(r.status, 401);
    }
  });

  it("a token signed for another audience is the pages.dev leak this guards against: 401, not data", async () => {
    const r = await verifyAccess(req("/", await access.sign({ aud: [AUD + "x"] })), config, f);
    assert.equal(r.ok, false);
  });

  it("DASHBOARD_ALLOWED_EMAILS narrows who gets in (403)", async () => {
    const { config: c } = readConfig({ ...ENV, DASHBOARD_ALLOWED_EMAILS: "someone@else.com" });
    const r = await verifyAccess(req("/", await access.sign()), c, f);
    assert.deepEqual([r.ok, r.status, r.error], [false, 403, "not_allowed"]);
    const { config: c2 } = readConfig({ ...ENV, DASHBOARD_ALLOWED_EMAILS: "Daniel@NovaCaelum.com" });
    assert.equal((await verifyAccess(req("/", await access.sign()), c2, f)).ok, true);
  });

  it("refetches certs once on an unknown kid (key rotation) then accepts", async () => {
    resetAccessCache();
    const stale = makeFetch({ certs: { keys: [] } });
    await verifyAccess(req("/", await access.sign()), config, stale); // primes an empty cache
    const calls = [];
    const fresh = makeFetch({ certs: access.certs, calls });
    const r = await verifyAccess(req("/", await access.sign()), config, fresh);
    assert.equal(r.ok, true);
    assert.equal(calls.filter((c) => c.url.includes("/certs")).length, 1);
  });
});
