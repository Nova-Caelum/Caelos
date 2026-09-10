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
import { Tooltip as CaelosTooltip } from "./components";
import { themeAttributes, useCaelosTheme } from "./theme";

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
}) {
  const { trigger, gap } = useComposerDock(side);
  const settings = useCaelosTheme();
  const reduced = useContext(ComposerReducedMotion),
    [open, setOpen] = useState(false);
  // Open on completed click: docked menus can overlap the trigger, so opening
  // on pointer-down lets the same release accidentally select a menu item.
  const changeOpen = (value) => {
    setOpen(value);
    onOpenChange?.(value);
  };
  return (
    <Dropdown.Root open={open} onOpenChange={changeOpen}>
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
          >
            {Icon && <Icon size={17} />} {showLabel && value}
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
          side={side}
          align={align}
          sideOffset={gap}
          collisionPadding={12}
        >
          <Dropdown.RadioGroup value={value} onValueChange={onChange}>
            {items.map((item) => (
              <Dropdown.RadioItem
                className="nc-composer-small-item"
                key={item}
                value={item}
              >
                {item}
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
}) {
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
    setOpen("pinned");
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
            !root.current?.contains(document.activeElement)
          )
            close();
        }, 0);
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
      <Hint label="Change model/reasoning">
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
          aria-label="Model and reasoning"
        >
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
            side="bottom"
            align="start"
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
            side="bottom"
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
  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Hint label="Add to this conversation" mode={mode} disabled={open}>
        <Dropdown.Trigger asChild>
          <button
            type="button"
            ref={trigger}
            onPointerDown={(e) => {
              if (e.button === 0 && !e.ctrlKey) e.preventDefault();
            }}
            onClick={() => setOpen(!open)}
            className="nc-composer-icon"
            aria-label="Add to this conversation"
          >
            <Plus size={19} />
          </button>
        </Dropdown.Trigger>
      </Hint>
      <Dropdown.Portal>
        <Dropdown.Content
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
          ].map(
            ([item, Icon]) => (
              <Dropdown.Item
                className="nc-composer-small-item"
                style={{ justifyContent: "flex-start", gap: 10 }}
                key={item}
                onSelect={() => onAdd(item)}
              >
                <Icon size={16} strokeWidth={1.6} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span>{item}</span>
              </Dropdown.Item>
            ),
          )}
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
              onChange={(e) => onValueChange(e.target.value)}
              rows={1}
              aria-label={label}
              placeholder={placeholder}
              disabled={disabled}
              onKeyDown={(e) => {
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
          {footer}
        </div>
      </ComposerReducedMotion.Provider>
    </ComposerAnchor.Provider>
  );
}
