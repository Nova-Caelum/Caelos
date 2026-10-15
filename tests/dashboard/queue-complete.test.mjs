import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { resetAccessCache } from "../../functions/_lib/dashboard/access.ts";
import { completeQueueRow } from "../../functions/_lib/queue-complete.ts";
import { onRequest as completeRoute } from "../../functions/api/queue/complete.ts";
import { ENV, SECRETS, makeAccess, req } from "./fixtures.mjs";

const ID = "novacaelum-landing:ship-decision";

describe("POST /api/queue/complete", () => {
  let token, calls, rows, fetchFn;
  const post = (body, t = token) => req("/api/queue/complete", t, { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body), headers: { "content-type": "application/json" } });

  beforeEach(async () => {
    resetAccessCache();
    const access = await makeAccess();
    token = await access.sign();
    calls = [];
    rows = { [ID]: { external_id: ID, assignee_agent: "daniel", state: "ready" }, "x:other": { external_id: "x:other", assignee_agent: "cto", state: "ready" }, "x:done": { external_id: "x:done", assignee_agent: "daniel", state: "done" }, "x:deferred": { external_id: "x:deferred", assignee_agent: "daniel", state: "deferred" } };
    fetchFn = async (url, init = {}) => {
      const u = String(url);
      if (u.includes("/certs")) return new Response(JSON.stringify(access.certs));
      const id = decodeURIComponent(u.split("/api/work-items/")[1]);
      calls.push({ method: init.method, id, auth: new Headers(init.headers).get("authorization"), body: init.body });
      const row = rows[id];
      if (!row) return new Response("{}", { status: 404 });
      if (init.method === "PATCH") { row.state = JSON.parse(init.body).state; return new Response(JSON.stringify({ row })); }
      return new Response(JSON.stringify(row));
    };
  });

  it("marks one of Daniel's open rows done as the console client, writing only state=done (WHOLE-PATH: Access -> route -> ops PATCH)", async () => {
    const res = await completeQueueRow(post({ id: ID }), ENV, fetchFn);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, id: ID, state: "done", already_done: false });
    const patch = calls.find((c) => c.method === "PATCH");
    assert.equal(patch.auth, `Bearer ${SECRETS.proxy}`);
    assert.deepEqual(JSON.parse(patch.body), { state: "done" });
    assert.equal(rows[ID].state, "done");
  });

  it("refuses rows that are not Daniel's, not open, or missing; never PATCHes them", async () => {
    const cases = [["x:other", 403, "not_your_row"], ["x:deferred", 409, "row_not_open"], ["x:none", 404, "row_not_found"]];
    for (const [id, status, error] of cases) {
      const res = await completeQueueRow(post({ id }), ENV, fetchFn);
      assert.equal(res.status, status, id);
      assert.equal((await res.json()).error, error);
    }
    assert.equal(calls.filter((c) => c.method === "PATCH").length, 0);
  });

  it("an already-done row is a success without a second write", async () => {
    const res = await completeQueueRow(post({ id: "x:done" }), ENV, fetchFn);
    assert.deepEqual(await res.json(), { ok: true, id: "x:done", state: "done", already_done: true });
    assert.equal(calls.filter((c) => c.method === "PATCH").length, 0);
  });

  it("401 without Access, 405 for GET, 400 for a bad body, 503 naming the secret when absent", async () => {
    assert.equal((await completeQueueRow(post({ id: ID }, null), ENV, fetchFn)).status, 401);
    assert.equal((await completeQueueRow(req("/api/queue/complete", token), ENV, fetchFn)).status, 405);
    assert.equal((await completeQueueRow(post("not json"), ENV, fetchFn)).status, 400);
    assert.equal((await completeQueueRow(post({ id: 5 }), ENV, fetchFn)).status, 400);
    const res = await completeQueueRow(post({ id: ID }), { ...ENV, CONSOLE_OPS_BEARER: undefined }, fetchFn);
    assert.deepEqual(await res.json(), { error: "not_configured", secret: "CONSOLE_OPS_BEARER" });
    assert.equal(calls.length, 0);
  });

  it("an ops refusal surfaces as 502 and the row is untouched", async () => {
    const refuse = async (url, init = {}) => (String(url).includes("/certs") ? fetchFn(url, init) : init.method === "PATCH" ? new Response("{}", { status: 403 }) : fetchFn(url, init));
    const res = await completeQueueRow(post({ id: ID }), ENV, refuse);
    assert.equal(res.status, 502);
    assert.equal(rows[ID].state, "ready");
  });

  it("the exported route is wired", () => assert.equal(typeof completeRoute, "function"));
});
