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
  Target,
  FileText,
  AudioLines,
  ArrowUp,
  Plus,
  Mic,
  KeyRound,
  Brain,
  Square,
  Check,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Avatar, Tooltip as CaelosTooltip } from "./components";
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
      const below = window.innerHeight - surface.bottom - 12,
        above = surface.top - 12;
      const side = below < height && above > below ? "top" : "bottom";
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
function Hint({ label, children, disabled = false }) {
  return (
    <CaelosTooltip label={label} side="top" disabled={disabled || !label}>
      {children}
    </CaelosTooltip>
  );
}
function ReplyFormat({ value, onChange, mode }) {
  const menuId = useId();
  const { trigger: dockRoot, gap } = useComposerDock("bottom");
  const [open, setOpen] = useState("closed");
  const root = useRef(null),
    trigger = useRef(null),
    timer = useRef(null),
    options = useRef([]);
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
      () => setOpen((s) => (s === "hover" ? "closed" : s)),
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
      if (!root.current?.contains(e.target)) close();
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
        if (!e.currentTarget.contains(e.relatedTarget)) close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close();
          trigger.current?.focus();
        }
      }}
    >
      <Hint label="Change Output mode">
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
        inert={open === "closed" ? "" : undefined}
        aria-hidden={open === "closed"}
        data-expanded={lastExpanded.current}
      >
        <div
          id={menuId}
          className="nc-composer-format-menu"
          role="menu"
          aria-label="Reply format"
          data-expanded={lastExpanded.current}
          onKeyDown={(e) => {
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
                trigger.current?.focus();
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
// A nested click menu docks to the complete settings card, never over its trigger.
function useSettingsMenuDock(open, enabled, trigger, content) {
  const [layout, setLayout] = useState(null);
  useLayoutEffect(() => {
    // Retain the final dock while Radix plays the closing animation.
    if (!open || !enabled) return;
    let frame;
    const measure = () => {
      const button = trigger.current;
      const card = button?.closest(".nc-composer-model-settings");
      const menu = content.current;
      if (card && menu) {
        const field = button.getBoundingClientRect();
        const surface = card.getBoundingClientRect();
        const above = Math.max(0, surface.top - 12);
        const below = Math.max(0, window.innerHeight - surface.bottom - 12);
        const height =
          menu.scrollHeight + menu.offsetHeight - menu.clientHeight;
        const side = above >= height || above >= below ? "top" : "bottom";
        const next = {
          side,
          gap: Math.max(
            0,
            side === "top"
              ? field.top - surface.top
              : surface.bottom - field.bottom,
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
  }, [open, enabled, trigger, content]);
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
  animated = false,
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
  const nestedDock = useSettingsMenuDock(open, !!menuOwner, trigger, content);
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
      <Hint label={hint} mode={mode} disabled={open}>
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
          className={`nc-composer-small-menu${animated ? " nc-composer-emerging-menu" : ""}`}
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
                    trigger.current?.focus();
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
          <Dropdown.RadioGroup value={value} onValueChange={onChange}>
            {items.map((item) => (
              <Dropdown.RadioItem
                className="nc-composer-small-item"
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
}) {
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
          trigger.current?.focus();
        }
      }}
    >
      <Hint
        label={
          activeAgent
            ? `${activeAgent.name} · Change model/reasoning`
            : "Change model/reasoning"
        }
      >
        <button
          type="button"
          ref={trigger}
          className="nc-composer-icon"
          aria-label={`Model and reasoning: ${model}, ${reasoning}`}
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
        inert={open === "closed" ? "" : undefined}
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
          {activeAgent && onActiveAgentChange && (
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
                  <Avatar
                    name={activeAgent.name}
                    src={activeAgent.avatarSrc}
                    kind="agent"
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
                    <Avatar
                      name={agent.name}
                      src={agent.avatarSrc}
                      kind="agent"
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
        </div>
      </div>
    </div>
  );
}
function AddToConversation({ mode, onAdd }) {
  const { trigger, gap } = useComposerDock();
  const settings = useCaelosTheme();
  const reduced = useContext(ComposerReducedMotion),
    [open, setOpen] = useState(false);
  const content = useRef(null);
  const changeOpen = (value) => {
    if (!value) captureMenuExit(content);
    setOpen(value);
  };
  return (
    <Dropdown.Root open={open} onOpenChange={changeOpen}>
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
          side="top"
          align="start"
          sideOffset={gap + 2}
          collisionPadding={12}
        >
          {[
            ["File or folder", Folder],
            ["Agent", Bot],
            ["Goal", Target],
            ["Session instruction", FileText],
          ].map(([item, Icon]) => (
            <Dropdown.Item
              className="nc-composer-small-item"
              style={{ justifyContent: "flex-start", gap: 10 }}
              key={item}
              onSelect={() => onAdd(item)}
            >
              <Icon
                size={16}
                strokeWidth={1.6}
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              />
              <span>{item}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

export function PermissionControlInternal({ value, onValueChange, options }) {
  const { theme } = useCaelosTheme();
  return (
    <Choice
      label={`Permissions: ${value}`}
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
  header,
  footer,
}) {
  const { theme: mode, reducedMotion: reduced } = useCaelosTheme();
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
  const chosen = formats.find((f) => f.id === replyFormat) || formats[0];
  const send = () => {
    if (!disabled && value.trim()) {
      onSend({ text: value, replyFormat, model, reasoning });
      field.current?.focus();
    }
  };
  return (
    <ComposerAnchor.Provider value={shell}>
      <ComposerReducedMotion.Provider value={reduced}>
        <div className="nc-composer-workspace">
          {header && <div className="nc-composer-recipient">{header}</div>}
          <div
            ref={setShell}
            className="nc-composer-shell"
            style={{ borderRadius: height > 48 ? 22 : 27 }}
          >
            <textarea
              ref={field}
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
                {onAdd && <AddToConversation mode={mode} onAdd={onAdd} />}
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
              <div className="nc-composer-right">
                <ModelSettings
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
                <ReplyFormat
                  value={replyFormat}
                  onChange={onReplyFormatChange}
                  mode={mode}
                />
                <Hint
                  label={
                    value.trim() ? "Send message" : "Live Conversation Mode"
                  }
                >
                  <button
                    type="button"
                    className="nc-composer-main-action"
                    data-ready={!!value.trim()}
                    disabled={disabled || (!value.trim() && !onLiveChange)}
                    aria-label={
                      value.trim() ? "Send message" : "Live Conversation Mode"
                    }
                    aria-pressed={value.trim() ? undefined : live}
                    onClick={() =>
                      value.trim() ? send() : onLiveChange?.(!live)
                    }
                  >
                    {value.trim() ? (
                      <ArrowUp size={19} />
                    ) : live ? (
                      <Square size={15} />
                    ) : (
                      <AudioLines size={20} />
                    )}
                  </button>
                </Hint>
              </div>
            </div>
          </div>
          <div className="nc-composer-under">
            <span>{chosen.label} replies</span>
            {onLiveChange && (
              <button
                type="button"
                aria-pressed={live}
                disabled={disabled}
                onClick={() => onLiveChange(!live)}
              >
                Live Conversation Mode
                <AudioLines size={12} />
              </button>
            )}
          </div>
          {suggestionPicker.popup}
          {footer}
        </div>
      </ComposerReducedMotion.Provider>
    </ComposerAnchor.Provider>
  );
}
