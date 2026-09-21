import { defineSlotRecipe } from "@pandacss/dev";

/**
 * `workingFiles` — the approved Atlas 2 working-files list, packaged 2026-09-20.
 * Transcribed from `design-atlas-2/wraparound-study.css` (the `.working-file-*` and
 * `.agent-file-*` blocks) and `design-atlas-2/working-files.tsx`.
 *
 * A row is a name you can open, a disclosure for its summary, a flexible dead zone that also
 * toggles the summary, and a diff icon when the file has changes. The row is deliberately NOT
 * a package `Row`: `Row` is itself a button and the approved row nests three of them.
 *
 * The file viewer / diff / move panel is a `Drawer` the HOST owns — this package supplies the
 * list, its context menu, the diff affordance and the callbacks that ask for a drawer. It
 * never reads a workspace and never holds file contents.
 */
export const workingFiles = defineSlotRecipe({
  className: "working-files",
  slots: [
    "root",
    "heading",
    "list",
    "file",
    "row",
    "open",
    "disclosure",
    "space",
    "diff",
    "detail",
    "menuLabel",
    "drawerBody",
    "fileTitle",
    "filePath",
    "fileCode",
    "diffLine",
    "moveForm",
  ],
  base: {
    root: { minWidth: 0 },
    /** `.working-files-heading` — the label and the count, on one `InlineCluster`. */
    heading: { justifyContent: "space-between" },
    list: {},
    file: {},
    row: { display: "flex", alignItems: "center", minWidth: 0, minHeight: "36px" },
    /** `.working-file-open` — the name. Sage file glyph, underline on approach. */
    open: {
      border: 0,
      background: "transparent",
      color: "var(--il-ink)",
      font: "inherit",
      cursor: "pointer",
      padding: 0,
      display: "flex",
      alignItems: "center",
      gap: "9px",
      minWidth: 0,
      fontSize: "12px",
      minHeight: "32px",
      textAlign: "left",
      "& > svg": { flexShrink: 0, color: "var(--nc-sage)" },
      "& > span": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      "&:hover > span, &:focus-visible > span": {
        textDecoration: "underline",
        textUnderlineOffset: "3px",
      },
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "2px",
        borderRadius: "4px",
      },
    },
    disclosure: {
      border: 0,
      background: "transparent",
      color: "var(--il-muted)",
      font: "inherit",
      cursor: "pointer",
      padding: 0,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      width: "24px",
      height: "32px",
      "& svg": { transition: "transform 180ms var(--il-ease)" },
      "&[aria-expanded=true] svg": { transform: "rotate(90deg)" },
      "&:focus-visible": {
        outline: "2px solid var(--sys-accent)",
        outlineOffset: "2px",
        borderRadius: "4px",
      },
      "@media (prefers-reduced-motion: reduce)": { "& svg": { transition: "none" } },
    },
    /** The dead zone between the name and the diff icon still toggles the summary. */
    space: {
      border: 0,
      background: "transparent",
      color: "var(--il-ink)",
      font: "inherit",
      cursor: "pointer",
      padding: 0,
      flex: 1,
      minWidth: "8px",
      alignSelf: "stretch",
    },
    diff: {
      width: "28px",
      flexShrink: 0,
      display: "flex",
      justifyContent: "center",
      color: "var(--nc-sage)",
    },
    detail: { paddingLeft: "25px", "& > :last-child": { fontSize: "10px", overflowWrap: "anywhere" } },
    menuLabel: { padding: "6px 10px", fontSize: "11px", color: "var(--il-muted)" },
    /** `.agent-file-content` — the drawer body the host renders through `renderFileView`. */
    drawerBody: {
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      paddingTop: "20px",
      minWidth: 0,
    },
    fileTitle: { fontWeight: 600 },
    filePath: { overflowWrap: "anywhere", fontSize: "11px" },
    fileCode: {
      fontSize: "12px",
      lineHeight: 1.8,
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      margin: "6px 0",
    },
    diffLine: {
      display: "block",
      whiteSpace: "pre-wrap",
      "&[data-change=added]": { color: "var(--nc-sage)" },
      "&[data-change=removed]": { color: "var(--sys-sem-danger)" },
    },
    moveForm: { display: "flex", flexDirection: "column", alignItems: "stretch", gap: "14px" },
  },
});
