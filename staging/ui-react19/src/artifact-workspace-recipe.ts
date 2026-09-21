import { defineSlotRecipe } from "@pandacss/dev";
import {
  artifactCard,
  artifactPaperBody,
  artifactStrip,
  conversationType,
  metaType,
  space21,
  space27,
} from "./chat-parts";

/**
 * 05 · Expanded workspace and its side panel — approved 2026-09-20 as option B,
 * "Strip and paper", with a non-modal panel (no scrim, no border, no cast shadow, outside
 * clicks do not dismiss) and the tool pill beside the card.
 * Translated from `studio/iter2/Elements.tsx` -> `ReadingPlane` / `WorkspaceDialog`
 * (variant "b") and `iter2.css`, against computed values measured on the live render.
 *
 * The workspace paints no ground of its own: the only graph paper is the host's, and the
 * panel's own ground dissolves over 36px at its left edge so it joins the conversation's world.
 */
export const artifactWorkspace = defineSlotRecipe({
  className: "artifact-workspace",
  slots: [
    "root",
    "layout",
    "tools",
    "toolbar",
    "toolButton",
    "card",
    "strip",
    "coordinate",
    "coordinateName",
    "meta",
    "actions",
    "body",
    "document",
    "editor",
    "suggestion",
    "panel",
  ],
  base: {
    root: {
      ...conversationType,
      minWidth: 0,
      minHeight: 0,
      paddingBottom: space27,
      borderRadius: "inherit",
    },
    // 40px tool column, then the card. One owner for the 9px between them.
    layout: {
      display: "grid",
      gridTemplateColumns: "40px minmax(0, 1fr)",
      gap: "var(--sys-space-3)",
      alignItems: "start",
      padding: `${space21} var(--sys-space-5) 0`,
    },
    tools: { minWidth: 0 },
    toolbar: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "var(--sys-space-1)",
      borderRadius: "var(--sys-space-3)",
    },
    // A quiet control column: no fill on hover, the accent lands on the glyph alone.
    toolButton: {
      width: "34px",
      padding: 0,
      flexShrink: 0,
      "&:hover": { background: "transparent", boxShadow: "none" },
      "&:hover::before": { opacity: 0 },
      "&:not(:disabled):hover svg": { color: "var(--sys-accent)" },
    },
    card: {
      ...artifactCard,
      // Editing focus belongs to the card's single edge, not a second rectangle inside it.
      "&:has([data-workspace-editor]:focus-visible)": {
        borderColor: "var(--nc-focus, var(--sys-accent-line))",
      },
    },
    strip: {
      ...artifactStrip,
      alignItems: "center",
      paddingRight: "var(--sys-space-3)",
    },
    coordinate: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--sys-space-1)",
      minWidth: 0,
      fontSize: "12px",
    },
    // The strip sets inline `code` to .96em for a preview's coordinate; the workspace's own
    // coordinate is the card's title, so it holds a full 12px. The attribute carries the extra
    // specificity that the strip's element selector would otherwise win.
    coordinateName: {
      "&[data-workspace-coordinate]": {
        fontFamily: "var(--font-nova-mono, 'IBM Plex Mono'), monospace",
        fontSize: "12px",
        color: "var(--il-ink)",
        overflowWrap: "anywhere",
      },
    },
    meta: { ...metaType },
    actions: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "var(--sys-space-1)",
      flex: "none",
    },
    body: { ...artifactPaperBody, minWidth: 0 },
    document: {
      padding: "clamp(21px, 3vw, 39px)",
      fontSize: "15px",
      lineHeight: 1.75,
      minWidth: 0,
      "& h4": {
        margin: 0,
        marginBottom: "var(--sys-space-7)",
        fontSize: "clamp(22px, 2vw, 30px)",
        lineHeight: 1.25,
        fontWeight: 550,
        letterSpacing: "-.02em",
      },
      "& p": { margin: 0 },
      "& p + p": { marginTop: space21 },
      "& [data-activity]": { marginTop: space21 },
    },
    editor: {
      display: "block",
      width: "100%",
      minHeight: "360px",
      border: 0,
      padding: 0,
      resize: "vertical",
      background: "transparent",
      color: "var(--il-ink)",
      font: "inherit",
      lineHeight: 1.75,
      "&:focus-visible": { outline: "none" },
    },
    suggestion: {
      margin: 0,
      marginTop: space21,
      fontSize: "13px",
      color: "var(--nc-sage)",
    },
    /**
     * The non-modal side panel. It paints the same ground as the conversation, casts no
     * shadow and draws no border; its leading edge dissolves over 36px so the two worlds
     * join rather than butt together.
     *
     * Everything here is material and is the same in both frames. WHERE the panel sits is
     * the `frame` variant's business, because that is the host's decision, not the
     * component's — see the variant's own note.
     */
    panel: {
      overflow: "auto",
      outline: "none",
      border: 0,
      boxShadow: "none",
      paddingLeft: "36px",
      backgroundColor: "var(--nc-ground)",
      backgroundImage:
        "linear-gradient(var(--nc-graph-line) 1px, transparent 1px), linear-gradient(90deg, var(--nc-graph-line) 1px, transparent 1px)",
      backgroundSize: "var(--nc-graph-size) var(--nc-graph-size)",
      // Fixed attachment is what keeps the panel's graph paper in register with the host's
      // ground, so the single graph layer reads as one sheet across the join (design rule 5).
      backgroundAttachment: "fixed",
      maskImage: "linear-gradient(to right, transparent 0, black 36px)",
    },
  },
  variants: {
    // Inline in the conversation, or filling the side panel.
    placement: {
      inline: {},
      panel: {
        root: { minHeight: 0, paddingBottom: "45px" },
        /**
         * Round 1 correction (Daniel, 2026-09-20): "a little bit more cusion between the right
         * edge of the screen and the expanded file editor. like 5px max." In a panel the layout's
         * right padding is the ONLY thing between the card and the edge the panel is anchored to
         * — the left already carries the panel's 36px dissolve on top of it — so this is the single
         * owner of that cushion. One spacing step, 15px -> 18px. It belongs to `placement`, not to
         * `frame`, because it is true of the `overlay` and the `slot` frame alike. The inline
         * placement keeps 15/15: its right edge meets its host's stage, not a screen.
         */
        layout: { maxWidth: "1000px", marginInline: "auto", paddingRight: "var(--sys-space-6)" },
        document: { padding: "clamp(24px, 5vw, 60px)" },
      },
    },
    /**
     * Where the panel is positioned.
     *
     * `overlay` is the approved Atlas specimen verbatim (`iter2.css` `.i2-drawer`): a fixed,
     * right-anchored 850px column over the viewport. It is the default so the approved
     * comparison is unchanged by construction.
     *
     * `slot` makes the panel layout-agnostic: it fills whatever box the host gives it and
     * positions nothing itself. A real app lays the conversation column and the panel out
     * side by side, so the panel never covers the control that opened it (design rule 7) and
     * the conversation stays live *beside* it rather than under it.
     */
    frame: {
      overlay: {
        panel: {
          position: "fixed",
          inset: "0 0 0 auto",
          width: "min(100vw, 850px)",
          height: "100dvh",
          zIndex: 91,
          "&[data-full=true]": { width: "100vw" },
        },
      },
      slot: {
        panel: {
          position: "relative",
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
        },
      },
    },
  },
  defaultVariants: { placement: "inline", frame: "overlay" },
});
