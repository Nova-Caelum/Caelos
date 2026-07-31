// Nova Caelum — Task Management Dashboard
import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Toaster } from "sonner";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SelectPrimitive from "@radix-ui/react-select";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from "@/app/components/ui/context-menu";
import {
  Select, SelectContent, SelectItem, SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";
import {
  Plus, ChevronLeft, ChevronRight, ChevronDown, Edit2, Copy, Archive, ArchiveRestore, X,
  Search, Link2, Unlink, Calendar, Layers, Target, FolderOpen,
  Hash, Zap, ArrowRight, TrendingUp, AlertTriangle,
  GripVertical, FileText, Folder, Users, UserPlus, Atom,
  Settings, FolderInput,
} from "lucide-react";
import { GlassSeparator } from "./components/ui/glass-separator";
import wordmarkUrl from "@/imports/nova-caelum-wordmark-transparent.png";
import { NC } from "../design/tokens";
import { ProjectViewLayeredShell } from "./ProjectViewLayeredShell";
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from "../primitives";

// ── Types ──────────────────────────────────────────────────────────────────────

// Set A — task_workflow_state (work_items, modules)
type WorkItemState = "pending-review" | "ready" | "in-progress" | "blocked" | "done" | "deferred" | "archived";
// Set B — project_lifecycle_state (projects, initiatives, cycles)
export type ProjectStatus    = "planned" | "in-progress" | "paused" | "completed" | "closed" | "archived";
type InitiativeStatus = ProjectStatus;
type CycleStatus       = ProjectStatus;

export type Project  = { id: string; name: string; description: string; folder_path: string; created_at: string; status: ProjectStatus; team: string[]; owner: string; client: string };
type Mod      = { id: string; project_id: string; name: string; folder_path: string; description: string; state: WorkItemState; team: string[]; parent_module_id?: string | null };
type Cycle    = { id: string; project_id: string; name: string; start_date: string; end_date: string; state: CycleStatus; description: string };

type WorkItemPriority = "none" | "low" | "medium" | "high" | "urgent";

type WorkItem = {
  id: string; uuid?: string; project_id: string; module_id?: string | null; parent_item_id?: string | null;
  cycle_id?: string | null; title: string; description: string;
  state: WorkItemState; priority: WorkItemPriority; assignee: string; team: string[];
  blocked_by: string[]; doc_paths: string[]; source_references: unknown;
};

type Initiative = { id: string; external_id: string; title: string; description: string; state: InitiativeStatus; doc_paths: string[] };
type InitLinks  = { project_ids: string[]; module_ids: string[]; work_item_ids: string[] };

// get_recent_activity entry shape (post-migration; author is TEXT, work_item_id is the anchor)
type WorklogEntry = { id: string; author: string; project?: string; summary: string; detailed?: string; created_at: string; work_item_id?: string | null };

// Agent registry row (advisory source for dropdowns — list_agents MCP tool)
type Agent = { agent_name: string; harness: string; substrate: string; team: string; tier: string; proposed_lifecycle: string; can_spawn: boolean };

type ProjectMember = { id: string; project_id: string; name: string };

// ROSTER hardcoded const — DELETED (2026-07-27 bi-directional MVP). Replaced by useAgents() below,
// which fetches the live agent_registry via the `list_agents` MCP tool and caches per session.

type Selection =
  | { type: "project"; item: Project }
  | { type: "initiative"; item: Initiative }
  | null;

export const FOUNDRY_DEMO_PROJECT: Project = {
  id: "foundry-project",
  name: "Foundry calibration",
  description: "A populated workspace for evaluating every surface, state, and primitive in context.",
  folder_path: "/projects/foundry-calibration",
  created_at: "2026-07-30T00:00:00.000Z",
  status: "in-progress",
  team: ["Da Vinci", "Codex"],
  owner: "Daniel Eghdami",
  client: "Nova Caelum",
};

const FOUNDRY_DEMO_INITIATIVE: Initiative = {
  id: "foundry-initiative",
  external_id: "INIT-FOUNDRY",
  title: "Foundry v2 evaluation",
  description: "Cross-surface design-system evaluation with staged promotion and preview review.",
  state: "in-progress",
  doc_paths: [],
};

const FOUNDRY_DEMO_MODULES: Mod[] = [{
  id: "foundry-module",
  project_id: FOUNDRY_DEMO_PROJECT.id,
  name: "Foundry authoring pipeline",
  folder_path: "/projects/foundry-calibration/modules/authoring-pipeline",
  description: "A complete module specimen for validating hierarchy, states, and drawer surfaces.",
  state: "in-progress",
  team: ["Da Vinci", "Codex"],
}];

const FOUNDRY_DEMO_CYCLES: Cycle[] = [{
  id: "foundry-cycle",
  project_id: FOUNDRY_DEMO_PROJECT.id,
  name: "Seed evaluation",
  start_date: "2026-07-28",
  end_date: "2026-08-04",
  state: "in-progress",
  description: "Visual QA across all Foundry layers before preview review.",
}];

const FOUNDRY_DEMO_ITEMS: WorkItem[] = [
  {
    id: "foundry-task-graph",
    project_id: FOUNDRY_DEMO_PROJECT.id,
    module_id: FOUNDRY_DEMO_MODULES[0].id,
    cycle_id: FOUNDRY_DEMO_CYCLES[0].id,
    title: "Evaluate graph-ground hierarchy",
    description: "Check the 28px crosshatch at every surface boundary and content density.",
    state: "ready",
    priority: "high",
    assignee: "Da Vinci",
    team: ["Design"],
    blocked_by: [],
    doc_paths: [],
    source_references: {},
  },
  {
    id: "foundry-task-glass",
    project_id: FOUNDRY_DEMO_PROJECT.id,
    module_id: FOUNDRY_DEMO_MODULES[0].id,
    cycle_id: FOUNDRY_DEMO_CYCLES[0].id,
    title: "Inspect elevated glass drawer",
    description: "Verify translucent fill, blur, and foreground legibility over realistic content.",
    state: "in-progress",
    priority: "urgent",
    assignee: "Codex",
    team: ["Engineering"],
    blocked_by: [],
    doc_paths: [],
    source_references: {},
  },
  {
    id: "foundry-task-preview",
    project_id: FOUNDRY_DEMO_PROJECT.id,
    title: "Review branch preview",
    description: "Compare staging and branch preview before Daniel merges the promotion PR.",
    state: "pending-review",
    priority: "medium",
    assignee: "Daniel Eghdami",
    team: ["Product"],
    blocked_by: [],
    doc_paths: [],
    source_references: {},
  },
];

// ── Keyboard hooks ─────────────────────────────────────────────────────────────

function useCmdEnter(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); callback(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callback, enabled]);
}

// ── In-memory mock store ───────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

const store = {
  projects:    [] as Project[],
  workItems:   [] as WorkItem[],
  modules:     [] as Mod[],
  cycles:      [] as Cycle[],
  initiatives: [] as Initiative[],
  initLinks:   {} as Record<string, InitLinks>,
  members:     [] as ProjectMember[],
  worklogs:    [
    { id: "70ff5506_07-26-26", entity_type: "project", entity_id: "__all__", note: "", created_at: "2026-07-26T00:00:00.000Z" },
  ] as WorklogEntry[],
};

function getLinks(initId: string): InitLinks {
  return store.initLinks[initId] ?? { project_ids: [], module_ids: [], work_item_ids: [] };
}

// ── Real backend adapter (Nova Task Graph MVP, VITE_API_BASE_URL) ─────────────
// If VITE_API_BASE_URL is unset (local dev), falls through to mockApi below.

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
const BEARER = import.meta.env.VITE_BEARER_TOKEN as string | undefined;

// Enum-translation layer killed (2026-07-27) — backend v0.6.1 emits hyphenated Set A / Set B
// values directly (task_workflow_state / project_lifecycle_state). No underscore form anywhere.

function idempKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function slugify(s: string): string {
  const slug = s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);
  return slug || uid();
}

function adaptProjectRead(x: any): Project {
  return {
    id: x.code ?? x.id ?? "",
    name: x.name ?? "",
    description: x.description ?? "",
    folder_path: x.folder_path ?? "",
    created_at: x.created_at ?? "",
    status: (x.status as ProjectStatus) ?? "planned",
    team: Array.isArray(x.team) ? x.team : [],
    owner: x.owner ?? "",
    client: x.client ?? "",
  };
}
function adaptWorkItemRead(x: any): WorkItem {
  return {
    id: x.external_id ?? x.id ?? "",
    uuid: x.id ?? undefined,
    project_id: x.project_code ?? x.project_id ?? "",
    module_id: x.module_id ?? null,
    parent_item_id: x.parent_work_item_id ?? x.parent_item_id ?? null,
    cycle_id: null,
    title: x.name ?? x.title ?? "",
    description: x.description ?? "",
    state: (x.state as WorkItemState) ?? "pending-review",
    priority: (x.priority as WorkItemPriority) ?? "none",
    assignee: x.assignee_agent ?? x.assignee ?? "",
    team: Array.isArray(x.team) ? x.team : [],
    blocked_by: x.blocked_by ?? [],
    doc_paths: x.doc_paths ?? [],
    source_references: x.source_references ?? null,
  };
}
function adaptModuleRead(x: any): Mod {
  return {
    id: x.external_id ?? x.id ?? "",
    project_id: x.project_code ?? x.project_id ?? "",
    name: x.name ?? "",
    folder_path: x.folder_path ?? "",
    description: x.description ?? "",
    state: (x.state as WorkItemState) ?? "pending-review",
    team: Array.isArray(x.team) ? x.team : [],
    parent_module_id: x.parent_module_id ?? null,
  };
}
function adaptCycleRead(x: any): Cycle {
  return {
    id: x.external_id ?? x.id ?? "",
    project_id: x.project_code ?? x.project_id ?? "",
    name: x.name ?? "",
    start_date: x.start_date ?? "",
    end_date: x.end_date ?? "",
    state: (x.state as CycleStatus) ?? "planned",
    description: x.description ?? "",
  };
}
function adaptInitiativeRead(x: any): Initiative {
  return {
    id: x.external_id ?? x.id ?? "",
    external_id: x.external_id ?? x.id ?? "",
    title: x.title ?? x.name ?? "",
    description: x.description ?? "",
    state: (x.state as InitiativeStatus) ?? "planned",
    doc_paths: x.doc_paths ?? [],
  };
}

// ── MCP transport (Path B — mutations routed through /mcp, not REST PATCH/DELETE) ──────

