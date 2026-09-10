import { Toaster } from "../dist/index.js";
import { Foundations } from "./Foundations";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Plus, Folder, Settings, Mic } from "lucide-react";
import {
  CaelosProvider, Heading, Text, Surface,
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
  type ReplyFormat,
} from "../dist/index.js";
import "../dist/styles.css";
import "./preview.css";
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
          setEvent(`Sent: ${message.text} · ${message.replyFormat}`);
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
function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark"),
    [glass, setGlass] = useState(true),
    [reduced, setReduced] = useState(false),
    [status, setStatus] = useState("progress"),
    [filter, setFilter] = useState("Design"),
    [row, setRow] = useState("Taskgraph"),
    [tab, setTab] = useState("info"),
    [query, setQuery] = useState("");
  return (
    <CaelosProvider theme={theme} glass={glass} reducedMotion={reduced}>
      <Surface as="main">
        <header>
          <Text as="p" className="eyebrow">NOVA CAELUM · THE SHARED LIBRARY</Text>
          <Heading as="h1" size="display" data-heading>Approved design, reusable.</Heading>
          <Text as="p">
            The Panda components, rendered from the built package. Your design
            atlas remains the reference.
          </Text>
          <div className="line">
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
            controls call application handlers. Type / for sample commands and
            skills, or @ to tag a sample chat participant.
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
              <Tooltip label="Copy project reference" detail="CAE-208">
                <Button>Tooltip specimen</Button>
              </Tooltip>
            </Card>
          </div>
        </section>
        <section>
          <Heading as="h2" size="section" data-heading>Independent instances</Heading>
          <Compose id="secondary" />
        </section>
        <Foundations />
        <footer>
          Caelos UI · Panda recipes + accessible React behavior · Package
          preview
        </footer>
      </Surface>
    <Toaster />
    </CaelosProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
