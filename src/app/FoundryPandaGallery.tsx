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
  const [buildMessage, setBuildMessage] = useState(() => sessionStorage.getItem("caelos-foundry-ui-build") || "Ready to review");
  useEffect(() => {
    document.body.setAttribute("data-foundry-panda", "");
    return () => document.body.removeAttribute("data-foundry-panda");
  }, []);
  async function rebuild() {
    setBuilding(true);
    setBuildMessage("Building the shared library…");
    try {
      const response = await fetch("/__foundry/rebuild-ui", { method: "POST", headers: { "X-Caelos-Foundry": "rebuild-ui" } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Library rebuild failed");
      sessionStorage.setItem("caelos-foundry-ui-build", "Library rebuilt · " + new Date().toLocaleTimeString());
      window.location.reload();
    } catch (error) {
      setBuildMessage(error instanceof Error ? error.message : "Library rebuild failed");
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
      <div className="foundry-panda-content">
        <header>
          <p className="eyebrow">NOVA CAELUM · THE SHARED LIBRARY</p>
          <h1 data-heading>The approved collection.</h1>
          <p>
            Real package components with local demo data. Theme controls below apply to this collection. Application migration status is recorded in the shared package migration ledger.
          </p>
          <div className="line">
            {import.meta.env.DEV && <Button variant="primary" disabled={building} leadingIcon={<RefreshCw size={14} />} onClick={() => void rebuild()}>{building ? "Rebuilding…" : "Rebuild library"}</Button>}
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
            <p role="status">{buildMessage}</p>
            <p className="muted">Edit the shared package, then rebuild here to review the result. Rebuilding reloads this preview and clears demo inputs.</p>
          </> : <p className="muted">This collection uses the shared library included in this application release.</p>}
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
        <section aria-label="People and agents">
          <Disclosure title="People & agents" headingLevel={2} defaultOpen>
          <Card>
            <h3>Avatars</h3>
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
            <h3>Person chips</h3>
            <div className="line" style={{ flexWrap: "wrap" }}>
              {people.map(name => <PersonChip key={name} name={name} kind={name === "Hermes" ? "agent" : "person"} onRemove={() => setPeople(current => current.filter(person => person !== name))} />)}
              {people.length < 2 && <Button variant="text" onClick={() => setPeople(["Daniel", "Hermes"])}>Restore people</Button>}
            </div>
            <h3>User cards</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <UserCard name="Daniel Eghdami" description="Founder · Nova Caelum" actions={<Button variant="text" size="sm" onClick={() => setProfileMessage("Daniel Eghdami · Founder · Nova Caelum")}>Profile</Button>} />
              <UserCard name="Hermes" kind="agent" description="Agent · Workspace collaborator" actions={<Button variant="text" size="sm" onClick={() => setProfileMessage("Hermes · Agent · Workspace collaborator")}>Profile</Button>} />
            </div>
            <p role="status">{profileMessage || "Preview identities. Profile actions stay in this gallery."}</p>
          </Card>
          </Disclosure>
        </section>
        <section>
          <h2 data-heading>Breadcrumbs</h2>
          <Card>
            <Breadcrumb fullPath="Workspace / Projects / Design system">
              <BreadcrumbItem onClick={() => setBreadcrumbMessage("Preview navigation: Workspace")}>
                <Folder size={14} aria-hidden="true" /> Workspace
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem onClick={() => setBreadcrumbMessage("Preview navigation: Projects")}>
                Projects
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem current>Design system</BreadcrumbItem>
            </Breadcrumb>
            <p className="muted">Hover for the full path. Parent locations are clickable; the current page stays quiet.</p>
            {breadcrumbMessage && <p role="status">{breadcrumbMessage}</p>}
            <Breadcrumb
              aria-label="File path preview"
              fullPath="/Users/danieleghdami/NovaCaelum_code/Caelos-console/packages/ui/src/components.tsx"
              style={{ minWidth: 0, marginTop: 16 }}
            >
              <Folder size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                /Users/danieleghdami/NovaCaelum_code/Caelos-console/packages/ui/src/components.tsx
              </span>
            </Breadcrumb>
            <p className="muted">Hover or keyboard-focus the shortened file path to read its full location.</p>
          </Card>
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
            controls use local demo handlers; nothing is sent to an agent.
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
        <footer>
          Caelos UI · Panda recipes + accessible React behavior · Package
          preview
        </footer>
      </div>
    </CaelosProvider>
  );
}
