import { defineSlotRecipe } from "@pandacss/dev";
import { chevronMotion, conversationType, quietTrigger } from "./chat-parts";

/**
 * 01 · Activity rows and the step chain.
 * Approved 2026-09-20 as option A plus the Iter 3.5 changes: the status mark and the chevron
 * sit beside the label; the count summary appears only at three or more steps; a completed step
 * is a check and an in-progress step is the RippleLoader.
 * Translated from the approved specimen `studio/iter2/Elements.tsx` -> `Activity` (variant "a")
 * and `studio/iter2/iter2.css`, against computed values measured on the live render
 * (1512x806, dark, 2026-09-20).
 */
export const activity = defineSlotRecipe({
  className: "activity",
  slots: [
    "root",
    "agentName",
    "summary",
    "summaryChevron",
    "chain",
    "step",
    "stepBody",
    "stepTrigger",
    "stepAnchor",
    "stepLabel",
    "stepStatus",
    "stepChevron",
    "detailText",
    "detailCode",
    "detailEmbed",
  ],
  base: {
    root: { ...conversationType, minWidth: 0 },
    // `.i2-progress-name` — the agent's name above its own chain in a multi-agent turn.
    agentName: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sys-space-3)",
      fontSize: "13px",
      color: "var(--il-ink)",
      marginBottom: "var(--sys-space-2)",
    },
    summary: { ...quietTrigger },
    summaryChevron: { flexShrink: 0, ...chevronMotion },
    chain: { minWidth: 0 },
    step: {
      display: "flex",
      position: "relative",
      gap: "var(--sys-space-3)",
      paddingBottom: "var(--sys-space-5)",
      "&:last-child": { paddingBottom: 0 },
      // The history rail. 2px at the icon's optical centre; it stops at the last row.
      "&:not(:last-child)::before": {
        content: '""',
        position: "absolute",
        width: "2px",
        left: "7px",
        top: "24px",
        bottom: 0,
        background: "color-mix(in srgb, var(--il-muted) 55%, transparent)",
      },
    },
    stepBody: { flex: 1, minWidth: 0 },
    stepTrigger: {
      ...quietTrigger,
      width: "fit-content",
      maxWidth: "100%",
      flexWrap: "nowrap",
      // Completed rows step back; the live row carries full ink at full size.
      "[data-activity-step][data-active=false] &": {
        color: "var(--il-muted)",
        fontSize: ".86em",
      },
      "[data-activity-step][data-active=true] &": { color: "var(--il-ink)" },
    },
    // A leading dot anchor stands in for the count summary on a single row.
    stepAnchor: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      flexShrink: 0,
      marginRight: "-3px",
    },
    stepLabel: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--sys-space-2)",
      minWidth: 0,
      "& > svg": { flexShrink: 0 },
      // Lucide Bot's face sits below its viewBox centre; lift it optically beside the text.
      "& > .lucide-bot": { transform: "translateY(-1.5px)" },
    },
    stepStatus: {
      display: "inline-flex",
      alignItems: "center",
      flexShrink: 0,
      minWidth: "12px",
    },
    stepChevron: {
      flexShrink: 0,
      transition: "transform 180ms ease",
      "&[data-open=true]": { transform: "rotate(90deg)" },
    },
    detailText: {
      margin: 0,
      marginTop: "var(--sys-space-3)",
      marginLeft: "var(--sys-space-7)",
      color: "var(--il-muted)",
    },
    // A code or markdown plane is plain and sits one tier above whatever holds it.
    detailCode: {
      marginTop: "var(--sys-space-3)",
      marginLeft: "var(--sys-space-7)",
      minWidth: 0,
      borderRadius: "var(--sys-space-2)",
      padding: "var(--sys-space-4) var(--sys-space-5)",
      "& code": {
        fontFamily: "var(--font-nova-mono, 'IBM Plex Mono'), monospace",
        fontSize: "12px",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      },
      "& pre": { margin: 0 },
    },
    detailEmbed: {
      marginTop: "var(--sys-space-5)",
      marginLeft: "var(--sys-space-7)",
      minWidth: 0,
    },
  },
  variants: {
    speaker: {
      neutral: {},
      sage: { agentName: { color: "var(--nc-sage)" } },
      ready: { agentName: { color: "var(--nc-ready)" } },
    },
    // The chain indents under the count summary; a single row with no summary sits flush.
    summary: {
      true: { chain: { marginLeft: "27px", paddingTop: "var(--sys-space-3)" } },
      false: { chain: { marginLeft: 0, paddingTop: 0 } },
    },
    // With the dot anchor in front of the label, the rail and every detail shift by it.
    anchored: {
      true: {
        step: { "&:not(:last-child)::before": { left: "32px" } },
        detailText: { marginLeft: "48px" },
        detailCode: { marginLeft: "48px" },
        detailEmbed: { marginLeft: "48px" },
      },
      false: {},
    },
  },
  defaultVariants: { summary: false, anchored: false },
});
