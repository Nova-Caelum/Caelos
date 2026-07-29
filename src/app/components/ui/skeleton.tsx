"use client";

import * as React from "react";
import { cn } from "./utils";

/**
 * Nova Caelum liquid-glass skeleton.
 * Recipe: Elevated-1 substrate (a skeleton sits IN the content flow, not
 * floating above chrome, so it borrows the quieter Elevated surface, not
 * Elevated-2) + a single faint inset top highlight (the glass-menu "rim
 * light" cue, turned down to a whisper) + a slow shimmer sweep tinted with
 * accent-line/accent-cream rather than white, so the loading affordance
 * still reads as Nova Caelum and not generic shadcn animate-pulse.
 *
 * No backdrop-filter here on purpose — a skeleton replaces content rather
 * than floating over it, so there's nothing behind it worth blurring. The
 * glass cue is carried entirely by tint + rim-light + shimmer.
 *
 * Keyframes are self-injected once (module-scoped guard) so this component
 * is a true drop-in with no required theme.css edit. If the keyframes get
 * moved into theme.css later, this injection becomes a harmless no-op.
 *
 * Designer rebuild 2026-07-28. Superseded shadcn-default (bg-accent
 * animate-pulse) which had zero glass characteristics.
 */
let injected = false;
function useShimmerKeyframes() {
  React.useEffect(() => {
    if (injected || typeof document === "undefined") return;
    injected = true;
    const style = document.createElement("style");
    style.setAttribute("data-nc-glass-skeleton", "");
    style.textContent = `
      @keyframes nc-skeleton-shimmer {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(120%); }
      }
      @media (prefers-reduced-motion: reduce) {
        .nc-skeleton-shimmer { animation: none !important; opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }, []);
}

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  useShimmerKeyframes();
  return (
    <div
      data-slot="skeleton"
      className={cn("relative overflow-hidden rounded-md", className)}
      style={{
        background: "rgba(34,30,51,0.55)", // nc-elevated @ 55%
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      {...props}
    >
      <div
        className="nc-skeleton-shimmer absolute inset-y-0 -left-1/4 w-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(109,90,209,0.16), rgba(196,185,240,0.10), rgba(109,90,209,0.16), transparent)",
          animation: "nc-skeleton-shimmer 1.8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export { Skeleton };
