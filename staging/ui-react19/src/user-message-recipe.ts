import { defineSlotRecipe } from "@pandacss/dev";
import { conversationType, space21 } from "./chat-parts";

/**
 * 03 · User-message material — option A, composer-matched fill.
 * Translated from the approved specimen `studio/iter2/Elements.tsx` -> `Material`
 * (variant "a", state "User message") and `.i2-user*` / `.i2-diffusion-a` in `iter2.css`.
 * The fill and the diffusion are the composer's own `--il-fill` and `--il-focus`, so the
 * message and the composer read as the same material. One edge: the hairline. The
 * diffusion is a pseudo-element behind the content, never a second border.
 */
export const userMessage = defineSlotRecipe({
  className: "user-message",
  slots: ["root", "bubble", "text", "editor", "actions"],
  base: {
    // The turn sits against the right gutter at a fixed reading measure.
    root: {
      ...conversationType,
      marginLeft: "auto",
      maxWidth: "450px",
      minWidth: 0,
    },
    bubble: {
      position: "relative",
      isolation: "isolate",
      boxSizing: "border-box",
      minWidth: 0,
      borderRadius: "18px",
      padding: `var(--sys-space-6) ${space21}`,
      // The recipe owns the material outright. The specimen wraps this in `Surface layer="elevated"`
      // and then overrides its fill, blur and shadow, so the surface contributes nothing visible;
      // composing it here would only put two owners on one paint.
      background: "var(--il-fill)",
      border: "1px solid var(--il-edge)",
      backdropFilter: "none",
      boxShadow: "0 12px 30px #00000015",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        zIndex: -1,
        pointerEvents: "none",
        background: "var(--il-focus)",
        opacity: 0.8,
      },
      // Round 1 correction (Daniel, 2026-09-20): "that persistent blue outline that we hate".
      // Editing focus belongs to the bubble's own single edge, not a second rectangle drawn
      // inside the surface — the pattern already approved for the workspace editor
      // (`artifact-workspace-recipe.ts` `card`). One edge per object (design rule 4), and the
      // focus stays plainly perceivable because the whole edge changes colour.
      "&:has(textarea:focus-visible)": {
        borderColor: "var(--nc-focus, var(--sys-accent-line))",
      },
    },
    text: { margin: 0, overflowWrap: "anywhere" },
    editor: {
      // `display: block` + zero padding keep the editing text on the exact line the reading text
      // sat on: a textarea's UA padding is 2px and its default inline-block baseline adds a gap
      // below. Same neutralisation as the workspace editor.
      display: "block",
      width: "100%",
      minHeight: "90px",
      margin: 0,
      padding: 0,
      background: "transparent",
      border: 0,
      color: "inherit",
      resize: "vertical",
      font: "inherit",
      "&:focus-visible": { outline: "none" },
    },
    actions: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: "var(--sys-space-1)",
      marginTop: "var(--sys-space-2)",
      "& button[aria-pressed=true]": {
        color: "var(--nc-ready)",
        background: "var(--nc-elevated-2)",
      },
    },
  },
});
