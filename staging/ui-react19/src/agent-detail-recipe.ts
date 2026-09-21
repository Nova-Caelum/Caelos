import { defineSlotRecipe } from "@pandacss/dev";

/**
 * `agentDetail` — the approved Atlas 2 agent detail card, "profile" layout, packaged
 * 2026-09-20. Transcribed from `design-atlas-2/agent-card-v2.css` as it stands on that date
 * (`AgentCardBuildSpec_DaVinci_2026-09-19` is the spec it was built to).
 *
 * The card is information only. Daniel, intent ledger I17: "the agent card should just be for
 * agent info. things like the action and questions should be somewhere else." There is no
 * Allow / Decline, no answer field and no action panel — question and permission PROMPTS
 * belong to a future fleet interface; what lives here is the permission SETTING.
 *
 * Two planes, one card, 376px wide, no scroll at rest:
 *   1. the agent plane — the glass itself, who this is;
 *   2. the session plane — what changes between sessions, which does not sit behind a rule or
 *      a dashed line but bleeds to the card's left, right and bottom edges and darkens in
 *      over 30px. Daniel: "it can be separated by space and maybe a progressive blur into the
 *      glass instead of a hard line."
 *
 * The older "triage" layout is deliberately NOT packaged; it is preserved in the Atlas.
 *
 * Dead in the approved source and therefore not ported: `.profile-name-row` (nothing renders
 * it since the subagent mark moved into the status column).
 */
