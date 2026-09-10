import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Plus, Folder, Settings, Mic } from "lucide-react";
import {
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
  type ReplyFormat,
} from "../dist/index.js";
import "../dist/styles.css";
import "./preview.css";
function Compose({ id = "primary" }: { id?: string }) {
  const [value, setValue] = useState(""),
    [model, setModel] = useState("GPT-6 Astra"),
    [reasoning, setReasoning] = useState("High"),
    [format, setFormat] = useState<ReplyFormat>("text"),
    [live, setLive] = useState(false),
    [permission, setPermission] = useState("Ask before acting"),
    [event, setEvent] = useState("");
  return (
    <div data-composer-demo={id}>
      <Composer
        value={value}
        onValueChange={setValue}
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
      <main>
        <header>
          <p className="eyebrow">NOVA CAELUM · THE SHARED LIBRARY</p>
          <h1 data-heading>Approved design, reusable.</h1>
          <p>
            The Panda components, rendered from the built package. Your design
            atlas remains the reference.
          </p>
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
          <h2 data-heading>Surfaces & selection</h2>
          <div className="grid">
            <Card variant="glass">
              <h3>Depth without noise</h3>
              <p>Transparent surroundings. Calm, legible content.</p>
              <div className="line">
                <Button variant="primary">Create project</Button>
                <Button>Tonal action</Button>
                <Button variant="text">View details</Button>
              </div>
            </Card>
            <Card>
              <h3>A softer sidebar</h3>
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
              content: <p>{x} content</p>,
            }))}
          />
        </section>
        <section>
          <h2 data-heading>Writing feels like home</h2>
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
          <h2 data-heading>The conversation composer</h2>
          <p className="muted">
            Hover the brain and reply icons; click to keep choices open. These
            controls call application handlers.
          </p>
          <Compose />
        </section>
        <section>
          <h2 data-heading>Quiet scrolling</h2>
          <div className="grid">
            <Card>
              <ScrollArea
                viewportLabel="Scroll specimen"
                style={{ height: 220 }}
              >
                {Array.from({ length: 15 }, (_, i) => (
                  <p key={i}>A little room for thought. Item {i + 1}.</p>
                ))}
              </ScrollArea>
            </Card>
            <Card>
              <h3>Menus & tooltips</h3>
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
              <p>
                Press Tab to explore focus. Escape closes menus and returns to
                their controls.
              </p>
              <Tooltip label="Copy project reference" detail="CAE-208" open>
                <Button>Always visible tooltip specimen</Button>
              </Tooltip>
            </Card>
          </div>
        </section>
        <section>
          <h2 data-heading>Independent instances</h2>
          <Compose id="secondary" />
        </section>
        <footer>
          Caelos UI · Panda recipes + accessible React behavior · Package
          preview
        </footer>
      </main>
    </CaelosProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
