// One builder per dashboard panel. Each takes the Sources client and returns the panel's data;
// build.ts wraps every call so a failing source becomes {status:"error"|"unavailable"} and never
// fails the whole response. Logic mirrors _agentOS/system/bin/daniel_dashboard.py.

import type { Config } from "./config.ts";
import type { Sources } from "./sources.ts";

export const OPEN_STATES = ["pending-review", "ready", "in-progress", "blocked"] as const;
const TERMINAL_LOOP = new Set(["done", "descoped", "killed"]);
const LOOP_PRUNE = new Set(["_closedprojects", "node_modules", ".git", "dogfood", "_probe", "fixtures"]);
const OPEN_LOOP_STATUSES = "framing|understanding|deciding|specifying|executing|verifying|live|paused|blocked_external|abandoned_budget";
const REPIN_PREFIX = "devops-lead reviewer: re-pin";
const VAULT_WS = "AgentSecretBase/workspace";

const iso = (v: unknown): string | null => {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export function taskLink(config: Config, project: string | null, externalId: string): string | null {
  if (!project) return null; // legacy rows with no project have no console page
  return `${config.consoleUrl}/taskgraph/projects/${encodeURIComponent(project)}?tab=tasks&item=${encodeURIComponent(externalId)}`;
}

// ── Task Graph ───────────────────────────────────────────────────────────────

export function queueSummary(config: Config, r: any) {
  return {
    id: r.external_id as string,
    short_id: (r.short_id ?? null) as string | null,
    project: (r.project_code ?? "") as string,
    name: r.name as string,
    state: r.state as string,
    type: r.type as string,
    effort_level: (r.effort_level ?? null) as string | null,
    updated_at: iso(r.updated_at) as string,
    link: taskLink(config, r.project_code, r.external_id),
  };
}

const STATE_RANK: Record<string, number> = { "in-progress": 0, ready: 1, "pending-review": 2, blocked: 3 };

async function openDanielRows(src: Sources): Promise<any[]> {
  const rows = await src.ops("list_work_items", { assignee_agent: "daniel", state: [...OPEN_STATES], limit: 100 });
  return (Array.isArray(rows) ? rows : []).sort(
    (a, b) => (STATE_RANK[a.state] ?? 9) - (STATE_RANK[b.state] ?? 9) || String(b.updated_at).localeCompare(String(a.updated_at)),
  );
}

export async function queueRows(src: Sources, config: Config) {
  const rows = (await openDanielRows(src)).slice(0, 40);
  const full = await Promise.all(
    rows.map(async (r) => {
      let heavy: any = r;
      try {
        heavy = await src.ops("get_work_item", { external_id: r.external_id, include_heavy: true });
      } catch {
        // keep the summary row: the description is missing, not the row
      }
      return {
        ...queueSummary(config, r),
        created_at: iso(r.created_at) as string,
        description: String(heavy.description ?? ""),
        acceptance_criteria: (r.acceptance_criteria ?? null) as string | null,
        source_references: Array.isArray(r.source_references) ? r.source_references : [],
        team: Array.isArray(r.team) ? r.team : [],
      };
    }),
  );
  return full;
}

export async function queueSummaries(src: Sources, config: Config) {
  const rows = await openDanielRows(src);
  const by_state: Record<string, number> = {};
  for (const r of rows) by_state[r.state] = (by_state[r.state] ?? 0) + 1;
  return { rows: rows.map((r) => queueSummary(config, r)), by_state };
}

export async function openWork(src: Sources, config: Config) {
  const LIMIT = 500;
  const rows: any[] = await src.ops("list_work_items", { state: [...OPEN_STATES], limit: LIMIT });
  const by_state: Record<string, number> = {};
  const projects = new Map<string, number>();
  for (const r of rows) {
    by_state[r.state] = (by_state[r.state] ?? 0) + 1;
    const project = r.project_code ?? "(no project)"; // legacy rows carry none
    projects.set(project, (projects.get(project) ?? 0) + 1);
  }
  const in_progress = rows
    .filter((r) => r.state === "in-progress")
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
    .slice(0, 25)
    .map((r) => ({
      short_id: r.short_id ?? r.external_id,
      name: r.name,
      project: r.project_code ?? "",
      assignee: r.assignee_agent ?? null,
      updated_at: iso(r.updated_at) as string,
      link: taskLink(config, r.project_code, r.external_id),
    }));
  return {
    total: rows.length,
    truncated: rows.length >= LIMIT,
    by_state,
    by_project: [...projects.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 15).map(([project, count]) => ({ project, count })),
    in_progress,
  };
}

// ── Worklog ──────────────────────────────────────────────────────────────────

const daysAgo = (now: Date, d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export async function verifierCloses(src: Sources, config: Config, now: Date) {
  const rows: any[] = await src.ops("search_worklog", { author: "tg_verifier", tags: ["verified-done"], from_date: daysAgo(now, 14) });
  const items = rows
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 10)
    .map((w) => {
      const m = /VERIFIED DONE - (\S+?):\s/.exec(String(w.summary));
      const row = m ? m[1] : "";
      const project = String(w.project ?? row.split(":")[0] ?? "");
      const run = /verification run ([0-9a-f-]{8,36})/.exec(String(w.summary));
      return {
        row,
        project,
        at: iso(w.created_at) as string,
        run_id: run ? run[1] : null,
        work_item_id: (w.work_item_id ?? null) as string | null,
        link: row ? taskLink(config, project, row) : null,
      };
    });
  return { items };
}

export async function runtimeDeploys(src: Sources, originMainSha: string | null, now: Date) {
  const rows: any[] = await src.ops("search_worklog", { tags: ["runtime-deploy"], from_date: daysAgo(now, 90) });
  const sorted = rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const items = sorted.slice(0, 5).map((w) => ({ at: iso(w.created_at) as string, author: String(w.author), summary: String(w.summary) }));
  const m = sorted.length ? /origin\/main\s+([0-9a-f]{7,40})/.exec(String(sorted[0].summary)) : null;
  const installed = m ? m[1] : null;
  let current: boolean | null = null;
  if (installed && originMainSha) current = originMainSha.startsWith(installed) || installed.startsWith(originMainSha);
  return { current, installed_sha: installed, origin_main_sha: originMainSha ? originMainSha.slice(0, 7) : null, items };
}

// ── Vault ────────────────────────────────────────────────────────────────────

/** Daniel's own outline: his words and tab nesting kept, list markers stripped, empties dropped. */
export function outline(text: string): { depth: number; text: string }[] {
  const items: { depth: number; text: string }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || /^\s*-{2,}\s*$/.test(raw)) continue;
    const lead = raw.slice(0, raw.length - raw.trimStart().length);
    const depth = (lead.match(/\t/g) || []).length + Math.floor((lead.match(/ /g) || []).length / 4);
    const body = raw.trim().replace(/^(\d+[.)]|[-*+])\s*/, "");
    if (body) items.push({ depth, text: body });
  }
  return items;
}

