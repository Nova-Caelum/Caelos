import { defineRecipe } from "@pandacss/dev";

/**
 * Control skins — a shared control whose material must override the shared button recipe's own
 * variant. Two members today: the danger retry (08 and 10) and the glass jump control (10).
 * In the approved specimens these are `.i2-danger-control` and `.i2-jump`.
 *
 * WHY THIS IS A PLAIN RECIPE WITH A VARIANT, and not a slot on `fileCard` / `recovery`:
 * Panda emits recipe BASE styles into `@layer recipes._base`, recipe VARIANTS directly into
 * `@layer recipes`, and every slot recipe into `@layer recipes.slots`. A sub-layer always loses
 * to its parent layer, whatever the specificity — so a slot style, or even a plain recipe's base
 * style, cannot beat `.caelos-button--variant_tonal` or `.caelos-button--danger_true`. Declared
 * as a variant, this lands in the same layer as those rules and wins on specificity, which is
 * deterministic rather than dependent on emission order.
 *
 * The file name predates the second kind.
 */
export const controlSkin = defineRecipe({
  className: "control-skin",
  base: {},
  variants: {
    kind: {
      /**
       * Daniel's standing Iter 2 ask for the retry: behave like the package's button tokens on
       * hover, with more glow. The danger tint's own 12px glow at rest; the danger set's hover
       * ink, its line and an 18px glow on hover.
       */
      danger: {
        boxShadow: "0 0 12px var(--sys-sem-danger-tint)",
        "&[data-nc-control-skin]:is(:hover, [data-force-state=hover]):not(:disabled)": {
          color: "var(--sys-sem-danger-hover)",
          borderColor: "var(--sys-sem-danger-line)",
          boxShadow: "0 0 18px var(--sys-sem-danger-glow)",
        },
      },
      /**
       * A floating control in the conversation's own glass, not a filled button. Its geometry
       * lives here too, not in the `recovery` slot recipe: the shared button recipe's `size`
       * variant sets a 32px height from the parent layer, which a slot height cannot outrank.
       * The attribute keeps every declaration above the button's own same-specificity variants.
       */
      glass: {
        "&[data-nc-control-skin]": {
          display: "flex",
          alignItems: "center",
          gap: "var(--sys-space-3)",
          width: "auto",
          minWidth: "64px",
          height: "58px",
          padding: "var(--sys-space-3) var(--sys-space-5)",
          borderRadius: "16px",
          color: "var(--il-ink)",
          background: "var(--nc-glass-bg)",
          borderColor: "var(--nc-glass-edge)",
          backdropFilter: "blur(var(--nc-glass-blur))",
          boxShadow: "var(--sys-elev-1)",
        },
        "&[data-nc-control-skin]:is(:hover, [data-force-state=hover]):not(:disabled)": {
          color: "var(--il-ink)",
          background: "var(--nc-glass-bg)",
          boxShadow: "var(--sys-elev-1)",
        },
      },
    },
  },
  defaultVariants: { kind: "danger" },
});
