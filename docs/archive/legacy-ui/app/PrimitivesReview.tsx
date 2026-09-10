// ═══════════════════════════════════════════════════════════════════════════════
//  PRIMITIVES REVIEW — Daniel's component-by-component review lab
// ───────────────────────────────────────────────────────────────────────────────
//  Toggle: append `?primitives=1` to the URL. main.tsx swaps App→PrimitivesReview
//  on that flag, same lazy-import pattern as ?lab=2 / ?lab=3.
//
//  Purpose: one long vertical stack, every primitive of every reviewed component
//  rendered at real size in its states, so Daniel can scroll and judge each one
//  in isolation. Inputs now use Daniel's locked live versions; the other
//  component families remain comparison specimens. Where the live app (App.tsx) has its own bespoke version of
//  something the primitives library (src/primitives/) also provides, both are
//  rendered side by side labelled LIVE APP and PRIMITIVE so drift is visible
//  at a glance.
//
//  Source-of-truth correction (2026-09-06, verified while building this page):
//  Foundry.tsx DOES import and render <PrimitiveGallery showLegacyInputs={false} /> — under its
//  "Components" tab, reachable via ?foundry=1. The brief for this page said
//  "not routed anywhere / Foundry doesn't render it" — that's not quite right.
//  What IS true, and is the actual substance of Daniel's complaint: Foundry's
//  Components tab is a token-authoring dev overlay, not the task-graph app
//  surface he uses day to day. The live app (this file's "LIVE APP" columns)
//  renders with NcInput/NcSelect/PrimaryBtn/etc — its own bespoke components —
//  never the primitives from src/primitives/. That gap is what this page makes
//  visible. See the session report for the full correction.
//
//  Labelling key used throughout:
//    LIVE APP      — the component as actually rendered by App.tsx today
//    PRIMITIVE     — the canonical component from src/primitives/
//    STATIC COPY   — markup copied from a live component that can't be shown
//                    in place without its runtime context (portal, fixed
//                    overlay, DnD backend) — see individual band notes
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  AlertTriangle,
  Archive,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  Edit2,
  FileText,
  Folder,
  FolderInput,
  GripVertical,
  Layers,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  Button,
  Card,
  Chip,
  Row,
  type ButtonVariant,
  type CardVariant,
  type ChipTone,
  type ChipVariant,
  type RowVariant,
} from "../primitives";
import {
  EditableTitleInline,
  EmptyState,
  Field,
  ModuleSection,
  NcInput,
  NcSelect,
  NcTextarea,
  PriBadge,
  PrimaryBtn,
  SectionLabel,
  Spinner,
  StateBadge,
  StatusPill,
  TaskRow,
  TextBtn,
  TonalBtn,
  type Mod,
  type ProjectStatus,
  type WorkItem,
  type WorkItemPriority,
  type WorkItemState,
} from "./App";
import PrimitiveGallery from "./PrimitiveGallery";
import ChatComposerPreview from "./ChatComposer";
import { NC } from "../design/tokens";

// ── Shared typography / chrome (tokens only — no new hex, no new fonts) ────────

const FONT_SANS = "'IBM Plex Sans', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, monospace";

const pageHeadingStyle: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: 30,
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: NC.cream,
  margin: 0,
};

const bandTitleStyle: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: 19,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  color: NC.cream,
  margin: 0,
};

// Coordinate label — quieter than content (refactoring-ui audit item a).
const sourceTagTextStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 11,
  color: NC.textDim,
  letterSpacing: "0.01em",
};

const kindTagStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "1px 6px",
  borderRadius: 4,
  border: `1px solid ${NC.borderFaint}`,
  color: NC.textDim,
  whiteSpace: "nowrap",
};

const stateCaptionStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 10,
  color: NC.textFaint,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const flagStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 11,
  color: "#c9a84c",
  lineHeight: 1.5,
};

// ── Layout primitives (local to this page only) ────────────────────────────────

function Band({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      style={{
        padding: "var(--sys-space-8) 0",
        borderTop: `1px solid ${NC.borderFaint}`,
        display: "grid",
        gap: "var(--sys-space-6)",
      }}
    >
      <h2 style={bandTitleStyle}>{title}</h2>
      <div style={{ display: "grid", gap: "var(--sys-space-8)" }}>{children}</div>
    </section>
  );
}

function SpecHeader({ symbol, file, kind }: { symbol: string; file: string; kind: "LIVE APP" | "PRIMITIVE" | "STATIC COPY" | "LIVE APP · markup copied" | "LOCKED · LIVE APP" | "PREVIEW" }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "var(--sys-space-2)", flexWrap: "wrap", marginBottom: "var(--sys-space-3)" }}>
      <span style={kindTagStyle}>{kind}</span>
      <span style={sourceTagTextStyle}>{symbol} — {file}</span>
    </div>
  );
}

