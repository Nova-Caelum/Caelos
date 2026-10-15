// Fake network for the dashboard tests: one router standing in for the ops server, the vault MCP,
// GitHub and the Cloudflare Access certs endpoint. No real credentials or hosts are touched.

export const AUD = "test-aud-tag";
export const TEAM = "novacaelum.cloudflareaccess.com";
export const SECRETS = {
  ops: "test-ops-bearer-0000",
  vault: "test-vault-bearer-0000",
  github: "test-github-token-0000",
  proxy: "test-console-bearer-0000",
};

export const ENV = {
  CF_ACCESS_AUD: AUD,
  DASHBOARD_OPS_BEARER: SECRETS.ops,
  DASHBOARD_VAULT_BEARER: SECRETS.vault,
  DASHBOARD_GITHUB_TOKEN: SECRETS.github,
  CONSOLE_OPS_BEARER: SECRETS.proxy,
};

const row = (o) => ({
  id: "uuid-" + o.external_id,
  type: "task",
  effort_level: "quick",
  assignee_agent: null,
  created_at: "2026-10-14T20:00:00+00:00",
  updated_at: "2026-10-14T20:30:00+00:00",
  acceptance_criteria: "Daniel states ship or drop [manual]",
  source_references: [{ uri: "AgentSecretBase/x.md", anchor: "a" }],
  team: ["daniel"],
  ...o,
});

export const ROWS = [
  row({ external_id: "novacaelum-landing:ship-decision", project_code: "novacaelum-landing", short_id: "WEB-28", name: "Decide the landing motion", state: "ready", type: "decision", assignee_agent: "daniel" }),
  row({ external_id: "technical-cofounder:codex-friend", project_code: "technical-cofounder", short_id: "TCF-49", name: "TC on Codex friend test", state: "in-progress", assignee_agent: "daniel", updated_at: "2026-10-14T21:00:00+00:00" }),
  row({ external_id: "graph-machine-testbed:console-test-b", project_code: "graph-machine-testbed", short_id: "GMT-125", name: "Console test B", state: "blocked", assignee_agent: "daniel" }),
  row({ external_id: "legacy-task:abc", project_code: null, short_id: null, name: "Legacy row with no project", state: "ready", assignee_agent: "daniel", updated_at: "2026-07-27T07:14:53+00:00" }),
  row({ external_id: "governance-evolution:other", project_code: "governance-evolution", short_id: "GOV-1", name: "Someone else's row", state: "in-progress", assignee_agent: "cto" }),
];
const DESCRIPTIONS = {
  "novacaelum-landing:ship-decision": "Go: https://example.test/preview\nLook: entrance animation.\nSend: ship or drop.",
  "technical-cofounder:codex-friend": "## Problem\nInstall in Codex.",
  "graph-machine-testbed:console-test-b": "Blocked by A.",
};

const WORKLOG = {
  verifier: [
    { id: "w1", author: "tg_verifier", project: "governance-evolution", summary: "VERIFIED DONE - governance-evolution:move-launcher-scripts: 1 predicate(s) discharged; verification run 0636126a-c9bb-4998-8ad2-4f3bba3a1666", tags: ["tg-verifier", "verified-done"], work_item_id: "a428e538-1b6e-4270-b114-4be2fcdd13b9", created_at: "2026-10-14T21:21:13.046834+00:00" },
  ],
  deploy: [
    { id: "d1", author: "devops-local", project: "governance-evolution", summary: "Applied deploy-claude_mac from origin/main 68e2539: circuit-breaker now in runtime", tags: ["runtime-deploy"], work_item_id: null, created_at: "2026-10-08T17:51:02.172845+00:00" },
  ],
};

export const VAULT_FILES = {
  "AgentSecretBase/Next Priority.md": "1) Main Quest - Governance Sprint\n\t1) Finish Nova Comms\n2) Ship dashboard\n--\n",
  "AgentSecretBase/_ops/workstreams/stream_status.json": JSON.stringify({
    slug: "stream_test",
    orchestrator: "cto",
    deadline: "2026-10-16T03:59:00+00:00",
    agents: { "da-vinci": { stamina_blocks_used: 2, stamina_block_budget: 4, rows: ["9b", "9a"], state: "handed-off", note: "v3" }, x: { rows: [] } },
  }),
  "AgentSecretBase/workspace/technical-cofounder/tc-setup-redesign/loop.state.json": JSON.stringify({ status: "live", goal_slug: "tc-setup-redesign", current_node: "executing" }),
  "AgentSecretBase/workspace/novacomms/loop.state.json": JSON.stringify({ status: "deciding", goal_slug: "novacomms", current_node: "deciding" }),
};

const SEARCH = (query, path) => {
  if (path.endsWith("/driving-me-crazy/entries")) {
    const e = (n, status, line0 = 2) => [
      { path: `${path}/${n}.md`, snippet: `status: ${status}`, line_number: line0 },
      { path: `${path}/${n}.md`, snippet: "area: preload", line_number: line0 + 1 },
      { path: `${path}/${n}.md`, snippet: "added: 2026-10-13", line_number: line0 + 2 },
      { path: `${path}/${n}.md`, snippet: 'note: "Warns about a stale runtime."', line_number: line0 + 3 },
      { path: `${path}/${n}.md`, snippet: "source: daniel", line_number: line0 + 4 },
    ];
    return [...e("stale-runtime-warning", "open"), ...e("already-fixed", "resolved"), { path: `${path}/stale-runtime-warning.md`, snippet: "note: body text below frontmatter", line_number: 90 }];
  }
  // loops: a live one, a deciding one, and two that must be pruned
  return [
    { path: "AgentSecretBase/workspace/technical-cofounder/tc-setup-redesign/loop.state.json", snippet: '  "status": "live",', line_number: 9 },
    { path: "AgentSecretBase/workspace/novacomms/loop.state.json", snippet: '  "status": "deciding",', line_number: 9 },
    { path: "AgentSecretBase/workspace/_closedprojects/old/loop.state.json", snippet: '  "status": "executing",', line_number: 9 },
    { path: "AgentSecretBase/workspace/x/notes.md", snippet: '  "status": "live",', line_number: 3 },
  ];
};

