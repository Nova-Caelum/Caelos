import { defineSlotRecipe } from "@pandacss/dev";

export const agentMessage = defineSlotRecipe({
  className: "agent-message",
  slots: ["root", "avatar", "byline", "name", "content"],
  base: {
    root: { display: "grid", gridTemplateColumns: "24px minmax(0, 1fr)", columnGap: "12px", rowGap: "6px", minWidth: "0" },
    avatar: { gridColumn: "1", gridRow: "1 / span 2", paddingTop: "1px" },
    byline: { gridColumn: "2", display: "flex", alignItems: "center", gap: "8px", minHeight: "20px", minWidth: "0" },
    name: { fontFamily: "var(--font-nova-sans, 'IBM Plex Sans'), sans-serif", fontSize: "12px", fontWeight: "600", lineHeight: "20px", color: "var(--nc-sage)", overflowWrap: "anywhere" },
    content: { gridColumn: "2", minWidth: "0", color: "var(--il-ink)" },
  },
});
