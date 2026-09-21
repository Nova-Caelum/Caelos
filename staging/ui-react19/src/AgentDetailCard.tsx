import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bot, Check, ChevronRight, FileText, Terminal } from "lucide-react";
import { agentDetail, headerControl } from "../styled-system/recipes/index.mjs";
import { Button, Input, Tooltip } from "./components";
import { ComposerChoice } from "./Composer";
import { Popover, PopoverContent, PopoverTrigger, Progress } from "./foundation";
import { Avatar } from "./components";
import { RippleLoader } from "./RippleLoader";
import { InlineCluster, SpacingDensity, Stack } from "./spacing";
import type { ConversationHeaderShape } from "./ConversationHeader";

const cx = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(" ");

export interface AgentPermissionOption {
  value: string;
  label: string;
  icon: ReactNode;
}

export interface AgentSubagent {
  name: string;
  /** One line about what it is doing. */
  activity?: ReactNode;
  working?: boolean;
}

export interface AgentBackgroundProcess {
  name: string;
  running?: boolean;
  /** 0-100. Shown as a dim trailing value; there is no second progress bar on the card. */
  progress?: number;
}

export interface AgentWorkingFile {
  name: string;
  active?: boolean;
}

export interface AgentDetailCardProps {
  name: string;
  /** Circle in the capsule variant, square in the rounded one. */
  shape: ConversationHeaderShape;
  /** The 60px avatar's meter. Pass the header's own `<ContextRing/>`. */
  contextRing?: ReactNode;
  avatarSrc?: string;
  /** Opens the agent profile / loadout. Tooltip only — no text label anywhere. */
  profilePopover?: ReactNode;
  profileLabel?: string;
  /** Harness mark, left of the surface word in the subtitle. */
  harness?: ReactNode;
  harnessLabel?: string;
  /** Running surface, click to edit. Empty renders "Add surface". */
  surface?: string;
  onSurfaceChange?: (value: string) => void;
  /** Rest is the icon alone; hover or focus adds the word; click opens the detail. */
  status: string;
  statusIcon: ReactNode;
  statusDetail?: ReactNode;
  since?: ReactNode;
  /** Warms the status icon and adds the honest "respond elsewhere" line. */
  blocked?: boolean;
  blockedNote?: ReactNode;
  /** Platform session id, Plex Mono, muted. */
  sessionId?: ReactNode;
  /** `null` is unavailable telemetry: a dashed track, never 0%. */
  used: number | null;
  capacity: number;
  permission: string;
  permissionOptions: AgentPermissionOption[];
  onPermissionChange: (value: string) => void;
  model: string;
  modelOptions: string[];
  onModelChange: (value: string) => void;
  reasoning: string;
  reasoningOptions: string[];
  onReasoningChange: (value: string) => void;
  /** The bot mark and the Subagents row render only when this has entries. */
  subagents?: AgentSubagent[];
  /** The Background row renders only when this has entries. */
  background?: AgentBackgroundProcess[];
  /** Drives the Working files count and the live items that show through when closed. */
  files?: AgentWorkingFile[];
  /** The opened Working files row — pass a wired `<WorkingFilesList/>`. */
  workingFiles?: ReactNode;
  /** Scopes this card's popovers so an outside-click never closes the header. */
  owner: string;
  className?: string;
}

function LiveItem({ name, value }: { name: ReactNode; value?: ReactNode }) {
  const styles = agentDetail();
  return (
    <InlineCluster className={styles.liveItem} data-nc-nowrap="">
      <RippleLoader size={12} label={`${typeof name === "string" ? name : "Item"} in progress`} />
      <span className={styles.itemName}>{name}</span>
      {value != null && <span className={styles.trailing}>{value}</span>}
    </InlineCluster>
  );
}

function WorkGroup({
  label, icon, summary, live, children,
}: {
  label: string; icon: ReactNode; summary: ReactNode; live: ReactNode; children: ReactNode;
}) {
  const styles = agentDetail();
  const [open, setOpen] = useState(false);
  return (
    <section className={styles.workGroup} aria-label={label}>
      <button
        type="button"
        className={styles.workTrigger}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {icon}
        <span>{label}</span>
        <span className={styles.workSummary}>{summary}</span>
        <ChevronRight size={13} className={styles.workChevron} aria-hidden="true" />
      </button>
      {!open && live}
      {open && <div className={styles.workContent}>{children}</div>}
    </section>
  );
}

