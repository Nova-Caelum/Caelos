import { defineSlotRecipe } from "@pandacss/dev";

const reveal = { gridTemplateRows: "1fr", opacity: 1 };
/** Approved notification study: geometry and motion reuse the system scale; class colours reuse Alert. */
export const notification = defineSlotRecipe({
  className: "notification",
  slots: ["root", "source", "controls", "detail", "actions", "reveal", "editor", "choices", "bell", "count", "inbox", "item", "rail"],
  base: {
    root: {
      outline: "none", overflowWrap: "anywhere",
      // Floating alerts need a readable backing over arbitrary page content.
      "&[data-notification-kind=question]": { background: "linear-gradient(125deg, var(--sys-accent-tint), transparent 72%), var(--nc-elevated) !important" },
      "@media (prefers-reduced-motion: reduce)": { "& *": { transition: "none !important" } },
      "&:focus-visible": { outline: "2px solid var(--sys-accent)", outlineOffset: "2px" },
      "& > header": { flexWrap: "nowrap", alignItems: "flex-start" },
      "& > header > h4": { flex: "1 1 0", fontSize: "15px" },
      "& [data-notification-detail]": { gridTemplateRows: "0fr", opacity: 0 },
      "&[data-expanded=true] [data-notification-detail]": reveal,
      "&:hover [data-notification-actions], &:focus-within [data-notification-actions], &[data-expanded=true] [data-notification-actions]": reveal,
      "&:hover [data-notification-actions] > div, &:focus-within [data-notification-actions] > div, &[data-expanded=true] [data-notification-actions] > div": { paddingTop: "var(--sys-space-5)" },
      "@media (hover: none)": { "& [data-notification-actions]": reveal, "& [data-notification-actions] > div": { paddingTop: "var(--sys-space-5)" } },
    },
    source: { display: "block", fontSize: "11px", fontWeight: 500, lineHeight: 1.5, marginBottom: "var(--sys-space-2)", color: "var(--il-muted)" },
    controls: { display: "flex", gap: 0, "& button": { width: "24px !important", minWidth: "24px", height: "24px" }, "& svg": { transition: "transform var(--sys-motion-base) var(--sys-ease-out)" }, "& [aria-expanded=true] svg": { transform: "rotate(180deg)" } },
    detail: { display: "grid", transition: "grid-template-rows var(--sys-motion-base) var(--sys-ease-out), opacity var(--sys-motion-base)", "& > div": { overflow: "hidden", minHeight: 0 }, "& p": { fontSize: "13px", marginBlock: "var(--sys-space-4)", color: "var(--il-muted)" }, "& code": { display: "block", fontSize: "11px", background: "var(--nc-chrome)", borderRadius: "var(--sys-radius-sm)", padding: "var(--sys-space-2) var(--sys-space-3)", whiteSpace: "pre-wrap" } },
    actions: { display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", gap: "var(--sys-space-3)", "& > :first-child": { marginRight: "auto" } },
    reveal: { display: "grid", gridTemplateRows: "0fr", opacity: 0, transition: "grid-template-rows var(--sys-motion-base) var(--sys-ease-out), opacity var(--sys-motion-fast)", "& > div": { overflow: "hidden", minHeight: 0, transition: "padding-top var(--sys-motion-base) var(--sys-ease-out)" } },
    editor: { marginTop: "var(--sys-space-5)", "& > div:last-child": { paddingTop: "var(--sys-space-5)" } },
    choices: { display: "grid", gap: "var(--sys-space-2)", "& button": { textAlign: "left", justifyContent: "space-between" }, "& [aria-pressed=true]": { boxShadow: "inset 0 0 0 1px var(--sys-accent)" } },
    bell: { position: "relative", display: "inline-flex", flexShrink: 0 },
    count: { position: "absolute", top: "-3px", right: "-3px", minWidth: "15px", height: "15px", paddingInline: "3px", borderRadius: "var(--sys-radius-full)", background: "var(--sys-accent)", color: "var(--nc-ground)", fontSize: "10px", lineHeight: "15px", textAlign: "center", pointerEvents: "none" },
    inbox: { padding: "var(--sys-space-6)", border: "1px solid var(--il-edge)", borderRadius: "var(--sys-radius-xl)", background: "var(--nc-elevated)", boxShadow: "var(--sys-elev-2)", "& header": { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sys-space-4)" }, "& p": { color: "var(--il-muted)", fontSize: "12px" } },
    item: { display: "flex", width: "100%", alignItems: "center", gap: "var(--sys-space-4)", border: 0, borderTop: "1px solid var(--il-edge)", padding: "var(--sys-space-4) 0", background: "none", color: "var(--il-ink)", font: "inherit", textAlign: "left", cursor: "pointer", "& > svg": { color: "var(--notification-tone)", flexShrink: 0 }, "& > span": { flex: 1 }, "& small, & strong": { display: "block" }, "& small": { color: "var(--il-muted)", fontSize: "11px" }, "& strong": { fontWeight: 500 }, "&:hover strong": { color: "var(--sys-accent)" }, "&:focus-visible": { outline: "2px solid var(--sys-accent)", outlineOffset: "2px" } },
    rail: { position: "fixed", top: "calc(var(--sys-space-8) * 2)", right: "var(--sys-space-5)", width: "min(460px, calc(100vw - 32px))", maxHeight: "calc(100dvh - 80px)", overflowY: "auto", padding: "var(--sys-space-3)", zIndex: 70, animation: "nc-welcome-in var(--sys-motion-base) var(--sys-ease-out) both", "@media (prefers-reduced-motion: reduce)": { animation: "none" } },
  },
  variants: { kind: {
    error: { item: { "--notification-tone": "var(--sys-sem-danger)" } },
    permission: { item: { "--notification-tone": "var(--sys-sem-progress)" } },
    question: { item: { "--notification-tone": "var(--sys-accent)" } },
    ready: { item: { "--notification-tone": "var(--sys-sem-sage)" } },
    attention: { item: { "--notification-tone": "var(--sys-sem-progress)" } },
  } },
});
