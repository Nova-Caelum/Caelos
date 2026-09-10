import { defineRecipe } from "@pandacss/dev";
import { lettering } from "./recipes";
export const typography = defineRecipe({
  className: "typography",
  base: { ...lettering, margin: 0, color: "var(--il-ink)", overflowWrap: "anywhere" },
  variants: {
    role: {
      body: {}, small: { fontSize: "12px", lineHeight: "18px" },
      label: { fontSize: "12px", lineHeight: "18px", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--il-muted)" },
      mono: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", lineHeight: "16px", fontWeight: 400 },
      display: { fontFamily: "'Yrsa', serif", fontSize: "34px", lineHeight: 1.12, fontWeight: 400, letterSpacing: 0, wordSpacing: "normal" },
      page: { fontSize: "30px", lineHeight: 1.12, fontWeight: 600, letterSpacing: "-.028em" },
      section: { fontFamily: "'Yrsa', serif", fontSize: "27px", lineHeight: 1.15, fontWeight: 400, letterSpacing: 0, wordSpacing: "normal" },
      title: { fontSize: "17px", lineHeight: 1.4, fontWeight: 600 },
    },
    tone: { default: {}, muted: { color: "var(--il-muted)" }, dim: { color: "var(--il-dim)" }, accent: { color: "var(--sys-accent)" } },
  }, defaultVariants: { role: "body", tone: "default" },
});
export const foundation = defineRecipe({
  className: "foundation",
  base: { boxSizing: "border-box" },
  variants: { kind: {
    popover: { padding: "16px", zIndex: 70, width: "320px", maxWidth: "calc(100vw - 24px)", maxHeight: "var(--radix-popover-content-available-height)", overflowY: "auto", transformOrigin: "var(--radix-popover-content-transform-origin)", "&[data-state=open]": { animation: "nc-menu-in 180ms var(--il-ease)" }, "&[data-state=closed]": { animation: "nc-menu-out 140ms var(--il-ease)" } },
    range: { width: "100%", minWidth: 0, margin: 0, accentColor: "var(--sys-accent)", cursor: "ew-resize", "&:focus-visible": { outline: "2px solid var(--nc-ready)", outlineOffset: "3px" }, "&:disabled": { opacity: .5, cursor: "not-allowed" } },
    checkbox: { width: "16px", height: "16px", flexShrink: 0, margin: 0, accentColor: "var(--sys-accent)", cursor: "pointer", "&:focus-visible": { outline: "2px solid var(--nc-ready)", outlineOffset: "3px" }, "&:disabled": { opacity: .5, cursor: "not-allowed" } },
    separator: { flexShrink: 0, border: 0, height: "1px", width: "100%", background: "linear-gradient(90deg,transparent,var(--il-edge) 14%,var(--il-edge) 86%,transparent)", boxShadow: "0 1px 0 var(--il-edge)", "&[aria-orientation=vertical]": { width: "1px", height: "auto", alignSelf: "stretch" } },
    progress: { appearance: "none", display: "block", width: "100%", height: "4px", border: 0, borderRadius: "999px", overflow: "hidden", background: "var(--il-edge)", color: "var(--sys-accent)", "&::-webkit-progress-bar": { background: "var(--il-edge)", borderRadius: "999px" }, "&::-webkit-progress-value": { background: "var(--sys-accent)", borderRadius: "999px" }, "&::-moz-progress-bar": { background: "var(--sys-accent)", borderRadius: "999px" } },
    resize: { touchAction: "none", userSelect: "none", cursor: "col-resize", background: "transparent", "&:hover, &:focus-visible, &[data-dragging=true]": { background: "var(--nc-ready)", outline: "none" }, "@media (forced-colors: active)": { "&:focus-visible": { outline: "2px solid Highlight" } } },
    dot: { display: "inline-block", width: "6px", height: "6px", flexShrink: 0, borderRadius: "50%", background: "currentColor", verticalAlign: "middle" },
    surface: { minWidth: 0, color: "var(--il-ink)" },
  },
  layer: { ground: { backgroundColor: "var(--nc-ground)" }, chrome: { backgroundColor: "var(--nc-chrome)" }, elevated: { backgroundColor: "var(--nc-elevated)" } },
  texture: { plain: {}, graph: { backgroundImage: "linear-gradient(var(--il-edge) 1px,transparent 1px),linear-gradient(90deg,var(--il-edge) 1px,transparent 1px)", backgroundSize: "24px 24px" }, glass: { background: "var(--nc-glass-bg)", backdropFilter: "blur(var(--nc-glass-blur))" } },
  tone: { neutral: { color: "var(--il-muted)" }, ready: { color: "var(--nc-ready)" }, progress: { color: "var(--nc-progress)" }, done: { color: "var(--nc-sage)" }, sage: { color: "var(--nc-sage)" }, danger: { color: "var(--nc-danger)" }, atmospheric: { color: "var(--il-dim)" }, structural: { color: "var(--il-muted)" } },
  },
});
