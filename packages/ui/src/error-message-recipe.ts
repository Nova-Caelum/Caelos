import { defineSlotRecipe } from "@pandacss/dev";

/**
 * Shared failure material, ported from the React 19 `caelos-chat-react19` package
 * (`error-message-recipe.ts`, whose base is the approved attachment card's
 * `fileCard.base`). Two substitutions, both because the token or helper does not
 * exist in this package:
 *   - `conversationType` (14px / 1.55) is inlined;
 *   - the failed card's blur reads `--nc-glass-blur` (this package's glass blur,
 *     0px when glass is off) instead of `--nc-surface-blur`.
 * Everything else — the danger token set for ink, line, tint and glow, the
 * two-line label, the full-width open target — is unchanged.
 */
export const errorMessage = defineSlotRecipe({
  className: "error-message",
  slots: ["root", "open", "symbol", "label", "name", "detail"],
  base: {
    root: {
      fontSize: "14px",
      lineHeight: 1.55,
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
      "&[data-failed=true]": {
        color: "var(--sys-sem-danger-on-tint)",
        border: "1px solid var(--sys-sem-danger-line)",
        background: "var(--sys-sem-danger-tint)",
        backdropFilter: "blur(var(--nc-glass-blur)) saturate(140%)",
        boxShadow: "var(--sys-elev-1), 0 0 18px var(--sys-sem-danger-glow)",
      },
    },
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
    // Two lines: what failed, then why.
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
