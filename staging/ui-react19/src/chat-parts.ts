// Shared style fragments for the approved Atlas 3 chat surfaces.
// One owner per fragment: the glass artifact card, the quiet disclosure trigger and the
// conversation type base are each declared once here and spread into the recipes that need them.
// Every value is either a token or a value measured on the approved Atlas 3 specimen
// (http://127.0.0.1:5187/?tab=studio&iteration=iter3, 1512x806, dark, 2026-09-20).

/**
 * Atlas 3 renders every chat specimen inside `.iter2`, which sets 14px / 1.55 over the
 * package's 13px `lettering`. The measured inherited value on every specimen root is
 * 14px / 21.7px. Components that inherited it there declare it here so they render
 * identically outside the atlas. Non-token: there is no 14px type token.
 */
export const conversationType = { fontSize: "14px", lineHeight: 1.55 } as const;

/**
 * 21px and 27px are approved spacing values that have no token of their own; the shared
 * spacing recipe derives them as midpoints of the scale. Derived the same way here so the
 * chat surfaces and the spacing components move together if the scale ever changes.
 */
export const space21 = "calc((var(--sys-space-6) + var(--sys-space-7)) / 2)";
export const space27 = "calc((var(--sys-space-7) + var(--sys-space-8)) / 2)";

/** `.i2-meta` — the quiet 12px line used for coordinates, kinds and status notes. */
export const metaType = {
  fontSize: "12px",
  lineHeight: 1.5,
  color: "var(--il-muted)",
} as const;

/** `.i2-prose` — reading type for message bodies and document excerpts. */
export const proseType = { fontSize: "15px", lineHeight: 1.75 } as const;

/**
 * `.i2-activity-trigger` / `.i2-step-trigger` — the quiet disclosure control.
 * Measured: flex, 9px gap, 3px block padding, muted ink, inherits the 14px/21.7px base
 * (the atlas's `button { font: inherit }` wins over the rule's own line-height).
 */
export const quietTrigger = {
  display: "flex",
  alignItems: "center",
  gap: "var(--sys-space-3)",
  textAlign: "left",
  border: 0,
  padding: "var(--sys-space-1) 0",
  color: "var(--il-muted)",
  background: "transparent",
  font: "inherit",
  cursor: "pointer",
  "&:hover": { color: "var(--il-ink)" },
  "& > svg": { flexShrink: 0 },
  "&:focus-visible": {
    outline: "2px solid var(--nc-focus-ring, var(--nc-ready))",
    outlineOffset: "3px",
  },
} as const;

/** `.i2-chevron` — 180ms rotation on the open state. Non-token duration. */
export const chevronMotion = {
  transition: "transform 180ms ease",
  "&[data-open=true]": { transform: "rotate(180deg)" },
} as const;

/**
 * `.i2-glass-card` — the one artifact material. A glass card whose darker chrome strip
 * melts into the body. Shared by the inline preview (04) and the expanded workspace (05),
 * both approved as option B "Strip and paper" on 2026-09-20.
 */
export const artifactCard = {
  boxSizing: "border-box",
  minWidth: 0,
  borderRadius: "12px",
  overflow: "hidden",
  background: "var(--nc-glass-bg)",
  border: "1px solid var(--nc-glass-edge)",
  backdropFilter: "blur(var(--nc-glass-blur))",
  boxShadow: "var(--sys-elev-2)",
} as const;

/**
 * `.i2-glass-strip` under `[data-inner=paper]` — no gradient wash; the paper plane below
 * carries the material step instead. Measured padding 12px 12px 12px 15px.
 */
export const artifactStrip = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--sys-space-3)",
  minWidth: 0,
  paddingTop: "var(--sys-space-4)",
  paddingRight: "var(--sys-space-4)",
  paddingBottom: "var(--sys-space-4)",
  paddingLeft: "var(--sys-space-5)",
  background: "none",
  "& code": {
    fontFamily: "var(--font-nova-mono, 'IBM Plex Mono'), monospace",
    fontSize: ".96em",
  },
} as const;

/**
 * The glass-to-paper join. The paper fades in over 30px (`--sys-space-8`) instead of
 * starting at an edge, so the material step leaves no line. Same mechanism and distance
 * as the approved Atlas 2 agent card's session plane.
 */
export const artifactPaperBody = {
  background:
    "linear-gradient(180deg, transparent 0, var(--nc-elevated-2) var(--sys-space-8))",
} as const;