/**
 * The approved Atlas 2 agent detail card, "profile" layout. Agent information only: Daniel,
 * intent ledger I17 — "the agent card should just be for agent info. things like the action
 * and questions should be somewhere else." No Allow / Decline, no answer field, no action
 * panel; question and permission PROMPTS belong to a later fleet interface, while the
 * permission SETTING lives here.
 *
 * Two planes in one 376px card. The agent plane is the glass itself; the session plane holds
 * what changes between sessions and is separated by space and a 30px material fade rather
 * than by a rule. Status reads icon at rest, word on hover or focus, detail on click. Work
 * rows are closed by default and anything in progress shows through beneath the closed row.
 *
 * Presentational and controlled throughout: every value and every callback is a prop.
 */
export function AgentDetailCard({
  name,
  shape,
  contextRing,
  avatarSrc,
  profilePopover,
  profileLabel = "Open agent profile",
  harness,
  harnessLabel,
  surface = "",
  onSurfaceChange,
  status,
  statusIcon,
  statusDetail,
  since,
  blocked = false,
  blockedNote = "Respond from fleet management (not built yet)",
  sessionId,
  used,
  capacity,
  permission,
  permissionOptions,
  onPermissionChange,
  model,
  modelOptions,
  onModelChange,
  reasoning,
  reasoningOptions,
  onReasoningChange,
  subagents = [],
  background = [],
  files = [],
  workingFiles,
  owner,
  className,
}: AgentDetailCardProps) {
  const styles = agentDetail();
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(surface);
  const surfaceButton = useRef<HTMLButtonElement>(null);
  const statusControls = useRef<HTMLDivElement>(null);
  const [detailOffset, setDetailOffset] = useState(1);

  /**
   * All three right-edge triggers share one offset so their popovers line up on the card's
   * outer border, not on the padded identity plane. Measured from the host popover rather
   * than assumed, and re-measured whenever either box changes.
   */
  const measureDetailOffset = useCallback(() => {
    const controls = statusControls.current;
    const card = controls?.closest<HTMLElement>("[data-nc-detail-host]");
    if (!controls || !card) return;
    setDetailOffset(
      card.getBoundingClientRect().right - controls.getBoundingClientRect().right + 1,
    );
  }, []);
  useLayoutEffect(() => {
    const controls = statusControls.current;
    const card = controls?.closest<HTMLElement>("[data-nc-detail-host]");
    if (!controls || !card) return;
    measureDetailOffset();
    const observer = new ResizeObserver(measureDetailOffset);
    observer.observe(card);
    observer.observe(controls);
    window.addEventListener("resize", measureDetailOffset);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureDetailOffset);
    };
  }, [measureDetailOffset]);

  const percent = used === null ? null : Math.round((used / capacity) * 100);
  const color =
    percent === null
      ? "var(--il-dim)"
      : percent >= 90
        ? "var(--sys-sem-danger)"
        : percent >= 80
          ? "var(--sys-sem-progress-hover)"
          : "var(--nc-sage)";
  const option = permissionOptions.find(item => item.value === permission) ?? permissionOptions[0];
  const workingSubs = subagents.filter(item => item.working);
  const doneSubs = subagents.filter(item => !item.working);
  const liveProcesses = background.filter(item => item.running);
  const activeFiles = files.filter(item => item.active);
  const finishSurface = () => {
    setEditing(false);
    requestAnimationFrame(() => surfaceButton.current?.focus());
  };

  return (
    <SpacingDensity value="default">
      <div
        className={cx(styles.root, headerControl({ kind: "agentCard" }), className)}
        data-nc-header-control=""
        data-shape={shape}
        data-composer-menu-surface
      >
        <div className={styles.agentPlane} data-nc-plane="agent">
          <Stack>
            <div className={styles.identity}>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={styles.avatar}
                    title={profileLabel}
                    aria-label={profileLabel}
                  >
                    <Avatar
                      name={name}
                      src={avatarSrc}
                      kind={shape === "capsule" ? "person" : "agent"}
                      size="lg"
                    />
                    {contextRing}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  data-header-owner={owner}
                  data-nc-header-control=""
                  className={headerControl({ kind: "smallPopover" })}
                  side="bottom"
                  align="start"
                  sideOffset={9}
                >
                  {profilePopover}
                </PopoverContent>
              </Popover>
              <div className={styles.identityText}>
                <span className={styles.name}>{name}</span>
                <div className={styles.subtitle}>
                  {harness != null && (
                    <Tooltip label={harnessLabel ?? ""} side="bottom" disabled={!harnessLabel}>
                      <span
                        className={styles.harness}
                        role="img"
                        aria-label={harnessLabel}
                        tabIndex={0}
                      >
                        {harness}
                      </span>
                    </Tooltip>
                  )}
                  <button
                    ref={surfaceButton}
                    className={styles.surface}
                    type="button"
                    aria-label={`Edit running surface: ${surface || "not set"}`}
                    aria-expanded={editing}
                    onClick={() => { setDraft(surface); setEditing(!editing); }}
                  >
                    {surface || "Add surface"}
                  </button>
                </div>
              </div>
              <Stack ref={statusControls} className={styles.statusControls}>
                <Popover onOpenChange={open => { if (open) measureDetailOffset(); }}>
                  <Tooltip label={status} side="right">
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={styles.status}
                        aria-label={status}
                        data-attention={blocked}
                      >
                        {statusIcon}
                      </button>
                    </PopoverTrigger>
                  </Tooltip>
                  <PopoverContent
                    data-header-owner={owner}
                    data-nc-header-control=""
                    data-detail="status"
                    aria-label="Agent status"
                    className={headerControl({ kind: "smallPopover" })}
                    side="right"
                    align="start"
                    sideOffset={detailOffset}
                    avoidCollisions
                    collisionPadding={12}
                  >
                    <Stack className={styles.detailBody}>
                      <strong>{status}</strong>
                      {statusDetail != null && <p>{statusDetail}</p>}
                      {since != null && <p className={styles.dim}>{since}</p>}
                      {blocked && <p>{blockedNote}</p>}
                    </Stack>
                  </PopoverContent>
                </Popover>

                <Popover
                  open={permissionOpen}
                  onOpenChange={open => { if (open) measureDetailOffset(); setPermissionOpen(open); }}
                >
                  <Tooltip label={option?.label ?? permission} side="right">
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={styles.status}
                        aria-label={`Permissions: ${option?.label ?? permission}`}
                      >
                        {option?.icon}
                      </button>
                    </PopoverTrigger>
                  </Tooltip>
                  <PopoverContent
                    data-header-owner={owner}
                    data-nc-header-control=""
                    data-detail="permissions"
                    className={headerControl({ kind: "smallPopover" })}
                    side="right"
                    align="start"
                    sideOffset={detailOffset}
                    avoidCollisions
                    collisionPadding={12}
                    aria-label="Permissions"
                  >
                    <Stack className={styles.detailBody}>
                      <strong>Permissions</strong>
                      <div className={styles.permissionOptions} role="group" aria-label="Permission level">
                        {permissionOptions.map(item => (
                          <Button
                            key={item.value}
                            type="button"
                            variant="text"
                            size="sm"
                            style={{ width: "100%", justifyContent: "flex-start", gap: "var(--sys-space-3, 9px)" }}
                            aria-pressed={option?.value === item.value}
                            onClick={() => { onPermissionChange(item.value); setPermissionOpen(false); }}
                          >
                            {item.icon}
                            <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                            {option?.value === item.value && <Check size={14} aria-hidden="true" />}
                          </Button>
                        ))}
                      </div>
                    </Stack>
                  </PopoverContent>
                </Popover>

                {subagents.length > 0 && (
                  <Popover onOpenChange={open => { if (open) measureDetailOffset(); }}>
                    <Tooltip label="Subagents & forks" side="right">
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={styles.status}
                          aria-label={`Subagents & forks: ${subagents.length}`}
                        >
                          <Bot size={18} aria-hidden="true" />
                        </button>
                      </PopoverTrigger>
                    </Tooltip>
                    <PopoverContent
                      data-header-owner={owner}
                      data-nc-header-control=""
                      data-detail="subagents"
                      className={headerControl({ kind: "smallPopover" })}
                      side="right"
                      align="start"
                      sideOffset={detailOffset}
                      avoidCollisions
                    collisionPadding={12}
                      aria-label="Subagents & forks"
                    >
                      <Stack className={styles.detailBody}>
                        <InlineCluster>
                          <strong>Subagents &amp; forks</strong>
                          <span className={styles.trailing}>
                            {workingSubs.length} working · {doneSubs.length} done
                          </span>
                        </InlineCluster>
                        {subagents.map(item => (
                          <div key={item.name}>
                            <InlineCluster>
                              {item.working && (
                                <RippleLoader size={12} label={`${item.name} in progress`} />
                              )}
                              <span>{item.name}</span>
                              <span className={styles.trailing}>
                                {item.working ? "Working" : "Done"}
                              </span>
                            </InlineCluster>
                            {item.activity != null && <p className={styles.dim}>{item.activity}</p>}
                          </div>
                        ))}
                      </Stack>
                    </PopoverContent>
                  </Popover>
                )}
              </Stack>
            </div>
            {editing && (
              <form
                onSubmit={event => {
                  event.preventDefault();
                  onSurfaceChange?.(draft.trim());
                  finishSurface();
                }}
              >
                <Stack>
                  <Input
                    autoFocus
                    label="Running surface"
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === "Escape") { event.stopPropagation(); finishSurface(); }
                    }}
                  />
                  <InlineCluster>
                    <Button type="submit" size="sm">Save</Button>
                    <Button type="button" size="sm" variant="text" onClick={finishSurface}>Cancel</Button>
                  </InlineCluster>
                </Stack>
              </form>
            )}
          </Stack>
        </div>

        <div className={styles.sessionPlane} data-nc-plane="session">
          <Stack>
            <div className={styles.sessionRow}>
              <span className={styles.sessionId}>{sessionId}</span>
            </div>
            <Stack className={styles.context}>
              <div className={styles.contextLabel}>
                <span>
                  {percent === null ? (
                    "Context unavailable"
                  ) : (
                    <>
                      <strong>{percent}%</strong> <span className={styles.dim}>context</span>
                    </>
                  )}
                </span>
                {used !== null && (
                  <span className={styles.dim}>
                    {Math.round(used / 1000)}k / {capacity / 1000}k
                  </span>
                )}
              </div>
              {used === null ? (
                <div className={styles.contextUnknown} role="img" aria-label="Context unavailable" />
              ) : (
                <Progress
                  value={used}
                  max={capacity}
                  label={`${name} context`}
                  style={{ "--sys-accent": color } as React.CSSProperties}
                />
              )}
              <InlineCluster className={styles.selectors} data-nc-nowrap="">
                <ComposerChoice
                  label="Model"
                  value={model}
                  options={modelOptions}
                  onValueChange={onModelChange}
                  menuOwner={owner}
                />
                <ComposerChoice
                  label="Reasoning"
                  value={reasoning}
                  options={reasoningOptions}
                  onValueChange={onReasoningChange}
                  menuOwner={owner}
                />
              </InlineCluster>
            </Stack>
            <Stack className={styles.work}>
              {background.length > 0 && (
                <WorkGroup
                  label="Background"
                  icon={<Terminal size={13} aria-hidden="true" />}
                  summary={`${liveProcesses.length} running`}
                  live={liveProcesses.map(item => (
                    <LiveItem
                      key={item.name}
                      name={item.name}
                      value={item.progress === undefined ? undefined : `${item.progress}%`}
                    />
                  ))}
                >
                  <Stack>
                    {background.map(item => (
                      <InlineCluster key={item.name}>
                        {item.running && (
                          <RippleLoader size={12} label={`${item.name} in progress`} />
                        )}
                        <span>{item.name}</span>
                        <span className={styles.trailing}>
                          {item.running ? "Running" : "Done"}
                          {item.progress === undefined ? "" : ` · ${item.progress}%`}
                        </span>
                      </InlineCluster>
                    ))}
                  </Stack>
                </WorkGroup>
              )}
              <WorkGroup
                label="Working files"
                icon={<FileText size={13} aria-hidden="true" />}
                summary={String(files.length)}
                live={activeFiles.map(item => <LiveItem key={item.name} name={item.name} />)}
              >
                <div data-nc-files="">{workingFiles}</div>
              </WorkGroup>
            </Stack>
          </Stack>
        </div>
      </div>
    </SpacingDensity>
  );
}
