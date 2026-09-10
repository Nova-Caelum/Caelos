import React, { forwardRef, useId, useRef, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import * as RadixContextMenu from "@radix-ui/react-context-menu";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, Minus, X } from "lucide-react";
import { card, menu, overlay } from "../styled-system/recipes/index.mjs";
import { themeAttributes, useCaelosTheme } from "./theme";
import { IconButton, ScrollArea } from "./components";
const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(" ");

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  bodyLabel?: string;
  closeLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
}
function OverlaySurface({ open, onOpenChange, onEscapeKeyDown, title, description, children, actions,
  className, style, initialFocusRef, returnFocusRef, bodyLabel = "Dialog content", closeLabel = "Close dialog", drawer = false,
}: DialogProps & { drawer?: boolean }) {
  const settings = useCaelosTheme();
  const styles = overlay({ placement: drawer ? "drawer" : "dialog" });
  const returnFocus = useRef<HTMLElement | null>(null);
  const descriptionId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  return <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    <RadixDialog.Portal>
      <RadixDialog.Overlay {...themeAttributes(settings)} className={styles.backdrop} />
      <RadixDialog.Content ref={contentRef} {...themeAttributes(settings)}
        className={cx(cx(card({ variant: "glass" }), styles.content), className)} style={style}
        aria-describedby={description ? descriptionId : undefined}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={event => {
          if (document.activeElement instanceof HTMLElement && !contentRef.current?.contains(document.activeElement)) returnFocus.current = document.activeElement;
          // Focusing the tooltip-wrapped close control opens a competing Escape layer.
          // Prefer editable content; otherwise focus the named dialog itself.
          const target = initialFocusRef?.current ?? contentRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [role="combobox"]:not([disabled])') ?? contentRef.current;
          if (target) { event.preventDefault(); target.focus(); }
        }}
        onCloseAutoFocus={event => {
          const target = returnFocusRef?.current ?? returnFocus.current;
          if (target?.isConnected) { event.preventDefault(); target.focus(); }
        }}>
        <div className={styles.header}>
          <RadixDialog.Title asChild><div className={styles.title} data-heading={typeof title === "string" ? "" : undefined}>{title}</div></RadixDialog.Title>
          {actions}
          <RadixDialog.Close asChild><IconButton variant="text" label={closeLabel} icon={<X size={15} />} /></RadixDialog.Close>
        </div>
        <ScrollArea viewportLabel={bodyLabel} className={styles.body}>
          {description && <RadixDialog.Description id={descriptionId}>{description}</RadixDialog.Description>}
          {children}
        </ScrollArea>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  </RadixDialog.Root>;
}
/** Controlled modal. The caller retains drafts and owns accepted mutations. */
export function Dialog(props: DialogProps) { return <OverlaySurface {...props} />; }
/** The same dialog contract, anchored to the right edge. Width/offset are layout props. */
export function Drawer(props: DialogProps) { return <OverlaySurface {...props} drawer />; }

export const ContextMenu = RadixContextMenu.Root;
export const ContextMenuTrigger = forwardRef<React.ElementRef<typeof RadixContextMenu.Trigger>, React.ComponentPropsWithoutRef<typeof RadixContextMenu.Trigger>>(function ContextMenuTrigger({ onKeyDown, disabled, ...props }, ref) {
  return <RadixContextMenu.Trigger {...props} ref={ref} disabled={disabled} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) return;
    event.preventDefault();
    // The installed Radix trigger handles pointer contextmenu but not these keys.
    // Use that same path, anchored to the focused control.
    const target = event.target instanceof HTMLElement ? event.target : event.currentTarget;
    const bounds = target.getBoundingClientRect();
    target.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: bounds.left + bounds.width / 2, clientY: bounds.bottom }));
  }} />;
});
export const ContextMenuContent = forwardRef<React.ElementRef<typeof RadixContextMenu.Content>, React.ComponentPropsWithoutRef<typeof RadixContextMenu.Content>>(function ContextMenuContent({ className, style, ...props }, ref) {
  const settings = useCaelosTheme();
  return <RadixContextMenu.Portal><RadixContextMenu.Content {...props} ref={ref} {...themeAttributes(settings)} collisionPadding={12}
    className={cx(menu({ layout: "action" }).content, className)} style={{ "--radix-dropdown-menu-content-available-height": "var(--radix-context-menu-content-available-height)", "--radix-dropdown-menu-content-transform-origin": "var(--radix-context-menu-content-transform-origin)", ...style } as React.CSSProperties} /></RadixContextMenu.Portal>;
});
export const ContextMenuItem = forwardRef<React.ElementRef<typeof RadixContextMenu.Item>, React.ComponentPropsWithoutRef<typeof RadixContextMenu.Item>>(function ContextMenuItem({ className, ...props }, ref) {
  return <RadixContextMenu.Item {...props} ref={ref} className={cx(menu({ layout: "action" }).item, className)} />;
});
export function ContextMenuSeparator(props: React.ComponentPropsWithoutRef<typeof RadixContextMenu.Separator>) {
  return <RadixContextMenu.Separator {...props} className={cx(menu({ layout: "action" }).separator, props.className)} />;
}

// Composable parts of ActionMenu preserve caller-owned state and arbitrary menu content.
export const ActionMenuRoot = Dropdown.Root;
export const ActionMenuTrigger = Dropdown.Trigger;
export const ActionMenuContent = forwardRef<React.ElementRef<typeof Dropdown.Content>, React.ComponentPropsWithoutRef<typeof Dropdown.Content>>(function ActionMenuContent({ className, ...props }, ref) {
  const settings = useCaelosTheme();
  return <Dropdown.Portal><Dropdown.Content sideOffset={8} collisionPadding={12} {...props} ref={ref} {...themeAttributes(settings)} className={cx(menu({ layout: "action" }).content, className)} /></Dropdown.Portal>;
});
export const ActionMenuItem = forwardRef<React.ElementRef<typeof Dropdown.Item>, React.ComponentPropsWithoutRef<typeof Dropdown.Item>>(function ActionMenuItem({ className, ...props }, ref) {
  return <Dropdown.Item {...props} ref={ref} className={cx(menu({ layout: "action" }).item, className)} />;
});
/** Checkbox semantics and a stable indicator column within the shared compact menu. */
export const ActionMenuCheckboxItem = forwardRef<React.ElementRef<typeof Dropdown.CheckboxItem>, React.ComponentPropsWithoutRef<typeof Dropdown.CheckboxItem>>(function ActionMenuCheckboxItem({ className, children, checked, ...props }, ref) {
  return <Dropdown.CheckboxItem {...props} ref={ref} checked={checked} className={cx(menu({ layout: "action" }).item, className)}>
    <span aria-hidden="true" style={{ width: 14, height: 14, flexShrink: 0 }}>
      <Dropdown.ItemIndicator>{checked === "indeterminate" ? <Minus size={14} /> : <Check size={14} />}</Dropdown.ItemIndicator>
    </span>
    {children}
  </Dropdown.CheckboxItem>;
});
export function ActionMenuSeparator(props: React.ComponentPropsWithoutRef<typeof Dropdown.Separator>) {
  return <Dropdown.Separator {...props} className={cx(menu({ layout: "action" }).separator, props.className)} />;
}
