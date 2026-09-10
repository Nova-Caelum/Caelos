import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { menu } from "../styled-system/recipes/index.mjs";
import { Tooltip } from "./components";
import { themeAttributes, useCaelosTheme } from "./theme";

/** Application-provided installed command or skill. Selection inserts text; it never executes. */
export interface ComposerCommand {
  id: string;
  /** Display name, with or without a leading slash. Must be unique in the supplied list. */
  name: string;
  description: string;
  kind: "command" | "skill";
  /** Defaults to /name. Allows the host to use a different skill invocation syntax. */
  invocation?: string;
}
/** Application-provided participant in the current chat. Selecting only inserts a tag. */
export interface ComposerAgent {
  id: string;
  /** Optional avatar image; falls back to the shared agent initials avatar. */
  avatarSrc?: string;
  name: string;
  description?: string;
  /** Defaults to @name. Supply a unique handle when display names contain spaces or collide. */
  mention?: string;
}
interface Suggestion {
  id: string;
  label: string;
  description?: string;
  insertion: string;
  search: string;
}
const commandName = (command: ComposerCommand) =>
  `/${command.name.replace(/^\//, "")}`;

function tokenAt(value: string, start: number, end: number) {
  if (start !== end) return null;
  const match = /(?:^|\s)([/@])([\p{L}\p{N}_:-]*)$/u.exec(
    value.slice(0, start),
  );
  if (!match) return null;
  const suffix = /^\S*/.exec(value.slice(start))![0];
  // Paths and URLs aren't invocations, including when the caret is inside one.
  if (!/^[\p{L}\p{N}_:-]*$/u.test(suffix)) return null;
  return {
    start: start - match[2].length - 1,
    end: start + suffix.length,
    trigger: match[1],
    query: match[2],
  };
}

export function useComposerSuggestions({
  value,
  onValueChange,
  commands,
  agents,
  disabled,
  field,
  shell,
}: {
  value: string;
  onValueChange: (value: string) => void;
  commands?: ComposerCommand[];
  agents?: ComposerAgent[];
  disabled: boolean;
  field: RefObject<HTMLTextAreaElement>;
  shell: HTMLElement | null;
}) {
  const id = useId();
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [navigation, setNavigation] = useState({
    key: "",
    index: 0,
    summary: false,
  });
  const pendingCaret = useRef<number | null>(null);
  const token = tokenAt(value, selection.start, selection.end);
  const key = `${value}\u0000${selection.start}:${selection.end}`;
  const mentioning = token?.trigger === "@";
  const enabled = mentioning ? agents !== undefined : commands !== undefined;
  const open =
    enabled &&
    focused &&
    !disabled &&
    !composing &&
    !!token &&
    dismissed !== key;
  const entries: Suggestion[] = mentioning
    ? (agents ?? []).map((agent) => {
        const label = `@${agent.name.replace(/^@/, "")}`;
        return {
          id: agent.id,
          label,
          description: agent.description,
          insertion: agent.mention ?? label,
          search: `${agent.name} ${agent.mention ?? ""}`,
        };
      })
    : (commands ?? []).map((command) => ({
        id: command.id,
        label: commandName(command),
        description: command.description,
        insertion: command.invocation ?? commandName(command),
        search: command.name,
      }));
  const matches = entries.filter((entry) =>
    entry.search
      .toLocaleLowerCase()
      .includes(token?.query.toLocaleLowerCase() ?? ""),
  );
  const index =
    navigation.key === key
      ? Math.min(navigation.index, Math.max(0, matches.length - 1))
      : 0;
  const summary = navigation.key === key && navigation.summary;
  const listId = `${id}-${mentioning ? "agents" : "commands"}`;
  const optionId = (i: number) => `${listId}-${i}`;
  useEffect(() => {
    setNavigation({ key, index: 0, summary: false });
  }, [key, open]);
  const dismiss = () => setDismissed(key);
  const syncSelection = (el: HTMLTextAreaElement) =>
    setSelection({ start: el.selectionStart, end: el.selectionEnd });
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !field.current) return;
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    field.current.setSelectionRange(caret, caret);
    syncSelection(field.current);
  }, [value, field]);
  const choose = (entry: Suggestion) => {
    if (!token || disabled) return;
    const insertion = entry.insertion;
    const suffix = value.slice(token.end);
    const spacer = suffix.startsWith(" ") ? "" : " ";
    const next = value.slice(0, token.start) + insertion + spacer + suffix;
    pendingCaret.current = token.start + insertion.length + 1;
    dismiss();
    onValueChange(next);
    field.current?.focus();
    if (next === value && field.current) {
      field.current.setSelectionRange(
        pendingCaret.current!,
        pendingCaret.current!,
      );
      pendingCaret.current = null;
      syncSelection(field.current);
    }
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || composing || e.keyCode === 229)
      return true;
    if (!open) return false;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      dismiss();
      return true;
    }
    if (e.key === "Tab") {
      dismiss();
      return false;
    }
    if (
      (e.key === "ArrowDown" || e.key === "ArrowUp") &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey
    ) {
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const next = summary
        ? (index + delta + matches.length) % matches.length
        : delta > 0
          ? 0
          : matches.length - 1;
      setNavigation({ key, index: Math.max(0, next || 0), summary: true });
      return true;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (matches[index]) choose(matches[index]);
      return true;
    }
    return false;
  };
  return {
    onKeyDown,
    fieldProps: {
      "aria-autocomplete":
        commands !== undefined || agents !== undefined
          ? ("list" as const)
          : undefined,
      "aria-haspopup":
        commands !== undefined || agents !== undefined
          ? ("listbox" as const)
          : undefined,
      "aria-controls": open ? listId : undefined,
      "aria-activedescendant":
        open && matches[index] ? optionId(index) : undefined,
      onFocus: (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setFocused(true);
        syncSelection(e.currentTarget);
      },
      onBlur: () => {
        setFocused(false);
        dismiss();
      },
      onSelect: (e: React.SyntheticEvent<HTMLTextAreaElement>) =>
        syncSelection(e.currentTarget),
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        syncSelection(e.currentTarget);
        onValueChange(e.currentTarget.value);
      },
      onCompositionStart: () => setComposing(true),
      onCompositionEnd: (e: React.CompositionEvent<HTMLTextAreaElement>) => {
        setComposing(false);
        syncSelection(e.currentTarget);
      },
    },
    popup:
      open && shell ? (
        <ComposerSuggestions
          key={listId}
          shell={shell}
          listId={listId}
          optionId={optionId}
          entries={matches}
          label={mentioning ? "Agents in this chat" : "Commands and skills"}
          empty={
            mentioning
              ? agents?.length
                ? "No matching agents"
                : "No agents in this chat"
              : commands?.length
                ? "No matching commands"
                : "No installed commands or skills"
          }
          active={index}
          summary={summary}
          onChoose={choose}
          onDismiss={dismiss}
          onHighlight={(i) => setNavigation({ key, index: i, summary: true })}
        />
      ) : null,
  };
}

