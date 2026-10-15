import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, describe, it } from "node:test";
import { resetAccessCache } from "../../functions/_lib/dashboard/access.ts";
import { buildDashboard, buildQueue } from "../../functions/_lib/dashboard/build.ts";
import { readConfig } from "../../functions/_lib/dashboard/config.ts";
import { serve } from "../../functions/_lib/dashboard/handler.ts";
import { makeSources } from "../../functions/_lib/dashboard/sources.ts";
import { onRequest as dashboardRoute } from "../../functions/api/dashboard.ts";
import { onRequest as queueRoute } from "../../functions/api/queue.ts";
import { ENV, SECRETS, makeAccess, makeFetch, req } from "./fixtures.mjs";

const contract = JSON.parse(readFileSync(new URL("../../docs/dashboard/dashboard.contract.json", import.meta.url), "utf8"));
const { config } = readConfig(ENV);
const NOW = new Date("2026-10-15T14:00:00Z");

/** Compares an actual value to a contract example by key set and primitive type. null is a wildcard on either side (nullable fields). */
function sameShape(actual, expected, path = "$") {
  if (actual === null || actual === undefined || expected === null) return;
  if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual), `${path} should be an array`);
    if (actual.length && expected.length) sameShape(actual[0], expected[0], path + "[0]");
    return;
  }
  if (path.endsWith(".by_state")) { // a map keyed by state, not a fixed record
    assert.ok(Object.values(actual).every((n) => typeof n === "number"), `${path} values are counts`);
    return;
  }
  if (typeof expected === "object") {
    assert.equal(typeof actual, "object", `${path} should be an object`);
    // "unavailable"/"error" panels legitimately carry other keys; this compares OK payloads only
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${path} keys`);
    for (const k of Object.keys(expected)) sameShape(actual[k], expected[k], `${path}.${k}`);
    return;
  }
  assert.equal(typeof actual, typeof expected, `${path} type`);
}

const sources = (opts) => makeSources(config, { ops: SECRETS.ops, vault: SECRETS.vault, github: SECRETS.github }, makeFetch(opts));

describe("GET /api/dashboard payload", () => {
  it("matches the contract example key-for-key (WHOLE-PATH: sources -> panels -> response)", async () => {
    const out = await buildDashboard(sources(), config, "daniel@novacaelum.com", NOW);
    sameShape(out, contract.examples.dashboard);
    for (const [name, panel] of Object.entries(out.panels)) assert.equal(panel.status, "ok", `${name} should be ok`);
  });

  it("builds each panel from the right source data", async () => {
    const { panels } = await buildDashboard(sources(), config, null, NOW);
    assert.equal(panels.waiting_on_daniel.prs.total, 2);
    assert.deepEqual(panels.waiting_on_daniel.prs.groups.map((g) => g.repo), ["technical-cofounder"]);
    assert.equal(panels.waiting_on_daniel.prs.repins[0].repo, "Caelos"); // re-pin collapsed
    assert.equal(panels.waiting_on_daniel.queue_rows.length, 4);
    assert.equal(panels.waiting_on_daniel.count, 6); // 2 PRs + 4 open daniel rows
    const legacy = panels.waiting_on_daniel.queue_rows.find((r) => r.id === "legacy-task:abc");
    assert.deepEqual([legacy.project, legacy.link, legacy.short_id], ["", null, null]); // no project: no console link
    assert.equal(panels.waiting_on_daniel.rows_to_decide.status, "unavailable");
    assert.deepEqual(panels.queue.by_state, { "in-progress": 1, ready: 2, blocked: 1 });
    assert.equal(panels.waiting_on_daniel.queue_rows[0].state, "in-progress"); // in-progress first, blocked last
    assert.equal(panels.waiting_on_daniel.queue_rows.at(-1).state, "blocked");

    assert.deepEqual(panels.next_priority.items.map((i) => [i.depth, i.text]), [[0, "Main Quest - Governance Sprint"], [1, "Finish Nova Comms"], [0, "Ship dashboard"]]);
    assert.deepEqual(panels.crazy_list.entries.map((e) => e.name), ["stale-runtime-warning"]); // resolved + body lines ignored
    assert.equal(panels.crazy_list.entries[0].note, "Warns about a stale runtime.");

    assert.equal(panels.workstream.live, true);
    assert.equal(panels.workstream.seconds_left, 13 * 3600 + 59 * 60);
    assert.deepEqual(panels.workstream.agents[0], { name: "da-vinci", used: 2, budget: 4, rows: ["9b", "9a"], state: "handed-off", note: "v3" });
    assert.equal(panels.workstream.agents[1].used, null);

    assert.deepEqual(panels.loops.items.map((l) => [l.goal, l.status]), [["tc-setup-redesign", "live"], ["novacomms", "deciding"]]); // _closedprojects + non-loop file pruned

    assert.equal(panels.open_work.total, 5);
    assert.equal(panels.open_work.in_progress.length, 2);
    assert.equal(panels.open_prs.items.find((p) => p.number === 53).escalated, true);
    assert.equal(panels.open_prs.items.find((p) => p.number === 40).escalated, false);

    assert.equal(panels.verifier_closes.items[0].row, "governance-evolution:move-launcher-scripts");
    assert.equal(panels.verifier_closes.items[0].run_id, "0636126a-c9bb-4998-8ad2-4f3bba3a1666");
    assert.equal(panels.runtime_deploys.installed_sha, "68e2539");
    assert.equal(panels.runtime_deploys.origin_main_sha, "68e2539");
    assert.equal(panels.runtime_deploys.current, true);

    assert.deepEqual(panels.ci.red, [{ repo: "hyperspace-engine", workflow: "tests", url: "https://github.com/Nova-Caelum/hyperspace-engine/actions/runs/1" }]); // PR Review ignored
    assert.equal(panels.ci.checked, 3);
  });

  it("a failing source degrades only its own panels", async () => {
    const { panels } = await buildDashboard(sources({ down: ["vault"] }), config, null, NOW);
    for (const k of ["next_priority", "crazy_list", "workstream", "loops"]) {
      assert.equal(panels[k].status, "error", k);
      assert.equal(panels[k].error, "vault_http_502");
    }
    for (const k of ["queue", "open_work", "open_prs", "verifier_closes", "runtime_deploys", "ci"]) assert.equal(panels[k].status, "ok", k);
    assert.equal(panels.waiting_on_daniel.status, "ok");
  });

  it("ops down: Task Graph panels error, GitHub and vault panels still serve", async () => {
    const { panels } = await buildDashboard(sources({ down: ["ops"] }), config, null, NOW);
    assert.equal(panels.queue.status, "error");
    assert.equal(panels.waiting_on_daniel.queue_status, "error");
    assert.equal(panels.waiting_on_daniel.prs.status, "ok"); // PRs still count
    assert.equal(panels.next_priority.status, "ok");
    assert.equal(panels.runtime_deploys.status, "error");
  });

  it("a missing secret marks panels unavailable and names the secret, never a value", async () => {
    const src = makeSources(config, { vault: SECRETS.vault }, makeFetch());
    const { panels } = await buildDashboard(src, config, null, NOW);
    assert.deepEqual(panels.open_work, { status: "unavailable", reason: "not configured: DASHBOARD_OPS_BEARER" });
    assert.deepEqual(panels.ci, { status: "unavailable", reason: "not configured: DASHBOARD_GITHUB_TOKEN" });
    assert.equal(panels.next_priority.status, "ok");
    assert.ok(!JSON.stringify(panels).includes(SECRETS.vault));
  });

  it("runtime_deploys.current is null when the deploy summary has no sha, false when it differs", async () => {
    const mk = (summary) => ({ ...sources(), ops: async () => [{ created_at: "2026-10-08T00:00:00Z", author: "a", summary }] });
    const { runtimeDeploys } = await import("../../functions/_lib/dashboard/panels.ts");
    assert.equal((await runtimeDeploys(mk("deployed something"), "68e2539ff", NOW)).current, null);
    assert.equal((await runtimeDeploys(mk("from origin/main 1111111"), "68e2539ff", NOW)).current, false);
  });
});

describe("GET /api/queue payload", () => {
  it("matches the contract example and carries each row's full description", async () => {
    const out = await buildQueue(sources(), config, NOW);
    sameShape(out, contract.examples.queue);
    assert.equal(out.count, 4);
    assert.ok(out.rows.every((r) => r.state !== "done"));
    const landing = out.rows.find((r) => r.short_id === "WEB-28");
    assert.match(landing.description, /^Go: /);
    assert.equal(landing.link, "https://console.novacaelum.com/taskgraph/projects/novacaelum-landing?tab=tasks&item=novacaelum-landing%3Aship-decision");
  });

  it("only returns rows assigned to daniel", async () => {
    const out = await buildQueue(sources(), config, NOW);
    assert.ok(!out.rows.some((r) => r.short_id === "GOV-1"));
  });
});

describe("routes (Access in front)", () => {
  let access;
  beforeEach(async () => {
    resetAccessCache();
    access = await makeAccess();
  });

  it("the exported routes serve JSON to a valid Access token (WHOLE-PATH: Access -> route -> sources -> response)", async () => {
    const token = await access.sign();
    const realFetch = globalThis.fetch;
    globalThis.fetch = makeFetch({ certs: access.certs });
    try {
      const dash = await dashboardRoute({ request: req("/api/dashboard", token), env: ENV });
      assert.equal(dash.status, 200);
      assert.equal(dash.headers.get("cache-control"), "private, no-store");
      const body = await dash.json();
      assert.equal(body.viewer.email, "daniel@novacaelum.com");
      sameShape(body, contract.examples.dashboard);

      const q = await queueRoute({ request: req("/api/queue", token), env: ENV });
      assert.equal(q.status, 200);
      const qb = await q.json();
      assert.equal(qb.count, 4);
      sameShape(qb, contract.examples.queue);
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it("401 without a token (the unauthenticated *.pages.dev case)", async () => {
    const res = await serve(req("/api/dashboard"), ENV, async () => ({}), makeFetch({ certs: access.certs }));
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "no_access_token" });
  });

  it("500 names the missing config and never echoes a value", async () => {
    const res = await serve(req("/api/dashboard", "x"), { DASHBOARD_OPS_BEARER: SECRETS.ops }, async () => ({}), makeFetch());
    assert.equal(res.status, 500);
    const text = await res.text();
    assert.match(text, /CF_ACCESS_AUD/);
    assert.ok(!text.includes(SECRETS.ops));
  });

  it("405 for non-GET", async () => {
    const token = await access.sign();
    const res = await serve(req("/api/queue", token, { method: "POST" }), ENV, async () => ({}), makeFetch({ certs: access.certs }));
    assert.equal(res.status, 405);
  });

  it("queue route maps a missing secret to 503 with the secret NAME", async () => {
    const token = await access.sign();
    const { buildQueue: bq } = await import("../../functions/_lib/dashboard/build.ts");
    const env = { ...ENV, DASHBOARD_OPS_BEARER: undefined };
    const res = await serve(req("/api/queue", token), env, (src, cfg) => bq(src, cfg, NOW), makeFetch({ certs: access.certs }));
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: "not_configured", secret: "DASHBOARD_OPS_BEARER" });
  });
});
