import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useId,
} from "react";
import {
  MessageSquare,
  Volume2,
  Captions,
  Folder,
  Bot,
  Goal,
  X,
  FileText,
  AudioLines,
  ArrowUp,
  Plus,
  Mic,
  KeyRound,
  Brain,
  Square,
  Check,
  Hand,
  Rocket,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Popover from "@radix-ui/react-popover";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { button, card, headerControl } from "../styled-system/recipes/index.mjs";
import { AgentAvatar } from "./AgentMessage";
import { TextArea, Tooltip as CaelosTooltip } from "./components";
import { themeAttributes, useCaelosTheme } from "./theme";
import { useComposerSuggestions } from "./composer-commands";

// The writing surface is the shared vertical anchor for composer popovers.
const ComposerAnchor = createContext(null);
const ComposerReducedMotion = createContext(false);
const PermissionsIcon = KeyRound;
function useComposerDock(side = "top") {
  const shell = useContext(ComposerAnchor),
    trigger = useRef(null);
  const [gap, setGap] = useState(0);
  useLayoutEffect(() => {
    if (!shell || !trigger.current) return;
    // Layout offsets keep nested menus anchored while their parent surface animates.
    const measure = () => {
      const el = trigger.current;
      if (shell.contains(el)) {
        let top = 0,
          node = el;
        while (node && node !== shell) {
          top += node.offsetTop;
          node = node.offsetParent;
        }
        if (node === shell) {
          top += shell.clientTop;
          setGap(
            side === "bottom"
              ? shell.offsetHeight - top - el.offsetHeight
              : top,
          );
          return;
        }
      }
      const control = el.getBoundingClientRect(),
        surface = shell.getBoundingClientRect();
      setGap(
        side === "bottom"
          ? surface.bottom - control.bottom
          : control.top - surface.top,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    observer.observe(trigger.current);
    const bridge = trigger.current.closest(".nc-composer-docked-bridge");
    if (bridge) observer.observe(bridge);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [shell, side]);
  return { trigger, gap };
}
// Compact pickers prefer the approved below-bar dock. Near a viewport edge,
// flip above the writing surface and clamp horizontally without moving controls.
function useCompactDock(open, root, bridge, rightOffset) {
  const shell = useContext(ComposerAnchor);
  const [layout, setLayout] = useState({ style: {}, side: "bottom" });
  useLayoutEffect(() => {
    if (open === "closed" || !root.current || !bridge.current || !shell) return;
    const measure = () => {
      const control = root.current.getBoundingClientRect(),
        surface = shell.getBoundingClientRect();
      const width = bridge.current.offsetWidth,
        height = bridge.current.firstElementChild.offsetHeight;
      // Include the visible 2px shell gap when deciding whether the picker fits.
      const edgeGap = parseFloat(getComputedStyle(shell).getPropertyValue("--nc-composer-dock-edge-gap")) || 3;
      // innerHeight rounds fractional CSS pixels at zoom; use the visible floor.
      const viewport = window.visualViewport;
      const floor = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      const below = floor - surface.bottom - edgeGap - 2,
        above = surface.top - 12;
      const side = below + 0.5 < height && above > below ? "top" : "bottom";
      let right = rightOffset;
      const left = control.right - right - width;
      if (left < 12) right -= 12 - left;
      if (control.right - right > window.innerWidth - 12)
        right += control.right - right - window.innerWidth + 12;
      const style = {
        right,
        top: side === "bottom" ? "100%" : "auto",
        bottom: side === "top" ? "100%" : "auto",
        paddingTop:
          side === "bottom" ? Math.max(0, surface.bottom - control.bottom) : 0,
        paddingBottom:
          side === "top" ? Math.max(0, control.top - surface.top) : 0,
      };
      setLayout((previous) =>
        JSON.stringify(previous) == JSON.stringify({ style, side })
          ? previous
          : { style, side },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    observer.observe(bridge.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, shell, rightOffset]);
  return layout;
}
const formats = [
  { id: "text", label: "Text", Icon: MessageSquare },
  { id: "voice", label: "Voice", Icon: Volume2 },
  { id: "both", label: "Text + voice", Icon: Captions },
];
function Hint({ label, children, disabled = false, side = "top" }) {
  return (
    <CaelosTooltip label={label} side={side} disabled={disabled || !label}>
      {children}
    </CaelosTooltip>
  );
}
function ReplyFormat({ value, onChange, mode, review, agents, activeAgentId, onActiveAgentChange, models, reasoningLevels }) {
  const [reviewTableOpen, setReviewTableOpen] = useState(false);
  const menuId = useId();
  const { trigger: dockRoot, gap } = useComposerDock("bottom");
  const [open, setOpen] = useState("closed");
  const root = useRef(null),
    trigger = useRef(null),
    timer = useRef(null),
    options = useRef([]);
  const childOpen = useRef(false);
  const owner = useId();
  const bridge = useRef(null),
    dock = useCompactDock(open, root, bridge, -39);
  const selected = formats.find((f) => f.id === value) || formats[0];
  const lastExpanded = useRef(false);
  if (open !== "closed") lastExpanded.current = open === "pinned";
  const cancel = () => clearTimeout(timer.current);
  const close = () => {
    cancel();
    setOpen("closed");
  };
  const enter = (e) => {
    if (e.pointerType === "touch") return;
    cancel();
    setOpen((s) => (s === "closed" ? "hover" : s));
  };
  const leave = () => {
    cancel();
    timer.current = setTimeout(
      () => { if (!childOpen.current) setOpen((s) => (s === "hover" ? "closed" : s)); },
      260,
    );
  };
  const pendingFocus = useRef(null);
  const focusOption = (i) => options.current[i]?.focus();
  useLayoutEffect(() => {
    if (open === "pinned" && pendingFocus.current !== null) {
      focusOption(pendingFocus.current);
      pendingFocus.current = null;
    }
  }, [open]);
  useEffect(() => {
    const outside = (e) => {
      if (!root.current?.contains(e.target) && e.target.closest?.("[data-model-owner]")?.getAttribute("data-model-owner") !== owner) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <div
      className="nc-composer-reply"
      ref={(el) => {
        root.current = el;
        dockRoot.current = el;
      }}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onBlur={(e) => {
        if (!childOpen.current && !e.currentTarget.contains(e.relatedTarget)) close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !childOpen.current) {
          e.preventDefault();
          e.stopPropagation();
          close();
          trigger.current?.focus({ preventScroll: true });
        }
      }}
    >
      <Hint label="Change Output mode" disabled={!!review && reviewTableOpen}>
        <button
          type="button"
          ref={trigger}
          className="nc-composer-icon nc-composer-format-trigger"
          aria-label={`Reply format: ${selected.label}`}
          aria-haspopup="menu"
          aria-expanded={open !== "closed"}
          aria-controls={open !== "closed" ? menuId : undefined}
          onClick={() => {
            cancel();
            setOpen((s) => (s === "pinned" ? "closed" : "pinned"));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              pendingFocus.current = formats.findIndex((f) => f.id === value);
              setOpen("pinned");
              if (open === "pinned") {
                focusOption(pendingFocus.current);
                pendingFocus.current = null;
              }
            }
          }}
        >
          <selected.Icon size={18} />
        </button>
      </Hint>
      <div
        ref={bridge}
        className="nc-composer-format-bridge nc-composer-docked-bridge"
        data-dock={dock.side}
        style={{ paddingTop: gap, ...dock.style }}
        data-open={open !== "closed"}
        inert={open === "closed"}
        aria-hidden={open === "closed"}
        data-expanded={lastExpanded.current}
      >
        <div
          id={menuId}
          className="nc-composer-format-menu"
          role="menu"
          aria-label="Reply format"
          data-expanded={lastExpanded.current}
          data-composer-menu-surface={review ? "" : undefined}
          data-agent-review={review && agents?.length > 1 ? "true" : undefined}
          onKeyDown={(e) => {
            if (e.target.closest?.(".nc-composer-review-table, .nc-composer-review-agent")) return;
            const index = options.current.indexOf(document.activeElement);
            if (
              [
                "ArrowRight",
                "ArrowLeft",
                "ArrowDown",
                "ArrowUp",
                "Home",
                "End",
              ].includes(e.key)
            ) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? 2
                    : (index +
                        (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : 2)) %
                      3;
              focusOption(next);
            }
          }}
        >
          {review && agents?.length > 1 && <ReviewAgentSelector
            review={review} agents={agents} activeAgentId={activeAgentId}
            onActiveAgentChange={onActiveAgentChange} models={models} reasoningLevels={reasoningLevels}
            mode={mode} owner={owner} context="reply" expanded={open === "pinned"}
            onPresenceChange={(present) => { childOpen.current = present; setReviewTableOpen(present); cancel(); }}
            onPin={() => setOpen("pinned")} />}
          {formats.map(({ id, label, Icon }, i) => (
            <button
              key={id}
              type="button"
              ref={(el) => (options.current[i] = el)}
              className="nc-composer-format-option"
              role="menuitemradio"
              aria-checked={value === id}
              aria-label={label}
              onClick={() => {
                onChange(id);
                close();
                trigger.current?.focus({ preventScroll: true });
              }}
            >
              <Icon size={18} />
              <span className="nc-composer-format-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
// Dock to the complete surface on either side, not to the button inside it.
// Radix reuses sideOffset when it flips, so a top-only offset leaves a large
// gap below the composer. Choose the side and its matching offset together.
function useSurfaceMenuDock(open, enabled, trigger, content, anchor = null, preferredSide = "top") {
  const [layout, setLayout] = useState(null);
  useLayoutEffect(() => {
    // Retain the final dock while Radix plays the closing animation.
    if (!open || !enabled) return;
    let frame;
    const measure = () => {
      const button = trigger.current;
      const card = anchor ?? button?.closest(".nc-composer-model-settings, [data-composer-menu-surface]");
      const menu = content.current;
      if (card && menu) {
        const field = button.getBoundingClientRect();
        const surface = card.getBoundingClientRect();
        const topCushion = anchor ? 2 : 0;
        const bottomCushion = anchor ? 0.5 : 0;
        const above = Math.max(0, surface.top - 12 - topCushion);
        const below = Math.max(0, window.innerHeight - surface.bottom - 12 - bottomCushion);
        const height =
          menu.scrollHeight + menu.offsetHeight - menu.clientHeight;
        const side = above >= height || above >= below ? "top" : "bottom";
        const next = preferredSide === "right" ? {
          side: "right",
          gap: Math.max(0, surface.right - field.right) + 9,
          maxHeight: Math.max(0, window.innerHeight - 24),
        } : {
          side,
          gap: Math.max(
            0,
            side === "top"
              ? field.top - surface.top + topCushion
              : surface.bottom - field.bottom + bottomCushion,
          ),
          maxHeight: side === "top" ? above : below,
        };
        setLayout((previous) =>
          previous &&
          previous.side === next.side &&
          Math.abs(previous.gap - next.gap) < 0.1 &&
          Math.abs(previous.maxHeight - next.maxHeight) < 0.1
            ? previous
            : next,
        );
      }
      // Follow the parent card's existing emergence/label animation and scrolling.
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [open, enabled, trigger, content, anchor, preferredSide]);
  return layout;
}
// Preserve the rendered frame when a click interrupts emergence. The floating
// wrapper also stays put while its settings-card anchor retreats underneath it.
function captureMenuExit(content) {
  const menu = content.current;
  if (!menu) return;
  const style = getComputedStyle(menu);
  menu.style.setProperty("--rc-exit-opacity", style.opacity);
  menu.style.setProperty("--rc-exit-transform", style.transform);
  if (menu.hasAttribute("data-model-owner")) {
    const wrapper = menu.parentElement;
    wrapper?.style.setProperty(
      "--rc-exit-position", getComputedStyle(wrapper).transform,
    );
  }
}
function Choice({
  label,
  icon: Icon,
  items,
  value,
  onChange,
  mode,
  showLabel = false,
  kind = "",
  align = "end",
  onOpenChange,
  menuOwner,
  side = "top",
  hint = label,
  hintSide = "top",
  animated = false,
  settingMenu = false,
  renderValue,
  renderItem,
  itemText,
  disabled = false,
}) {
  const { trigger, gap } = useComposerDock(side);
  const settings = useCaelosTheme();
  const reduced = useContext(ComposerReducedMotion),
    [open, setOpen] = useState(false);
  const content = useRef(null);
  const interactedOutside = useRef(false);
  const nestedDock = useSurfaceMenuDock(open, !!menuOwner, trigger, content, null, side);
  // Open on completed click, preserving the same pointer and keyboard contract.
  const changeOpen = (value) => {
    if (value) {
      interactedOutside.current = false;
      // Presence can reuse an exiting menu, so its mount autofocus will not rerun.
      if (content.current) requestAnimationFrame(() => {
        if (content.current?.dataset.state === "open") content.current.focus();
      });
    } else captureMenuExit(content);
    setOpen(value);
    onOpenChange?.(value);
  };
  return (
    <Dropdown.Root open={open} onOpenChange={changeOpen} modal={!menuOwner}>
      <Hint label={hint} mode={mode} side={hintSide} disabled={open}>
        <Dropdown.Trigger asChild>
          <button
            type="button"
            ref={trigger}
            onPointerDown={(e) => {
              if (e.button === 0 && !e.ctrlKey) e.preventDefault();
            }}
            onClick={() => changeOpen(!open)}
            className={
              showLabel ? `nc-composer-model ${kind}` : "nc-composer-icon"
            }
            aria-label={label}
            disabled={disabled}
          >
            {Icon && <Icon size={17} />}{" "}
            {renderValue ? renderValue(value) : showLabel && value}
          </button>
        </Dropdown.Trigger>
      </Hint>
      <Dropdown.Portal>
        <Dropdown.Content
          {...themeAttributes(settings)}
          className={`${settingMenu ? `${card({ variant: "glass" })} ${headerControl({ kind: "smallPopover" })}` : "nc-composer-small-menu"}${animated ? " nc-composer-emerging-menu" : ""}`}
          data-nc-header-control={settingMenu ? "" : undefined}
          data-detail={settingMenu ? "settings" : undefined}
          data-reduced={reduced}
          data-model-owner={menuOwner}
          data-mode={mode}
          aria-label={label}
          onEscapeKeyDown={
            menuOwner && open ? (event) => event.stopPropagation() : undefined
          }
          onInteractOutside={() => { interactedOutside.current = true; }}
          onCloseAutoFocus={
            menuOwner
              ? (event) => {
                  event.preventDefault();
                  // A previous menu may finish retreating after another opens.
                  // Restore only abandoned focus, never steal it from the next control.
                  if (!interactedOutside.current &&
                      (document.activeElement === document.body ||
                       content.current?.contains(document.activeElement))) {
                    trigger.current?.focus({ preventScroll: true });
                  }
                }
              : undefined
          }
          ref={content}
          side={nestedDock?.side ?? side}
          align={align}
          sideOffset={nestedDock?.gap ?? gap}
          style={
            menuOwner
              ? {
                  maxHeight: nestedDock?.maxHeight,
                  overflowY: "auto",
                  boxSizing: "border-box",
                  opacity: nestedDock ? undefined : 0,
                }
              : undefined
          }
          updatePositionStrategy={menuOwner && open ? "always" : "optimized"}
          collisionPadding={12}
        >
          {settingMenu && <strong style={{ display: "block", marginBottom: "var(--sys-space-4)" }}>{label}</strong>}
          <Dropdown.RadioGroup value={value} onValueChange={onChange}>
            {items.map((item) => (
              <Dropdown.RadioItem
                className={settingMenu ? button({ variant: "text", size: "sm" }) : "nc-composer-small-item"}
                style={settingMenu ? { width: "100%", justifyContent: "space-between", gap: "var(--sys-space-3)" } : undefined}
                key={item}
                value={item}
                textValue={itemText?.(item) ?? item}
              >
                {renderItem ? renderItem(item) : item}
                <Dropdown.ItemIndicator>
                  <Check size={13} />
                </Dropdown.ItemIndicator>
              </Dropdown.RadioItem>
            ))}
          </Dropdown.RadioGroup>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
// Pending Gallery proposal: the approved default composer never renders this.
// Reuses Choice, AgentAvatar, the shared glass menu and surface docking behavior.
function reviewPermissionIcon(permission) {
  return permission === "Full access" ? Rocket : permission === "Ask before acting" ? Hand : KeyRound;
}
function ReviewAgentSelector({ review, agents, activeAgentId, onActiveAgentChange, models, reasoningLevels, mode, owner, context, expanded, onPresenceChange, onPin }) {
  const settings = useCaelosTheme();
  const [state, setState] = useState("closed");
  const trigger = useRef(null), content = useRef(null), timer = useRef(null), child = useRef(false);
  const active = agents.find(agent => agent.id === activeAgentId) || agents[0];
  const dock = useSurfaceMenuDock(state !== "closed", true, trigger, content);
  const cancel = () => clearTimeout(timer.current);
  const change = (next) => { cancel(); setState(next); onPresenceChange(next !== "closed"); };
  const leave = () => { cancel(); timer.current = setTimeout(() => { if (!child.current && state === "hover") change("closed"); }, 260); };
  const pin = () => { change("pinned"); onPin(); };
  useEffect(() => () => { clearTimeout(timer.current); onPresenceChange(false); }, []);
  return <Popover.Root open={state !== "closed"} onOpenChange={(open) => change(open ? "pinned" : "closed")}>
    <Popover.Trigger asChild>
      <button type="button" ref={trigger} className="nc-composer-model nc-composer-agent nc-composer-review-agent"
        aria-label={`Agent settings (${context}): ${active.name}`} aria-haspopup="dialog"
        onPointerEnter={(event) => { if (event.pointerType !== "touch") { cancel(); if (state === "closed") change("hover"); } }}
        onPointerLeave={leave}
        onClick={(event) => { event.preventDefault(); state === "pinned" ? change("closed") : pin(); }}
        onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); pin(); requestAnimationFrame(() => content.current?.querySelector("button")?.focus()); } }}>
        <AgentAvatar agent={active} size="sm" aria-hidden="true" />
        {expanded && <span>{active.name}</span>}
      </button>
    </Popover.Trigger>
    <Popover.Portal><Popover.Content {...themeAttributes(settings)} ref={content}
      className="nc-composer-small-menu nc-composer-emerging-menu nc-composer-review-table"
      data-model-owner={owner} data-composer-menu-surface="" data-expanded={state === "pinned"}
      data-reduced={settings.reducedMotion} aria-label={`Agent settings table (${context})`}
      side={dock?.side || "top"} sideOffset={(dock?.gap || 0) + 3} align="start" collisionPadding={12}
      updatePositionStrategy="always" style={{ maxHeight: dock?.maxHeight, opacity: dock ? undefined : 0 }}
      onPointerEnter={cancel} onPointerLeave={leave}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onCloseAutoFocus={(event) => event.preventDefault()}
      onInteractOutside={(event) => {
        if (event.target.closest?.("[data-model-owner]")?.getAttribute("data-model-owner") === owner || trigger.current?.contains(event.target)) event.preventDefault();
      }}
      onEscapeKeyDown={(event) => { event.stopPropagation(); if (child.current) event.preventDefault(); else { change("closed"); trigger.current?.focus(); } }}>
      <div role="table" data-context={context} aria-label={context === "reply" ? "Per-agent reply format" : "Per-agent model, reasoning and permissions"}>
        {agents.map(agent => {
          const value = review.values[agent.id];
          const PermissionIcon = reviewPermissionIcon(value.permission);
          const nestedChange = (open) => { child.current = open; cancel(); if (open) pin(); };
          return <div role="row" key={agent.id} className="nc-composer-review-row" data-agent-id={agent.id} data-context={context}>
            <div role="cell"><button type="button" className="nc-composer-model nc-composer-review-identity" aria-label={`Select agent: ${agent.name}`}
              aria-pressed={active.id === agent.id} onClick={() => { onActiveAgentChange(agent.id); pin(); }}>
              <AgentAvatar agent={agent} size="sm" aria-hidden="true" /><span className="nc-composer-review-name">{agent.name}</span>
            </button></div>
            {context === "reply" ? formats.map(({id, label, Icon}) => <div role="cell" key={id}>
              <button type="button" className="nc-composer-format-option" aria-label={`${agent.name}: ${label}`} aria-pressed={value.replyFormat === id}
                onClick={() => { review.onChange(agent.id, "replyFormat", id); pin(); }}>
                <Icon size={18} /><span className="nc-composer-format-label">{label}</span>
              </button>
            </div>) : <>
            <div role="cell"><Choice label={`${agent.name} model: ${value.model}`} hint={null} items={models} value={value.model}
              onChange={(next) => review.onChange(agent.id, "model", next)} mode={mode} showLabel animated menuOwner={owner} onOpenChange={nestedChange} align="start" /></div>
            <div role="cell"><Choice label={`${agent.name} reasoning: ${value.reasoning}`} hint={null} items={reasoningLevels} value={value.reasoning}
              onChange={(next) => review.onChange(agent.id, "reasoning", next)} mode={mode} showLabel animated menuOwner={owner} onOpenChange={nestedChange} align="start" /></div>
            <div role="cell"><Choice label={`${agent.name} permissions: ${value.permission}`} hint={value.permission} hintSide="right" icon={PermissionIcon} items={review.permissions} value={value.permission}
              onChange={(next) => review.onChange(agent.id, "permission", next)} mode={mode} animated menuOwner={owner} onOpenChange={nestedChange} align="start" /></div>
            </>}
          </div>;
        })}
      </div>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
function ModelSettings({
  model,
  reasoning,
  setModel,
  setReasoning,
  mode,
  models,
  reasoningLevels,
  agents,
  activeAgentId,
  onActiveAgentChange,
  review,
}) {
  const [reviewTableOpen, setReviewTableOpen] = useState(false);
  const activeAgent = agents?.find((agent) => agent.id === activeAgentId);
  const owner = useId(),
    settingsId = useId();
  const { trigger: dockRoot, gap } = useComposerDock("bottom");
  const [open, setOpen] = useState("closed");
  const root = useRef(null),
    trigger = useRef(null),
    timer = useRef(null),
    childOpen = useRef(false);
  const bridge = useRef(null),
    dock = useCompactDock(open, root, bridge, -78);
  const cancel = () => clearTimeout(timer.current);
  const close = () => {
    cancel();
    setOpen("closed");
  };
  const enter = (e) => {
    if (e.pointerType === "touch") return;
    cancel();
    setOpen((s) => (s === "closed" ? "hover" : s));
  };
  const leave = () => {
    cancel();
    timer.current = setTimeout(() => {
      if (!childOpen.current) setOpen((s) => (s === "hover" ? "closed" : s));
    }, 260);
  };
  const childChanged = (value) => {
    childOpen.current = value;
    cancel();
    if (value) setOpen("pinned");
  };
  const focusFirst = () =>
    requestAnimationFrame(() =>
      root.current?.querySelector(".nc-composer-model")?.focus(),
    );
  useEffect(() => {
    const outside = (e) => {
      if (
        !root.current?.contains(e.target) &&
        e.target
          .closest?.("[data-model-owner]")
          ?.getAttribute("data-model-owner") !== owner
      )
        close();
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <div
      className="nc-composer-brain"
      data-state={open}
      ref={(el) => {
        root.current = el;
        dockRoot.current = el;
      }}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onBlur={() => {
        cancel();
        timer.current = setTimeout(() => {
          if (
            !childOpen.current &&
            !root.current?.contains(document.activeElement) &&
            document.activeElement
              ?.closest?.("[data-model-owner]")
              ?.getAttribute("data-model-owner") !== owner
          )
            close();
        }, 50);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !childOpen.current) {
          e.preventDefault();
          e.stopPropagation();
          close();
          trigger.current?.focus({ preventScroll: true });
        }
      }}
    >
      <Hint
        disabled={!!review && reviewTableOpen}
        label={
          review ? "change model/reasoning/permissions" : activeAgent
            ? `${activeAgent.name} · Change model/reasoning`
            : "Change model/reasoning"
        }
      >
        <button
          type="button"
          ref={trigger}
          className="nc-composer-icon nc-composer-settings-trigger"
          aria-label={review ? `Model, reasoning and permissions: ${model}, ${reasoning}` : `Model and reasoning: ${model}, ${reasoning}`}
          aria-expanded={open !== "closed"}
          aria-controls={open !== "closed" ? settingsId : undefined}
          onClick={() => {
            cancel();
            setOpen((s) => (s === "pinned" ? "closed" : "pinned"));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen("pinned");
              focusFirst();
            }
          }}
        >
          <Brain size={18} />
        </button>
      </Hint>
      <div
        ref={bridge}
        className="nc-composer-brain-bridge nc-composer-docked-bridge"
        data-dock={dock.side}
        style={{ paddingTop: gap, ...dock.style }}
        data-open={open !== "closed"}
        inert={open === "closed"}
        aria-hidden={open === "closed"}
      >
        <div
          id={settingsId}
          className="nc-composer-model-settings"
          role="group"
          aria-label={
            activeAgent
              ? `Model and reasoning for ${activeAgent.name}`
              : "Model and reasoning"
          }
        >
          {review && agents?.length > 1 && <ReviewAgentSelector
            review={review} agents={agents} activeAgentId={activeAgentId}
            onActiveAgentChange={onActiveAgentChange} models={models} reasoningLevels={reasoningLevels}
            mode={mode} owner={owner} context="brain" expanded={open === "pinned"}
            onPresenceChange={(present) => { childOpen.current = present; setReviewTableOpen(present); cancel(); }}
            onPin={() => setOpen("pinned")} />}
          {!review && activeAgent && onActiveAgentChange && (
            <Choice
              label={`Agent: ${activeAgent.name}`}
              hint={null}
              items={agents.map((agent) => agent.id)}
              value={activeAgent.id}
              onChange={onActiveAgentChange}
              mode={mode}
              showLabel
              kind="nc-composer-agent"
              onOpenChange={childChanged}
              menuOwner={owner}
              side="top"
              align="start"
              animated
              renderValue={() => (
                <>
                  <AgentAvatar agent={activeAgent}
                    size="sm"
                    aria-hidden="true"
                  />
                  <span className="nc-composer-agent-name">
                    {activeAgent.name}
                  </span>
                </>
              )}
              itemText={(id) =>
                agents.find((agent) => agent.id === id)?.name ?? id
              }
              renderItem={(id) => {
                const agent = agents.find((item) => item.id === id);
                return (
                  <span className="nc-composer-agent-option">
                    <AgentAvatar agent={agent}
                      size="sm"
                      aria-hidden="true"
                    />
                    <span>{agent.name}</span>
                  </span>
                );
              }}
            />
          )}
          <Choice
            label={`Model: ${model}`}
            hint={null}
            items={models}
            value={model}
            onChange={setModel}
            mode={mode}
            showLabel
            onOpenChange={childChanged}
            menuOwner={owner}
            side="top"
            align="start"
            animated
          />
          <Choice
            label={`Reasoning: ${reasoning}`}
            hint={null}
            items={reasoningLevels}
            value={reasoning}
            onChange={setReasoning}
            mode={mode}
            showLabel
            kind="nc-composer-reasoning"
            onOpenChange={childChanged}
            menuOwner={owner}
            side="top"
            animated
          />
          {review && <Choice label={`Permissions: ${review.values[activeAgentId]?.permission}`}
            hint={review.values[activeAgentId]?.permission} hintSide="right" icon={reviewPermissionIcon(review.values[activeAgentId]?.permission)}
            items={review.permissions} value={review.values[activeAgentId]?.permission}
            onChange={(permission) => review.onChange(activeAgentId, "permission", permission)}
            mode={mode} onOpenChange={childChanged}
            menuOwner={owner} side="top" animated />}
        </div>
      </div>
    </div>
  );
}
function AddToConversation({ mode, onAdd, goalIcon, disabled, additions, additionLabels }) {
  const { trigger, gap } = useComposerDock();
  const shell = useContext(ComposerAnchor);
  const settings = useCaelosTheme();
  const reduced = useContext(ComposerReducedMotion),
    [open, setOpen] = useState(false);
  const content = useRef(null);
  const dock = useSurfaceMenuDock(open, !!shell, trigger, content, shell);
  const pendingAddition = useRef(null);
  const changeOpen = (value) => {
    if (!value) captureMenuExit(content);
    setOpen(value);
  };
  return (
    <Dropdown.Root modal={false} open={open} onOpenChange={changeOpen}>
      <Hint label="Add to this conversation" mode={mode} disabled={open}>
        <Dropdown.Trigger asChild>
          <button
            type="button"
            ref={trigger}
            onPointerDown={(e) => {
              if (e.button === 0 && !e.ctrlKey) e.preventDefault();
            }}
            onClick={() => changeOpen(!open)}
            className="nc-composer-icon"
            aria-label="Add to this conversation"
            disabled={disabled}
          >
            <Plus size={19} />
          </button>
        </Dropdown.Trigger>
      </Hint>
      <Dropdown.Portal>
        <Dropdown.Content
          ref={content}
          {...themeAttributes(settings)}
          className="nc-composer-small-menu nc-composer-emerging-menu"
          data-reduced={reduced}
          data-mode={mode}
          side={dock?.side ?? "top"}
          align="start"
          sideOffset={dock?.gap ?? gap + 2}
          style={{
            maxHeight: dock?.maxHeight,
            overflowY: "auto",
            boxSizing: "border-box",
            opacity: dock ? undefined : 0,
          }}
          updatePositionStrategy={open ? "always" : "optimized"}
          collisionPadding={12}
          onCloseAutoFocus={(event) => {
            const item = pendingAddition.current;
            pendingAddition.current = null;
            if (item) {
              event.preventDefault();
              // Open the destination only after the menu has released its focus layer.
              window.setTimeout(() => onAdd(item), 0);
            }
          }}
        >
          {[
            ["File or folder", Folder],
            ["Agent", Bot],
            ["Goal", Goal],
            ["Session instruction", FileText],
          ].filter(([item]) => !additions || additions.includes(item)).map(([item, Icon]) => (
            <Dropdown.Item
              className="nc-composer-small-item"
              style={{ justifyContent: "flex-start", gap: 10 }}
              key={item}
              onSelect={() => { pendingAddition.current = item; }}
            >
              {item === "Goal" && goalIcon ? <span aria-hidden="true">{goalIcon}</span> : <Icon
                size={16}
                strokeWidth={1.6}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />}
              <span>{additionLabels?.[item] ?? item}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

/** Public settings bridge; interaction remains owned by the composer's Choice. */
export function ComposerChoiceInternal({ label, value, options, onValueChange, menuOwner }) {
  const { theme, reducedMotion } = useCaelosTheme();
  return <ComposerReducedMotion.Provider value={reducedMotion}>
    <Choice label={label} value={value} items={options} onChange={onValueChange}
      mode={theme} showLabel animated settingMenu menuOwner={menuOwner} align="start" />
  </ComposerReducedMotion.Provider>;
}

export function PermissionControlInternal({ value, onValueChange, options, showLabel = false, menuOwner, menuSide = "top" }) {
  const { theme } = useCaelosTheme();
  return (
    <Choice
      label={`Permissions: ${value}`}
      side={menuSide}
      showLabel={showLabel}
      menuOwner={menuOwner}
      icon={PermissionsIcon}
      animated
      items={options}
      value={value}
      onChange={onValueChange}
      mode={theme}
      align="start"
    />
  );
}
export function ComposerInternal({
  experimentalAgentSettings,
  sending = false,
  onStop,
  allowEmptySubmit = false,
  sendDisabled = false,
  showReplyFormat = true,
  additions,
  additionLabels,
  textareaRef,
  textareaTestId,
  value,
  onValueChange,
  onSend,
  model,
  models,
  onModelChange,
  reasoning,
  reasoningLevels,
  onReasoningChange,
  replyFormat,
  onReplyFormatChange,
  live,
  onLiveChange,
  onDictate,
  onAdd,
  disabled = false,
  commands,
  agents,
  activeAgentId,
  onActiveAgentChange,
  placeholder = "What’s on your mind?",
  label = "Message",
  context,
  goal = "",
  onGoalChange,
  instruction = "",
  onInstructionChange,
  goalIcon = <Goal size={16} strokeWidth={1.6} aria-hidden="true" />,
  header,
  footer,
}) {
  const { theme: mode, reducedMotion: reduced } = useCaelosTheme();
  const settings = useCaelosTheme();
  const [editing, setEditing] = useState(null), [contextDraft, setContextDraft] = useState("");
  const contextId = useId();
  const contextReturnFocus = useRef(null), contextOutside = useRef(false);
  const editContext = (kind) => {
    contextReturnFocus.current = document.activeElement?.closest('.nc-composer-pill') ? document.activeElement : null;
    contextOutside.current = false;
    setContextDraft(kind === "Goal" ? goal : instruction);
    setEditing(kind);
  };
  const add = (kind) => {
    if ((kind === "Goal" && onGoalChange) || (kind === "Session instruction" && onInstructionChange)) {
      editContext(kind);
      return true;
    }
    onAdd?.(kind);
    return false;
  };
  const contextPills = [["Goal", goal, onGoalChange, goalIcon], ["Instruction", instruction, onInstructionChange, <FileText key="instruction" size={16} strokeWidth={1.6} aria-hidden="true" />]];
  const [shell, setShell] = useState(null),
    field = useRef(null),
    [height, setHeight] = useState(24);
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    const measure = () => {
      el.style.height = "0px";
      const natural = el.scrollHeight,
        h = Math.min(192, Math.max(24, natural));
      el.style.height = `${h}px`;
      el.style.overflowY = natural > 192 ? "auto" : "hidden";
      setHeight(h);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el.parentElement);
    return () => observer.disconnect();
  }, [value]);
  const suggestionPicker = useComposerSuggestions({
    value,
    onValueChange,
    commands,
    agents,
    disabled,
    field,
    shell,
  });
  const send = () => {
    if (!disabled && !sending && !sendDisabled && (value.trim() || allowEmptySubmit)) {
      onSend({ text: value, replyFormat, model, reasoning, ...(goal ? { goal } : {}), ...(instruction ? { instruction } : {}) });
      field.current?.focus({ preventScroll: true });
    }
  };
  return (
    <ComposerAnchor.Provider value={shell}>
      <ComposerReducedMotion.Provider value={reduced}>
        <div className="nc-composer-workspace">
          {header && <div className="nc-composer-recipient">{header}</div>}
          <Popover.Root open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
          <Popover.Anchor asChild><div
            ref={setShell}
            className="nc-composer-shell"
            style={{ borderRadius: height > 48 ? 22 : 27 }}
          >
            <textarea
              ref={(element) => {
                field.current = element;
                if (typeof textareaRef === "function") textareaRef(element);
                else if (textareaRef) textareaRef.current = element;
              }}
              data-testid={textareaTestId}
              value={value}
              {...suggestionPicker.fieldProps}
              rows={1}
              aria-label={label}
              placeholder={placeholder}
              disabled={disabled}
              onKeyDown={(e) => {
                if (suggestionPicker.onKeyDown(e)) return;
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            {context && <div className="nc-composer-context">{context}</div>}
            <div className="nc-composer-controls">
              <div className="nc-composer-left">
                {(onAdd || onGoalChange || onInstructionChange) && <AddToConversation additions={additions} additionLabels={additionLabels} mode={mode} onAdd={add} goalIcon={goalIcon} disabled={disabled} />}
                {onDictate && (
                  <Hint label="Dictate a message">
                    <button
                      type="button"
                      className="nc-composer-icon"
                      aria-label="Dictate a message"
                      disabled={disabled}
                      onClick={onDictate}
                    >
                      <Mic size={17} />
                    </button>
                  </Hint>
                )}
              </div>
              {(goal || instruction) && <div className="nc-composer-pills" aria-label="Conversation context">
                {contextPills.filter(([, text]) => text).map(([name, text, change, icon]) => <div className="nc-composer-pill" key={name}>
                  <Hint label={<span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{text}</span>} disabled={!!editing}>
                    <button type="button" className="nc-composer-pill-label" aria-label={`${change ? "Edit" : "View"} ${name.toLowerCase()}`} aria-haspopup={change ? "dialog" : undefined}
                      disabled={disabled} onClick={() => { if (change) editContext(name === "Goal" ? "Goal" : "Session instruction"); }}>
                      {icon}<span>{name}</span>
                    </button>
                  </Hint>
                  {change && <button type="button" className="nc-composer-pill-remove" aria-label={`Remove ${name.toLowerCase()}`} disabled={disabled}
                    onClick={() => { change(""); field.current?.focus({ preventScroll: true }); }}><X size={12} aria-hidden="true" /></button>}
                </div>)}
              </div>}
              <div className="nc-composer-right">
                <ModelSettings
                  review={experimentalAgentSettings}
                  agents={agents}
                  activeAgentId={activeAgentId}
                  onActiveAgentChange={onActiveAgentChange}
                  model={model}
                  reasoning={reasoning}
                  setModel={onModelChange}
                  setReasoning={onReasoningChange}
                  mode={mode}
                  models={models}
                  reasoningLevels={reasoningLevels}
                />
                {showReplyFormat && <ReplyFormat
                  review={experimentalAgentSettings} agents={agents} activeAgentId={activeAgentId}
                  onActiveAgentChange={onActiveAgentChange} models={models} reasoningLevels={reasoningLevels}
                  value={replyFormat}
                  onChange={onReplyFormatChange}
                  mode={mode}
                />}
                <Hint label={sending ? "Stop response" : (value.trim() || allowEmptySubmit || !onLiveChange) ? "Send message" : "Live Conversation Mode"}>
                  <button
                    type="button"
                    className="nc-composer-main-action"
                    data-testid={sending ? "stop-button" : "send-button"}
                    data-ready={!!value.trim() || allowEmptySubmit || sending}
                    disabled={sending ? !onStop : disabled || sendDisabled || (!value.trim() && !allowEmptySubmit && !onLiveChange)}
                    aria-label={sending ? "Stop response" : (value.trim() || allowEmptySubmit || !onLiveChange) ? "Send message" : "Live Conversation Mode"}
                    aria-pressed={!sending && onLiveChange && !value.trim() && !allowEmptySubmit ? live : undefined}
                    onClick={() => sending ? onStop?.() : (value.trim() || allowEmptySubmit || !onLiveChange) ? send() : onLiveChange?.(!live)}
                  >
                    {sending || live ? <Square size={15} /> : (value.trim() || allowEmptySubmit || !onLiveChange) ? <ArrowUp size={19} /> : <AudioLines size={20} />}
                  </button>
                </Hint>
              </div>
            </div>
          </div>
          </Popover.Anchor>
          <Popover.Portal><Popover.Content {...themeAttributes(settings)} className="nc-composer-context-editor" side="top" align="start" sideOffset={3} collisionPadding={12}
            aria-label={editing === "Goal" ? "Goal details" : "Instruction details"}
            onInteractOutside={() => { contextOutside.current = true; }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (!contextOutside.current) (contextReturnFocus.current || field.current)?.focus({ preventScroll: true });
            }}>
            <form onSubmit={(event) => {
              event.preventDefault();
              if (disabled || !contextDraft.trim()) return;
              (editing === "Goal" ? onGoalChange : onInstructionChange)?.(contextDraft.trim());
              setEditing(null);
            }}>
              <TextArea label={editing === "Goal" ? "Goal" : "Session instruction"}
                style={{ minHeight: 90, maxHeight: "40vh" }}
                maxLength={4000} id={contextId} value={contextDraft} onChange={(event) => setContextDraft(event.target.value)} rows={3}
                placeholder={editing === "Goal" ? "What would you like to accomplish?" : "How should I approach this conversation?"} disabled={disabled} />
              <div className="nc-composer-context-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" disabled={disabled || !contextDraft.trim()}>Save</button></div>
            </form>
          </Popover.Content></Popover.Portal>
          </Popover.Root>
          {suggestionPicker.popup}
          {footer}
        </div>
      </ComposerReducedMotion.Provider>
    </ComposerAnchor.Provider>
  );
}
