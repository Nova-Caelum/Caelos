import { defineRecipe } from "@pandacss/dev";

// Task graph character seed: graphIntensity .07, glassIntensity .52.
// Keep material independent of elevation so dense editors can request plain.
const graph = {
  backgroundImage: "linear-gradient(var(--nc-graph-line) 1px,transparent 1px),linear-gradient(90deg,var(--nc-graph-line) 1px,transparent 1px)",
  backgroundSize: "var(--nc-graph-size) var(--nc-graph-size)",
  backdropFilter: "none",
};
const glass = {
  backgroundColor: "color-mix(in srgb,var(--nc-surface-color) var(--nc-surface-opacity),transparent)",
  backgroundImage: "none",
  backdropFilter: "blur(var(--nc-surface-blur)) saturate(140%)",
};
export const surface = defineRecipe({
  className: "surface",
  base: {
    boxSizing: "border-box",
    minWidth: 0,
    color: "var(--il-ink)",
    backgroundColor: "var(--nc-surface-color)",
  },
  variants: {
    layer: {
      chrome: { "--nc-surface-color": "var(--nc-chrome)", boxShadow: "var(--sys-elev-0)" },
      ground: { "--nc-surface-color": "var(--nc-ground)", boxShadow: "var(--sys-elev-0)" },
      elevated: { "--nc-surface-color": "var(--nc-elevated)", boxShadow: "var(--sys-elev-1)" },
      "elevated-2": { "--nc-surface-color": "var(--nc-elevated-2)", boxShadow: "var(--sys-elev-2)" },
      top: { "--nc-surface-color": "var(--nc-top)", boxShadow: "var(--sys-elev-3)" },
    },
    texture: {
      auto: {},
      plain: { backgroundImage: "none", backdropFilter: "none" },
      graph,
      glass,
    },
  },
  compoundVariants: [
    { layer: ["chrome", "ground"], texture: "auto", css: graph },
    { layer: ["elevated", "elevated-2", "top"], texture: "auto", css: glass },
  ],
  defaultVariants: { layer: "ground", texture: "auto" },
});
