import { defineSlotRecipe } from "@pandacss/dev";

/**
 * `conversationHeader` — the approved Atlas 2 conversation header card and its participant
 * field, packaged 2026-09-20. Daniel: "The header is flawless."
 *
 * Every declaration below is transcribed from `design-atlas-2/wraparound-study.css` as it
 * stands on 2026-09-20. Nothing is tuned, rounded or "improved"; where the study's value has
 * no token the value is carried verbatim and listed in the report's non-token table.
 *
 * Geometry contract (DOM-measured on the approved study): 420x112 at rest, 468x142 pinned,
 * participant field a fixed 88x76 at every participant count, in both shapes.
 *
 * Two things the study's stylesheet contains that this recipe deliberately does NOT carry,
 * because nothing renders them any more (they are dead rules in the approved source, not
 * behaviour): `.wrap-cluster` / `.wrap-member` with their `--cluster-edge-inset` custom
 * properties — the composite is positioned per-avatar from the component now, and the inset
 * lives in TypeScript as `shape === "rounded" ? 18 : 24` — and `.wrap-subtitle`, superseded
 * by the linked-work row. Both are recorded in the report rather than ported.
 */

/** `.wrap-title`, applied to both the visible frame and the hidden measuring copy. */
const titleType = {
  display: "block",
  textAlign: "left",
  margin: 0,
  fontFamily: "var(--font-nova-heading, 'Yrsa'), serif",
  fontSize: "21px",
  lineHeight: "24px",
  fontWeight: 500,
  letterSpacing: 0,
  wordSpacing: "normal",
  color: "var(--il-ink)",
  overflowWrap: "anywhere",
} as const;

