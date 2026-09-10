import { definePreset } from "@pandacss/dev";
import { approvedTokens } from "./tokens";
import {
  avatar,
  identity,
  disclosure,
  button,
  card,
  input,
  chip,
  row,
  menu,
  tooltip,
  scrollArea,
  overlay,
  lettering,
} from "./recipes";
import { composerCss, composerKeyframes } from "./composer-styles";
const dark = {
  ...approvedTokens,
  "--il-ink": "#f5ead5",
  "--il-muted": "#b7afc4",
  "--il-dim": "#958ba5",
  "--il-surface": "#1b182670",
  "--il-edge": "#c8b7e119",
  "--il-fill": "linear-gradient(135deg,#b3a1d10b,#a4bbae06),#211d2c65",
  "--il-focus":
    "linear-gradient(135deg,rgba(142,150,204,.22),rgba(122,158,147,.16))",
  "--il-placeholder": "#aaa0b9",
  "--il-ease": "cubic-bezier(.4,0,.2,1)",
  "--nc-text-hover": "#e4d1f2",
  "--nc-ready": "#b1b9e5",
  "--nc-progress": "#e8bd8b",
  "--nc-sage": "#afcbbd",
  "--nc-danger": "#df9fa6",
  "--nc-glass-bg":
    "linear-gradient(125deg,rgba(145,125,190,.14),rgba(145,125,190,.028) 72%),rgba(30,28,43,.24)",
  "--nc-glass-blur": "19px",
  "--nc-glass-edge": "#c8b7e119",
  "--nc-glass-shadow": "#00000030",
  "--nc-opaque": "#211e2e",
  "--nc-tip-ink": "var(--sys-text-primary)",
  "--nc-tip-fill": "color-mix(in srgb,var(--sys-sem-sage) 19%,var(--sys-top))",
  "--nc-tip-shadow-1": "color-mix(in srgb,var(--sys-chrome) 50%,transparent)",
  "--nc-tip-shadow-2": "color-mix(in srgb,var(--sys-chrome) 45%,transparent)",
  "--nc-scroll-rest":
    "color-mix(in srgb,var(--sys-sem-atmospheric) 15%,transparent)",
  "--nc-scroll-drag":
    "color-mix(in srgb,var(--sys-sem-atmospheric) 24%,transparent)",
} as const;
const light = {
  "--il-ink": "#33283e",
  "--il-muted": "#665771",
  "--il-dim": "#74647e",
  "--il-surface": "#f3eef6",
  "--il-edge": "#775e9222",
  "--il-fill": "linear-gradient(135deg,#baa3d313,#b0c7be0a),#ffffff99",
  "--il-focus": "linear-gradient(135deg,#8e96cc29,#7a9e931c)",
  "--il-placeholder": "#74647e",
  "--nc-text-hover": "#533c67",
  "--nc-ready": "#545c9c",
  "--nc-progress": "#895615",
  "--nc-sage": "#3b695b",
  "--nc-danger": "#9c414e",
  "--nc-glass-bg":
    "linear-gradient(125deg,rgba(145,125,190,.23),rgba(145,125,190,.046) 72%),rgba(249,246,251,.76)",
  "--nc-glass-blur": "2px",
  "--nc-glass-edge": "#775e921c",
  "--nc-glass-shadow": "#33283e22",
  "--nc-opaque": "#f3eef6",
  "--nc-tip-ink": "var(--sys-ground)",
  "--nc-tip-fill":
    "color-mix(in srgb,var(--sys-sem-sage) 12%,var(--sys-text-primary))",
  "--nc-tip-shadow-1": "color-mix(in srgb,var(--sys-chrome) 8%,transparent)",
  "--nc-tip-shadow-2": "color-mix(in srgb,var(--sys-chrome) 12%,transparent)",
  "--nc-scroll-rest":
    "color-mix(in srgb,var(--sys-sem-structural) 15%,transparent)",
  "--nc-scroll-drag":
    "color-mix(in srgb,var(--sys-sem-structural) 24%,transparent)",
} as const;
export const materialPresets = {
  dark: { transparency: 76, blur: 19, tint: 14 },
  light: { transparency: 24, blur: 2, tint: 23 },
} as const;
export default definePreset({
  name: "caelos",
  theme: {
    extend: {
      tokens: {
        fonts: {
          body: { value: "'IBM Plex Sans', sans-serif" },
          heading: { value: "'Yrsa', serif" },
          mono: { value: "'IBM Plex Mono', monospace" },
        },
        colors: {
          accent: { value: approvedTokens["--sys-accent"] },
          sage: { value: approvedTokens["--sys-sem-sage"] },
          cream: { value: approvedTokens["--sys-text-primary"] },
          atmospheric: { value: approvedTokens["--sys-sem-atmospheric"] },
        },
      },
      recipes: { avatar, button, card, chip, row, tooltip },
      slotRecipes: { overlay, disclosure, identity, field: input, menu, scroll: scrollArea },
      keyframes: {
        "nc-overlay-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "nc-overlay-out": { to: { opacity: 0 } },
        "nc-drawer-in": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "nc-drawer-out": { to: { transform: "translateX(100%)" } },
        "nc-menu-in": {
          from: {
            opacity: 0,
            transform: "translateY(var(--nc-emerge-y,-7px)) scale(.94)",
          },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "nc-menu-out": {
          from: { opacity: 1, transform: "translateY(0) scale(1)" },
          to: {
            opacity: 0,
            transform: "translateY(var(--nc-emerge-y,-7px)) scale(.94)",
          },
        },
        "nc-tooltip-in": {
          from: { opacity: 0, transform: "translateY(2px) scale(.985)" },
          to: { opacity: 1, transform: "none" },
        },
        "nc-tooltip-out": { to: { opacity: 0 } },
        ...composerKeyframes,
      },
    },
  },
  globalCss: {
    "[data-caelos-theme]": {
      ...dark,
      ...lettering,
      color: "var(--il-ink)",
      colorScheme: "dark",
      // Reset inherited host scrollbars at provider and portal boundaries.
      scrollbarColor: "var(--nc-scroll-rest) transparent",
      scrollbarWidth: "thin",
    },
    "[data-caelos-theme=light]": { ...light, colorScheme: "light" },
    "[data-caelos-glass=false]": {
      "--nc-glass-bg": "var(--nc-opaque)",
      "--nc-glass-blur": "0px",
    },
    "[data-caelos-theme] *,[data-caelos-theme] *::before,[data-caelos-theme] *::after":
      { boxSizing: "border-box" },
    "[data-caelos-theme] button": { fontFamily: "inherit" },
    "[data-caelos-theme] [data-heading]": {
      fontFamily: "'Yrsa',serif",
      fontWeight: 400,
      letterSpacing: 0,
      wordSpacing: "normal",
    },
    "[data-caelos-theme] [data-mono]": {
      fontFamily: "'IBM Plex Mono',monospace",
      fontSize: "10px",
      fontWeight: 400,
    },
    "[data-caelos-theme][data-side=top]": { "--nc-emerge-y": "7px" },
    ...composerCss,
    "[data-caelos-reduced=true], [data-caelos-reduced=true] *, [data-caelos-reduced=true] *::before":
      { animation: "none !important", transition: "none !important" },
    "@media (prefers-reduced-motion: reduce)": {
      "[data-caelos-theme], [data-caelos-theme] *, [data-caelos-theme] *::before":
        { animation: "none !important", transition: "none !important" },
    },
  },
});