async function mcpCall<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BEARER) headers.Authorization = `Bearer ${BEARER}`;
  const response = await fetch(`${API_BASE}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`MCP ${name} → ${response.status}: ${text.slice(0, 200)}`);
  }
  const data = await response.json();
  if (data?.error) throw new Error(`MCP ${name} error: ${JSON.stringify(data.error).slice(0, 200)}`);
  const raw = data?.result?.content?.[0]?.text;
  if (raw === undefined) return data?.result as T;
  try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
}

// ── Agent registry (list_agents) — fetched once per session, cached module-level ───────

let agentsCache: Agent[] | null = null;
let agentsInFlight: Promise<Agent[]> | null = null;

async function fetchAgentsOnce(): Promise<Agent[]> {
  if (agentsCache) return agentsCache;
  if (!API_BASE) { agentsCache = []; return agentsCache; }
  if (!agentsInFlight) {
    agentsInFlight = mcpCall<Agent[]>("list_agents", {})
      .then(agents => { agentsCache = Array.isArray(agents) ? agents : []; return agentsCache; })
      .catch(() => { agentsCache = []; return agentsCache as Agent[]; })
      .finally(() => { agentsInFlight = null; });
  }
  return agentsInFlight;
}

function useAgents(): { agents: Agent[]; loading: boolean; error?: string } {
  const [agents, setAgents] = useState<Agent[]>(agentsCache ?? []);
  const [loading, setLoading] = useState(!agentsCache);
  const [error, setError] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (agentsCache) { setAgents(agentsCache); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetchAgentsOnce()
      .then(a => { if (!cancelled) { setAgents(a); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);
  return { agents, loading, error };
}

// Path B: mutations (create/patch/archive) route through POST ${API_BASE}/mcp calling
// upsert_*/update_project/etc tools directly, instead of duplicating REST PATCH/DELETE
// routes. Reads stay on the REST facade (/api/*), which is cheaper for list views.
async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  // Dev fallback: no backend configured → in-memory mock
  if (!API_BASE) return mockApi<T>(path, opts);

  const method = opts?.method ?? "GET";
  const body = opts?.body ? JSON.parse(opts.body as string) : undefined;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BEARER) headers.Authorization = `Bearer ${BEARER}`;

  async function restFetch(backendPath: string, backendBody?: any): Promise<any> {
    const response = await fetch(`${API_BASE}${backendPath}`, {
      method,
      headers,
      body: (method !== "GET" && method !== "DELETE" && backendBody !== undefined) ? JSON.stringify(backendBody) : undefined,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`${method} ${backendPath} → ${response.status}: ${text.slice(0, 200)}`);
    }
    if (response.status === 204) return undefined;
    return response.json();
  }
  // MCP tool responses are always {status, row} on writes (verified against
  // work_graph_contracts.py handlers 2026-07-27) — unwrap .row when present.
  const unwrapRow = (d: any) => (d && typeof d === "object" && "row" in d) ? d.row : d;

  // === Special-case routes with NO backend surface (client-served) ===
  // Members: sourced from the live agent registry (list_agents), not the deleted ROSTER const.
  const mem = path.match(/^\/projects\/([^/]+)\/members(?:\/([^/]+))?$/);
  if (mem) {
    if (method === "GET" && !mem[2]) {
      const agents = await fetchAgentsOnce();
      return agents.map(a => ({
        id: `member-${a.agent_name}`, project_id: mem[1], name: a.agent_name,
      })) as T;
    }
    if (method === "POST") {
      return { id: `member-${body?.name ?? "x"}`, project_id: mem[1], name: body?.name ?? "" } as T;
    }
    return (method === "DELETE" ? undefined : (body ?? {})) as T;
  }

  // Worklogs — cross-project fetch via get_recent_activity; ActivityButton filters client-side
  // per Context #6 (get_activity_for_entity MCP tool not yet built — see NovaTaskGraphTargetState §5.5).
  if (path === "/worklogs" && method === "GET") {
    return (await mcpCall<WorklogEntry[]>("get_recent_activity", { limit: 500 })) as T;
  }
  if (path === "/worklogs" && method === "POST") {
    const args: Record<string, unknown> = { author: body.author, project: body.project, summary: body.summary };
    if (body.work_item_id) args.work_item_id = body.work_item_id;
    if (body.detailed) args.detailed = body.detailed;
    return (await mcpCall<any>("append_worklog", args)) as T;
  }

  if (/^\/initiatives\/[^/]+\/links$/.test(path) && method === "GET") {
    return { project_ids: [], module_ids: [], work_item_ids: [] } as T;
  }

  // === Projects ===
  if (path === "/projects" && method === "GET") {
    return ((await restFetch("/api/projects")) as any[]).map(adaptProjectRead) as T;
  }
  if (path === "/projects" && method === "POST") {
    const code = body.code || slugify(body.name ?? "project");
    const args: Record<string, unknown> = { code, name: body.name ?? "Untitled" };
    if (body.description) args.description = body.description;
    if (body.folder_path) args.folder_path = body.folder_path;
    if (body.status) args.status = body.status;
    if (body.team) args.team = body.team;
    const r = await mcpCall<any>("add_project", args);
    return adaptProjectRead(unwrapRow(r)) as T;
  }
  const projMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projMatch && method === "PATCH") {
    const args: Record<string, unknown> = { code: projMatch[1] };
    for (const k of ["name", "description", "status", "team", "folder_path", "owner", "client", "next_action", "parent_code"]) {
      if (body[k] !== undefined) args[k] = body[k];
    }
    const r = await mcpCall<any>("upsert_project", args);
    return adaptProjectRead(unwrapRow(r)) as T;
  }
  if (projMatch && method === "DELETE") {
    await mcpCall("upsert_project", { code: projMatch[1], status: "archived" });
    return undefined as T;
  }

  // === Work items / modules / cycles — list + create (REST facade; unchanged shape) ===
  if (/^\/projects\/[^/]+\/(work-items|modules|cycles)$/.test(path)) {
    const kind = path.match(/(work-items|modules|cycles)$/)![1] as "work-items" | "modules" | "cycles";
    if (method === "GET") {
      const data = (await restFetch(`/api${path}`)) as any[];
      if (kind === "work-items") return data.map(adaptWorkItemRead) as T;
      if (kind === "modules") return data.map(adaptModuleRead) as T;
      return data.map(adaptCycleRead) as T;
    }
    if (method === "POST") {
      let backendBody: any;
      if (kind === "work-items") {
        backendBody = {
          external_id: body.external_id ?? idempKey("wi"),
          name: body.title ?? body.name ?? "Untitled",
          type: body.type ?? "task",
          state: body.state ?? "pending-review",
          description: body.description || null,
          assignee_agent: body.assignee || body.assignee_agent || null,
          team: body.team ?? [],
          idempotency_key: idempKey("idem"),
        };
      } else if (kind === "modules") {
        backendBody = {
          external_id: body.external_id ?? idempKey("mod"),
          name: body.name ?? "Untitled",
          description: body.description || null,
          state: body.state ?? "pending-review",
          team: body.team ?? [],
          folder_path: body.folder_path || null,
          idempotency_key: idempKey("idem"),
        };
      } else {
        backendBody = {
          external_id: body.external_id ?? idempKey("cy"),
          name: body.name ?? "Untitled",
          description: body.description || null,
          state: body.state ?? "planned",
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          idempotency_key: idempKey("idem"),
        };
      }
      const data = await restFetch(`/api${path}`, backendBody);
      const row = unwrapRow(data);
      if (kind === "work-items") return adaptWorkItemRead(row) as T;
      if (kind === "modules") return adaptModuleRead(row) as T;
      return adaptCycleRead(row) as T;
    }
  }

  // === Work items — patch/archive (REST partial-patch; /api/work-items/{id} is a true PATCH) ===
  const wiMatch = path.match(/^\/work-items\/([^/]+)$/);
  if (wiMatch && (method === "PATCH" || method === "DELETE")) {
    const external_id = wiMatch[1];
    // Backend has NO DELETE handler on /api/work-items/{id} — archive = PATCH state.
    // restFetch would strip the body on DELETE (line 348), producing an empty DELETE
    // request that 404s. Bypass by issuing an explicit PATCH here.
    if (method === "DELETE") {
      const resp = await fetch(`${API_BASE}/api/work-items/${external_id}`, {
        method: "PATCH", headers, body: JSON.stringify({ state: "archived" }),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`PATCH archive /api/work-items/${external_id} → ${resp.status}: ${text.slice(0, 200)}`);
      }
      return adaptWorkItemRead(unwrapRow(await resp.json())) as T;
    }
    const patchBody: Record<string, unknown> = {};
    {
      if (body.title !== undefined) patchBody.name = body.title;
      if (body.name !== undefined) patchBody.name = body.name;
      if (body.description !== undefined) patchBody.description = body.description;
      if (body.state !== undefined) patchBody.state = body.state;
      if (body.assignee !== undefined) patchBody.assignee_agent = body.assignee || null;
      if (body.assignee_agent !== undefined) patchBody.assignee_agent = body.assignee_agent;
      if (body.team !== undefined) patchBody.team = body.team;
      if (body.module_id !== undefined) patchBody.module = body.module_id;
      if (body.project_id !== undefined) patchBody.project = body.project_id;
      if (body.parent_item_id !== undefined) patchBody.parent_work_item = body.parent_item_id;
      // TODO(bi-dir-mvp): blocked_by / cycle_id / doc_paths / priority are not backend-mutable
      // fields on PATCH /api/work-items/{id} (blocked_by needs link_work_items/unlink_work_items;
      // cycle_id needs assign_cycle_work_items — out of Phase 4 scope, flagged for Phase 5+).
      // NOTE (2026-07-31): `project` mutation on this PATCH is empirically untested against
      // the ops-server contract. If backend rejects/ignores, moveTask_ will surface the error.
    }
    if (Object.keys(patchBody).length === 0) return {} as T;
    const data = await restFetch(`/api/work-items/${external_id}`, patchBody);
    return adaptWorkItemRead(unwrapRow(data)) as T;
  }

  if (/^\/work-items\/[^/]+\/promote$/.test(path) && method === "POST") {
    const backendPath = path.replace(/\/promote$/, "/promote-to-module").replace(/^\/work-items/, "/api/work-items");
    const backendBody = { module_name: body?.module_name ?? body?.name ?? "New module", idempotency_key: idempKey("idem") };
    const data = await restFetch(backendPath, backendBody);
    return adaptModuleRead(unwrapRow(data)) as T;
  }

  // === Cycle assignment (Path B — /mcp assign_cycle_work_items) ===
  const cycleAssignMatch = path.match(/^\/projects\/([^/]+)\/cycles\/([^/]+)\/work-items$/);
  if (cycleAssignMatch && method === "POST") {
    const [, project, cycle] = cycleAssignMatch;
    const work_items: string[] = body?.work_items ?? (body?.work_item_id ? [body.work_item_id] : []);
    await mcpCall("assign_cycle_work_items", { project, cycle, work_items, idempotency_key: idempKey("cyassign") });
    return undefined as T;
  }

  // === Cycles — patch/archive (Path B — /mcp upsert_cycle; FULL-REPLACE semantics —
  // caller must pass name + all current fields, not just the delta) ===
  const cycleMatch = path.match(/^\/projects\/([^/]+)\/cycles\/([^/]+)$/);
  if (cycleMatch && (method === "PATCH" || method === "DELETE")) {
    const [, project, external_id] = cycleMatch;
    const args: Record<string, unknown> = {
      project, external_id,
      name: body?.name ?? "Untitled",
      description: body?.description ?? null,
      state: method === "DELETE" ? "archived" : (body?.state ?? "planned"),
      start_date: body?.start_date || null,
      end_date: body?.end_date || null,
      idempotency_key: idempKey("cy"),
    };
    const r = await mcpCall<any>("upsert_cycle", args);
    return adaptCycleRead(unwrapRow(r)) as T;
  }

  // === Modules — patch/archive (Path B — /mcp upsert_module; FULL-REPLACE semantics —
  // caller must include project code in body since /modules/{id} carries no project scope) ===
  const modMatch = path.match(/^\/modules\/([^/]+)$/);
  if (modMatch && (method === "PATCH" || method === "DELETE")) {
    const external_id = modMatch[1];
    const project = body?.project_id ?? body?.project;
    if (!project) throw new Error("Module PATCH/DELETE requires project_id in body (adapter routing — Path B)");
    const args: Record<string, unknown> = {
      project, external_id,
      name: body?.name ?? "Untitled",
      description: body?.description ?? null,
      state: method === "DELETE" ? "archived" : (body?.state ?? "pending-review"),
      team: body?.team ?? [],
      folder_path: body?.folder_path ?? null,
      idempotency_key: idempKey("mod"),
    };
    if (body?.parent_module_id) args.parent_module = body.parent_module_id;
    const r = await mcpCall<any>("upsert_module", args);
    return adaptModuleRead(unwrapRow(r)) as T;
  }

  // === Initiatives ===
  if (path === "/initiatives" && method === "GET") {
    return ((await restFetch("/api/initiatives")) as any[]).map(adaptInitiativeRead) as T;
  }
  if (path === "/initiatives" && method === "POST") {
    const backendBody = {
      external_id: body.external_id || idempKey("init"),
      title: body.title ?? "Untitled",
      description: body.description || null,
      state: body.state ?? "planned",
      idempotency_key: idempKey("idem"),
    };
    const data = await restFetch("/api/initiatives", backendBody);
    return adaptInitiativeRead(unwrapRow(data)) as T;
  }
  const initMatch = path.match(/^\/initiatives\/([^/]+)$/);
  if (initMatch && (method === "PATCH" || method === "DELETE")) {
    const external_id = initMatch[1];
    const patchBody: Record<string, unknown> = {};
    if (method === "DELETE") patchBody.state = "archived";
    else {
      if (body.title !== undefined) patchBody.title = body.title;
      if (body.description !== undefined) patchBody.description = body.description;
      if (body.state !== undefined) patchBody.state = body.state;
      if (body.doc_paths !== undefined) patchBody.doc_paths = body.doc_paths;
    }
    const data = await restFetch(`/api/initiatives/${external_id}`, patchBody);
    return adaptInitiativeRead(unwrapRow(data)) as T;
  }
  if (/^\/initiatives\/[^/]+\/links$/.test(path) && method === "POST") {
    const data = await restFetch(`/api${path}`, { ...body, idempotency_key: idempKey("idem") });
    return data as T;
  }
  if (/^\/initiatives\/[^/]+\/links\/[^/]+\/[^/]+$/.test(path) && method === "DELETE") {
    const data = await restFetch(`/api${path}`);
    return data as T;
  }

  throw new Error(`Backend route not built: ${method} ${path}`);
}

async function mockApi<T>(path: string, opts?: RequestInit): Promise<T> {
  await new Promise(r => setTimeout(r, 40));
  const method = opts?.method ?? "GET";
  const body = opts?.body ? JSON.parse(opts.body as string) : undefined;

  // IMPORTANT: all GET routes return shallow copies to prevent reference aliasing
  if (path === "/projects" && method === "GET")
    return store.projects.map(p => ({ ...p })) as T;
  if (path === "/projects" && method === "POST") {
    const p: Project = { id: uid(), created_at: new Date().toISOString(), folder_path: "", description: "", status: "planned", team: [], owner: "", client: "", ...body };
    store.projects.push(p); return { ...p } as T;
  }
  if (/^\/projects\/[^/]+$/.test(path) && method === "PATCH") {
    const id = path.split("/")[2];
    const idx = store.projects.findIndex(p => p.id === id);
    store.projects[idx] = { ...store.projects[idx], ...body };
    return { ...store.projects[idx] } as T;
  }
  if (/^\/projects\/[^/]+$/.test(path) && method === "DELETE") {
    // Soft-archive to mirror real backend behavior (per work_graph_contracts.py) — enables local
    // Archived-view testing. Callers ignore the return; we still filter store to avoid ghost rows.
    const id = path.split("/")[2];
    const idx = store.projects.findIndex(p => p.id === id);
    if (idx >= 0) store.projects[idx] = { ...store.projects[idx], status: "archived" };
    return undefined as T;
  }

  if (/^\/projects\/[^/]+\/work-items$/.test(path) && method === "GET") {
    const pid = path.split("/")[2];
    return store.workItems.filter(w => w.project_id === pid).map(w => ({ ...w, blocked_by: [...w.blocked_by], doc_paths: [...w.doc_paths] })) as T;
  }
  if (/^\/projects\/[^/]+\/work-items$/.test(path) && method === "POST") {
    const pid = path.split("/")[2];
    const w: WorkItem = { id: uid(), project_id: pid, blocked_by: [], doc_paths: [], source_references: null, ...body };
    store.workItems.push(w); return { ...w } as T;
  }
  if (/^\/work-items\/[^/]+$/.test(path) && method === "PATCH") {
    const id = path.split("/")[2];
    const idx = store.workItems.findIndex(w => w.id === id);
    store.workItems[idx] = { ...store.workItems[idx], ...body };
    return { ...store.workItems[idx] } as T;
  }
  if (/^\/work-items\/[^/]+$/.test(path) && method === "DELETE") {
    const id = path.split("/")[2];
    store.workItems = store.workItems.filter(w => w.id !== id);
    return undefined as T;
  }
  if (/^\/work-items\/[^/]+\/promote$/.test(path) && method === "POST") {
    const id = path.split("/")[2];
    const task = store.workItems.find(w => w.id === id);
    if (!task) throw new Error("Not found");
    const mod: Mod = { id: task.id, project_id: task.project_id, name: task.title, folder_path: "", description: "" };
    store.modules.push(mod);
    store.workItems = store.workItems
      .filter(w => w.id !== task.id)
      .map(w => w.parent_item_id === task.id ? { ...w, parent_item_id: null, module_id: task.id } : w);
    return { ...mod } as T;
  }

  if (/^\/projects\/[^/]+\/modules$/.test(path) && method === "GET") {
    const pid = path.split("/")[2];
    return store.modules.filter(m => m.project_id === pid).map(m => ({ ...m })) as T;
  }
  if (/^\/projects\/[^/]+\/modules$/.test(path) && method === "POST") {
    const pid = path.split("/")[2];
    const m: Mod = { id: uid(), project_id: pid, folder_path: "", description: "", ...body };
    store.modules.push(m); return { ...m } as T;
  }
  if (/^\/modules\/[^/]+$/.test(path) && method === "PATCH") {
    const id = path.split("/")[2];
    const idx = store.modules.findIndex(m => m.id === id);
    store.modules[idx] = { ...store.modules[idx], ...body };
    return { ...store.modules[idx] } as T;
  }
  if (/^\/modules\/[^/]+$/.test(path) && method === "DELETE") {
    const id = path.split("/")[2];
    store.modules = store.modules.filter(m => m.id !== id);
    return undefined as T;
  }

  if (/^\/projects\/[^/]+\/cycles$/.test(path) && method === "GET") {
    const pid = path.split("/")[2];
    return store.cycles.filter(c => c.project_id === pid).map(c => ({ ...c })) as T;
  }
  if (/^\/projects\/[^/]+\/cycles$/.test(path) && method === "POST") {
    const pid = path.split("/")[2];
    const c: Cycle = { id: uid(), project_id: pid, ...body };
    store.cycles.push(c); return { ...c } as T;
  }
  if (/^\/projects\/[^/]+\/cycles\/[^/]+$/.test(path) && method === "PATCH") {
    const id = path.split("/")[4];
    const idx = store.cycles.findIndex(c => c.id === id);
    store.cycles[idx] = { ...store.cycles[idx], ...body };
    return { ...store.cycles[idx] } as T;
  }
  if (/^\/projects\/[^/]+\/cycles\/[^/]+$/.test(path) && method === "DELETE") {
    const id = path.split("/")[4];
    store.cycles = store.cycles.filter(c => c.id !== id);
    return undefined as T;
  }

  if (path === "/initiatives" && method === "GET")
    return store.initiatives.map(i => ({ ...i, doc_paths: [...i.doc_paths] })) as T;
  if (path === "/initiatives" && method === "POST") {
    const i: Initiative = { id: uid(), doc_paths: [], ...body };
    store.initiatives.push(i); return { ...i } as T;
  }
  if (/^\/initiatives\/[^/]+$/.test(path) && method === "PATCH") {
    const id = path.split("/")[2];
    const idx = store.initiatives.findIndex(i => i.id === id);
    store.initiatives[idx] = { ...store.initiatives[idx], ...body };
    return { ...store.initiatives[idx] } as T;
  }
  if (/^\/initiatives\/[^/]+$/.test(path) && method === "DELETE") {
    // Soft-archive to mirror real backend behavior — enables local Archived-view testing.
    const id = path.split("/")[2];
    const idx = store.initiatives.findIndex(i => i.id === id);
    if (idx >= 0) store.initiatives[idx] = { ...store.initiatives[idx], state: "archived" };
    return undefined as T;
  }

  if (/^\/initiatives\/[^/]+\/links$/.test(path) && method === "GET") {
    const l = getLinks(path.split("/")[2]);
    return { project_ids: [...l.project_ids], module_ids: [...l.module_ids], work_item_ids: [...l.work_item_ids] } as T;
  }
  if (/^\/initiatives\/[^/]+\/links$/.test(path) && method === "POST") {
    const id = path.split("/")[2];
    const cur = getLinks(id);
    store.initLinks[id] = {
      project_ids:   [...new Set([...cur.project_ids,   ...(body.project_ids   ?? [])])],
      module_ids:    [...new Set([...cur.module_ids,    ...(body.module_ids    ?? [])])],
      work_item_ids: [...new Set([...cur.work_item_ids, ...(body.work_item_ids ?? [])])],
    };
    return undefined as T;
  }
  if (/^\/initiatives\/[^/]+\/links\/project\/[^/]+$/.test(path) && method === "DELETE") {
    const p = path.split("/"); const cur = getLinks(p[2]);
    store.initLinks[p[2]] = { ...cur, project_ids: cur.project_ids.filter(x => x !== p[5]) };
    return undefined as T;
  }
  if (/^\/initiatives\/[^/]+\/links\/work_item\/[^/]+$/.test(path) && method === "DELETE") {
    const p = path.split("/"); const cur = getLinks(p[2]);
    store.initLinks[p[2]] = { ...cur, work_item_ids: cur.work_item_ids.filter(x => x !== p[5]) };
    return undefined as T;
  }
  if (/^\/initiatives\/[^/]+\/links\/module\/[^/]+$/.test(path) && method === "DELETE") {
    const p = path.split("/"); const cur = getLinks(p[2]);
    store.initLinks[p[2]] = { ...cur, module_ids: cur.module_ids.filter(x => x !== p[5]) };
    return undefined as T;
  }

  if (/^\/projects\/[^/]+\/members$/.test(path) && method === "GET") {
    const pid = path.split("/")[2];
    return store.members.filter(m => m.project_id === pid).map(m => ({ ...m })) as T;
  }
  if (/^\/projects\/[^/]+\/members$/.test(path) && method === "POST") {
    const pid = path.split("/")[2];
    const m: ProjectMember = { id: uid(), project_id: pid, ...body };
    store.members.push(m); return { ...m } as T;
  }
  if (/^\/projects\/[^/]+\/members\/[^/]+$/.test(path) && method === "PATCH") {
    const [,, pid,, mid] = path.split("/");
    const idx = store.members.findIndex(m => m.id === mid && m.project_id === pid);
    if (idx >= 0) { store.members[idx] = { ...store.members[idx], ...body }; return { ...store.members[idx] } as T; }
  }
  if (/^\/projects\/[^/]+\/members\/[^/]+$/.test(path) && method === "DELETE") {
    const [,, pid,, mid] = path.split("/");
    store.members = store.members.filter(m => !(m.id === mid && m.project_id === pid));
    return undefined as T;
  }

  if (/^\/worklogs$/.test(path) && method === "GET") {
    const { entity_type, entity_id } = body ?? {};
    return store.worklogs
      .filter(w => (!entity_type || w.entity_type === entity_type) && (!entity_id || w.entity_id === entity_id || w.entity_id === "__all__"))
      .map(w => ({ ...w })) as T;
  }

  throw new Error(`Unhandled: ${method} ${path}`);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

// ── Visual config ──────────────────────────────────────────────────────────────

// Semantic state palette — Set A (task_workflow_state), brand-ui assignments, updated 2026-07-27
// for the bi-directional MVP enum migration (pending-review/ready/in-progress/blocked/done/deferred/archived).
const STATE_CFG: Record<WorkItemState, { label: string; color: string; bg: string }> = {
  "pending-review": { label: "Pending Review", color: "#8F8A80", bg: "rgba(143,138,128,0.12)" },
  ready:            { label: "Ready",          color: "#8E96CC", bg: "rgba(142,150,204,0.15)" },
  "in-progress":    { label: "In Progress",    color: "#E8B87A", bg: "rgba(232,184,122,0.14)" },
  blocked:          { label: "Blocked",        color: "#C25B62", bg: "rgba(194,91,98,0.15)"  },
  done:             { label: "Done",           color: "#5B7D73", bg: "rgba(91,125,115,0.22)" },
  deferred:         { label: "Deferred",       color: "#8F8A80", bg: "rgba(143,138,128,0.08)" },
  archived:         { label: "Archived",       color: "#55506A", bg: "rgba(85,80,106,0.16)"  },
};

// Priority — brand-ui semantic palette
const PRI_CFG: Record<WorkItemPriority, { label: string; color: string }> = {
  none:   { label: "None",   color: "#55506A" },   // text-faint (visually neutral)
  low:    { label: "Low",    color: "#8F8A80" },   // muted stone
  medium: { label: "Medium", color: "#8E96CC" },   // light indigo
  high:   { label: "High",   color: "#E8B87A" },   // peach-gold
  urgent: { label: "Urgent", color: "#C25B62" },   // deep maroon
};

// Set B (project_lifecycle_state) — projects, initiatives, cycles.
const PROJECT_STATUS_CFG: Record<ProjectStatus, { label: string; color: string }> = {
  planned:       { label: "Planned",     color: "#8E96CC" },   // light indigo
  "in-progress": { label: "In Progress", color: "#6D5AD1" },   // accent indigo — active identity
  paused:        { label: "Paused",      color: "#E8B87A" },   // peach-gold
  completed:     { label: "Completed",   color: "#5B7D73" },   // sea green
  closed:        { label: "Closed",      color: "#8F8A80" },   // muted stone
  archived:      { label: "Archived",    color: "#55506A" },   // text-faint
};
// Alias — Initiative + Cycle share Set B with Project.
const INIT_STATE_CFG = PROJECT_STATUS_CFG;
// Sidebar Active/Closed split (target-state §9).
const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = ["planned", "in-progress", "paused"];
const CLOSED_PROJECT_STATUSES: ProjectStatus[] = ["completed", "closed", "archived"];

// ── UI helpers ─────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: NC.stone }}>{label}</label>
      {children}
    </div>
  );
}

const iStyle = { borderColor: NC.border, color: NC.cream, background: "rgba(255,255,255,0.03)" } as const;

function NcInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="nc-input w-full px-3 py-2 rounded-lg text-sm outline-none" {...props} />;
}

function NcTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className="nc-input w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" {...props} />;
}

// Themed Radix Select wrapper — replaces native <select> for full brand-token control
// (option list background, hover row, keyboard highlight, font — all render via our tokens).
type NcSelectItem = { value: string; label: string; color?: string };
function NcSelect({
  value,
  onValueChange,
  placeholder,
  items,
  triggerClassName = "w-full px-3 py-2 text-sm rounded-lg",
  triggerStyle,
  onTriggerClick,
  disabled,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  items: NcSelectItem[];
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  onTriggerClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        data-slot="select-trigger"
        onClick={onTriggerClick}
        className={`${triggerClassName} nc-input outline-none flex items-center justify-between gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed [&>span]:truncate`}
        style={triggerStyle}
      >
        <SelectValue placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={12} style={{ opacity: 0.55, flexShrink: 0 }} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectContent
        className="rounded-lg overflow-hidden shadow-lg min-w-[var(--radix-select-trigger-width)]"
        style={{ background: "var(--nc-elevated-2)", borderColor: NC.border, color: NC.cream, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
      >
        {items.map(it => (
          <SelectItem
            key={it.value}
            value={it.value}
            style={{ color: NC.cream }}
            className="cursor-pointer focus:bg-[color:var(--nc-accent-tint)] focus:text-[color:var(--nc-text-cream)] data-[highlighted]:bg-[color:var(--nc-accent-tint)] data-[highlighted]:text-[color:var(--nc-text-cream)]"
          >
            <span className="flex items-center gap-2">
              {it.color && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: it.color }} aria-hidden="true" />}
              <span>{it.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── 3-Tier Button Ladder — canonical per LockedStudio 2026-07-29 ─────────────
//  T1 · PrimaryBtn — commit action, ONE per surface (Save changes, Create, Confirm)
//  T2 · TonalBtn   — frequent CTAs (+ Add subtask, Add to cycle, Archive)
//  T3 · TextBtn    — escape hatches (Cancel, Close, Dismiss)
//  All three take an optional `danger` prop (family-swap: cool → warm hue).

const PrimaryBtn = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; danger?: boolean }>(
  function PrimaryBtn({ children, loading, danger, className = "", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`locked-btn-primary${danger ? " locked-btn-primary--danger" : ""}${className ? ` ${className}` : ""}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </button>
    );
  }
);

