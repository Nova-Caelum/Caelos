import { chatNavigationControl } from "./chat-navigation-recipe";
import { definePreset } from "@pandacss/dev";
import { foundation, typography } from "./foundation-recipes";
import { surface } from "./surface-recipe";
import { agentMessage } from "./agent-message-recipe";
import { spacing } from "./spacing-recipe";
import { rippleLoader } from "./ripple-loader-recipe";
import { activity } from "./activity-recipe";
import { conversationMessage } from "./conversation-message-recipe";
import { userMessage } from "./user-message-recipe";
import { artifactPreview } from "./artifact-preview-recipe";
import { artifactWorkspace } from "./artifact-workspace-recipe";
import { alert } from "./alert-recipe";
import { errorMessage } from "./error-message-recipe";
import { fileCard } from "./file-card-recipe";
import { inlineSource } from "./inline-source-recipe";
import { recovery } from "./recovery-recipe";
import { controlSkin } from "./danger-control-recipe";
import { conversationHeader } from "./conversation-header-recipe";
import { headerControl } from "./header-control-recipe";
import { agentDetail } from "./agent-detail-recipe";
import { linkedWork } from "./linked-work-recipe";
import { workingFiles } from "./working-files-recipe";
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
  "--nc-ground": "var(--sys-ground)",
  "--nc-chrome": "var(--sys-chrome)",
  "--nc-elevated": "var(--sys-elevated)",
  "--nc-elevated-2": "var(--sys-elevated-2)",
  "--nc-top": "var(--sys-top)",
  "--nc-graph-line": "color-mix(in srgb,oklch(58% 0.031 283) 7%,transparent)",
  "--nc-graph-size": "28px",
  "--nc-surface-opacity": "64%",
  "--nc-surface-blur": "20px",
  "--il-ink": "#f5ead5",
  "--il-muted": "#b7afc4",
  "--il-dim": "#958ba5",
  "--il-surface": "#1b182670",
  "--il-edge": "#c8b7e119",
  "--il-fill": "linear-gradient(135deg,#b3a1d10b,#a4bbae06),#211d2c65",
  "--il-focus":
    "linear-gradient(135deg,rgba(142,150,204,.22),rgba(122,158,147,.16))",
  // The feather's default diffusion — the indigo/sage wash that reads as a soft glow behind
  // a control. Declared here rather than inline in `recipes.ts` so it is tunable and legible
  // in the token browser beside `--il-fill` and `--il-focus`, which it sits next to visually.
  // On `dark` only, which every theme inherits as its base, so light and dark share one value
  // exactly as they did while it was a literal. A call site wanting a different wash still
  // overrides `background` outright — `button.text` and the selected `row` both do.
  "--nc-feather-fill": "linear-gradient(105deg,#8e9de027,#9190c817)",
  "--nc-feather-blur": ".75px",
  // The Composer's focus state — a lavender glow and edge, deliberately quieter than the semantic
  // `-glow` tones. On `dark` only, so every theme shares the value each had as a literal.
  "--nc-focus-glow": "#a896f024",
  "--nc-focus-edge": "#a896f028",
  "--il-placeholder": "#aaa0b9",
  "--il-ease": "cubic-bezier(.4,0,.2,1)",
  "--nc-text-hover": "#e4d1f2",
  "--nc-ready": "#b1b9e5",
  "--nc-progress": "#e8bd8b",
  "--nc-sage": "#afcbbd",
  "--nc-danger": "#df9fa6",
  // Avatar identity colours — one per user or agent: Claude Code's eight subagent colours
  // (code.claude.com/docs/en/sub-agents, `color`) plus amber, gold and silver, which the fleet's own
  // agents use. Identity only, never status. One family: OKLCH lightness 80%, chroma .072 on dark —
  // matching --nc-sage / --nc-ready / --nc-progress — at hues red 18 · orange 55 · amber 70 · gold 84 ·
  // yellow 95 · green 160 · cyan 205 · blue 250 · purple 305 · pink 350; silver is near-neutral (.015, 260).
  "--avatar-red": "#e9acac",
  "--avatar-orange": "#e3b292",
  "--avatar-yellow": "#ccbe89",
  "--avatar-green": "#95cdae",
  "--avatar-cyan": "#85ccd4",
  "--avatar-blue": "#9bc2eb",
  "--avatar-purple": "#c8b3e4",
  "--avatar-pink": "#e2abc4",
  "--avatar-amber": "#dcb68b",
  "--avatar-gold": "#d4ba88",
  "--avatar-silver": "#b8bec8",
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
  "--nc-ground": "#eee8f2",
  "--nc-chrome": "#e6dfea",
  "--nc-elevated": "#f3eef6",
  "--nc-elevated-2": "#f8f4fa",
  "--nc-top": "#fffcff",
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
  // Avatar identity colours, light theme: the same hues at OKLCH lightness 50%, chroma .10 (cyan .085, to stay
  // in sRGB; silver .02).
  "--avatar-red": "#94494d",
  "--avatar-orange": "#8e5224",
  "--avatar-yellow": "#756208",
  "--avatar-green": "#1f744f",
  "--avatar-cyan": "#02717a",
  "--avatar-blue": "#32669a",
  "--avatar-purple": "#715391",
  "--avatar-pink": "#8d4a6b",
  "--avatar-amber": "#875814",
  "--avatar-gold": "#7e5d07",
  "--avatar-silver": "#5d646f",
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
  // 0 with nothing under the conversation header, 1 with content behind it (see the
  // conversationHeader `material` variant). Registered so the header can transition it.
  globalVars: {
    "--nc-occluded": { syntax: "<number>", inherits: true, initialValue: "1" },
  },
  theme: {
    extend: {
      // Panda `theme.tokens` (fonts.body/heading/mono, colors.accent/sage/cream/atmospheric) removed
      // 2026-09-21: each duplicated a --sys-* or --font-nova-* property, and nothing referenced the
      // generated --caelos-colors-* / --caelos-fonts-* variables, by name or by token path. Recipes
      // use the --sys-* tokens and the --font-nova-* hooks directly. Audit:
      // AgentSecretBase/workspace/component-foundry/04_build/RedundancyAudit_DaVinci_2026-09-21.md
      recipes: { chatNavigationControl, spacing, rippleLoader, surface, foundation, typography, avatar, button, card, chip, row, tooltip, inlineSource, controlSkin, headerControl },
      slotRecipes: {
        agentMessage, overlay, disclosure, identity, field: input, menu, scroll: scrollArea,
        // Approved Atlas 3 chat surfaces, packaged 2026-09-20.
        activity, conversationMessage, userMessage, artifactPreview, artifactWorkspace, alert, fileCard, errorMessage, recovery,
        // Approved Atlas 2 conversation header family, packaged 2026-09-20.
        conversationHeader, agentDetail, linkedWork, workingFiles,
      },
      keyframes: {
        "nc-tab-in": { from: { opacity: 0 }, to: { opacity: 1 } },
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
        // Conversation text arrives rather than appearing (approved Atlas 3 message study).
        "nc-arrival": { from: { opacity: 0.12 }, to: { opacity: 1 } },
        // The linked-work preview attaches to the header card and fades in on the composer curve.
        "nc-linked-work-enter": { from: { opacity: 0 }, to: { opacity: 1 } },
        "nc-linked-work-exit": { to: { opacity: 0 } },
        "nc-ripple": {
          "0%": { opacity: "var(--ripple-rest)" },
          "30%": { opacity: "var(--ripple-peak)" },
          "60%": { opacity: "var(--ripple-rest)" },
          "100%": { opacity: "var(--ripple-rest)" },
        },
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
      "--nc-surface-opacity": "100%",
      "--nc-surface-blur": "0px",
    },
    "[data-caelos-theme] *,[data-caelos-theme] *::before,[data-caelos-theme] *::after":
      { boxSizing: "border-box" },
    "[data-caelos-theme] button": { fontFamily: "inherit" },
    "[data-caelos-theme] [data-heading]": {
      fontFamily: "var(--font-nova-heading, 'Yrsa'),serif",
      fontWeight: 400,
      letterSpacing: 0,
      wordSpacing: "normal",
    },
    "[data-caelos-theme] [data-mono]": {
      fontFamily: "var(--font-nova-mono, 'IBM Plex Mono'),monospace",
      fontSize: "10px",
      fontWeight: 400,
    },
    "[data-caelos-theme][data-side=top]": { "--nc-emerge-y": "7px" },
    "[data-nc-tab-indicator]": {
      position: "absolute", top: 0, left: 0, zIndex: -1, pointerEvents: "none",
      borderRadius: "999px",
      background: "linear-gradient(135deg,#b8a4da23,#9fbcb610),#8f7fa50c",
      boxShadow: "0 0 9px #b09ad00c",
      transition: "transform 320ms var(--il-ease), width 320ms var(--il-ease), height 320ms var(--il-ease)",
    },
    "[data-nc-tabs][data-indicator=ready] [role=tab][data-state=active]::before": { opacity: 0 },
    "[data-nc-tab-panel][data-state=active]": { animation: "nc-tab-in 180ms var(--il-ease)" },
    ...composerCss,
    "[data-caelos-reduced=true], [data-caelos-reduced=true] *, [data-caelos-reduced=true] *::before":
      { animation: "none !important", transition: "none !important" },
    "@media (prefers-reduced-motion: reduce)": {
      "[data-caelos-theme], [data-caelos-theme] *, [data-caelos-theme] *::before":
        { animation: "none !important", transition: "none !important" },
    },
  },
});
