// Nova Caelum — Task Management Dashboard
import { useState, useEffect, useCallback, useRef } from "react";
import { CaelosProvider, Heading, Text, Separator, Progress, Loading, ResizeHandle, Surface, Toaster, Popover, PopoverTrigger, PopoverContent, PopoverClose, Card, Chip, Row, Tooltip, Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, TaskRow as SharedTaskRow, Badge, StatusSelect, type Tone, Input, TextArea, Button, UserCard, PersonChip, ScrollArea, Select as SharedSelect, Drawer, Dialog, IconButton, ActionMenuRoot, ActionMenuTrigger, ActionMenuContent, ActionMenuItem, ActionMenuCheckboxItem, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@nova-caelum/ui";
import { toast } from "sonner";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Plus, ChevronLeft, ChevronRight, ChevronDown, Edit2, Copy, Archive, ArchiveRestore, X,
  Search, Link2, Unlink, Calendar, Layers, Target, FolderOpen,
  Hash, Zap, ArrowRight, TrendingUp, AlertTriangle,
  GripVertical, FileText, Folder, Users, UserPlus, Atom,
  Settings, FolderInput,
} from "lucide-react";
import wordmarkUrl from "@/imports/nova-caelum-wordmark-transparent.png";
import { NC } from "../design/tokens";
import { ProjectViewLayeredShell } from "./ProjectViewLayeredShell";

// ── Types ──────────────────────────────────────────────────────────────────────

// Set A — task_workflow_state (work_items, modules)
export type WorkItemState = "pending-review" | "ready" | "in-progress" | "blocked" | "done" | "deferred" | "archived";
// Set B — project_lifecycle_state (projects, initiatives, cycles)
export type ProjectStatus    = "planned" | "in-progress" | "paused" | "completed" | "closed" | "archived";
type InitiativeStatus = ProjectStatus;
type CycleStatus       = ProjectStatus;

export type Project  = { id: string; name: string; description: string; folder_path: string; created_at: string; status: ProjectStatus; team: string[]; owner: string; client: string };
// `acceptance_criteria` / `acceptance_criteria_ref` (2026-08-24, slice S3): the row's
// done-definition, plus an optional path to a fuller criteria doc. OPTIONAL on the client
// type deliberately — FOUNDRY_DEMO_* and mockApi build these objects as literals, and a
// required field would break every one of them. Accepted-but-not-required server-side too
// (required-on-create is S4). Not rendered on TaskRow/ModuleSection: drawer-only, same
// convention `description` already follows.
// `position` / `created_at` (Wave E, 2026-09-06): drag-order persistence. OPTIONAL for
// the same reason as acceptance_criteria above — FOUNDRY_DEMO_* / mockApi literals don't
// carry them. `position` mirrors the server's nullable double precision column (null =
// unpositioned, sorts last); `created_at` is the tie-break for equal/null positions.
export type Mod      = { id: string; project_id: string; name: string; folder_path: string; description: string; state: WorkItemState; team: string[]; parent_module_id?: string | null; acceptance_criteria?: string | null; acceptance_criteria_ref?: string | null; position?: number | null; created_at?: string };
type Cycle    = { id: string; project_id: string; name: string; start_date: string; end_date: string; state: CycleStatus; description: string };

export type WorkItemPriority = "none" | "low" | "medium" | "high" | "urgent";

export type WorkItem = {
  id: string; uuid?: string; project_id: string; module_id?: string | null; parent_item_id?: string | null;
  cycle_id?: string | null; title: string; description: string;
  acceptance_criteria?: string | null; acceptance_criteria_ref?: string | null;
  state: WorkItemState; priority: WorkItemPriority; assignee: string; team: string[];
  blocked_by: string[]; doc_paths: string[]; source_references: unknown;
  position?: number | null; created_at?: string;
};

// `uuid` (Wave D, 2026-09-06): the row UUID, kept alongside the external-id-keyed `id`
// the same way `WorkItem.uuid` already does — the /links sub-resource needs it (see
// initiativeUuidByExternalId above); every other initiative route stays external_id-keyed.
type Initiative = { id: string; uuid?: string; external_id: string; title: string; description: string; state: InitiativeStatus; doc_paths: string[] };
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

// ── FK id-space normalization (2026-08-24) ────────────────────────────────────
// Backend rows carry relational FKs as row UUIDs — `work_items.parent_work_item_id`
// and `work_items.module_id` both reference `work_items.id` / `modules.id`, as does
// `modules.parent_module_id` — while every client-side relation is keyed on
// `external_id` (WorkItem.id / Mod.id). Comparing the two id spaces never matches,
// and the failure is silent AND total: an item carrying a parent or a module is
// dropped from the root list (its FK is truthy, so `!w.module_id && !w.parent_item_id`
// excludes it) AND from its module/parent group (the id comparison fails), so it
// renders nowhere at all. Translating UUID → external_id once here, at the single
// read boundary, keeps all ~15 downstream comparison sites speaking external_id.
const externalIdByUuid = new Map<string, string>();

function rememberExternalId(row: any): void {
  if (typeof row?.id === "string" && typeof row?.external_id === "string") {
    externalIdByUuid.set(row.id, row.external_id);
  }
}

// An unresolved ref is returned unchanged rather than nulled: a cold index must not
// silently promote a child to root, which would misreport the graph's actual shape.
function toExternalId(ref: unknown): string | null {
  if (typeof ref !== "string" || !ref) return null;
  return externalIdByUuid.get(ref) ?? ref;
}

// Item 5 (Wave D, 2026-09-06): the initiative link/unlink sub-resource
// (`/api/initiatives/{id}/links...`) is keyed by row UUID server-side
// (`.eq("id", initiative_id)` in rest_add_initiative_link / rest_delete_initiative_link),
// while every OTHER initiative route (list, PATCH, list_initiative_links) is keyed by
// external_id — same id-space split as externalIdByUuid above, scoped to this one
// sub-resource. Populated whenever an initiative row is read (adaptInitiativeRead), so
// the common case (initiatives list loads before InitiativeView ever fires a link/unlink
// call) never needs api()'s fallback fetch.
const initiativeUuidByExternalId = new Map<string, string>();

function rememberInitiativeUuid(row: any): void {
  if (typeof row?.id === "string" && typeof row?.external_id === "string") {
    initiativeUuidByExternalId.set(row.external_id, row.id);
  }
}

// Module rows own the uuid → external_id mapping that work-item `module_id` refs
// resolve through, but not every caller fetches modules — the initiative and cycle
// views read work-items on their own. Priming here makes a work-items response
// correct independently of what else the caller happens to fetch, and independently
// of Promise.all ordering when it does fetch both.
const modulesPrimedFor = new Set<string>();

