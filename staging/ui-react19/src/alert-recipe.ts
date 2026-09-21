import { defineSlotRecipe } from "@pandacss/dev";
import { conversationType } from "./chat-parts";

/**
 * 06 / 07 · The alert family. One anatomy, one material choice, one tone.
 * Locked by Daniel on 2026-09-20 ("Option A looks perfect lets lock it in" / "07 A is locked in!");
 * spec: `AlertLockedSpec_DaVinci_2026-09-20.md`. Translated from `studio/iter4/Alerts.tsx`
 * and `studio/iter4/iter4.css`, against computed values measured on the live render.
 *
 * Alerts are temporary, not info cards. They sit directly above the composer at the composer's
 * width, 10px apart. A 16px tone icon and the title share one line; everything else hangs from
 * the title's text axis (icon 16 + gap 9 = 25px). Filled shapes span the card symmetrically.
 * The system's neutral hairline always owns the edge; a tone supplies only fill, glow and ink.
 *
 * Approved members: permission = tonal / progress / system edge / glow;
 * question = glass / no tone. Every other combination is available but unapproved.
 */
export const alert = defineSlotRecipe({
  className: "alert",
  slots: [
    "stage",
    "root",
    "head",
    "icon",
    "title",
    "kicker",
    "pager",
    "body",
    "lede",
    "command",
    "actions",
    "choices",
  ],
  base: {
    /**
     * The shared measure for a request and its composer. `container-type` is what lets the
     * alert collapse its hanging indent in a narrow column rather than at a viewport width.
     */
    /**
     * The conversation's type base lives here rather than on the alert, and that placement is
     * load-bearing. Line height inherits as the NUMBER 1.55, so the 13px reason line resolves to
     * 20.15px and the 12px command chip to 18.6px — the approved values. A tonal alert inherits
     * this base; a glass alert composes the package's Card, whose own 13px declaration beats
     * inheritance, which is exactly the asymmetry the two approved alerts already have.
     */
    stage: {
      ...conversationType,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      width: "100%",
      minWidth: 0,
      maxWidth: "780px",
      marginInline: "auto",
      containerType: "inline-size",
    },
    root: {
      "--nc-alert-axis": "25px",
      boxSizing: "border-box",
      width: "100%",
      minWidth: 0,
      padding: "var(--sys-space-5) var(--sys-space-6) var(--sys-space-6)",
      borderRadius: "var(--sys-radius-xl)",
      "@container (max-width: 24rem)": { "--nc-alert-axis": "0px" },
      "& kbd": {
        font: "inherit",
        fontSize: "11px",
        opacity: 0.7,
        marginLeft: "var(--sys-space-1)",
        "@container (max-width: 24rem)": { display: "none" },
      },
    },
    head: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "var(--sys-space-3)",
      minWidth: 0,
    },
    // `display: flex` matters: the icon arrives as a node in a wrapper, and an inline wrapper
    // would add a text line box taller than the 16px glyph and push the head open by ~1px.
    icon: { display: "flex", alignItems: "center", flexShrink: 0, color: "var(--nc-alert-tone)" },
    title: {
      flex: "1 1 12rem",
      minWidth: 0,
      margin: 0,
      fontSize: "15px",
      lineHeight: 1.45,
      fontWeight: 550,
    },
    kicker: {
      fontSize: "11px",
      lineHeight: 1.5,
      color: "var(--nc-alert-on)",
      whiteSpace: "nowrap",
    },
    pager: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sys-space-1)",
      marginLeft: "auto",
      "& > span": { marginRight: "var(--sys-space-2)" },
      "@container (max-width: 24rem)": { marginLeft: 0 },
    },
    body: { paddingLeft: "var(--nc-alert-axis)" },
    lede: {
      margin: 0,
      marginTop: "var(--sys-space-1)",
      fontSize: "13px",
      color: "var(--il-muted)",
    },
    command: {
      display: "block",
      width: "fit-content",
      maxWidth: "100%",
      marginTop: "var(--sys-space-3)",
      padding: "var(--sys-space-2) var(--sys-space-3)",
      borderRadius: "var(--sys-space-2)",
      background: "color-mix(in srgb, var(--nc-chrome) 55%, transparent)",
      fontFamily: "var(--font-nova-mono, 'IBM Plex Mono'), monospace",
      fontSize: "12px",
      color: "var(--il-muted)",
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
    },
    /**
     * Two secondary actions on the title's axis and the committing action at the right edge.
     * The committing action is simply the last child, so callers pass plain buttons and the
     * row still reads Deny / Clarify / Allow with Allow right-aligned.
     */
    actions: {
      display: "grid",
      gridTemplateColumns: "max-content max-content minmax(0, 1fr)",
      alignItems: "center",
      gap: "var(--sys-space-3)",
      marginTop: "var(--sys-space-5)",
      "& > *:last-child": { justifySelf: "end" },
      "@container (max-width: 24rem)": {
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        marginLeft: 0,
        "& > *:last-child": { justifySelf: "stretch" },
        "& > button": { minWidth: 0, paddingInline: "var(--sys-space-3)" },
      },
    },
    /**
     * Answer rows are boxes, so the BOX is centred in the card (equal insets) while the label
     * keeps the title's text axis: 24px of leading padding plus the button's own 1px border.
     */
    choices: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--sys-space-2)",
      marginTop: "var(--sys-space-4)",
      marginLeft: "calc(-1 * var(--nc-alert-axis))",
      "& > button": {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--sys-space-5)",
        width: "100%",
        minHeight: "36px",
        height: "auto",
        paddingBlock: "8px",
        paddingInlineStart: "var(--sys-space-7)",
        textAlign: "left",
        whiteSpace: "normal",
      },
      "& > button[aria-pressed=true]": { color: "var(--il-ink)" },
    },
  },
  variants: {
    /** One tone = one existing token set. Nothing ad hoc. */
    tone: {
      progress: {
        root: {
          "--nc-alert-tone": "var(--sys-sem-progress)",
          "--nc-alert-tint": "var(--sys-sem-progress-tint)",
          "--nc-alert-line": "var(--sys-sem-progress-line)",
          "--nc-alert-glow": "var(--sys-sem-progress-glow)",
          "--nc-alert-on": "var(--sys-sem-progress-on-tint)",
        },
      },
      accent: {
        root: {
          "--nc-alert-tone": "var(--sys-accent)",
          "--nc-alert-tint": "var(--sys-accent-tint)",
          "--nc-alert-line": "var(--sys-accent-line)",
          "--nc-alert-glow": "var(--sys-accent-glow)",
          "--nc-alert-on": "var(--sys-accent-on-tint)",
        },
      },
      ready: {
        root: {
          "--nc-alert-tone": "var(--sys-sem-ready)",
          "--nc-alert-tint": "var(--sys-sem-ready-tint)",
          "--nc-alert-line": "var(--sys-sem-ready-line)",
          "--nc-alert-glow": "var(--sys-sem-ready-glow)",
          "--nc-alert-on": "var(--sys-sem-ready-on-tint)",
        },
      },
      danger: {
        root: {
          "--nc-alert-tone": "var(--sys-sem-danger)",
          "--nc-alert-tint": "var(--sys-sem-danger-tint)",
          "--nc-alert-line": "var(--sys-sem-danger-line)",
          "--nc-alert-glow": "var(--sys-sem-danger-glow)",
          "--nc-alert-on": "var(--sys-sem-danger-on-tint)",
        },
      },
      sage: {
        root: {
          "--nc-alert-tone": "var(--sys-sem-sage)",
          "--nc-alert-tint": "var(--sys-sem-sage-tint)",
          "--nc-alert-line": "var(--sys-sem-sage-line)",
          "--nc-alert-glow": "var(--sys-sem-sage-glow)",
          "--nc-alert-on": "var(--sys-sem-sage-on-tint)",
        },
      },
      /** No state is claimed: the icon takes the primary ink and the tag the muted ink. */
      none: {
        root: {
          "--nc-alert-tone": "var(--sys-text-primary)",
          "--nc-alert-on": "var(--il-muted)",
        },
      },
    },
    /**
     * `tonal` is the tonal-button wash at card scale over an opaque elevated base, so graph
     * lines never run behind the words. `glass` adds nothing: the component composes the
     * package's own glass Card and this variant only tints it when a tone is present.
     */
    material: {
      tonal: {
        root: {
          background:
            "linear-gradient(125deg, var(--nc-alert-tint), transparent 72%), color-mix(in srgb, var(--nc-alert-tone) 5%, var(--nc-elevated))",
          border: "1px solid var(--nc-alert-line)",
          boxShadow: "var(--sys-elev-1), 0 0 18px var(--nc-alert-glow)",
        },
      },
      glass: {},
    },
    /** The system's neutral hairline is the default edge; a tone edge reads as two edges. */
    edge: {
      system: { root: { borderColor: "var(--il-edge)" } },
      tone: {},
    },
    glow: {
      true: {},
      false: { root: { boxShadow: "var(--sys-elev-1)" } },
    },
  },
  compoundVariants: [
    // A toned glass alert keeps the glass material and adds only the tint, line and glow.
    {
      material: "glass",
      tone: ["progress", "accent", "ready", "danger", "sage"],
      css: {
        root: {
          background:
            "linear-gradient(125deg, var(--nc-alert-tint), transparent 72%), var(--nc-glass-bg)",
          borderColor: "var(--nc-alert-line)",
          boxShadow:
            "0 18px 44px var(--nc-glass-shadow), 0 0 18px var(--nc-alert-glow)",
        },
      },
    },
    { material: "glass", edge: "system", css: { root: { borderColor: "var(--il-edge)" } } },
  ],
  defaultVariants: { tone: "none", material: "tonal", edge: "system", glow: true },
});
