import { defineSlotRecipe } from "@pandacss/dev";
import { conversationType } from "./chat-parts";

/**
 * 10 · Orientation and recovery — the unread divider, the compact error and the jump control.
 * Reviewed in Iter 2 as direction A; Daniel called the compact error "actually pretty good"
 * and wants it generalised later. The review also asked for changes to the two "below"
 * controls that the specimen does not implement, so this study is carried here as
 * UNCONFIRMED, exactly as the Gallery labels it.
 * Translated from `studio/iter2/Elements.tsx` -> `Recovery` (variant "a") and
 * `.i2-unread` / `.i2-error` / `.i2-navigation` / `.i2-jump` in `iter2.css`.
 */
export const recovery = defineSlotRecipe({
  className: "recovery",
  slots: ["unread", "error", "errorText", "navigation", "jump"],
  base: {
    // A rule made of space and a label, not a drawn line across the column.
    unread: {
      ...conversationType,
      display: "flex",
      alignItems: "center",
      gap: "var(--sys-space-4)",
      margin: "var(--sys-space-7) 0",
      fontSize: "11px",
      color: "var(--il-muted)",
      "&::before, &::after": {
        content: '""',
        background: "var(--il-edge)",
        height: "1px",
        flex: 1,
      },
    },
    /**
     * The compact error. One object, one edge, the danger token set complete: on-tint ink,
     * the line, the tint and the glow. The retry sits on the same row, never below it.
     */
    error: {
      ...conversationType,
      display: "flex",
      alignItems: "center",
      gap: "var(--sys-space-5)",
      padding: "var(--sys-space-5)",
      borderRadius: "var(--sys-space-3)",
      color: "var(--sys-sem-danger-on-tint)",
      border: "1px solid var(--sys-sem-danger-line)",
      background: "var(--sys-sem-danger-tint)",
      boxShadow: "var(--sys-elev-1), 0 0 18px var(--sys-sem-danger-glow)",
      "& > button": { flexShrink: 0 },
    },
    errorText: { flex: 1, margin: 0, minWidth: 0 },
    navigation: {
      ...conversationType,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "var(--sys-space-8)",
    },
    /**
     * A marker slot only. The jump control's geometry and material both come from
     * `controlSkin({ kind: "glass" })`, because a slot style cannot outrank the shared button
     * recipe's own size and tonal-fill variants — that is a cascade-layer fact, not a
     * specificity one. See `danger-control-recipe.ts`.
     */
    jump: { borderWidth: "1px", borderStyle: "solid" },
  },
});