const PR = (repo, number, title, extra = {}) => ({ number, title, html_url: `https://github.com/Nova-Caelum/${repo}/pull/${number}`, repository_url: `https://api.github.com/repos/Nova-Caelum/${repo}`, created_at: "2026-10-14T18:40:00Z", user: { login: "NovaCaelum-Founder" }, draft: false, ...extra });

const rpc = (id, result, error) => new Response(JSON.stringify({ jsonrpc: "2.0", id, ...(error ? { error } : { result }) }), { headers: { "Content-Type": "application/json" } });
const text = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj) }] });

/** @param {{down?: string[], calls?: any[], certs?: any}} opts down: any of "ops","vault","github" */
export function makeFetch(opts = {}) {
  const down = new Set(opts.down || []);
  const calls = opts.calls || [];
  return async (url, init = {}) => {
    const u = String(url);
    const auth = new Headers(init.headers || {}).get("authorization");
    calls.push({ url: u, auth, method: init.method || "GET" });
    if (u.includes("/cdn-cgi/access/certs")) return new Response(JSON.stringify(opts.certs), { headers: { "Content-Type": "application/json" } });

    if (u.endsWith("/mcp") && u.includes("railway") && u.includes("ops")) {
      if (down.has("ops")) return new Response("boom", { status: 500 });
      if (auth !== `Bearer ${SECRETS.ops}`) return new Response("{}", { status: 401 });
      const { id, params } = JSON.parse(init.body);
      const a = params.arguments;
      if (params.name === "list_work_items") {
        let rows = ROWS.filter((r) => a.state.includes(r.state));
        if (a.assignee_agent) rows = rows.filter((r) => r.assignee_agent === a.assignee_agent);
        return rpc(id, text(rows));
      }
      if (params.name === "get_work_item") return rpc(id, text({ ...ROWS.find((r) => r.external_id === a.external_id), description: DESCRIPTIONS[a.external_id] }));
      if (params.name === "search_worklog") return rpc(id, text(a.author === "tg_verifier" ? WORKLOG.verifier : WORKLOG.deploy));
    }
    if (u.includes("vault")) {
      if (down.has("vault")) return new Response("boom", { status: 502 });
      if (auth !== `Bearer ${SECRETS.vault}`) return new Response("{}", { status: 401 });
      const { id, params } = JSON.parse(init.body);
      if (params.name === "vault_read") {
        const content = VAULT_FILES[params.arguments.path];
        return content === undefined ? rpc(id, null, { code: -32000, message: "not found" }) : rpc(id, text({ path: params.arguments.path, content }));
      }
      if (params.name === "vault_search") return rpc(id, text({ results: SEARCH(params.arguments.query, params.arguments.path) }));
    }
    if (u.startsWith("https://api.github.com")) {
      if (down.has("github")) return new Response("{}", { status: 401 });
      if (auth !== `Bearer ${SECRETS.github}`) return new Response("{}", { status: 401 });
      if (u.includes("/graphql")) {
        return new Response(JSON.stringify({ data: { organization: { repositories: { nodes: [
          { name: "_agentOS", defaultBranchRef: { name: "main", target: { oid: "68e2539aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", statusCheckRollup: { state: "SUCCESS", contexts: { nodes: [] } } } } },
          { name: "hyperspace-engine", defaultBranchRef: { name: "main", target: { oid: "bbbb", statusCheckRollup: { state: "FAILURE", contexts: { nodes: [{ __typename: "CheckRun", name: "tests", conclusion: "FAILURE", detailsUrl: "https://github.com/Nova-Caelum/hyperspace-engine/actions/runs/1" }, { __typename: "CheckRun", name: "PR Review", conclusion: "FAILURE", detailsUrl: "x" }] } } } } },
          { name: "empty-repo", defaultBranchRef: null },
        ] } } } }));
      }
      if (u.includes("/search/issues")) {
        const q = decodeURIComponent(u);
        const escalated = [PR("technical-cofounder", 53, "Codex compatibility build"), PR("Caelos", 37, "devops-lead reviewer: re-pin to fd0398b (CI merge gate)")];
        const items = q.includes("label:escalate-daniel") ? escalated : [...escalated, PR("Caelos", 40, "Dashboard data layer", { draft: true })];
        return new Response(JSON.stringify({ total_count: items.length, items }));
      }
    }
    return new Response("unexpected: " + u, { status: 599 });
  };
}

/** Sign Access-style JWTs with a throwaway RSA key. */
export async function makeAccess() {
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };
  const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
  const sign = async (claims = {}, header = {}) => {
    const h = b64({ alg: "RS256", kid: "k1", ...header });
    const now = Math.floor(Date.now() / 1000);
    const p = b64({ aud: [AUD], iss: `https://${TEAM}`, exp: now + 600, nbf: now - 10, email: "daniel@novacaelum.com", ...claims });
    const sig = Buffer.from(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(`${h}.${p}`))).toString("base64url");
    return `${h}.${p}.${sig}`;
  };
  return { certs: { keys: [jwk] }, sign };
}

export const req = (path, token, init = {}) =>
  new Request(`https://console.novacaelum.com${path}`, { ...init, headers: { ...(token ? { "Cf-Access-Jwt-Assertion": token } : {}), ...(init.headers || {}) } });
