// ═══════════════════════════════════════════════════════════════════════════════
//  ProjectViewBentoShell — Design Lab 2 (?lab=2)
//  Direction: DECOMPOSED BENTO — three separately-elevated card surfaces on
//  ground with ~24px gutters. Ground (graph paper) shows through the gutters
//  between header card, tab pill row, and tasks/content card — the substrate
//  fix for "ground never shows when a project is open."
// ───────────────────────────────────────────────────────────────────────────────
//  Designer brief lives at: workspace/caelos-launch/lab2-bento-brief.md
//  Owner: Designer subagent A (Da Vinci sprint 2026-07-30)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Folder } from "lucide-react";
import { NC } from "../design/tokens";
import {
  ProjectInfoTab,
  TasksPane,
  CyclesTab,
  TeamTab,
  StatusPill,
  ActivityButton,
  type ProjectViewShellProps,
} from "./App";

const TABS = [
  { value: "info", label: "Info" },
  { value: "tasks", label: "Tasks" },
  { value: "cycles", label: "Cycles" },
  { value: "team", label: "Team" },
];

// Shared card chemistry — flat elevated surface, no inset top-highlight
// stripe (edge-chemistry ban). Soft outward shadow + hairline border only.
const CARD_STYLE: React.CSSProperties = {
  borderRadius: "var(--sys-radius-lg)",
  border: "1px solid var(--sys-hair-1)",
  background: NC.elevated,
  boxShadow: "0 4px 24px -8px rgba(0,0,0,0.4)",
};

export function ProjectViewBentoShell({
  project,
  pendingTaskId,
  onClearPending,
  pendingTab,
  onClearPendingTab,
  onSaveProject,
  foundryMode = false,
}: ProjectViewShellProps) {
  const [tab, setTab] = useState<string>("tasks");

  useEffect(() => {
    if (pendingTab) {
      setTab(pendingTab);
      onClearPendingTab();
    }
  }, [pendingTab, onClearPendingTab]);

  return (
    <div
      data-surface="ground"
      className="flex-1 flex flex-col overflow-hidden"
      style={{ padding: 24, gap: 24 }}
    >
      {/* ── Header card — verbatim content from canonical ProjectView ─────── */}
      <div data-surface="elevated" className="flex-shrink-0" style={{ ...CARD_STYLE, padding: "28px 28px" }}>
        <p className="text-xs font-semibold tracking-widest uppercase mb-2.5" style={{ color: NC.accent }}>Project</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 30, color: NC.cream, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.028em" }}>{project.name}</h1>
          <StatusPill status={project.status} onChange={s => onSaveProject(project.id, { status: s })} />
          <div className="ml-2"><ActivityButton entityType="project" entityId={project.id} /></div>
        </div>
        {project.description && <p className="text-sm mt-4" style={{ color: NC.stone }}>{project.description}</p>}
        {project.folder_path && (
          <p className="flex items-center gap-1.5 text-xs font-mono mt-4" style={{ color: "rgba(138,133,128,0.6)" }}>
            <Folder size={11} />{project.folder_path}
          </p>
        )}
      </div>

      {/* ── Tab strip (pill row) + content card — the redesigned "middle" ── */}
      <TabsPrimitive.Root
        value={tab}
        onValueChange={setTab}
        className="flex-1 flex flex-col overflow-hidden"
        style={{ gap: 24 }}
      >
        {/* Pill row lives directly on ground — no card, no icons. Avoids
            stacking a fourth elevated box and reads as light navigation,
            not a "kill zone" strip. */}
        <TabsPrimitive.List className="flex items-center gap-1.5 flex-shrink-0 px-1">
          {TABS.map(t => {
            const active = tab === t.value;
            return (
              <TabsPrimitive.Trigger
                key={t.value}
                value={t.value}
                className="text-xs font-semibold tracking-wide uppercase transition-colors"
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: active
                    ? "color-mix(in srgb, var(--sys-accent-cool, var(--sys-accent)) 12%, transparent)"
                    : "transparent",
                  color: active ? NC.cream : NC.stone,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>

        {/* Content card — tasks card top rail (search/filter/+Task) renders
            inside <TasksPane> itself; this wrapper just supplies the
            elevated surface + scroll containment. */}
        <div data-surface="elevated" className="flex-1 flex flex-col overflow-hidden" style={CARD_STYLE}>
          <TabsPrimitive.Content value="info" className="flex-1 overflow-auto data-[state=inactive]:hidden">
            <ProjectInfoTab project={project} onSave={onSaveProject} onSwitchTab={setTab} />
          </TabsPrimitive.Content>
          <TabsPrimitive.Content value="tasks" className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden">
            <TasksPane
              projectId={project.id}
              projectName={project.name}
              pendingTaskId={pendingTaskId}
              onClearPending={onClearPending}
              fixtureMode={foundryMode}
            />
          </TabsPrimitive.Content>
          <TabsPrimitive.Content value="cycles" className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden">
            <CyclesTab projectId={project.id} />
          </TabsPrimitive.Content>
          <TabsPrimitive.Content value="team" className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden">
            <TeamTab projectId={project.id} />
          </TabsPrimitive.Content>
        </div>
      </TabsPrimitive.Root>
    </div>
  );
}
