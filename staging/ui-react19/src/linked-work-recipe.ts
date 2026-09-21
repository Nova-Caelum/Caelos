import { defineSlotRecipe } from "@pandacss/dev";

/**
 * `linkedWork` — the approved Atlas 2 linked-work trigger and preview shell, packaged
 * 2026-09-20. Transcribed from `design-atlas-2/linked-work-preview.css`.
 *
 * SCOPE, stated plainly. What is packaged is the TRIGGER and the POPOVER SHELL: the quiet
 * project / module words in the header's subtitle row, and the preview surface with its
 * attachment behaviour — a virtual anchor on the header card so the preview hangs off the
 * card's own bottom edge with a sub-pixel join, `side="bottom" align="start" sideOffset={0}`,
 * `avoidCollisions={false}` with a measured `alignOffset`, `updatePositionStrategy="always"`,
 * and a 260ms enter on the composer curve against a 130ms exit.
 *
 * What is NOT packaged is everything INSIDE it. The Atlas body renders the Task Graph — it
 * imports `@/app/App` types, `task-graph-details.tsx` and `checkout-files.tsx` from the
 * React 18 `Caelos-console` checkout, and its fixtures are a hard-coded module seed. None of
 * that belongs in a presentational library, so the preview takes `children` and the host
 * supplies the body. The corresponding `.linked-module-*`, `.linked-task-*`,
 * `.linked-work-heading` / `-criteria` / `-path` / `-foot` and `.checkout-files` rules stay
 * in the Atlas with the content they style.
 */
export const linkedWork = defineSlotRecipe({
  className: "linked-work",
  slots: ["links", "triggerLabel", "divider"],
  base: {
    /** `.linked-work-links` — sits inside the header's subtitle row, which is pointer-inert. */
    links: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      minWidth: 0,
      pointerEvents: "auto",
    },
    triggerLabel: {
      display: "block",
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    divider: { flexShrink: 0, color: "var(--il-dim)", fontSize: "12px" },
  },
});