export const agentDetail = defineSlotRecipe({
  className: "agent-detail",
  slots: [
    "root",
    "agentPlane",
    "identity",
    "avatar",
    "identityText",
    "name",
    "subtitle",
    "harness",
    "surface",
    "statusControls",
    "status",
    "sessionPlane",
    "sessionRow",
    "sessionId",
    "context",
    "contextLabel",
    "contextUnknown",
    "selectors",
    "work",
    "workGroup",
    "workTrigger",
    "workSummary",
    "workChevron",
    "workContent",
    "liveItem",
    "itemName",
    "trailing",
    "dim",
    "detailBody",
    "permissionOptions",
    "files",
  ],
  base: {
    /** `.agent-card-v2` — the card's own type base, which every plain control inherits. */
    root: {
      fontFamily: "var(--font-nova-sans, 'IBM Plex Sans'), sans-serif",
      fontSize: "12px",
      lineHeight: 1.5,
      color: "var(--il-ink)",
      "@media (prefers-reduced-motion: reduce)": {
        "& *": { animation: "none !important", transition: "none !important" },
      },
    },

    // ── Agent plane ───────────────────────────────────────────────────────────────────
    /**
     * `.profile-agent-plane`. The study composes `Inset` and then removes its bottom padding.
     * That is not reproducible from the package: Panda emits the spacing recipe's
     * `{kind:"inset", density:"default"}` COMPOUND variant as an atomic class in
     * `@layer utilities`, which outranks every recipe layer whatever the specificity. So the
     * two planes own their padding here — derived exactly the way `spacing-recipe.ts` derives
     * 21px, so they move with the scale rather than pinning a literal.
     */
    agentPlane: { padding: "calc((var(--sys-space-6) + var(--sys-space-7)) / 2)", paddingBottom: 0 },
    /** `.profile-identity` — avatar, name and the fixed 20px status column. */
    identity: {
      display: "grid",
      gridTemplateColumns: "60px minmax(0, 1fr) 20px",
      gap: "var(--sys-space-4)",
      alignItems: "center",
      position: "relative",
    },
    /**
     * `.profile-avatar` — 60px with the context ring, square in the rounded variant. Clicking
     * it opens the agent profile / loadout; tooltip only, no text label anywhere.
     */
    avatar: {
      width: "60px",
      height: "60px",
      border: 0,
      padding: "5px",
      background: "none",
      color: "inherit",
      position: "relative",
      cursor: "pointer",
      borderRadius: "50%",
      font: "inherit",
      "& > :first-child": { width: "50px", height: "50px", fontSize: "23px" },
      "& svg": { position: "absolute", inset: 0, width: "60px", height: "60px" },
      "[data-shape=rounded] &": { borderRadius: "var(--sys-radius-md)" },
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "3px",
      },
    },
    identityText: { minWidth: 0 },
    name: { fontSize: "15px", lineHeight: "22px", fontWeight: 600 },
    /** `.profile-subtitle` — one tight line: harness mark, then the editable surface. */
    subtitle: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sys-space-2, 6px)",
      fontSize: "11px",
      lineHeight: "17px",
      color: "var(--il-dim)",
    },
    harness: {
      display: "inline-flex",
      alignItems: "center",
      flexShrink: 0,
      borderRadius: "var(--sys-radius-sm)",
      appearance: "none",
      border: 0,
      background: "transparent",
      color: "inherit",
      padding: 0,
      cursor: "pointer",
      "& > svg": { transition: "color 240ms var(--il-ease)" },
      "@media (hover: hover)": { "&:hover > svg": { color: "var(--sys-accent)" } },
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "3px",
      },
      "&:focus-visible > svg": { color: "var(--sys-accent)" },
    },
    surface: {
      appearance: "none",
      border: 0,
      background: "transparent",
      color: "inherit",
      padding: 0,
      cursor: "pointer",
      font: "inherit",
      "&:hover": { color: "var(--il-ink)", textDecoration: "underline" },
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "3px",
      },
    },
    /** `.profile-status-controls` — a `Stack` pinned to the card's top-right corner. */
    statusControls: {
      alignSelf: "start",
      justifySelf: "end",
      alignItems: "flex-end",
      position: "relative",
      zIndex: 1,
    },
    /**
     * `.profile-status` — rest is the icon alone; the maintained `Tooltip` supplies the word
     * on hover or focus; the click opens a detail popover about the status itself.
     */
    status: {
      appearance: "none",
      border: 0,
      background: "transparent",
      color: "inherit",
      padding: 0,
      cursor: "pointer",
      font: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flexShrink: 0,
      gap: 0,
      minHeight: "24px",
      borderRadius: "var(--sys-radius-sm)",
      "& > svg": { flexShrink: 0, transition: "color 240ms var(--il-ease)" },
      "&[data-attention=true] > svg": { color: "var(--sys-sem-progress-hover)" },
      "@media (hover: hover)": { "&:hover > svg": { color: "var(--sys-accent)" } },
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "3px",
      },
      "&:focus-visible > svg": { color: "var(--sys-accent)" },
    },

    // ── Session plane ─────────────────────────────────────────────────────────────────
    /**
     * `.profile-session-plane`. The material arrives over 30px rather than at an edge — the same
     * distance and mechanism as the approved Atlas 3 glass-to-paper join. It bleeds to the card's
     * left, right and bottom edges.
     *
     * Round 1 correction (Daniel, 2026-09-20): "too much of a gap … between the top and second
     * section". The join had three owners — the agent plane's `paddingBottom: 0`, this plane's
     * `marginTop: 18px` and its `paddingTop: 24px` — 42px measured from the LOWEST element of the
     * agent plane (the status-icon column, which stands taller than the identity block at three
     * icons). Both overrides are removed, so this plane's own 21px inset is the single owner
     * (design rule 2) and the perceived gap halves to 21px. With no margin the 30px fade now
     * begins exactly at the join, which is how rule 3 asks two planes of one card to meet.
     */
    sessionPlane: {
      padding: "calc((var(--sys-space-6) + var(--sys-space-7)) / 2)",
      background:
        "linear-gradient(180deg, rgba(8,7,14,0) 0, rgba(8,7,14,.30) 30px, rgba(8,7,14,.36) 100%)",
      borderBottomLeftRadius: "inherit",
      borderBottomRightRadius: "inherit",
    },
    sessionRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: 0,
      "& > :last-child": { flexShrink: 0 },
    },
    sessionId: {
      fontFamily: "var(--font-nova-mono, 'IBM Plex Mono'), monospace",
      fontSize: "10px",
      color: "var(--il-muted)",
    },
    context: {},
    /** Percent then the word "context" on the left, token count right, bar underneath. */
    contextLabel: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minWidth: 0,
      fontSize: "12px",
      "& strong": { fontWeight: 600 },
    },
    /** Unknown telemetry is a dashed track, never a 0% bar. */
    contextUnknown: {
      height: "4px",
      background:
        "repeating-linear-gradient(90deg,var(--il-dim) 0 3px,transparent 3px 7px)",
      opacity: 0.45,
      borderRadius: "2px",
    },
    /** `.profile-selectors` — model then reasoning, reusing the composer's own selector. */
    selectors: {},

    // ── Work rows ─────────────────────────────────────────────────────────────────────
    work: {},
    workGroup: {},
    /** `.profile-work-trigger` — 13px icon, muted label, flexible space, dim summary, chevron. */
    workTrigger: {
      display: "grid",
      gridTemplateColumns: "13px auto 1fr 13px",
      alignItems: "center",
      gap: "9px",
      width: "100%",
      minHeight: "24px",
      padding: 0,
      border: 0,
      background: "none",
      color: "var(--il-muted)",
      cursor: "pointer",
      textAlign: "left",
      font: "inherit",
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "3px",
      },
    },
    workSummary: { textAlign: "right", fontSize: "10px", color: "var(--il-dim)" },
    workChevron: {
      "[aria-expanded=true] > &": { transform: "rotate(90deg)" },
    },
    workContent: { paddingTop: "12px", paddingLeft: "21px", fontSize: "11px" },
    /**
     * Daniel, I14 / I19: rows are closed by default, "but if one is in progress its
     * immediately visible". The live item shows through beneath the closed header, indented
     * 21px, with a 12px `RippleLoader` and a dim trailing value where one exists.
     */
    liveItem: { paddingLeft: "21px", minHeight: "27px", fontSize: "11px" },
    itemName: {
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    trailing: { marginLeft: "auto", fontSize: "11px", color: "var(--il-dim)" },
    dim: { color: "var(--il-dim)" },
    /** Body of a status / permissions / subagents detail popover. */
    detailBody: {},
    permissionOptions: { display: "flex", flexDirection: "column" },
    /**
     * `.profile-existing-files` — the embedded list drops its own heading. The rule itself
     * lives in `headerControl`'s `agentCard` kind, because it has to beat `Section`'s own
     * `spacing({kind:"intro"})` variant and a slot recipe never can.
     */
    files: {},
  },
});
