/* Dashboard data module. The only file that knows where dashboard data comes from.
   Types follow docs/dashboard/dashboard.contract.json (contract_version 1) exactly;
   the mock payloads are that file's `examples`.

   Mock vs live: ONE switch. Live (same-origin GET /api/dashboard, GET /api/queue, POST /api/queue/complete,
   relying on the Cloudflare Access cookie) in every production build, or in dev when VITE_DASHBOARD_LIVE=1.
   Plain `vite dev` with no Functions running uses the mock; VITE_DASHBOARD_LIVE=0 forces the mock anywhere.
   No Authorization header or credential is ever set client-side. */

export const CONTRACT_VERSION = 1;
const FLAG = import.meta.env.VITE_DASHBOARD_LIVE as string | undefined;
const LIVE = FLAG === "1" || (import.meta.env.PROD && FLAG !== "0");

export type Tone = "neutral" | "ready" | "progress" | "done" | "sage" | "danger" | "atmospheric" | "structural";

/* ---------- contract types ---------- */
export type PanelStatus = "ok" | "error" | "unavailable";
/** A panel is independent: 'ok' carries data, 'error' carries an error TYPE name only, 'unavailable' carries why. */
export type Panel<T> = ({ status: "ok" } & T) | { status: "error"; error: string } | { status: "unavailable"; reason: string };

export type QueueState = "pending-review" | "ready" | "in-progress" | "blocked";
export interface QueueRowSummary {
  id: string; short_id: string | null; project: string; name: string; state: QueueState;
  type: string; effort_level: string | null; updated_at: string;
  /** null for legacy rows with no project (project is then ''). */
  link: string | null;
}
export interface SourceReference { uri: string; anchor?: string }
export interface QueueRow extends QueueRowSummary {
  created_at: string;
  /** Go / look / send live here. */
  description: string;
  acceptance_criteria: string | null;
  source_references: SourceReference[];
  team: string[];
}
export interface PrItem { number: number; title: string; url: string; opened: string }
export interface PrGroups {
  status: "ok"; total: number;
  groups: { repo: string; items: PrItem[] }[];
  repins: { repo: string; number: number; url: string }[];
}
export interface WaitingFields {
  count: number;
  prs: PrGroups | { status: "error" | "unavailable" };
  queue_status: PanelStatus;
  queue_rows: QueueRowSummary[];
  rows_to_decide: { status: "unavailable"; reason: string };
}
export interface AgentStaminaRow {
  name: string; used: number | null; budget: number | null; rows: string[]; state: string | null; note: string | null;
}

export interface Dashboard {
  contract_version: number;
  generated_at: string;
  viewer: { email: string | null };
  panels: {
    waiting_on_daniel: Panel<WaitingFields>;
    queue: Panel<{ count: number; by_state: Record<string, number> }>;
    next_priority: Panel<{ note: string | null; items: { depth: number; text: string }[] }>;
    crazy_list: Panel<{ count: number; entries: { name: string; area: string; added: string; note: string; source: string }[] }>;
    workstream: Panel<{
      live: boolean; slug: string | null; orchestrator: string | null; deadline: string | null; seconds_left: number | null;
      agents: AgentStaminaRow[];
    }>;
    loops: Panel<{ count: number; items: { goal: string; status: string; node: string | null; folder: string }[] }>;
    open_work: Panel<{
      total: number; truncated: boolean; by_state: Record<string, number>; by_project: { project: string; count: number }[];
      in_progress: { short_id: string; name: string; project: string; assignee: string | null; updated_at: string; link: string | null }[];
    }>;
    open_prs: Panel<{
      total: number; truncated: boolean;
      items: { repo: string; number: number; title: string; url: string; author: string | null; draft: boolean; opened: string; escalated: boolean }[];
    }>;
    verifier_closes: Panel<{
      items: { row: string; project: string; at: string; run_id: string | null; work_item_id: string | null; link: string | null }[];
    }>;
    runtime_deploys: Panel<{
      /** null = cannot tell */
      current: boolean | null; installed_sha: string | null; origin_main_sha: string | null;
      items: { at: string; author: string; summary: string }[];
    }>;
    ci: Panel<{ checked: number; red: { repo: string; workflow: string; url: string | null }[] }>;
  };
}
export interface Queue { contract_version: number; generated_at: string; count: number; rows: QueueRow[] }

