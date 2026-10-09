import React, {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import * as RadixScroll from "@radix-ui/react-scroll-area";
import * as RadixTabs from "@radix-ui/react-tabs";
import * as RadixSelect from "@radix-ui/react-select";
import { Search, X, ChevronDown, ChevronRight, Check, KeyRound } from "lucide-react";
import {
  foundation,
  avatar,
  identity,
  disclosure,
  button,
  card,
  field,
  chip,
  row,
  menu,
  tooltip,
  scroll,
  typography,
} from "../styled-system/recipes/index.mjs";
import { themeAttributes, useCaelosTheme } from "./theme";
const cx = (...xs: (string | undefined | false)[]) =>
  xs.filter(Boolean).join(" ");
export type Tone =
  | "neutral"
  | "ready"
  | "progress"
  | "done"
  | "sage"
  | "danger"
  | "atmospheric"
  | "structural";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "tonal" | "text";
  size?: "sm" | "md";
  danger?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  forcedState?: "rest" | "hover" | "active" | "focus";
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "tonal",
      size = "md",
      danger,
      loading,
      leadingIcon,
      children,
      className,
      disabled,
      forcedState,
      ...props
    },
    ref,
  ) {
    return (
      <button
        type="button"
        {...props}
        ref={ref}
        className={cx(button({ variant, size, danger }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-force-state={forcedState}
      >
        {leadingIcon}
        {children}
      </button>
    );
  },
);
export interface IconButtonProps
  extends Omit<ButtonProps, "children" | "leadingIcon"> {
  label: string;
  icon: ReactNode;
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, icon, style, ...props }, ref) {
    return (
      <Tooltip label={label}>
        <Button
          {...props}
          ref={ref}
          aria-label={label}
          style={{ width: 34, padding: 0, ...style }}
        >
          {icon}
        </Button>
      </Tooltip>
    );
  },
);
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "flat" | "lifted" | "glass";
  interactive?: boolean;
}
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "flat", interactive = false, className, onKeyDown, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx(card({ variant, interactive }), className)}
      role={interactive ? "button" : props.role}
      tabIndex={interactive ? 0 : props.tabIndex}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (
          interactive &&
          !e.defaultPrevented &&
          (e.key === "Enter" || e.key === " ")
        ) {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    />
  );
});
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "text" | "search";
  leadingIcon?: ReactNode;
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
  onClear?: () => void;
  forcedState?: "rest" | "focus";
  wrapperClassName?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    variant = "text",
    leadingIcon,
    label,
    description,
    invalid,
    onClear,
    forcedState,
    wrapperClassName,
    className,
    id,
    ...props
  },
  ref,
) {
  const uid = useId(),
    inputId = id || uid,
    styles = field({ variant });
  const described =
    [props["aria-describedby"], description ? `${inputId}-description` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className={wrapperClassName}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div
        className={styles.root}
        data-invalid={invalid}
        data-disabled={props.disabled}
        data-force-state={forcedState}
      >
        {(leadingIcon || variant === "search") && (
          <span className={styles.icon}>
            {leadingIcon || <Search size={16} aria-hidden />}
          </span>
        )}
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={props.type || (variant === "search" ? "search" : "text")}
          className={cx(styles.control, className)}
          aria-invalid={invalid || props["aria-invalid"]}
          aria-describedby={described}
        />
        {onClear && !!props.value && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear search"
            onClick={onClear}
            disabled={props.disabled}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {description && (
        <div id={`${inputId}-description`} className={styles.description}>
          {description}
        </div>
      )}
    </div>
  );
});
export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
  wrapperClassName?: string;
  forcedState?: "rest" | "focus";
}
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    {
      label,
      description,
      invalid,
      className,
      wrapperClassName,
      id,
      forcedState,
      ...props
    },
    ref,
  ) {
    const uid = useId(),
      inputId = id || uid,
      styles = field({ variant: "large" });
    return (
      <div className={wrapperClassName}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div
          className={styles.root}
          data-invalid={invalid}
          data-disabled={props.disabled}
          data-force-state={forcedState}
        >
          <textarea
            rows={3}
            {...props}
            ref={ref}
            id={inputId}
            className={cx(styles.control, className)}
            aria-invalid={invalid || props["aria-invalid"]}
            aria-describedby={
              [
                props["aria-describedby"],
                description ? `${inputId}-description` : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
        </div>
        {description && (
          <div id={`${inputId}-description`} className={styles.description}>
            {description}
          </div>
        )}
      </div>
    );
  },
);
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filter" | "status" | "category" | "count";
  tone?: Tone;
  selected?: boolean;
  leadingIcon?: ReactNode;
}
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  {
    variant = "filter",
    tone = "neutral",
    selected,
    leadingIcon,
    className,
    children,
    ...props
  },
  ref,
) {
  const classes = cx(chip({ variant, tone }), className);
  return (
    <button
      type="button"
      {...props}
      ref={ref}
      className={classes}
      aria-pressed={selected}
    >
      {leadingIcon}
      {children}
    </button>
  );
});
export function Badge({
  variant = "status",
  children,
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; variant?: "status" | "dot" }) {
  return (
    <span
      {...props}
      className={cx(variant === "dot" ? foundation({ kind: "dot", tone }) : chip({ variant: "status", tone }), className)}
    >
      {children}
    </span>
  );
}
export interface RowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "sidebar" | "list" | "tab" | "crumb";
  size?: "sm" | "md";
  selected?: boolean;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  forcedState?: string;
}
export const Row = forwardRef<HTMLButtonElement, RowProps>(function Row(
  {
    variant = "sidebar",
    size = "md",
    selected,
    leadingIcon,
    trailing,
    children,
    className,
    forcedState,
    ...props
  },
  ref,
) {
  return (
    <button
      type="button"
      {...props}
      ref={ref}
      className={cx(row({ variant, size }), className)}
      data-selected={selected}
      data-force-state={forcedState}
      aria-current={selected ? "page" : undefined}
    >
      {leadingIcon}
      <span data-row-label>{children}</span>
      {trailing}
    </button>
  );
});
export function RowGroup({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} style={{ display: "flex", gap: 6, ...style }}>
      {children}
    </div>
  );
}
export interface TooltipProps {
  variant?: "default" | "path";
  label: ReactNode;
  detail?: ReactNode;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  disabled?: boolean;
  open?: boolean;
}
export function Tooltip({
  variant = "default",
  label,
  detail,
  children,
  side = "top",
  sideOffset = 8,
  disabled = false,
  open,
}: TooltipProps) {
  const settings = useCaelosTheme();
  return disabled ? (
    children
  ) : (
    <RadixTooltip.Root open={open}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          {...themeAttributes(settings)}
          className={tooltip({ variant })}
          side={side}
          sideOffset={sideOffset}
          collisionPadding={12}
        >
          {label}
          {detail && <span data-tooltip-detail>{detail}</span>}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
export const PermissionsIcon = KeyRound;
export interface MenuOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  tone?: Tone;
}
export interface SelectMenuProps {
  trigger: ReactElement;
  label?: string;
  options: MenuOption[];
  value: string;
  onValueChange: (value: string) => void;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  disabled?: boolean;
}
export function SelectMenu({
  trigger,
  label,
  options,
  value,
  onValueChange,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  disabled,
}: SelectMenuProps) {
  const settings = useCaelosTheme(),
    styles = menu();
  const [open, setOpen] = useState(false);
  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild disabled={disabled}>
        {React.cloneElement(trigger, {
          onPointerDown: (e: React.PointerEvent) => {
            trigger.props.onPointerDown?.(e);
            if (!e.defaultPrevented && e.button === 0 && !e.ctrlKey)
              e.preventDefault();
          },
          onClick: (e: React.MouseEvent) => {
            trigger.props.onClick?.(e);
            if (!e.defaultPrevented) setOpen(!open);
          },
        })}
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          {...themeAttributes(settings)}
          className={styles.content}
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
        >
          {label && (
            <Dropdown.Label className={styles.label}>{label}</Dropdown.Label>
          )}
          <Dropdown.RadioGroup value={value} onValueChange={onValueChange}>
            {options.map((option) => (
              <Dropdown.RadioItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={styles.item}
              >
                {option.label}
                <Dropdown.ItemIndicator>
                  <Check size={14} />
                </Dropdown.ItemIndicator>
              </Dropdown.RadioItem>
            ))}
          </Dropdown.RadioGroup>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
export interface ActionMenuProps {
  trigger: ReactElement;
  label?: string;
  items: {
    id: string;
    label: ReactNode;
    disabled?: boolean;
    onSelect: () => void;
  }[];
  side?: "top" | "bottom";
}
export function ActionMenu({
  trigger,
  label,
  items,
  side = "bottom",
}: ActionMenuProps) {
  const settings = useCaelosTheme(),
    styles = menu({ layout: "action" });
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          {...themeAttributes(settings)}
          className={styles.content}
          side={side}
          sideOffset={8}
          collisionPadding={12}
        >
          {label && (
            <Dropdown.Label className={styles.label}>{label}</Dropdown.Label>
          )}
          {items.map((item) => (
            <Dropdown.Item
              key={item.id}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={styles.item}
            >
              {item.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
export const STATUS_OPTIONS: MenuOption[] = [
  { value: "ready", label: "Ready", tone: "ready" },
  { value: "progress", label: "In progress", tone: "progress" },
  { value: "done", label: "Completed", tone: "done" },
  { value: "danger", label: "Blocked", tone: "danger" },
];
export function StatusSelect({
  value,
  onValueChange,
  options = STATUS_OPTIONS,
  disabled,
}: Omit<SelectMenuProps, "trigger" | "options"> & { options?: MenuOption[] }) {
  const selected = options.find((o) => o.value === value);
  return (
    <SelectMenu
      value={value}
      onValueChange={onValueChange}
      options={options}
      disabled={disabled}
      label="Set status"
      trigger={
        <Chip
          variant="status"
          tone={selected?.tone}
          disabled={disabled}
          aria-label={`Change status: ${selected?.label || value}`}
        >
          {selected?.label || value}
          <ChevronDown size={12} />
        </Chip>
      }
    />
  );
}
export interface SelectProps extends Omit<React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>, "value" | "defaultValue" | "children"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: MenuOption[];
  placeholder?: string;
  label?: string;
  showLabel?: boolean;
  wrapperClassName?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select({
  options,
  label,
  showLabel = false, wrapperClassName,
  placeholder = "Choose…",
  className,
  style,
  value, defaultValue, onValueChange, disabled, name, required,
  ...triggerProps
}: SelectProps, ref) {
  const uid = useId();
  const triggerId = triggerProps.id || uid;
  const settings = useCaelosTheme(),
    styles = menu();
  return (
    <div className={wrapperClassName} style={{ display: showLabel ? undefined : "contents" }}>
      {showLabel && label && <label className={field().label} htmlFor={triggerId}>{label}</label>}
    <RadixSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} name={name} required={required}>
      <RadixSelect.Trigger
        {...triggerProps}
        ref={ref}
        id={triggerId}
        aria-label={label || triggerProps["aria-label"]}
        className={cx(button({ variant: "tonal" }), className)}
        style={{ justifyContent: "space-between", ...style }}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown size={14} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          {...themeAttributes(settings)}
          className={styles.content}
          position="popper"
          sideOffset={8}
          collisionPadding={12}
        >
          <RadixSelect.Viewport>
            {options.map((o) => (
              <RadixSelect.Item
                value={o.value}
                key={o.value}
                disabled={o.disabled}
                className={styles.item}
              >
                <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check size={14} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
    </div>
  );
});
export interface ScrollAreaProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "dir"> {
  dir?: "ltr" | "rtl";
  viewportLabel: string;
  viewportRef?: React.Ref<HTMLDivElement>;
}
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(
    { children, className, viewportLabel, viewportRef, ...props },
    ref,
  ) {
    const styles = scroll(),
      [dragging, setDragging] = useState(false);
    return (
      <RadixScroll.Root
        {...props}
        ref={ref}
        type="auto"
        className={cx(styles.root, className)}
      >
        <RadixScroll.Viewport
          ref={viewportRef}
          className={styles.viewport}
          tabIndex={0}
          aria-label={viewportLabel}
          role="region"
        >
          {children}
        </RadixScroll.Viewport>
        <RadixScroll.Scrollbar orientation="vertical" className={styles.track}>
          <RadixScroll.Thumb
            className={styles.thumb}
            data-dragging={dragging}
            onPointerDown={(e) => {
              setDragging(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onLostPointerCapture={() => setDragging(false)}
          />
        </RadixScroll.Scrollbar>
      </RadixScroll.Root>
    );
  },
);
export const TabsRoot = RadixTabs.Root;
export const TabsList = forwardRef<
  React.ElementRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List> & { enclosed?: boolean }
>(function TabsList({ enclosed = false, style, ...props }, ref) {
  return <RadixTabs.List ref={ref} {...props} style={{
    display: "flex", gap: 5, padding: enclosed ? 5 : 0, borderRadius: 999,
    background: enclosed ? "var(--il-surface)" : undefined,
    width: "fit-content", maxWidth: "100%", flexWrap: "wrap", ...style,
  }} />;
});
export const TabsTrigger = forwardRef<
  React.ElementRef<typeof RadixTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return <RadixTabs.Trigger ref={ref} {...props} className={cx(row({ variant: "tab" }), className)} />;
});
export const TabsContent = forwardRef<
  React.ElementRef<typeof RadixTabs.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(function TabsContent({ style, ...props }, ref) {
  return <RadixTabs.Content ref={ref} {...props} style={{ paddingTop: 16, ...style }} />;
});
export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  items: { value: string; label: ReactNode; content: ReactNode; disabled?: boolean }[];
  enclosed?: boolean;
}
export function Tabs({ value, onValueChange, label, items, enclosed = false }: TabsProps) {
  return (
    <TabsRoot value={value} onValueChange={onValueChange}>
      <TabsList aria-label={label} enclosed={enclosed}>
        {items.map(i => <TabsTrigger key={i.value} value={i.value} disabled={i.disabled}>{i.label}</TabsTrigger>)}
      </TabsList>
      {items.map(i => <TabsContent key={i.value} value={i.value}>{i.content}</TabsContent>)}
    </TabsRoot>
  );
}
export interface ShortIdProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "value"> {
  /** The identifier itself, e.g. `TCF-42`. Falsy renders nothing at all. */
  value?: string | null;
  /** What the identifier names, used only to build the accessible label. */
  noun?: string;
}
/**
 * A copyable short identifier — Structural voice: a coordinate the eye references
 * rather than reads, so it takes the locked contract's Plex Mono identifier role
 * (`typography({ role: "mono" })`) at the `dim` tier, one step below the `muted` title
 * it sits beside. At `muted` it resolved to the title's exact colour and stopped being
 * quiet at all; measured on the real build it now reads 5.4:1 against the row to the
 * title's 8.25:1 — recessive, and still past AA for 10px text.
 *
 * The identifier IS the copy control. A separate icon button would add a second
 * interactive target to every task row for a value that is already the only thing
 * worth copying there, and `TaskRow` is deliberately dense.
 *
 * Absence renders `null` — not an empty span, not a reserved spacer. The backend has
 * not shipped `short_id` yet, so until it does every surface must lay out exactly as
 * it does today; a placeholder of any width would be a visible regression for weeks.
 *
 * The slot is a fixed `min-width`, not shrink-to-fit, so the titles beside it start at
 * one x down the whole list. Measured on the real build, shrink-to-fit left a 13.5px
 * ragged title edge between `TCF-7` and `TCF-1234` — the identifiers lined up, the
 * titles did not, and a ragged edge down a task list reads as accidental.
 *
 * `IDENTIFIER_SLOT_CH` is 9 rather than 8 because `ch` is the width of a zero, which
 * in this face is a shade narrower than the advance it actually sets: 8 glyphs measure
 * 49.5px against 8ch's 48px, so an eight-character `TCF-9001` would have overflowed a
 * slot sized by counting characters. Nine covers `KEY-1` through `KEY-9999` and
 * swallows the 6-character confirmation word, so neither a long number nor the copy
 * confirmation can shift a row. A five-digit number would push only its own title.
 */
const IDENTIFIER_SLOT_CH = 9;
export const ShortId = forwardRef<HTMLButtonElement, ShortIdProps>(function ShortId({
  value, noun = "task ID", className, style, onClick, onPointerEnter, onPointerLeave, onFocus, onBlur, ...props
}, ref) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  // Hover/focus brightening is React state rather than a `:hover` rule because the
  // locked recipe set owns this package's CSS; a one-off pseudo-class here would be a
  // second place appearance is decided. The cost is one re-render per pointer entry.
  const [hot, setHot] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The confirmation is transient, so a row that unmounts mid-countdown (filtered out,
  // reordered, archived) must not leave a timer holding a setState on a dead component.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  if (!value) return null;
  const label = state === "copied" ? "Copied" : state === "failed" ? "Failed" : value;
  const announce = (next: "copied" | "failed") => {
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1400);
  };
  return (
    <>
    <button
      {...props}
      ref={ref}
      type="button"
      // TaskRow's row-level open handler ignores anything inside a button, and this
      // marker keeps that true for any future host that widens the exclusion list.
      data-task-control
      data-short-id={value}
      aria-label={`Copy ${noun} ${value}`}
      // Appearance, reset and the keyboard focus ring live in the recipe layer, which is
      // where this package decides how things look; only the two stateful values below
      // are inline. `dim` is the same mono tier folder paths already use here.
      className={cx(typography({ role: "mono", tone: "dim" }), foundation({ kind: "identifier" }), className)}
      style={{
        // Inline, because the mono typography role also declares a line-height (16px)
        // and would otherwise win over the recipe. The identifier keeps the mono FONT
        // and takes the surrounding text's LINE, so its text centres in a line box the
        // same height as the title's.
        lineHeight: "inherit",
        minWidth: `${IDENTIFIER_SLOT_CH}ch`,
        // Quiet at rest, legible on approach: a control that stays dim under the pointer
        // reads as decoration, and nothing else here signals that it can be clicked.
        color: state === "copied" ? "var(--sys-accent)" : hot ? "var(--il-ink)" : undefined,
        ...style,
      }}
      onPointerEnter={event => { onPointerEnter?.(event); setHot(true); }}
      onPointerLeave={event => { onPointerLeave?.(event); setHot(false); }}
      onFocus={event => { onFocus?.(event); setHot(true); }}
      onBlur={event => { onBlur?.(event); setHot(false); }}
      onClick={event => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        // The row behind this control opens the task on click; copying must not also
        // open a drawer the reader did not ask for.
        event.stopPropagation();
        void (async () => {
          try {
            await navigator.clipboard.writeText(value);
            announce("copied");
          } catch {
            // Report the failure rather than leaving a control that silently does
            // nothing — the reader needs to know to select the text by hand.
            announce("failed");
          }
        })();
      }}
    >
      {state === "idle" ? value : label}
    </button>
    {/* The live region is a SIBLING of the button, not a child. Nested inside, its
        announcement competes with the focused control's own name and is inconsistently
        read across screen readers — and that inconsistency is the kind of thing a
        headless browser cannot test, so the robust shape is the one that ships.
        It announces the outcome only; the identifier is already in the aria-label, and
        repeating it would re-read the whole control on every copy. */}
    <span className={foundation({ kind: "announce" })} role="status" aria-live="polite">
      {state === "idle" ? "" : label}
    </span>
    </>
  );
});
export interface TaskRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  status: string;
  onStatusChange?: (value: string) => void;
  owner?: { name: string; avatar?: ReactNode };
  onOpen?: () => void;
  options?: MenuOption[];
  /** Short task identifier (`TCF-42`). Omitted or falsy renders nothing. */
  shortId?: string | null;
  leading?: ReactNode;
  afterTitle?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
  trailing?: ReactNode;
}
// Slots preserve product controls without nesting independent buttons inside Row.
export const TaskRow = forwardRef<HTMLDivElement, TaskRowProps>(function TaskRow({
  title, status, onStatusChange, owner, onOpen, options = STATUS_OPTIONS,
  shortId, leading, afterTitle, metadata, actions, trailing, className, style, onClick, ...props
}, ref) {
  const selected = options.find(o => o.value === status);
  const tone = selected?.tone || "ready";
  const color = tone === "neutral" ? "var(--il-muted)"
    : tone === "atmospheric" || tone === "structural" ? `var(--sys-sem-${tone})`
    : `var(--nc-${tone === "done" ? "sage" : tone})`;
  return (
    <div {...props} ref={ref} data-task-row="true" className={cx(row({ variant: "list" }), className)}
      style={{ cursor: "default", ...style }}
      onClick={e => {
        onClick?.(e);
        if (!e.defaultPrevented && e.currentTarget.contains(e.target as Node) && !(e.target as HTMLElement).closest("button,a,input,select,textarea,[data-task-control]")) onOpen?.();
      }}>
      <div data-task-content>
      {leading}
      {/* Dot, identifier and the title's FIRST line are centred on one axis: each sits in
          a box `--task-line-box` tall, pinned to the top of the row, with its content
          centred. The title pads its first line to the middle of that same box, so all
          three centres land at half of `--task-line-box` from the top whatever the title's
          line count — and a one-line title still fills the box, so it stays centred
          against the status and owner controls on the right.

          Centres, not baselines. The identifier is 10px mono beside a 13px title; on a
          shared baseline its capitals centre a pixel below the title's and it reads low.
          Plex Sans and Plex Mono share their vertical metrics, so centring their line
          boxes centres their capitals too, at any size. */}
      <span style={{ display: "flex", alignItems: "center", alignSelf: "flex-start", minHeight: "var(--task-line-box)", flexShrink: 0 }}>
        <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      </span>
      {/* The identifier sits where the eye scans a column of IDs, ahead of a title that
          wraps to any number of lines. It must stay OUT of `afterTitle` — the responsive
          check in tests/migration/task-rows.mjs measures
          `[data-task-content] > button:last-of-type` as the title. */}
      <ShortId value={shortId} style={{ alignSelf: "flex-start", minHeight: "var(--task-line-box)" }} />
      <button type="button" onClick={onOpen} className={button({ variant: "text" })}
        style={{ flex: 1, minWidth: 0, height: "auto", minHeight: "var(--task-line-box)", justifyContent: "flex-start", textAlign: "left", whiteSpace: "normal", overflowWrap: "anywhere",
          // Top-anchored, padded so the first line's centre is the box's centre. `1lh`
          // resolves against the title's own line height, so the padding follows it; the
          // 1px is the button recipe's transparent border, kept for forced-colours mode.
          alignSelf: "flex-start", alignItems: "flex-start", paddingBlock: "calc((var(--task-line-box) - 1lh) / 2 - 1px)",
          textDecoration: status === "done" ? "line-through" : undefined,
          color: `var(--task-row-title-color, ${status === "done" || status === "deferred" ? "var(--il-dim)" : "var(--il-muted)"})` }}>
        {title}
      </button>
      {afterTitle}
      </div>
      <div data-task-controls>
      {onStatusChange
        ? <StatusSelect value={status} onValueChange={onStatusChange} options={options} />
        : <Badge tone={tone}>{selected?.label || status}</Badge>}
      {owner && <Tooltip label={owner.name}><Avatar name={owner.name} size="sm" tabIndex={0}>{owner.avatar}</Avatar></Tooltip>}
      {metadata}
      {actions && <span data-row-actions style={{ display: "flex", flexShrink: 0 }}>{actions}</span>}
      {trailing}
      </div>
    </div>
  );
});
export function Breadcrumb({
  children,
  fullPath,
  ...props
}: HTMLAttributes<HTMLElement> & { fullPath?: string }) {
  const content = (
    <nav
      {...props}
      aria-label={props["aria-label"] || "Breadcrumb"}
      tabIndex={props.tabIndex ?? (fullPath ? 0 : undefined)}
      style={{ display: "flex", alignItems: "center", gap: 6, ...props.style }}
    >
      {children}
    </nav>
  );
  return fullPath ? <Tooltip label={fullPath} variant="path">{content}</Tooltip> : content;
}
export function BreadcrumbItem({
  current,
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { current?: boolean }) {
  return current ? (
    <span aria-current="page">{children}</span>
  ) : (
    <button
      type="button"
      {...props}
      onClick={onClick}
      className={row({ variant: "crumb" })}
    >
      {children}
    </button>
  );
}
export function BreadcrumbSeparator() {
  return (
    <span aria-hidden style={{ color: "var(--il-dim)" }}>
      ·
    </span>
  );
}


export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  kind?: "person" | "agent";
}
/** Identity image with initials when an image is missing or cannot load. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, src, size = "md", kind = "person", children, className, ...props }, ref,
) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const initials = name.trim().split(/[\s-]+/).filter(Boolean).slice(0, 2)
    .map(part => Array.from(part)[0]).join("").toUpperCase() || "?";
  return (
    <span role="img" aria-label={name} {...props} ref={ref} className={cx(avatar({ size, kind }), className)}>
      {src && failedSrc !== src
        ? <img src={src} alt="" onError={() => setFailedSrc(src)} />
        : children || initials}
    </span>
  );
});
export interface PersonChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  name: string;
  src?: string;
  kind?: "person" | "agent";
  onRemove?: () => void;
}
export function PersonChip({ name, src, kind, onRemove, className, ...props }: PersonChipProps) {
  const styles = identity({ variant: "chip" });
  return (
    <span {...props} className={cx(styles.root, className)}>
      <Avatar name={name} src={src} kind={kind} size="sm" aria-hidden="true" />
      <span className={styles.name}>{name}</span>
      {onRemove && <IconButton label={`Remove ${name}`} size="sm" variant="text" icon={<X size={12} />} onClick={onRemove} />}
    </span>
  );
}
export interface UserCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  name: string;
  src?: string;
  kind?: "person" | "agent";
  description?: ReactNode;
  actions?: ReactNode;
}
/** Shared identity surface; the application owns profile data and actions. */
export function UserCard({ name, src, kind, description, actions, className, ...props }: UserCardProps) {
  const styles = identity({ variant: "card" });
  return (
    <div {...props} className={cx(styles.root, className)}>
      <Avatar name={name} src={src} kind={kind} size="lg" aria-hidden="true" />
      <div className={styles.text}>
        <span className={styles.name}>{name}</span>
        {description && <span className={styles.description}>{description}</span>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}


export interface DisclosureProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  headingLevel?: 2 | 3 | 4;
}
/** Intrinsic-height expansion preserves child state and keeps closed content inert. */
export function Disclosure({
  title, children, defaultOpen = false, open, onOpenChange, headingLevel = 3,
  className, ...props
}: DisclosureProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const expanded = open ?? internalOpen;
  const id = useId();
  const styles = disclosure();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <div {...props} className={cx(styles.root, className)}>
      <Heading className={styles.heading} data-heading>
        <button type="button" id={`${id}-trigger`} className={styles.trigger}
          aria-expanded={expanded} aria-controls={`${id}-panel`}
          onClick={() => {
            if (open === undefined) setInternalOpen(!expanded);
            onOpenChange?.(!expanded);
          }}>
          <ChevronRight size={16} aria-hidden="true" className={styles.chevron} data-open={expanded} />
          {title}
        </button>
      </Heading>
      <div id={`${id}-panel`} className={styles.panel} data-open={expanded}
        aria-hidden={!expanded} ref={node => { if (node) node.inert = !expanded; }}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