function ComposerSuggestions({
  shell,
  listId,
  optionId,
  entries,
  label,
  empty,
  active,
  summary,
  onChoose,
  onHighlight,
  onDismiss,
}: {
  shell: HTMLElement;
  listId: string;
  optionId: (i: number) => string;
  entries: Suggestion[];
  label: string;
  empty: string;
  active: number;
  summary: boolean;
  onChoose: (entry: Suggestion) => void;
  onHighlight: (index: number) => void;
  onDismiss: () => void;
}) {
  const settings = useCaelosTheme();
  const styles = menu({ layout: "action" });
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    left: 12,
    top: 12,
    maxHeight: 320,
    side: "top",
    ready: false,
  });
  useLayoutEffect(() => {
    const measure = () => {
      if (!panel.current) return;
      const rect = shell.getBoundingClientRect();
      const viewport = window.visualViewport;
      const minX = (viewport?.offsetLeft ?? 0) + 12;
      const minY = (viewport?.offsetTop ?? 0) + 12;
      const maxX = minX + (viewport?.width ?? window.innerWidth) - 24;
      const maxY = minY + (viewport?.height ?? window.innerHeight) - 24;
      const above = Math.max(0, rect.top - minY - 8);
      const below = Math.max(0, maxY - rect.bottom - 8);
      const naturalHeight = Math.min(320, panel.current.scrollHeight + 2);
      const side = above >= naturalHeight || above >= below ? "top" : "bottom";
      const maxHeight = Math.min(320, side === "top" ? above : below);
      const height = Math.min(naturalHeight, maxHeight);
      const left = Math.max(
        minX,
        Math.min(rect.left, maxX - panel.current.offsetWidth),
      );
      const top = Math.max(
        minY,
        Math.min(
          side === "top" ? rect.top - height - 8 : rect.bottom + 8,
          maxY - height,
        ),
      );
      setPosition((prev) => {
        const next = { left, top, maxHeight, side, ready: true };
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, [shell, entries.length]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (
        !shell.querySelector("textarea")?.contains(target) &&
        !panel.current?.contains(target) &&
        !target.closest('[role="tooltip"]')
      )
        onDismiss();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [shell, onDismiss]);
  useLayoutEffect(() => {
    const option = document.getElementById(optionId(active));
    if (!option || !panel.current) return;
    const top = option.offsetTop,
      bottom = top + option.offsetHeight;
    if (top < panel.current.scrollTop) panel.current.scrollTop = top;
    else if (bottom > panel.current.scrollTop + panel.current.clientHeight)
      panel.current.scrollTop = bottom - panel.current.clientHeight;
  }, [active, entries.length, optionId]);
  return createPortal(
    <div
      {...themeAttributes(settings)}
      ref={panel}
      className={`${styles.content} nc-composer-command-menu`}
      data-state="open"
      data-side={position.side}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        maxHeight: position.maxHeight,
        visibility: position.ready ? "visible" : "hidden",
        transformOrigin: position.side === "top" ? "left bottom" : "left top",
      }}
      onMouseDown={(e) => {
        if (e.button === 0) e.preventDefault();
      }}
    >
      <div id={listId} role="listbox" aria-label={label}>
        {entries.map((entry, i) => (
          <Tooltip
            key={entry.id}
            side="right"
            sideOffset={24}
            label={entry.description}
            open={summary && active === i && !!entry.description}
          >
            <div
              id={optionId(i)}
              role="option"
              aria-selected={active === i}
              aria-description={entry.description}
              className={styles.item}
              data-highlighted={active === i ? "" : undefined}
              onPointerMove={(e) => {
                if (e.pointerType !== "touch") onHighlight(i);
              }}
              onClick={() => onChoose(entry)}
            >
              {entry.label}
            </div>
          </Tooltip>
        ))}
      </div>
      {!entries.length && (
        <div className={styles.label} role="status">
          {empty}
        </div>
      )}
    </div>,
    document.body,
  );
}