export async function nextPriority(src: Sources) {
  const text = (await src.vaultRead("AgentSecretBase/Next Priority.md")).trim();
  const note = text && !text.startsWith("Write the one thing") ? text : null;
  return { note, items: note ? outline(note) : [] };
}

export async function crazyList(src: Sources) {
  const dir = `${VAULT_WS}/Daniel_Notes/driving-me-crazy/entries`;
  const hits = await src.vaultSearch("^(status|area|added|note|source):", dir, 200);
  const byFile = new Map<string, Record<string, string>>();
  for (const h of hits) {
    if (!h.path.endsWith(".md") || h.line_number > 25) continue;
    const m = /^(status|area|added|note|source):\s*(.*)$/.exec(h.snippet.trim());
    if (!m) continue;
    const meta = byFile.get(h.path) ?? {};
    meta[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    byFile.set(h.path, meta);
  }
  const entries = [...byFile.entries()]
    .filter(([, meta]) => (meta.status ?? "open") === "open")
    .map(([path, meta]) => ({
      name: path.split("/").pop()!.replace(/\.md$/, ""),
      area: meta.area ?? "",
      added: meta.added ?? "",
      note: meta.note ?? "",
      source: meta.source ?? "",
    }))
    .sort((a, b) => a.added.localeCompare(b.added) || a.name.localeCompare(b.name));
  return { count: entries.length, entries };
}

export async function workstream(src: Sources, now: Date) {
  const raw = await src.vaultRead("AgentSecretBase/_ops/workstreams/stream_status.json");
  const s = JSON.parse(raw);
  const deadline = iso(s.deadline);
  const left = deadline ? Math.floor((new Date(deadline).getTime() - now.getTime()) / 1000) : null;
  const live = left !== null && left > 0;
  const num = (v: unknown) => (typeof v === "number" ? v : null);
  const agents = Object.entries((s.agents ?? {}) as Record<string, any>).map(([name, a]) => ({
    name,
    used: num(a.stamina_blocks_used),
    budget: num(a.stamina_block_budget),
    rows: (Array.isArray(a.rows) ? a.rows : []).map(String),
    state: (a.state ?? null) as string | null,
    note: (a.note ?? null) as string | null,
  }));
  return {
    live,
    slug: (s.slug ?? null) as string | null,
    orchestrator: (s.orchestrator ?? null) as string | null,
    deadline,
    seconds_left: live ? left : null,
    agents,
  };
}

export async function loops(src: Sources) {
  const hits = await src.vaultSearch(`^  "status": "(${OPEN_LOOP_STATUSES})"`, VAULT_WS, 200);
  const files = [
    ...new Set(
      hits
        .map((h) => h.path)
        .filter((p) => p.endsWith("/loop.state.json"))
        .filter((p) => {
          const rel = p.startsWith(`${VAULT_WS}/`) ? p.slice(VAULT_WS.length + 1) : p;
          return !rel.split("/").some((part) => LOOP_PRUNE.has(part) || part.startsWith("_EVICTED"));
        }),
    ),
  ].slice(0, 15);
  const found = await Promise.all(
    files.map(async (p) => {
      try {
        const d = JSON.parse(await src.vaultRead(p));
        if (TERMINAL_LOOP.has(d.status)) return null;
        const folder = p.slice(0, p.lastIndexOf("/"));
        return { goal: String(d.goal_slug || folder.split("/").pop()), status: String(d.status ?? "?"), node: (d.current_node ?? null) as string | null, folder };
      } catch {
        return null;
      }
    }),
  );
  const items = found.filter((x): x is NonNullable<typeof x> => x !== null);
  const rank = (s: string) => (s === "live" ? 0 : s === "paused" ? 2 : 1);
  items.sort((a, b) => rank(a.status) - rank(b.status) || a.goal.localeCompare(b.goal));
  return { count: items.length, items };
}

// ── GitHub ───────────────────────────────────────────────────────────────────

export async function escalatedPrs(src: Sources, org: string) {
  const q = encodeURIComponent(`org:${org} is:pr is:open label:escalate-daniel`);
  const r = await src.github(`/search/issues?q=${q}&per_page=100`);
  const all: any[] = r.items ?? [];
  const repoOf = (p: any) => String(p.repository_url).split("/").pop() as string;
  const isRepin = (p: any) => String(p.title).toLowerCase().startsWith(REPIN_PREFIX);
  const groups = new Map<string, { number: number; title: string; url: string; opened: string }[]>();
  for (const p of all.filter((p) => !isRepin(p)).sort((a, b) => repoOf(a).toLowerCase().localeCompare(repoOf(b).toLowerCase()) || a.number - b.number)) {
    const list = groups.get(repoOf(p)) ?? [];
    list.push({ number: p.number, title: p.title, url: p.html_url, opened: iso(p.created_at) as string });
    groups.set(repoOf(p), list);
  }
  return {
    total: all.length,
    groups: [...groups.entries()].map(([repo, items]) => ({ repo, items })),
    repins: all.filter(isRepin).map((p) => ({ repo: repoOf(p), number: p.number, url: p.html_url })),
    escalatedKeys: new Set(all.map((p) => `${repoOf(p)}#${p.number}`)),
  };
}

export async function openPrs(src: Sources, org: string, escalatedKeys: Set<string>) {
  const q = encodeURIComponent(`org:${org} is:pr is:open`);
  const r = await src.github(`/search/issues?q=${q}&sort=created&order=desc&per_page=50`);
  const all: any[] = r.items ?? [];
  const items = all.map((p) => {
    const repo = String(p.repository_url).split("/").pop() as string;
    return {
      repo,
      number: p.number as number,
      title: p.title as string,
      url: p.html_url as string,
      author: (p.user?.login ?? null) as string | null,
      draft: Boolean(p.draft),
      opened: iso(p.created_at) as string,
      escalated: escalatedKeys.has(`${repo}#${p.number}`),
    };
  });
  return { total: Number(r.total_count ?? items.length), truncated: Number(r.total_count ?? 0) > items.length, items };
}

const CI_QUERY = `query($org:String!){organization(login:$org){repositories(first:100,isArchived:false){nodes{name defaultBranchRef{name target{... on Commit{oid statusCheckRollup{state contexts(first:25){nodes{__typename ... on CheckRun{name conclusion detailsUrl} ... on StatusContext{context state targetUrl}}}}}}}}}}}`;

export async function ci(src: Sources, org: string) {
  const r = await src.github("/graphql", { method: "POST", body: { query: CI_QUERY, variables: { org } } });
  const repos: any[] = r?.data?.organization?.repositories?.nodes ?? [];
  const red: { repo: string; workflow: string; url: string | null }[] = [];
  let originMainSha: string | null = null;
  for (const repo of repos) {
    const commit = repo.defaultBranchRef?.target;
    if (repo.name === "_agentOS") originMainSha = commit?.oid ?? null;
    const rollup = commit?.statusCheckRollup;
    if (!rollup || (rollup.state !== "FAILURE" && rollup.state !== "ERROR")) continue;
    const bad = (rollup.contexts?.nodes ?? []).find(
      (c: any) =>
        (c.__typename === "CheckRun" && ["FAILURE", "TIMED_OUT", "CANCELLED", "STARTUP_FAILURE"].includes(c.conclusion) && !/PR Review/i.test(c.name)) ||
        (c.__typename === "StatusContext" && (c.state === "FAILURE" || c.state === "ERROR")),
    );
    if (!bad) continue;
    red.push({ repo: repo.name, workflow: bad.name ?? bad.context ?? "?", url: bad.detailsUrl ?? bad.targetUrl ?? null });
  }
  return { checked: repos.length, red, originMainSha };
}
