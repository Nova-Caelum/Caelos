import { Foundations } from "../../packages/ui/preview/Foundations";
import { Heading, Text, Surface } from "@nova-caelum/ui";
import React, { useEffect, useState } from "react";
import { Plus, Folder, Settings, RefreshCw } from "lucide-react";
import {
  Avatar,
  Disclosure,
  PersonChip,
  UserCard,
  CaelosProvider,
  Button,
  IconButton,
  Card,
  Input,
  TextArea,
  Chip,
  Badge,
  Row,
  Tooltip,
  StatusSelect,
  TaskRow,
  ScrollArea,
  Tabs,
  Select,
  Composer,
  PermissionControl,
  ActionMenu,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  type ReplyFormat,
} from "@nova-caelum/ui";
import "./foundryPanda.css";
function Compose({ id = "primary" }: { id?: string }) {
  const [value, setValue] = useState(""),
    [activeAgentId, setActiveAgentId] = useState("hermes"),
    [agentSettings, setAgentSettings] = useState<
      Record<string, { model: string; reasoning: string }>
    >({
      hermes: { model: "GPT-6 Astra", reasoning: "High" },
      athena: { model: "GPT-5.6 Sol", reasoning: "Medium" },
      "design-lead": { model: "GPT-5.6 Terra", reasoning: "Low" },
    }),
    [format, setFormat] = useState<ReplyFormat>("text"),
    [live, setLive] = useState(false),
    [permission, setPermission] = useState("Ask before acting"),
    [event, setEvent] = useState("");
  const { model, reasoning } = agentSettings[activeAgentId];
  const setModel = (model: string) =>
    setAgentSettings((current) => ({
      ...current,
      [activeAgentId]: { ...current[activeAgentId], model },
    }));
  const setReasoning = (reasoning: string) =>
    setAgentSettings((current) => ({
      ...current,
      [activeAgentId]: { ...current[activeAgentId], reasoning },
    }));
  return (
    <div data-composer-demo={id}>
      <Composer
        value={value}
        onValueChange={setValue}
        activeAgentId={activeAgentId}
        onActiveAgentChange={setActiveAgentId}
        agents={
          id === "primary"
            ? [
                {
                  id: "hermes",
                  name: "Hermes",
                  description:
                    "Coordinates the conversation and keeps the work moving.",
                },
                {
                  id: "athena",
                  name: "Athena",
                  description:
                    "Helps with research, analysis, and technical decisions.",
                },
                {
                  id: "design-lead",
                  name: "Design Lead",
                  mention: "@design-lead",
                  description:
                    "Reviews the interface, interaction details, and visual consistency.",
                },
              ]
            : []
        }
        commands={[
          {
            id: "review",
            name: "review",
            kind: "command",
            description:
              "Review the current changes and identify issues worth addressing.",
          },
          {
            id: "summarize",
            name: "summarize",
            kind: "command",
            description: "Summarize the conversation and its key decisions.",
          },
          {
            id: "plan",
            name: "plan",
            kind: "command",
            description:
              "Outline the steps for the task before starting implementation.",
          },
          {
            id: "design-audit",
            name: "design-audit",
            kind: "skill",
            description:
              "Inspect a product flow for usability, visual consistency, and accessibility.",
          },
          {
            id: "research",
            name: "research",
            kind: "skill",
            description:
              "Investigate a topic and return findings supported by sources.",
          },
          {
            id: "write-tests",
            name: "write-tests",
            kind: "skill",
            description: "Add focused tests for the behavior you are changing.",
          },
          {
            id: "explain",
            name: "explain",
            kind: "command",
            description:
              "Explain the selected code or concept in plain language.",
          },
          {
            id: "document",
            name: "document",
            kind: "skill",
            description:
              "Document an interface, workflow, or decision for future reference.",
          },
          {
            id: "handoff",
            name: "handoff",
            kind: "command",
            description:
              "Prepare a concise handoff with decisions, progress, and next steps.",
          },
        ]}
        model={model}
        models={["GPT-6 Astra", "GPT-5.6 Sol", "GPT-5.6 Terra"]}
        onModelChange={setModel}
        reasoning={reasoning}
        reasoningLevels={["Low", "Medium", "High"]}
        onReasoningChange={setReasoning}
        replyFormat={format}
        onReplyFormatChange={setFormat}
        live={live}
        onLiveChange={setLive}
        onDictate={() => setEvent("Dictation callback received")}
        onAdd={(kind) => setEvent(`Add: ${kind}`)}
        onSend={(message) => {
          setEvent(`Preview send: ${message.text} · ${message.replyFormat}`);
          setValue("");
        }}
        header={
          <>
            <span>Hermes · Conversation permissions</span>
            <PermissionControl
              value={permission}
              options={[
                "Ask before acting",
                "Approve routine actions",
                "Full access",
              ]}
              onValueChange={setPermission}
            />
          </>
        }
      />
      <output>{event}</output>
    </div>
  );
}
export default function FoundryPandaGallery() {
  const [people, setPeople] = useState(["Daniel", "Hermes"]);
  const [profileMessage, setProfileMessage] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildMessage, setBuildMessage] = useState(
    () =>
      sessionStorage.getItem("caelos-foundry-ui-build") || "Ready to review",
  );
  useEffect(() => {
    document.body.setAttribute("data-foundry-panda", "");
    return () => document.body.removeAttribute("data-foundry-panda");
  }, []);
  async function rebuild() {
    setBuilding(true);
    setBuildMessage("Building the shared library…");
    try {
      const response = await fetch("/__foundry/rebuild-ui", {
        method: "POST",
        headers: { "X-Caelos-Foundry": "rebuild-ui" },
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Library rebuild failed");
      sessionStorage.setItem(
        "caelos-foundry-ui-build",
        "Library rebuilt · " + new Date().toLocaleTimeString(),
      );
      window.location.reload();
    } catch (error) {
      setBuildMessage(
        error instanceof Error ? error.message : "Library rebuild failed",
      );
      setBuilding(false);
    }
  }
  const [theme, setTheme] = useState<"dark" | "light">("dark"),
    [glass, setGlass] = useState(true),
    [reduced, setReduced] = useState(false),
    [status, setStatus] = useState("progress"),
    [filter, setFilter] = useState("Design"),
    [row, setRow] = useState("Taskgraph"),
    [tab, setTab] = useState("info"),
    [query, setQuery] = useState(""),
    [breadcrumbMessage, setBreadcrumbMessage] = useState("");
  return (
    <CaelosProvider className="foundry-panda" theme={theme} glass={glass} reducedMotion={reduced}>
      <Surface className="foundry-panda-content">
        <header>
          <Text as="p" className="eyebrow">NOVA CAELUM · THE SHARED LIBRARY</Text>
          <Heading as="h1" size="display" data-heading>The approved collection.</Heading>
          <Text as="p">
            Real package components with local demo data. Theme controls below apply to this collection. Application migration status is recorded in the shared package migration ledger.
          </Text>
          <div className="line">
            {import.meta.env.DEV && (
              <Button
                variant="primary"
                disabled={building}
                leadingIcon={<RefreshCw size={14} />}
                onClick={() => void rebuild()}
              >
                {building ? "Rebuilding…" : "Rebuild library"}
              </Button>
            )}
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              Switch to {theme === "dark" ? "light" : "dark"}
            </Button>
            <Chip selected={glass} onClick={() => setGlass(!glass)}>
              Glass
            </Chip>
            <Chip selected={reduced} onClick={() => setReduced(!reduced)}>
              Reduce motion
            </Chip>
          </div>
          {import.meta.env.DEV ? <>
            <Text as="p" role="status">{buildMessage}</Text>
            <Text as="p" className="muted">Edit the shared package, then rebuild here to review the result. Rebuilding reloads this preview and clears demo inputs.</Text>
          </> : <Text as="p" className="muted">This collection uses the shared library included in this application release.</Text>}
        </header>
        <section>
          <Heading as="h2" size="section" data-heading>Surfaces & selection</Heading>
          <div className="grid">
            <Card variant="glass">
              <Heading as="h3" size="title">Depth without noise</Heading>
              <Text as="p">Transparent surroundings. Calm, legible content.</Text>
              <div className="line">
                <Button variant="primary">Create project</Button>
                <Button>Tonal action</Button>
                <Button variant="text">View details</Button>
              </div>
            </Card>
            <Card>
              <Heading as="h3" size="title">A softer sidebar</Heading>
              {["Taskgraph", "Design atlas", "Research"].map((x) => (
                <Row
                  key={x}
                  leadingIcon={<Folder size={16} />}
                  selected={row === x}
                  onClick={() => setRow(x)}
                >
                  {x}
                </Row>
              ))}
            </Card>
          </div>
          <div className="line spaced">
            {["Design", "Engineering", "Research"].map((x) => (
              <Chip
                key={x}
                selected={filter === x}
                onClick={() => setFilter(x)}
              >
                {x}
              </Chip>
            ))}
            <Badge tone="sage">Shared</Badge>
            <StatusSelect value={status} onValueChange={setStatus} />
            <Tooltip label="Copy project reference" detail="CAE-208">
              <Button>Project reference</Button>
            </Tooltip>
            <IconButton label="Settings" icon={<Settings size={16} />} />
          </div>
          <TaskRow
            title="Refine the shared component library"
            status={status}
            onStatusChange={setStatus}
            owner={{ name: "Daniel" }}
          />
          <Tabs
            value={tab}
            onValueChange={setTab}
            label="Project sections"
            items={["info", "tasks", "cycles", "team"].map((x) => ({
              value: x,
              label: x.toUpperCase(),
              content: <Text as="p">{x} content</Text>,
            }))}
          />
        </section>
        <section aria-label="People and agents">
          <Disclosure title="People & agents" headingLevel={2} defaultOpen>
          <Card>
            <Heading as="h3" size="title">Avatars</Heading>
            <div className="line">
              {(["sm", "md", "lg"] as const).map(size => (
                <Tooltip key={size} label="Daniel Eghdami" detail={`${size === "sm" ? "24" : size === "md" ? "32" : "40"} px avatar`}>
                  <Avatar name="Daniel Eghdami" size={size} tabIndex={0} />
                </Tooltip>
              ))}
              <Tooltip label="Hermes" detail="Agent">
                <Avatar name="Hermes" kind="agent" tabIndex={0} />
              </Tooltip>
            </div>
            <Heading as="h3" size="title">Person chips</Heading>
            <div className="line" style={{ flexWrap: "wrap" }}>
              {people.map(name => <PersonChip key={name} name={name} kind={name === "Hermes" ? "agent" : "person"} onRemove={() => setPeople(current => current.filter(person => person !== name))} />)}
              {people.length < 2 && <Button variant="text" onClick={() => setPeople(["Daniel", "Hermes"])}>Restore people</Button>}
            </div>
            <Heading as="h3" size="title">User cards</Heading>
            <div style={{ display: "grid", gap: 12 }}>
              <UserCard name="Daniel Eghdami" description="Founder · Nova Caelum" actions={<Button variant="text" size="sm" onClick={() => setProfileMessage("Daniel Eghdami · Founder · Nova Caelum")}>Profile</Button>} />
              <UserCard name="Hermes" kind="agent" description="Agent · Workspace collaborator" actions={<Button variant="text" size="sm" onClick={() => setProfileMessage("Hermes · Agent · Workspace collaborator")}>Profile</Button>} />
            </div>
            <Text as="p" role="status">{profileMessage || "Preview identities. Profile actions stay in this gallery."}</Text>
          </Card>
          </Disclosure>
        </section>
        <section>
          <Heading as="h2" size="section" data-heading>Breadcrumbs</Heading>
          <Card>
            <Breadcrumb fullPath="Workspace / Projects / Design system">
              <BreadcrumbItem
                onClick={() =>
                  setBreadcrumbMessage("Preview navigation: Workspace")
                }
              >
                <Folder size={14} aria-hidden="true" /> Workspace
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem
                onClick={() =>
                  setBreadcrumbMessage("Preview navigation: Projects")
                }
              >
                Projects
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem current>Design system</BreadcrumbItem>
            </Breadcrumb>
            <Text as="p" className="muted">Hover for the full path. Parent locations are clickable; the current page stays quiet.</Text>
            {breadcrumbMessage && <Text as="p" role="status">{breadcrumbMessage}</Text>}
            <Breadcrumb
              aria-label="File path preview"
              fullPath="/Users/danieleghdami/NovaCaelum_code/Caelos-console/packages/ui/src/components.tsx"
              style={{ minWidth: 0, marginTop: 16 }}
            >
              <Folder size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                /Users/danieleghdami/NovaCaelum_code/Caelos-console/packages/ui/src/components.tsx
              </span>
            </Breadcrumb>
            <Text as="p" className="muted">Hover or keyboard-focus the shortened file path to read its full location.</Text>
          </Card>
        </section>
        <section>
          <Heading as="h2" size="section" data-heading>Writing feels like home</Heading>
          <div className="grid">
            <Input label="Project name" placeholder="A new direction" />
            <Input
              variant="search"
              label="Search"
              placeholder="Find a project"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
            />
            <TextArea
              label="Success criteria"
              placeholder="What does done look like?"
            />
            <div>
              <Input
                label="Unavailable"
                placeholder="An unavailable field"
                disabled
              />
              <Input
                label="Needs attention"
                description="Give this project a name."
                invalid
              />
            </div>
          </div>
        </section>
        <section id="composer">
          <Heading as="h2" size="section" data-heading>The conversation composer</Heading>
          <Text as="p" className="muted">
            Hover the brain and reply icons; click to keep choices open. These
            controls use local demo handlers; nothing is sent to an agent. Type
            / for sample commands and skills, or @ to tag a sample chat
            participant.
          </Text>
          <Compose />
        </section>
        <section>
          <Heading as="h2" size="section" data-heading>Quiet scrolling</Heading>
          <div className="grid">
            <Card>
              <ScrollArea
                viewportLabel="Scroll specimen"
                style={{ height: 220 }}
              >
                {Array.from({ length: 15 }, (_, i) => (
                  <Text as="p" key={i}>A little room for thought. Item {i + 1}.</Text>
                ))}
              </ScrollArea>
            </Card>
            <Card>
              <Heading as="h3" size="title">Menus & tooltips</Heading>
              <div className="line">
                <Select
                  label="Project"
                  value={filter}
                  onValueChange={setFilter}
                  options={["Design", "Engineering", "Research"].map((x) => ({
                    value: x,
                    label: x,
                  }))}
                />
                <ActionMenu
                  trigger={
                    <Button leadingIcon={<Plus size={15} />}>Add</Button>
                  }
                  items={[
                    {
                      id: "project",
                      label: "Project",
                      onSelect: () => setQuery("New project"),
                    },
                  ]}
                />
              </div>
              <Text as="p">
                Press Tab to explore focus. Escape closes menus and returns to
                their controls.
              </Text>
              <div className="line" style={{ flexWrap: "wrap" }}>
                <Tooltip label="Copy">
                  <Button>Short label</Button>
                </Tooltip>
                <Tooltip label="Copy project reference" detail="CAE-208">
                  <Button>Hover for a tooltip</Button>
                </Tooltip>
                <Tooltip label="Keep this project reference with your session so the agent can return to the right files and decisions. You can remove it whenever you no longer need it.">
                  <Button>Long explanation</Button>
                </Tooltip>
              </div>
            </Card>
          </div>
        </section>
        <Foundations />
        <footer>
          Caelos UI · Panda recipes + accessible React behavior · Package
          preview
        </footer>
      </Surface>
    </CaelosProvider>
  );
}