async function primeModuleIds(code: string): Promise<void> {
  if (!API_BASE || modulesPrimedFor.has(code)) return;
  modulesPrimedFor.add(code);
  try {
    const headers: Record<string, string> = {};
    if (BEARER) headers.Authorization = `Bearer ${BEARER}`;
    const response = await fetch(`${API_BASE}/api/projects/${code}/modules`, { headers });
    if (!response.ok) throw new Error(`prime modules → ${response.status}`);
    ((await response.json()) as any[]).forEach(rememberExternalId);
  } catch {
    modulesPrimedFor.delete(code); // transient failure — allow a retry on the next read
  }
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
  rememberExternalId(x);
  return {
    id: x.external_id ?? x.id ?? "",
    uuid: x.id ?? undefined,
    project_id: x.project_code ?? x.project_id ?? "",
    module_id: toExternalId(x.module_id),
    parent_item_id: toExternalId(x.parent_work_item_id ?? x.parent_item_id),
    cycle_id: null,
    title: x.name ?? x.title ?? "",
    description: x.description ?? "",
    // Preserve null vs "" here rather than collapsing to "" like `description` does.
    // LIST responses carry these keys as null; the drawer needs to tell "absent" from
    // "explicitly blank" so it does not resend an empty string over stored content.
    acceptance_criteria: x.acceptance_criteria ?? null,
    acceptance_criteria_ref: x.acceptance_criteria_ref ?? null,
    state: (x.state as WorkItemState) ?? "pending-review",
    priority: (x.priority as WorkItemPriority) ?? "none",
    assignee: x.assignee_agent ?? x.assignee ?? "",
    team: Array.isArray(x.team) ? x.team : [],
    blocked_by: x.blocked_by ?? [],
    // Item 9 (Wave D, 2026-09-06): work items carry no `doc_paths` column on the
    // backend — only `source_references[{uri, anchor?}]`. Derive the drawer/modal-facing
    // `doc_paths` from it here rather than trusting `x.doc_paths` (always undefined on
    // real rows); `x.doc_paths ?? []` was the bug — it silently produced `[]` forever.
    doc_paths: Array.isArray(x.source_references) ? x.source_references.map((r: any) => r.uri) : [],
    source_references: x.source_references ?? null,
    // Wave E (2026-09-06): server column is nullable double precision — coerce anything
    // that isn't a real number (including the JSON `null` list reads carry today) to null
    // rather than trusting `x.position ?? null`, which would let a stray string through.
    position: typeof x.position === "number" ? x.position : null,
    created_at: x.created_at ?? "",
  };
}
function adaptModuleRead(x: any): Mod {
  rememberExternalId(x);
  return {
    id: x.external_id ?? x.id ?? "",
    project_id: x.project_code ?? x.project_id ?? "",
    name: x.name ?? "",
    folder_path: x.folder_path ?? "",
    description: x.description ?? "",
    acceptance_criteria: x.acceptance_criteria ?? null,
    acceptance_criteria_ref: x.acceptance_criteria_ref ?? null,
    state: (x.state as WorkItemState) ?? "pending-review",
    team: Array.isArray(x.team) ? x.team : [],
    parent_module_id: toExternalId(x.parent_module_id),
    position: typeof x.position === "number" ? x.position : null,
    created_at: x.created_at ?? "",
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
  rememberInitiativeUuid(x);
  return {
    id: x.external_id ?? x.id ?? "",
    uuid: x.id ?? undefined,
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
  if (data?.result?.isError) throw new Error(typeof raw === "string" ? raw : `MCP ${name} failed`);
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

  // Item 5 (Wave D, 2026-09-06): resolve an initiative's external_id to its row UUID for
  // the /links sub-resource (see initiativeUuidByExternalId comment above). Deliberately
  // NOT built on `restFetch` — restFetch always issues the OUTER `method` (this helper
  // can fire mid-DELETE), which would send a DELETE to the initiatives LIST route.
  async function resolveInitiativeUuid(externalId: string): Promise<string> {
    const cached = initiativeUuidByExternalId.get(externalId);
    if (cached) return cached;
    const resp = await fetch(`${API_BASE}/api/initiatives`, { headers });
    if (!resp.ok) throw new Error(`GET /api/initiatives → ${resp.status} (resolving UUID for ${externalId})`);
    ((await resp.json()) as any[]).forEach(rememberInitiativeUuid);
    const found = initiativeUuidByExternalId.get(externalId);
    if (!found) throw new Error(`initiative not found: ${externalId}`);
    return found;
  }

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

  const initLinksGetMatch = path.match(/^\/initiatives\/([^/]+)\/links$/);
  if (initLinksGetMatch && method === "GET") {
    // No REST GET exists for this sub-resource (item 5) — read via the MCP tool, which
    // (unlike the UUID-keyed REST POST/DELETE routes below) is external_id-keyed.
    // handle_list_initiative_links enriches each row's `target` with the target's own
    // external identifier — project code for `project`, external_id for `module`/`work_item`
    // (main.py handle_list_initiative_links, ~5884).
    const rows = await mcpCall<Array<{ link_type: string; target: string }>>("list_initiative_links", { initiative: initLinksGetMatch[1] });
    const links: InitLinks = { project_ids: [], module_ids: [], work_item_ids: [] };
    for (const r of rows ?? []) {
      if (r.link_type === "project") links.project_ids.push(r.target);
      else if (r.link_type === "module") links.module_ids.push(r.target);
      else if (r.link_type === "work_item") links.work_item_ids.push(r.target);
    }
    return links as T;
  }

  // === Projects ===
  if (path === "/projects" && method === "GET") {
    return ((await restFetch("/api/projects")) as any[]).map(adaptProjectRead) as T;
  }
  if (path === "/projects" && method === "POST") {
    // The backend exposes upsert, not create-only. Give each new project its own
    // key so duplicate names (or slug collisions) cannot overwrite another project.
    const code = `${slugify(body.name ?? "project").replace(/-$/, "")}-${crypto.randomUUID()}`;
    const args: Record<string, unknown> = { code, name: body.name ?? "Untitled" };
    if (body.description) args.description = body.description;
    if (body.folder_path) args.folder_path = body.folder_path;
    if (body.status) args.status = body.status;
    if (body.team) args.team = body.team;
    const r = await mcpCall<any>("upsert_project", args);
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
      if (kind === "work-items") {
        // Order matters: the module index must be warm, and every row in THIS list
        // must be registered, before any row's parent/module FK is resolved — a
        // subtask can appear ahead of its parent in the response.
        const code = path.match(/^\/projects\/([^/]+)\//)![1];
        await primeModuleIds(code);
        const data = (await restFetch(`/api${path}`)) as any[];
        data.forEach(rememberExternalId);
        // A module created AFTER this project was primed (an agent writing while the
        // console sits open — the normal case here) is absent from the index, and the
        // caller's parallel modules fetch may not have landed yet. Those work items
        // would keep a raw UUID module_id and go invisible again, intermittently.
        // Re-prime once when an unknown module ref appears; bounded to a single retry,
        // and a ref that still will not resolve is left raw per the no-null-promotion rule.
        if (data.some(row => typeof row?.module_id === "string" && !externalIdByUuid.has(row.module_id))) {
          modulesPrimedFor.delete(code);
          await primeModuleIds(code);
        }
        return data.map(adaptWorkItemRead) as T;
      }
      const data = (await restFetch(`/api${path}`)) as any[];
      if (kind === "modules") {
        data.forEach(rememberExternalId); // register all before resolving parent_module_id
        return data.map(adaptModuleRead) as T;
      }
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
          // `|| null` not `?? null`: WorkItemUpsertArgs puts min_length=20 on
          // acceptance_criteria, so an empty string from an untouched input would 422.
          // Null is the "not stated" value until S4 makes it required on create.
          acceptance_criteria: body.acceptance_criteria || null,
          acceptance_criteria_ref: body.acceptance_criteria_ref || null,
          assignee_agent: body.assignee || body.assignee_agent || null,
          team: body.team ?? [],
          idempotency_key: idempKey("idem"),
        };
        // Placement (2026-08-24): this whitelist previously omitted both refs, so
        // "Add Subtask" and "Add task to <module>" silently persisted a detached
        // root task — the parent/module the user picked was dropped client-side and
        // never reached the server. WorkItemUpsertArgs is `extra="forbid"`, so the
        // field names must be exactly `module` / `parent_work_item`, and each key is
        // omitted (not sent as null) when absent so it can't clear an existing value.
        if (body.module_id) backendBody.module = body.module_id;
        if (body.parent_item_id) backendBody.parent_work_item = body.parent_item_id;
        // Item 9 (Wave D, 2026-09-06): work items have no `doc_paths` column — the
        // create-modal's Related Docs field maps onto `source_references[].uri`, the
        // same field PATCH uses (see the wiMatch PATCH block below).
        if (Array.isArray(body.doc_paths) && body.doc_paths.length > 0) {
          backendBody.source_references = (body.doc_paths as string[]).map(uri => ({ uri }));
        }
      } else if (kind === "modules") {
        backendBody = {
          external_id: body.external_id ?? idempKey("mod"),
          name: body.name ?? "Untitled",
          description: body.description || null,
          acceptance_criteria: body.acceptance_criteria || null,
          acceptance_criteria_ref: body.acceptance_criteria_ref || null,
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

  // === Single-item detail reads (D14, 2026-08-24) ===
  // The drawers used to render straight off the LIST payload, which never carries
  // `description` (a _HEAVY_FIELDS entry, stripped by summary_payload). The drawer
  // therefore showed an empty textarea and saved that emptiness back over stored
  // content. These two routes are the reason ops-server 0.7.7 added
  // GET /api/work-items/{id} and GET /api/modules/{id} with `include_heavy`.
  // Console-side paths stay query-string-free so the existing
  // /^\/work-items\/([^/]+)$/ matchers below cannot swallow a `?...` into the id.
  const wiDetail = path.match(/^\/work-items\/([^/]+)\/detail$/);
  if (wiDetail && method === "GET") {
    // work_items.external_id is globally UNIQUE (20260726120000_work_graph_tables.sql:95),
    // so no project_code disambiguator is needed here.
    const row = await restFetch(`/api/work-items/${encodeURIComponent(wiDetail[1])}?include_heavy=true`);
    return adaptWorkItemRead(unwrapRow(row)) as T;
  }
  const modDetail = path.match(/^\/projects\/([^/]+)\/modules\/([^/]+)\/detail$/);
  if (modDetail && method === "GET") {
    // modules use UNIQUE(project_code, external_id) — composite, not global — so the
    // project code is required or an ambiguous match returns 400 server-side.
    const row = await restFetch(`/api/modules/${encodeURIComponent(modDetail[2])}?project_code=${encodeURIComponent(modDetail[1])}&include_heavy=true`);
    return adaptModuleRead(unwrapRow(row)) as T;
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
      // Acceptance criteria (2026-08-24, slice S3). This whitelist is load-bearing:
      // a field omitted here is dropped client-side, and if that leaves patchBody
      // empty the function rejects below without a network call, preserving the current row. `|| null` normalises a cleared textarea
      // to null rather than "" (min_length=20 server-side would reject "").
      if (body.acceptance_criteria !== undefined) patchBody.acceptance_criteria = body.acceptance_criteria || null;
      if (body.acceptance_criteria_ref !== undefined) patchBody.acceptance_criteria_ref = body.acceptance_criteria_ref || null;
      if (body.state !== undefined) patchBody.state = body.state;
      if (body.assignee !== undefined) patchBody.assignee_agent = body.assignee || null;
      if (body.assignee_agent !== undefined) patchBody.assignee_agent = body.assignee_agent;
      if (body.team !== undefined) patchBody.team = body.team;
      if (body.module_id !== undefined) patchBody.module = body.module_id;
      if (body.project_id !== undefined) patchBody.project = body.project_id;
      if (body.parent_item_id !== undefined) patchBody.parent_work_item = body.parent_item_id;
      // Item 7 (Wave E, 2026-09-06): drag-order persistence. `position` is a plain nullable
      // float on the server (ops-server 0.9.16) — omit preserves, explicit null unpins,
      // same preserve-on-omit contract every other field on this whitelist already follows.
      if (body.position !== undefined) patchBody.position = body.position;
      // TODO(bi-dir-mvp): blocked_by / cycle_id / priority are not backend-mutable fields
      // on PATCH /api/work-items/{id} (blocked_by needs link_work_items/unlink_work_items;
      // cycle_id needs assign_cycle_work_items — out of Phase 4 scope, flagged for Phase 5+).
      // NOTE (2026-07-31): `project` mutation on this PATCH is empirically untested against
      // the ops-server contract. If backend rejects/ignores, moveTask_ will surface the error.
    }
    // Item 9 (Wave D, 2026-09-06): work items carry no `doc_paths` column — the drawer's
    // Related Docs field maps onto `source_references[].uri` (the create-body twin lives
    // in the work-items POST block above). A bare `{uri}` per entry would silently drop
    // any `anchor` an entry already carried, so this reads the row's CURRENT raw
    // source_references and carries the anchor forward for every uri that's still
    // present — new/added uris get `{uri}` with no anchor, same as create.
    if (body.doc_paths !== undefined) {
      let currentRefs: Array<{ uri: string; anchor?: string | null }> = [];
      try {
        const resp = await fetch(`${API_BASE}/api/work-items/${encodeURIComponent(external_id)}`, { headers });
        if (resp.ok) {
          const row = unwrapRow(await resp.json());
          if (Array.isArray(row?.source_references)) currentRefs = row.source_references;
        }
      } catch { /* best-effort merge — a failed read still lets the save go through bare */ }
      const anchorByUri = new Map(currentRefs.map(r => [r.uri, r.anchor]));
      patchBody.source_references = (body.doc_paths as string[]).map(uri => {
        const anchor = anchorByUri.get(uri);
        return anchor ? { uri, anchor } : { uri };
      });
    }
    // Guard the silent-no-op class (item 9's root cause, generalized): an empty patchBody
    // used to `return {} as T` WITHOUT a network call, and every caller does
    // `setItems(p => p.map(i => i.id === id ? updated : i))` — replacing the real row with
    // `{}`. Throwing here routes every caller's existing catch → toast.error instead.
    if (Object.keys(patchBody).length === 0) throw new Error("nothing to save");
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
  // upsert_cycle validates via CycleUpsertArgs server-side: any field omitted from the
  // call gets that schema's static default (e.g. name has no default and would reject;
  // state defaults to "planned"), NOT "keep the existing value." A delta-shaped PATCH
  // (e.g. {state:"done"} from the drawer's state select) would otherwise silently wipe
  // name/description/dates back to defaults. Read-merge-write: fetch the current row,
  // then let only fields explicitly present in `body` override it before the full
  // upsert. Single-user MVP: the get_cycle read and the upsert below are not
  // transactional — a concurrent write landing between them would be clobbered by this
  // stale read. Acceptable for now; no concurrent editors on this surface today.) ===
  const cycleMatch = path.match(/^\/projects\/([^/]+)\/cycles\/([^/]+)$/);
  if (cycleMatch && (method === "PATCH" || method === "DELETE")) {
    const [, project, external_id] = cycleMatch;
    const current = await mcpCall<any>("get_cycle", { project, external_id });
    if (!current || typeof current.name !== "string" || !current.name) {
      throw new Error(`Cycle PATCH/DELETE: could not load current row for ${project}/${external_id} to merge (upsert_cycle is full-replace)`);
    }
    const args: Record<string, unknown> = {
      project, external_id,
      name: body?.name !== undefined ? body.name : current.name,
      description: body?.description !== undefined ? body.description : (current.description ?? null),
      state: method === "DELETE" ? "archived" : (body?.state !== undefined ? body.state : current.state),
      start_date: body?.start_date !== undefined ? (body.start_date || null) : (current.start_date ?? null),
      end_date: body?.end_date !== undefined ? (body.end_date || null) : (current.end_date ?? null),
      idempotency_key: idempKey("cy"),
    };
    const r = await mcpCall<any>("upsert_cycle", args);
    return adaptCycleRead(unwrapRow(r)) as T;
  }

  // === Modules — patch/archive (Path B — /mcp upsert_module; FULL-REPLACE semantics —
  // same class of bug as cycles above (ModuleUpsertArgs has no "keep existing" concept
  // for omitted fields — team defaults to [], folder_path to null, state to
  // "pending-review"). Read-merge-write, same pattern and same single-user-MVP caveat
  // as the cycles block. NOTE: `parent_module_id` is now a external_id on both sides —
  // adaptModuleRead resolves the backend's UUID through `toExternalId` (2026-08-24), so
  // `body.parent_module_id` → `args.parent_module` needs no extra lookup. It is still
  // only forwarded when the caller supplies it; a `current`-row merge is not attempted
  // here because get_module does not return the field. Caller must still include project
  // code in body since /modules/{id} carries no project scope.) ===
  const modMatch = path.match(/^\/modules\/([^/]+)$/);
  if (modMatch && (method === "PATCH" || method === "DELETE")) {
    const external_id = modMatch[1];
    const project = body?.project_id ?? body?.project;
    if (!project) throw new Error("Module PATCH/DELETE requires project_id in body (adapter routing — Path B)");
    const current = await mcpCall<any>("get_module", { project, external_id });
    if (!current || typeof current.name !== "string" || !current.name) {
      throw new Error(`Module PATCH/DELETE: could not load current row for ${project}/${external_id} to merge (upsert_module is full-replace)`);
    }
    const args: Record<string, unknown> = {
      project, external_id,
      name: body?.name !== undefined ? body.name : current.name,
      description: body?.description !== undefined ? body.description : (current.description ?? null),
      state: method === "DELETE" ? "archived" : (body?.state !== undefined ? body.state : current.state),
      team: body?.team !== undefined ? body.team : (current.team ?? []),
      folder_path: body?.folder_path !== undefined ? body.folder_path : (current.folder_path ?? null),
      // Acceptance criteria (2026-08-24, slice S3). Merged like every other field so a
      // delta-shaped drawer save cannot reset them. Unlike `description` these ARE
      // returned by get_module (not a _HEAVY_FIELDS entry), so `current` genuinely
      // carries the stored value and the merge round-trips correctly.
      acceptance_criteria: body?.acceptance_criteria !== undefined ? (body.acceptance_criteria || null) : (current.acceptance_criteria ?? null),
      acceptance_criteria_ref: body?.acceptance_criteria_ref !== undefined ? (body.acceptance_criteria_ref || null) : (current.acceptance_criteria_ref ?? null),
      // Item 7 (Wave E, 2026-09-06): drag-order persistence. `get_module` DOES return
      // `position` (unlike `description`, not a _HEAVY_FIELDS entry), so `current` carries
      // the real stored value and this merge round-trips it exactly like every field above.
      position: body?.position !== undefined ? body.position : (current.position ?? null),
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
    // Backend has NO DELETE handler on /api/initiatives/{id} — archive = PATCH state.
    // restFetch would strip the body on DELETE (line ~411), producing an empty DELETE
    // request that 405s. Bypass by issuing an explicit PATCH here — mirrors the
    // work-items bypass above.
    if (method === "DELETE") {
      const resp = await fetch(`${API_BASE}/api/initiatives/${external_id}`, {
        method: "PATCH", headers, body: JSON.stringify({ state: "archived" }),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`PATCH archive /api/initiatives/${external_id} → ${resp.status}: ${text.slice(0, 200)}`);
      }
      return adaptInitiativeRead(unwrapRow(await resp.json())) as T;
    }
    const patchBody: Record<string, unknown> = {};
    if (body.title !== undefined) patchBody.title = body.title;
    if (body.description !== undefined) patchBody.description = body.description;
    if (body.state !== undefined) patchBody.state = body.state;
    if (body.doc_paths !== undefined) patchBody.doc_paths = body.doc_paths;
    const data = await restFetch(`/api/initiatives/${external_id}`, patchBody);
    return adaptInitiativeRead(unwrapRow(data)) as T;
  }
  const initLinksPostMatch = path.match(/^\/initiatives\/([^/]+)\/links$/);
  if (initLinksPostMatch && method === "POST") {
    // Item 5: InitiativeView's link* functions keep sending the old batched shape
    // ({initiative_id, project_ids[], module_ids[], work_item_ids[]}) — each call
    // populates exactly one array with one target today, but this handles the general
    // case. The server (rest_add_initiative_link) wants {link_type, target_id}, ONE
    // call per target, against the initiative's row UUID (never its external_id).
    const uuid = await resolveInitiativeUuid(initLinksPostMatch[1]);
    const targets: Array<{ link_type: "project" | "module" | "work_item"; target_id: string }> = [
      ...((body.project_ids ?? []) as string[]).map(target_id => ({ link_type: "project" as const, target_id })),
      ...((body.module_ids ?? []) as string[]).map(target_id => ({ link_type: "module" as const, target_id })),
      ...((body.work_item_ids ?? []) as string[]).map(target_id => ({ link_type: "work_item" as const, target_id })),
    ];
    let last: any;
    for (const target of targets) {
      last = await restFetch(`/api/initiatives/${uuid}/links`, target);
    }
    return last as T;
  }
  const initLinksDeleteMatch = path.match(/^\/initiatives\/([^/]+)\/links\/([^/]+)\/([^/]+)$/);
  if (initLinksDeleteMatch && method === "DELETE") {
    const [, extId, linkType, targetId] = initLinksDeleteMatch;
    const uuid = await resolveInitiativeUuid(extId);
    const data = await restFetch(`/api/initiatives/${uuid}/links/${encodeURIComponent(linkType)}/${encodeURIComponent(targetId)}`);
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
  // Detail reads (D14 twins). The mock store keeps whole objects, so "heavy" fields
  // are already present — these exist so the no-backend dev path answers the drawer's
  // fetch-on-open instead of falling through to `Backend route not built`.
  if (/^\/work-items\/[^/]+\/detail$/.test(path) && method === "GET") {
    const id = path.split("/")[2];
    const w = store.workItems.find(x => x.id === id);
    if (!w) throw new Error("Not found");
    return { ...w, blocked_by: [...w.blocked_by], doc_paths: [...w.doc_paths] } as T;
  }
  if (/^\/projects\/[^/]+\/modules\/[^/]+\/detail$/.test(path) && method === "GET") {
    const id = path.split("/")[4];
    const m = store.modules.find(x => x.id === id);
    if (!m) throw new Error("Not found");
    return { ...m } as T;
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

// Wave E (2026-09-06) — drag-order persistence. Locked mechanism: read `position` in
// both adapters, sort `(position ?? +∞) asc, modules-before-tasks, created_at desc`,
// write on drop via fractional indexing. See handoff §Mechanism.

// Root list = modules ∪ root tasks; per-module task lists share the same key minus the
// module/task tie-break (both sides are tasks, so `isModule` is simply false on both).
function positionCompare(
  a: { position?: number | null; created_at?: string; isModule?: boolean },
  b: { position?: number | null; created_at?: string; isModule?: boolean },
): number {
  const pa = typeof a.position === "number" ? a.position : Number.POSITIVE_INFINITY;
  const pb = typeof b.position === "number" ? b.position : Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  if (!!a.isModule !== !!b.isModule) return a.isModule ? -1 : 1;
  return (b.created_at ?? "").localeCompare(a.created_at ?? "");
}

// Fractional-indexing constants. 1024 gives ample halvings before a gap collapses below
// POSITION_GAP_EPS and forces a renumber. MATERIALIZE_WRITE_CAP is the handoff's escalate-
// don't-work-around threshold — a batch larger than this stops with nothing written.
const POSITION_STEP = 1024;
const POSITION_GAP_EPS = 1e-6;
const MATERIALIZE_WRITE_CAP = 60;

// Persists a reorder for one list (root, or one module's tasks) after a drop.
// `ids` is the CURRENT visual order of the affected list (whatever is actually rendered —
// hidden-by-filter rows are excluded, matching what could have been dragged in the first
// place). Returns the write count so callers/tests can assert on it, or `null` when the
// call was refused (moved id not found, or the materialize cap was hit — no writes fire
// in either case).
async function commitOrderWrite(opts: {
  ids: string[];
  movedId: string;
  getPosition: (id: string) => number | null;
  persist: (id: string, position: number) => Promise<void>;
  applyLocal: (id: string, position: number) => void;
}): Promise<{ writeCount: number } | null> {
  const { ids, movedId, getPosition, persist, applyLocal } = opts;
  const movedIndex = ids.indexOf(movedId);
  if (movedIndex < 0) return null;

  const hasNull = ids.some(id => getPosition(id) === null);
  const prevId = ids[movedIndex - 1];
  const nextId = ids[movedIndex + 1];
  const prevPos = prevId ? getPosition(prevId) : null;
  const nextPos = nextId ? getPosition(nextId) : null;
  const gapTooSmall = !hasNull && prevPos !== null && nextPos !== null && (nextPos - prevPos) < POSITION_GAP_EPS;

  if (hasNull || gapTooSmall) {
    if (ids.length > MATERIALIZE_WRITE_CAP) {
      toast.error(`Reorder needs ${ids.length} writes for this list — over the ${MATERIALIZE_WRITE_CAP}-write safety cap. Nothing was written.`);
      return null;
    }
    const writes = ids.map((id, idx) => ({ id, position: (idx + 1) * POSITION_STEP }));
    writes.forEach(w => applyLocal(w.id, w.position));
    await Promise.all(writes.map(w => persist(w.id, w.position)));
    return { writeCount: writes.length };
  }

  let newPos: number;
  if (prevPos === null && nextPos !== null) newPos = nextPos - POSITION_STEP;
  else if (prevPos !== null && nextPos === null) newPos = prevPos + POSITION_STEP;
  else if (prevPos !== null && nextPos !== null) newPos = (prevPos + nextPos) / 2;
  else newPos = POSITION_STEP; // sole item in the list — first-ever position

  applyLocal(movedId, newPos);
  await persist(movedId, newPos);
  return { writeCount: 1 };
}

// ── Multi-state filter persistence (item 5) ─────────────────────────────────────
// Per-project set of visible states, `localStorage`-backed. Default = all states except
// archived — matches today's behaviour (archived rows are excluded from `items` entirely
// by `load()`, and were the single state the old single-value filter always hid).
const STATE_FILTER_LS_KEY = "caelos.stateFilter";
const HIDE_DONE_STATES: WorkItemState[] = ["done", "deferred", "archived"];

// Evaluate completion from all loaded work, never the search/state-filtered rows.
// Descendants can inherit their module through a parent task rather than module_id.
function isModuleComplete(mod: Mod, modules: Mod[], items: WorkItem[], ancestors = new Set<string>()): boolean {
  if (ancestors.has(mod.id)) return false;
  const branch = new Set(ancestors).add(mod.id);
  const children = modules.filter(m => m.parent_module_id === mod.id);
  if (children.some(child => !isModuleComplete(child, modules, items, branch))) return false;
  const taskIds = new Set(items.filter(t => t.module_id === mod.id).map(t => t.id));
  let previousSize = -1;
  while (taskIds.size !== previousSize) {
    previousSize = taskIds.size;
    for (const task of items) {
      if (task.parent_item_id && taskIds.has(task.parent_item_id)) taskIds.add(task.id);
    }
  }
  const tasks = items.filter(t => taskIds.has(t.id));
  if (tasks.some(t => !HIDE_DONE_STATES.includes(t.state))) return false;
  // An empty active module is a place to plan work, not completed work.
  return tasks.length > 0 || children.length > 0 || HIDE_DONE_STATES.includes(mod.state);
}

function defaultVisibleStates(allStates: WorkItemState[]): WorkItemState[] {
  return allStates.filter(s => s !== "archived");
}
function loadStateFilter(projectId: string, allStates: WorkItemState[]): WorkItemState[] {
  try {
    const map = JSON.parse(localStorage.getItem(STATE_FILTER_LS_KEY) ?? "{}");
    const stored = map[projectId];
    if (Array.isArray(stored) && stored.length > 0 && stored.every(s => allStates.includes(s))) return stored;
  } catch {}
  return defaultVisibleStates(allStates);
}
function saveStateFilter(projectId: string, states: WorkItemState[]): void {
  try {
    const map = JSON.parse(localStorage.getItem(STATE_FILTER_LS_KEY) ?? "{}");
    map[projectId] = states;
    localStorage.setItem(STATE_FILTER_LS_KEY, JSON.stringify(map));
  } catch {}
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
const ALL_STATES = Object.keys(STATE_CFG) as WorkItemState[];

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

// Acceptance criteria — the done-definition pair, shared by both create modals, both
// detail drawers, and the subtask quick-add row (2026-08-24, slice S3).
//
// Two fields on purpose: prose capped at 2 000 chars server-side, plus a single path to
// a fuller document. The small cap makes "if it doesn't fit, point at a file" the path of
// least resistance rather than an afterthought.
//
// The 20-char floor is already live in WorkItemUpsertArgs/ModuleUpsertArgs, so it is
// surfaced as a hint here — an accurate affordance for a constraint that exists today,
// NOT the required-on-create validation (that is slice S4 and is deliberately absent:
// adding it now would reject creates the backend still accepts).
function AcceptanceCriteriaFields({ criteria, criteriaRef, onCriteria, onCriteriaRef, disabled = false, hint = true, rows = 3 }: {
  criteria: string;
  criteriaRef: string;
  onCriteria: (v: string) => void;
  onCriteriaRef: (v: string) => void;
  disabled?: boolean;
  hint?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-3">
      <TextArea label="Acceptance Criteria" name="acceptance_criteria"
        value={criteria} onChange={e => onCriteria(e.target.value)} disabled={disabled} rows={rows}
        placeholder="Done when…"
        description={hint ? "What makes this done — one checkable condition. 20 characters minimum, 2 000 maximum; point at a file below if it needs more room." : undefined} />
      <Input label="Criteria Doc (optional)" name="acceptance_criteria_ref" leadingIcon={<FileText size={13} />}
        value={criteriaRef} onChange={e => onCriteriaRef(e.target.value)} disabled={disabled}
        placeholder="workspace/project/criteria.md" />
    </div>
  );
}

export function PriBadge({ priority }: { priority: WorkItemPriority }) {
  const c = PRI_CFG[priority];
  return <Text as="span" variant="small" tone="default" className="flex items-center gap-1"><Badge variant="dot" tone={priority === "high" || priority === "urgent" ? "danger" : priority === "medium" ? "progress" : "neutral"} aria-hidden="true" />{c.label}</Text>;
}

export function EmptyState({ icon, text, secondaryText, action }: { icon: React.ReactNode; text: string; secondaryText?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 select-none">
      <div style={{ color: NC.textFaint }}>{icon}</div>
      <Text as="p" tone="muted">{text}</Text>
      {secondaryText && <Text as="p" variant="small" tone="dim" className=" max-w-xs text-center">{secondaryText}</Text>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner() { return <Loading />; }

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text variant="label">{children}</Text>;
}

// Inline title editor shared by task and module drawer headers.
export function EditableTitleInline({ value, onSave, className = "" }: { value: string; onSave: (v: string) => void | Promise<void>; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const busyRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  async function save() {
    if (busyRef.current) return;
    const next = draft.trim();
    if (!next || next === value) { setDraft(value); setEditing(false); return; }
    busyRef.current = true; setSaving(true);
    try { await onSave(next); setEditing(false); }
    catch { requestAnimationFrame(() => inputRef.current?.focus()); }
    finally { busyRef.current = false; setSaving(false); }
  }
  if (editing) return <Input ref={inputRef} autoFocus data-inline-title-editor aria-label="Edit title" name="title" value={draft}
    readOnly={saving} aria-busy={saving} wrapperClassName="flex-1 min-w-0"
    onChange={e => setDraft(e.target.value)} onBlur={() => { void save(); }}
    onKeyDown={e => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter") { e.preventDefault(); void save(); }
      if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        if (!busyRef.current) { setDraft(value); setEditing(false); requestAnimationFrame(() => titleRef.current?.focus()); }
      }
    }} />;
  function edit() { setDraft(value); setEditing(true); }
  return <Heading size="title" ref={titleRef} tabIndex={0} onDoubleClick={edit}
    onKeyDown={e => { if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); edit(); } }}
    className={`cursor-text truncate min-w-0 ${className}`}
    title="Double-click or press Enter to edit">{value}</Heading>;
}

// Note: retained as "ConfirmDelete" for minimal call-site diff (5 sites) — internal copy and
// action are archive-only. No caller needs a true destructive path today; every mutation this
// app performs is state='archived', never a hard row delete. Add a verb prop back if that changes.
function ConfirmDelete({ open, onClose, onConfirm, label }: { open: boolean; onClose: () => void; onConfirm: () => Promise<boolean>; label: string }) {
  const [saving, setSaving] = useState(false);
  async function confirm() {
    if (saving) return;
    setSaving(true);
    try { if (await onConfirm()) onClose(); }
    finally { setSaving(false); }
  }
  return (
    <Dialog open={open} onOpenChange={next => { if (!next && !saving) onClose(); }} title={`Archive ${label}?`}
      description="The record is preserved and can be un-archived later." style={{ maxWidth: 384 }}>
      <div className="flex gap-2 justify-end">
        <Button variant="text" disabled={saving} onClick={onClose}>Cancel</Button>
        <Button variant="tonal" loading={saving} onClick={confirm}><Archive size={13} /> Archive</Button>
      </div>
    </Dialog>
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
  const [loadError, setLoadError] = useState(false);
  const postingRef = useRef(false);
  const activityPanelRef = useRef<HTMLDivElement>(null);
  function loadEntries() {
    setLoading(true); setLoadError(false);
    api<WorklogEntry[]>("/worklogs", { method: "GET" })
      .then(raw => setEntries(entityType === "task"
        ? raw.filter(e => e.work_item_id && e.work_item_id === entityId)
        : raw.filter(e => e.project === (projectId ?? entityId))))
      .catch(() => { setEntries([]); setLoadError(true); }).finally(() => setLoading(false));
  }
  async function submitNote() {
    if (!note.trim() || !onAddNote || postingRef.current) return;
    postingRef.current = true; setPosting(true);
    try { await onAddNote(note.trim()); setNote(""); loadEntries(); }
    catch { toast.error("Could not save note. Your draft is still here."); }
    finally { postingRef.current = false; setPosting(false); }
  }
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) loadEntries(); }}>
    <PopoverTrigger asChild><IconButton label="Activity" icon={<Atom size={14} />} variant="text" onClick={e => e.stopPropagation()} /></PopoverTrigger>
    <PopoverContent ref={activityPanelRef} align="end" aria-label="Activity" onClick={e => e.stopPropagation()}
      onOpenAutoFocus={e => { e.preventDefault(); requestAnimationFrame(() => {
        const panel = activityPanelRef.current;
        (panel?.querySelector<HTMLInputElement>('input') ?? panel)?.focus();
      }); }} data-activity-panel tabIndex={-1}>
      <div className="flex items-center justify-between mb-3"><Text variant="label">Activity</Text>
        <PopoverClose asChild><IconButton label="Close activity" icon={<X size={12} />} variant="text" /></PopoverClose></div>
      <ScrollArea viewportLabel="Activity entries" style={{ maxHeight: 256 }}>
        {loading ? <Loading /> : loadError ? <div><Text>Could not load activity.</Text><Button variant="text" onClick={loadEntries}>Retry</Button></div>
          : entries.length === 0 ? <Text as="p" tone="muted" className="py-8 text-center">No activity yet</Text>
          : entries.map(e => <div key={e.id} className="py-3 flex items-start gap-3">
            <Badge variant="dot" tone="sage" aria-hidden="true" className="mt-1.5" />
            <div className="flex-1 min-w-0"><Text as="p" variant="small">{e.summary}</Text>
            <Text as="p" variant="small" tone="dim">{e.author}{e.author && " · "}{new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text></div>
          </div>)}
      </ScrollArea>
      {!onAddNote && <Text as="p" variant="small" tone="muted" className="mt-3">Activity is read-only here.</Text>}
      {onAddNote && <form className="flex items-center gap-1.5 mt-3" onSubmit={e => { e.preventDefault(); void submitNote(); }}>
        <Input aria-label="Worklog note" placeholder="Add a worklog note…" value={note} readOnly={posting} wrapperClassName="flex-1 min-w-0" onChange={e => setNote(e.target.value)} />
        <IconButton type="submit" label="Add note" icon={<Plus size={13} />} loading={posting} disabled={!note.trim()} />
      </form>}
    </PopoverContent>
  </Popover>;
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

// `startIndex` is set once at drag-start and never touched by `hover` — it is the fixed
// baseline `end()` diffs against. `index` alone is unsafe here: react-dnd's `useDrag` spec
// is unmemoized (no deps array), so `useDragSource`'s `useEffect(() => { handler.spec = spec
// }, [spec])` re-points `endDrag()` at the LATEST render's `end` closure on every commit
// (verified in node_modules/react-dnd/dist/hooks/useDrag/{useDragSource,DragSourceImpl}.js).
// In a real mouse drag, React commits between hover and drop, so by drop time this row may
// have already re-rendered with a NEW `index` prop equal to the post-hover `item.index` —
// making `item.index !== index` compare a moved target against itself and silently skip the
// write. Empirically reproduced 2026-09-06: a drag with a real ~150ms gap between hover and
// drop visually reordered the list but fired zero PATCH/POST writes. `startIndex` fixes this
// because hover only ever mutates `item.index`, never `item.startIndex`.
interface DragItem { id: string; index: number; startIndex: number }

// Unified draggable wrapper for project-root items (modules OR root tasks)
function DraggableProjectItem({ id, index, onMove, onDropEnd, children }: {
  id: string;
  index: number;
  onMove: (from: number, to: number) => void;
  // Wave E: fires once per completed drag (drop landed on a valid target AND the index
  // actually changed) — never on hover. `hover` above only reorders local state; this is
  // the single place a reorder becomes a server write.
  onDropEnd: (id: string) => void;
  children: (gripRef: React.RefObject<HTMLSpanElement | null>) => React.ReactNode;
}) {
  const gripRef = useRef<HTMLSpanElement>(null);
  const rowRef  = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: PROJECT_ROOT_TYPE,
    item: { id, index, startIndex: index },
    end: (item, monitor) => {
      if (monitor.didDrop() && item.index !== item.startIndex) onDropEnd(id);
    },
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
function DraggableTaskRow({ task, index, onReorder, onDropEnd, ...rest }: TaskRowProps & { index: number; onReorder: (from: number, to: number) => void; onDropEnd: (id: string) => void }) {
  const gripRef = useRef<HTMLSpanElement>(null);
  const rowRef  = useRef<HTMLDivElement>(null);
  const modKey  = task.module_id ?? "root";

  const [{ isDragging }, drag, preview] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: TASK_TYPE(modKey),
    item: { id: task.id, index, startIndex: index },
    end: (item, monitor) => {
      if (monitor.didDrop() && item.index !== item.startIndex) onDropEnd(task.id);
    },
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
      onReorder(di, hi);
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
            <Tooltip label={mod.name}>
              <Row variant="sidebar" size="sm" style={{ paddingLeft: 28 }} aria-expanded={open}
                leadingIcon={<>{open ? <ChevronDown size={11} className="shrink-0" /> : <ChevronRight size={11} className="shrink-0" />}<Layers size={12} className="shrink-0" /></>}
                onClick={() => setExpandedMods(prev => { const n = new Set(prev); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); return n; })}>
                <span className="block truncate">{mod.name}</span>
              </Row>
            </Tooltip>
            {open && modTasks.map(task => (
              <Row variant="sidebar" size="sm" key={task.id} style={{ paddingLeft: 44 }} onClick={() => onSelectTask(task.id)}>
                <Badge variant="dot" tone={WORK_STATE_TONE[task.state]} aria-hidden="true" style={{ width: 4, height: 4 }} />
                <Text as="span" variant="small" tone="dim" className="truncate">{task.title}</Text>
              </Row>
            ))}
          </div>
        );
      })}
      {rootTasks.map(task => (
        <Row variant="sidebar" size="sm" key={task.id} style={{ paddingLeft: 32 }} onClick={() => onSelectTask(task.id)}>
          <Badge variant="dot" tone={WORK_STATE_TONE[task.state]} aria-hidden="true" style={{ width: 4, height: 4 }} />
          <Text as="span" variant="small" tone="dim" className="truncate">{task.title}</Text>
        </Row>
      ))}
      {mods.length === 0 && tasks.length === 0 && (
        <Text as="p" variant="small" tone="dim" className="px-8 py-1 ">Empty project</Text>
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
  onAddSubtask: (parentId: string, title: string, acceptanceCriteria?: string) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onAddBlocker: (taskId: string, blockerId: string) => Promise<void>;
  onRemoveBlocker: (taskId: string, blockerId: string) => Promise<void>;
  onOpenTask: (taskId: string) => void;
  onOpenMove: () => void;
}) {
  const [form, setForm] = useState({
    title: task.title, description: task.description,
    acceptance_criteria: task.acceptance_criteria ?? "",
    acceptance_criteria_ref: task.acceptance_criteria_ref ?? "",
    state: task.state, priority: task.priority, assignee: task.assignee,
  });
  const [saving, setSaving] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [newSubtaskCriteria, setNewSubtaskCriteria] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newDocPath, setNewDocPath] = useState("");
  const [docSaving, setDocSaving] = useState(false);
  const [blockerSaving, setBlockerSaving] = useState(false);
  // Fetch-on-open (D14). `hydrating` gates Save; `hydrated` records whether the heavy
  // read actually landed. `dirtyRef` stops a slow response from stomping typing.
  const [hydrating, setHydrating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const dirtyRef = useRef(false);

  // Immediate paint from the list-derived row, then hydrate from the single-item route.
  // The list payload never carries `description` (a _HEAVY_FIELDS entry stripped by
  // summary_payload), which is why the drawer used to render an empty textarea and save
  // that emptiness straight back over stored content.
  useEffect(() => {
    let cancelled = false;
    const openedId = task.id;
    dirtyRef.current = false;
    setForm({
      title: task.title, description: task.description,
      acceptance_criteria: task.acceptance_criteria ?? "",
      acceptance_criteria_ref: task.acceptance_criteria_ref ?? "",
      state: task.state, priority: task.priority, assignee: task.assignee,
    });
    setHydrated(false);
    setHydrating(true);
    (async () => {
      try {
        const detail = await api<WorkItem>(`/work-items/${openedId}/detail`);
        if (cancelled || dirtyRef.current) return;
        setForm(p => ({
          ...p,
          description: detail.description ?? "",
          acceptance_criteria: detail.acceptance_criteria ?? "",
          acceptance_criteria_ref: detail.acceptance_criteria_ref ?? "",
        }));
        setHydrated(true);
      } catch {
        // Detail read failed — keep the list-derived paint and stay un-hydrated.
        // handleSave drops `description` from the patch in that state so a failed read
        // can never turn into a silent wipe of stored content.
        if (!cancelled) toast.error("Could not load full detail — description is read-only until reload");
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [task.id]);

  const subtasks          = allItems.filter(i => i.parent_item_id === task.id);
  const blockers          = allItems.filter(i => task.blocked_by.includes(i.id));
  const releases          = allItems.filter(i => i.blocked_by.includes(task.id));
  const availableBlockers = allItems.filter(i => i.id !== task.id && !task.blocked_by.includes(i.id) && !i.parent_item_id);

  async function handleSave() {
    if (hydrating || saving) return;
    setSaving(true);
    // If the heavy read never landed, `form.description` is the list payload's empty
    // string, not stored content. Omit the key entirely rather than PATCH "" over it —
    // the adapter's whitelist only forwards keys that are present, so an omitted
    // description is preserved server-side by preserve-on-omit.
    const patch: Partial<WorkItem> = hydrated ? form : (({ description: _description, acceptance_criteria: _criteria, acceptance_criteria_ref: _criteriaRef, ...rest }) => rest)(form);
    try { await onSave(task.id, patch); }
    catch { /* The parent reports the failure; retain the draft for retry. */ }
    finally { setSaving(false); }
  }
  useCmdEnter(handleSave);

  async function handleAddSubtask() {
    if (!newSubtask.trim() || addingSubtask) return;
    setAddingSubtask(true);
    try {
      await onAddSubtask(task.id, newSubtask.trim(), newSubtaskCriteria.trim());
      setNewSubtask(""); setNewSubtaskCriteria("");
    } catch { /* Parent reports failure; keep both drafts. */ }
    finally { setAddingSubtask(false); }
  }

  async function changeDocs(paths: string[], clearDraft = false) {
    if (docSaving) return;
    setDocSaving(true);
    try { await onSave(task.id, { doc_paths: paths }); if (clearDraft) setNewDocPath(""); }
    catch { /* Parent reports failure; retain the current paths and draft. */ }
    finally { setDocSaving(false); }
  }
  async function addDocPath() {
    if (newDocPath.trim()) await changeDocs([...task.doc_paths, newDocPath.trim()], true);
  }
  async function changeBlocker(blockerId: string, remove = false) {
    if (blockerSaving) return;
    setBlockerSaving(true);
    try { await (remove ? onRemoveBlocker : onAddBlocker)(task.id, blockerId); }
    catch { /* Parent reports failure. */ }
    finally { setBlockerSaving(false); }
  }
  const blockerRows = blockers.map(b => <SharedTaskRow key={b.id} title={b.title} status={b.state} options={WORK_STATE_OPTIONS}
    onOpen={() => onOpenTask(b.id)} leading={<Badge tone="danger"><AlertTriangle size={11} /></Badge>}
    actions={<IconButton variant="text" label={`Remove blocker ${b.title}`} icon={<Unlink size={11} />} disabled={blockerSaving} onClick={() => changeBlocker(b.id, true)} />} />);

  const divider = <Separator />;

  return (
    <Drawer
      open
      onOpenChange={next => { if (!next) onClose(); }}
      style={{ right: "var(--foundry-panel-offset, 0px)" }}
      bodyLabel="Task detail"
      closeLabel="Close task"
      onEscapeKeyDown={event => { if (event.target instanceof HTMLElement && event.target.hasAttribute("data-inline-title-editor")) event.preventDefault(); }}
      title={
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <IconButton variant="text" label="Back" onClick={onBack} icon={<ChevronLeft size={14} />} />
            <Breadcrumb className="min-w-0" fullPath={[projectName, moduleName, form.title].filter(Boolean).join(" / ")}>
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
            <IconButton variant="text" label="Move to different project or module" onClick={onOpenMove} icon={<FolderInput size={13} />} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Text variant="label">Task</Text>
          </div>
          <div className="flex items-center gap-3 min-w-0 -mt-0.5">
            <EditableTitleInline
              value={task.title}
              onSave={async v => {
                await onSave(task.id, { title: v });
                setForm(p => ({ ...p, title: v }));
              }}

            />
            <StatusSelect value={task.state} options={WORK_STATE_OPTIONS}
              onValueChange={value => { const state = value as WorkItemState; setForm(p => ({ ...p, state })); void onSave(task.id, { state }).catch(() => {}); }} />
            <ActivityButton
              entityType="task"
              entityId={task.uuid ?? task.id}
              projectId={task.project_id}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        {/* Inline blocker picker when state = blocked */}
        {form.state === "blocked" && (
          <Card variant="flat" className="space-y-2">
            <Text as="p" variant="label" className="   "><Badge tone="danger">Blocking task</Badge> (optional)</Text>
            {blockerRows}
            {availableBlockers.length > 0 && <SharedSelect aria-label="Add blocking task" value="" disabled={blockerSaving}
              onValueChange={v => { if (v) void changeBlocker(v); }} placeholder="+ Add blocking task…"
              options={availableBlockers.map(t => ({ value: t.id, label: t.title }))} />}
          </Card>
        )}

        <Input label="Assignee" name="assignee" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} placeholder="Name or email" />
        <TextArea label="Description" name="description"
            value={form.description}
            onChange={e => { dirtyRef.current = true; setForm(p => ({ ...p, description: e.target.value })); }}
            placeholder={hydrating ? "Loading…" : "Add a description…"}
            rows={4}
            disabled={hydrating || !hydrated}
          />

        <AcceptanceCriteriaFields
          criteria={form.acceptance_criteria}
          criteriaRef={form.acceptance_criteria_ref}
          onCriteria={v => { dirtyRef.current = true; setForm(p => ({ ...p, acceptance_criteria: v })); }}
          onCriteriaRef={v => { dirtyRef.current = true; setForm(p => ({ ...p, acceptance_criteria_ref: v })); }}
          disabled={hydrating || !hydrated}
          hint={false}
          rows={4}
        />

        <div className="flex justify-end">
          {/* Save is held until the detail read settles: saving mid-flight would send the
              list payload's empty description straight back over stored content — the
              exact defect D14 exists to close. */}
          <Button variant="primary" loading={saving} disabled={hydrating || saving} onClick={handleSave}>Save changes</Button>
        </div>

        {divider}

        {/* Subtasks */}
        <div>
          <Text as="p" variant="label" tone="muted" className="    mb-3">Subtasks ({subtasks.length})</Text>
          {subtasks.length > 0 && (
            <div className="space-y-0.5 mb-3">
              {subtasks.map(sub => (
                <SharedTaskRow key={sub.id} title={sub.title} status={sub.state} options={WORK_STATE_OPTIONS}
                  onOpen={() => onOpenTask(sub.id)} onStatusChange={value => { void onSave(sub.id, { state: value as WorkItemState }).catch(() => {}); }}
                  actions={<IconButton variant="text" label={`Remove subtask ${sub.title}`} icon={<X size={11} />} onClick={() => onDeleteSubtask(sub.id)} />} />
              ))}
            </div>
          )}
          {/* Its own criteria input, never the parent's — a subtask is a step of its
              parent, so the parent's done-definition is the wrong criterion here. */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input aria-label="Subtask title" name="subtaskTitle" wrapperClassName="flex-1 min-w-0" disabled={addingSubtask} value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Add a subtask…" onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void handleAddSubtask(); } }} />
              <IconButton variant="tonal" label="Add subtask" loading={addingSubtask} disabled={addingSubtask || !newSubtask.trim()} onClick={handleAddSubtask} icon={<Plus size={13} />} />
            </div>
            {newSubtask.trim().length > 0 && (
              <TextArea aria-label="Subtask acceptance criteria" name="subtaskCriteria" disabled={addingSubtask}
                value={newSubtaskCriteria}
                onChange={e => setNewSubtaskCriteria(e.target.value)}
                placeholder="Acceptance criteria for this subtask — done when…"
                rows={2}
              />
            )}
          </div>
        </div>

        {divider}

        {/* Related docs */}
        <div>
          <Text as="p" variant="label" tone="muted" className="    mb-3">Related Docs ({task.doc_paths.length})</Text>
          {task.doc_paths.length > 0 && (
            <div className="space-y-0.5 mb-3">
              {task.doc_paths.map((p, i) => (
                <Card variant="flat" key={i} className="flex items-center gap-2">
                  <FileText size={11} className="shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{p}</span>
                  <IconButton variant="text" label={`Remove document ${p}`} icon={<X size={11} />} disabled={docSaving} onClick={() => changeDocs(task.doc_paths.filter(path => path !== p))} />
                </Card>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input aria-label="Related document path" name="taskDocPath" wrapperClassName="flex-1 min-w-0" value={newDocPath} disabled={docSaving} onChange={e => setNewDocPath(e.target.value)} placeholder="/path/to/doc.md" onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void addDocPath(); } }} />
            <IconButton variant="tonal" label="Add related document" icon={<Plus size={13} />} loading={docSaving} disabled={docSaving || !newDocPath.trim()} onClick={addDocPath} />
          </div>
        </div>

        {divider}

        {/* Releases (tasks that THIS task blocks) */}
        {releases.length > 0 && (
          <div>
            <Text as="p" variant="label" tone="muted" className="    mb-3">Releases ({releases.length})</Text>
            <div className="space-y-1.5">
              {releases.map(r => (
                <SharedTaskRow key={r.id} title={r.title} status={r.state} options={WORK_STATE_OPTIONS} onOpen={() => onOpenTask(r.id)} trailing={<ArrowRight size={11} />} />
              ))}
            </div>
          </div>
        )}

        {/* Blocked by (hidden when state=blocked — shown inline above) */}
        {form.state !== "blocked" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Text as="p" variant="label" tone="muted" className="   ">Blocked by ({blockers.length})</Text>
              {availableBlockers.length > 0 && (
                <SharedSelect aria-label="Add blocker" value="" disabled={blockerSaving}
                  onValueChange={v => { if (v) void changeBlocker(v); }} placeholder="+ Add"
                  options={availableBlockers.map(t => ({ value: t.id, label: t.title }))} />
              )}
            </div>
            {blockers.length === 0 ? (
              <Text as="p" tone="dim">No blockers</Text>
            ) : (
              <div className="space-y-1.5">
                {blockerRows}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  CYCLE PICKER MODAL
// ════════════════════════════════════════════════════════════════════════════════

function CyclePicker({ open, onClose, cycles, onPick, onCreate }: {
  open: boolean; onClose: () => void; cycles: Cycle[];
  onPick: (cycleId: string) => Promise<void>;
  onCreate: (name: string) => Promise<string>;
}) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  // Creation and assignment are separate writes. Keep the created ID if assignment
  // fails so retrying does not create a duplicate cycle.
  const createdRef = useRef<{ name: string; id: string } | null>(null);

  async function handlePick(id: string) {
    if (busy) return;
    setBusy(true);
    try { await onPick(id); onClose(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Failed to add to cycle"); }
    finally { setBusy(false); }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const id = createdRef.current?.name === name ? createdRef.current.id : await onCreate(name);
      createdRef.current = { name, id };
      await onPick(id);
      setNewName(""); createdRef.current = null; onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to create or assign cycle"); }
    finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!next && !busy) onClose(); }} title="Add to Cycle" style={{ maxWidth: 384 }}>
      {cycles.length > 0 && (
        <ScrollArea className="mb-4 max-h-52" viewportLabel="Available cycles">
          <div className="space-y-0.5">
            {cycles.map(c => (
              <Row key={c.id} variant="list" disabled={busy} leadingIcon={<Calendar size={13} />} onClick={() => handlePick(c.id)}
                trailing={c.start_date ? <Text as="span" variant="small" tone="default" className="flex-shrink-0">{new Date(c.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text> : undefined}>
                {c.name}
              </Row>
            ))}
          </div>
        </ScrollArea>
      )}
      <div className={cycles.length > 0 ? "pt-4" : ""}>
        <Text as="p" variant="label" tone="muted" className="    mb-2">New cycle</Text>
        <div className="flex gap-2">
          <Input aria-label="New cycle name" name="cycleName" wrapperClassName="flex-1 min-w-0" value={newName} disabled={busy} onChange={e => setNewName(e.target.value)} placeholder="Cycle name" autoFocus={cycles.length === 0}
            onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void handleCreate(); } }} />
          <IconButton label="Create and assign cycle" icon={<Plus size={13} />} variant="primary" loading={busy} disabled={busy || !newName.trim()} onClick={handleCreate} />
        </div>
      </div>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  MODULE DETAIL SLIDE-OVER
// ════════════════════════════════════════════════════════════════════════════════

function ModuleDetailSlideOver({ mod, allItems, cycles, projectName, onBack, onClose, onSave, onAddTask, onSelectTask, onDeleteMod, onAddToCycle, onCreateCycle }: {
  mod: Mod; allItems: WorkItem[]; cycles: Cycle[]; projectName: string; onBack: () => void; onClose: () => void;
  onSave: (id: string, patch: Partial<Mod>) => Promise<void>;
  onAddTask: (moduleId: string) => void;
  onSelectTask: (task: WorkItem) => void;
  onDeleteMod: (m: Mod) => void;
  onAddToCycle: (cycleId: string) => Promise<void>;
  onCreateCycle: (name: string) => Promise<string>;
}) {
  const [form, setForm] = useState({
    name: mod.name, description: mod.description ?? "", folder_path: mod.folder_path ?? "",
    acceptance_criteria: mod.acceptance_criteria ?? "",
    acceptance_criteria_ref: mod.acceptance_criteria_ref ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  // Fetch-on-open (D14) — module twin of the task drawer. Same reasoning: the modules
  // LIST payload never carries `description`, so this drawer rendered empty and saved
  // empty back through the read-merge-write.
  const [hydrating, setHydrating] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const openedId = mod.id;
    const openedProject = mod.project_id;
    dirtyRef.current = false;
    setForm({
      name: mod.name, description: mod.description ?? "", folder_path: mod.folder_path ?? "",
      acceptance_criteria: mod.acceptance_criteria ?? "",
      acceptance_criteria_ref: mod.acceptance_criteria_ref ?? "",
    });
    setHydrated(false);
    setHydrating(true);
    (async () => {
      try {
        const detail = await api<Mod>(`/projects/${openedProject}/modules/${openedId}/detail`);
        if (cancelled || dirtyRef.current) return;
        setForm(p => ({
          ...p,
          description: detail.description ?? "",
          acceptance_criteria: detail.acceptance_criteria ?? "",
          acceptance_criteria_ref: detail.acceptance_criteria_ref ?? "",
        }));
        setHydrated(true);
      } catch {
        if (!cancelled) toast.error("Could not load full detail — description is read-only until reload");
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mod.id]);

  const modTasks = allItems.filter(w => w.module_id === mod.id && !w.parent_item_id);
  const done     = modTasks.filter(t => t.state === "done" || t.state === "deferred" || t.state === "archived").length;
  const progress = modTasks.length > 0 ? Math.round((done / modTasks.length) * 100) : 0;

  async function handleSave() {
    if (saving || hydrating) return;
    setSaving(true);
    // Same guard as the task drawer: an un-hydrated `description` is the list payload's
    // empty string, not stored content. Omitting the key lets the read-merge-write below
    // fall back to `current.description` instead of writing "" over the real value.
    const patch: Partial<Mod> = hydrated ? form : (({ description: _description, acceptance_criteria: _criteria, acceptance_criteria_ref: _criteriaRef, ...rest }) => rest)(form);
    try { await onSave(mod.id, patch); }
    catch { /* Parent reports failure; keep the draft. */ }
    finally { setSaving(false); }
  }
  useCmdEnter(handleSave);

  const divider = <Separator />;

  return (
    <Drawer
      open
      onOpenChange={next => { if (!next) onClose(); }}
      style={{ right: "var(--foundry-panel-offset, 0px)" }}
      bodyLabel="Module detail"
      closeLabel="Close module"
      onEscapeKeyDown={event => { if (event.target instanceof HTMLElement && event.target.hasAttribute("data-inline-title-editor")) event.preventDefault(); }}
      title={
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <IconButton variant="text" label="Back" onClick={onBack} icon={<ChevronLeft size={14} />} />
            <Breadcrumb className="min-w-0" fullPath={[projectName, form.name].filter(Boolean).join(" / ")}>
              {projectName && (
                <>
                  <BreadcrumbItem onClick={() => {}}>{projectName}</BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem current>…</BreadcrumbItem>
            </Breadcrumb>
            {/* Cross-project module move is NOT implementable from the client
                (2026-08-24). The modules surface exposes only GET-list + POST-create
                over REST and `upsert_module` over MCP, and that tool keys on
                (project_code, external_id) and never writes project_code on update —
                so calling it with a different project CREATES a second, empty module
                in the target and leaves the original (and all its work items) behind.
                Faking the move client-side (create + repoint children + archive source)
                would be non-atomic, would mint a new module UUID, and would orphan the
                module-scoped activity rollup that keys off it. Until ops-server grows an
                atomic move, the control states that plainly instead of silently no-oping
                (it was a bare console.log placeholder — see docs/archive/pre-panda-2026-07/UI_ErrorCorrection_Notes.md #15). */}
            <IconButton variant="text" disabled label="Move to different project (unavailable — requires backend support)" icon={<FolderInput size={13} />} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Text variant="label">Module</Text>
          </div>
          <div className="flex items-center gap-3 min-w-0 -mt-0.5">
            <EditableTitleInline
              value={mod.name}
              onSave={async v => {
                await onSave(mod.id, { name: v });
                setForm(p => ({ ...p, name: v }));
              }}

            />
            <StatusSelect value={mod.state} options={WORK_STATE_OPTIONS} onValueChange={value => { void onSave(mod.id, { state: value as WorkItemState }).catch(() => {}); }} />
            <ActivityButton
              entityType="module"
              entityId={mod.id}
              projectId={mod.project_id}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-6">
        {/* Description */}
        <div>
          <TextArea label="Description" name="description"
            value={form.description}
            onChange={e => { dirtyRef.current = true; setForm(p => ({ ...p, description: e.target.value })); }}
            placeholder={hydrating ? "Loading…" : "Describe this module…"}
            rows={3}
            disabled={hydrating || !hydrated}
          />
        </div>

        {/* Acceptance criteria — a module's done-definition is usually a rollup over its
            children ("every child is done and <integration check> passes"). */}
        <AcceptanceCriteriaFields
          criteria={form.acceptance_criteria}
          criteriaRef={form.acceptance_criteria_ref}
          onCriteria={v => { dirtyRef.current = true; setForm(p => ({ ...p, acceptance_criteria: v })); }}
          onCriteriaRef={v => { dirtyRef.current = true; setForm(p => ({ ...p, acceptance_criteria_ref: v })); }}
          disabled={hydrating || !hydrated}
          hint={false}
          rows={3}
        />

        {/* Folder path field — the single canonical folder-path surface for this module.
            (Prior standalone chip in the drawer body was removed 2026-07-29 — redundant
            with this field. Progress bar moved to the Tasks section header.) */}
        <Input label="Folder Path" name="folder_path" leadingIcon={<Folder size={13} />} value={form.folder_path} onChange={e => setForm(p => ({ ...p, folder_path: e.target.value }))} placeholder="/path/to/module" />

        <div className="flex items-center gap-2">
          <Button variant="primary" loading={saving} disabled={hydrating || saving} onClick={handleSave}>Save changes</Button>
          <Button variant="tonal" onClick={() => setCycleOpen(true)}><Calendar size={13} /> Add to cycle</Button>
          <Button variant="tonal" danger onClick={() => { onClose(); onDeleteMod(mod); }} className="ml-auto"><Archive size={13} /> Archive</Button>
        </div>

        {divider}

        {/* Tasks in module */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Text as="p" variant="label" tone="muted" className="    flex-shrink-0">Tasks ({modTasks.length})</Text>
              {modTasks.length > 0 && (
                <>
                  <Progress label="Module completion" value={done} max={modTasks.length} className="flex-1 max-w-[140px] h-1 rounded-full overflow-hidden" />
                  <Text as="span" variant="mono" tone="muted" className="flex-shrink-0">{done}/{modTasks.length}</Text>
                </>
              )}
            </div>
            <Button variant="tonal" onClick={() => { onAddTask(mod.id); onClose(); }}><Plus size={11} /> Add task</Button>
          </div>
          {modTasks.length === 0 ? (
            <Text as="p" tone="dim">No tasks yet</Text>
          ) : (
            <div className="space-y-px">
              {modTasks.map(task => (
                <SharedTaskRow key={task.id} title={task.title} status={task.state} options={WORK_STATE_OPTIONS}
                  owner={task.assignee ? { name: task.assignee } : undefined} onOpen={() => { onSelectTask(task); onClose(); }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CyclePicker
        open={cycleOpen} onClose={() => setCycleOpen(false)} cycles={cycles}
        onPick={onAddToCycle}
        onCreate={onCreateCycle}
      />
    </Drawer>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  TASK ROW
// ════════════════════════════════════════════════════════════════════════════════

const WORK_STATE_TONE: Record<WorkItemState, Tone> = {
  "pending-review": "atmospheric", ready: "ready", "in-progress": "progress",
  blocked: "danger", done: "done", deferred: "neutral", archived: "structural",
};

const WORK_STATE_OPTIONS = Object.entries(STATE_CFG).map(([value, cfg]) => ({ value, label: cfg.label, tone: WORK_STATE_TONE[value as WorkItemState] }));

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

export function TaskRow({ task, allItems, depth, gripRef, onSelect, onDelete, onDuplicate, onPromote, onAddSubtask, onAddToCycle, onSaveState, onMove }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const subtasks  = allItems.filter(i => i.parent_item_id === task.id);
  const isBlocked = task.blocked_by.length > 0;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SharedTaskRow
            data-task-id={task.id}
            title={task.title}
            status={task.state}
            options={WORK_STATE_OPTIONS}
            onOpen={() => onSelect(task)}
            onStatusChange={onSaveState ? value => onSaveState(task.id, value as WorkItemState) : undefined}
            style={{ paddingLeft: depth * 20 + 16, paddingRight: 8 }}
            leading={subtasks.length > 0 ? <IconButton variant="text" label={`${expanded ? "Collapse" : "Expand"} ${task.title}`} aria-expanded={expanded}
              icon={expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} onClick={() => setExpanded(p => !p)} /> : <span style={{ width: 34, flexShrink: 0 }} />}
            afterTitle={isBlocked ? <Badge tone="danger" aria-label="Has blockers"><AlertTriangle size={12} /></Badge> : undefined}
            owner={task.assignee ? { name: task.assignee } : undefined}
            metadata={subtasks.length > 0 ? <Badge>{subtasks.length} sub</Badge> : undefined}
            actions={<IconButton variant="text" label={`Archive ${task.title}`} icon={<Archive size={12} />} onClick={() => onDelete(task)} />}
            trailing={<span ref={gripRef} data-task-control data-row-actions aria-label={`Drag ${task.title}`} style={{ display: "flex", flexShrink: 0, cursor: "grab" }}><GripVertical size={12} /></span>}
          />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onSelect(task)}><Edit2 size={13} /> View / Edit</ContextMenuItem>
          <ContextMenuItem onClick={() => onAddSubtask(task.id)}><Plus size={13} /> Add Subtask</ContextMenuItem>
          <ContextMenuItem onClick={() => onAddToCycle(task)}><Calendar size={13} /> Add to Cycle…</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onPromote(task)}><TrendingUp size={13} /> Promote to Module</ContextMenuItem>
          <ContextMenuItem onClick={() => onDuplicate(task)}><Copy size={13} /> Duplicate</ContextMenuItem>
          <ContextMenuSeparator />
          {onMove && (
            <ContextMenuItem onClick={() => onMove(task)}><FolderInput size={13} /> Move…</ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => onDelete(task)}><Archive size={13} /> Archive</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {expanded && subtasks.map(sub => (
        <TaskRow key={sub.id} task={sub} allItems={allItems} depth={depth + 1}
          onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} onPromote={onPromote}
          onAddSubtask={onAddSubtask} onAddToCycle={onAddToCycle} onMove={onMove} onSaveState={onSaveState} />
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
  // Wave E: fires on drop (not hover) with the module id and the id of the task that
  // was actually dragged — TasksPane persists the resulting order for this module.
  onTaskDropEnd: (moduleId: string, taskId: string) => void;
  onAddModToCycle: (mod: Mod) => void;
  onAddTaskToCycle: (task: WorkItem) => void;
  onSaveTaskState: (id: string, state: WorkItemState) => void;
};

export function ModuleSection({ mod, modTasks, allItems, gripRef, onOpenMod, onDeleteMod, onAddTask, onSelectTask, onDeleteTask, onDuplicateTask, onPromoteTask, onAddSubtask, onMoveTask, onTaskDropEnd, onAddModToCycle, onAddTaskToCycle, onSaveTaskState }: ModuleSectionProps) {
  // Default collapsed; persisted per module (keyed by external_id) under one
  // localStorage key so Daniel's expand/collapse choice survives refresh and
  // project switches — same pattern as Sidebar's nc-sidebar-collapse-* keys.
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const map = JSON.parse(localStorage.getItem("caelos.moduleExpanded") ?? "{}");
      return typeof map[mod.id] === "boolean" ? map[mod.id] : false;
    } catch { return false; }
  });
  const toggleExpanded = () => {
    setExpanded(prev => {
      const next = !prev;
      try {
        const map = JSON.parse(localStorage.getItem("caelos.moduleExpanded") ?? "{}");
        map[mod.id] = next;
        localStorage.setItem("caelos.moduleExpanded", JSON.stringify(map));
      } catch {}
      return next;
    });
  };
  const done     = modTasks.filter(t => t.state === "done" || t.state === "deferred" || t.state === "archived").length;
  const progress = modTasks.length > 0 ? Math.round((done / modTasks.length) * 100) : 0;

  return (
    <Card data-foundry-surface="module" style={{ padding: 0 }}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div data-module-id={mod.id} className="flex items-center gap-1.5 pr-4 group"
            style={{ paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}
            onClick={e => { if (e.currentTarget.contains(e.target as Node) && !(e.target as HTMLElement).closest("button,[data-task-control]")) onOpenMod(mod); }}>
            <IconButton variant="text" size="sm" label={`${expanded ? "Collapse" : "Expand"} ${mod.name}`}
              aria-expanded={expanded} style={{ width: 28, height: 28 }} icon={<><Layers size={13} aria-hidden />{expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</>}
              onClick={toggleExpanded} />
            <Row variant="list" size="sm" aria-label={`Open ${mod.name}`} style={{ flex: 1, minWidth: 0 }} onClick={() => onOpenMod(mod)}>
              <div className="min-w-0 text-left">
                <span style={{ textDecoration: mod.state === "done" ? "line-through" : undefined }}>{mod.name}</span>
                {modTasks.length > 0 && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress label="Module completion" value={done} max={modTasks.length} className="w-20 h-0.5 rounded-full overflow-hidden" />
                    <Text as="span" variant="small" tone="muted" className="whitespace-nowrap flex-shrink-0">{done}/{modTasks.length}</Text>
                  </div>
                )}
              </div>
            </Row>
            <Button variant="text" size="sm" leadingIcon={<Plus size={11} />} onClick={() => onAddTask(mod.id)}>Task</Button>
            {mod.folder_path && <Text as="span" variant="mono" tone="dim" className="truncate max-w-[100px] hidden lg:block">{mod.folder_path}</Text>}
            <span ref={gripRef} data-task-control aria-label={`Drag ${mod.name}`} className="flex-shrink-0 w-4 flex items-center justify-center cursor-grab active:cursor-grabbing">
              <GripVertical size={12} />
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onOpenMod(mod)}><Edit2 size={13} /> Open</ContextMenuItem>
          <ContextMenuItem onClick={() => onAddTask(mod.id)}><Plus size={13} /> Add Task</ContextMenuItem>
          <ContextMenuItem onClick={() => onAddModToCycle(mod)}><Calendar size={13} /> Add to Cycle…</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onDeleteMod(mod)}><Archive size={13} /> Archive</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {expanded && modTasks.map((task, idx) => (
        <DraggableTaskRow
          key={task.id} task={task} index={idx} allItems={allItems} depth={1}
          onReorder={(from, to) => onMoveTask(from, to, mod.id)}
          onDropEnd={id => onTaskDropEnd(mod.id, id)}
          onSelect={onSelectTask} onDelete={onDeleteTask}
          onDuplicate={onDuplicateTask} onPromote={onPromoteTask}
          onAddSubtask={onAddSubtask} onAddToCycle={onAddTaskToCycle}
          onSaveState={onSaveTaskState}
        />
      ))}
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  TASKS PANE
// ════════════════════════════════════════════════════════════════════════════════

const EMPTY_TASK_FORM = {
  title: "", description: "",
  acceptance_criteria: "", acceptance_criteria_ref: "",
  state: "ready" as WorkItemState,
  assignee: "", module_id: null as string | null, parent_item_id: null as string | null,
  // Item 9 (Wave D, 2026-09-06): Related Docs, addable at create time — see the
  // New Task / New Subtask modal below. Maps onto `source_references[].uri` at the
  // adapter boundary (api()'s work-items POST block), same as the drawer's field.
  doc_paths: [] as string[],
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
  // Wave E: `itemOrder`/`items` mirrors, mutated SYNCHRONOUSLY and imperatively wherever
  // `moveRootItem`/`moveTask` mutate the corresponding state (never via `setState`'s
  // updater form for reads). Verified empirically (instrumented drag, 2026-09-06):
  // react-dnd's HTML5Backend drives `hover()`/`onMove` from raw native `addEventListener`
  // callbacks outside React's render cycle, and `setState(updater)` does NOT run its
  // updater synchronously — it only threads through queued updaters at React's next
  // actual render pass. A same-tick "peek via setState" read a stale, pre-reorder value
  // every time (`movedIndex` in the drop-end handler kept resolving to the ORIGINAL
  // index, never the post-hover one) even though the visual reorder was already correct
  // on screen. These refs are the fix: read from `.current`, which is updated the instant
  // the move happens, not on whatever cadence React chooses to commit.
  const itemOrderRef = useRef<string[]>([]);
  const itemsRef = useRef<WorkItem[]>([]);
  useEffect(() => { itemOrderRef.current = itemOrder; }, [itemOrder]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const [search, setSearch] = useState("");
  // Item 5 — multi-state filter, localStorage-persisted per project. Re-derived whenever
  // `projectId` changes (TasksPane is one mounted instance reused across project switches,
  // not remounted per project — see `load`'s own `[projectId]` dependency for the same
  // pattern), never re-read on every render.
  const [visibleStates, setVisibleStates] = useState<WorkItemState[]>(() => loadStateFilter(projectId, ALL_STATES));
  useEffect(() => { setVisibleStates(loadStateFilter(projectId, ALL_STATES)); }, [projectId]);
  const hideDoneActive = HIDE_DONE_STATES.every(s => !visibleStates.includes(s));
  function toggleState(s: WorkItemState) {
    setVisibleStates(prev => {
      const next = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s];
      saveStateFilter(projectId, next);
      return next;
    });
  }
  function toggleHideDone() {
    setVisibleStates(prev => {
      // Un-hiding restores done+deferred only — never archived. Restoring all three would
      // silently reveal archived rows nobody asked to see; archived's visibility is the
      // dropdown's job alone. (Round-trip bug caught in verification: toggle on then off
      // from the default set previously left "archived" checked that was never checked.)
      const next = hideDoneActive
        ? Array.from(new Set<WorkItemState>([...prev, "done", "deferred"]))
        : prev.filter(s => !HIDE_DONE_STATES.includes(s));
      saveStateFilter(projectId, next);
      return next;
    });
  }
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedModId, setSelectedModId]   = useState<string | null>(null);

  const [creatingTask, setCreatingTask] = useState(false);
  const addTaskTriggerRef = useRef<HTMLButtonElement>(null);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [taskSaving, setTaskSaving] = useState(false);
  // Item 9 (Wave D, 2026-09-06): WIP text for the create-modal's Related Docs add row —
  // mirrors `newDocPath` in TaskDrawer/InitiativeView. TasksPane stays mounted across
  // modal opens (unlike the drawer, which unmounts), so this is reset explicitly in
  // openAddTask/openAddSubtask alongside the rest of `taskForm`.
  const [newTaskDocPath, setNewTaskDocPath] = useState("");
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
  const [modCriteria, setModCriteria] = useState("");
  const [modCriteriaRef, setModCriteriaRef] = useState("");
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
      // Item 7 — read+sort: (position ?? +∞) asc, modules-before-tasks, created_at desc.
      // The REST list endpoints already return each TABLE in this order, but modules and
      // work-items are separate tables/endpoints — merging them into one interleaved root
      // sequence is a client-side job. Sorting `items`/`mods` themselves too (not just the
      // combined root order) keeps per-module task lists correctly ordered under the same
      // key, and is a defensive no-op when the backend already delivered them sorted.
      const sortedMods  = [...activeMods].sort(positionCompare);
      const sortedItems = [...activeItems].sort(positionCompare);
      setItems(sortedItems);
      setMods(sortedMods);
      setCycles(cyclesData.filter(c => c.state !== "archived"));
      setMembers(membersData);
      const rootEntries = [
        ...sortedMods.map(m => ({ id: m.id, position: m.position, created_at: m.created_at, isModule: true })),
        ...sortedItems.filter(w => !w.module_id && !w.parent_item_id).map(w => ({ id: w.id, position: w.position, created_at: w.created_at, isModule: false })),
      ].sort(positionCompare);
      setItemOrder(rootEntries.map(e => e.id));
    } catch { toast.error("Failed to load project data"); }
    finally { setLoading(false); }
  }, [fixtureMode, projectId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (pendingTaskId) { setSelectedTaskId(pendingTaskId); onClearPending(); } }, [pendingTaskId]);

  const selectedTask = selectedTaskId ? items.find(i => i.id === selectedTaskId) ?? null : null;
  const selectedMod  = selectedModId  ? mods.find(m => m.id === selectedModId) ?? null : null;

  // ── DnD ─────────────────────────────────────────────────────────────────────

  // Both mutate `.current` SYNCHRONOUSLY, imperatively, in addition to calling the
  // ordinary `setState` — see the itemOrderRef/itemsRef comment above for why: react-dnd's
  // hover fires from a raw native event listener outside React's render cycle, and the
  // drop-end handlers below need the TRUE current order the instant the drop happens, not
  // whenever React next chooses to commit a render.
  function moveRootItem(from: number, to: number) {
    const next = arrayMove(itemOrderRef.current, from, to);
    itemOrderRef.current = next;
    setItemOrder(next);
  }
  // `visibleGroup` is the EXACT array ModuleSection rendered (`modTasks` — already passed
  // through `visibleFilter`), not a fresh recomputation from `items`. Recomputing here
  // without the filter was the pre-existing bug this fix closes: `from`/`to` are indices
  // into the RENDERED (filtered) list, so resolving them against an unfiltered group
  // silently picks the wrong anchor row the moment any row in this module is hidden by
  // the state filter — exactly the scenario the new "Hide done" chip makes routine.
  function moveTask(from: number, to: number, moduleId: string, visibleGroup: WorkItem[]) {
    const fi = itemsRef.current.findIndex(i => i.id === visibleGroup[from]?.id);
    const ti = itemsRef.current.findIndex(i => i.id === visibleGroup[to]?.id);
    if (fi < 0 || ti < 0) return;
    const next = arrayMove(itemsRef.current, fi, ti);
    itemsRef.current = next;
    setItems(next);
  }

  // Item 7 — write on drop. Fires once per completed drag (react-dnd `end`, `didDrop()`
  // true, index actually changed — never on hover). Reads `itemOrderRef`/`itemsRef`
  // (`.current`, imperative) rather than the closed-over `itemOrder`/`items` state
  // variables — see the ref declarations above for why a plain render-scope read (or a
  // `setState`-updater "peek", which was tried and empirically failed the same way) is
  // stale at this exact call site. `mods` is read directly: nothing mutates it mid-drag.
  async function handleRootDropEnd(movedId: string) {
    const freshItemOrder = itemOrderRef.current;
    const freshItems = itemsRef.current;
    const modIds = new Set(mods.map(m => m.id));
    const ids = freshItemOrder.filter(id => {
      if (modIds.has(id)) return !hideDoneActive || !isModuleComplete(mods.find(m => m.id === id)!, mods, freshItems);
      const task = freshItems.find(i => i.id === id);
      return !!task && visibleFilter(task);
    });
    const getPosition = (id: string) =>
      modIds.has(id) ? (mods.find(m => m.id === id)?.position ?? null) : (freshItems.find(i => i.id === id)?.position ?? null);
    const persist = async (id: string, position: number) => {
      if (modIds.has(id)) await api<Mod>(`/modules/${id}`, { method: "PATCH", body: JSON.stringify({ position, project_id: projectId }) });
      else await api<WorkItem>(`/work-items/${id}`, { method: "PATCH", body: JSON.stringify({ position }) });
    };
    const applyLocal = (id: string, position: number) => {
      if (modIds.has(id)) setMods(prev => prev.map(m => m.id === id ? { ...m, position } : m));
      else { itemsRef.current = itemsRef.current.map(i => i.id === id ? { ...i, position } : i); setItems(itemsRef.current); }
    };
    try {
      await commitOrderWrite({ ids, movedId, getPosition, persist, applyLocal });
    } catch (e: any) {
      toast.error(`Failed to save order: ${(e?.message || "unknown error").slice(0, 140)}`);
      await load();
    }
  }

  async function handleModuleDropEnd(moduleId: string, movedId: string) {
    const freshItems = itemsRef.current;
    const visible = freshItems.filter(w => w.module_id === moduleId && !w.parent_item_id && visibleFilter(w));
    const ids = visible.map(t => t.id);
    const getPosition = (id: string) => freshItems.find(i => i.id === id)?.position ?? null;
    const persist = async (id: string, position: number) => { await api<WorkItem>(`/work-items/${id}`, { method: "PATCH", body: JSON.stringify({ position }) }); };
    const applyLocal = (id: string, position: number) => { itemsRef.current = itemsRef.current.map(i => i.id === id ? { ...i, position } : i); setItems(itemsRef.current); };
    try {
      await commitOrderWrite({ ids, movedId, getPosition, persist, applyLocal });
    } catch (e: any) {
      toast.error(`Failed to save order: ${(e?.message || "unknown error").slice(0, 140)}`);
      await load();
    }
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

  function openAddTask(moduleId: string | null = null) { setTaskForm({ ...EMPTY_TASK_FORM, module_id: moduleId }); setNewTaskDocPath(""); setCreatingTask(true); }
  function openAddSubtask(parentId: string) {
    const parent = items.find(i => i.id === parentId);
    setTaskForm({ ...EMPTY_TASK_FORM, parent_item_id: parentId, module_id: parent?.module_id ?? null });
    setNewTaskDocPath("");
    setCreatingTask(true);
  }

  // Item 9 (Wave D, 2026-09-06): add/remove for the create-modal's Related Docs field —
  // same add/remove-row pattern as TaskDrawer's addDocPath/removeDocPath, scoped to the
  // in-flight `taskForm` instead of a saved task.
  function addTaskDocPath() {
    if (!newTaskDocPath.trim()) return;
    setTaskForm(p => ({ ...p, doc_paths: [...p.doc_paths, newTaskDocPath.trim()] }));
    setNewTaskDocPath("");
  }
  function removeTaskDocPath(path: string) {
    setTaskForm(p => ({ ...p, doc_paths: p.doc_paths.filter(x => x !== path) }));
  }

  async function createTask() {
    if (taskSaving) return;
    if (!taskForm.title.trim()) return toast.error("Title is required");
    setTaskSaving(true);
    try {
      const item = await api<WorkItem>(`/projects/${projectId}/work-items`, { method: "POST", body: JSON.stringify(taskForm) });
      setItems(p => [...p, item]);
      if (!taskForm.module_id && !taskForm.parent_item_id) setItemOrder(prev => [...prev, item.id]);
      setCreatingTask(false); setTaskForm(EMPTY_TASK_FORM); setNewTaskDocPath("");
      toast.success(taskForm.parent_item_id ? "Subtask created" : "Task created");
    } catch { toast.error("Failed to create task"); }
    finally { setTaskSaving(false); }
  }

  async function saveTask(id: string, patch: Partial<WorkItem>) {
    try {
      const updated = await api<WorkItem>(`/work-items/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setItems(p => p.map(i => i.id === id ? updated : i));
      toast.success("Saved");
    } catch (error) { toast.error("Failed to save"); throw error; }
  }

  async function deleteTask_(task: WorkItem) {
    try {
      await api(`/work-items/${task.id}`, { method: "DELETE" });
      setItems(p => p.filter(i => i.id !== task.id && i.parent_item_id !== task.id));
      setItemOrder(prev => prev.filter(id => id !== task.id));
      if (selectedTaskId === task.id) setSelectedTaskId(null);
      toast.success("Deleted");
      return true;
    } catch { toast.error("Failed to delete"); return false; }
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
      return true;
    } catch (e: any) {
      const msg = (e?.message || "unknown error").slice(0, 140);
      toast.error(`Failed to move: ${msg}`);
      return false;
    }
  }

  // The spread below carries acceptance_criteria/_ref into the POST body, but that alone
  // is NOT what makes them persist: the create adapter builds an explicit backendBody and
  // drops anything it does not name, so the two new keys had to be added there too.
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

  // The quick-add row bypasses the create modal with a literal payload, so it needs its
  // OWN criteria argument. It deliberately does NOT inherit the parent's: a subtask is a
  // *step of* its parent, so the parent's done-definition is the wrong criterion by
  // construction — inheriting would be a disguised sentinel that reads as populated while
  // asserting something false (spec, DECIDED).
  async function addSubtask(parentId: string, title: string, acceptanceCriteria = "") {
    const parent = items.find(i => i.id === parentId); if (!parent) return;
    try {
      const created = await api<WorkItem>(`/projects/${projectId}/work-items`, {
        method: "POST",
        body: JSON.stringify({ title, description: "", acceptance_criteria: acceptanceCriteria, state: "ready" as WorkItemState, priority: "none" as WorkItemPriority, assignee: "", module_id: parent.module_id ?? null, parent_item_id: parentId }),
      });
      setItems(p => [...p, created]);
    } catch (error) { toast.error("Failed to add subtask"); throw error; }
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

  async function createCycleForAssignment(name: string): Promise<string> {
    const c = await api<Cycle>(`/projects/${projectId}/cycles`, { method: "POST", body: JSON.stringify({ name, start_date: "", end_date: "" }) });
    setCycles(p => [...p, c]);
    return c.id;
  }

  async function assignTaskToCycle(task: WorkItem, cycleId: string) {
    await api(`/projects/${projectId}/cycles/${cycleId}/work-items`, { method: "POST", body: JSON.stringify({ work_items: [task.id] }) });
    toast.success(`"${task.title}" added to cycle`);
  }

  async function assignModToCycle(mod: Mod, cycleId: string) {
    const modTasks = items.filter(w => w.module_id === mod.id && !w.parent_item_id);
    if (!modTasks.length) throw new Error("This module has no tasks to assign");
    if (modTasks.length > 500) throw new Error("Cycle assignment supports up to 500 tasks at once");
    await api(`/projects/${projectId}/cycles/${cycleId}/work-items`, { method: "POST", body: JSON.stringify({ work_items: modTasks.map(t => t.id) }) });
    toast.success(`All tasks in "${mod.name}" added to cycle`);
  }

  // ── Module handlers ──────────────────────────────────────────────────────────

  async function createMod() {
    if (modSaving) return;
    if (!modName.trim()) return toast.error("Name is required");
    setModSaving(true);
    try {
      const m = await api<Mod>(`/projects/${projectId}/modules`, {
        method: "POST",
        body: JSON.stringify({
          name: modName,
          description: modDescription,
          acceptance_criteria: modCriteria,
          acceptance_criteria_ref: modCriteriaRef,
        }),
      });
      setMods(p => [...p, m]); setItemOrder(prev => [...prev, m.id]);
      setCreatingMod(false); setModName(""); setModDescription("");
      setModCriteria(""); setModCriteriaRef("");
      toast.success("Module created");
    } catch { toast.error("Failed to create module"); }
    finally { setModSaving(false); }
  }

  async function saveMod(id: string, patch: Partial<Mod>) {
    try {
      const updated = await api<Mod>(`/modules/${id}`, { method: "PATCH", body: JSON.stringify({ ...patch, project_id: projectId }) });
      setMods(p => p.map(m => m.id === id ? updated : m));
      toast.success("Module updated");
    } catch (error) { toast.error("Failed to update module"); throw error; }
  }

  async function deleteMod_(m: Mod) {
    try {
      await api(`/modules/${m.id}`, { method: "DELETE", body: JSON.stringify({ project_id: m.project_id }) });
      setMods(p => p.filter(x => x.id !== m.id));
      setItemOrder(prev => prev.filter(id => id !== m.id));
      toast.success("Module archived");
      return true;
    } catch { toast.error("Failed to archive module"); return false; }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const visibleFilter = (task: WorkItem) => {
    if (!visibleStates.includes(task.state)) return false;
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
    onSaveState: (id: string, state: WorkItemState) => { void saveTask(id, { state }).catch(() => {}); },
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderColor: NC.borderFaint }}>
          <Input variant="search" aria-label="Search tasks" name="taskSearch" wrapperClassName="flex-1 min-w-0 max-w-sm" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
          {/* Keep the menu open while selecting multiple visible task states. */}
          <ActionMenuRoot>
            <ActionMenuTrigger asChild>
              <Button variant="tonal" aria-label="Filter task states">
                <span>{visibleStates.length} state{visibleStates.length === 1 ? "" : "s"}</span>
                <ChevronDown size={12} style={{ opacity: 0.55, flexShrink: 0 }} />
              </Button>
            </ActionMenuTrigger>
            <ActionMenuContent side="bottom" align="start" aria-label="Task state filters">
              {ALL_STATES.map(s => (
                <ActionMenuCheckboxItem
                  key={s}
                  checked={visibleStates.includes(s)}
                  onCheckedChange={() => toggleState(s)}
                  onSelect={e => e.preventDefault()}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATE_CFG[s].color }} aria-hidden="true" />
                  {STATE_CFG[s].label}
                </ActionMenuCheckboxItem>
              ))}
            </ActionMenuContent>
          </ActionMenuRoot>
          <Chip selected={hideDoneActive} onClick={toggleHideDone}>
            Hide done
          </Chip>
          <div className="ml-auto">
            <ActionMenuRoot>
              <ActionMenuTrigger asChild>
                <IconButton ref={addTaskTriggerRef} variant="primary" label="Add new" icon={<Plus size={14} />} />
              </ActionMenuTrigger>
              <ActionMenuContent side="bottom" align="end" onCloseAutoFocus={event => { if (creatingTask || creatingMod) event.preventDefault(); }}>
                <ActionMenuItem onSelect={() => openAddTask()}><Plus size={13} /> Task</ActionMenuItem>
                <ActionMenuItem onSelect={() => { setModName(""); setModDescription(""); setCreatingMod(true); }}><Layers size={13} /> Module</ActionMenuItem>
              </ActionMenuContent>
            </ActionMenuRoot>
          </div>
        </div>

        {/* Unified tree */}
        <ScrollArea className="flex-1 min-h-0" viewportLabel="Project tasks">
          {loading ? (
            <EmptyState icon={<Spinner />} text="Loading…" />
          ) : isEmpty ? (
            <EmptyState icon={<Target size={36} />} text="No tasks yet" secondaryText="Use the + Task button above to add your first one" />
          ) : (
            orderedEntries.map((entry, idx) => {
              if (entry.type === "module") {
                if (hideDoneActive && isModuleComplete(entry.mod, mods, items)) return null;
                const modTasks = items.filter(w => w.module_id === entry.id && !w.parent_item_id && visibleFilter(w));
                return (
                  <DraggableProjectItem key={entry.id} id={entry.id} index={idx} onMove={moveRootItem} onDropEnd={handleRootDropEnd}>
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
                        onMoveTask={(from, to, moduleId) => moveTask(from, to, moduleId, modTasks)}
                        onTaskDropEnd={handleModuleDropEnd}
                        onAddModToCycle={m => setCycleTarget({ type: "module", mod: m })}
                        onAddTaskToCycle={t => setCycleTarget({ type: "task", task: t })}
                        onSaveTaskState={(id, state) => { void saveTask(id, { state }).catch(() => {}); }}
                      />
                    )}
                  </DraggableProjectItem>
                );
              }
              if (!visibleFilter(entry.task)) return null;
              return (
                <DraggableProjectItem key={entry.id} id={entry.id} index={idx} onMove={moveRootItem} onDropEnd={handleRootDropEnd}>
                  {gripRef => <TaskRow task={entry.task} allItems={items} depth={0} gripRef={gripRef} {...sharedTaskProps} />}
                </DraggableProjectItem>
              );
            })
          )}
        </ScrollArea>

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
            onCreateCycle={createCycleForAssignment}
          />
        )}

        {/* Cycle picker */}
        {cycleTarget && (
          <CyclePicker
            open={!!cycleTarget} onClose={() => setCycleTarget(null)} cycles={cycles}
            onPick={cycleId => cycleTarget.type === "task" ? assignTaskToCycle(cycleTarget.task, cycleId) : assignModToCycle(cycleTarget.mod, cycleId)}
            onCreate={createCycleForAssignment}
          />
        )}

        {/* Move task modal — hoisted from TaskDetailSlideOver so right-click ContextMenu shares it */}
        {moveTargetTask && (
          <Dialog open={!!moveTargetTask} onOpenChange={next => { if (!next && !moveSaving) setMoveTargetTask(null); }} title="Move task">
            <Text as="div" variant="small" tone="muted" className="mb-3">
              Currently in <Text variant="small">{allProjects.find(p => p.id === moveTargetTask.project_id)?.name ?? moveTargetTask.project_id}</Text>
              {moveTargetTask.module_id ? <> · <Text variant="small">{mods.find(m => m.id === moveTargetTask.module_id)?.name ?? moveTargetTask.module_id}</Text></> : ""}
            </Text>
            <SharedSelect showLabel wrapperClassName="mb-4" style={{ width: "100%" }} label="Project" name="project"
                value={moveProject}
                onValueChange={(v) => { setMoveProject(v); setMoveModule(""); }}
                options={allProjects.map((p) => ({ value: p.id, label: p.name }))}
              />
            <SharedSelect showLabel wrapperClassName="mb-4" style={{ width: "100%" }} label="Module" name="module"
                value={moveModule || "__none__"}
                onValueChange={(v) => setMoveModule(v === "__none__" ? "" : v)}
                options={[
                  { value: "__none__", label: "(no module — project root)" },
                  ...moveTargetModules.map((m) => ({ value: m.id, label: m.name })),
                ]}
              />
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="text" disabled={moveSaving} onClick={() => setMoveTargetTask(null)}>Cancel</Button>
              <Button variant="primary"
                loading={moveSaving}
                disabled={isMoveNoop || moveSaving}
                onClick={async () => {
                  if (moveSaving) return;
                  setMoveSaving(true);
                  try {
                    if (await moveTask_(moveTargetTask, moveProject, moveModule || null)) setMoveTargetTask(null);
                  } finally { setMoveSaving(false); }
                }}
              >Move</Button>
            </div>
          </Dialog>
        )}

        {/* Create task modal */}
        <Dialog open={creatingTask} returnFocusRef={addTaskTriggerRef} onOpenChange={setCreatingTask} title={taskForm.parent_item_id ? "New Subtask" : "New Task"}>
          <div className="mb-4"><Input label="Title" name="title" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" autoFocus onKeyDown={e => e.key === "Enter" && createTask()} /></div>
          <div className="mb-4"><TextArea label="Description" name="description" value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" /></div>
          <div className="mb-4">
            <AcceptanceCriteriaFields
              criteria={taskForm.acceptance_criteria}
              criteriaRef={taskForm.acceptance_criteria_ref}
              onCriteria={v => setTaskForm(p => ({ ...p, acceptance_criteria: v }))}
              onCriteriaRef={v => setTaskForm(p => ({ ...p, acceptance_criteria_ref: v }))}
            />
          </div>
          <SharedSelect showLabel wrapperClassName="mb-4" style={{ width: "100%" }} label="State" name="state" value={taskForm.state} onValueChange={v => setTaskForm(p => ({ ...p, state: v as WorkItemState }))} options={Object.entries(STATE_CFG).map(([v, c]) => ({ value: v, label: c.label, color: c.color }))} />
          <SharedSelect showLabel wrapperClassName="mb-4" style={{ width: "100%" }} label="Assignee" name="assignee"
              value={taskForm.assignee || "__unassigned__"}
              onValueChange={v => setTaskForm(p => ({ ...p, assignee: v === "__unassigned__" ? "" : v }))}
              options={[
                { value: "__unassigned__", label: "(unassigned)" },
                ...members.map(member => ({ value: member.name, label: member.name })),
              ]}
            />
          <section className="mb-4" aria-label="Related Docs">
            <span>Related Docs{taskForm.doc_paths.length ? ` (${taskForm.doc_paths.length})` : ""}</span>
            {taskForm.doc_paths.map((path, i) => (
              <Card key={i} className="flex items-center gap-2 my-1 p-2">
                <FileText size={13} aria-hidden /><span className="flex-1 min-w-0 truncate">{path}</span>
                <IconButton variant="text" label={`Remove ${path}`} icon={<X size={13} />} onClick={() => removeTaskDocPath(path)} />
              </Card>
            ))}
            <div className="flex gap-2 mt-2">
              <Input aria-label="Related document path" wrapperClassName="flex-1 min-w-0" value={newTaskDocPath} onChange={e => setNewTaskDocPath(e.target.value)} placeholder="/path/to/doc.md" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTaskDocPath(); } }} />
              <IconButton label="Add related document" icon={<Plus size={13} />} onClick={addTaskDocPath} />
            </div>
          </section>
          <div className="flex gap-2 justify-end pt-1"><Button variant="text" onClick={() => setCreatingTask(false)}>Cancel</Button><Button variant="primary" loading={taskSaving} onClick={createTask}>Create</Button></div>
        </Dialog>

        {/* Create module modal */}
        <Dialog open={creatingMod} returnFocusRef={addTaskTriggerRef} onOpenChange={setCreatingMod} title="New Module" style={{ maxWidth: 384 }}>
          <Input label="Name" name="name" wrapperClassName="mb-4" value={modName} onChange={e => setModName(e.target.value)} placeholder="Module name" autoFocus onKeyDown={e => e.key === "Enter" && createMod()} />
          <TextArea label="Description" name="description" wrapperClassName="mb-4" value={modDescription} onChange={e => setModDescription(e.target.value)} placeholder="Optional — what is this for?" rows={3} />
          <div className="mb-4">
            <AcceptanceCriteriaFields
              criteria={modCriteria}
              criteriaRef={modCriteriaRef}
              onCriteria={setModCriteria}
              onCriteriaRef={setModCriteriaRef}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1"><Button variant="text" onClick={() => setCreatingMod(false)}>Cancel</Button><Button variant="primary" loading={modSaving} onClick={createMod}>Create</Button></div>
        </Dialog>

        <ConfirmDelete open={!!deleteMod} onClose={() => setDeleteMod(null)} onConfirm={() => deleteMod ? deleteMod_(deleteMod) : Promise.resolve(false)} label="module" />
        <ConfirmDelete open={!!deleteTask} onClose={() => setDeleteTask(null)} onConfirm={() => deleteTask ? deleteTask_(deleteTask) : Promise.resolve(false)} label="task" />
      </div>
    </DndProvider>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  TEAM TAB
// ════════════════════════════════════════════════════════════════════════════════

export function TeamTab({ projectId }: { projectId: string }) {
  const addMemberTriggerRef = useRef<HTMLButtonElement>(null);
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
    if (saving) return;
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
        <Text as="span" variant="small" tone="muted">{members.length} member{members.length !== 1 ? "s" : ""}</Text>
        <Button ref={addMemberTriggerRef} onClick={() => setAdding(true)} disabled={available.length === 0}>
          <UserPlus size={13} /> Add member
        </Button>
      </div>

      <ScrollArea viewportLabel="Project team" className="flex-1 min-h-0 p-6">
        {loading ? <EmptyState icon={<Spinner />} text="Loading team…" /> :
          members.length === 0 ? <EmptyState icon={<Users size={36} />} text="No team members yet" secondaryText="Use Add Member above to invite from the roster" /> : (
          <div className="space-y-2">
            {members.map(member => (
              <UserCard key={member.id} name={member.name}
                actions={<IconButton variant="text" label={`Remove ${member.name}`} icon={<X size={13} />} onClick={() => removeMember(member)} />} />
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={adding} onOpenChange={setAdding} title="Add Team Member" style={{ maxWidth: 384 }} returnFocusRef={addMemberTriggerRef}>
        <SharedSelect label="Person" name="person" showLabel wrapperClassName="mb-4" style={{ width: "100%" }}
          value={addName} onValueChange={setAddName} placeholder="Select person…"
          options={available.map(a => ({ value: a.agent_name, label: a.agent_name }))} />
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="text" onClick={() => setAdding(false)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={addMember}>Add</Button>
        </div>
      </Dialog>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  CYCLES TAB
// ════════════════════════════════════════════════════════════════════════════════

const EMPTY_CYCLE_FORM = { name: "", description: "", start_date: "", end_date: "" };

export function CyclesTab({ projectId }: { projectId: string }) {
  const newCycleTriggerRef = useRef<HTMLButtonElement>(null);
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
    if (saving) return;
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
      return true;
    } catch { toast.error("Failed to delete cycle"); return false; }
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
  function cycleStatus(c: Cycle): { label: string; tone: Tone } {
    const now = Date.now(), start = new Date(c.start_date).getTime(), end = new Date(c.end_date).getTime();
    if (now < start) return { label: "Upcoming", tone: "neutral" };
    if (now > end)   return { label: "Completed", tone: "done" };
    return { label: "Active", tone: "progress" };
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderColor: NC.borderFaint }}>
        <Text as="span" variant="small" tone="muted">{cycles.length} cycle{cycles.length !== 1 ? "s" : ""}</Text>
        <Button ref={newCycleTriggerRef} onClick={() => { setForm(EMPTY_CYCLE_FORM); setCreating(true); }}><Plus size={13} /> New cycle</Button>
      </div>
      <ScrollArea className="flex-1 min-h-0" viewportLabel="Project cycles"><div className="p-5 space-y-3">
        {loading ? <EmptyState icon={<Spinner />} text="Loading cycles…" /> :
         cycles.length === 0 ? <EmptyState icon={<Calendar size={36} />} text="No cycles yet" secondaryText="Cycles group tasks by time window (e.g. sprints)" /> :
         cycles.map(c => {
           const status = cycleStatus(c);
           return (
             <ContextMenu key={c.id}>
               <ContextMenuTrigger asChild>
                 <Card variant="flat" className="p-4 cursor-default">
                   <div className="flex items-center gap-2 mb-2">
                     <Heading as="h3" size="title">{c.name}</Heading>
                     <Badge tone={status.tone}>{status.label}</Badge>
                   </div>
                   {c.description && <Text as="p" tone="muted" className=" mb-2">{c.description}</Text>}
                   <div className="flex items-center gap-5">
                     <Text variant="small" tone="muted" className="flex items-center gap-1"><Calendar size={11} />{fmtDate(c.start_date)} <ArrowRight size={11} /> {fmtDate(c.end_date)}</Text>
                     <Text variant="small" tone="muted" className="flex items-center gap-1"><Hash size={11} />{counts[c.id] ?? 0} tasks</Text>
                   </div>
                 </Card>
               </ContextMenuTrigger>
               <ContextMenuContent>
                 <ContextMenuItem onClick={() => setEditCycle({ ...c })}><Edit2 size={13} /> Edit</ContextMenuItem>
                 <ContextMenuItem onClick={() => duplicate(c)}><Copy size={13} /> Duplicate</ContextMenuItem>
                 <ContextMenuSeparator />
                 <ContextMenuItem onClick={() => setDeleteCycle(c)}><Archive size={13} /> Archive</ContextMenuItem>
               </ContextMenuContent>
             </ContextMenu>
           );
         })}
      </div></ScrollArea>

      <Dialog open={creating} onOpenChange={setCreating} title="New Cycle" style={{ maxWidth: 384 }} returnFocusRef={newCycleTriggerRef}>
        <Input label="Name" name="name" wrapperClassName="mb-4 min-w-0" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Sprint 1" autoFocus />
        <TextArea label="Description" name="description" wrapperClassName="mb-4 min-w-0" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional — what is this for?" rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" name="start_date" wrapperClassName="mb-4 min-w-0" type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
          <Input label="End Date" name="end_date" wrapperClassName="mb-4 min-w-0" type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
        </div>
        <div className="flex gap-2 justify-end pt-1"><Button variant="text" onClick={() => setCreating(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={create}>Create</Button></div>
      </Dialog>

      {editCycle && (
        <Dialog open={!!editCycle} onOpenChange={open => { if (!open) setEditCycle(null); }} title="Edit Cycle" style={{ maxWidth: 384 }}>
          <Input label="Name" name="name" wrapperClassName="mb-4 min-w-0" value={editCycle.name} onChange={e => setEditCycle(p => p ? { ...p, name: e.target.value } : p)} />
          <TextArea label="Description" name="description" wrapperClassName="mb-4 min-w-0" value={editCycle.description ?? ""} onChange={e => setEditCycle(p => p ? { ...p, description: e.target.value } : p)} placeholder="Optional — what is this for?" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" name="start_date" wrapperClassName="mb-4 min-w-0" type="date" value={editCycle.start_date} onChange={e => setEditCycle(p => p ? { ...p, start_date: e.target.value } : p)} />
            <Input label="End Date" name="end_date" wrapperClassName="mb-4 min-w-0" type="date" value={editCycle.end_date} onChange={e => setEditCycle(p => p ? { ...p, end_date: e.target.value } : p)} />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="text" onClick={() => setEditCycle(null)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={async () => {
              if (saving) return;
              setSaving(true);
              try { await api(`/projects/${projectId}/cycles/${editCycle.id}`, { method: "PATCH", body: JSON.stringify(editCycle) }); setCycles(p => p.map(c => c.id === editCycle.id ? editCycle : c)); setEditCycle(null); toast.success("Updated"); }
              catch { toast.error("Failed to update"); } finally { setSaving(false); }
            }}>Save</Button>
          </div>
        </Dialog>
      )}
      <ConfirmDelete open={!!deleteCycle} onClose={() => setDeleteCycle(null)} onConfirm={() => deleteCycle ? remove(deleteCycle) : Promise.resolve(false)} label="cycle" />
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
    <Drawer open={open} onOpenChange={next => { if (!next) onClose(); }} title="Cycles">
      {projects.length === 0 ? (
        <EmptyState icon={<Calendar size={36} />} text="Create a project first" />
      ) : (
        <>
          <div className="mb-5 -mt-1">
            <SharedSelect label="Project"
              value={projectId ?? ""}
              onValueChange={v => setProjectId(v || null)}
              placeholder="Select project…"
              options={projects.map(p => ({ value: p.id, label: p.name }))}
            />
          </div>
          {projectId ? (
            <CyclesTab projectId={projectId} />
          ) : (
            <EmptyState icon={<Calendar size={32} />} text="Select a project to see its cycles" />
          )}
        </>
      )}
    </Drawer>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  PROJECT VIEW
// ════════════════════════════════════════════════════════════════════════════════

// Lifecycle values remain application-owned; shared status controls own presentation.
const STATUS_TONE: Record<ProjectStatus, Tone> = {
  planned: "neutral", "in-progress": "progress", paused: "atmospheric",
  completed: "done", closed: "neutral", archived: "structural",
};

export function StatusPill({ status, onChange, disabled }: { status: ProjectStatus | undefined; onChange: (s: ProjectStatus) => Promise<void> | void; disabled?: boolean }) {
  const [saving, setSaving] = useState(false);
  const safeStatus: ProjectStatus = status && status in PROJECT_STATUS_CFG ? status : "planned";
  if (disabled) return <Badge tone={STATUS_TONE[safeStatus]}>{PROJECT_STATUS_CFG[safeStatus].label}</Badge>;
  return <StatusSelect
    value={safeStatus}
    disabled={saving}
    options={Object.entries(PROJECT_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label, tone: STATUS_TONE[value as ProjectStatus] }))}
    onValueChange={async value => {
      if (saving) return;
      setSaving(true);
      try { await onChange(value as ProjectStatus); }
      catch { /* The application reports failed saves; keep the persisted selection. */ }
      finally { setSaving(false); }
    }}
  />;
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
    } catch {
      // The parent reports the failure; retain this draft for retry.
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
        <Input label="Name" name="name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <TextArea label="Description" name="description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows={8} />
        <Input label="Folder Path" name="folder_path" leadingIcon={<Folder size={13} />} value={form.folder_path} onChange={e => setForm(p => ({ ...p, folder_path: e.target.value }))} placeholder="/path/to/project" />
        <div className="flex flex-col gap-1.5">
          <span>Status</span>
          <SharedSelect label="Status" name="status" value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as ProjectStatus }))} options={Object.entries(PROJECT_STATUS_CFG).map(([v, c]) => ({ value: v, label: c.label }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span>Owner</span>
          <SharedSelect label="Owner" name="owner" value={form.owner || "__none__"} onValueChange={v => setForm(p => ({ ...p, owner: v === "__none__" ? "" : v }))} options={ownerItems} />
        </div>
      </div>

      {/* Team preview — read-only union of ProjectMember table + distinct task assignees */}
      <div className="pt-4" style={{ borderColor: NC.borderFaint }}>
        <div className="flex items-center justify-between mb-3">
          <Text as="p" variant="label" tone="muted" className="   ">Team ({teamUnion.length})</Text>
          <Button variant="text" onClick={() => onSwitchTab("team")}>Manage in Team tab <ArrowRight size={13} /></Button>
        </div>
        {teamUnion.length === 0 ? (
          <Text as="p" tone="dim">No members yet</Text>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teamUnion.map(name => {
              const isRolledUp = !memberNames.has(name);
              return (
                <Tooltip key={name} label={isRolledUp ? "Auto-rolled up from task assignee" : "Team member"}>
                  <span className="inline-flex items-center gap-2">
                    <PersonChip name={name} />
                    {isRolledUp && <Badge>via task</Badge>}
                  </span>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="pt-4 space-y-1.5" style={{ borderColor: NC.borderFaint }}>
        <div className="flex items-center gap-2">
          <Text variant="label" tone="muted" className="w-20">Created</Text>
          <Text variant="mono">{new Date(project.created_at).toLocaleString()}</Text>
        </div>
        {project.client && (
          <div className="flex items-center gap-2">
            <Text variant="label" tone="muted" className="w-20">Client</Text>
            <Text>{project.client}</Text>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4">
        <Button variant="primary" loading={saving} disabled={!dirty || !form.name.trim()} onClick={handleSave}>Save changes</Button>
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
  const [linkSaving, setLinkSaving] = useState(false);
  const [docSaving, setDocSaving] = useState(false);
  const projectLinkRef = useRef<HTMLButtonElement>(null);
  const moduleLinkRef = useRef<HTMLButtonElement>(null);
  const itemLinkRef = useRef<HTMLButtonElement>(null);

  async function changeLink(action: () => Promise<boolean>, close?: () => void) {
    if (linkSaving) return;
    setLinkSaving(true);
    try { if (await action()) close?.(); }
    finally { setLinkSaving(false); }
  }

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
    try { await api(`/initiatives/${initiative.id}/links`, { method: "POST", body: JSON.stringify({ initiative_id: initiative.id, project_ids: [pid], module_ids: [], work_item_ids: [] }) }); setLinks(p => ({ ...p, project_ids: [...p.project_ids, pid] })); toast.success("Project linked"); return true; }
    catch { toast.error("Failed"); return false; }
  }
  async function unlinkProject(pid: string) {
    try { await api(`/initiatives/${initiative.id}/links/project/${pid}`, { method: "DELETE" }); setLinks(p => ({ ...p, project_ids: p.project_ids.filter(x => x !== pid) })); toast.success("Unlinked"); return true; }
    catch { toast.error("Failed"); return false; }
  }
  async function linkItem(wiId: string) {
    try { await api(`/initiatives/${initiative.id}/links`, { method: "POST", body: JSON.stringify({ initiative_id: initiative.id, project_ids: [], module_ids: [], work_item_ids: [wiId] }) }); setLinks(p => ({ ...p, work_item_ids: [...p.work_item_ids, wiId] })); toast.success("Task linked"); return true; }
    catch { toast.error("Failed"); return false; }
  }
  async function unlinkItem(wiId: string) {
    try { await api(`/initiatives/${initiative.id}/links/work_item/${wiId}`, { method: "DELETE" }); setLinks(p => ({ ...p, work_item_ids: p.work_item_ids.filter(x => x !== wiId) })); toast.success("Unlinked"); return true; }
    catch { toast.error("Failed"); return false; }
  }
  async function linkMod(modId: string) {
    try { await api(`/initiatives/${initiative.id}/links`, { method: "POST", body: JSON.stringify({ initiative_id: initiative.id, project_ids: [], module_ids: [modId], work_item_ids: [] }) }); setLinks(p => ({ ...p, module_ids: [...p.module_ids, modId] })); toast.success("Module linked"); return true; }
    catch { toast.error("Failed"); return false; }
  }
  async function unlinkMod(modId: string) {
    try { await api(`/initiatives/${initiative.id}/links/module/${modId}`, { method: "DELETE" }); setLinks(p => ({ ...p, module_ids: p.module_ids.filter(x => x !== modId) })); toast.success("Unlinked"); return true; }
    catch { toast.error("Failed"); return false; }
  }

  async function addDocPath() {
    if (!newDocPath.trim() || docSaving) return;
    setDocSaving(true);
    try {
      await onUpdateInit(initiative.id, { doc_paths: [...initiative.doc_paths, newDocPath.trim()] });
      setNewDocPath("");
    } catch { /* Parent reports the failure; keep the draft. */ }
    finally { setDocSaving(false); }
  }
  async function removeDocPath(path: string) {
    if (docSaving) return;
    setDocSaving(true);
    try { await onUpdateInit(initiative.id, { doc_paths: initiative.doc_paths.filter(p => p !== path) }); }
    catch { /* Parent reports the failure. */ }
    finally { setDocSaving(false); }
  }

  const linkedProjects   = allProjects.filter(p => links.project_ids.includes(p.id));
  const unlinkedProjects = allProjects.filter(p => !links.project_ids.includes(p.id));
  const linkedItems      = allItems.filter(i => links.work_item_ids.includes(i.id));
  const unlinkedItems    = allItems.filter(i => !links.work_item_ids.includes(i.id));
  const linkedMods       = allMods.filter(m => links.module_ids.includes(m.id));
  const unlinkedMods     = allMods.filter(m => !links.module_ids.includes(m.id));
  const divider = <Separator className="my-4" />;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-7 pt-6 pb-5 flex-shrink-0" style={{ borderColor: NC.borderFaint }}>
        <Text as="p" variant="label" className="    mb-1">Initiative</Text>
        <div className="flex items-center gap-3 flex-wrap">
          <Heading as="h1" size="page">{initiative.title}</Heading>
          <StatusPill status={initiative.state} onChange={s => onUpdateInit(initiative.id, { state: s })} />
        </div>
        {initiative.external_id && <Text as="p" variant="small" tone="muted" className=" mt-1">ID: {initiative.external_id}</Text>}
        {initiative.description && <Text as="p" tone="muted" className=" mt-2 max-w-2xl">{initiative.description}</Text>}
      </div>
      <Separator />

      <ScrollArea className="flex-1 min-h-0" viewportLabel="Initiative details"><div className="p-7 space-y-8">
        {loading ? <EmptyState icon={<Spinner />} text="Loading…" /> : (
          <>
            {/* Linked Projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Text as="p" variant="label" tone="muted" className="   ">Linked Projects ({links.project_ids.length})</Text>
                <Button ref={projectLinkRef} variant="tonal" aria-label="Link project" onClick={() => setLinkingProjects(true)}><Link2 size={12} /> Add</Button>
              </div>
              {linkedProjects.length === 0 ? <Text as="p" tone="muted">None linked</Text> : (
                <div className="space-y-2">
                  {linkedProjects.map(p => (
                    <Card key={p.id} variant="flat" className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2"><FolderOpen size={13} style={{ color: NC.green }} /><Text as="span" variant="body" tone="default">{p.name}</Text></div>
                      <IconButton label={`Unlink ${p.name}`} icon={<Unlink size={12} />} disabled={linkSaving} onClick={() => changeLink(() => unlinkProject(p.id))} />
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {divider}

            {/* Linked Modules */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Text as="p" variant="label" tone="muted" className="   ">Linked Modules ({links.module_ids.length})</Text>
                <Button ref={moduleLinkRef} variant="tonal" aria-label="Link module" onClick={() => setPickMods(true)} disabled={allMods.length === 0}><Link2 size={12} /> Add</Button>
              </div>
              {linkedMods.length === 0 ? <Text as="p" tone="muted">{allMods.length === 0 ? "Link a project first" : "None linked"}</Text> : (
                <div className="space-y-2">
                  {linkedMods.map(m => (
                    <Card key={m.id} variant="flat" className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2"><Layers size={13} style={{ color: NC.green }} /><Text as="span" variant="body" tone="default">{m.name}</Text></div>
                      <IconButton label={`Unlink ${m.name}`} icon={<Unlink size={12} />} disabled={linkSaving} onClick={() => changeLink(() => unlinkMod(m.id))} />
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {divider}

            {/* Linked Work Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Text as="p" variant="label" tone="muted" className="   ">Linked Work Items ({links.work_item_ids.length})</Text>
                <Button ref={itemLinkRef} variant="tonal" aria-label="Link work item" onClick={() => setPickItems(true)} disabled={allItems.length === 0}><Link2 size={12} /> Add</Button>
              </div>
              {linkedItems.length === 0 ? <Text as="p" tone="muted">{allItems.length === 0 ? "Link a project first" : "None linked"}</Text> : (
                <div className="space-y-2">
                  {linkedItems.map(i => (
                    <Card key={i.id} variant="flat" className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0"><PriBadge priority={i.priority} /><Text as="span" variant="body" tone="default" className="truncate">{i.title}</Text><Badge tone={WORK_STATE_TONE[i.state]}>{STATE_CFG[i.state].label}</Badge></div>
                      <IconButton label={`Unlink ${i.title}`} icon={<Unlink size={12} />} disabled={linkSaving} onClick={() => changeLink(() => unlinkItem(i.id))} />
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {divider}

            {/* Relevant Files */}
            <div>
              <Text as="p" variant="label" tone="muted" className="    mb-3">Relevant Files ({initiative.doc_paths.length})</Text>
              {initiative.doc_paths.length > 0 && (
                <div className="space-y-0.5 mb-3">
                  {initiative.doc_paths.map((p, i) => (
                    <Card key={i} variant="flat" className="flex items-center gap-2 py-1.5 px-3">
                      <FileText size={11} style={{ color: NC.stone, flexShrink: 0 }} />
                      <Text as="span" variant="mono" tone="default" className="flex-1 truncate">{p}</Text>
                      <IconButton label={`Remove ${p}`} icon={<X size={11} />} disabled={docSaving} onClick={() => removeDocPath(p)} />
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input aria-label="Relevant file path" name="initiativeDocPath" wrapperClassName="flex-1 min-w-0" value={newDocPath} disabled={docSaving} onChange={e => setNewDocPath(e.target.value)} placeholder="/path/to/relevant/file.md" onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void addDocPath(); } }} />
                <IconButton variant="tonal" label="Add relevant file" icon={<Plus size={13} />} loading={docSaving} disabled={docSaving || !newDocPath.trim()} onClick={addDocPath} />
              </div>
            </div>
          </>
        )}
      </div></ScrollArea>

      {/* Pickers */}
      <Dialog open={linkingProjects} onOpenChange={next => { if (!next && !linkSaving) setLinkingProjects(false); }} title="Link Project" style={{ maxWidth: 384 }} returnFocusRef={projectLinkRef}>
        {unlinkedProjects.length === 0 ? <Text as="p" tone="muted" className=" py-2">All projects linked</Text> : (
          <ScrollArea className="max-h-64" viewportLabel="Link Project choices"><div className="space-y-1">
            {unlinkedProjects.map(p => <Row key={p.id} variant="list" disabled={linkSaving} leadingIcon={<FolderOpen size={13} />} onClick={() => changeLink(() => linkProject(p.id), () => setLinkingProjects(false))}>{p.name}</Row>)}
          </div></ScrollArea>
        )}
      </Dialog>
      <Dialog open={pickMods} onOpenChange={next => { if (!next && !linkSaving) setPickMods(false); }} title="Link Module" style={{ maxWidth: 384 }} returnFocusRef={moduleLinkRef}>
        {unlinkedMods.length === 0 ? <Text as="p" tone="muted" className=" py-2">All modules linked</Text> : (
          <ScrollArea className="max-h-64" viewportLabel="Link Module choices"><div className="space-y-1">
            {unlinkedMods.map(m => <Row key={m.id} variant="list" disabled={linkSaving} leadingIcon={<Layers size={13} />} onClick={() => changeLink(() => linkMod(m.id), () => setPickMods(false))}>{m.name}</Row>)}
          </div></ScrollArea>
        )}
      </Dialog>
      <Dialog open={pickItems} onOpenChange={next => { if (!next && !linkSaving) setPickItems(false); }} title="Link Work Item" returnFocusRef={itemLinkRef}>
        {unlinkedItems.length === 0 ? <Text as="p" tone="muted" className=" py-2">All items linked</Text> : (
          <ScrollArea className="max-h-72" viewportLabel="Link Work Item choices"><div className="space-y-1">
            {unlinkedItems.map(i => <Row key={i.id} variant="list" disabled={linkSaving} leadingIcon={<Badge tone={WORK_STATE_TONE[i.state]}>{STATE_CFG[i.state].label}</Badge>} onClick={() => changeLink(() => linkItem(i.id), () => setPickItems(false))}>{i.title}</Row>)}
          </div></ScrollArea>
        )}
      </Dialog>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════════════════════════

// Archived items view — opened from Settings menu at bottom of sidebar.
// Shows closed Projects (completed | closed | archived) + archived Initiatives.
// Sidebar hides CLOSED_PROJECT_STATUSES, so this view is where they stay reachable.
// Unarchive (resets status to 'planned') is rendered ONLY on status='archived' rows:
// resetting a 'completed' project to 'planned' would destroy the fact it ever completed.
// Open question for CTO: what affordance, if any, completed/closed rows should carry.
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
  const [restoring, setRestoring] = useState<string | null>(null);
  async function restore(key: string, action: () => Promise<void> | void) {
    if (restoring) return;
    setRestoring(key);
    try { await action(); }
    catch { /* Parent reports the failure; leave the entry available to retry. */ }
    finally { setRestoring(null); }
  }
  const closedProjects = projects.filter(p => CLOSED_PROJECT_STATUSES.includes(p.status));
  const archivedInits = initiatives.filter(i => i.state === "archived");

  return (
    <Dialog open={open} onOpenChange={next => { if (!next && !restoring) onClose(); }} title="Archived" style={{ maxWidth: 512 }}>
      <div className="space-y-6">
        <section>
          <Text as="p" variant="label" tone="muted" className="    mb-2">Projects ({closedProjects.length})</Text>
          {closedProjects.length === 0 ? (
            <Text as="p" tone="dim">No closed projects</Text>
          ) : (
            <div className="space-y-1.5">
              {closedProjects.map(p => (
                <Card key={p.id} variant="flat" className="flex items-center gap-2 py-2 px-3">
                  <FolderOpen size={13} style={{ color: NC.stone, flexShrink: 0 }} />
                  <Text as="span" variant="body" tone="default" className="flex-1 truncate">{p.name}</Text>
                  <Badge tone={STATUS_TONE[p.status]}>{PROJECT_STATUS_CFG[p.status].label}</Badge>
                  {p.status === "archived" && (
                    <Button variant="tonal" aria-label={`Unarchive ${p.name}`} disabled={!!restoring} loading={restoring === `project:${p.id}`} onClick={() => restore(`project:${p.id}`, () => onUnarchiveProject(p))}>
                      <ArchiveRestore size={11} /> Unarchive
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <Text as="p" variant="label" tone="muted" className="    mb-2">Initiatives ({archivedInits.length})</Text>
          {archivedInits.length === 0 ? (
            <Text as="p" tone="dim">No archived initiatives</Text>
          ) : (
            <div className="space-y-1.5">
              {archivedInits.map(i => (
                <Card key={i.id} variant="flat" className="flex items-center gap-2 py-2 px-3">
                  <Target size={13} style={{ color: NC.stone, flexShrink: 0 }} />
                  <Text as="span" variant="body" tone="default" className="flex-1 truncate">{i.title}</Text>
                  <Button variant="tonal" aria-label={`Unarchive ${i.title}`} disabled={!!restoring} loading={restoring === `initiative:${i.id}`} onClick={() => restore(`initiative:${i.id}`, () => onUnarchiveInitiative(i))}>
                    <ArchiveRestore size={11} /> Unarchive
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Text as="p" variant="small" tone="muted" className=" pt-3 leading-relaxed">
          Archived cycles, modules, and tasks stay scoped to their project — reopen the project and use the state filter to access them.
        </Text>
      </div>
    </Dialog>
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
  const newProjectTriggerRef = useRef<HTMLButtonElement>(null);
  const newInitiativeTriggerRef = useRef<HTMLButtonElement>(null);
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



  function toggleProject(id: string) {
    setExpandedProjects(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  useCmdEnter(async () => { if (creatingProject) await createProject(); }, creatingProject);
  useCmdEnter(async () => { if (creatingInit) await createInit(); }, creatingInit);

  async function createProject() {
    if (saving) return;
    if (!pForm.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const p = await api<Project>("/projects", { method: "POST", body: JSON.stringify(pForm) });
      onProjectsChange([...projects, p]);
      setCreatingProject(false); setPForm({ name: "", description: "", folder_path: "" });
      toast.success("Project created");
      onSelect({ type: "project", item: p });
    } catch (error) { toast.error(`Failed to create project: ${error instanceof Error ? error.message.slice(0, 160) : "Please try again"}`); }
    finally { setSaving(false); }
  }

  async function deleteProjectFn(p: Project) {
    try {
      await api(`/projects/${p.id}`, { method: "DELETE" });
      // Soft-archive: keep in state so Archived view surfaces it; sidebar filter hides status='archived' from active list.
      onProjectsChange(projects.map(x => x.id === p.id ? { ...x, status: "archived" as const } : x));
      if (selection?.type === "project" && selection.item.id === p.id) onSelect(null);
      toast.success("Project archived");
      return true;
    } catch { toast.error("Failed to archive project"); return false; }
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
    if (saving) return;
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
    if (saving) return;
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
      return true;
    } catch { toast.error("Failed to archive initiative"); return false; }
  }

  return (
    <Surface as="aside" layer="chrome" id="workspace-sidebar" data-surface="chrome" className="relative flex-shrink-0 flex flex-col border-r overflow-hidden" style={{ width: sidebarWidth, borderColor: NC.borderFaint }}>
      <div className="px-4 pt-2 pb-1 flex-shrink-0 flex items-center justify-center" style={{ borderColor: NC.borderFaint }}>
        <img
          src={wordmarkUrl}
          alt="Nova Caelum"
          style={{ height: 72, width: "auto", display: "block", opacity: 1 }}
        />
      </div>

      <ScrollArea viewportLabel="Workspace navigation" className="flex-1 min-h-0">
        <div className="py-2">
        {/* Search bar */}
        <div className="px-3 pt-2 pb-1">
          <Input aria-label="Search projects and initiatives" variant="search" name="sidebarSearch" leadingIcon={<Search size={13} />}
            placeholder="Search projects & initiatives…" value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)} />
        </div>

        {/* Projects */}
        <div className="mt-2">
          <div className="flex items-center justify-between px-2">
            <Row variant="sidebar" size="sm" className="flex-1 min-w-0" aria-expanded={!projectsCollapsed}
              leadingIcon={projectsCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
              onClick={() => setProjectsCollapsed(c => !c)}>Projects</Row>
            <IconButton ref={newProjectTriggerRef} label="New project" variant="text" icon={<Plus size={13} />}
              onClick={(e) => { e.stopPropagation(); setPForm({ name: "", description: "", folder_path: "" }); setCreatingProject(true); }}
            />
          </div>
          {!projectsCollapsed && (
            <>
          {projects.filter(p => !CLOSED_PROJECT_STATUSES.includes(p.status) && (!sidebarSearch || p.name.toLowerCase().includes(sidebarSearch.toLowerCase()))).map(p => {
            const isActive   = selection?.type === "project" && selection.item.id === p.id;
            const isExpanded = expandedProjects.has(p.id);
            return (
              <div key={p.id}>
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div className="flex items-center">
                      <IconButton variant="text" label={`${isExpanded ? "Collapse" : "Expand"} ${p.name}`}
                        aria-expanded={isExpanded} onClick={() => toggleProject(p.id)}
                        icon={isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />} />
                      <Row variant="sidebar" className="flex-1 min-w-0" selected={isActive}
                        leadingIcon={<FolderOpen size={13} className="shrink-0" />}
                        onClick={() => onSelect({ type: "project", item: p })}>
                        <span className="block truncate">{p.name}</span>
                      </Row>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => { onSelect({ type: "project", item: p }); onPendingProjectTab("info"); }}><Edit2 size={13} /> Edit</ContextMenuItem>
                    <ContextMenuItem onClick={() => duplicateProject(p)}><Copy size={13} /> Duplicate</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setDeleteProject(p)}><Archive size={13} /> Archive</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                {isExpanded && <ProjectNavTree project={p} onSelectTask={taskId => { onSelect({ type: "project", item: p }); onPendingTask(taskId); }} />}
              </div>
            );
          })}
          {projects.length === 0 && <Text as="p" variant="small" tone="dim" className="px-3 py-1.5 ">No projects</Text>}
            </>
          )}
        </div>

        {/* Initiatives */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-2">
            <Row variant="sidebar" size="sm" className="flex-1 min-w-0" aria-expanded={!initiativesCollapsed}
              leadingIcon={initiativesCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
              onClick={() => setInitiativesCollapsed(c => !c)}>Initiatives</Row>
            <IconButton ref={newInitiativeTriggerRef} label="New initiative" variant="text" icon={<Plus size={13} />}
              onClick={(e) => { e.stopPropagation(); setIForm({ title: "", description: "", external_id: "", state: "planned" }); setCreatingInit(true); }}
            />
          </div>
          {!initiativesCollapsed && (
            <>
          {initiatives.filter(i => i.state !== "archived" && (!sidebarSearch || i.title.toLowerCase().includes(sidebarSearch.toLowerCase()))).map(init => {
            const cfg      = INIT_STATE_CFG[init.state];
            const isActive = selection?.type === "initiative" && selection.item.id === init.id;
            return (
              <ContextMenu key={init.id}>
                <ContextMenuTrigger asChild>
                  <Row variant="sidebar" selected={isActive} onClick={() => onSelect({ type: "initiative", item: init })} leadingIcon={<Badge variant="dot" tone={STATUS_TONE[init.state]} aria-hidden="true" />}><span className="truncate">{init.title}</span></Row>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => setEditInit({ ...init })}><Edit2 size={13} /> Edit</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => setDeleteInit(init)}><Archive size={13} /> Archive</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
          {initiatives.length === 0 && <Text as="p" variant="small" tone="dim" className="px-3 py-1.5 ">No initiatives</Text>}
            </>
          )}
        </div>
        </div>
      </ScrollArea>

      {/* Bottom-left settings footer */}
      <Separator />
      <div className="flex-shrink-0 px-2 py-2">
        <ActionMenuRoot>
          <ActionMenuTrigger asChild>
            <Row variant="sidebar" leadingIcon={<Settings size={13} />}>Settings</Row>
          </ActionMenuTrigger>
          <ActionMenuContent side="top" align="start" sideOffset={6}>
            <ActionMenuItem onSelect={() => setShowArchived(true)}><Archive size={13} /> Archived</ActionMenuItem>
          </ActionMenuContent>
        </ActionMenuRoot>
      </div>

      <ResizeHandle label="Sidebar width" aria-controls="workspace-sidebar" value={sidebarWidth} min={200} max={480} onValueChange={setSidebarWidth} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 4, zIndex: 10 }} />

      <ArchivedModal
        open={showArchived}
        onClose={() => setShowArchived(false)}
        projects={projects}
        initiatives={initiatives}
        onUnarchiveProject={async (p) => { await onSaveProject(p.id, { status: "planned" }); }}
        onUnarchiveInitiative={async (i) => { await onUpdateInitiative(i.id, { state: "planned" }); }}
      />

      {/* Modals */}
      <Dialog open={creatingProject} onOpenChange={setCreatingProject} title="New Project" style={{ maxWidth: 384 }} returnFocusRef={newProjectTriggerRef}>
        <Input label="Name" name="name" wrapperClassName="mb-4" value={pForm.name} onChange={e => setPForm(p => ({ ...p, name: e.target.value }))} placeholder="Project name" autoFocus onKeyDown={e => e.key === "Enter" && createProject()} />
        <TextArea label="Description" name="description" wrapperClassName="mb-4" value={pForm.description} onChange={e => setPForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
        <Input label="Folder Path" name="folder_path" wrapperClassName="mb-4" leadingIcon={<Folder size={13} />} value={pForm.folder_path} onChange={e => setPForm(p => ({ ...p, folder_path: e.target.value }))} placeholder="/path/to/project" />
        <div className="flex gap-2 justify-end pt-1"><Button variant="text" onClick={() => setCreatingProject(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={createProject}>Create</Button></div>
      </Dialog>

      <Dialog open={creatingInit} onOpenChange={setCreatingInit} title="New Initiative" style={{ maxWidth: 384 }} returnFocusRef={newInitiativeTriggerRef}>
        <Input label="Title" name="title" wrapperClassName="mb-4" value={iForm.title} onChange={e => setIForm(p => ({ ...p, title: e.target.value }))} placeholder="Initiative title" autoFocus />
        <TextArea label="Description" name="description" wrapperClassName="mb-4" value={iForm.description} onChange={e => setIForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional — what is this for?" rows={3} />
        <Input label="External ID" name="external_id" wrapperClassName="mb-4" value={iForm.external_id} onChange={e => setIForm(p => ({ ...p, external_id: e.target.value }))} placeholder="e.g. INIT-001" />
        <SharedSelect label="State" name="state" showLabel wrapperClassName="mb-4" style={{ width: "100%" }} value={iForm.state} onValueChange={v => setIForm(p => ({ ...p, state: v as Initiative["state"] }))} options={Object.entries(INIT_STATE_CFG).map(([value, c]) => ({ value, label: c.label }))} />
        <div className="flex gap-2 justify-end pt-1"><Button variant="text" onClick={() => setCreatingInit(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={createInit}>Create</Button></div>
      </Dialog>

      {editInit && (
        <Dialog open={!!editInit} onOpenChange={open => { if (!open) setEditInit(null); }} title="Edit Initiative" style={{ maxWidth: 384 }}>
          <Input label="Title" name="title" wrapperClassName="mb-4" value={editInit.title} onChange={e => setEditInit(p => p ? { ...p, title: e.target.value } : p)} />
          <TextArea label="Description" name="description" wrapperClassName="mb-4" value={editInit.description ?? ""} onChange={e => setEditInit(p => p ? { ...p, description: e.target.value } : p)} placeholder="Optional — what is this for?" rows={3} />
          <Input label="External ID" name="external_id" wrapperClassName="mb-4" value={editInit.external_id} onChange={e => setEditInit(p => p ? { ...p, external_id: e.target.value } : p)} />
          <SharedSelect label="State" name="state" showLabel wrapperClassName="mb-4" style={{ width: "100%" }} value={editInit.state} onValueChange={v => setEditInit(p => p ? { ...p, state: v as Initiative["state"] } : p)} options={Object.entries(INIT_STATE_CFG).map(([value, c]) => ({ value, label: c.label }))} />
          <div className="flex gap-2 justify-end pt-1"><Button variant="text" onClick={() => setEditInit(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={() => saveInit(editInit.id, editInit)}>Save</Button></div>
        </Dialog>
      )}

      <ConfirmDelete open={!!deleteProject} onClose={() => setDeleteProject(null)} onConfirm={() => deleteProject ? deleteProjectFn(deleteProject) : Promise.resolve(false)} label="project" />
      <ConfirmDelete open={!!deleteInit} onClose={() => setDeleteInit(null)} onConfirm={() => deleteInit ? deleteInitFn(deleteInit) : Promise.resolve(false)} label="initiative" />
    </Surface>
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
        <Heading size="page" style={{ marginBottom: 8 }}>Nova Caelum Ops</Heading>
        <Text as="p" tone="muted">Select a project or initiative from the sidebar</Text>
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
    } catch { toast.error("Failed to update initiative"); throw new Error("save failed"); }
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
    <CaelosProvider className="dark"><Surface data-surface="ground" className="h-screen flex overflow-hidden">
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
      <Surface as="main" layer="elevated" data-surface="elevated" className="flex-1 flex flex-col overflow-hidden">
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
      </Surface>
      <Toaster position="bottom-right" />
    </Surface></CaelosProvider>
  );
}
