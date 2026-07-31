"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "./utils";

/**
 * Nova Caelum liquid-glass separator.
 * Recipe: an engraved channel, not a bare gradient line. A hairline track
 * (--nc-hair-2) that gathers into a soft accent-line "pit" at midspan — the
 * same accent-line cue .nc-glass-menu uses for its border — plus a paired
 * light-above / dark-below box-shadow so the line reads as recessed into the
 * surface rather than floating on top of it.
 *
 * Designer rebuild 2026-07-28. Superseded prior thin adaptation
 * (bg-gradient-to-r from-transparent via-white/20 to-transparent).
 */
const GlassSeparator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, style, ...props }, ref) => {
  const isHorizontal = orientation === "horizontal";

  const grooveStyle: React.CSSProperties = isHorizontal
    ? {
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, var(--nc-hair-2) 14%, var(--nc-hair-2) 38%, var(--nc-accent-line) 50%, var(--nc-hair-2) 62%, var(--nc-hair-2) 86%, transparent 100%)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.035), 0 -1px 0 rgba(0,0,0,0.30)",
      }
    : {
        backgroundImage:
          "linear-gradient(180deg, transparent 0%, var(--nc-hair-2) 14%, var(--nc-hair-2) 38%, var(--nc-accent-line) 50%, var(--nc-hair-2) 62%, var(--nc-hair-2) 86%, transparent 100%)",
        boxShadow: "1px 0 0 rgba(255,255,255,0.035), -1px 0 0 rgba(0,0,0,0.30)",
      };

  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn("shrink-0", isHorizontal ? "h-px w-full" : "h-full w-px", className)}
      style={{ ...grooveStyle, ...style }}
      {...props}
    />
  );
});
GlassSeparator.displayName = SeparatorPrimitive.Root.displayName;

export { GlassSeparator };