/* ---------- mock data: the contract's examples ---------- */
const EXAMPLE_DASHBOARD: Dashboard = {
  contract_version: 1,
  generated_at: "2026-10-15T14:02:11.482Z",
  viewer: { email: "daniel@novacaelum.com" },
  panels: {
    waiting_on_daniel: {
      status: "ok",
      count: 3,
      prs: {
        status: "ok",
        total: 2,
        groups: [{ repo: "technical-cofounder", items: [{ number: 53, title: "Codex compatibility build", url: "https://github.com/Nova-Caelum/technical-cofounder/pull/53", opened: "2026-10-14T18:40:00Z" }] }],
        repins: [{ repo: "Caelos", number: 37, url: "https://github.com/Nova-Caelum/Caelos/pull/37" }],
      },
      queue_status: "ok",
      queue_rows: [
        { id: "novacaelum-landing:landing-entrance-motion-ship-decision", short_id: "WEB-28", project: "novacaelum-landing", name: "Decide whether the landing entrance motion ships on the website", state: "ready", type: "decision", effort_level: "quick", updated_at: "2026-10-14T20:07:14.722Z", link: "https://console.novacaelum.com/taskgraph/projects/novacaelum-landing?tab=tasks&item=novacaelum-landing%3Alanding-entrance-motion-ship-decision" },
      ],
      rows_to_decide: { status: "unavailable", reason: "Verifier 'unverifiable' verdicts live in Mac-only run files; no cloud source yet." },
    },
    queue: { status: "ok", count: 1, by_state: { ready: 1 } },
    next_priority: { status: "ok", note: "1) Main Quest", items: [{ depth: 0, text: "Main Quest - Governance Sprint" }, { depth: 1, text: "Finish Nova Comms" }] },
    crazy_list: { status: "ok", count: 1, entries: [{ name: "stale-runtime-warning", area: "preload", added: "2026-10-13", note: "Warns about a stale runtime that is not stale.", source: "daniel" }] },
    workstream: { status: "ok", live: true, slug: "stream_2026-10-12-1700_cleanup", orchestrator: "cto", deadline: "2026-10-16T03:59:00.000Z", seconds_left: 90000, agents: [{ name: "da-vinci", used: 2, budget: 4, rows: ["9b", "9a"], state: "handed-off", note: "v3 on local branch" }] },
    loops: { status: "ok", count: 1, items: [{ goal: "tc-setup-redesign", status: "live", node: "executing", folder: "AgentSecretBase/workspace/technical-cofounder/tc-setup-redesign" }] },
    open_work: { status: "ok", total: 214, truncated: false, by_state: { ready: 150, "in-progress": 12, blocked: 40, "pending-review": 12 }, by_project: [{ project: "governance-evolution", count: 80 }], in_progress: [{ short_id: "TCF-49", name: "TC on Codex friend test", project: "technical-cofounder", assignee: "daniel", updated_at: "2026-10-14T20:12:55.096Z", link: "https://console.novacaelum.com/taskgraph/projects/technical-cofounder?tab=tasks&item=technical-cofounder%3Atc-codex-friend-test" }] },
    open_prs: { status: "ok", total: 1, truncated: false, items: [{ repo: "technical-cofounder", number: 53, title: "Codex compatibility build", url: "https://github.com/Nova-Caelum/technical-cofounder/pull/53", author: "NovaCaelum-Founder", draft: false, opened: "2026-10-14T18:40:00Z", escalated: true }] },
    verifier_closes: { status: "ok", items: [{ row: "governance-evolution:move-launcher-scripts", project: "governance-evolution", at: "2026-10-14T21:21:13.046Z", run_id: "0636126a-c9bb-4998-8ad2-4f3bba3a1666", work_item_id: "a428e538-1b6e-4270-b114-4be2fcdd13b9", link: "https://console.novacaelum.com/taskgraph/projects/governance-evolution?tab=tasks&item=governance-evolution%3Amove-launcher-scripts" }] },
    runtime_deploys: { status: "ok", current: false, installed_sha: "68e2539", origin_main_sha: "9c1f0ab", items: [{ at: "2026-10-08T17:51:02.172Z", author: "devops-local", summary: "Applied deploy-claude_mac from origin/main 68e2539" }] },
    ci: { status: "ok", checked: 18, red: [{ repo: "hyperspace-engine", workflow: "tests", url: "https://github.com/Nova-Caelum/hyperspace-engine/actions/runs/1" }] },
  },
};
const EXAMPLE_QUEUE: Queue = {
  contract_version: 1,
  generated_at: "2026-10-15T14:02:11.482Z",
  count: 1,
  rows: [
    { id: "novacaelum-landing:landing-entrance-motion-ship-decision", short_id: "WEB-28", project: "novacaelum-landing", name: "Decide whether the landing entrance motion ships on the website", state: "ready", type: "decision", effort_level: "quick", updated_at: "2026-10-14T20:07:14.722Z", link: "https://console.novacaelum.com/taskgraph/projects/novacaelum-landing?tab=tasks&item=novacaelum-landing%3Alanding-entrance-motion-ship-decision", created_at: "2026-10-14T20:07:14.754Z", description: "Go: https://landing-motion.novacaelum-landing.pages.dev\nLook: the entrance animation on first load.\nSend: say ship (rebase and PR) or drop.", acceptance_criteria: "Daniel states ship or drop [manual]", source_references: [{ uri: "https://landing-motion.novacaelum-landing.pages.dev", anchor: "preview" }], team: ["daniel", "da-vinci"] },
  ],
};

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
/** Mock only: `?dashboard_mock=mixed` makes one panel error and one unavailable, to exercise the per-panel states. */
const mixedMock = () => !LIVE && new URLSearchParams(window.location.search).get("dashboard_mock") === "mixed";