function Specimen({ symbol, file, kind, note, children }: {
  symbol: string;
  file: string;
  kind: "LIVE APP" | "PRIMITIVE" | "STATIC COPY" | "LIVE APP · markup copied" | "LOCKED · LIVE APP" | "PREVIEW";
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <SpecHeader symbol={symbol} file={file} kind={kind} />
      {children}
      {note ? <p style={{ ...stateCaptionStyle, textTransform: "none", marginTop: "var(--sys-space-2)", maxWidth: 60 + "ch" }}>{note}</p> : null}
    </div>
  );
}

// Side-by-side comparison shell — the drift-visibility requirement.
function Pairing({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--sys-space-6)" }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

// Rest/state/disabled (or rest/hover/disabled) column layout.
function StateRow({ labels, cells }: { labels: string[]; cells: React.ReactNode[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`, gap: "var(--sys-space-3)" }}>
      {cells.map((node, i) => (
        <div key={labels[i] ?? i} style={{ display: "grid", gap: "var(--sys-space-1)", minWidth: 0 }}>
          <span style={stateCaptionStyle}>{labels[i]}</span>
          <div>{node}</div>
        </div>
      ))}
    </div>
  );
}

function Flagged({ children }: { children: React.ReactNode }) {
  return <p style={flagStyle}>FLAGGED — {children}</p>;
}

// ── Fixture data — self-contained, no network, no store writes ─────────────────

const FIXTURE_PROJECT_ID = "fx-project";
const FIXTURE_MODULE_ID = "fx-module";

const INITIAL_TASK_NORMAL: WorkItem = {
  id: "fx-task-normal",
  project_id: FIXTURE_PROJECT_ID,
  module_id: null,
  parent_item_id: null,
  cycle_id: null,
  title: "Wire acceptance-criteria fields into the create-task modal",
  description: "Add the criteria + criteria-ref inputs to the quick-add form so new tasks carry a done-definition from creation.",
  acceptance_criteria: null,
  acceptance_criteria_ref: null,
  state: "in-progress",
  priority: "medium",
  assignee: "Designer",
  team: ["Design"],
  blocked_by: [],
  doc_paths: [],
  source_references: {},
};

const INITIAL_TASK_BLOCKED: WorkItem = {
  id: "fx-task-blocked",
  project_id: FIXTURE_PROJECT_ID,
  module_id: null,
  parent_item_id: null,
  cycle_id: null,
  title: "Ship the drawer's move-to-project action",
  description: "Blocked on the folder-picker component landing in the primitives library.",
  acceptance_criteria: null,
  acceptance_criteria_ref: null,
  state: "blocked",
  priority: "high",
  assignee: "Engineer",
  team: ["Engineering"],
  blocked_by: ["fx-task-normal"],
  doc_paths: [],
  source_references: {},
};

const INITIAL_TASK_DONE: WorkItem = {
  id: "fx-task-done",
  project_id: FIXTURE_PROJECT_ID,
  module_id: null,
  parent_item_id: null,
  cycle_id: null,
  title: "Rebuild the Breadcrumb primitive off nc-input DNA",
  description: "Replaced the glass chip breadcrumb with inline typography segments.",
  acceptance_criteria: null,
  acceptance_criteria_ref: null,
  state: "done",
  priority: "low",
  assignee: "Da Vinci",
  team: ["Design"],
  blocked_by: [],
  doc_paths: [],
  source_references: {},
};

const FIXTURE_MODULE: Mod = {
  id: FIXTURE_MODULE_ID,
  project_id: FIXTURE_PROJECT_ID,
  name: "Review-lab calibration module",
  folder_path: "/projects/review-lab/modules/calibration",
  description: "A small module specimen for validating ModuleSection hierarchy and progress readout.",
  state: "in-progress",
  team: ["Design", "Engineering"],
  parent_module_id: null,
  acceptance_criteria: null,
  acceptance_criteria_ref: null,
};

const INITIAL_MOD_TASK_A: WorkItem = {
  id: "fx-mod-task-a",
  project_id: FIXTURE_PROJECT_ID,
  module_id: FIXTURE_MODULE_ID,
  parent_item_id: null,
  cycle_id: null,
  title: "Audit every nc-glass-menu instance for text legibility",
  description: "Check the frosted-backdrop popover against dense body copy, not just short menu labels.",
  acceptance_criteria: null,
  acceptance_criteria_ref: null,
  state: "ready",
  priority: "medium",
  assignee: "Designer",
  team: ["Design"],
  blocked_by: [],
  doc_paths: [],
  source_references: {},
};

const INITIAL_MOD_TASK_B: WorkItem = {
  id: "fx-mod-task-b",
  project_id: FIXTURE_PROJECT_ID,
  module_id: FIXTURE_MODULE_ID,
  parent_item_id: null,
  cycle_id: null,
  title: "Confirm ModuleSection progress bar matches task completion count",
  description: "Two tasks in this module — progress should read 0/2 until one flips to done or deferred.",
  acceptance_criteria: null,
  acceptance_criteria_ref: null,
  state: "pending-review",
  priority: "none",
  assignee: "Engineer",
  team: ["Engineering"],
  blocked_by: [],
  doc_paths: [],
  source_references: {},
};

const DENSE_TEXT_BLOCK =
  "The Nova Task Graph is Nova Caelum's source-of-truth tracker for projects, initiatives, modules, cycles, " +
  "and work items. Every write goes through an upsert_* MCP tool, and every read-back is expected to reflect " +
  "the same shape the write contract accepted. Acceptance criteria are typed, not prose-only — a statement " +
  "paired with a verification kind (command_check, file_state, db_readback, http_readback, or manual) — so a " +
  "row can be judged done or not-done without a human re-deriving intent from a title. This paragraph exists " +
  "purely as ballast: dense, real-registered body copy, the kind a context menu might actually open on top of " +
  "in the live app, so the frosted glass behind a menu can be judged for legibility rather than judged floating " +
  "over an empty gray rectangle.";

// Row / Chip / Card demonstration arrays (mirrors PrimitiveGallery's own matrices).
const ROW_VARIANTS: RowVariant[] = ["tab", "sidebar", "list", "crumb"];
const CHIP_VARIANTS: ChipVariant[] = ["status", "category", "count"];
const CHIP_TONES: ChipTone[] = ["danger", "progress", "done", "ready", "atmospheric", "structural", "sage", "neutral"];
const CARD_VARIANTS: CardVariant[] = ["flat", "lifted", "glass"];
// PrimaryBtn/TonalBtn/TextBtn have no forcedState prop — their "hover" column is a live
// instance, not a forced state, so the label says so rather than implying otherwise.
const LIVE_BUTTON_STATE_LABELS = ["rest", "hover (interact live)", "disabled"];
const PRIMITIVE_BUTTON_STATE_LABELS = ["rest", "hover", "disabled"];

const WORK_ITEM_STATES: WorkItemState[] = ["pending-review", "ready", "in-progress", "blocked", "done", "deferred", "archived"];
const WORK_ITEM_PRIORITIES: WorkItemPriority[] = ["none", "low", "medium", "high", "urgent"];
const PROJECT_STATUSES: ProjectStatus[] = ["planned", "in-progress", "paused", "completed", "closed", "archived"];

const BANDS = [
  { id: "inputs", label: "Inputs" },
  { id: "chatbar", label: "Chatbar" },
  { id: "selects-pills", label: "Selects & pills" },
  { id: "buttons", label: "Buttons" },
  { id: "rows-structure", label: "Rows & structure" },
  { id: "surfaces", label: "Surfaces" },
  { id: "foundry-crosscheck", label: "Foundry cross-check" },
];

// ═══════════════════════════════════════════════════════════════════════════════

export default function PrimitivesReview() {
  const [demoStatus, setDemoStatus] = useState<ProjectStatus>("in-progress");
  const [taskNormal, setTaskNormal] = useState(INITIAL_TASK_NORMAL);
  const [taskBlocked, setTaskBlocked] = useState(INITIAL_TASK_BLOCKED);
  const [taskDone, setTaskDone] = useState(INITIAL_TASK_DONE);
  const [modTaskA, setModTaskA] = useState(INITIAL_MOD_TASK_A);
  const [modTaskB, setModTaskB] = useState(INITIAL_MOD_TASK_B);
  const [editableTitle, setEditableTitle] = useState("Double-click to rename this fixture");

  const taskRowFixtures = [taskNormal, taskBlocked, taskDone];
  const moduleTaskFixtures = [modTaskA, modTaskB];

  const setTaskState = (id: string, state: WorkItemState) => {
    if (id === taskNormal.id) setTaskNormal((t) => ({ ...t, state }));
    else if (id === taskBlocked.id) setTaskBlocked((t) => ({ ...t, state }));
    else if (id === taskDone.id) setTaskDone((t) => ({ ...t, state }));
  };
  const setModTaskState = (id: string, state: WorkItemState) => {
    if (id === modTaskA.id) setModTaskA((t) => ({ ...t, state }));
    else if (id === modTaskB.id) setModTaskB((t) => ({ ...t, state }));
  };

  const noop = () => {};

  return (
    <div
      data-surface="ground"
      className="dark"
      style={{ minHeight: "100vh", background: NC.ground, fontFamily: FONT_SANS, color: NC.cream }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px minmax(0, 1fr)",
          gap: "var(--sys-space-8)",
          maxWidth: 1360,
          margin: "0 auto",
          padding: "var(--sys-space-8) var(--sys-space-6)",
          alignItems: "start",
        }}
      >
        {/* ── Sticky mini-index — plain anchor list, no chrome ────────────── */}
        <nav aria-label="Band index" style={{ position: "sticky", top: "var(--sys-space-6)", display: "grid", gap: "var(--sys-space-2)" }}>
          <span style={{ ...stateCaptionStyle, marginBottom: "var(--sys-space-2)" }}>Jump to</span>
          {BANDS.map((b) => (
            <a
              key={b.id}
              href={`#${b.id}`}
              style={{ fontFamily: FONT_SANS, fontSize: 13, color: NC.stone, textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = NC.cream; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = NC.stone; }}
            >
              {b.label}
            </a>
          ))}
        </nav>

        <main style={{ minWidth: 0 }}>
          <header style={{ display: "grid", gap: "var(--sys-space-2)", paddingBottom: "var(--sys-space-6)" }}>
            <span style={stateCaptionStyle}>Primitives review lab · framework pass, not a redesign</span>
            <h1 style={pageHeadingStyle}>Every primitive, every state, one scroll</h1>
            <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: NC.stone, maxWidth: "70ch", margin: 0 }}>
              Inputs are locked to the live app versions. Try the chatbar below with the same input material.
              Other component families remain side by side for review.
            </p>
          </header>

          <DndProvider backend={HTML5Backend}>
            {/* ══════════════════════════ INPUTS ══════════════════════════ */}
            <Band id="inputs" title="Inputs">
                  <Specimen symbol="NcInput" file="App.tsx" kind="LOCKED · LIVE APP">
                    <StateRow
                      labels={["rest", "focus (click to preview)", "disabled"]}
                      cells={[
                        <NcInput key="rest" placeholder="Task title…" />,
                        <NcInput key="focus" placeholder="Task title…" />,
                        <NcInput key="disabled" placeholder="Task title…" disabled />,
                      ]}
                    />
                  </Specimen>

                  <Specimen
                    symbol=".nc-search bar"
                    file="App.tsx (TasksPane toolbar, markup copied)"
                    kind="LOCKED · LIVE APP"
                    note="Not an exported symbol — this reproduces the exact markup at App.tsx:2833–2836 (icon + input.nc-search) since the toolbar itself isn't a standalone component."
                  >
                    <StateRow
                      labels={["rest", "focus (click to preview)", "disabled"]}
                      cells={[
                        <div key="rest" style={{ position: "relative" }}>
                          <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: NC.stone }} />
                          <input className="nc-search w-full pl-9 pr-3 py-2 text-sm" placeholder="Search tasks…" />
                        </div>,
                        <div key="focus" style={{ position: "relative" }}>
                          <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: NC.stone }} />
                          <input className="nc-search w-full pl-9 pr-3 py-2 text-sm" placeholder="Search tasks…" />
                        </div>,
                        <div key="disabled" style={{ position: "relative" }}>
                          <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: NC.stone }} />
                          <input className="nc-search w-full pl-9 pr-3 py-2 text-sm" placeholder="Search tasks…" disabled />
                        </div>,
                      ]}
                    />
                  </Specimen>

              <Specimen
                symbol="NcTextarea"
                file="App.tsx"
                kind="LOCKED · LIVE APP"
                note="Locked live large input. Drag the lower-right corner to resize vertically; each field keeps its useful starting height."
              >
                <StateRow
                  labels={["rest", "focus (click to preview)", "disabled"]}
                  cells={[
                    <NcTextarea key="rest" placeholder="Done when… e.g. `npm run build` exits 0." rows={3} />,
                    <NcTextarea key="focus" placeholder="Done when… e.g. `npm run build` exits 0." rows={3} />,
                    <NcTextarea key="disabled" placeholder="Done when… e.g. `npm run build` exits 0." rows={3} disabled />,
                  ]}
                />
              </Specimen>
            </Band>

            <Band id="chatbar" title="Chatbar">
              <Specimen symbol="ChatComposer" file="ChatComposer.tsx" kind="PREVIEW"
                note="Locked live input fill and focus glow. Pill at one line; 28px corners after wrapping, with the recovered inset adjustment. Send is local to this preview.">
                <ChatComposerPreview />
              </Specimen>
            </Band>

            {/* ═══════════════════════ SELECTS & PILLS ═══════════════════════ */}
            <Band id="selects-pills" title="Selects & pills">
              <Specimen
                symbol="NcSelect"
                file="App.tsx"
                kind="LIVE APP"
                note="NcSelect destructures its own prop list and does not forward defaultOpen/open to the underlying Radix Select.Root — an open state can't be forced without widening its props. See FLAGGED list."
              >
                <StateRow
                  labels={["closed, value set", "closed, disabled"]}
                  cells={[
                    <NcSelect
                      key="set"
                      value="ready"
                      onValueChange={noop}
                      items={[
                        { value: "ready", label: "Ready" },
                        { value: "in-progress", label: "In progress" },
                        { value: "done", label: "Done" },
                      ]}
                    />,
                    <NcSelect
                      key="disabled"
                      value="ready"
                      onValueChange={noop}
                      disabled
                      items={[{ value: "ready", label: "Ready" }]}
                    />,
                  ]}
                />
              </Specimen>

              <Specimen symbol="StatusPill" file="App.tsx" kind="LIVE APP" note="Project-status pill — interactive dropdown vs. disabled read-only chip.">
                <div style={{ display: "flex", gap: "var(--sys-space-3)", alignItems: "center", flexWrap: "wrap" }}>
                  <StatusPill status={demoStatus} onChange={setDemoStatus} />
                  <StatusPill status="completed" onChange={noop} disabled />
                  <StatusPill status="archived" onChange={noop} disabled />
                </div>
              </Specimen>

              <Specimen symbol="StateBadge" file="App.tsx" kind="LIVE APP" note="Every task_workflow_state value.">
                <div style={{ display: "flex", gap: "var(--sys-space-2)", flexWrap: "wrap" }}>
                  {WORK_ITEM_STATES.map((s) => <StateBadge key={s} state={s} />)}
                </div>
              </Specimen>

              <Specimen symbol="PriBadge" file="App.tsx" kind="LIVE APP" note="Every WorkItemPriority value.">
                <div style={{ display: "flex", gap: "var(--sys-space-4)", flexWrap: "wrap" }}>
                  {WORK_ITEM_PRIORITIES.map((p) => <PriBadge key={p} priority={p} />)}
                </div>
              </Specimen>

              <Specimen symbol="Chip" file="primitives/Chip.tsx" kind="PRIMITIVE" note="All tones × all variants.">
                <div style={{ display: "grid", gap: "var(--sys-space-3)" }}>
                  {CHIP_VARIANTS.map((variant) => (
                    <div key={variant} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "var(--sys-space-3)", alignItems: "center" }}>
                      <code style={{ ...stateCaptionStyle, textTransform: "none" }}>{variant}</code>
                      <div style={{ display: "flex", gap: "var(--sys-space-2)", flexWrap: "wrap" }}>
                        {CHIP_TONES.map((tone) => (
                          <Chip key={tone} variant={variant} tone={tone}>
                            {variant === "count" ? CHIP_TONES.indexOf(tone) + 1 : tone}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Specimen>
            </Band>

            {/* ═══════════════════════════ BUTTONS ═══════════════════════════ */}
            <Band id="buttons" title="Buttons">
              <Pairing
                left={
                  <Specimen
                    symbol="PrimaryBtn"
                    file="App.tsx"
                    kind="LIVE APP"
                    note="PrimaryBtn is a thin wrapper around Button variant=&quot;primary&quot; (App.tsx:1154–1167) — zero visual drift by construction. Shown for completeness; the real comparisons are TonalBtn/TextBtn below."
                  >
                    <StateRow
                      labels={LIVE_BUTTON_STATE_LABELS}
                      cells={[
                        <PrimaryBtn key="rest">Save changes</PrimaryBtn>,
                        <PrimaryBtn key="hover">Save changes</PrimaryBtn>,
                        <PrimaryBtn key="disabled" disabled>Save changes</PrimaryBtn>,
                      ]}
                    />
                  </Specimen>
                }
                right={
                  <Specimen symbol="Button (primary)" file="primitives/Button.tsx" kind="PRIMITIVE">
                    <StateRow
                      labels={PRIMITIVE_BUTTON_STATE_LABELS}
                      cells={[
                        <Button key="rest" variant="primary">Save changes</Button>,
                        <Button key="hover" variant="primary" forcedState="hover">Save changes</Button>,
                        <Button key="disabled" variant="primary" disabled>Save changes</Button>,
                      ]}
                    />
                  </Specimen>
                }
              />

              <Pairing
                left={
                  <Specimen symbol="TonalBtn" file="App.tsx" kind="LIVE APP" note=".locked-btn-secondary — T2, frequent CTAs.">
                    <StateRow
                      labels={LIVE_BUTTON_STATE_LABELS}
                      cells={[
                        <TonalBtn key="rest">Add subtask</TonalBtn>,
                        <TonalBtn key="hover">Add subtask</TonalBtn>,
                        <TonalBtn key="disabled" disabled>Add subtask</TonalBtn>,
                      ]}
                    />
                  </Specimen>
                }
                right={
                  <Specimen symbol="Button (secondary)" file="primitives/Button.tsx" kind="PRIMITIVE">
                    <StateRow
                      labels={PRIMITIVE_BUTTON_STATE_LABELS}
                      cells={[
                        <Button key="rest" variant="secondary">Add subtask</Button>,
                        <Button key="hover" variant="secondary" forcedState="hover">Add subtask</Button>,
                        <Button key="disabled" variant="secondary" disabled>Add subtask</Button>,
                      ]}
                    />
                  </Specimen>
                }
              />

              <Pairing
                left={
                  <Specimen symbol="TextBtn" file="App.tsx" kind="LIVE APP" note=".locked-btn-text — T3, escape hatches.">
                    <StateRow
                      labels={LIVE_BUTTON_STATE_LABELS}
                      cells={[
                        <TextBtn key="rest">Cancel</TextBtn>,
                        <TextBtn key="hover">Cancel</TextBtn>,
                        <TextBtn key="disabled" disabled>Cancel</TextBtn>,
                      ]}
                    />
                  </Specimen>
                }
                right={
                  <Specimen symbol="Button (text)" file="primitives/Button.tsx" kind="PRIMITIVE">
                    <StateRow
                      labels={PRIMITIVE_BUTTON_STATE_LABELS}
                      cells={[
                        <Button key="rest" variant="text">Cancel</Button>,
                        <Button key="hover" variant="text" forcedState="hover">Cancel</Button>,
                        <Button key="disabled" variant="text" disabled>Cancel</Button>,
                      ]}
                    />
                  </Specimen>
                }
              />

              <Specimen symbol="danger + loading" file="App.tsx & primitives/Button.tsx" kind="LIVE APP" note="Family-swap (cool → warm hue) and the busy state, both tiers.">
                <div style={{ display: "flex", gap: "var(--sys-space-3)", flexWrap: "wrap", alignItems: "center" }}>
                  <PrimaryBtn danger>Delete</PrimaryBtn>
                  <TonalBtn danger>Remove</TonalBtn>
                  <TextBtn danger>Discard</TextBtn>
                  <PrimaryBtn loading>Saving</PrimaryBtn>
                  <TonalBtn loading>Loading</TonalBtn>
                  <Button variant="secondary" danger forcedState="hover">Remove</Button>
                </div>
              </Specimen>
            </Band>

            {/* ═══════════════════════ ROWS & STRUCTURE ═══════════════════════ */}
            <Band id="rows-structure" title="Rows & structure">
              <Specimen symbol="Row" file="primitives/Row.tsx" kind="PRIMITIVE" note="Every variant, rest / hover (forced) / selected.">
                <div style={{ display: "grid", gap: "var(--sys-space-2)" }}>
                  {ROW_VARIANTS.map((variant) => (
                    <div key={variant} style={{ display: "grid", gridTemplateColumns: "90px repeat(3, minmax(0,1fr))", gap: "var(--sys-space-3)", alignItems: "center" }}>
                      <code style={{ ...stateCaptionStyle, textTransform: "none" }}>{variant}</code>
                      <Row variant={variant} forcedState="rest" leadingIcon={<Folder />}>Projects</Row>
                      <Row variant={variant} forcedState="hover" leadingIcon={<Folder />}>Projects</Row>
                      <Row variant={variant} forcedState="selected" leadingIcon={<Folder />}>Projects</Row>
                    </div>
                  ))}
                </div>
              </Specimen>

              <Specimen symbol="TaskRow" file="App.tsx" kind="LIVE APP" note="3 fixtures: normal, blocked (blocked_by set → AlertTriangle shows), done. onSaveState wired to real local state — the inline select actually changes the row.">
                <div style={{ border: `1px solid ${NC.borderFaint}`, borderRadius: 8 }}>
                  {taskRowFixtures.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      allItems={taskRowFixtures}
                      depth={0}
                      onSelect={noop}
                      onDelete={noop}
                      onDuplicate={noop}
                      onPromote={noop}
                      onAddSubtask={noop}
                      onAddToCycle={noop}
                      onSaveState={setTaskState}
                    />
                  ))}
                </div>
              </Specimen>

              <Specimen symbol="ModuleSection" file="App.tsx" kind="LIVE APP" note="One module, 2 fixture tasks, expanded by default. Wrapped in DndProvider (shared, page-level) — ModuleSection renders DraggableTaskRow internally, which calls react-dnd's useDrag/useDrop.">
                <div style={{ border: `1px solid ${NC.borderFaint}`, borderRadius: 8 }}>
                  <ModuleSection
                    mod={FIXTURE_MODULE}
                    modTasks={moduleTaskFixtures}
                    allItems={moduleTaskFixtures}
                    onOpenMod={noop}
                    onDeleteMod={noop}
                    onAddTask={noop}
                    onSelectTask={noop}
                    onDeleteTask={noop}
                    onDuplicateTask={noop}
                    onPromoteTask={noop}
                    onAddSubtask={noop}
                    onMoveTask={noop}
                    onAddModToCycle={noop}
                    onAddTaskToCycle={noop}
                    onSaveTaskState={setModTaskState}
                  />
                </div>
              </Specimen>

              <Specimen symbol="Breadcrumb" file="primitives/Breadcrumb.tsx" kind="PRIMITIVE">
                <Breadcrumb>
                  <BreadcrumbItem onClick={noop}>Nova Caelum Landing</BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem onClick={noop}>Review-lab calibration module</BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem current>Primitives review</BreadcrumbItem>
                </Breadcrumb>
              </Specimen>

              <Pairing
                left={
                  <Specimen symbol="SectionLabel" file="App.tsx" kind="LIVE APP">
                    <SectionLabel>Example section label</SectionLabel>
                  </Specimen>
                }
                right={
                  <Specimen symbol="Field" file="App.tsx" kind="LIVE APP">
                    <Field label="Example field">
                      <NcInput placeholder="value" />
                    </Field>
                  </Specimen>
                }
              />

              <Pairing
                left={
                  <Specimen symbol="EmptyState" file="App.tsx" kind="LIVE APP">
                    <EmptyState
                      icon={<Users size={36} />}
                      text="No team members yet"
                      secondaryText="Use Add Member above to invite from the roster."
                      action={<TonalBtn><Plus size={13} /> Add member</TonalBtn>}
                    />
                  </Specimen>
                }
                right={
                  <Specimen symbol="Spinner" file="App.tsx" kind="LIVE APP">
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--sys-space-3)", color: NC.stone }}>
                      <Spinner /> <span style={{ fontFamily: FONT_SANS, fontSize: 13 }}>Loading…</span>
                    </div>
                  </Specimen>
                }
              />

              <Specimen symbol="EditableTitleInline" file="App.tsx" kind="LIVE APP" note="Double-click to edit; Enter commits, Escape reverts. Shared by task/module drawer headers.">
                <EditableTitleInline value={editableTitle} onSave={setEditableTitle} className="text-lg font-semibold" />
              </Specimen>
            </Band>

            {/* ═══════════════════════════ SURFACES ═══════════════════════════ */}
            <Band id="surfaces" title="Surfaces">
              <Specimen symbol="Card" file="primitives/Card.tsx" kind="PRIMITIVE" note="flat / lifted / glass, rest and hover (forced).">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--sys-space-3)" }}>
                  {CARD_VARIANTS.flatMap((variant) => (["rest", "hover"] as const).map((state) => (
                    <Card key={`${variant}-${state}`} variant={variant} forcedState={state} lit={variant === "glass"}>
                      <span style={{ ...stateCaptionStyle }}>{state}</span>
                      <strong style={{ display: "block", fontFamily: FONT_SANS, fontSize: 14, color: NC.cream, marginTop: 4 }}>{variant}</strong>
                      <span style={{ fontFamily: FONT_SANS, fontSize: 12, color: NC.stone }}>Token-only surface recipe</span>
                    </Card>
                  )))}
                </div>
              </Specimen>

              <Specimen
                symbol=".nc-lit-surface modal card"
                file="App.tsx (Modal, inner markup copied)"
                kind="STATIC COPY"
                note="Copied from Modal's inner <div className=&quot;nc-lit-surface …&quot;> (App.tsx:1229–1243) — not rendered as a fixed/portal overlay so it sits in normal document flow here. data-surface=&quot;top&quot; is carried over intentionally: the character system paints this surface's glass tint via that attribute, not via the class alone."
              >
                <div data-surface="top" className="nc-lit-surface rounded-xl border p-6" style={{ borderColor: NC.border, maxWidth: 420 }}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 style={{ fontFamily: FONT_SANS, fontSize: 20, color: NC.cream, fontWeight: 600, letterSpacing: "-0.02em" }}>Archive task?</h3>
                    <button className="p-1 rounded hover:bg-white/5" style={{ color: NC.stone }} aria-label="Close"><X size={15} /></button>
                  </div>
                  <p className="text-sm mb-5" style={{ color: NC.stone }}>The record is preserved and can be un-archived later.</p>
                  <div className="flex gap-2 justify-end">
                    <TextBtn>Cancel</TextBtn>
                    <TonalBtn danger><Archive size={13} /> Archive</TonalBtn>
                  </div>
                </div>
              </Specimen>

              <Specimen
                symbol=".nc-glass-menu"
                file="App.tsx (ContextMenuContent markup copied)"
                kind="STATIC COPY"
                note="Rendered statically open over the dense text block below — the popover-transparency question Daniel flagged. Real menu, real markup shape (App.tsx:2353–2365), just not wired to a Radix trigger so it can sit open without interaction."
              >
                <div style={{ position: "relative", maxWidth: "70ch" }}>
                  <p style={{ fontFamily: FONT_SANS, fontSize: 13, lineHeight: 1.65, color: NC.stone, margin: 0 }}>{DENSE_TEXT_BLOCK}</p>
                  <div
                    className="nc-glass-menu"
                    style={{ position: "absolute", top: 40, left: "18%", minWidth: 200, padding: 6, color: NC.cream }}
                    role="menu"
                  >
                    <div className="gap-2 text-sm" role="menuitem" style={{ display: "flex", alignItems: "center", padding: "6px 8px", color: NC.cream }}><Edit2 size={13} /> View / Edit</div>
                    <div className="gap-2 text-sm" role="menuitem" style={{ display: "flex", alignItems: "center", padding: "6px 8px", color: NC.cream }}><Plus size={13} /> Add Subtask</div>
                    <div className="gap-2 text-sm" role="menuitem" style={{ display: "flex", alignItems: "center", padding: "6px 8px", color: NC.green }}><Calendar size={13} /> Add to Cycle…</div>
                    <div style={{ height: 1, background: NC.border, margin: "4px 0" }} />
                    <div className="gap-2 text-sm" role="menuitem" style={{ display: "flex", alignItems: "center", padding: "6px 8px", color: "#c9a84c" }}><TrendingUp size={13} /> Promote to Module</div>
                    <div className="gap-2 text-sm" role="menuitem" style={{ display: "flex", alignItems: "center", padding: "6px 8px", color: NC.cream }}><Copy size={13} /> Duplicate</div>
                    <div style={{ height: 1, background: NC.border, margin: "4px 0" }} />
                    <div className="gap-2 text-sm" role="menuitem" style={{ display: "flex", alignItems: "center", padding: "6px 8px", color: NC.cream }}><FolderInput size={13} /> Move…</div>
                    <div className="gap-2 text-sm" role="menuitem" style={{ display: "flex", alignItems: "center", padding: "6px 8px", color: NC.cream }}><Archive size={13} /> Archive</div>
                  </div>
                </div>
              </Specimen>

              <Specimen
                symbol="SlideOver header strip"
                file="App.tsx (SlideOver, header markup copied)"
                kind="STATIC COPY"
                note="Just the header row (title + actions + close) from App.tsx:1245–1264 — the live component is a fixed-position, portal-rendered right rail; this copy sits in normal flow at its real width (480px)."
              >
                <div data-surface="elevated-2" className="nc-lit-surface border" style={{ width: 480, maxWidth: "100%", borderColor: NC.border, borderRadius: 12 }}>
                  <div className="flex items-start gap-2 px-6 pt-6 pb-4">
                    <div className="flex-1 min-w-0">
                      <ChevronRight size={12} style={{ color: NC.stone, display: "inline", marginRight: 4 }} />
                      <h2 style={{ fontFamily: FONT_SANS, fontSize: 17, fontWeight: 600, color: NC.cream, display: "inline" }}>Wire acceptance-criteria fields…</h2>
                    </div>
                    <TonalBtn className="!px-2"><Layers size={13} /></TonalBtn>
                    <button className="p-1 rounded hover:bg-white/5 flex-shrink-0" style={{ color: NC.stone }} aria-label="Close"><X size={15} /></button>
                  </div>
                </div>
              </Specimen>
            </Band>

            {/* ═════════════════════ FOUNDRY CROSS-CHECK ══════════════════════ */}
            <Band id="foundry-crosscheck" title="Foundry cross-check">
              <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: NC.stone, maxWidth: "70ch" }}>
                <code style={{ fontFamily: FONT_MONO, fontSize: 12 }}>PrimitiveGallery</code> rendered inline with retired input specimens omitted, so
                every band above can be checked against what Foundry's own gallery already shows. Reachable live at
                {" "}<code style={{ fontFamily: FONT_MONO, fontSize: 12 }}>?foundry=1</code> → Components tab (see the
                header comment for the source-of-truth correction on that routing claim).
              </p>
              <div style={{ border: `1px solid ${NC.borderFaint}`, borderRadius: 8, padding: "var(--sys-space-4)" }}>
                <PrimitiveGallery showLegacyInputs={false} />
              </div>
            </Band>
          </DndProvider>

          <footer style={{ paddingTop: "var(--sys-space-8)", borderTop: `1px solid ${NC.borderFaint}` }}>
            <Flagged>NcSelect (App.tsx) doesn't forward defaultOpen/open through to the underlying Radix Select.Root — rendered closed-only above. Widening its prop surface would be an App.tsx behavior change, out of scope for this review pass.</Flagged>
            <Flagged>PrimaryBtn (App.tsx) is already a thin wrapper over Button variant="primary" — zero drift there by construction. The real Button-ladder drift is TonalBtn/TextBtn vs. Button secondary/text, both shown above.</Flagged>
            <Flagged>.locked-btn-secondary and .locked-btn-text are each defined twice — once in primitives/primitives.css (token-based: var(--sys-hair-*), var(--sys-text-*), no border-radius set) and again in styles/theme.css (hardcoded rgba literals, border-radius: 10px). Verified via getComputedStyle on the rendered TonalBtn above: theme.css wins the cascade (border-radius: 10px, color: rgba(244,234,213,0.72), hardcoded gradient background all match theme.css's declaration, not primitives.css's). primitives.css's token-based rule for this selector is currently dead code — not fixed here.</Flagged>
            <Flagged>.nc-search is not an exported symbol — TasksPane builds it inline from a lucide Search icon + a plain input.nc-search. The "LIVE APP" pairing above reproduces that markup rather than importing a component.</Flagged>
          </footer>
        </main>
      </div>
    </div>
  );
}
