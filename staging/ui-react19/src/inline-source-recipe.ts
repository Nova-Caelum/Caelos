import { defineRecipe } from "@pandacss/dev";

/**
 * 09 · Inline source — the quiet chip. Reviewed in Iter 2 as direction A.
 * Translated from `studio/iter2/Elements.tsx` -> `Sources` (variant "a") and `.i2-source*`
 * in `iter2.css`.
 *
 * Fidelity note: the specimen's own rule declares `color: var(--il-ink)`, but the atlas's
 * `.atlas3 a` rule outranks it, so the chip Daniel approved renders MUTED (measured
 * rgb(183, 175, 196)). The muted ink is carried here deliberately, so the packaged chip looks
 * like the approved render rather than like the specimen's unreached declaration.
 */
export const inlineSource = defineRecipe({
  className: "inline-source",
  base: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: "var(--sys-space-1)",
    borderRadius: "var(--sys-space-2)",
    padding: "1px var(--sys-space-2)",
    background: "var(--nc-elevated-2)",
    color: "var(--il-muted)",
    fontSize: "12px",
    textDecoration: "none",
    overflowWrap: "anywhere",
    "& > svg": { flexShrink: 0 },
    "&:hover": { color: "var(--il-ink)" },
    "&:focus-visible": {
      outline: "2px solid var(--nc-focus-ring, var(--nc-ready))",
      outlineOffset: "3px",
    },
  },
});