function TonalBtn({ children, loading, danger, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; danger?: boolean }) {
  return (
    <button
      className={`locked-btn-secondary${danger ? " locked-btn-secondary--danger" : ""}${className ? ` ${className}` : ""}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

function TextBtn({ children, danger, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      className={`locked-btn-text${danger ? " locked-btn-text--danger" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

function StateBadge({ state }: { state: WorkItemState }) {
  const c = STATE_CFG[state];
  return (
    <span
      className="nc-glass-pill-static px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap"
      style={{ ["--pill-color" as string]: c.color }}
    >
      {c.label}
    </span>
  );
}

function PriBadge({ priority }: { priority: WorkItemPriority }) {
  const c = PRI_CFG[priority];
  return <span className="flex items-center gap-1 text-xs" style={{ color: c.color }}><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c.color }} />{c.label}</span>;
}

function EmptyState({ icon, text, secondaryText, action }: { icon: React.ReactNode; text: string; secondaryText?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 select-none">
      <div style={{ color: NC.textFaint }}>{icon}</div>
      <p className="text-sm" style={{ color: NC.stone }}>{text}</p>
      {secondaryText && <p className="text-xs max-w-xs text-center" style={{ color: NC.textDim, marginTop: -6 }}>{secondaryText}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function Spinner() { return <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />; }

function SectionLabel({ children }: { children: React.ReactNode }) {
  // Typography-only — the callsite owns layout (padding, margins, flex position).
  // 14px + 500-weight + widest tracking = "editorial quiet" — significant but not loud.
  return <span className="text-sm font-medium tracking-widest uppercase" style={{ color: NC.textDim, fontFamily: "'IBM Plex Sans', sans-serif" }}>{children}</span>;
}

function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div data-surface="top" className={`nc-lit-surface ${maxWidth} w-full rounded-xl border p-6`} style={{ borderColor: NC.border }}>
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 20, color: NC.cream, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5" style={{ color: NC.stone }}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function SlideOver({ open, onClose, title, actions, children }: { open: boolean; onClose: () => void; title: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-40 transition-opacity duration-300" style={{ background: "rgba(0,0,0,0.55)", pointerEvents: open ? "auto" : "none", opacity: open ? 1 : 0 }} onClick={onClose} />
      <div data-surface="elevated-2" className="nc-lit-surface fixed right-0 top-0 h-full z-50 flex flex-col border-l" style={{ width: 480, right: "var(--foundry-panel-offset, 0px)", borderColor: NC.border, transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.28s ease" }}>
        {/* Header padding: pt-6 gives the breadcrumb breath from the top edge;
            pb-4 pairs with body pt-2 to yield ~24px between the last header row
            (title) and the first body row (description) — matching the ~24px
            rhythm we want across every landmark. Daniel-directive 2026-07-29. */}
        <div className="flex items-start gap-2 px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0">{title}</div>
          {actions}
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 flex-shrink-0" style={{ color: NC.stone }}><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pt-2.5 pb-6">{children}</div>
      </div>
    </>,
    document.body,
  );
}

// Inline title editor shared by task and module drawer headers.
function EditableTitleInline({ value, onSave, className = "" }: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const cancelRef = useRef(false);

  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          const next = draft.trim();
          if (!cancelRef.current && next && next !== value) onSave(next);
          cancelRef.current = false;
          setEditing(false);
        }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancelRef.current = true;
            setDraft(value);
            e.currentTarget.blur();
          }
        }}
        className={`nc-input px-2 py-1 flex-1 min-w-0 ${className}`}
      />
    );
  }

  return (
    <h2
      onDoubleClick={() => { cancelRef.current = false; setDraft(value); setEditing(true); }}
      className={`cursor-text truncate min-w-0 ${className}`}
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      title="Double-click to edit"
    >
      {value}
    </h2>
  );
}

