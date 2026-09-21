import { defineSlotRecipe } from "@pandacss/dev";
import { conversationType } from "./chat-parts";

/**
 * 08 · File card — approved 2026-09-20 as option A, the two-line card (name first, type and
 * size below). Daniel: "yes i am selecting option A". This supersedes the Iter 2 note
 * "Direction: B". His Iter 2 asks for the failed state still stand and are built in here:
 * more glow from the danger token set, and a retry that behaves like the package's button
 * tokens on hover.
 * Translated from `studio/iter2/Elements.tsx` -> `Attachment` (variant "a") and `.i2-attachment*`
 * in `iter2.css`, against computed values measured on the live render.
 */
export const fileCard = defineSlotRecipe({
  className: "file-card",
  slots: ["root", "open", "symbol", "label", "name", "detail"],
  base: {
    root: {
      ...conversationType,
      display: "flex",
      alignItems: "center",
      gap: "var(--sys-space-4)",
      width: "100%",
      maxWidth: "21rem",
      minWidth: 0,
      border: "1px solid var(--il-edge)",
      borderRadius: "var(--sys-space-3)",
      padding: "var(--sys-space-4)",
      // The failed state is the danger token set, complete: ink, line, tint and glow.
      // The blur is the same glass the ready card gets from `Surface layer="elevated"`; the
      // failed card draws its own material, so it restates it rather than composing the surface.
      "&[data-failed=true]": {
        color: "var(--sys-sem-danger-on-tint)",
        border: "1px solid var(--sys-sem-danger-line)",
        background: "var(--sys-sem-danger-tint)",
        backdropFilter: "blur(var(--nc-surface-blur)) saturate(140%)",
        boxShadow: "var(--sys-elev-1), 0 0 18px var(--sys-sem-danger-glow)",
      },
    },
    // The whole card body opens the file. `Row` semantics: one button, nothing nested in it.
    open: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sys-space-4)",
      flex: 1,
      minWidth: 0,
      textAlign: "left",
      color: "var(--il-ink)",
      background: "transparent",
      border: 0,
      padding: 0,
      font: "inherit",
      cursor: "pointer",
      "&:focus-visible": {
        outline: "2px solid var(--nc-focus-ring, var(--nc-ready))",
        outlineOffset: "3px",
      },
      "[data-failed=true] &": { color: "var(--sys-sem-danger-on-tint)" },
    },
    symbol: {
      display: "flex",
      flexShrink: 0,
      color: "var(--il-muted)",
      "[data-failed=true] &": { color: "var(--sys-sem-danger-on-tint)" },
    },
    // Two lines: the name, then the type and size.
    label: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--sys-space-1)",
      minWidth: 0,
      overflowWrap: "anywhere",
      fontSize: "13px",
    },
    name: { minWidth: 0 },
    detail: {
      fontSize: "11px",
      color: "var(--il-muted)",
      "[data-failed=true] &": { color: "var(--sys-sem-danger-on-tint)" },
    },
  },
});
// The retry control is the shared `controlSkin` recipe, not a slot here — see its own file
// for why a slot cannot win the hover against the shared button recipe.
