"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "./utils";

/**
 * Nova Caelum liquid-glass popover.
 * This is the .nc-glass-menu recipe inherited near-verbatim: semi-transparent
 * Elevated-2 substrate, blur+saturate backdrop, accent-line border, layered
 * shadow (contact shadow + ambient shadow + hairline rim), inset top
 * highlight. Popover and context-menu share the same anatomy — floating
 * chrome over arbitrary page content — so there's no reason to invent a
 * second recipe.
 *
 * Designer rebuild 2026-07-28. Superseded shadcn-default popover (bg-popover
 * + shadow-md + plain border). API-compatible drop-in; adds PopoverArrow.
 */

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) p-4 outline-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "text-[color:var(--nc-text-cream)]",
          className,
        )}
        style={{
          background: "rgba(42,37,64,0.55)", // nc-elevated-2 @ 55% — .nc-glass-menu substrate
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid var(--nc-accent-line)",
          borderRadius: "10px",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverArrow({ className, ...props }: React.ComponentProps<typeof PopoverPrimitive.Arrow>) {
  // SVG fills can't backdrop-filter, so the arrow uses a near-opaque solid
  // approximation of the Elevated-2 wash plus a matching accent-line stroke
  // to read as continuous with the blurred panel it points from.
  return (
    <PopoverPrimitive.Arrow
      data-slot="popover-arrow"
      width={14}
      height={7}
      className={cn("fill-current", className)}
      style={{ fill: "rgba(38,33,58,0.94)", stroke: "var(--nc-accent-line)", strokeWidth: 1 }}
      {...props}
    />
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverArrow };
