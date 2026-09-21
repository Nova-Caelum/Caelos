import { defineRecipe } from "@pandacss/dev";

/**
 * `headerControl` — the cascade-layer escape hatch for the approved Atlas 2 conversation
 * header family, packaged 2026-09-20.
 *
 * WHY THIS FILE EXISTS. Panda emits recipe **variants** directly into `@layer recipes`,
 * recipe **bases** into `@layer recipes._base`, and every **slot recipe** into
 * `@layer recipes.slots`. Per CSS cascade-layer rules, styles sitting directly in a layer
 * beat that layer's nested sub-layers whatever their specificity, so the order is
 *
 *     recipes._base  <  recipes.slots  <  recipes
 *
 * A slot recipe therefore can NEVER beat another recipe's variant. The approved header
 * render depends on exactly that happening in several places, because in Atlas 2 the
 * study's own stylesheet is UNLAYERED and beats the whole package:
 *
 *   - `.agent-detail-popover` overrides `foundation({kind:"popover"})`'s
 *     padding / width / z-index / max-height;
 *   - `.header-link:hover` overrides `button({variant:"tonal"})`'s hover colours;
 *   - `.linked-work-trigger` overrides `button({variant:"text", size:"sm"})`'s type and box;
 *   - `.linked-work-popover` and `.header-link-popover` override the popover foundation
 *     again (the study reaches for `!important` for these).
 *
 * HOW. Every kind below is a recipe *variant* (so it lands in `@layer recipes`, level with
 * the recipe it must beat) and every declaration is nested under `&[data-nc-header-control]`,
 * which the component always sets. That makes the emitted selector
 * `.caelos-header-control--kind_x[data-nc-header-control]` — specificity (0,2,0) against
 * `foundation`'s (0,1,0) and, with `:hover`, (0,3,0) against the button recipe's
 * `:is(:hover,[data-force-state=hover])` (0,2,0). Deterministic, no `!important`, and
 * still overridable by an app that wants to.
 *
 * Everything that does NOT have to beat a sibling recipe stays in the ordinary slot
 * recipes (`conversationHeader`, `agentDetail`, `linkedWork`, `workingFiles`).
 *
 * Every value is the approved Atlas 2 value, read from `wraparound-study.css`,
 * `agent-card-v2.css` and `linked-work-preview.css` as they stand on 2026-09-20.
 */