// Note: retained as "ConfirmDelete" for minimal call-site diff (5 sites) — internal copy and
// action are archive-only. No caller needs a true destructive path today; every mutation this
// app performs is state='archived', never a hard row delete. Add a verb prop back if that changes.
function ConfirmDelete({ open, onClose, onConfirm, label }: { open: boolean; onClose: () => void; onConfirm: () => void; label: string }) {
  return (
    <Modal open={open} onClose={onClose} title={`Archive ${label}?`} maxWidth="max-w-sm">
      <p className="text-sm mb-5" style={{ color: NC.stone }}>The record is preserved and can be un-archived later.</p>
      <div className="flex gap-2 justify-end">
        <TextBtn onClick={onClose}>Cancel</TextBtn>
        <button onClick={() => { onConfirm(); onClose(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5" style={{ color: NC.stone, border: `1px solid ${NC.border}` }}><Archive size={13} /> Archive</button>
      </div>
    </Modal>
  );
}

// ── Activity button ────────────────────────────────────────────────────────────

// entityId: for "task" this MUST be the backend UUID (task.uuid) — worklog.work_item_id is a
// UUID FK. For project/module/cycle, entityId is the project code — get_activity_for_entity
// isn't built yet (target-state §5.5 capability #6), so rollup approximates via project-code
// match on get_recent_activity rather than a precise module/cycle-scoped JOIN. TODO(bi-dir-mvp).
export function ActivityButton({ entityType, entityId, projectId, onAddNote }: {
  entityType: "project" | "task" | "module" | "cycle";
  entityId: string;
  projectId?: string;
  onAddNote?: (text: string) => Promise<void>;
}) {
  const [open, setOpen]     = useState(false);
  const [entries, setEntries] = useState<WorklogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

function loadEntries() {
    setLoading(true);
    api<WorklogEntry[]>("/worklogs", { method: "GET" })
      .then(raw => {
        const filtered = entityType === "task"
          ? raw.filter(e => e.work_item_id && e.work_item_id === entityId)
          : raw.filter(e => e.project === (projectId ?? entityId));
        setEntries(filtered);
      })
      .catch(() => setEntries([])).finally(() => setLoading(false));
  }

  function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    loadEntries();
  }

  async function submitNote() {
    if (!note.trim() || !onAddNote) return;
    setPosting(true);
    try { await onAddNote(note.trim()); setNote(""); loadEntries(); }
    finally { setPosting(false); }
  }

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <div className="group relative">
        <button
          onClick={e => { e.stopPropagation(); toggle(); }}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
          style={{ color: open ? NC.green : "rgba(138,133,128,0.5)" }}
        >
          <Atom size={14} />
        </button>
        {!open && (
          <span className="pointer-events-none absolute right-0 top-full mt-1 z-50 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#2A2540", color: NC.cream, border: `1px solid ${NC.border}` }}>
            Activity
          </span>
        )}
      </div>

      {open && createPortal(
        <div
          className="fixed z-[60] rounded-xl border shadow-2xl overflow-hidden"
          style={{
            background: NC.card, borderColor: NC.border, width: 320,
            top: (ref.current?.getBoundingClientRect().bottom ?? 0) + 6,
            right: window.innerWidth - (ref.current?.getBoundingClientRect().right ?? 0),
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderColor: NC.borderFaint }}>
            <div className="flex items-center gap-2">
              <Atom size={13} style={{ color: NC.green }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: NC.stone }}>Activity</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded hover:bg-white/5" style={{ color: NC.stone }}><X size={12} /></button>
          </div>
          <div className="max-h-64 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8"><Spinner /></div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center text-xs" style={{ color: NC.stone }}>No activity yet</div>
            ) : (
              <div style={{ borderColor: NC.borderFaint }}>
                {entries.map(e => (
                  <div key={e.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: NC.green }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: NC.cream }}>{e.summary}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(138,133,128,0.55)" }}>
                        {e.author}{e.author && " · "}{new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {onAddNote && (
            <div className="flex items-center gap-1.5 px-3 py-2.5" style={{ borderColor: NC.borderFaint }}>
              <input
                className="nc-input flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                placeholder="Add a worklog note…"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitNote()}
              />
              <button onClick={submitNote} disabled={posting || !note.trim()} className="p-1.5 rounded-lg disabled:opacity-40" style={{ color: NC.green }}>
                {posting ? <Spinner /> : <Plus size={13} />}
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ── DnD helpers ────────────────────────────────────────────────────────────────

function useCombinedRef<T>(...refs: Array<React.Ref<T> | ((node: T | null) => unknown)>) {
  return useCallback((node: T | null) => {
    refs.forEach(ref => {
      if (!ref) return;
      if (typeof ref === "function") (ref as (n: T | null) => unknown)(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}

// Project-root level drag type (modules + unassigned tasks share this)
const PROJECT_ROOT_TYPE = "project_root";
// Per-module task drag type (prevents cross-module drops)
const TASK_TYPE = (moduleId: string) => `task_${moduleId}`;

interface DragItem { id: string; index: number }

// Unified draggable wrapper for project-root items (modules OR root tasks)
function DraggableProjectItem({ id, index, onMove, children }: {
  id: string;
  index: number;
  onMove: (from: number, to: number) => void;
  children: (gripRef: React.RefObject<HTMLSpanElement | null>) => React.ReactNode;
}) {
  const gripRef = useRef<HTMLSpanElement>(null);
  const rowRef  = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: PROJECT_ROOT_TYPE,
    item: { id, index },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  const [, drop] = useDrop<DragItem, void, Record<string, never>>({
    accept: PROJECT_ROOT_TYPE,
    hover(item, monitor) {
      if (!rowRef.current) return;
      const di = item.index, hi = index;
      if (di === hi) return;
      const { top, bottom } = rowRef.current.getBoundingClientRect();
      const clientY = (monitor.getClientOffset()?.y ?? 0) - top;
      const mid = (bottom - top) / 2;
      if (di < hi && clientY < mid) return;
      if (di > hi && clientY > mid) return;
      onMove(di, hi);
      item.index = hi;
    },
  });

  drag(gripRef);
  const setRef = useCombinedRef<HTMLDivElement>(
    rowRef,
    drop as (n: HTMLDivElement | null) => unknown,
    preview as (n: HTMLDivElement | null) => unknown,
  );

  return (
    <div ref={setRef} style={{ opacity: isDragging ? 0.45 : 1 }}>
      {children(gripRef)}
    </div>
  );
}

// In-module task draggable wrapper
function DraggableTaskRow({ task, index, onMove, ...rest }: TaskRowProps & { index: number; onMove: (from: number, to: number) => void }) {
  const gripRef = useRef<HTMLSpanElement>(null);
  const rowRef  = useRef<HTMLDivElement>(null);
  const modKey  = task.module_id ?? "root";

  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: TASK_TYPE(modKey),
    item: { id: task.id, index },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  const [, drop] = useDrop<DragItem, void, Record<string, never>>({
    accept: TASK_TYPE(modKey),
    hover(item, monitor) {
      if (!rowRef.current) return;
      const di = item.index, hi = index;
      if (di === hi) return;
      const { top, bottom } = rowRef.current.getBoundingClientRect();
      const clientY = (monitor.getClientOffset()?.y ?? 0) - top;
      const mid = (bottom - top) / 2;
      if (di < hi && clientY < mid) return;
      if (di > hi && clientY > mid) return;
      onMove(di, hi);
      item.index = hi;
    },
  });

  drag(gripRef);
  const setRef = useCombinedRef<HTMLDivElement>(
    rowRef,
    drop as (n: HTMLDivElement | null) => unknown,
    preview as (n: HTMLDivElement | null) => unknown,
  );

  return (
    <div ref={setRef} style={{ opacity: isDragging ? 0.45 : 1 }}>
      <TaskRow {...rest} task={task} gripRef={gripRef} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SIDEBAR NAV TREE
// ════════════════════════════════════════════════════════════════════════════════

function ProjectNavTree({ project, onSelectTask }: {
  project: Project;
  onSelectTask: (taskId: string) => void;
}) {
  const [mods, setMods]   = useState<Mod[]>([]);
  const [tasks, setTasks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMods, setExpandedMods] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<Mod[]>(`/projects/${project.id}/modules`).catch(() => [] as Mod[]),
      api<WorkItem[]>(`/projects/${project.id}/work-items`).catch(() => [] as WorkItem[]),
    ]).then(([m, t]) => {
      setMods(m.filter(x => x.state !== "archived"));
      setTasks(t.filter(x => !x.parent_item_id && x.state !== "archived"));
    }).finally(() => setLoading(false));
  }, [project.id]);

  if (loading) return <div className="px-8 py-1"><Spinner /></div>;

  const rootTasks = tasks.filter(t => !t.module_id);

  return (
    <div className="pb-1">
      {mods.map(mod => {
        const modTasks = tasks.filter(t => t.module_id === mod.id);
        const open = expandedMods.has(mod.id);
        return (
          <div key={mod.id}>
            <button
              className="w-full h-8 flex items-center gap-1.5 transition-colors hover:bg-white/[0.06]"
              style={{ paddingLeft: 28 }}
              onClick={() => setExpandedMods(prev => { const n = new Set(prev); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); return n; })}
              title={mod.name}
            >
              {open ? <ChevronDown size={11} style={{ color: NC.stone, flexShrink: 0 }} /> : <ChevronRight size={11} style={{ color: NC.stone, flexShrink: 0 }} />}
              <Layers size={12} style={{ color: NC.green, flexShrink: 0 }} />
              <span className="text-xs truncate" style={{ color: "rgba(245,235,221,0.55)" }}>{mod.name}</span>
            </button>
            {open && modTasks.map(task => (
              <button key={task.id} className="w-full h-8 flex items-center gap-1.5 transition-colors hover:bg-white/[0.06] text-left" style={{ paddingLeft: 44 }} onClick={() => onSelectTask(task.id)} title={task.title}>
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: STATE_CFG[task.state].color }} />
                <span className="text-xs truncate" style={{ color: "rgba(245,235,221,0.4)" }}>{task.title}</span>
              </button>
            ))}
          </div>
        );
      })}
      {rootTasks.map(task => (
        <button key={task.id} className="w-full h-8 flex items-center gap-1.5 transition-colors hover:bg-white/[0.06] text-left" style={{ paddingLeft: 32 }} onClick={() => onSelectTask(task.id)} title={task.title}>
          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: STATE_CFG[task.state].color }} />
          <span className="text-xs truncate" style={{ color: "rgba(245,235,221,0.4)" }}>{task.title}</span>
        </button>
      ))}
      {mods.length === 0 && tasks.length === 0 && (
        <p className="px-8 py-1 text-xs" style={{ color: "rgba(138,133,128,0.35)" }}>Empty project</p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  TASK DETAIL SLIDE-OVER
// ════════════════════════════════════════════════════════════════════════════════

function TaskDetailSlideOver({ task, allItems, projectName, moduleName, onBack, onClose, onSave, onAddSubtask, onDeleteSubtask, onAddBlocker, onRemoveBlocker, onOpenTask, onOpenMove }: {
  task: WorkItem; allItems: WorkItem[]; projectName: string; moduleName?: string; onBack: () => void; onClose: () => void;
  onSave: (id: string, patch: Partial<WorkItem>) => Promise<void>;
  onAddSubtask: (parentId: string, title: string) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onAddBlocker: (taskId: string, blockerId: string) => Promise<void>;
  onRemoveBlocker: (taskId: string, blockerId: string) => Promise<void>;
  onOpenTask: (taskId: string) => void;
  onOpenMove: () => void;
}) {
  const [form, setForm] = useState({
    title: task.title, description: task.description, state: task.state,
    priority: task.priority, assignee: task.assignee,
  });
  const [saving, setSaving] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newDocPath, setNewDocPath] = useState("");

  useEffect(() => {
    setForm({ title: task.title, description: task.description, state: task.state, priority: task.priority, assignee: task.assignee });
  }, [task.id]);

  const subtasks          = allItems.filter(i => i.parent_item_id === task.id);
  const blockers          = allItems.filter(i => task.blocked_by.includes(i.id));
  const releases          = allItems.filter(i => i.blocked_by.includes(task.id));
  const availableBlockers = allItems.filter(i => i.id !== task.id && !task.blocked_by.includes(i.id) && !i.parent_item_id);

  async function handleSave() { setSaving(true); await onSave(task.id, form); setSaving(false); }
  useCmdEnter(handleSave);

  async function handleAddSubtask() {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    await onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask(""); setAddingSubtask(false);
  }

  async function addDocPath() {
    if (!newDocPath.trim()) return;
    await onSave(task.id, { doc_paths: [...task.doc_paths, newDocPath.trim()] });
    setNewDocPath("");
  }

  async function removeDocPath(path: string) {
    await onSave(task.id, { doc_paths: task.doc_paths.filter(p => p !== path) });
  }

  const divider = <GlassSeparator />;

  return (
    <SlideOver
      open
      onClose={onClose}
      title={
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="flex-shrink-0 p-1 rounded hover:bg-white/[0.06] transition-colors"
              style={{ color: "var(--nc-text-muted)" }}
              title="Back"
              aria-label="Back"
            >
              <ChevronLeft size={14} />
            </button>
            <Breadcrumb className="min-w-0">
              {projectName && (
                <>
                  <BreadcrumbItem onClick={() => {}}>{projectName}</BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {moduleName && (
                <>
                  <BreadcrumbItem onClick={() => {}}>{moduleName}</BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem current>…</BreadcrumbItem>
            </Breadcrumb>
            <button
              type="button"
              onClick={onOpenMove}
              className="flex-shrink-0 p-1 rounded hover:bg-white/[0.06] transition-colors"
              style={{ color: "var(--nc-text-muted)" }}
              title="Move to different project or module"
              aria-label="Move to different project or module"
            >
              <FolderInput size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "#8879A0", fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Task
            </span>
          </div>
          <div className="flex items-center gap-3 min-w-0 -mt-0.5">
            <EditableTitleInline
              value={task.title}
              onSave={v => {
                setForm(p => ({ ...p, title: v }));
                void onSave(task.id, { title: v });
              }}
              className="text-xl font-semibold text-[color:var(--nc-text-cream)] tracking-tight"
            />
            <NcSelect
              value={task.state}
              onValueChange={v => {
                const state = v as WorkItemState;
                setForm(p => ({ ...p, state }));
                void onSave(task.id, { state });
              }}
              onTriggerClick={e => e.stopPropagation()}
              triggerClassName="text-xs rounded px-2 py-1 flex-shrink-0"
              triggerStyle={{ color: STATE_CFG[task.state].color, fontFamily: "'IBM Plex Sans', sans-serif" }}
              items={Object.entries(STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))}
            />
            <ActivityButton
              entityType="task"
              entityId={task.id}
              projectId={task.project_id}
              onAddNote={async () => {}}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        {/* Inline blocker picker when state = blocked */}
        {form.state === "blocked" && (
          <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: "rgba(201,76,76,0.3)", background: "rgba(201,76,76,0.05)" }}>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#C25B62" }}>
              Blocking task <span style={{ color: NC.stone, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </p>
            {blockers.map(b => (
              <div key={b.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg group hover:bg-white/[0.04] cursor-pointer" onClick={() => onOpenTask(b.id)}>
                <AlertTriangle size={11} style={{ color: "#C25B62", flexShrink: 0 }} />
                <span className="flex-1 text-sm truncate hover:underline" style={{ color: NC.cream }}>{b.title}</span>
                <StateBadge state={b.state} />
                <button onClick={e => { e.stopPropagation(); onRemoveBlocker(task.id, b.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded ml-1" style={{ color: NC.stone }}><X size={11} /></button>
              </div>
            ))}
            {availableBlockers.length > 0 && (
              <NcSelect
                value=""
                onValueChange={v => { if (v) onAddBlocker(task.id, v); }}
                placeholder="+ Add blocking task…"
                items={availableBlockers.map(t => ({ value: t.id, label: t.title }))}
              />
            )}
          </div>
        )}

        <Field label="Assignee">
          <NcInput value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="Name or email" />
        </Field>
        <Field label="Description">
          <NcTextarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Add a description…" rows={4} />
        </Field>

        <div className="flex justify-end">
          <PrimaryBtn loading={saving} onClick={handleSave}>Save changes</PrimaryBtn>
        </div>

        {divider}

        {/* Subtasks */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: NC.stone }}>Subtasks ({subtasks.length})</p>
          {subtasks.length > 0 && (
            <div className="space-y-0.5 mb-3">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 group py-1.5 px-2 rounded-lg hover:bg-white/[0.06]">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 cursor-pointer" style={{ background: STATE_CFG[sub.state].color }} onClick={() => onOpenTask(sub.id)} />
                  <span className="flex-1 text-sm hover:underline cursor-pointer truncate" style={{ color: NC.cream }} onClick={() => onOpenTask(sub.id)}>{sub.title}</span>
                  <NcSelect
                    value={sub.state}
                    onValueChange={v => onSave(sub.id, { state: v as WorkItemState })}
                    onTriggerClick={e => e.stopPropagation()}
                    triggerClassName="text-xs rounded border outline-none px-1.5 py-0.5 flex-shrink-0"
                    triggerStyle={{ color: STATE_CFG[sub.state].color, fontFamily: "'IBM Plex Sans', sans-serif" }}
                    items={Object.entries(STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))}
                  />
                  <button onClick={e => { e.stopPropagation(); onDeleteSubtask(sub.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity flex-shrink-0" style={{ color: NC.stone }}><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <NcInput value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Add a subtask…" onKeyDown={e => e.key === "Enter" && handleAddSubtask()} />
            <TonalBtn loading={addingSubtask} onClick={handleAddSubtask} className="flex-shrink-0"><Plus size={13} /></TonalBtn>
          </div>
        </div>

        {divider}

        {/* Related docs */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: NC.stone }}>Related Docs ({task.doc_paths.length})</p>
          {task.doc_paths.length > 0 && (
            <div className="space-y-0.5 mb-3">
              {task.doc_paths.map((p, i) => (
                <div key={i} className="flex items-center gap-2 group py-1.5 px-2 rounded-lg hover:bg-white/[0.06]">
                  <FileText size={11} style={{ color: NC.stone, flexShrink: 0 }} />
                  <span className="flex-1 text-xs font-mono truncate" style={{ color: NC.cream }}>{p}</span>
                  <button onClick={() => removeDocPath(p)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity" style={{ color: NC.stone }}><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <NcInput value={newDocPath} onChange={e => setNewDocPath(e.target.value)} placeholder="/path/to/doc.md" onKeyDown={e => e.key === "Enter" && addDocPath()} style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12 }} />
            <TonalBtn onClick={addDocPath} className="flex-shrink-0"><Plus size={13} /></TonalBtn>
          </div>
        </div>

        {divider}

        {/* Releases (tasks that THIS task blocks) */}
        {releases.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: NC.stone }}>Releases ({releases.length})</p>
            <div className="space-y-1.5">
              {releases.map(r => (
                <div key={r.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg border cursor-pointer hover:bg-white/[0.04] transition-colors" style={{ borderColor: "rgba(91,125,115,0.3)", background: "rgba(91,125,115,0.06)" }} onClick={() => onOpenTask(r.id)}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: NC.green }} />
                  <span className="flex-1 text-sm truncate hover:underline" style={{ color: NC.cream }}>{r.title}</span>
                  <StateBadge state={r.state} />
                  <ArrowRight size={11} style={{ color: NC.stone, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocked by (hidden when state=blocked — shown inline above) */}
        {form.state !== "blocked" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: NC.stone }}>Blocked by ({blockers.length})</p>
              {availableBlockers.length > 0 && (
                <NcSelect
                  value=""
                  onValueChange={v => { if (v) onAddBlocker(task.id, v); }}
                  placeholder="+ Add"
                  triggerClassName="text-xs px-2 py-1 rounded-lg border outline-none w-auto"
                  items={availableBlockers.map(t => ({ value: t.id, label: t.title }))}
                />
              )}
            </div>
            {blockers.length === 0 ? (
              <p className="text-sm" style={{ color: "rgba(138,133,128,0.4)" }}>No blockers</p>
            ) : (
              <div className="space-y-1.5">
                {blockers.map(b => (
                  <div key={b.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg border group cursor-pointer hover:bg-white/[0.04] transition-colors" style={{ borderColor: "rgba(201,76,76,0.3)", background: "rgba(201,76,76,0.06)" }} onClick={() => onOpenTask(b.id)}>
                    <AlertTriangle size={11} style={{ color: "#C25B62", flexShrink: 0 }} />
                    <span className="flex-1 text-sm truncate hover:underline" style={{ color: NC.cream }}>{b.title}</span>
                    <StateBadge state={b.state} />
                    <button onClick={e => { e.stopPropagation(); onRemoveBlocker(task.id, b.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ml-1" style={{ color: NC.stone }}><Unlink size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SlideOver>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  CYCLE PICKER MODAL
// ════════════════════════════════════════════════════════════════════════════════

function CyclePicker({ open, onClose, cycles, onPick, onCreateAndPick }: {
  open: boolean; onClose: () => void; cycles: Cycle[];
  onPick: (cycleId: string) => void;
  onCreateAndPick: (name: string) => Promise<string | null>;
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const id = await onCreateAndPick(newName.trim());
    if (id) { setNewName(""); onClose(); }
    setCreating(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Add to Cycle" maxWidth="max-w-sm">
      {cycles.length > 0 && (
        <div className="space-y-0.5 mb-4 max-h-52 overflow-auto -mx-6 px-6">
          {cycles.map(c => (
            <button key={c.id} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors hover:bg-white/[0.05]"
              style={{ color: NC.cream }} onClick={() => { onPick(c.id); onClose(); }}>
              <Calendar size={13} style={{ color: NC.green, flexShrink: 0 }} />
              <span className="flex-1 truncate">{c.name}</span>
              {c.start_date && <span className="text-xs flex-shrink-0" style={{ color: NC.stone }}>{new Date(c.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
            </button>
          ))}
        </div>
      )}
      <div className={cycles.length > 0 ? "pt-4" : ""} style={{ borderColor: NC.borderFaint }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: NC.stone }}>New cycle</p>
        <div className="flex gap-2">
          <NcInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="Cycle name" autoFocus={cycles.length === 0} onKeyDown={e => e.key === "Enter" && handleCreate()} />
          <PrimaryBtn loading={creating} onClick={handleCreate}><Plus size={13} /></PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  MODULE DETAIL SLIDE-OVER
// ════════════════════════════════════════════════════════════════════════════════

function ModuleDetailSlideOver({ mod, allItems, cycles, projectName, onBack, onClose, onSave, onAddTask, onSelectTask, onDeleteMod, onAddToCycle }: {
  mod: Mod; allItems: WorkItem[]; cycles: Cycle[]; projectName: string; onBack: () => void; onClose: () => void;
  onSave: (id: string, patch: Partial<Mod>) => Promise<void>;
  onAddTask: (moduleId: string) => void;
  onSelectTask: (task: WorkItem) => void;
  onDeleteMod: (m: Mod) => void;
  onAddToCycle: (cycleId: string) => void;
}) {
  const [form, setForm] = useState({ name: mod.name, description: mod.description ?? "", folder_path: mod.folder_path ?? "" });
  const [saving, setSaving] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);

  useEffect(() => {
    setForm({ name: mod.name, description: mod.description ?? "", folder_path: mod.folder_path ?? "" });
  }, [mod.id]);

  const modTasks = allItems.filter(w => w.module_id === mod.id && !w.parent_item_id);
  const done     = modTasks.filter(t => t.state === "done" || t.state === "deferred" || t.state === "archived").length;
  const progress = modTasks.length > 0 ? Math.round((done / modTasks.length) * 100) : 0;

  async function handleSave() {
    setSaving(true);
    await onSave(mod.id, form);
    setSaving(false);
  }
  useCmdEnter(handleSave);

  const divider = <GlassSeparator />;

  return (
    <SlideOver
      open
      onClose={onClose}
      title={
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="flex-shrink-0 p-1 rounded hover:bg-white/[0.06] transition-colors"
              style={{ color: "var(--nc-text-muted)" }}
              title="Back"
              aria-label="Back"
            >
              <ChevronLeft size={14} />
            </button>
            <Breadcrumb className="min-w-0">
              {projectName && (
                <>
                  <BreadcrumbItem onClick={() => {}}>{projectName}</BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem current>…</BreadcrumbItem>
            </Breadcrumb>
            <button
              type="button"
              onClick={() => { console.log('[caelos] Unit F: move-to-project picker for module', mod.id); }}
              className="flex-shrink-0 p-1 rounded hover:bg-white/[0.06] transition-colors"
              style={{ color: "var(--nc-text-muted)" }}
              title="Move to different project"
              aria-label="Move to different project"
            >
              <FolderInput size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "#7A9E93", fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Module
            </span>
          </div>
          <div className="flex items-center gap-3 min-w-0 -mt-0.5">
            <EditableTitleInline
              value={mod.name}
              onSave={v => {
                setForm(p => ({ ...p, name: v }));
                void onSave(mod.id, { name: v });
              }}
              className="text-xl font-semibold text-[color:var(--nc-text-cream)] tracking-tight"
            />
            <NcSelect
              value={mod.state}
              onValueChange={v => { void onSave(mod.id, { state: v as WorkItemState }); }}
              onTriggerClick={e => e.stopPropagation()}
              triggerClassName="text-xs rounded px-2 py-1 flex-shrink-0"
              triggerStyle={{ color: STATE_CFG[mod.state].color, fontFamily: "'IBM Plex Sans', sans-serif" }}
              items={Object.entries(STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))}
            />
            <ActivityButton
              entityType="module"
              entityId={mod.id}
              projectId={mod.project_id}
              onAddNote={async () => {}}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        {/* Description */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: NC.stone }}>Description</label>
          <NcTextarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe this module…" rows={3} />
        </div>

        {/* Folder path field — the single canonical folder-path surface for this module.
            (Prior standalone chip in the drawer body was removed 2026-07-29 — redundant
            with this field. Progress bar moved to the Tasks section header.) */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: NC.stone }}>Folder Path</label>
          <div className="flex items-center gap-2">
            <Folder size={13} style={{ color: NC.stone, flexShrink: 0 }} />
            <NcInput value={form.folder_path} onChange={e => setForm(p => ({ ...p, folder_path: e.target.value }))} placeholder="/path/to/module" style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12 }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrimaryBtn loading={saving} onClick={handleSave}>Save changes</PrimaryBtn>
          <TonalBtn onClick={() => setCycleOpen(true)}><Calendar size={13} /> Add to cycle</TonalBtn>
          <TonalBtn danger onClick={() => { onClose(); onDeleteMod(mod); }} className="ml-auto"><Archive size={13} /> Archive</TonalBtn>
        </div>

        {divider}

        {/* Tasks in module */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-xs font-semibold tracking-widest uppercase flex-shrink-0" style={{ color: NC.stone }}>Tasks ({modTasks.length})</p>
              {modTasks.length > 0 && (
                <>
                  <div className="flex-1 max-w-[140px] h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: NC.green }} />
                  </div>
                  <span className="text-[10px] font-mono flex-shrink-0" style={{ color: NC.stone }}>{done}/{modTasks.length}</span>
                </>
              )}
            </div>
            <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:bg-white/[0.05]" style={{ color: NC.stone, border: `1px solid ${NC.border}` }}
              onClick={() => { onAddTask(mod.id); onClose(); }}>
              <Plus size={11} /> Add task
            </button>
          </div>
          {modTasks.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(138,133,128,0.4)" }}>No tasks yet</p>
          ) : (
            <div className="space-y-px">
              {modTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2.5 py-2 px-3 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.04]" onClick={() => { onSelectTask(task); onClose(); }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATE_CFG[task.state].color }} />
                  <span className="flex-1 text-sm truncate hover:underline" style={{ color: NC.cream }}>{task.title}</span>
                  <StateBadge state={task.state} />
                  {task.assignee && <span className="text-xs hidden sm:block truncate max-w-[60px]" style={{ color: NC.stone }}>{task.assignee}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CyclePicker
        open={cycleOpen} onClose={() => setCycleOpen(false)} cycles={cycles}
        onPick={onAddToCycle}
        onCreateAndPick={async name => { onAddToCycle(`__new__${name}`); return "ok"; }}
      />
    </SlideOver>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  TASK ROW
// ════════════════════════════════════════════════════════════════════════════════

type TaskRowProps = {
  task: WorkItem; allItems: WorkItem[]; depth: number;
  gripRef?: React.RefObject<HTMLSpanElement | null>;
  onSelect: (t: WorkItem) => void; onDelete: (t: WorkItem) => void;
  onDuplicate: (t: WorkItem) => void; onPromote: (t: WorkItem) => void;
  onAddSubtask: (parentId: string) => void;
  onAddToCycle: (task: WorkItem) => void;
  onSaveState?: (id: string, state: WorkItemState) => void;
  onMove?: (t: WorkItem) => void;
};

function TaskRow({ task, allItems, depth, gripRef, onSelect, onDelete, onDuplicate, onPromote, onAddSubtask, onAddToCycle, onSaveState, onMove }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const subtasks  = allItems.filter(i => i.parent_item_id === task.id);
  const isBlocked = task.blocked_by.length > 0;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="flex items-center gap-1.5 py-2.5 cursor-pointer group transition-colors hover:bg-white/[0.06]"
            style={{ paddingLeft: `${depth * 20 + 16}px`, paddingRight: 8 }}
            onClick={() => onSelect(task)}
          >
            <button className="flex-shrink-0 w-4 flex items-center justify-center" style={{ color: NC.stone }} onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}>
              {subtasks.length > 0 ? (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span className="w-3" />}
            </button>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATE_CFG[task.state].color }} />
            <span className="flex-1 text-sm font-medium truncate pr-2" style={{ color: task.state === "done" || task.state === "deferred" ? NC.textMuted : NC.cream, textDecoration: task.state === "done" ? "line-through" : undefined }}>{task.title}</span>
            {isBlocked && <AlertTriangle size={12} style={{ color: "#C25B62", flexShrink: 0 }} />}
            <div className="flex items-center gap-3 flex-shrink-0">
              {onSaveState ? (
                <NcSelect
                  value={task.state}
                  onValueChange={v => onSaveState(task.id, v as WorkItemState)}
                  onTriggerClick={e => e.stopPropagation()}
                  triggerClassName="text-xs rounded border outline-none px-1.5 py-0.5"
                  triggerStyle={{ color: STATE_CFG[task.state].color, fontFamily: "'IBM Plex Sans', sans-serif" }}
                  items={Object.entries(STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))}
                />
              ) : (
                <StateBadge state={task.state} />
              )}
              {task.assignee && <span className="text-xs max-w-[72px] truncate hidden sm:block" style={{ color: NC.stone }}>{task.assignee}</span>}
              {subtasks.length > 0 && <span className="text-xs" style={{ color: NC.stone }}>{subtasks.length} sub</span>}
            </div>
            <button
              type="button"
              title="Archive task"
              aria-label={`Archive ${task.title}`}
              className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-white/[0.08]"
              style={{ color: NC.stone }}
              onClick={e => { e.stopPropagation(); onDelete(task); }}
            >
              <Archive size={12} />
            </button>
            <span ref={gripRef} className="flex-shrink-0 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing ml-1" style={{ color: NC.stone }} onClick={e => e.stopPropagation()}>
              <GripVertical size={12} />
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="nc-glass-menu" style={{ color: NC.cream }}>
          <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => onSelect(task)}><Edit2 size={13} /> View / Edit</ContextMenuItem>
          <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => onAddSubtask(task.id)}><Plus size={13} /> Add Subtask</ContextMenuItem>
          <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.green }} onClick={() => onAddToCycle(task)}><Calendar size={13} /> Add to Cycle…</ContextMenuItem>
          <ContextMenuSeparator style={{ background: NC.border }} />
          <ContextMenuItem className="gap-2 text-sm" style={{ color: "#c9a84c" }} onClick={() => onPromote(task)}><TrendingUp size={13} /> Promote to Module</ContextMenuItem>
          <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => onDuplicate(task)}><Copy size={13} /> Duplicate</ContextMenuItem>
          <ContextMenuSeparator style={{ background: NC.border }} />
          {onMove && (
            <ContextMenuItem className="gap-2 text-sm" onClick={() => onMove(task)}><FolderInput size={13} /> Move…</ContextMenuItem>
          )}
          <ContextMenuItem className="gap-2 text-sm" onClick={() => onDelete(task)}><Archive size={13} /> Archive</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {expanded && subtasks.map(sub => (
        <TaskRow key={sub.id} task={sub} allItems={allItems} depth={depth + 1}
          onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} onPromote={onPromote}
          onAddSubtask={onAddSubtask} onAddToCycle={onAddToCycle} onMove={onMove} />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  MODULE SECTION
// ════════════════════════════════════════════════════════════════════════════════

type ModuleSectionProps = {
  mod: Mod; modTasks: WorkItem[]; allItems: WorkItem[];
  gripRef?: React.RefObject<HTMLSpanElement | null>;
  onOpenMod: (m: Mod) => void; onDeleteMod: (m: Mod) => void;
  onAddTask: (moduleId: string) => void;
  onSelectTask: (t: WorkItem) => void; onDeleteTask: (t: WorkItem) => void;
  onDuplicateTask: (t: WorkItem) => void; onPromoteTask: (t: WorkItem) => void;
  onAddSubtask: (parentId: string) => void;
  onMoveTask: (from: number, to: number, moduleId: string) => void;
  onAddModToCycle: (mod: Mod) => void;
  onAddTaskToCycle: (task: WorkItem) => void;
  onSaveTaskState: (id: string, state: WorkItemState) => void;
};

function ModuleSection({ mod, modTasks, allItems, gripRef, onOpenMod, onDeleteMod, onAddTask, onSelectTask, onDeleteTask, onDuplicateTask, onPromoteTask, onAddSubtask, onMoveTask, onAddModToCycle, onAddTaskToCycle, onSaveTaskState }: ModuleSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const done     = modTasks.filter(t => t.state === "done" || t.state === "deferred" || t.state === "archived").length;
  const progress = modTasks.length > 0 ? Math.round((done / modTasks.length) * 100) : 0;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="flex items-center gap-1.5 pr-4 cursor-pointer group transition-colors hover:bg-white/[0.04]"
            style={{ paddingLeft: 16, background: "rgba(255,255,255,0.02)", paddingTop: 8, paddingBottom: 8 }}
            onClick={() => onOpenMod(mod)}
          >
            <Layers size={13} className="flex-shrink-0" style={{ color: STATE_CFG[mod.state].color }} />
            <button className="flex-shrink-0 w-5 flex items-center justify-center" style={{ color: NC.stone }} onClick={e => { e.stopPropagation(); setExpanded(p => !p); }}>
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            <div className="flex-1 min-w-0">
              <span className="font-semibold" style={{ color: mod.state === "done" || mod.state === "deferred" ? NC.textMuted : NC.cream, textDecoration: mod.state === "done" ? "line-through" : undefined, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, fontWeight: 600 }}>{mod.name}</span>
              {modTasks.length > 0 && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-20 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: NC.green }} />
                  </div>
                  <span className="text-xs" style={{ color: NC.stone }}>{done}/{modTasks.length}</span>
                </div>
              )}
            </div>
            <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-opacity hover:bg-white/5 flex-shrink-0" style={{ color: NC.stone }} onClick={e => { e.stopPropagation(); onAddTask(mod.id); }}>
              <Plus size={11} /> Task
            </button>
            {mod.folder_path && <span className="text-xs font-mono truncate max-w-[100px] hidden lg:block" style={{ color: "rgba(138,133,128,0.45)" }}>{mod.folder_path}</span>}
            <span ref={gripRef} className="flex-shrink-0 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" style={{ color: NC.stone }} onClick={e => e.stopPropagation()}>
              <GripVertical size={12} />
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="nc-glass-menu" style={{ color: NC.cream }}>
          <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => onOpenMod(mod)}><Edit2 size={13} /> Open</ContextMenuItem>
          <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => onAddTask(mod.id)}><Plus size={13} /> Add Task</ContextMenuItem>
          <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.green }} onClick={() => onAddModToCycle(mod)}><Calendar size={13} /> Add to Cycle…</ContextMenuItem>
          <ContextMenuSeparator style={{ background: NC.border }} />
          <ContextMenuItem className="gap-2 text-sm" onClick={() => onDeleteMod(mod)}><Archive size={13} /> Archive</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {expanded && modTasks.map((task, idx) => (
        <DraggableTaskRow
          key={task.id} task={task} index={idx} allItems={allItems} depth={1}
          onMove={(from, to) => onMoveTask(from, to, mod.id)}
          onSelect={onSelectTask} onDelete={onDeleteTask}
          onDuplicate={onDuplicateTask} onPromote={onPromoteTask}
          onAddSubtask={onAddSubtask} onAddToCycle={onAddTaskToCycle}
          onSaveState={onSaveTaskState}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  TASKS PANE
// ════════════════════════════════════════════════════════════════════════════════

const EMPTY_TASK_FORM = {
  title: "", description: "",
  state: "ready" as WorkItemState,
  assignee: "", module_id: null as string | null, parent_item_id: null as string | null,
};

export function TasksPane({ projectId, projectName, pendingTaskId, onClearPending, fixtureMode = false }: {
  projectId: string; projectName: string; pendingTaskId: string | null; onClearPending: () => void; fixtureMode?: boolean;
}) {
  const [items, setItems]   = useState<WorkItem[]>([]);
  const [mods,  setMods]    = useState<Mod[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [itemOrder, setItemOrder] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedModId, setSelectedModId]   = useState<string | null>(null);

  const [creatingTask, setCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [taskSaving, setTaskSaving] = useState(false);
  const [deleteTask, setDeleteTask] = useState<WorkItem | null>(null);
  // Move-task machinery: list of ALL projects for the picker + per-project module cache
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [modulesByProject, setModulesByProject] = useState<Record<string, Mod[]>>({});
  useEffect(() => { api<Project[]>("/projects").then(setAllProjects).catch(() => setAllProjects([])); }, []);
  const loadModulesFor = useCallback(async (pid: string) => {
    if (modulesByProject[pid]) return modulesByProject[pid];
    try {
      const list = await api<Mod[]>(`/projects/${pid}/modules`);
      setModulesByProject(prev => ({ ...prev, [pid]: list }));
      return list;
    } catch { return [] as Mod[]; }
  }, [modulesByProject]);
  // Move modal is HOISTED — shared by the task drawer's FolderInput button AND
  // the TaskRow right-click ContextMenu → Move item. Single source of state.
  const [moveTargetTask, setMoveTargetTask] = useState<WorkItem | null>(null);
  const [moveProject, setMoveProject] = useState<string>("");
  const [moveModule, setMoveModule] = useState<string>("");
  const [moveSaving, setMoveSaving] = useState(false);
  const moveTargetModules = modulesByProject[moveProject] ?? [];
  const openMoveFor = useCallback((t: WorkItem) => {
    setMoveTargetTask(t);
    setMoveProject(t.project_id);
    setMoveModule(t.module_id ?? "");
    void loadModulesFor(t.project_id);
  }, [loadModulesFor]);
  useEffect(() => { if (moveTargetTask && moveProject) void loadModulesFor(moveProject); }, [moveTargetTask, moveProject, loadModulesFor]);
  const isMoveNoop = !!moveTargetTask && moveProject === moveTargetTask.project_id && (moveModule || null) === (moveTargetTask.module_id ?? null);

  const [creatingMod, setCreatingMod] = useState(false);
  const [modName, setModName] = useState("");
  const [modDescription, setModDescription] = useState("");
  const [modSaving, setModSaving] = useState(false);
  const [deleteMod, setDeleteMod] = useState<Mod | null>(null);

  // Cycle picker: targets a single task or a whole module
  const [cycleTarget, setCycleTarget] = useState<{ type: "task"; task: WorkItem } | { type: "module"; mod: Mod } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsData, modsData, cyclesData, membersData] = fixtureMode
        ? [
          FOUNDRY_DEMO_ITEMS,
          FOUNDRY_DEMO_MODULES,
          FOUNDRY_DEMO_CYCLES,
          FOUNDRY_DEMO_PROJECT.team.map((name, index) => ({ id: `foundry-member-${index}`, project_id: projectId, name })),
        ]
        : await Promise.all([
          api<WorkItem[]>(`/projects/${projectId}/work-items`),
          api<Mod[]>(`/projects/${projectId}/modules`),
          api<Cycle[]>(`/projects/${projectId}/cycles`),
          api<ProjectMember[]>(`/projects/${projectId}/members`).catch(() => [] as ProjectMember[]),
        ]);
      // Hide archived from the project view entirely — accessible only via Settings → Archived.
      // This keeps the state filter dropdown consistent (its "Archived" option is redundant here; kept for parity with other states).
      const activeMods  = modsData.filter(m => m.state !== "archived");
      const activeItems = itemsData.filter(w => w.state !== "archived");
      setItems(activeItems);
      setMods(activeMods);
      setCycles(cyclesData.filter(c => c.state !== "archived"));
      setMembers(membersData);
      setItemOrder([
        ...activeMods.map(m => m.id),
        ...activeItems.filter(w => !w.module_id && !w.parent_item_id).map(w => w.id),
      ]);
    } catch { toast.error("Failed to load project data"); }
    finally { setLoading(false); }
  }, [fixtureMode, projectId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (pendingTaskId) { setSelectedTaskId(pendingTaskId); onClearPending(); } }, [pendingTaskId]);

  const selectedTask = selectedTaskId ? items.find(i => i.id === selectedTaskId) ?? null : null;
  const selectedMod  = selectedModId  ? mods.find(m => m.id === selectedModId) ?? null : null;

  // ── DnD ─────────────────────────────────────────────────────────────────────

  function moveRootItem(from: number, to: number) { setItemOrder(prev => arrayMove(prev, from, to)); }
  function moveTask(from: number, to: number, moduleId: string) {
    setItems(prev => {
      const group = prev.filter(i => i.module_id === moduleId && !i.parent_item_id);
      const fi = prev.findIndex(i => i.id === group[from]?.id);
      const ti = prev.findIndex(i => i.id === group[to]?.id);
      if (fi < 0 || ti < 0) return prev;
      return arrayMove(prev, fi, ti);
    });
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (!creatingTask && !creatingMod) openAddTask();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [creatingTask, creatingMod]);

  useCmdEnter(createTask, creatingTask);
  useCmdEnter(createMod, creatingMod);

  // ── Task handlers ────────────────────────────────────────────────────────────

  function openAddTask(moduleId: string | null = null) { setTaskForm({ ...EMPTY_TASK_FORM, module_id: moduleId }); setCreatingTask(true); }
  function openAddSubtask(parentId: string) {
    const parent = items.find(i => i.id === parentId);
    setTaskForm({ ...EMPTY_TASK_FORM, parent_item_id: parentId, module_id: parent?.module_id ?? null });
    setCreatingTask(true);
  }

  async function createTask() {
    if (!taskForm.title.trim()) return toast.error("Title is required");
    setTaskSaving(true);
    try {
      const item = await api<WorkItem>(`/projects/${projectId}/work-items`, { method: "POST", body: JSON.stringify(taskForm) });
      setItems(p => [...p, item]);
      if (!taskForm.module_id && !taskForm.parent_item_id) setItemOrder(prev => [...prev, item.id]);
      setCreatingTask(false); setTaskForm(EMPTY_TASK_FORM);
      toast.success(taskForm.parent_item_id ? "Subtask created" : "Task created");
    } catch { toast.error("Failed to create task"); }
    finally { setTaskSaving(false); }
  }

  async function saveTask(id: string, patch: Partial<WorkItem>) {
    try {
      const updated = await api<WorkItem>(`/work-items/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setItems(p => p.map(i => i.id === id ? updated : i));
      toast.success("Saved");
    } catch { toast.error("Failed to save"); }
  }

  async function deleteTask_(task: WorkItem) {
    try {
      await api(`/work-items/${task.id}`, { method: "DELETE" });
      setItems(p => p.filter(i => i.id !== task.id && i.parent_item_id !== task.id));
      setItemOrder(prev => prev.filter(id => id !== task.id));
      if (selectedTaskId === task.id) setSelectedTaskId(null);
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  }

  // Move a task to a different project and/or module. If newProjectId differs from
  // the current project, the task disappears from THIS TasksPane view (which is
  // project-scoped) — that's why we filter it out of `items`. Same-project module
  // moves also work through this path (moduleId change only).
  async function moveTask_(task: WorkItem, newProjectId: string, newModuleId: string | null) {
    try {
      // Cross-project move: backend nulls module_id + parent_work_item_id atomically
      // (module belongs to source project — can't carry across). Send project_id ONLY.
      // Same-project change: send module_id only. Never send both — the module lookup
      // is scoped to the CURRENT project_code server-side, so a target-project module
      // sent alongside project_id would 404.
      const patch: Record<string, unknown> = newProjectId !== task.project_id
        ? { project_id: newProjectId }
        : { module_id: newModuleId };
      const updated = await api<WorkItem>(`/work-items/${task.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      if (newProjectId !== task.project_id) {
        // Cross-project move — task leaves this view
        setItems(p => p.filter(i => i.id !== task.id && i.parent_item_id !== task.id));
        setItemOrder(prev => prev.filter(id => id !== task.id));
        if (selectedTaskId === task.id) setSelectedTaskId(null);
        const projectName = allProjects.find(pj => pj.id === newProjectId)?.name || "project";
        toast.success(`Moved to ${projectName}`);
      } else {
        // Same-project, only module changed — task stays, refresh in place
        setItems(p => p.map(i => i.id === task.id ? updated : i));
        toast.success("Moved");
      }
    } catch (e: any) {
      const msg = (e?.message || "unknown error").slice(0, 140);
      toast.error(`Failed to move: ${msg}`);
    }
  }

  async function duplicateTask(task: WorkItem) {
    try {
      const { id: _id, ...rest } = task;
      const created = await api<WorkItem>(`/projects/${projectId}/work-items`, { method: "POST", body: JSON.stringify({ ...rest, title: `${task.title} (copy)` }) });
      setItems(p => [...p, created]);
      if (!task.module_id && !task.parent_item_id) {
        setItemOrder(prev => { const n = [...prev]; n.splice(n.indexOf(task.id) + 1, 0, created.id); return n; });
      }
      toast.success("Duplicated");
    } catch { toast.error("Failed to duplicate"); }
  }

  async function promoteTask(task: WorkItem) {
    try {
      const mod = await api<Mod>(`/work-items/${task.id}/promote`, { method: "POST" });
      setMods(p => [...p, mod]);
      setItems(p => p.filter(i => i.id !== task.id).map(i => i.parent_item_id === task.id ? { ...i, parent_item_id: null, module_id: task.id } : i));
      if (selectedTaskId === task.id) setSelectedTaskId(null);
      toast.success(`"${task.title}" promoted to module`);
    } catch { toast.error("Failed to promote"); }
  }

  async function addSubtask(parentId: string, title: string) {
    const parent = items.find(i => i.id === parentId); if (!parent) return;
    try {
      const created = await api<WorkItem>(`/projects/${projectId}/work-items`, {
        method: "POST",
        body: JSON.stringify({ title, description: "", state: "ready" as WorkItemState, priority: "none" as WorkItemPriority, assignee: "", module_id: parent.module_id ?? null, parent_item_id: parentId }),
      });
      setItems(p => [...p, created]);
    } catch { toast.error("Failed to add subtask"); }
  }

  async function deleteSubtask(id: string) {
    try { await api(`/work-items/${id}`, { method: "DELETE" }); setItems(p => p.filter(i => i.id !== id)); }
    catch { toast.error("Failed to delete subtask"); }
  }

  async function addBlocker(taskId: string, blockerId: string) {
    const task = items.find(i => i.id === taskId); if (!task) return;
    try {
      const updated = await api<WorkItem>(`/work-items/${taskId}`, { method: "PATCH", body: JSON.stringify({ blocked_by: [...task.blocked_by, blockerId] }) });
      setItems(p => p.map(i => i.id === taskId ? updated : i)); toast.success("Blocker added");
    } catch { toast.error("Failed to add blocker"); }
  }

  async function removeBlocker(taskId: string, blockerId: string) {
    const task = items.find(i => i.id === taskId); if (!task) return;
    try {
      const updated = await api<WorkItem>(`/work-items/${taskId}`, { method: "PATCH", body: JSON.stringify({ blocked_by: task.blocked_by.filter(id => id !== blockerId) }) });
      setItems(p => p.map(i => i.id === taskId ? updated : i)); toast.success("Blocker removed");
    } catch { toast.error("Failed to remove blocker"); }
  }

  // ── Cycle handlers ───────────────────────────────────────────────────────────

  async function getOrCreateCycle(cycleId: string): Promise<string> {
    if (!cycleId.startsWith("__new__")) return cycleId;
    const name = cycleId.slice(7);
    const c = await api<Cycle>(`/projects/${projectId}/cycles`, { method: "POST", body: JSON.stringify({ name, start_date: "", end_date: "" }) });
    setCycles(p => [...p, c]);
    return c.id;
  }

  async function assignTaskToCycle(task: WorkItem, cycleId: string) {
    const id = await getOrCreateCycle(cycleId);
    await saveTask(task.id, { cycle_id: id });
    toast.success(`"${task.title}" added to cycle`);
  }

  async function assignModToCycle(mod: Mod, cycleId: string) {
    const id = await getOrCreateCycle(cycleId);
    const modTasks = items.filter(w => w.module_id === mod.id && !w.parent_item_id);
    await Promise.all(modTasks.map(t => api<WorkItem>(`/work-items/${t.id}`, { method: "PATCH", body: JSON.stringify({ cycle_id: id }) })));
    const updated = await api<WorkItem[]>(`/projects/${projectId}/work-items`);
    setItems(updated);
    toast.success(`All tasks in "${mod.name}" added to cycle`);
  }

  // ── Module handlers ──────────────────────────────────────────────────────────

  async function createMod() {
    if (!modName.trim()) return toast.error("Name is required");
    setModSaving(true);
    try {
      const m = await api<Mod>(`/projects/${projectId}/modules`, { method: "POST", body: JSON.stringify({ name: modName, description: modDescription }) });
      setMods(p => [...p, m]); setItemOrder(prev => [...prev, m.id]);
      setCreatingMod(false); setModName(""); setModDescription(""); toast.success("Module created");
    } catch { toast.error("Failed to create module"); }
    finally { setModSaving(false); }
  }

  async function saveMod(id: string, patch: Partial<Mod>) {
    try {
      const updated = await api<Mod>(`/modules/${id}`, { method: "PATCH", body: JSON.stringify({ ...patch, project_id: projectId }) });
      setMods(p => p.map(m => m.id === id ? updated : m));
      toast.success("Module updated");
    } catch { toast.error("Failed to update module"); }
  }

  async function deleteMod_(m: Mod) {
    try {
      await api(`/modules/${m.id}`, { method: "DELETE", body: JSON.stringify({ project_id: m.project_id }) });
      setMods(p => p.filter(x => x.id !== m.id));
      setItemOrder(prev => prev.filter(id => id !== m.id));
      toast.success("Module archived");
    } catch { toast.error("Failed to archive module"); }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const visibleFilter = (task: WorkItem) => {
    if (stateFilter !== "all" && task.state !== stateFilter) return false;
    // When filter is "all" (default view), hide archived — they're accessible via Settings → Archived.
    if (stateFilter === "all" && task.state === "archived") return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  };

  const modsById  = Object.fromEntries(mods.map(m => [m.id, m]));
  const tasksById = Object.fromEntries(items.map(t => [t.id, t]));

  const orderedEntries = itemOrder
    .map(id => {
      const mod = modsById[id];
      if (mod) return { type: "module" as const, id, mod };
      const task = tasksById[id];
      if (task && !task.module_id && !task.parent_item_id) return { type: "task" as const, id, task };
      return null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const isEmpty = mods.length === 0 && items.filter(w => !w.parent_item_id).length === 0;

  const sharedTaskProps = {
    allItems: items,
    onSelect: (t: WorkItem) => setSelectedTaskId(t.id),
    onDelete: (t: WorkItem) => setDeleteTask(t),
    onDuplicate: duplicateTask,
    onPromote: promoteTask,
    onAddSubtask: openAddSubtask,
    onAddToCycle: (t: WorkItem) => setCycleTarget({ type: "task", task: t }),
    onMove: openMoveFor,
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderColor: NC.borderFaint }}>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: NC.stone }} />
            <input className="nc-search w-full pl-9 pr-3 py-2 text-sm" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <NcSelect
            value={stateFilter}
            onValueChange={setStateFilter}
            triggerClassName="px-3 py-1.5 text-sm rounded-lg border outline-none w-auto"
            items={[
              { value: "all", label: "All states" },
              ...Object.entries(STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color })),
            ]}
          />
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PrimaryBtn aria-label="Add new" className="!px-3">
                  <Plus size={14} />
                </PrimaryBtn>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" sideOffset={6} className="nc-glass-menu min-w-[160px]" style={{ color: NC.cream }}>
                <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onSelect={() => openAddTask()}>
                  <Plus size={13} /> Task
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onSelect={() => { setModName(""); setModDescription(""); setCreatingMod(true); }}>
                  <Layers size={13} /> Module
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Unified tree */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <EmptyState icon={<Spinner />} text="Loading…" />
          ) : isEmpty ? (
            <EmptyState icon={<Target size={36} />} text="No tasks yet" secondaryText="Use the + Task button above to add your first one" />
          ) : (
            orderedEntries.map((entry, idx) => {
              if (entry.type === "module") {
                const modTasks = items.filter(w => w.module_id === entry.id && !w.parent_item_id && visibleFilter(w));
                return (
                  <DraggableProjectItem key={entry.id} id={entry.id} index={idx} onMove={moveRootItem}>
                    {gripRef => (
                      <ModuleSection
                        mod={entry.mod} modTasks={modTasks} allItems={items} gripRef={gripRef}
                        onOpenMod={m => setSelectedModId(m.id)}
                        onDeleteMod={m => setDeleteMod(m)}
                        onAddTask={openAddTask}
                        onSelectTask={t => setSelectedTaskId(t.id)}
                        onDeleteTask={t => setDeleteTask(t)}
                        onDuplicateTask={duplicateTask}
                        onPromoteTask={promoteTask}
                        onAddSubtask={openAddSubtask}
                        onMoveTask={moveTask}
                        onAddModToCycle={m => setCycleTarget({ type: "module", mod: m })}
                        onAddTaskToCycle={t => setCycleTarget({ type: "task", task: t })}
                        onSaveTaskState={(id, state) => saveTask(id, { state })}
                      />
                    )}
                  </DraggableProjectItem>
                );
              }
              if (!visibleFilter(entry.task)) return null;
              return (
                <DraggableProjectItem key={entry.id} id={entry.id} index={idx} onMove={moveRootItem}>
                  {gripRef => <TaskRow task={entry.task} allItems={items} depth={0} gripRef={gripRef} {...sharedTaskProps} />}
                </DraggableProjectItem>
              );
            })
          )}
        </div>

        {/* Task detail slide-over */}
        {selectedTask && (
          <TaskDetailSlideOver
            task={selectedTask} allItems={items} projectName={projectName}
            moduleName={selectedTask.module_id ? mods.find(mod => mod.id === selectedTask.module_id)?.name : undefined}
            onBack={() => {
              setSelectedTaskId(null);
              if (selectedTask.module_id) setSelectedModId(selectedTask.module_id);
            }}
            onClose={() => setSelectedTaskId(null)}
            onSave={saveTask}
            onAddSubtask={addSubtask}
            onDeleteSubtask={deleteSubtask}
            onAddBlocker={addBlocker}
            onRemoveBlocker={removeBlocker}
            onOpenTask={taskId => setSelectedTaskId(taskId)}
            onOpenMove={() => openMoveFor(selectedTask)}
          />
        )}

        {/* Module detail slide-over */}
        {selectedMod && (
          <ModuleDetailSlideOver
            mod={selectedMod} allItems={items} cycles={cycles} projectName={projectName}
            onBack={() => setSelectedModId(null)}
            onClose={() => setSelectedModId(null)}
            onSave={saveMod}
            onAddTask={id => { openAddTask(id); setSelectedModId(null); }}
            onSelectTask={t => { setSelectedModId(null); setSelectedTaskId(t.id); }}
            onDeleteMod={m => { setSelectedModId(null); setDeleteMod(m); }}
            onAddToCycle={cycleId => assignModToCycle(selectedMod, cycleId)}
          />
        )}

        {/* Cycle picker */}
        {cycleTarget && (
          <CyclePicker
            open={!!cycleTarget} onClose={() => setCycleTarget(null)} cycles={cycles}
            onPick={cycleId => {
              if (cycleTarget.type === "task") assignTaskToCycle(cycleTarget.task, cycleId);
              else assignModToCycle(cycleTarget.mod, cycleId);
            }}
            onCreateAndPick={async name => {
              const c = await api<Cycle>(`/projects/${projectId}/cycles`, { method: "POST", body: JSON.stringify({ name, start_date: "", end_date: "" }) });
              setCycles(p => [...p, c]);
              if (cycleTarget.type === "task") await assignTaskToCycle(cycleTarget.task, c.id);
              else await assignModToCycle(cycleTarget.mod, c.id);
              return c.id;
            }}
          />
        )}

        {/* Move task modal — hoisted from TaskDetailSlideOver so right-click ContextMenu shares it */}
        {moveTargetTask && (
          <Modal open={!!moveTargetTask} onClose={() => setMoveTargetTask(null)} title="Move task">
            <div className="text-xs mb-3" style={{ color: NC.stone }}>
              Currently in <span style={{ color: NC.cream }}>{allProjects.find(p => p.id === moveTargetTask.project_id)?.name ?? moveTargetTask.project_id}</span>
              {moveTargetTask.module_id ? <> · <span style={{ color: NC.cream }}>{mods.find(m => m.id === moveTargetTask.module_id)?.name ?? moveTargetTask.module_id}</span></> : ""}
            </div>
            <Field label="Project">
              <NcSelect
                value={moveProject}
                onValueChange={(v) => { setMoveProject(v); setMoveModule(""); }}
                items={allProjects.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Field>
            <Field label="Module">
              <NcSelect
                value={moveModule || "__none__"}
                onValueChange={(v) => setMoveModule(v === "__none__" ? "" : v)}
                items={[
                  { value: "__none__", label: "(no module — project root)" },
                  ...moveTargetModules.map((m) => ({ value: m.id, label: m.name })),
                ]}
              />
            </Field>
            <div className="flex gap-2 justify-end pt-1">
              <TextBtn onClick={() => setMoveTargetTask(null)}>Cancel</TextBtn>
              <PrimaryBtn
                loading={moveSaving}
                disabled={isMoveNoop || moveSaving}
                onClick={async () => {
                  setMoveSaving(true);
                  try {
                    await moveTask_(moveTargetTask, moveProject, moveModule || null);
                    setMoveTargetTask(null);
                  } finally { setMoveSaving(false); }
                }}
              >Move</PrimaryBtn>
            </div>
          </Modal>
        )}

        {/* Create task modal */}
        <Modal open={creatingTask} onClose={() => setCreatingTask(false)} title={taskForm.parent_item_id ? "New Subtask" : "New Task"}>
          <Field label="Title"><NcInput value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" autoFocus onKeyDown={e => e.key === "Enter" && createTask()} /></Field>
          <Field label="Description"><NcTextarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" /></Field>
          <Field label="State"><NcSelect value={taskForm.state} onValueChange={v => setTaskForm(p => ({ ...p, state: v as WorkItemState }))} items={Object.entries(STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))} /></Field>
          <Field label="Assignee">
            <NcSelect
              value={taskForm.assignee || "__unassigned__"}
              onValueChange={v => setTaskForm(p => ({ ...p, assignee: v === "__unassigned__" ? "" : v }))}
              items={[
                { value: "__unassigned__", label: "(unassigned)" },
                ...members.map(member => ({ value: member.name, label: member.name })),
              ]}
            />
          </Field>
          <div className="flex gap-2 justify-end pt-1"><TextBtn onClick={() => setCreatingTask(false)}>Cancel</TextBtn><PrimaryBtn loading={taskSaving} onClick={createTask}>Create</PrimaryBtn></div>
        </Modal>

        {/* Create module modal */}
        <Modal open={creatingMod} onClose={() => setCreatingMod(false)} title="New Module" maxWidth="max-w-sm">
          <Field label="Name"><NcInput value={modName} onChange={e => setModName(e.target.value)} placeholder="Module name" autoFocus onKeyDown={e => e.key === "Enter" && createMod()} /></Field>
          <Field label="Description"><NcTextarea value={modDescription} onChange={e => setModDescription(e.target.value)} placeholder="Optional — what is this for?" rows={3} /></Field>
          <div className="flex gap-2 justify-end pt-1"><TextBtn onClick={() => setCreatingMod(false)}>Cancel</TextBtn><PrimaryBtn loading={modSaving} onClick={createMod}>Create</PrimaryBtn></div>
        </Modal>

        <ConfirmDelete open={!!deleteMod} onClose={() => setDeleteMod(null)} onConfirm={() => deleteMod && deleteMod_(deleteMod)} label="module" />
        <ConfirmDelete open={!!deleteTask} onClose={() => setDeleteTask(null)} onConfirm={() => deleteTask && deleteTask_(deleteTask)} label="task" />
      </div>
    </DndProvider>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  TEAM TAB
// ════════════════════════════════════════════════════════════════════════════════

function memberInitials(name: string) {
  return name.split("-").map(w => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
}

function MemberAvatar({ name, size = 36 }: { name: string; size?: number }) {
  // Avatar rotation — brand-ui palette (2026-07-26). Stable per-name via charCode hash.
  const colors = ["#7A9E93", "#6D5AD1", "#5B7D73", "#E8B87A", "#8E96CC", "#8879A0", "#4E4C82"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
      style={{ width: size, height: size, background: `${colors[idx]}26`, border: `1.5px solid ${colors[idx]}55`, color: colors[idx], fontSize: size * 0.36 }}>
      {memberInitials(name)}
    </div>
  );
}

export function TeamTab({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [addName, setAddName] = useState("");
  const [saving, setSaving]   = useState(false);
  const { agents } = useAgents();

  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await api<ProjectMember[]>(`/projects/${projectId}/members`); setMembers(data); }
    catch { toast.error("Failed to load team"); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function addMember() {
    if (!addName) return toast.error("Select a team member");
    if (members.find(m => m.name === addName)) return toast.error("Already on team");
    setSaving(true);
    try {
      const m = await api<ProjectMember>(`/projects/${projectId}/members`, { method: "POST", body: JSON.stringify({ name: addName }) });
      setMembers(p => [...p, m]); setAdding(false); setAddName("");
      toast.success(`${addName} added to team`);
    } catch { toast.error("Failed to add member"); }
    finally { setSaving(false); }
  }

  async function removeMember(member: ProjectMember) {
    try {
      await api(`/projects/${projectId}/members/${member.id}`, { method: "DELETE" });
      setMembers(p => p.filter(m => m.id !== member.id));
      toast.success("Removed");
    } catch { toast.error("Failed to remove"); }
  }

  const onRoster = members.map(m => m.name);
  const available = agents.filter(a => !onRoster.includes(a.agent_name));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ borderColor: NC.borderFaint }}>
        <span className="text-xs" style={{ color: NC.stone }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
        <TonalBtn onClick={() => setAdding(true)} disabled={available.length === 0}>
          <UserPlus size={13} /> Add member
        </TonalBtn>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? <EmptyState icon={<Spinner />} text="Loading team…" /> :
          members.length === 0 ? <EmptyState icon={<Users size={36} />} text="No team members yet" secondaryText="Use Add Member above to invite from the roster" /> : (
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-xl border group" style={{ background: "rgba(26,24,40,0.7)", borderColor: NC.border }}>
                <MemberAvatar name={member.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: NC.cream }}>{member.name}</p>
                </div>
                <button onClick={() => removeMember(member)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/[0.06]" style={{ color: NC.stone }}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Team Member" maxWidth="max-w-sm">
        <Field label="Person">
          <NcSelect
            value={addName}
            onValueChange={v => setAddName(v)}
            placeholder="Select person…"
            items={available.map(a => ({ value: a.agent_name, label: a.agent_name }))}
          />
        </Field>
        <div className="flex gap-2 justify-end pt-1">
          <TextBtn onClick={() => setAdding(false)}>Cancel</TextBtn>
          <PrimaryBtn loading={saving} onClick={addMember}>Add</PrimaryBtn>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  CYCLES TAB
// ════════════════════════════════════════════════════════════════════════════════

const EMPTY_CYCLE_FORM = { name: "", description: "", start_date: "", end_date: "" };

export function CyclesTab({ projectId }: { projectId: string }) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editCycle, setEditCycle] = useState<Cycle | null>(null);
  const [deleteCycle, setDeleteCycle] = useState<Cycle | null>(null);
  const [form, setForm] = useState(EMPTY_CYCLE_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Cycle[]>(`/projects/${projectId}/cycles`);
      // Hide archived cycles from the tab (accessible via Settings → Archived).
      const activeCycles = data.filter(c => c.state !== "archived");
      setCycles(activeCycles);
      const allItems = await api<WorkItem[]>(`/projects/${projectId}/work-items`).catch(() => [] as WorkItem[]);
      const countMap: Record<string, number> = {};
      activeCycles.forEach(c => { countMap[c.id] = allItems.filter(w => w.cycle_id === c.id).length; });
      setCounts(countMap);
    } catch { toast.error("Failed to load cycles"); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  useCmdEnter(async () => { if (creating) await create(); }, creating);

  async function create() {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const c = await api<Cycle>(`/projects/${projectId}/cycles`, { method: "POST", body: JSON.stringify(form) });
      setCycles(p => [...p, c]); setCounts(p => ({ ...p, [c.id]: 0 }));
      setCreating(false); setForm(EMPTY_CYCLE_FORM);
      toast.success("Cycle created");
    } catch { toast.error("Failed to create cycle"); }
    finally { setSaving(false); }
  }

  async function remove(c: Cycle) {
    try {
      await api(`/projects/${projectId}/cycles/${c.id}`, { method: "DELETE" });
      setCycles(p => p.filter(x => x.id !== c.id));
      toast.success("Cycle deleted");
    } catch { toast.error("Failed to delete cycle"); }
  }

  async function duplicate(c: Cycle) {
    try {
      const { id: _id, ...rest } = c;
      const created = await api<Cycle>(`/projects/${projectId}/cycles`, { method: "POST", body: JSON.stringify({ ...rest, name: `${c.name} (copy)` }) });
      setCycles(p => [...p, created]); setCounts(p => ({ ...p, [created.id]: 0 }));
      toast.success("Duplicated");
    } catch { toast.error("Failed to duplicate"); }
  }

  function fmtDate(d: string) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  function cycleStatus(c: Cycle) {
    const now = Date.now(), start = new Date(c.start_date).getTime(), end = new Date(c.end_date).getTime();
    if (now < start) return { label: "Upcoming", color: NC.stone };
    if (now > end)   return { label: "Completed", color: NC.seaGreen };
    return { label: "Active", color: "#c9a84c" };
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderColor: NC.borderFaint }}>
        <span className="text-xs" style={{ color: NC.stone }}>{cycles.length} cycle{cycles.length !== 1 ? "s" : ""}</span>
        <TonalBtn onClick={() => { setForm(EMPTY_CYCLE_FORM); setCreating(true); }}><Plus size={13} /> New cycle</TonalBtn>
      </div>
      <div className="flex-1 overflow-auto p-5 space-y-3">
        {loading ? <EmptyState icon={<Spinner />} text="Loading cycles…" /> :
         cycles.length === 0 ? <EmptyState icon={<Calendar size={36} />} text="No cycles yet" secondaryText="Cycles group tasks by time window (e.g. sprints)" /> :
         cycles.map(c => {
           const status = cycleStatus(c);
           return (
             <ContextMenu key={c.id}>
               <ContextMenuTrigger asChild>
                 <div className="p-4 rounded-xl border cursor-default" style={{ background: "rgba(26,24,40,0.8)", borderColor: NC.border }}>
                   <div className="flex items-center gap-2 mb-2">
                     <span className="font-medium" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 17, fontWeight: 600, color: NC.cream }}>{c.name}</span>
                     <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: status.color, background: `${status.color}1a` }}>{status.label}</span>
                   </div>
                   {c.description && <p className="text-sm mb-2" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: NC.stone, lineHeight: 1.55 }}>{c.description}</p>}
                   <div className="flex items-center gap-5 text-xs" style={{ color: NC.stone }}>
                     <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate(c.start_date)} <ArrowRight size={11} /> {fmtDate(c.end_date)}</span>
                     <span className="flex items-center gap-1"><Hash size={11} />{counts[c.id] ?? 0} tasks</span>
                   </div>
                 </div>
               </ContextMenuTrigger>
               <ContextMenuContent className="nc-glass-menu" style={{ color: NC.cream }}>
                 <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => setEditCycle({ ...c })}><Edit2 size={13} /> Edit</ContextMenuItem>
                 <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => duplicate(c)}><Copy size={13} /> Duplicate</ContextMenuItem>
                 <ContextMenuSeparator style={{ background: NC.border }} />
                 <ContextMenuItem className="gap-2 text-sm" onClick={() => setDeleteCycle(c)}><Archive size={13} /> Archive</ContextMenuItem>
               </ContextMenuContent>
             </ContextMenu>
           );
         })}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New Cycle" maxWidth="max-w-sm">
        <Field label="Name"><NcInput value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Sprint 1" autoFocus /></Field>
        <Field label="Description"><NcTextarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional — what is this for?" rows={3} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date"><NcInput type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></Field>
          <Field label="End Date"><NcInput type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></Field>
        </div>
        <div className="flex gap-2 justify-end pt-1"><TextBtn onClick={() => setCreating(false)}>Cancel</TextBtn><PrimaryBtn loading={saving} onClick={create}>Create</PrimaryBtn></div>
      </Modal>

      {editCycle && (
        <Modal open={!!editCycle} onClose={() => setEditCycle(null)} title="Edit Cycle" maxWidth="max-w-sm">
          <Field label="Name"><NcInput value={editCycle.name} onChange={e => setEditCycle(p => p ? { ...p, name: e.target.value } : p)} /></Field>
          <Field label="Description"><NcTextarea value={editCycle.description ?? ""} onChange={e => setEditCycle(p => p ? { ...p, description: e.target.value } : p)} placeholder="Optional — what is this for?" rows={3} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date"><NcInput type="date" value={editCycle.start_date} onChange={e => setEditCycle(p => p ? { ...p, start_date: e.target.value } : p)} /></Field>
            <Field label="End Date"><NcInput type="date" value={editCycle.end_date} onChange={e => setEditCycle(p => p ? { ...p, end_date: e.target.value } : p)} /></Field>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <TextBtn onClick={() => setEditCycle(null)}>Cancel</TextBtn>
            <PrimaryBtn loading={saving} onClick={async () => {
              setSaving(true);
              try { await api(`/projects/${projectId}/cycles/${editCycle.id}`, { method: "PATCH", body: JSON.stringify(editCycle) }); setCycles(p => p.map(c => c.id === editCycle.id ? editCycle : c)); setEditCycle(null); toast.success("Updated"); }
              catch { toast.error("Failed to update"); } finally { setSaving(false); }
            }}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}
      <ConfirmDelete open={!!deleteCycle} onClose={() => setDeleteCycle(null)} onConfirm={() => deleteCycle && remove(deleteCycle)} label="cycle" />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  CYCLES PANEL (slide-over, opened from sidebar)
// ════════════════════════════════════════════════════════════════════════════════

function CyclesPanel({ open, onClose, projects, defaultProjectId }: {
  open: boolean; onClose: () => void; projects: Project[]; defaultProjectId: string | null;
}) {
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId);

  useEffect(() => { if (defaultProjectId) setProjectId(defaultProjectId); }, [defaultProjectId]);

  return (
    <SlideOver open={open} onClose={onClose} title="Cycles">
      {projects.length === 0 ? (
        <EmptyState icon={<Calendar size={36} />} text="Create a project first" />
      ) : (
        <>
          <div className="mb-5 -mt-1">
            <NcSelect
              value={projectId ?? ""}
              onValueChange={v => setProjectId(v || null)}
              placeholder="Select project…"
              items={projects.map(p => ({ value: p.id, label: p.name }))}
            />
          </div>
          {projectId ? (
            <CyclesTab projectId={projectId} />
          ) : (
            <EmptyState icon={<Calendar size={32} />} text="Select a project to see its cycles" />
          )}
        </>
      )}
    </SlideOver>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  PROJECT VIEW
// ════════════════════════════════════════════════════════════════════════════════

// Status pill — colored badge in project header + wraps NcSelect for status change.
// Defensive default: rows created before status was populated fall back to 'planned'.
// Glass treatment via .nc-glass-pill (einUI-inspired) — see theme.css.
export function StatusPill({ status, onChange, disabled }: { status: ProjectStatus | undefined; onChange: (s: ProjectStatus) => Promise<void> | void; disabled?: boolean }) {
  const safeStatus: ProjectStatus = status && status in PROJECT_STATUS_CFG ? status : "planned";
  const cfg = PROJECT_STATUS_CFG[safeStatus];
  const items = Object.entries(PROJECT_STATUS_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }));
  return (
    <NcSelect
      value={safeStatus}
      onValueChange={v => { void onChange(v as ProjectStatus); }}
      disabled={disabled}
      triggerClassName="nc-glass-pill text-xs font-medium rounded-full px-2.5 py-0.5 gap-1 whitespace-nowrap"
      triggerStyle={{ ["--pill-color" as string]: cfg.color }}
      items={items}
    />
  );
}

// Project Info tab — full-fidelity project edit surface (replaces the old micro-modal).
export function ProjectInfoTab({ project, onSave, onSwitchTab }: {
  project: Project;
  onSave: (id: string, patch: Partial<Project>) => Promise<void>;
  onSwitchTab: (tab: string) => void;
}) {
  const initialStatus: ProjectStatus = project.status && project.status in PROJECT_STATUS_CFG ? project.status : "planned";
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? "",
    folder_path: project.folder_path ?? "",
    status: initialStatus,
    owner: project.owner ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const { agents } = useAgents();

  // Reset form when project changes (right-click Edit on a different project reuses this component).
  useEffect(() => {
    const s: ProjectStatus = project.status && project.status in PROJECT_STATUS_CFG ? project.status : "planned";
    setForm({
      name: project.name,
      description: project.description ?? "",
      folder_path: project.folder_path ?? "",
      status: s,
      owner: project.owner ?? "",
    });
  }, [project.id, project.name, project.description, project.folder_path, project.status, project.owner]);

  // Fetch team (ProjectMember table) + task assignees (auto-rollup, per Daniel spec 2026-07-27).
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<ProjectMember[]>(`/projects/${project.id}/members`).catch(() => [] as ProjectMember[]),
      api<WorkItem[]>(`/projects/${project.id}/work-items`).catch(() => [] as WorkItem[]),
    ]).then(([m, items]) => {
      if (cancelled) return;
      setMembers(m);
      const uniqueAssignees = Array.from(new Set(items.map(i => i.assignee).filter(Boolean)));
      setAssignees(uniqueAssignees);
    });
    return () => { cancelled = true; };
  }, [project.id]);

  const memberNames = new Set(members.map(m => m.name));
  const rolledUp = assignees.filter(a => !memberNames.has(a));
  const teamUnion = [...members.map(m => m.name), ...rolledUp];

  const dirty =
    form.name !== project.name ||
    form.description !== (project.description ?? "") ||
    form.folder_path !== (project.folder_path ?? "") ||
    form.status !== project.status ||
    form.owner !== (project.owner ?? "");

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await onSave(project.id, {
        name: form.name.trim(),
        description: form.description,
        folder_path: form.folder_path,
        status: form.status,
        owner: form.owner,
      });
    } finally { setSaving(false); }
  }

  const ownerItems = [
    { value: "__none__", label: "(none)" },
    { value: "daniel", label: "daniel" },
    ...agents.filter(a => a.agent_name !== "daniel").map(a => ({ value: a.agent_name, label: a.agent_name })),
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-7 space-y-6">
      <div className="space-y-4">
        <Field label="Name">
          <NcInput value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Description">
          <NcTextarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows={3} />
        </Field>
        <Field label="Folder Path">
          <div className="flex items-center gap-2">
            <Folder size={13} style={{ color: NC.stone, flexShrink: 0 }} />
            <NcInput value={form.folder_path} onChange={e => setForm(p => ({ ...p, folder_path: e.target.value }))} placeholder="/path/to/project" style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12 }} />
          </div>
        </Field>
        <Field label="Status">
          <NcSelect
            value={form.status}
            onValueChange={v => setForm(p => ({ ...p, status: v as ProjectStatus }))}
            items={Object.entries(PROJECT_STATUS_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))}
          />
        </Field>
        <Field label="Owner">
          <NcSelect
            value={form.owner || "__none__"}
            onValueChange={v => setForm(p => ({ ...p, owner: v === "__none__" ? "" : v }))}
            placeholder="No owner"
            items={ownerItems}
          />
        </Field>
      </div>

      {/* Team preview — read-only union of ProjectMember table + distinct task assignees */}
      <div className="pt-4" style={{ borderColor: NC.borderFaint }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: NC.stone }}>Team ({teamUnion.length})</p>
          <button onClick={() => onSwitchTab("team")} className="text-xs hover:underline" style={{ color: NC.textMuted }}>Manage in Team tab →</button>
        </div>
        {teamUnion.length === 0 ? (
          <p className="text-sm" style={{ color: "rgba(138,133,128,0.4)" }}>No members yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teamUnion.map(name => {
              const isRolledUp = !memberNames.has(name);
              return (
                <div key={name} className="flex items-center gap-2 py-1 pl-1 pr-3 rounded-full border" style={{ background: NC.card, borderColor: NC.border }} title={isRolledUp ? "Auto-rolled up from task assignee" : "Team member"}>
                  <MemberAvatar name={name} size={20} />
                  <span className="text-xs" style={{ color: NC.cream }}>{name}</span>
                  {isRolledUp && <span className="text-[10px] uppercase tracking-widest" style={{ color: NC.stone }}>via task</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="pt-4 space-y-1.5" style={{ borderColor: NC.borderFaint }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: NC.stone }}>
          <span className="uppercase tracking-widest font-semibold w-20">Created</span>
          <span style={{ color: NC.cream, fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>{new Date(project.created_at).toLocaleString()}</span>
        </div>
        {project.client && (
          <div className="flex items-center gap-2 text-xs" style={{ color: NC.stone }}>
            <span className="uppercase tracking-widest font-semibold w-20">Client</span>
            <span style={{ color: NC.cream }}>{project.client}</span>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4">
        <PrimaryBtn loading={saving} disabled={!dirty || !form.name.trim()} onClick={handleSave}>Save changes</PrimaryBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared props contract for ProjectView and any alternate shell (labs 2/3).
// Shell files (ProjectViewBentoShell, ProjectViewLayeredShell) import this to
// stay drop-in-compatible with the canonical ProjectView.
// ─────────────────────────────────────────────────────────────────────────────
export type ProjectViewShellProps = {
  project: Project;
  pendingTaskId: string | null;
  onClearPending: () => void;
  pendingTab: string | null;
  onClearPendingTab: () => void;
  onSaveProject: (id: string, patch: Partial<Project>) => Promise<void>;
  foundryMode?: boolean;
};

// (Old bottom-border-tab ProjectView deleted 2026-07-31 — replaced app-wide by
//  ProjectViewLayeredShell as canonical. See src/app/ProjectViewLayeredShell.tsx.
//  ProjectViewShellProps above is still the contract every shell honors.)

// ════════════════════════════════════════════════════════════════════════════════
//  INITIATIVE VIEW
// ════════════════════════════════════════════════════════════════════════════════

function InitiativeView({ initiative, allProjects, onUpdateInit }: {
  initiative: Initiative;
  allProjects: Project[];
  onUpdateInit: (id: string, patch: Partial<Initiative>) => Promise<void>;
}) {
  const [links, setLinks] = useState<InitLinks>({ project_ids: [], module_ids: [], work_item_ids: [] });
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<WorkItem[]>([]);
  const [allMods, setAllMods] = useState<Mod[]>([]);
  const [linkingProjects, setLinkingProjects] = useState(false);
  const [pickItems, setPickItems] = useState(false);
  const [pickMods, setPickMods] = useState(false);
  const [newDocPath, setNewDocPath] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await api<InitLinks>(`/initiatives/${initiative.id}/links`); setLinks(data); }
    catch { setLinks({ project_ids: [], module_ids: [], work_item_ids: [] }); }
    finally { setLoading(false); }
  }, [initiative.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!links.project_ids.length) { setAllItems([]); setAllMods([]); return; }
    Promise.all(links.project_ids.map(pid => api<WorkItem[]>(`/projects/${pid}/work-items`).catch(() => [] as WorkItem[]))).then(r => setAllItems(r.flat()));
    Promise.all(links.project_ids.map(pid => api<Mod[]>(`/projects/${pid}/modules`).catch(() => [] as Mod[]))).then(r => setAllMods(r.flat()));
  }, [links.project_ids]);

  async function linkProject(pid: string) {
    try { await api(`/initiatives/${initiative.id}/links`, { method: "POST", body: JSON.stringify({ initiative_id: initiative.id, project_ids: [pid], module_ids: [], work_item_ids: [] }) }); setLinks(p => ({ ...p, project_ids: [...p.project_ids, pid] })); toast.success("Project linked"); }
    catch { toast.error("Failed"); }
  }
  async function unlinkProject(pid: string) {
    try { await api(`/initiatives/${initiative.id}/links/project/${pid}`, { method: "DELETE" }); setLinks(p => ({ ...p, project_ids: p.project_ids.filter(x => x !== pid) })); toast.success("Unlinked"); }
    catch { toast.error("Failed"); }
  }
  async function linkItem(wiId: string) {
    try { await api(`/initiatives/${initiative.id}/links`, { method: "POST", body: JSON.stringify({ initiative_id: initiative.id, project_ids: [], module_ids: [], work_item_ids: [wiId] }) }); setLinks(p => ({ ...p, work_item_ids: [...p.work_item_ids, wiId] })); toast.success("Task linked"); }
    catch { toast.error("Failed"); }
  }
  async function unlinkItem(wiId: string) {
    try { await api(`/initiatives/${initiative.id}/links/work_item/${wiId}`, { method: "DELETE" }); setLinks(p => ({ ...p, work_item_ids: p.work_item_ids.filter(x => x !== wiId) })); toast.success("Unlinked"); }
    catch { toast.error("Failed"); }
  }
  async function linkMod(modId: string) {
    try { await api(`/initiatives/${initiative.id}/links`, { method: "POST", body: JSON.stringify({ initiative_id: initiative.id, project_ids: [], module_ids: [modId], work_item_ids: [] }) }); setLinks(p => ({ ...p, module_ids: [...p.module_ids, modId] })); toast.success("Module linked"); }
    catch { toast.error("Failed"); }
  }
  async function unlinkMod(modId: string) {
    try { await api(`/initiatives/${initiative.id}/links/module/${modId}`, { method: "DELETE" }); setLinks(p => ({ ...p, module_ids: p.module_ids.filter(x => x !== modId) })); toast.success("Unlinked"); }
    catch { toast.error("Failed"); }
  }

  async function addDocPath() {
    if (!newDocPath.trim()) return;
    await onUpdateInit(initiative.id, { doc_paths: [...initiative.doc_paths, newDocPath.trim()] });
    setNewDocPath("");
  }
  async function removeDocPath(path: string) {
    await onUpdateInit(initiative.id, { doc_paths: initiative.doc_paths.filter(p => p !== path) });
  }

  const linkedProjects   = allProjects.filter(p => links.project_ids.includes(p.id));
  const unlinkedProjects = allProjects.filter(p => !links.project_ids.includes(p.id));
  const linkedItems      = allItems.filter(i => links.work_item_ids.includes(i.id));
  const unlinkedItems    = allItems.filter(i => !links.work_item_ids.includes(i.id));
  const linkedMods       = allMods.filter(m => links.module_ids.includes(m.id));
  const unlinkedMods     = allMods.filter(m => !links.module_ids.includes(m.id));
  const statusCfg = INIT_STATE_CFG[initiative.state];

  const divider = <GlassSeparator className="my-4" />;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-7 pt-6 pb-5 flex-shrink-0" style={{ borderColor: NC.borderFaint }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#c9a84c" }}>Initiative</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 30, color: NC.cream, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.028em" }}>{initiative.title}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: statusCfg.color, background: `${statusCfg.color}1a` }}>{statusCfg.label}</span>
        </div>
        {initiative.external_id && <p className="text-xs mt-1" style={{ color: NC.stone }}>ID: {initiative.external_id}</p>}
        {initiative.description && <p className="text-sm mt-2 max-w-2xl" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: NC.stone, lineHeight: 1.55 }}>{initiative.description}</p>}
      </div>
      <GlassSeparator />

      <div className="flex-1 overflow-auto p-7 space-y-8">
        {loading ? <EmptyState icon={<Spinner />} text="Loading…" /> : (
          <>
            {/* Linked Projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: NC.stone }}>Linked Projects ({links.project_ids.length})</p>
                <TonalBtn onClick={() => setLinkingProjects(true)}><Link2 size={12} /> Add</TonalBtn>
              </div>
              {linkedProjects.length === 0 ? <p className="text-sm" style={{ color: NC.stone }}>None linked</p> : (
                <div className="space-y-2">
                  {linkedProjects.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ background: "rgba(26,24,40,0.6)", borderColor: NC.border }}>
                      <div className="flex items-center gap-2"><FolderOpen size={13} style={{ color: NC.green }} /><span className="text-sm font-medium" style={{ color: NC.cream }}>{p.name}</span></div>
                      <button onClick={() => unlinkProject(p.id)} className="p-1 rounded hover:bg-white/5" style={{ color: NC.stone }}><Unlink size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {divider}

            {/* Linked Modules */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: NC.stone }}>Linked Modules ({links.module_ids.length})</p>
                <TonalBtn onClick={() => setPickMods(true)} disabled={allMods.length === 0}><Link2 size={12} /> Add</TonalBtn>
              </div>
              {linkedMods.length === 0 ? <p className="text-sm" style={{ color: NC.stone }}>{allMods.length === 0 ? "Link a project first" : "None linked"}</p> : (
                <div className="space-y-2">
                  {linkedMods.map(m => (
                    <div key={m.id} className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ background: "rgba(26,24,40,0.6)", borderColor: NC.border }}>
                      <div className="flex items-center gap-2"><Layers size={13} style={{ color: NC.green }} /><span className="text-sm font-medium" style={{ color: NC.cream }}>{m.name}</span></div>
                      <button onClick={() => unlinkMod(m.id)} className="p-1 rounded hover:bg-white/5" style={{ color: NC.stone }}><Unlink size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {divider}

            {/* Linked Work Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: NC.stone }}>Linked Work Items ({links.work_item_ids.length})</p>
                <TonalBtn onClick={() => setPickItems(true)} disabled={allItems.length === 0}><Link2 size={12} /> Add</TonalBtn>
              </div>
              {linkedItems.length === 0 ? <p className="text-sm" style={{ color: NC.stone }}>{allItems.length === 0 ? "Link a project first" : "None linked"}</p> : (
                <div className="space-y-2">
                  {linkedItems.map(i => (
                    <div key={i.id} className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ background: "rgba(26,24,40,0.6)", borderColor: NC.border }}>
                      <div className="flex items-center gap-3 flex-1 min-w-0"><PriBadge priority={i.priority} /><span className="text-sm font-medium truncate" style={{ color: NC.cream }}>{i.title}</span><StateBadge state={i.state} /></div>
                      <button onClick={() => unlinkItem(i.id)} className="p-1 rounded hover:bg-white/5 ml-3 flex-shrink-0" style={{ color: NC.stone }}><Unlink size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {divider}

            {/* Relevant Files */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: NC.stone }}>Relevant Files ({initiative.doc_paths.length})</p>
              {initiative.doc_paths.length > 0 && (
                <div className="space-y-0.5 mb-3">
                  {initiative.doc_paths.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 group py-1.5 px-3 rounded-lg hover:bg-white/[0.06] border" style={{ borderColor: NC.borderFaint }}>
                      <FileText size={11} style={{ color: NC.stone, flexShrink: 0 }} />
                      <span className="flex-1 text-xs font-mono truncate" style={{ color: NC.cream }}>{p}</span>
                      <button onClick={() => removeDocPath(p)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity" style={{ color: NC.stone }}><X size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <NcInput value={newDocPath} onChange={e => setNewDocPath(e.target.value)} placeholder="/path/to/relevant/file.md" onKeyDown={e => e.key === "Enter" && addDocPath()} style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12 }} />
                <TonalBtn onClick={addDocPath} className="flex-shrink-0"><Plus size={13} /></TonalBtn>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pickers */}
      <Modal open={linkingProjects} onClose={() => setLinkingProjects(false)} title="Link Project" maxWidth="max-w-sm">
        {unlinkedProjects.length === 0 ? <p className="text-sm py-2" style={{ color: NC.stone }}>All projects linked</p> : (
          <div className="space-y-1 max-h-64 overflow-auto -mx-6 px-6">
            {unlinkedProjects.map(p => <button key={p.id} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5" style={{ color: NC.cream }} onClick={() => { linkProject(p.id); setLinkingProjects(false); }}><FolderOpen size={13} style={{ color: NC.green }} />{p.name}</button>)}
          </div>
        )}
      </Modal>
      <Modal open={pickMods} onClose={() => setPickMods(false)} title="Link Module" maxWidth="max-w-sm">
        {unlinkedMods.length === 0 ? <p className="text-sm py-2" style={{ color: NC.stone }}>All modules linked</p> : (
          <div className="space-y-1 max-h-64 overflow-auto -mx-6 px-6">
            {unlinkedMods.map(m => <button key={m.id} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5" style={{ color: NC.cream }} onClick={() => { linkMod(m.id); setPickMods(false); }}><Layers size={13} style={{ color: NC.green }} />{m.name}</button>)}
          </div>
        )}
      </Modal>
      <Modal open={pickItems} onClose={() => setPickItems(false)} title="Link Work Item">
        {unlinkedItems.length === 0 ? <p className="text-sm py-2" style={{ color: NC.stone }}>All items linked</p> : (
          <div className="space-y-1 max-h-72 overflow-auto -mx-6 px-6">
            {unlinkedItems.map(i => <button key={i.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/5" style={{ color: NC.cream }} onClick={() => { linkItem(i.id); setPickItems(false); }}><StateBadge state={i.state} /><span className="flex-1 truncate">{i.title}</span></button>)}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════════════════════════

const CYCLE_ACCENT = "#7C6FCD"; // indigo-purple accent

function CyclesNavButton({ projectId, onClick, onNew }: { projectId: string | null; onClick: () => void; onNew: () => void }) {
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);

  useEffect(() => {
    if (!projectId) { setActiveCycle(null); return; }
    api<Cycle[]>(`/projects/${projectId}/cycles`).then(cycles => {
      const now = Date.now();
      const active = cycles.find(c => {
        if (!c.start_date || !c.end_date) return false;
        return now >= new Date(c.start_date).getTime() && now <= new Date(c.end_date).getTime();
      });
      setActiveCycle(active ?? null);
    }).catch(() => setActiveCycle(null));
  }, [projectId]);

  const isActive = !!activeCycle;
  const daysLeft = activeCycle ? Math.ceil((new Date(activeCycle.end_date).getTime() - Date.now()) / 86400000) : 0;

  return (
    <div
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all group"
      style={isActive ? {
        background: `${CYCLE_ACCENT}33`,
        border: `1px solid ${CYCLE_ACCENT}88`,
        boxShadow: `0 0 0 1px ${CYCLE_ACCENT}22, inset 0 1px 0 ${CYCLE_ACCENT}22`,
      } : {
        background: "transparent",
        border: `1px solid ${NC.borderFaint}`,
      }}
    >
      <button className="flex items-center gap-2 flex-1 min-w-0 text-left" onClick={onClick}>
        <Calendar size={13} style={{ color: isActive ? CYCLE_ACCENT : NC.stone, flexShrink: 0 }} />
        <span className="flex-1 font-semibold" style={{ color: isActive ? NC.cream : NC.stone }}>Cycles</span>
        {isActive && (
          <span
            className="flex items-center gap-1 text-xs font-medium flex-shrink-0 px-1.5 py-0.5 rounded-full"
            style={{ background: `${CYCLE_ACCENT}44`, color: CYCLE_ACCENT, border: `1px solid ${CYCLE_ACCENT}66` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CYCLE_ACCENT }} />
            {daysLeft > 0 ? `${daysLeft}d` : "now"}
          </span>
        )}
      </button>
      <button
        onClick={e => { e.stopPropagation(); onNew(); }}
        className="flex-shrink-0 rounded p-0.5 transition-colors hover:bg-white/10"
        title="New cycle"
        style={{ color: isActive ? `${CYCLE_ACCENT}cc` : "rgba(138,133,128,0.5)" }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

// Archived items view — opened from Settings menu at bottom of sidebar.
// Shows archived Projects + Initiatives with Unarchive action (resets status/state to 'planned').
// Note: archived cycles/modules/tasks stay scoped to their project — accessible via
// each project's state filter set to "Archived" (once we widen the load-time filter to opt-in).
function ArchivedModal({ open, onClose, projects, initiatives, onUnarchiveProject, onUnarchiveInitiative }: {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  initiatives: Initiative[];
  onUnarchiveProject: (p: Project) => Promise<void> | void;
  onUnarchiveInitiative: (i: Initiative) => Promise<void> | void;
}) {
  const archivedProjects = projects.filter(p => p.status === "archived");
  const archivedInits = initiatives.filter(i => i.state === "archived");

  return (
    <Modal open={open} onClose={onClose} title="Archived" maxWidth="max-w-lg">
      <div className="space-y-6">
        <section>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: NC.stone }}>Projects ({archivedProjects.length})</p>
          {archivedProjects.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(138,133,128,0.4)" }}>No archived projects</p>
          ) : (
            <div className="space-y-1.5">
              {archivedProjects.map(p => (
                <div key={p.id} className="flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: NC.card, border: `1px solid ${NC.border}` }}>
                  <FolderOpen size={13} style={{ color: NC.stone, flexShrink: 0 }} />
                  <span className="flex-1 text-sm truncate" style={{ color: NC.cream }}>{p.name}</span>
                  <button onClick={() => onUnarchiveProject(p)} className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-white/[0.06]" style={{ color: NC.textMuted, border: `1px solid ${NC.border}` }}>
                    <ArchiveRestore size={11} /> Unarchive
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: NC.stone }}>Initiatives ({archivedInits.length})</p>
          {archivedInits.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(138,133,128,0.4)" }}>No archived initiatives</p>
          ) : (
            <div className="space-y-1.5">
              {archivedInits.map(i => (
                <div key={i.id} className="flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: NC.card, border: `1px solid ${NC.border}` }}>
                  <Target size={13} style={{ color: NC.stone, flexShrink: 0 }} />
                  <span className="flex-1 text-sm truncate" style={{ color: NC.cream }}>{i.title}</span>
                  <button onClick={() => onUnarchiveInitiative(i)} className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors hover:bg-white/[0.06]" style={{ color: NC.textMuted, border: `1px solid ${NC.border}` }}>
                    <ArchiveRestore size={11} /> Unarchive
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs pt-3 leading-relaxed" style={{ color: NC.stone, borderColor: NC.borderFaint }}>
          Archived cycles, modules, and tasks stay scoped to their project — reopen the project and use the state filter to access them.
        </p>
      </div>
    </Modal>
  );
}

function Sidebar({ projects, initiatives, selection, onSelect, onProjectsChange, onInitiativesChange, onPendingTask, onPendingProjectTab, onSaveProject, onUpdateInitiative }: {
  projects: Project[]; initiatives: Initiative[]; selection: Selection;
  onSelect: (s: Selection) => void;
  onProjectsChange: (ps: Project[]) => void;
  onInitiativesChange: (is: Initiative[]) => void;
  onPendingTask: (taskId: string) => void;
  onPendingProjectTab: (tab: string) => void;
  onSaveProject: (id: string, patch: Partial<Project>) => Promise<void>;
  onUpdateInitiative: (id: string, patch: Partial<Initiative>) => Promise<void>;
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingInit, setCreatingInit] = useState(false);
  const [editInit, setEditInit] = useState<Initiative | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteInit, setDeleteInit] = useState<Initiative | null>(null);
  const [pForm, setPForm] = useState({ name: "", description: "", folder_path: "" });
  const [iForm, setIForm] = useState({ title: "", description: "", external_id: "", state: "planned" as Initiative["state"] });
  const [saving, setSaving] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const clampSidebarWidth = (width: number) => Math.min(480, Math.max(200, width));
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try { return clampSidebarWidth(Number(localStorage.getItem("caelos.sidebar.width")) || 224); } catch { return 224; }
  });
  const [projectsCollapsed, setProjectsCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("nc-sidebar-collapse-projects") === "true"; } catch { return false; }
  });
  const [initiativesCollapsed, setInitiativesCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("nc-sidebar-collapse-initiatives") === "true"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("nc-sidebar-collapse-projects", String(projectsCollapsed)); } catch {}
  }, [projectsCollapsed]);
  useEffect(() => {
    try { localStorage.setItem("nc-sidebar-collapse-initiatives", String(initiativesCollapsed)); } catch {}
  }, [initiativesCollapsed]);
  useEffect(() => {
    try { localStorage.setItem("caelos.sidebar.width", String(sidebarWidth)); } catch {}
  }, [sidebarWidth]);


  function startSidebarResize(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    const updateWidth = (moveEvent: MouseEvent) => setSidebarWidth(clampSidebarWidth(startWidth + moveEvent.clientX - startX));
    const stopResize = () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      document.removeEventListener("mousemove", updateWidth);
      document.removeEventListener("mouseup", stopResize);
    };
    document.addEventListener("mousemove", updateWidth);
    document.addEventListener("mouseup", stopResize);
  }

  function toggleProject(id: string) {
    setExpandedProjects(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  useCmdEnter(async () => { if (creatingProject) await createProject(); }, creatingProject);
  useCmdEnter(async () => { if (creatingInit) await createInit(); }, creatingInit);

  async function createProject() {
    if (!pForm.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const p = await api<Project>("/projects", { method: "POST", body: JSON.stringify(pForm) });
      onProjectsChange([...projects, p]);
      setCreatingProject(false); setPForm({ name: "", description: "", folder_path: "" });
      toast.success("Project created");
      onSelect({ type: "project", item: p });
    } catch { toast.error("Failed to create project"); }
    finally { setSaving(false); }
  }

  async function deleteProjectFn(p: Project) {
    try {
      await api(`/projects/${p.id}`, { method: "DELETE" });
      // Soft-archive: keep in state so Archived view surfaces it; sidebar filter hides status='archived' from active list.
      onProjectsChange(projects.map(x => x.id === p.id ? { ...x, status: "archived" as const } : x));
      if (selection?.type === "project" && selection.item.id === p.id) onSelect(null);
      toast.success("Project archived");
    } catch { toast.error("Failed to archive project"); }
  }

  async function duplicateProject(p: Project) {
    try {
      const { id: _id, created_at: _ca, ...rest } = p;
      const created = await api<Project>("/projects", { method: "POST", body: JSON.stringify({ ...rest, name: `${p.name} (copy)` }) });
      onProjectsChange([...projects, created]);
      toast.success("Duplicated");
    } catch { toast.error("Failed to duplicate"); }
  }

  async function createInit() {
    if (!iForm.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const init = await api<Initiative>("/initiatives", { method: "POST", body: JSON.stringify(iForm) });
      onInitiativesChange([...initiatives, init]);
      setCreatingInit(false); setIForm({ title: "", description: "", external_id: "", state: "planned" });
      toast.success("Initiative created");
      onSelect({ type: "initiative", item: init });
    } catch { toast.error("Failed to create initiative"); }
    finally { setSaving(false); }
  }

  async function saveInit(id: string, patch: Partial<Initiative>) {
    setSaving(true);
    try {
      const updated = await api<Initiative>(`/initiatives/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      onInitiativesChange(initiatives.map(i => i.id === id ? updated : i));
      if (selection?.type === "initiative" && selection.item.id === id) onSelect({ type: "initiative", item: updated });
      setEditInit(null); toast.success("Updated");
    } catch { toast.error("Failed to update initiative"); }
    finally { setSaving(false); }
  }

  async function deleteInitFn(init: Initiative) {
    try {
      await api(`/initiatives/${init.id}`, { method: "DELETE" });
      // Soft-archive: keep in state so Archived view surfaces it.
      onInitiativesChange(initiatives.map(x => x.id === init.id ? { ...x, state: "archived" as const } : x));
      if (selection?.type === "initiative" && selection.item.id === init.id) onSelect(null);
      toast.success("Initiative archived");
    } catch { toast.error("Failed to archive initiative"); }
  }

  return (
    <aside data-surface="chrome" className="relative flex-shrink-0 flex flex-col border-r overflow-hidden" style={{ width: sidebarWidth, background: NC.chrome, borderColor: NC.borderFaint }}>
      <div className="px-4 pt-2 pb-1 flex-shrink-0 flex items-center justify-center" style={{ borderColor: NC.borderFaint }}>
        <img
          src={wordmarkUrl}
          alt="Nova Caelum"
          style={{ height: 72, width: "auto", display: "block", opacity: 1 }}
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Search bar */}
        <div className="px-3 pt-2 pb-1">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: NC.stone }} />
            <input
              className="nc-search w-full pl-8 pr-3 py-1.5 text-xs"
              placeholder="Search projects & initiatives…"
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Projects */}
        <div className="nc-section-group mt-2">
          <div
            className="nc-section-shelf flex items-center justify-between"
            onClick={() => setProjectsCollapsed(c => !c)}
            role="button"
            aria-expanded={!projectsCollapsed}
          >
            <div className="flex items-center gap-1.5" style={{ color: NC.textDim }}>
              {projectsCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
              <SectionLabel>Projects</SectionLabel>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setPForm({ name: "", description: "", folder_path: "" }); setCreatingProject(true); }}
              className="p-1 rounded hover:bg-white/5"
              style={{ color: NC.stone }}
            ><Plus size={13} /></button>
          </div>
          {!projectsCollapsed && (
            <>
          {projects.filter(p => p.status !== "archived" && (!sidebarSearch || p.name.toLowerCase().includes(sidebarSearch.toLowerCase()))).map(p => {
            const isActive   = selection?.type === "project" && selection.item.id === p.id;
            const isExpanded = expandedProjects.has(p.id);
            return (
              <div key={p.id}>
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div className="flex items-center h-9">
                      <button className="flex-shrink-0 h-9 flex items-center justify-center w-6 hover:bg-white/[0.04] transition-colors" style={{ color: NC.stone }} onClick={() => toggleProject(p.id)}>
                        {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>
                      <button className={`flex-1 h-9 flex items-center gap-2 pl-3 pr-3 text-sm text-left transition-colors hover:bg-white/[0.04] min-w-0 ${isActive ? "nc-nav-active" : ""}`} style={{ color: isActive ? NC.cream : NC.stone, fontWeight: isActive ? 500 : 400 }} onClick={() => onSelect({ type: "project", item: p })} title={p.name}>
                        <FolderOpen size={13} style={{ color: isActive ? NC.accent : NC.stone, flexShrink: 0 }} />
                        <span className="truncate">{p.name}</span>
                      </button>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="nc-glass-menu" style={{ color: NC.cream }}>
                    <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => { onSelect({ type: "project", item: p }); onPendingProjectTab("info"); }}><Edit2 size={13} /> Edit</ContextMenuItem>
                    <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => duplicateProject(p)}><Copy size={13} /> Duplicate</ContextMenuItem>
                    <ContextMenuSeparator style={{ background: NC.border }} />
                    <ContextMenuItem className="gap-2 text-sm" onClick={() => setDeleteProject(p)}><Archive size={13} /> Archive</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                {isExpanded && <ProjectNavTree project={p} onSelectTask={taskId => { onSelect({ type: "project", item: p }); onPendingTask(taskId); }} />}
              </div>
            );
          })}
          {projects.length === 0 && <p className="px-3 py-1.5 text-xs" style={{ color: "rgba(138,133,128,0.5)" }}>No projects</p>}
            </>
          )}
        </div>

        {/* Initiatives */}
        <div className="nc-section-group mt-4">
          <div
            className="nc-section-shelf flex items-center justify-between"
            onClick={() => setInitiativesCollapsed(c => !c)}
            role="button"
            aria-expanded={!initiativesCollapsed}
          >
            <div className="flex items-center gap-1.5" style={{ color: NC.textDim }}>
              {initiativesCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
              <SectionLabel>Initiatives</SectionLabel>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setIForm({ title: "", description: "", external_id: "", state: "open" }); setCreatingInit(true); }}
              className="p-1 rounded hover:bg-white/5"
              style={{ color: NC.stone }}
            ><Plus size={13} /></button>
          </div>
          {!initiativesCollapsed && (
            <>
          {initiatives.filter(i => i.state !== "archived" && (!sidebarSearch || i.title.toLowerCase().includes(sidebarSearch.toLowerCase()))).map(init => {
            const cfg      = INIT_STATE_CFG[init.state];
            const isActive = selection?.type === "initiative" && selection.item.id === init.id;
            return (
              <ContextMenu key={init.id}>
                <ContextMenuTrigger asChild>
                  <button className={`w-full h-9 flex items-center gap-2 px-3 text-sm text-left transition-colors hover:bg-white/[0.04] ${isActive ? "nc-nav-active" : ""}`} style={{ color: isActive ? NC.cream : NC.stone, fontWeight: isActive ? 500 : 400 }} onClick={() => onSelect({ type: "initiative", item: init })} title={init.title}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    <span className="truncate">{init.title}</span>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="nc-glass-menu" style={{ color: NC.cream }}>
                  <ContextMenuItem className="gap-2 text-sm" style={{ color: NC.cream }} onClick={() => setEditInit({ ...init })}><Edit2 size={13} /> Edit</ContextMenuItem>
                  <ContextMenuSeparator style={{ background: NC.border }} />
                  <ContextMenuItem className="gap-2 text-sm" onClick={() => setDeleteInit(init)}><Archive size={13} /> Archive</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
          {initiatives.length === 0 && <p className="px-3 py-1.5 text-xs" style={{ color: "rgba(138,133,128,0.5)" }}>No initiatives</p>}
            </>
          )}
        </div>
      </div>

      {/* Bottom-left settings footer */}
      <GlassSeparator />
      <div className="flex-shrink-0 px-2 py-2" style={{ borderColor: NC.borderFaint }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors hover:bg-white/[0.04]" style={{ color: NC.stone }}>
              <Settings size={13} />
              <span>Settings</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={6} className="nc-glass-menu min-w-[180px]" style={{ color: NC.cream }}>
            <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => setShowArchived(true)}>
              <Archive size={13} /> Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className="hover:bg-[color:var(--nc-accent-line)]"
        onMouseDown={startSidebarResize}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 4, cursor: "col-resize", zIndex: 10, userSelect: "none" }}
      />

      <ArchivedModal
        open={showArchived}
        onClose={() => setShowArchived(false)}
        projects={projects}
        initiatives={initiatives}
        onUnarchiveProject={async (p) => { await onSaveProject(p.id, { status: "planned" }); }}
        onUnarchiveInitiative={async (i) => { await onUpdateInitiative(i.id, { state: "planned" }); }}
      />

      {/* Modals */}
      <Modal open={creatingProject} onClose={() => setCreatingProject(false)} title="New Project" maxWidth="max-w-sm">
        <Field label="Name"><NcInput value={pForm.name} onChange={e => setPForm(p => ({ ...p, name: e.target.value }))} placeholder="Project name" autoFocus onKeyDown={e => e.key === "Enter" && createProject()} /></Field>
        <Field label="Description"><NcTextarea value={pForm.description} onChange={e => setPForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" /></Field>
        <Field label="Folder Path">
          <div className="flex items-center gap-2"><Folder size={13} style={{ color: NC.stone, flexShrink: 0 }} />
            <NcInput value={pForm.folder_path} onChange={e => setPForm(p => ({ ...p, folder_path: e.target.value }))} placeholder="/path/to/project" style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12 }} /></div>
        </Field>
        <div className="flex gap-2 justify-end pt-1"><TextBtn onClick={() => setCreatingProject(false)}>Cancel</TextBtn><PrimaryBtn loading={saving} onClick={createProject}>Create</PrimaryBtn></div>
      </Modal>

      <Modal open={creatingInit} onClose={() => setCreatingInit(false)} title="New Initiative" maxWidth="max-w-sm">
        <Field label="Title"><NcInput value={iForm.title} onChange={e => setIForm(p => ({ ...p, title: e.target.value }))} placeholder="Initiative title" autoFocus /></Field>
        <Field label="Description"><NcTextarea value={iForm.description} onChange={e => setIForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional — what is this for?" rows={3} /></Field>
        <Field label="External ID"><NcInput value={iForm.external_id} onChange={e => setIForm(p => ({ ...p, external_id: e.target.value }))} placeholder="e.g. INIT-001" /></Field>
        <Field label="State"><NcSelect value={iForm.state} onValueChange={v => setIForm(p => ({ ...p, state: v as Initiative["state"] }))} items={Object.entries(INIT_STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))} /></Field>
        <div className="flex gap-2 justify-end pt-1"><TextBtn onClick={() => setCreatingInit(false)}>Cancel</TextBtn><PrimaryBtn loading={saving} onClick={createInit}>Create</PrimaryBtn></div>
      </Modal>

      {editInit && (
        <Modal open={!!editInit} onClose={() => setEditInit(null)} title="Edit Initiative" maxWidth="max-w-sm">
          <Field label="Title"><NcInput value={editInit.title} onChange={e => setEditInit(p => p ? { ...p, title: e.target.value } : p)} /></Field>
          <Field label="Description"><NcTextarea value={editInit.description ?? ""} onChange={e => setEditInit(p => p ? { ...p, description: e.target.value } : p)} placeholder="Optional — what is this for?" rows={3} /></Field>
          <Field label="External ID"><NcInput value={editInit.external_id} onChange={e => setEditInit(p => p ? { ...p, external_id: e.target.value } : p)} /></Field>
          <Field label="State"><NcSelect value={editInit.state} onValueChange={v => setEditInit(p => p ? { ...p, state: v as Initiative["state"] } : p)} items={Object.entries(INIT_STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))} /></Field>
          <div className="flex gap-2 justify-end pt-1"><TextBtn onClick={() => setEditInit(null)}>Cancel</TextBtn><PrimaryBtn loading={saving} onClick={() => saveInit(editInit.id, editInit)}>Save</PrimaryBtn></div>
        </Modal>
      )}

      <ConfirmDelete open={!!deleteProject} onClose={() => setDeleteProject(null)} onConfirm={() => deleteProject && deleteProjectFn(deleteProject)} label="project" />
      <ConfirmDelete open={!!deleteInit} onClose={() => setDeleteInit(null)} onConfirm={() => deleteInit && deleteInitFn(deleteInit)} label="initiative" />
    </aside>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ════════════════════════════════════════════════════════════════════════════════

function Welcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center select-none">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(91,125,115,0.12)", border: "1px solid rgba(91,125,115,0.25)" }}>
            <Zap size={24} style={{ color: NC.green }} />
          </div>
        </div>
        <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: NC.cream, marginBottom: 8 }}>Nova Caelum Ops</h2>
        <p className="text-sm" style={{ color: NC.stone }}>Select a project or initiative from the sidebar</p>
      </div>
    </div>
  );
}

export default function App({
  foundryMode = false,
  renderProjectView,
  initialProjectName,
}: {
  foundryMode?: boolean;
  /** Optional override — when set, replaces the canonical <ProjectView /> with a custom shell (used by design labs 2/3). */
  renderProjectView?: (props: ProjectViewShellProps) => React.ReactNode;
  /** Optional case-insensitive substring match — on data load, auto-selects the first project whose name matches (used by design labs). */
  initialProjectName?: string;
}) {
  const [projects, setProjects]       = useState<Project[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [selection, setSelection]     = useState<Selection>(null);
  const [booting, setBooting]         = useState(true);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingProjectTab, setPendingProjectTab] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Project[]>("/projects").catch(() => [] as Project[]),
      api<Initiative[]>("/initiatives").catch(() => [] as Initiative[]),
    ]).then(([ps, is]) => {
      const nextProjects = ps.length || !foundryMode ? ps : [FOUNDRY_DEMO_PROJECT];
      const nextInitiatives = is.length || !foundryMode ? is : [FOUNDRY_DEMO_INITIATIVE];
      setProjects(nextProjects);
      setInitiatives(nextInitiatives);
      // Lab-mode: initialProjectName wins over last-selection restore (design labs
      // need deterministic project targeting; VulcanDDI must load every time).
      if (initialProjectName) {
        const needle = initialProjectName.toLowerCase();
        const target = nextProjects.find((p) => p.name.toLowerCase().includes(needle));
        if (target) {
          setSelection({ type: "project", item: target });
          return;
        }
      }
      const foundryTarget = foundryMode ? window.localStorage.getItem("caelos.foundryTarget") : null;
      let remembered: { type?: string; id?: string } | null = null;
      try { remembered = JSON.parse(window.localStorage.getItem("caelos.lastSelection") ?? "null") as { type?: string; id?: string } | null; } catch { remembered = null; }
      const targetId = foundryTarget ?? remembered?.id;
      const project = nextProjects.find((item) => item.id === targetId);
      const initiative = nextInitiatives.find((item) => item.id === targetId);
      if (project) setSelection({ type: "project", item: project });
      else if (initiative) setSelection({ type: "initiative", item: initiative });
      else if (nextProjects[0]) setSelection({ type: "project", item: nextProjects[0] });
      else if (nextInitiatives[0]) setSelection({ type: "initiative", item: nextInitiatives[0] });
    }).finally(() => setBooting(false));
  }, [foundryMode, initialProjectName]);

  useEffect(() => {
    if (!selection) return;
    window.localStorage.setItem("caelos.lastSelection", JSON.stringify({ type: selection.type, id: selection.item.id }));
  }, [selection]);

  useEffect(() => {
    if (!foundryMode) return;
    const targets = [
      ...projects.map((item) => ({ id: item.id, type: "project" as const, label: item.name })),
      ...initiatives.map((item) => ({ id: item.id, type: "initiative" as const, label: item.title })),
    ];
    const publish = () => window.dispatchEvent(new CustomEvent("caelos:foundry-options", { detail: { targets, selectedId: selection?.item.id ?? "" } }));
    const select = (event: Event) => {
      const id = (event as CustomEvent<{ id: string | null }>).detail.id;
      const project = projects.find((item) => item.id === id);
      const initiative = initiatives.find((item) => item.id === id);
      setSelection(project ? { type: "project", item: project } : initiative ? { type: "initiative", item: initiative } : null);
    };
    window.addEventListener("caelos:foundry-request-options", publish);
    window.addEventListener("caelos:foundry-select", select);
    publish();
    return () => {
      window.removeEventListener("caelos:foundry-request-options", publish);
      window.removeEventListener("caelos:foundry-select", select);
    };
  }, [foundryMode, initiatives, projects, selection]);

  async function saveProject(id: string, patch: Partial<Project>) {
    try {
      const updated = await api<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      if (selection?.type === "project" && selection.item.id === id) setSelection({ type: "project", item: updated });
      toast.success("Project updated");
    } catch { toast.error("Failed to update project"); throw new Error("save failed"); }
  }

  async function updateInitiative(id: string, patch: Partial<Initiative>) {
    try {
      const updated = await api<Initiative>(`/initiatives/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setInitiatives(prev => prev.map(i => i.id === id ? updated : i));
      if (selection?.type === "initiative" && selection.item.id === id) {
        setSelection({ type: "initiative", item: updated });
      }
    } catch { toast.error("Failed to update initiative"); }
  }

  // Keep selection in sync when lists change
  useEffect(() => {
    if (!selection) return;
    if (selection.type === "project") {
      const fresh = projects.find(p => p.id === selection.item.id);
      if (fresh && fresh !== selection.item) setSelection({ type: "project", item: fresh });
    }
    if (selection.type === "initiative") {
      const fresh = initiatives.find(i => i.id === selection.item.id);
      if (fresh && fresh !== selection.item) setSelection({ type: "initiative", item: fresh });
    }
  }, [projects, initiatives]);

  return (
    <div data-surface="ground" className="dark h-screen flex overflow-hidden" style={{ background: NC.ground, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <Sidebar
        projects={projects} initiatives={initiatives} selection={selection}
        onSelect={setSelection}
        onProjectsChange={setProjects}
        onInitiativesChange={setInitiatives}
        onPendingTask={setPendingTaskId}
        onPendingProjectTab={setPendingProjectTab}
        onSaveProject={saveProject}
        onUpdateInitiative={updateInitiative}
      />
      <main data-surface="elevated" className="flex-1 flex flex-col overflow-hidden" style={{ background: NC.card }}>
        {booting ? (
          <div className="flex-1 flex items-center justify-center"><Spinner /></div>
        ) : selection?.type === "project" ? (
          renderProjectView ? (
            renderProjectView({
              project: selection.item,
              pendingTaskId,
              onClearPending: () => setPendingTaskId(null),
              pendingTab: pendingProjectTab,
              onClearPendingTab: () => setPendingProjectTab(null),
              onSaveProject: saveProject,
              foundryMode,
            })
          ) : (
            <ProjectViewLayeredShell
              project={selection.item}
              pendingTaskId={pendingTaskId} onClearPending={() => setPendingTaskId(null)}
              pendingTab={pendingProjectTab} onClearPendingTab={() => setPendingProjectTab(null)}
              onSaveProject={saveProject}
              foundryMode={foundryMode}
            />
          )
        ) : selection?.type === "initiative" ? (
          <InitiativeView initiative={selection.item} allProjects={projects} onUpdateInit={updateInitiative} />
        ) : (
          <Welcome />
        )}
      </main>
      <Toaster position="bottom-right" toastOptions={{ style: { background: NC.elevated, border: `1px solid ${NC.border}`, color: NC.cream, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13 } }} />
    </div>
  );
}
