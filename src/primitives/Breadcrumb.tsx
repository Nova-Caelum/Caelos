import type { HTMLAttributes, ReactNode } from "react";

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

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {}

export function Breadcrumb({ className = "", children, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={`nc-breadcrumb${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </nav>
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
