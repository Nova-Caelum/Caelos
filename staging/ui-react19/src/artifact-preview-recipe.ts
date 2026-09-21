import { defineSlotRecipe } from "@pandacss/dev";
import {
  artifactCard,
  artifactPaperBody,
  artifactStrip,
  chevronMotion,
  conversationType,
  metaType,
  quietTrigger,
  space21,
} from "./chat-parts";

/**
 * 04 · Inline preview — approved 2026-09-20 as option B, "Strip and paper", with the
 * glass-to-paper blend. Daniel: "Perfect!! crushed it. We have our winner. Lock it in."
 * Translated from `studio/iter2/Elements.tsx` -> `Preview` (variant "b", `data-inner="paper"`)
 * and the `.i2-glass-*` block in `iter2.css`, against computed values measured on the live
 * render (1512x806, dark, 2026-09-20).
 *
 * One glass card: a strip carrying the type icon, name, kind and coordinate, and the actions;
 * a plain `elevated-2` paper plane running the full width, fading in over 30px so the material
 * step leaves no line. No divider, no nested card, no second graph layer.
 */
export const artifactPreview = defineSlotRecipe({
  className: "artifact-preview",
  slots: [
    "root",
    "trigger",
    "triggerChevron",
    "card",
    "strip",
    "name",
    "nameText",
    "title",
    "meta",
    "actions",
    "body",
    "excerpt",
    "generating",
    "notice",
  ],
  base: {
    root: { ...conversationType, width: "100%", maxWidth: "28rem", minWidth: 0 },
    trigger: { ...quietTrigger },
    triggerChevron: { flexShrink: 0, ...chevronMotion },
    card: { ...artifactCard, marginTop: "var(--sys-space-4)" },
    strip: { ...artifactStrip, alignItems: "flex-start" },
    name: {
      display: "flex",
      alignItems: "flex-start",
      gap: "var(--sys-space-3)",
      minWidth: 0,
      "& > svg": {
        flex: "none",
        marginTop: "var(--sys-space-1)",
        color: "var(--il-muted)",
      },
    },
    nameText: { display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 },
    title: {
      margin: 0,
      fontSize: "14px",
      lineHeight: "20px",
      fontWeight: 550,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    meta: { ...metaType, lineHeight: "16px", overflowWrap: "anywhere" },
    actions: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "var(--sys-space-1)",
      flex: "none",
    },
    body: { ...artifactPaperBody, minWidth: 0 },
    // The reading window. The fade belongs only to content that really runs past it.
    excerpt: {
      maxHeight: "196px",
      overflow: "hidden",
      paddingTop: "var(--sys-space-6)",
      paddingRight: space21,
      paddingBottom: space21,
      paddingLeft: space21,
      color: "var(--il-ink)",
      "& h5": {
        margin: `0 0 var(--sys-space-4)`,
        fontSize: "21px",
        lineHeight: 1.25,
        fontWeight: 550,
        letterSpacing: "-.02em",
        color: "var(--il-ink)",
      },
      "& p": { margin: 0 },
      "& p + p": { marginTop: "var(--sys-space-4)" },
      "& [data-activity]": { marginTop: "var(--sys-space-4)" },
      // Overrun: the last lines dissolve instead of being cut at an edge.
      "&[data-overrun=true]": {
        paddingBottom: 0,
        maskImage: "linear-gradient(to bottom, black 62%, transparent 98%)",
      },
      // An agent session is interactive, so it is never capped or faded: the card grows.
      "&[data-fit=content]": { maxHeight: "none" },
    },
    // Strip (~62px) plus this well is about three quarters of the card's final height.
    generating: {
      display: "grid",
      placeItems: "center",
      height: "138px",
      paddingBottom: "var(--sys-space-2)",
    },
    notice: { ...metaType, display: "block", padding: `0 ${space21} var(--sys-space-4)` },
  },
});
