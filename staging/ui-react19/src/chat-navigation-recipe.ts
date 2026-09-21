import { defineRecipe } from "@pandacss/dev";

/** Preserve the shared tonal button and focus treatment; only the icon gains accent on hover. */
export const chatNavigationControl = defineRecipe({
  className: "chat-navigation-control",
  base: {
    flexShrink: 0,
    "&&": {
      borderRadius: "50%",
      height: "34px",
      minHeight: "34px",
      aspectRatio: "1",
    },
    "& svg": {
      width: "var(--sys-space-5)",
      height: "var(--sys-space-5)",
      transition: "color 240ms var(--il-ease)",
    },
    "&:hover:not(:disabled) svg": { color: "var(--sys-accent-hover)" },
    "@media (prefers-reduced-motion: reduce)": { "& svg": { transition: "none" } },
  },
});
