"use client";

import * as React from "react";
import { cn } from "./utils";

/**
 * Nova Caelum liquid-glass breadcrumb.
 * Two reaches beyond the prior thin adaptation:
 *  1. `glass` prop — when the breadcrumb strip sits directly on a chrome
 *     header above a drawer edge, it can opt into a scaled-down .nc-glass-menu
 *     substrate (semi-transparent Elevated-2 + blur/saturate + hairline
 *     bottom edge) so there's a visible boundary between chrome and content.
 *     Off by default — most breadcrumbs sit on an already-opaque header and
 *     don't need their own glass layer (no gimmicks).
 *  2. BreadcrumbSeparator is now an accent-line tick, not a ChevronRight
 *     glyph — a 1px hairline that gathers accent-line color at its center,
 *     echoing the same "gathered accent" cue the separator primitive uses.
 *
 * Designer rebuild 2026-07-28. Superseded prior lucide-chevron adaptation.
 */

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { glass?: boolean }
>(({ className, glass = false, style, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="breadcrumb"
    className={cn(
      "flex items-center min-w-0",
      glass && "rounded-md px-3 py-1.5",
      className,
    )}
    style={
      glass
        ? {
            background: "rgba(42,37,64,0.55)", // nc-elevated-2 @ 55% — .nc-glass-menu substrate
            backdropFilter: "blur(16px) saturate(160%)",
            WebkitBackdropFilter: "blur(16px) saturate(160%)",
            borderBottom: "1px solid var(--nc-hair-2)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 16px rgba(0,0,0,0.22)",
            ...style,
          }
        : style
    }
    {...props}
  />
));
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.OlHTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => (
    <ol ref={ref} className={cn("flex items-center gap-1.5 text-sm min-w-0", className)} {...props} />
  )
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1.5 min-w-0", className)} {...props} />
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "truncate text-[13px] transition-colors",
        "text-[color:var(--nc-text-muted)] hover:text-[color:var(--nc-text-cream)]",
        "focus:outline-none focus-visible:text-[color:var(--nc-text-cream)]",
        className,
      )}
      {...props}
    />
  )
);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("truncate text-[13px] font-medium text-[color:var(--nc-text-cream)]", className)}
      {...props}
    />
  )
);
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("flex-shrink-0 flex items-center justify-center h-3 w-2", className)}
    {...props}
  >
    <span
      className="block h-3 w-px rotate-[16deg]"
      style={{
        background:
          "linear-gradient(180deg, var(--nc-hair-2) 0%, var(--nc-accent-line) 50%, var(--nc-hair-2) 100%)",
      }}
    />
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
