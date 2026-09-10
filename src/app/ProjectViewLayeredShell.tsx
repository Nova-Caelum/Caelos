import { useState, useEffect } from "react";
import { Card, TabsRoot, TabsList, TabsTrigger, TabsContent } from "@nova-caelum/ui";
import { Folder } from "lucide-react";
import { NC } from "../design/tokens";
import { GlassSeparator } from "./components/ui/glass-separator";
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
    <TabsRoot
      value={tab}
      onValueChange={setTab}
      data-surface="ground"
      className="flex-1 flex flex-col overflow-hidden"
      style={{ padding: "28px 48px 48px 48px", gap: 40 }}
    >
      <TabsList aria-label="Project sections" className="flex-shrink-0">
        {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
      </TabsList>
      <Card variant="glass" className="flex-1 flex flex-col overflow-hidden" style={{ padding: 0, minHeight: 0 }}>
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
          <TabsContent
            style={{ paddingTop: 0, minHeight: 0 }}
            value="info"
            className="flex-1 overflow-auto data-[state=inactive]:hidden"
          >
            <ProjectInfoTab project={project} onSave={onSaveProject} onSwitchTab={setTab} />
          </TabsContent>
          <TabsContent
            style={{ paddingTop: 0, minHeight: 0 }}
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
          </TabsContent>
          <TabsContent
            style={{ paddingTop: 0, minHeight: 0 }}
            value="cycles"
            className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <CyclesTab projectId={project.id} />
          </TabsContent>
          <TabsContent
            style={{ paddingTop: 0, minHeight: 0 }}
            value="team"
            className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden"
          >
            <TeamTab projectId={project.id} />
          </TabsContent>
      </Card>
    </TabsRoot>
  );
}