export const conversationHeader = defineSlotRecipe({
  className: "conversation-header",
  slots: [
    "canvas",
    "card",
    "surface",
    "glass",
    "trigger",
    "copy",
    "titleMeasure",
    "ellipsisMeasure",
    "titleFrame",
    "titleText",
    "titleWord",
    "titleChar",
    "titleEllipsis",
    "subtitleRow",
    "chatId",
    "participantField",
    "agent",
    "avatarButton",
    "contextRing",
    "contextTrack",
    "contextDecoration",
    "expandedDecoration",
    "statusBadge",
    "agentName",
  ],
  base: {
    /**
     * `.wrap-canvas`. The split clock lives here as `--split` / `--reveal`, written by the
     * component from motion values, so one animation drives the surface, the roster and the
     * reserved space together.
     */
    canvas: {
      position: "relative",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      minWidth: 0,
      justifyItems: "center",
      alignItems: "start",
      boxSizing: "border-box",
      padding: "56px 0 32px",
      "--canvas-rest-height": "220px",
      minHeight:
        "calc(var(--canvas-rest-height) + max(0px, var(--roster-height) - var(--canvas-rest-height)) * var(--split))",
      "@media (max-width: 850px)": { "--canvas-rest-height": "180px" },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    /** `.conversation-card`. Width, height and the cap release are all interpolations. */
    card: {
      "--card-inline-padding": "28px",
      "--split-inset": "104px",
      position: "relative",
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 88px",
      alignItems: "center",
      gap: "16px",
      width:
        "calc(var(--card-rest-width) + (var(--card-open-width) - var(--card-rest-width)) * var(--reveal))",
      maxWidth: "100%",
      height:
        "calc(112px + var(--line-growth) * var(--reveal) + 30px * var(--split))",
      boxSizing: "border-box",
      padding: "18px var(--card-inline-padding)",
      border: "1px solid transparent",
      borderRadius: "var(--sys-radius-card, 18px)",
      "&:focus-visible": {
        outline: "2px solid var(--sys-color-focus-ring, currentColor)",
        outlineOffset: "4px",
      },
      // The capsule needs extra clearance inside its curved cap.
      "&[data-shape=capsule]": {
        borderRadius: "var(--sys-radius-full)",
        "--split-cap-clearance": "16px",
      },
      // One inline spacing step for the larger solo avatar, carried through the split.
      "&[data-shape=capsule][data-count='1']": {
        "--roster-clearance": "var(--sys-space-3)",
      },
      "@media (max-width: 380px)": {
        "--card-inline-padding": "22px",
        "--split-inset": "92px",
        gap: "12px",
      },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    /** `.conversation-surface` — the glass frame, which releases its right cap on split. */
    surface: {
      position: "absolute",
      inset: "-1px",
      borderRadius: "inherit",
      pointerEvents: "none",
      right:
        "calc(-1px + (var(--split-inset) - var(--split-cap-clearance, 0px)) * var(--split))",
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    /** `.conversation-glass` — a package `Card variant="glass"`; only its box is restated. */
    glass: { position: "absolute", inset: 0, borderRadius: "inherit" },
    /** `.conversation-trigger` — the whole card is one button. */
    trigger: {
      position: "absolute",
      inset: 0,
      border: 0,
      borderRadius: "inherit",
      background: "transparent",
      cursor: "pointer",
      zIndex: 2,
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "4px",
      },
    },
    /** `.wrap-copy` — title, linked work and chat id, anchored left of the 104px cap. */
    copy: {
      position: "absolute",
      minWidth: 0,
      left: "var(--card-inline-padding)",
      right: "calc(var(--card-inline-padding) + 104px)",
      top: "33px",
      zIndex: 3,
      pointerEvents: "none",
      "& button": { pointerEvents: "auto" },
    },
    /**
     * `.wrap-title.wrap-title-measure` — the hidden copy the component measures for the
     * truncation point. Identical glyph boxes to the visible copy, so revealing the suffix
     * never reflows what is already on screen.
     */
    titleMeasure: {
      ...titleType,
      position: "absolute",
      visibility: "hidden",
      pointerEvents: "none",
      width: "var(--title-open-width)",
      height: "auto",
      whiteSpace: "normal",
      overflowWrap: "anywhere",
    },
    ellipsisMeasure: { position: "absolute" },
    /** `.wrap-title.wrap-title-frame` — grows by one line only when the title needs two. */
    titleFrame: {
      ...titleType,
      position: "relative",
      overflow: "hidden",
      height: "calc(24px + var(--line-growth) * var(--reveal))",
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    /**
     * `.wrap-title-text`. New text fades together over 340ms on the composer deceleration
     * curve; existing text stays opaque. No blur, translation or character stagger.
     */
    titleText: {
      position: "absolute",
      inset: "0 auto auto 0",
      width: "var(--title-open-width)",
      overflow: "hidden",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      whiteSpace: "normal",
      color: "transparent",
      transition: "color 130ms ease-out",
      "[data-expanded=true] &": {
        color: "var(--il-ink)",
        transition: "color 340ms cubic-bezier(.16,1,.3,1)",
      },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    titleWord: { display: "inline-block", whiteSpace: "nowrap" },
    titleChar: { display: "inline-block", color: "var(--il-ink)" },
    titleEllipsis: {
      position: "absolute",
      top: 0,
      visibility: "visible",
      transition: "visibility 0s 130ms",
      "[data-expanded=true] &": { visibility: "hidden", transition: "none" },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    /** `.wrap-subtitle-row` — linked work, with room reserved for the link button on split. */
    subtitleRow: {
      display: "flex",
      alignItems: "center",
      width: "fit-content",
      maxWidth: "100%",
      boxSizing: "border-box",
      marginTop: "6px",
      minWidth: 0,
      position: "relative",
      paddingRight: "calc(36px * var(--split))",
    },
    /**
     * `.header-chat-id` — the study's `Text variant="mono" tone="dim"` at 10px. Declared
     * outright rather than composed, because `typography--role_mono` is a recipe VARIANT and
     * a slot recipe can never reach it. `.019em` / `.055em` are restated rather than
     * inherited: an em letter-spacing resolves against the element's OWN font size, so
     * inheriting the ancestor's computed 0.247px would be wrong at 10px (0.19px is right).
     */
    chatId: {
      opacity: "var(--split)",
      display: "block",
      marginTop: "7px",
      margin: "7px 0 0",
      fontFamily: "var(--font-nova-mono, 'IBM Plex Mono'), monospace",
      fontSize: "10px",
      fontWeight: 400,
      lineHeight: "16px",
      letterSpacing: ".019em",
      wordSpacing: ".055em",
      color: "var(--il-dim)",
      overflowWrap: "anywhere",
    },
    /** `.wrap-participant-field` — a fixed 88x76 box at every count, in both shapes. */
    participantField: {
      width: "88px",
      height: "76px",
      position: "absolute",
      right: "28px",
      top: "calc(18px + var(--line-growth) * .5 * var(--reveal) * (1 - var(--split)) + 4px * var(--split))",
      zIndex: 4,
      pointerEvents: "none",
      "@media (max-width: 380px)": { right: "22px" },
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    /**
     * `.detached-agent`. The same avatar instance travels from its composite position to its
     * roster position; there is no second element and no crossfade.
     */
    agent: {
      "--agent-scale":
        "calc(var(--start-scale) + (var(--end-scale) - var(--start-scale)) * var(--split))",
      position: "absolute",
      width: "40px",
      height: "40px",
      left: "-20px",
      top: "-20px",
      transformOrigin: "center",
      transform:
        "translate(calc(var(--start-x) + (64px + var(--roster-clearance, 0px) - var(--start-x)) * var(--split)), calc(var(--start-y) + (var(--end-y) - var(--start-y)) * var(--split))) scale(var(--agent-scale))",
    },
    /** `.agent-avatar-button` — enabled only once the roster is pinned. */
    avatarButton: {
      border: 0,
      padding: 0,
      background: "none",
      color: "inherit",
      position: "relative",
      display: "block",
      width: "40px",
      height: "40px",
      cursor: "pointer",
      pointerEvents: "auto",
      borderRadius: "50%",
      "&:disabled": { pointerEvents: "none", opacity: 1 },
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "8px",
      },
    },
    /** `.agent-context-ring` — the per-agent context meter drawn around the avatar. */
    contextRing: {
      position: "absolute",
      width: "50px",
      height: "50px",
      inset: "-5px",
      overflow: "visible",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "round",
    },
    contextTrack: { stroke: "var(--il-muted)", opacity: 0.15 },
    /** Context follows the hover/focus disclosure clock and stays through the split. */
    contextDecoration: { opacity: "var(--reveal)" },
    /**
     * Detail follows distance, not a second timer, so it retreats before the avatars meet
     * again — including when the user reverses mid-flight.
     */
    expandedDecoration: {
      opacity: "clamp(0, calc((var(--split) - .3) / .5), 1)",
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    /** `.detached-agent-name` — counter-scaled so the label never grows with the avatar. */
    agentName: {
      opacity: "clamp(0, calc((var(--split) - .65) / .3), 1)",
      position: "absolute",
      width: "98px",
      left: "-29px",
      top: "49px",
      transform: "scale(calc(1 / var(--agent-scale)))",
      transformOrigin: "top center",
      textAlign: "center",
      fontFamily: "var(--font-nova-sans, 'IBM Plex Sans'), sans-serif",
      fontSize: "11px",
      fontWeight: 500,
      lineHeight: "18px",
      // Restated, not inherited: an em value resolves against this element's own 11px.
      letterSpacing: ".019em",
      wordSpacing: ".055em",
      color: "var(--il-muted)",
      overflowWrap: "anywhere",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
    },
    /** `.agent-status-badge` — the roster's quiet mark, revealed late in the split. */
    statusBadge: {
      position: "absolute",
      right: "-7px",
      bottom: "-5px",
      minWidth: "15px",
      height: "15px",
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      background: "var(--nc-sage)",
      color: "var(--nc-ground)",
      boxShadow: "0 0 0 3px var(--nc-ground)",
      fontSize: "10px",
      fontWeight: 600,
      "&[data-attention=true]": { background: "var(--sys-sem-progress-hover)" },
    },
  },
  variants: {
    /**
     * The approved fork, still open: A capsule / circular avatars, B rounded card / square
     * avatars. Only the two endpoint widths differ between full and constrained; the shape
     * itself is a data attribute on the card so the two render from one rule set.
     */
    width: {
      full: { canvas: { "--card-rest-width": "420px", "--card-open-width": "468px" } },
      constrained: {
        canvas: { "--card-rest-width": "320px", "--card-open-width": "368px" },
      },
    },
  },
  defaultVariants: { width: "full" },
});
