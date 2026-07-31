// ═══════════════════════════════════════════════════════════════════════════════
//  ProjectViewLayeredShell — Design Lab 3 (?lab=3)  ·  v2 (2026-07-31)
// ───────────────────────────────────────────────────────────────────────────────
//  Direction v2: tabs OUTSIDE the card (Daniel prefers the bento's on-ground
//  placement over the previous floating-overhang treatment), positioned
//  "kind of far up" — at the very top of the ground area with a generous
//  gap to the card so the tab row doesn't read as a harsh horizontal divider.
//  Uses actual primitives: <Card variant="glass"> for the card, <Chip
//  variant="category" interactive> for tabs.
//
//  Previous v1 (floating tabs overhanging card top at z=100) had two problems:
//   (a) parent overflow: hidden clipped the negative-top absolute-position tabs
//   (b) Daniel: "I don't love the tabs being such a firm divider straight
//       down the middle" — the overhang still read as a strong horizontal band.
//
//  v2 fix: tabs live in the ground padding area, top-aligned (well above card
//  center), with 40px breathing room before the card. Ground reads generously
//  around AND faintly through the glass card (Card primitive glass variant).
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Folder } from "lucide-react";
import { NC } from "../design/tokens";
import { GlassSeparator } from "./components/ui/glass-separator";
import { Card } from "../primitives";
import {
  ProjectInfoTab,
  TasksPane,
  CyclesTab,
  TeamTab,
  StatusPill,
  ActivityButton,
  FOUNDRY_DEMO_PROJECT,
  type ProjectViewShellProps,
} from "./App";

const TABS = [
  { value: "info", label: "Info" },
  { value: "tasks", label: "Tasks" },
  { value: "cycles", label: "Cycles" },
  { value: "team", label: "Team" },
];

export function ProjectViewLayeredShell({
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
      style={{ padding: "28px 48px 48px 48px", gap: 40 }}
    >
      {/* ── Tab row — canonical uppercase-tracked treatment (matches App.tsx:2971
          typography), just moved to the top of ground area and with the active
          indicator swapped from a bottom-border to a soft pill fill. No icons. ── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className="text-xs font-semibold tracking-wide uppercase transition-colors"
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                background: active
                  ? "color-mix(in srgb, var(--sys-accent-cool, var(--sys-accent)) 18%, transparent)"
                  : "transparent",
                color: active ? NC.cream : NC.stone,
                border: "none",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Glass card — tagged data-surface="elevated" so the Foundry's surface
          character mechanic controls its chemistry (character CSS uses !important
          and wins over the Card's own nc-card[data-variant="glass"] rules).
          When Foundry sets elevated=plain/graph/glass, this card follows. ── */}
      <Card variant="glass" data-surface="elevated" className="flex-1 flex flex-col overflow-hidden">
        <TabsPrimitive.Root
          value={tab}
          onValueChange={setTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Header block — verbatim from canonical ProjectView (App.tsx:2948-2960) */}
          <div className="px-7 flex-shrink-0" style={{ paddingTop: 28, paddingBottom: 28 }}>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-2.5"
              style={{ color: NC.accent }}
            >
              Project
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 30,
                  color: NC.cream,
                  fontWeight: 600,
                  lineHeight: 1.12,
                  letterSpacing: "-0.028em",
                }}
              >
                {project.name}
              </h1>
              <StatusPill
                status={project.status}
                onChange={(s) => onSaveProject(project.id, { status: s })}
              />
              <div className="ml-2">
                <ActivityButton entityType="project" entityId={project.id} />
              </div>
            </div>
            {project.description && (
              <p className="text-sm mt-4" style={{ color: NC.stone }}>
                {project.description}
              </p>
            )}
            {project.folder_path && (
              <p
                className="flex items-center gap-1.5 text-xs font-mono mt-4"
                style={{ color: "rgba(138,133,128,0.6)" }}
              >
                <Folder size={11} />
                {project.folder_path}
              </p>
            )}
          </div>

          <GlassSeparator />

          {/* Tab content panes — driven by external Chip row via TabsPrimitive.Root value binding */}
          <TabsPrimitive.Content
            value="info"
            className="flex-1 overflow-auto data-[state=inactive]:hidden"
          >
            <ProjectInfoTab project={project} onSave={onSaveProject} onSwitchTab={setTab} />
          </TabsPrimitive.Content>
          <TabsPrimitive.Content
            value="tasks"
            className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <TasksPane
              projectId={project.id}
              projectName={project.name}
              pendingTaskId={pendingTaskId}
              onClearPending={onClearPending}
              fixtureMode={foundryMode && project.id === FOUNDRY_DEMO_PROJECT.id}
            />
          </TabsPrimitive.Content>
          <TabsPrimitive.Content
            value="cycles"
            className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <CyclesTab projectId={project.id} />
          </TabsPrimitive.Content>
          <TabsPrimitive.Content
            value="team"
            className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <TeamTab projectId={project.id} />
          </TabsPrimitive.Content>
        </TabsPrimitive.Root>
      </Card>
    </div>
  );
}
