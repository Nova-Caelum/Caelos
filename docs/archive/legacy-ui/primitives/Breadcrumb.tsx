import { Children, isValidElement, useCallback, useState, type HTMLAttributes, type ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

// ─────────────────────────────────────────────────────────────────────────────
// Breadcrumb — trail-of-context primitive.
// Rebuild (2026-07-31, Da Vinci) — replaces both the orphaned
// components/ui/breadcrumb.tsx (glass chip with inset-highlight stripe, banned
// edge chemistry) and the .locked-bc-* inline classes duplicated in App.tsx.
//
// Design intent:
//   – NO own surface: inherits the surface it lands on (character system paints
//     the parent; the breadcrumb is just typography on top).
//   – NO chip/pill container, NO backdrop-filter, NO ::before pseudo, NO glow.
//     Just inline flex text segments with a middle-dot separator.
//   – Last segment (aria-current="page") reads as the current location via
//     colour + position, not via an active-state box. Signs aren't stateful.
//   – Tokens only — no hex, rgba, or px literals (zero-literal gate).
// ─────────────────────────────────────────────────────────────────────────────

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** Full hierarchy when the visible trail omits or abbreviates segments. */
  fullPath?: string;
}

function textOf(children: ReactNode): string {
  return Children.toArray(children).map(child => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    return isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : "";
  }).join("");
}

function pathOf(children: ReactNode): string[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    if (child.type === BreadcrumbItem) return [textOf(child.props.children)];
    return pathOf(child.props.children);
  });
}

export function Breadcrumb({ className = "", children, fullPath, onPointerMove, onFocus, ...props }: BreadcrumbProps) {
  const [pointerX, setPointerX] = useState<number | null>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const measureTooltip = useCallback((node: HTMLDivElement | null) => {
    if (node) setTooltipWidth(node.getBoundingClientRect().width);
  }, []);
  const path = fullPath ?? pathOf(children).filter(Boolean).join(" / ");
  const trail = (
    <nav
      aria-label="breadcrumb"
      tabIndex={path ? 0 : undefined}
      className={`nc-breadcrumb${className ? ` ${className}` : ""}`}
      {...props}
      onPointerMove={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointerX(event.clientX - bounds.left);
        onPointerMove?.(event);
      }}
      onFocus={event => {
        setPointerX(null);
        onFocus?.(event);
      }}
    >
      {children}
    </nav>
  );
  if (!path) return trail;
  return (
    <Tooltip.Provider delayDuration={350}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{trail}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="nc-breadcrumb__tooltip" ref={measureTooltip} side="top" align={pointerX === null ? "center" : "start"} alignOffset={pointerX === null ? 0 : pointerX - tooltipWidth / 2} sideOffset={10} collisionPadding={12}>
            {path}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export interface BreadcrumbItemProps {
  children: ReactNode;
  /** Optional click handler — omit for non-interactive segments (last/current). */
  onClick?: () => void;
  /** When true, marks the segment as the current location (aria-current="page"). */
  current?: boolean;
  className?: string;
}

export function BreadcrumbItem({ children, onClick, current, className = "" }: BreadcrumbItemProps) {
  const cls = `nc-breadcrumb__item${current ? " nc-breadcrumb__item--current" : ""}${onClick ? " nc-breadcrumb__item--clickable" : ""}${className ? ` ${className}` : ""}`;
  if (current) {
    return (
      <span aria-current="page" className={cls}>{children}</span>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>{children}</button>
    );
  }
  return <span className={cls}>{children}</span>;
}

export function BreadcrumbSeparator() {
  return <span aria-hidden="true" className="nc-breadcrumb__sep">·</span>;
}
