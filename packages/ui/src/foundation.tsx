import React, { forwardRef, useRef, type HTMLAttributes, type InputHTMLAttributes } from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { foundation, typography, card, button } from "../styled-system/recipes/index.mjs";
import { useCaelosTheme, themeAttributes } from "./theme";

const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(" ");
export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverClose = RadixPopover.Close;
export const PopoverContent = forwardRef<React.ElementRef<typeof RadixPopover.Content>, React.ComponentPropsWithoutRef<typeof RadixPopover.Content>>(function PopoverContent({ className, ...props }, ref) {
  const settings = useCaelosTheme();
  return <RadixPopover.Portal><RadixPopover.Content sideOffset={8} collisionPadding={12} {...props} ref={ref} {...themeAttributes(settings)} className={cx(cx(card({ variant: "glass" }), foundation({ kind: "popover" })), className)} /></RadixPopover.Portal>;
});
export const Range = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(function Range({ className, ...props }, ref) {
  return <input {...props} type="range" ref={ref} className={cx(foundation({ kind: "range" }), className)} />;
});
export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(function Checkbox({ className, ...props }, ref) {
  return <input {...props} type="checkbox" ref={ref} className={cx(foundation({ kind: "checkbox" }), className)} />;
});
type TextTone = "default" | "muted" | "dim" | "accent";
export const Heading = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; size?: "display" | "page" | "section" | "title"; tone?: TextTone }>(function Heading({ as: Tag = "h2", size = "section", tone, className, ...props }, ref) {
  return <Tag {...props} ref={ref} className={cx(typography({ role: size, tone }), className)} />;
});
export const Text = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { as?: "span" | "p" | "div"; variant?: "body" | "small" | "label" | "mono"; tone?: TextTone }>(function Text({ as: Tag = "span", variant = "body", tone, className, ...props }, ref) {
  return <Tag {...props} ref={ref as React.Ref<HTMLParagraphElement>} className={cx(typography({ role: variant, tone }), className)} />;
});
export function Separator({ orientation = "horizontal", decorative = true, className, ...props }: HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical"; decorative?: boolean }) {
  return <div {...props} role={decorative ? "none" : "separator"} aria-orientation={orientation} className={cx(foundation({ kind: "separator" }), className)} />;
}
/** Native determinate progress. Clamp invalid values instead of silently becoming indeterminate. */
export function Progress({ value, max = 100, label, className, ...props }: Omit<React.ProgressHTMLAttributes<HTMLProgressElement>, "value" | "max" | "children"> & { value: number; max?: number; label: string }) {
  const ceiling = Number.isFinite(max) && max > 0 ? max : 1;
  const amount = Number.isFinite(value) ? Math.min(ceiling, Math.max(0, value)) : 0;
  return <progress {...props} value={amount} max={ceiling} aria-label={label} className={cx(foundation({ kind: "progress" }), className)} />;
}
/** Quiet status; the product owns pending state. Deliberately no custom animation. */
export function Loading({ children = "Loading…", ...props }: HTMLAttributes<HTMLElement>) {
  return <Text {...props} variant="small" tone="muted" role="status" aria-live="polite">{children}</Text>;
}
export const LinkButton = forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: "primary" | "tonal" | "text"; size?: "sm" | "md"; danger?: boolean }>(function LinkButton({ variant = "tonal", size = "md", danger, className, ...props }, ref) {
  return <a {...props} ref={ref} className={cx(button({ variant, size, danger }), className)} />;
});
export function Toaster({ toastOptions, icons, ...props }: ToasterProps) {
  const settings = useCaelosTheme();
  return <div {...themeAttributes(settings)}><Sonner theme={settings.theme} {...props} icons={{ loading: <span aria-label="Loading">…</span>, ...icons }} toastOptions={{ ...toastOptions, style: { fontFamily: "inherit", fontSize: 13, lineHeight: "19.5px", background: "var(--nc-opaque)", color: "var(--il-ink)", border: "1px solid var(--il-edge)", ...toastOptions?.style } }} /></div>;
}
export const Surface = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { as?: "div" | "main" | "aside" | "section"; layer?: "ground" | "chrome" | "elevated"; texture?: "plain" | "graph" | "glass" }>(function Surface({ as: Tag = "div", layer = "ground", texture = "plain", className, ...props }, ref) {
  return <Tag {...props} ref={ref as React.Ref<HTMLDivElement>} className={cx(foundation({ kind: "surface", layer, texture }), className)} />;
});
export interface ResizeHandleProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: number; min: number; max: number; step?: number; label: string; onValueChange: (value: number) => void;
}
/** Vertical separator controlling the width of the pane on its left. Pointer capture cleans up on cancellation/unmount. */
export function ResizeHandle({ value, min, max, step = 8, label, onValueChange, className, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, onKeyDown, ...props }: ResizeHandleProps) {
  const drag = useRef<{ x: number; value: number; id: number } | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const stop = (element: HTMLDivElement) => { drag.current = null; delete element.dataset.dragging; };
  return <div {...props} role="separator" tabIndex={0} aria-label={label} aria-orientation="vertical" aria-valuemin={min} aria-valuemax={max} aria-valuenow={clamp(value)} className={cx(foundation({ kind: "resize" }), className)}
    onPointerDown={event => { onPointerDown?.(event); if (event.defaultPrevented || event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); drag.current = { x: event.clientX, value, id: event.pointerId }; event.currentTarget.dataset.dragging = "true"; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={event => { onPointerMove?.(event); if (!event.defaultPrevented && drag.current?.id === event.pointerId) onValueChange(clamp(drag.current.value + event.clientX - drag.current.x)); }}
    onPointerUp={event => { onPointerUp?.(event); stop(event.currentTarget); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={event => { onPointerCancel?.(event); stop(event.currentTarget); }}
    onLostPointerCapture={event => { onLostPointerCapture?.(event); stop(event.currentTarget); }}
    onKeyDown={event => { onKeyDown?.(event); if (event.defaultPrevented) return; const next = event.key === "Home" ? min : event.key === "End" ? max : event.key === "ArrowLeft" ? value - step : event.key === "ArrowRight" ? value + step : null; if (next !== null) { event.preventDefault(); onValueChange(clamp(next)); } }} />;
}