/** Same-origin GET. No credentials are attached beyond the browser's own cookie. */
async function getJson<T extends { contract_version: number }>(path: string): Promise<T> {
  const response = await fetch(path, { method: "GET", credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) {
    // The contract's error body is { error: '<type>' }; carry the type, never the response text.
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `http_${response.status}`);
  }
  const json = await response.json() as T;
  if (json.contract_version !== CONTRACT_VERSION) throw new Error("contract_version_mismatch");
  return json;
}

let dashboardCalls = 0;
let queueRows = EXAMPLE_QUEUE.rows.slice();
let completeFailedOnce = false;

/** GET /api/dashboard */
export async function fetchDashboard(): Promise<Dashboard> {
  if (LIVE) return getJson<Dashboard>("/api/dashboard");
  await wait(900);
  dashboardCalls += 1;
  // Mock only: every third call fails as a whole, so the Refresh error and Retry state is reachable.
  if (dashboardCalls % 3 === 0) throw new Error("mock_request_failed");
  const data = structuredClone(EXAMPLE_DASHBOARD);
  if (mixedMock()) {
    data.panels.loops = { status: "error", error: "UpstreamTimeout" };
    data.panels.crazy_list = { status: "unavailable", reason: "No cloud source for the crazy list yet." };
  }
  return data;
}

/** GET /api/queue: open Task Graph rows assigned to daniel, with full descriptions. */
export async function fetchQueue(): Promise<Queue> {
  if (LIVE) return getJson<Queue>("/api/queue");
  await wait(500);
  const rows = structuredClone(queueRows);
  return { ...structuredClone(EXAMPLE_QUEUE), count: rows.length, rows };
}

/** POST /api/queue/complete: marks one of Daniel's own open rows done (state = done, nothing else). */
export interface CompleteResponse { ok: true; id: string; state: "done"; already_done: boolean }
export async function completeQueueItem(id: string): Promise<CompleteResponse> {
  if (LIVE) {
    const response = await fetch("/api/queue/complete", {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      // Error bodies are { error: '<type>' } (bad_request, not_your_row, row_not_found, row_not_open, ops_*, ...).
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error ?? `http_${response.status}`);
    }
    return await response.json() as CompleteResponse;
  }
  await wait(1100);
  // Mock only: the first attempt fails so the row error and Retry state is reachable.
  if (!completeFailedOnce) { completeFailedOnce = true; throw new Error("mock_complete_failed"); }
  queueRows = queueRows.filter(row => row.id !== id);
  return { ok: true, id, state: "done", already_done: false };
}
