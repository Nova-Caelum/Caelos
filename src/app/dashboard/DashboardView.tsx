import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, ExternalLink, GitPullRequest, RefreshCw } from "lucide-react";
import {
  Badge, Button, Card, Chip, Drawer, Heading, Loading, Popover, PopoverContent, PopoverTrigger, Progress, Row,
  Separator, TabsContent, TabsList, TabsRoot, TabsTrigger, TaskRow, Text, LinkButton,
} from "@nova-caelum/ui";
import {
  completeQueueItem, fetchDashboard, fetchQueue,
  type Dashboard, type Panel, type QueueRow, type QueueState, type Tone,
} from "./data";
import "./dashboard.css";

/* One constant each, used everywhere. */
const WAITING_LABEL = "Waiting on you";
const IN_FLIGHT_LABEL = "In flight";

const openExternal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

/** Seconds as the largest two units: 1d 1h, 3h 20m, 12m. */
function formatLeft(seconds: number): string {
  if (seconds <= 0) return "Past deadline";
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${Math.max(1, m)}m left`;
}

/* ---------- per-panel state: error and unavailable stay inside their own box ---------- */
function PanelNote({ panel, retry, className }: { panel: { status: "error"; error: string } | { status: "unavailable"; reason: string }; retry?: () => void; className?: string }) {
  return (
    <div className={`nc-dash__note${className ? ` ${className}` : ""}`} role={panel.status === "error" ? "alert" : undefined}>
      <Text variant="small" tone="muted">
        {panel.status === "error" ? <>Could not load this panel. <Text variant="mono" tone="dim">{panel.error}</Text></> : panel.reason}
      </Text>
      {panel.status === "error" && retry && <Button size="sm" variant="text" onClick={retry}>Retry</Button>}
    </div>
  );
}
/** A panel reduced to a note, or its ok data. */
function withPanel<T>(panel: Panel<T>, retry: () => void, render: (data: Extract<Panel<T>, { status: "ok" }>) => ReactNode): ReactNode {
  return panel.status === "ok" ? render(panel as Extract<Panel<T>, { status: "ok" }>) : <PanelNote panel={panel} retry={retry} />;
}

/* ---------- Refresh: idle -> Refreshing... -> Updated <time> | error with Retry ---------- */
type RefreshPhase = { phase: "idle" } | { phase: "loading" } | { phase: "done"; at: string } | { phase: "error" };
const nowLabel = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function RefreshButton({ phase, onRefresh }: { phase: RefreshPhase; onRefresh: () => void }) {
  const label = phase.phase === "idle" ? "Refresh"
    : phase.phase === "loading" ? "Refreshing…"
    : phase.phase === "done" ? `Updated ${phase.at}`
    : "Refresh failed · Retry";
  const icon = phase.phase === "done" ? <Check size={15} /> : <RefreshCw size={15} data-spinning={phase.phase === "loading" || undefined} />;
  return (
    <>
      <Button className="nc-dash__refresh" data-phase={phase.phase} loading={phase.phase === "loading"} danger={phase.phase === "error"} leadingIcon={icon} onClick={onRefresh}>
        {label}
      </Button>
      <span className="nc-dash__sr" role="status" aria-live="polite">{phase.phase === "idle" ? "" : label}</span>
    </>
  );
}

/* ---------- health chips, derived from the runtime_deploys and ci panels ---------- */
interface ChipModel {
  id: string; tone: Tone; label: string; title: string; cause: string; causeMono?: boolean; fix?: string;
  links: { label: string; href: string; primary?: boolean }[]; retryable?: boolean;
}
function healthChips(p: Dashboard["panels"]): ChipModel[] {
  const chips: ChipModel[] = [];
  const rt = p.runtime_deploys;
  if (rt.status === "ok") {
    if (rt.current === false) chips.push({ id: "runtime", tone: "progress", label: "Runtime stale", title: "Runtime is stale", cause: `installed ${rt.installed_sha ?? "unknown"}, origin/main ${rt.origin_main_sha ?? "unknown"}`, causeMono: true, fix: "Run /deploy-runtime", links: [] });
    else if (rt.current === null) chips.push({ id: "runtime", tone: "neutral", label: "Runtime unknown", title: "Runtime state unknown", cause: "Cannot tell whether the installed runtime matches origin/main.", links: [] });
  } else chips.push({ id: "runtime", tone: "neutral", label: rt.status === "error" ? "Runtime error" : "Runtime unavailable", title: "Runtime check", cause: rt.status === "error" ? rt.error : rt.reason, causeMono: rt.status === "error", links: [], retryable: rt.status === "error" });
  const ci = p.ci;
  if (ci.status === "ok") {
    if (ci.red.length > 0) chips.push({
      id: "ci", tone: "danger", label: `CI ${ci.red.length} red`, title: ci.red.length === 1 ? "CI is failing" : "CI is failing in several repos",
      cause: ci.red.map(r => `${r.repo}: ${r.workflow}`).join("; "), fix: "Open the run, read the failing step, push the fix.",
      links: ci.red.filter(r => r.url).slice(0, 3).map((r, i) => ({ label: ci.red.length === 1 ? "Open the run" : `Open ${r.repo}`, href: r.url as string, primary: i === 0 })),
    });
  } else chips.push({ id: "ci", tone: "neutral", label: ci.status === "error" ? "CI error" : "CI unavailable", title: "CI check", cause: ci.status === "error" ? ci.error : ci.reason, causeMono: ci.status === "error", links: [], retryable: ci.status === "error" });
  return chips;
}

function HealthChipView({ chip, retry }: { chip: ChipModel; retry: () => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Chip variant="status" tone={chip.tone} leadingIcon={<Badge variant="dot" tone={chip.tone} aria-hidden="true" />}>{chip.label}</Chip>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={`${chip.title}: cause and fix`} className="nc-dash__pop">
        <div className="nc-dash__stack">
          <Heading as="h2" size="title">{chip.title}</Heading>
          <div className="nc-dash__fact"><Text variant="label" tone="dim">Cause</Text><Text variant={chip.causeMono ? "mono" : "body"}>{chip.cause}</Text></div>
          {chip.fix && <div className="nc-dash__fact"><Text variant="label" tone="dim">Fix</Text><Text variant={chip.causeMono ? "mono" : "body"}>{chip.fix}</Text></div>}
          {(chip.links.length > 0 || chip.retryable) && (
            <div className="nc-dash__actionrow">
              {chip.links.map(l => <LinkButton key={l.label} size="sm" variant={l.primary ? "primary" : "tonal"} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</LinkButton>)}
              {chip.retryable && <Button size="sm" onClick={retry}>Retry</Button>}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------- Workstream queue: open rows assigned to daniel, each with Complete ---------- */
type RowPhase = "busy" | "done" | "error";
/* TaskRow's built-in statuses are ready / progress / done / danger; pending-review falls through as its own label. */
const TASKROW_STATUS: Record<QueueState, string> = { ready: "ready", "in-progress": "progress", blocked: "danger", "pending-review": "pending-review" };

/** Row descriptions carry Go / look / send; https links in them are clickable. */
function Linkified({ text }: { text: string }) {
  return <>{text.split(/(https:\/\/[^\s]+)/g).map((part, i) =>
    /^https:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : <Fragment key={i}>{part}</Fragment>)}</>;
}

function QueueDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<QueueRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phases, setPhases] = useState<Record<string, RowPhase>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const load = useCallback(() => {
    setLoadError(null);
    setItems(null);
    fetchQueue().then(q => setItems(q.rows), (e: Error) => setLoadError(e.message));
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const complete = (item: QueueRow) => {
    setPhases(p => ({ ...p, [item.id]: "busy" }));
    completeQueueItem(item.id).then(() => {
      setPhases(p => ({ ...p, [item.id]: "done" }));
      timers.current.push(setTimeout(() => {
        setItems(list => (list ?? []).filter(i => i.id !== item.id));
        setPhases(p => { const { [item.id]: _removed, ...rest } = p; return rest; });
      }, 800));
    }, () => setPhases(p => ({ ...p, [item.id]: "error" })));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Workstream queue" description="Open Task Graph rows assigned to daniel." bodyLabel="Workstream queue rows" closeLabel="Close queue" className="nc-dash__drawer">
      {loadError ? (
        <div className="nc-dash__stack nc-dash__state">
          <Text>The queue did not load. <Text variant="mono" tone="dim">{loadError}</Text></Text>
          <div><Button size="sm" onClick={load}>Retry</Button></div>
        </div>
      ) : items === null ? (
        <Loading>Loading the queue…</Loading>
      ) : items.length === 0 ? (
        <Text tone="muted" className="nc-dash__state">The queue is clear. Nothing is assigned to you.</Text>
      ) : (
        <ul className="nc-dash__queue" aria-label="Rows assigned to you">
          {items.map(item => {
            const phase = phases[item.id];
            const label = phase === "busy" ? "Completing…" : phase === "done" ? "Done" : phase === "error" ? "Retry" : "Complete";
            return (
              <li key={item.id} data-phase={phase}>
                <TaskRow
                  className="nc-dash__row" title={item.name} shortId={item.short_id} status={TASKROW_STATUS[item.state]} onOpen={item.link ? () => openExternal(item.link as string) : undefined}
                  metadata={<Text variant="mono" tone="dim" className="nc-dash__project">{item.project}</Text>}
                  actions={
                    <Button size="sm" variant="tonal" danger={phase === "error"} loading={phase === "busy"}
                      disabled={phase === "done"} data-complete={phase ?? "idle"}
                      leadingIcon={phase === "busy" ? undefined : <Check size={14} />} onClick={() => complete(item)}
                      aria-label={`${label}: ${item.short_id ?? item.id} ${item.name}`}>{label}</Button>
                  }
                />
                {item.description && <Text variant="small" tone="muted" className="nc-dash__desc"><Linkified text={item.description} /></Text>}
                {phase === "error" && <Text variant="small" className="nc-dash__rowerror" role="alert">Could not close {item.short_id ?? "the row"}. It is still open. Retry.</Text>}
                {phase === "done" && <span className="nc-dash__sr" role="status">{item.short_id ?? item.id} done</span>}
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}

/* ---------- Next priority: depth-indented numbered outline ---------- */
function Outline({ items }: { items: { depth: number; text: string }[] }) {
  const counters: number[] = [];
  return (
    <ol className="nc-dash__priority">
      {items.map((item, i) => {
        const d = Math.max(0, item.depth);
        counters[d] = (counters[d] ?? 0) + 1;
        counters.length = d + 1;
        return (
          <li key={i} data-depth={d} style={{ "--depth": d } as CSSProperties}>
            <Text tone="dim" className="nc-dash__num">{counters[d]}.</Text>
            <Text className={d === 0 ? "nc-dash__strong" : undefined}>{item.text}</Text>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- the page ---------- */
export function DashboardView({ onOpenTaskGraph }: { onOpenTaskGraph: () => void }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loadFailed, setLoadFailed] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<RefreshPhase>({ phase: "idle" });
  const [tab, setTab] = useState("waiting");
  const [queueOpen, setQueueOpen] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefresh({ phase: "loading" });
    else setLoadFailed(null);
    try {
      const next = await fetchDashboard();
      if (!mounted.current) return;
      setData(next);
      if (isRefresh) setRefresh({ phase: "done", at: nowLabel() });
    } catch (error) {
      if (!mounted.current) return;
      if (isRefresh) setRefresh({ phase: "error" }); else setLoadFailed((error as Error).message);
    }
  }, []);
  useEffect(() => { void load(false); }, [load]);
  const onRefresh = () => { if (refresh.phase !== "loading") void load(true); };
  /* A per-panel Retry re-calls the same fetch. */
  const retry = () => void load(true);

  const p = data?.panels;
  const waiting = p?.waiting_on_daniel;
  const waitingBadge = waiting?.status === "ok" ? String(waiting.count) : "–";
  const inFlightCount = p ? (p.workstream.status === "ok" && p.workstream.live ? 1 : 0) + (p.loops.status === "ok" ? p.loops.count : 0) : 0;
  const chips = p ? healthChips(p) : [];

  return (
    <div className="nc-dash" data-dashboard>
      <div className="nc-dash__page" role="region" aria-label="Dashboard">
        <header className="nc-dash__top">
          <div className="nc-dash__identity">
            <Heading as="h1" size="page">Dashboard</Heading>
            {chips.length > 0 && (
              <div className="nc-dash__cluster" role="group" aria-label="System health">
                {chips.map(chip => <HealthChipView key={chip.id} chip={chip} retry={retry} />)}
              </div>
            )}
          </div>
          <div className="nc-dash__actionrow nc-dash__actions">
            <Button onClick={onOpenTaskGraph}>Task Graph</Button>
            <Button onClick={() => setQueueOpen(true)}>Workstream queue</Button>
            <RefreshButton phase={refresh} onRefresh={onRefresh} />
          </div>
        </header>

        {loadFailed !== null ? (
          <Card className="nc-dash__block">
            <div className="nc-dash__stack nc-dash__state">
              <Text>The dashboard did not load. <Text variant="mono" tone="dim">{loadFailed}</Text></Text>
              <div><Button onClick={() => void load(false)}>Retry</Button></div>
            </div>
          </Card>
        ) : !p || !waiting ? (
          <Loading>Loading the dashboard…</Loading>
        ) : (
          <>
            <Card className="nc-dash__block">
              <TabsRoot value={tab} onValueChange={setTab}>
                <TabsList aria-label="Dashboard views">
                  <TabsTrigger value="waiting">{WAITING_LABEL}<Badge tone="progress">{waitingBadge}</Badge></TabsTrigger>
                  <TabsTrigger value="flight">{IN_FLIGHT_LABEL}<Badge>{inFlightCount}</Badge></TabsTrigger>
                </TabsList>
                {/* Both panels stay mounted in one grid cell so the box never changes height between tabs. */}
                <div className="nc-dash__panels">
                  <TabsContent value="waiting" forceMount className="nc-dash__panel">
                    {waiting.status !== "ok" ? <PanelNote panel={waiting} retry={retry} className="nc-dash__panelnote" /> : (
                      <div className="nc-dash__waiting">
                        <div className="nc-dash__count">
                          <Text className="nc-dash__big" aria-label={`${waiting.count} waiting`}>{waiting.count}</Text>
                          <Text variant="small" tone="muted">
                            {waiting.prs.status === "ok" ? `${waiting.prs.total} held pull ${waiting.prs.total === 1 ? "request" : "requests"}` : "Pull requests not counted"} and {waiting.queue_rows.length} {waiting.queue_rows.length === 1 ? "row" : "rows"} in your queue
                          </Text>
                        </div>
                        <div className="nc-dash__lists">
                          <section aria-label="Pull requests">
                            <div className="nc-dash__label"><Text variant="label" tone="dim">Pull requests</Text>{waiting.prs.status === "ok" && <Text variant="mono" tone="dim">{waiting.prs.total}</Text>}</div>
                            {waiting.prs.status === "ok" ? (
                              <>
                                {waiting.prs.groups.flatMap(g => g.items.map(pr => (
                                  <Row key={`${g.repo}#${pr.number}`} variant="list" className="nc-dash__row" leadingIcon={<GitPullRequest size={16} />}
                                    trailing={<ExternalLink size={14} aria-hidden="true" />} onClick={() => openExternal(pr.url)}>
                                    <Text variant="mono" tone="dim" className="nc-dash__coord">{g.repo} #{pr.number}</Text> {pr.title}
                                  </Row>
                                )))}
                                {waiting.prs.repins.map(r => (
                                  <Row key={`repin-${r.repo}#${r.number}`} variant="list" className="nc-dash__row" leadingIcon={<GitPullRequest size={16} />}
                                    trailing={<ExternalLink size={14} aria-hidden="true" />} onClick={() => openExternal(r.url)}>
                                    <Text variant="mono" tone="dim" className="nc-dash__coord">{r.repo} #{r.number}</Text> <Text tone="muted">Reviewer re-pin</Text>
                                  </Row>
                                ))}
                                {waiting.prs.total === 0 && waiting.prs.repins.length === 0 && <Text variant="small" tone="muted" className="nc-dash__note">No pull requests are waiting.</Text>}
                              </>
                            ) : <PanelNote panel={waiting.prs.status === "error" ? { status: "error", error: "pull_requests" } : { status: "unavailable", reason: "Pull requests are not available from the cloud yet." }} retry={retry} />}
                          </section>
                          <section aria-label="Your queue">
                            <div className="nc-dash__label"><Text variant="label" tone="dim">Your queue</Text>{waiting.queue_status === "ok" && <Text variant="mono" tone="dim">{waiting.queue_rows.length}</Text>}</div>
                            {waiting.queue_status === "ok" ? (
                              waiting.queue_rows.length === 0
                                ? <Text variant="small" tone="muted" className="nc-dash__note">Nothing is assigned to you.</Text>
                                : waiting.queue_rows.map(row => (
                                  <TaskRow key={row.id} className="nc-dash__row" status={TASKROW_STATUS[row.state]} title={row.name} shortId={row.short_id} onOpen={row.link ? () => openExternal(row.link as string) : undefined} />
                                ))
                            ) : <PanelNote panel={waiting.queue_status === "error" ? { status: "error", error: "task_graph" } : { status: "unavailable", reason: "The Task Graph is not available from the cloud yet." }} retry={retry} />}
                          </section>
                          <section aria-label="Rows to decide">
                            <div className="nc-dash__label"><Text variant="label" tone="dim">To decide</Text></div>
                            <PanelNote panel={waiting.rows_to_decide} />
                          </section>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="flight" forceMount className="nc-dash__panel">
                    <div className="nc-dash__flight">
                      <section aria-label="Workstream">
                        <div className="nc-dash__label"><Text variant="label" tone="dim">Workstream</Text></div>
                        {withPanel(p.workstream, retry, ws => !ws.live ? <Text variant="small" tone="muted" className="nc-dash__note">No workstream is running.</Text> : (
                          <>
                            <div className="nc-dash__stream">
                              <Text className="nc-dash__left">{ws.seconds_left === null ? "No deadline" : formatLeft(ws.seconds_left)}</Text>
                              {ws.slug && <Text variant="mono" tone="dim">{ws.slug}</Text>}
                            </div>
                            <ul className="nc-dash__agents">
                              {ws.agents.map(a => (
                                <li key={a.name}>
                                  <Text title={[a.state, a.note].filter(Boolean).join(": ") || undefined}>{a.name}</Text>
                                  {a.used === null || a.budget === null
                                    ? <span className="nc-dash__unknown" aria-hidden="true" />
                                    : <Progress value={a.used} max={a.budget} label={`${a.name} stamina`} />}
                                  <Text variant="mono" tone="muted" aria-label={a.used === null || a.budget === null ? "unknown" : `${a.used} of ${a.budget}`}>{a.used ?? "?"}/{a.budget ?? "?"}</Text>
                                </li>
                              ))}
                            </ul>
                          </>
                        ))}
                      </section>
                      <Separator orientation="vertical" className="nc-dash__rule" />
                      <section aria-label="Loops">
                        <div className="nc-dash__label"><Text variant="label" tone="dim">Loops</Text>{p.loops.status === "ok" && <Text variant="mono" tone="dim">{p.loops.count}</Text>}</div>
                        {withPanel(p.loops, retry, loops => loops.items.length === 0 ? <Text variant="small" tone="muted" className="nc-dash__note">No loops are open.</Text> : loops.items.map(l => {
                          const live = l.status === "live";
                          const tone: Tone = live ? "sage" : l.node === "executing" ? "progress" : l.node === "deciding" || l.node === "understanding" ? "ready" : "neutral";
                          return (
                            <Row key={l.goal} variant="list" className="nc-dash__row"
                              trailing={<>{live && <Badge className="nc-dash__yours">your test</Badge>}<Badge tone={tone}>{live ? "live" : l.node ?? l.status}</Badge></>}>
                              <Text variant="mono">{l.goal}</Text>
                            </Row>
                          );
                        }))}
                      </section>
                    </div>
                  </TabsContent>
                </div>
              </TabsRoot>
            </Card>

            <div className="nc-dash__lower">
              <section aria-labelledby="nc-dash-priority">
                <div className="nc-dash__label"><Text variant="label" tone="dim" id="nc-dash-priority">Next priority</Text></div>
                {withPanel(p.next_priority, retry, np => np.items.length === 0 ? <Text variant="small" tone="muted" className="nc-dash__note">No priorities are set.</Text> : <Outline items={np.items} />)}
              </section>
              <section aria-labelledby="nc-dash-crazy">
                <div className="nc-dash__label"><Text variant="label" tone="dim" id="nc-dash-crazy">Driving you crazy</Text></div>
                {withPanel(p.crazy_list, retry, cl => cl.entries.length === 0 ? <Text variant="small" tone="muted" className="nc-dash__note">Nothing is driving you crazy.</Text> : (
                  <ul className="nc-dash__crazy">
                    {cl.entries.map(e => (
                      <li key={e.name}>
                        <div className="nc-dash__crazytext"><Text>{e.name}</Text><Text variant="small" tone="muted">{e.note}</Text></div>
                        <Badge>{e.area}</Badge>
                      </li>
                    ))}
                  </ul>
                ))}
              </section>
            </div>
          </>
        )}
      </div>
      <QueueDrawer open={queueOpen} onOpenChange={setQueueOpen} />
    </div>
  );
}