export const headerControl = defineRecipe({
  className: "header-control",
  base: {},
  variants: {
    kind: {
      /** `.header-link` — the 28px link IconButton in the subtitle row. */
      link: {
        "&[data-nc-header-control]": {
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          opacity: "var(--split)",
          flexShrink: 0,
          "&:disabled": { pointerEvents: "none" },
          "&:hover, &:focus-visible": {
            color: "var(--sys-accent-hover)",
            background: "var(--sys-accent-tint)",
          },
        },
      },

      /**
       * `.agent-detail-popover` — the agent card's host. 376px, its own scroll, and at
       * `[data-layout=profile]` it gives up its padding entirely because the card owns it.
       */
      detailPopover: {
        "&[data-nc-header-control]": {
          width: "376px",
          boxSizing: "border-box",
          maxWidth: "calc(100vw - 24px)",
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 100,
          maxHeight:
            "min(690px, calc(100vh - 24px), var(--radix-popper-available-height, 690px))",
          overflowY: "auto",
          "& p": { margin: 0 },
          "& > *": { flexShrink: 0 },
          "& progress": { width: "100%", height: "8px", minHeight: "8px" },
          "&[data-layout=profile]": { padding: 0, gap: 0 },
          "&[data-layout=profile] progress": { height: "4px", minHeight: "4px" },
          "@media (max-width: 380px)": { padding: "16px" },
        },
      },

      /** `.header-link-popover` — the link-project popover. */
      linkPopover: {
        "&[data-nc-header-control]": {
          width: "310px",
          padding: 0,
          zIndex: 100,
          "& [data-relation=cluster] > :first-child": { flex: 1, minWidth: 0 },
        },
      },

      /**
       * `.linked-work-popover` — sits BELOW the shared modal backdrop/content (50/51) and
       * above the ground, so menus keep the shared 100 layer. Attaches to the header card
       * itself through a virtual anchor, hence `sideOffset={0}`.
       */
      linkedWorkPopover: {
        "&[data-nc-header-control]": {
          zIndex: 40,
          padding: 0,
          overflow: "auto",
          maxHeight:
            "min(720px, calc(100dvh - 32px), var(--radix-popover-content-available-height, 720px))",
          minHeight: "min(220px, var(--radix-popover-content-available-height, 220px))",
          resize: "vertical",
          transformOrigin: "var(--radix-popover-content-transform-origin)",
          "&[data-state=open]": {
            animation: "nc-linked-work-enter 260ms cubic-bezier(.16,1,.3,1)",
          },
          "&[data-state=closed]": {
            animation: "nc-linked-work-exit 130ms ease-out",
          },
          "@media (prefers-reduced-motion: reduce)": { animation: "none !important" },
          "[data-reduced-motion=true] &": { animation: "none !important" },
        },
      },

      /** `.linked-work-trigger` — the quiet project / module word in the subtitle row. */
      linkedWorkTrigger: {
        "&[data-nc-header-control]": {
          padding: "2px 0",
          minHeight: "24px",
          height: "auto",
          fontSize: "12px",
          color: "var(--il-muted)",
          minWidth: 0,
          borderRadius: "var(--sys-radius-sm)",
          justifyContent: "flex-start",
          "&:hover, &:focus-visible, &[data-state=open]": {
            color: "var(--sys-accent-hover)",
          },
        },
      },

      /**
       * `.profile-small-popover` — the status / permissions / subagents detail popovers
       * hanging off the agent card's right edge.
       */
      smallPopover: {
        "&[data-nc-header-control]": {
          maxWidth: "280px",
          padding: "var(--sys-space-4)",
          zIndex: 110,
          fontSize: "12px",
          "& p": { margin: 0, color: "var(--il-muted)" },
          "&[data-detail=status]": { outline: "none" },
          "&[data-detail=permissions], &[data-detail=settings]": { width: "260px" },
          "&[data-detail=subagents]": { width: "280px" },
        },
      },

      /** `.working-file-menu` — the working-file context menu, above the file drawer. */
      fileMenu: {
        "&[data-nc-header-control]": {
          zIndex: 180,
          "& [role=menuitem]": { gap: "9px" },
        },
      },

      /** `.agent-file-drawer` — the file viewer / diff / move panel. */
      fileDrawer: { "&[data-nc-header-control]": { zIndex: 150 } },

      /**
       * Applied to the agent card's root. Carries ONLY the handful of declarations that must
       * beat another recipe's variant from inside the card, keyed by data attributes so the
       * emitted selectors are (0,3,0) and win inside `@layer recipes`. Everything else in the
       * card lives in the ordinary `agentDetail` slot recipe.
       *
       * What this deliberately does NOT carry, and why — `agent-card-v2.css` also declares
       * `.agent-card-v2 button { font: inherit }` and `.agent-card-v2 button:focus-visible
       * { outline: 2px solid var(--sys-accent); outline-offset: 3px }`. Both reach the shared
       * package `Button` and replace its own type and focus ring. Reproducing them here would
       * be the package defeating its own tokens, so they are left out and the exact rendered
       * difference is recorded for Daniel instead.
       */
      agentCard: {
        "&[data-nc-header-control]": {
          /**
           * The package resets native button chrome only inside
           * `:where(.nc-composer-workspace, .nc-composer-recipient)`, so a `ComposerChoice`
           * used on its own — as the card's model and reasoning selectors are — would render
           * as an OS button. The approved card supplies the same reset the composer surface
           * supplies. A package-side gap, not a token disagreement.
           */
          "& .nc-composer-model": {
            appearance: "none",
            border: 0,
            cursor: "pointer",
            backgroundColor: "transparent",
          },
          /** `.profile-selectors` / `.profile-live-item` over `InlineCluster`'s wrap. */
          "& [data-nc-nowrap]": { flexWrap: "nowrap" },
          /** `.profile-existing-files` — the embedded list drops the `Section` header. */
          "& [data-nc-files] > section > header": { display: "none" },
        },
      },

      /**
       * `.working-file-diff button` — the diff `IconButton` takes the sage of its own column
       * instead of the text variant's muted ink. Width stays the shared 34px: `IconButton`
       * sets it as an inline style, which the approved study's 28px CSS rule never beat, so
       * the render Daniel approved is the 34px one.
       */
      fileDiffButton: {
        "&[data-nc-header-control]": { minHeight: "28px", color: "inherit" },
      },

      /** `.linked-work-resize` — a full-height grip on the preview's right edge. */
      linkedWorkResize: {
        "&[data-nc-header-control]": {
          position: "absolute",
          right: 0,
          top: "14px",
          bottom: "14px",
          width: "6px",
          height: "auto",
        },
      },
    },
  },
});
