import { defineRecipe, defineSlotRecipe } from "@pandacss/dev";

export const lettering = {
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  lineHeight: "19.5px",
  letterSpacing: ".019em",
  wordSpacing: ".055em",
} as const;
const focus = {
  outline: "none",
  boxShadow: "inset 0 0 0 1px #abb9f04d, 0 0 9px #91a7ef20",
};
const control = {
  ...lettering,
  boxSizing: "border-box",
  appearance: "none",
  border: 0,
  cursor: "pointer",
  color: "var(--il-ink)",
  background: "transparent",
  "&:focus-visible": focus,
  "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  "& svg": { flexShrink: 0 },
  "@media (forced-colors: active)": {
    "&:focus-visible": { outline: "2px solid Highlight" },
  },
} as const;
const feather = {
  content: '""',
  position: "absolute",
  inset: "1px 0",
  zIndex: -1,
  pointerEvents: "none",
  borderRadius: "inherit",
  filter: "blur(.75px)",
  background: "linear-gradient(105deg,#8e9de027,#9190c817)",
  opacity: 0,
  transition: "opacity 220ms var(--il-ease)",
} as const;

export const button = defineRecipe({
  className: "button",
  base: {
    ...control,
    position: "relative",
    isolation: "isolate",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    border: "1px solid transparent",
    borderRadius: "var(--sys-radius-md)",
    paddingInline: "16px",
    whiteSpace: "nowrap",
    transition:
      "background 240ms var(--il-ease), color 240ms var(--il-ease), box-shadow 240ms var(--il-ease)",
  },
  variants: {
    variant: {
      primary: {
        fontWeight: 650,
        fontSize: "10.5px",
        letterSpacing: ".005em",
        color: "var(--sys-text-primary)",
        background:
          "linear-gradient(135deg,var(--sys-sem-ready-tint),transparent 48%,var(--sys-sem-sage-tint)),color-mix(in srgb,var(--sys-accent) 90%,var(--sys-ground))",
        borderColor: "var(--sys-hair-2)",
        boxShadow:
          "var(--sys-elev-1),0 0 var(--sys-space-4) var(--sys-accent-glow)",
        backdropFilter: "blur(var(--sys-radius-md)) saturate(140%)",
        "&:is(:hover,[data-force-state=hover]):not(:disabled)": {
          background:
            "linear-gradient(135deg,var(--sys-sem-ready-line),transparent 48%,var(--sys-sem-sage-line)),color-mix(in srgb,var(--sys-accent-hover) 94%,var(--sys-ground))",
          borderColor: "var(--sys-hair-3)",
          boxShadow:
            "var(--sys-elev-2),0 0 var(--sys-space-6) var(--sys-accent-glow)",
        },
      },
      tonal: {
        background: "linear-gradient(135deg,#b8a4da23,#9fbcb610),#8f7fa50c",
        color: "var(--il-muted)",
        "&:is(:hover,[data-force-state=hover])": {
          color: "var(--il-ink)",
          boxShadow: "0 0 16px #b09ad011",
        },
      },
      text: {
        color: "var(--il-muted)",
        paddingInline: "8px",
        "&::before": {
          ...feather,
          inset: "-3px -11px",
          filter: "blur(6px)",
          background:
            "radial-gradient(ellipse at center,#c3a2de18 0%,#c3a2de09 38%,transparent 73%)",
        },
        "&:is(:hover,[data-force-state=hover])": {
          color: "var(--nc-text-hover)",
          "&::before": { opacity: 1 },
        },
      },
    },
    size: { sm: { height: "28px" }, md: { height: "32px" } },
    danger: {
      true: {
        color: "var(--sys-sem-danger)",
        background: "var(--sys-sem-danger-tint)",
        "&:is(:hover,[data-force-state=hover]):not(:disabled)": {
          color: "var(--sys-sem-danger)",
          background: "var(--sys-sem-danger-tint)",
          borderColor: "var(--sys-sem-danger-line)",
          boxShadow: "0 0 12px var(--sys-sem-danger-tint)",
        },
      },
    },
  },
  defaultVariants: { variant: "tonal", size: "md" },
});

export const card = defineRecipe({
  className: "card",
  base: {
    ...lettering,
    boxSizing: "border-box",
    border: "1px solid var(--il-edge)",
    borderRadius: "18px",
    padding: "24px",
    color: "var(--il-ink)",
    minWidth: 0,
  },
  variants: {
    variant: {
      flat: { background: "var(--il-surface)" },
      lifted: {
        background: "var(--il-fill)",
        boxShadow: "0 12px 30px #00000015",
      },
      glass: {
        background: "var(--nc-glass-bg)",
        backdropFilter: "blur(var(--nc-glass-blur)) saturate(120%)",
        borderColor: "var(--nc-glass-edge)",
        boxShadow: "0 18px 44px var(--nc-glass-shadow)",
        "@supports not (backdrop-filter: blur(1px))": {
          background: "var(--nc-opaque)",
        },
        "@media (prefers-reduced-transparency: reduce)": {
          background: "var(--nc-opaque)",
          backdropFilter: "none",
        },
      },
    },
    interactive: {
      true: {
        cursor: "pointer",
        "&:hover": { borderColor: "var(--sys-hair-2)" },
        "&:focus-visible": focus,
      },
    },
  },
  defaultVariants: { variant: "flat" },
});

export const input = defineSlotRecipe({
  className: "field",
  slots: ["root", "control", "icon", "clear", "label", "description"],
  base: {
    root: {
      position: "relative",
      isolation: "isolate",
      display: "flex",
      alignItems: "center",
      minWidth: 0,
      background: "var(--il-fill)",
      border: "1px solid var(--il-edge)",
      borderRadius: "11px",
      transition:
        "border-color 240ms var(--il-ease),box-shadow 320ms var(--il-ease)",
      "&::before": {
        ...feather,
        inset: 0,
        filter: "none",
        background: "var(--il-focus)",
        transition: "opacity 320ms var(--il-ease)",
      },
      "&:hover": { borderColor: "#b1a0ce33", "&::before": { opacity: 0.22 } },
      "&:is(:focus-within,[data-force-state=focus])": {
        borderColor: "rgba(168,150,240,.16)",
        boxShadow: "0 0 10px rgba(168,150,240,.28)",
        "&::before": { opacity: 1 },
      },
      "&[data-invalid=true]": { borderColor: "#bd748c80" },
      "&[data-disabled=true]": {
        opacity: 0.5,
        boxShadow: "none",
        borderColor: "var(--il-edge)",
        "&::before": { opacity: 0 },
      },
      "@media (forced-colors: active)": {
        borderColor: "CanvasText",
        "&:focus-within": { outline: "2px solid Highlight" },
      },
    },
    control: {
      ...lettering,
      minWidth: 0,
      width: "100%",
      boxSizing: "border-box",
      border: 0,
      borderRadius: "inherit",
      background: "transparent",
      outline: "none",
      boxShadow: "none",
      color: "var(--il-ink)",
      padding: "11px 14px",
      "&:focus": { outline: "none", boxShadow: "none" },
      "&::placeholder": { color: "var(--il-placeholder)", opacity: 1 },
      "&:disabled": { cursor: "not-allowed" },
      scrollbarWidth: "thin",
      scrollbarColor: "var(--nc-scroll-rest) transparent",
    },
    icon: { marginLeft: "14px", flex: "none", color: "var(--il-dim)" },
    clear: {
      ...control,
      width: "26px",
      height: "26px",
      marginRight: "8px",
      borderRadius: "50%",
      flex: "none",
      display: "grid",
      placeItems: "center",
      "&:hover": { background: "#b8a7d01c" },
    },
    label: {
      ...lettering,
      display: "block",
      marginBottom: "8px",
      color: "var(--il-ink)",
    },
    description: { ...lettering, marginTop: "8px", color: "var(--il-muted)" },
  },
  variants: {
    variant: {
      text: {},
      search: {
        root: { borderRadius: "999px" },
        control: { paddingLeft: "9px" },
      },
      large: {
        root: { alignItems: "stretch" },
        control: {
          minHeight: "108px",
          maxHeight: "420px",
          resize: "vertical",
          lineHeight: 1.65,
          overflow: "auto",
        },
      },
    },
  },
  defaultVariants: { variant: "text" },
});

export const chip = defineRecipe({
  className: "chip",
  base: {
    ...control,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "7px 12px",
    borderRadius: "999px",
    border: "1px solid transparent",
    color: "var(--il-muted)",
    transition: "background 220ms var(--il-ease),color 220ms var(--il-ease)",
    "&:is(button):hover:not(:disabled)": {
      background: "#a89bc31b",
      color: "var(--nc-text-hover)",
    },
    "&:is(span)": { cursor: "default" },
    "&[aria-pressed=true]": {
      background: "linear-gradient(120deg,#b09dd52e,#abbfb81a)",
      color: "var(--il-ink)",
      boxShadow: "0 0 8px #b4a1d20a",
      "&:hover": { background: "linear-gradient(120deg,#b09dd538,#abbfb822)" },
    },
  },
  variants: {
    variant: {
      filter: {},
      status: {
        fontSize: "12px",
        padding: "4px 10px",
        borderRadius: "8px",
        background: "color-mix(in srgb,var(--nc-status-color) 10%,transparent)",
        color: "var(--nc-status-color)",
      },
      count: { fontVariantNumeric: "tabular-nums", padding: "3px 8px" },
      category: {},
    },
    tone: {
      neutral: { "--nc-status-color": "var(--il-muted)" },
      ready: { "--nc-status-color": "var(--nc-ready)" },
      progress: { "--nc-status-color": "var(--nc-progress)" },
      done: { "--nc-status-color": "var(--nc-sage)" },
      sage: { "--nc-status-color": "var(--nc-sage)" },
      danger: { "--nc-status-color": "var(--nc-danger)" },
      atmospheric: { "--nc-status-color": "var(--sys-sem-atmospheric)" },
      structural: { "--nc-status-color": "var(--sys-sem-structural)" },
    },
  },
  defaultVariants: { variant: "filter", tone: "neutral" },
});

export const row = defineRecipe({
  className: "row",
  base: {
    ...control,
    display: "flex",
    position: "relative",
    isolation: "isolate",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    textAlign: "left",
    minHeight: "38px",
    padding: "8px 12px",
    borderRadius: "12px",
    color: "var(--il-muted)",
    transition: "color 220ms var(--il-ease)",
    "&::before": feather,
    "&:hover": { color: "var(--nc-text-hover)", "&::before": { opacity: 1 } },
    "&:is([data-selected=true],[data-state=active])": {
      color: "var(--il-ink)",
      "&::before": {
        opacity: 1,
        filter: "blur(1.35px)",
        background: "linear-gradient(105deg,#758ee43b,#8686cd25)",
        boxShadow: "0 0 10px #7e92e514",
      },
    },
    "& [data-row-label]": { flex: 1, minWidth: 0 },
    "& [data-row-actions]": {
      opacity: 0,
      transition: "opacity 200ms var(--il-ease)",
    },
    "&:is(:hover,:focus-within) [data-row-actions]": { opacity: 1 },
    "@media (hover: none)": { "& [data-row-actions]": { opacity: 1 } },
  },
  variants: {
    variant: {
      sidebar: {},
      list: {
        minHeight: "56px",
        "&[data-task-row]": { flexWrap: "wrap", rowGap: "4px" },
        "& [data-task-content]": { display: "flex", alignItems: "center", gap: "10px", flex: "1 1 200px", minWidth: 0 },
        "& [data-task-controls]": { display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: "10px", maxWidth: "100%", marginLeft: "auto" },
        "&[data-task-row]:is(:hover,:focus-within)": {
          "--task-row-title-color": "var(--nc-text-hover)",
          "&::before": {
            opacity: 1,
            filter: "none",
            background: "linear-gradient(105deg,#8e9de040,#9190c82e)",
            boxShadow: "inset 0 0 0 1px #b2bce526",
          },
        },
      },
      tab: {
        width: "auto",
        borderRadius: "999px",
        padding: "10px 22px",
        "&:is([data-selected=true],[data-state=active])::before": {
          filter: "none",
          background: "linear-gradient(135deg,#b8a4da23,#9fbcb610),#8f7fa50c",
          boxShadow: "0 0 9px #b09ad00c",
        },
      },
      crumb: { width: "auto", minHeight: 0, padding: "2px 4px" },
    },
    size: { sm: { fontSize: "12px" }, md: {} },
  },
  defaultVariants: { variant: "sidebar", size: "md" },
});

export const menu = defineSlotRecipe({
  className: "menu",
  slots: ["content", "item", "label", "separator"],
  base: {
    content: {
      ...lettering,
      zIndex: 100,
      minWidth: "215px",
      maxHeight: "var(--radix-dropdown-menu-content-available-height,70vh)",
      overflowY: "auto",
      padding: "7px",
      borderRadius: "15px",
      background: "var(--nc-glass-bg)",
      backdropFilter: "blur(var(--nc-glass-blur)) saturate(135%)",
      border: "1px solid var(--nc-glass-edge)",
      boxShadow: "0 18px 44px var(--nc-glass-shadow)",
      color: "var(--il-ink)",
      outline: "none",
      transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)",
      animation: "nc-menu-in 260ms cubic-bezier(.16,1,.3,1)",
      "&[data-state=closed]": {
        animation: "nc-menu-out 160ms cubic-bezier(.4,0,.8,.3)",
      },
      "@supports not (backdrop-filter: blur(1px))": {
        background: "var(--nc-opaque)",
      },
      "@media (prefers-reduced-transparency: reduce)": {
        background: "var(--nc-opaque)",
        backdropFilter: "none",
      },
    },
    item: {
      ...control,
      position: "relative",
      isolation: "isolate",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      padding: "10px 12px",
      borderRadius: "10px",
      outline: "none",
      color: "var(--il-muted)",
      "&::before": {
        ...feather,
        filter: "blur(.7px)",
        background: "linear-gradient(100deg,#8099e83b,#9690d124)",
      },
      "&[data-highlighted]": {
        color: "var(--il-ink)",
        boxShadow: "none",
        "&::before": { opacity: 1 },
      },
      "&[data-disabled]": { opacity: 0.5, pointerEvents: "none" },
    },
    label: { ...lettering, padding: "8px 12px", color: "var(--il-dim)" },
    separator: {
      height: "1px",
      margin: "5px 12px",
      background: "var(--il-edge)",
    },
  },
  variants: {
    layout: {
      action: {
        content: { width: "max-content", minWidth: 0, maxWidth: "calc(100vw - 24px)" },
        item: {
          justifyContent: "flex-start", gap: "8px", textAlign: "left",
          overflowWrap: "anywhere", "& > svg": { flexShrink: 0 },
        },
      },
    },
  },
});

export const tooltip = defineRecipe({
  className: "tooltip",
  base: {
    ...lettering,
    zIndex: 1000,
    boxSizing: "border-box",
    width: "max-content",
    minWidth: 0,
    maxWidth: "min(640px,calc(100vw - 24px),var(--radix-tooltip-content-available-width,640px))",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    padding: "10px 13px",
    border: "1px solid color-mix(in srgb,var(--sys-sem-sage) 12%,transparent)",
    borderRadius: "11px",
    color: "var(--nc-tip-ink)",
    background:
      "linear-gradient(135deg,color-mix(in srgb,var(--nc-tip-ink) 7%,transparent),transparent 58%),var(--nc-tip-fill)",
    boxShadow:
      "0 5px 12px var(--nc-tip-shadow-1),0 16px 34px var(--nc-tip-shadow-2),0 0 20px color-mix(in srgb,var(--sys-sem-sage) 8%,transparent)",
    transformOrigin: "var(--radix-tooltip-content-transform-origin)",
    animation: "nc-tooltip-in 180ms var(--il-ease)",
    "&[data-state=closed]": { animation: "nc-tooltip-out 110ms ease-in" },
    "& [data-tooltip-detail]": {
      display: "block",
      marginTop: "3px",
      color: "color-mix(in srgb,var(--nc-tip-ink) 78%,var(--nc-tip-fill))",
    },
    "@supports (backdrop-filter: blur(10px))": {
      background:
        "linear-gradient(135deg,color-mix(in srgb,var(--nc-tip-ink) 7%,transparent),transparent 58%),color-mix(in srgb,var(--nc-tip-fill) 80%,transparent)",
      backdropFilter: "blur(10px)",
    },
    "@media (prefers-reduced-transparency: reduce)": {
      background: "var(--nc-tip-fill)",
      backdropFilter: "none",
    },
    "@media (forced-colors: active)": { borderColor: "CanvasText" },
  },
  variants: {
    variant: {
      default: {},
      path: {
        fontSize: "12px",
        lineHeight: "18px",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      },
    },
  },
  defaultVariants: { variant: "default" },
});

export const scrollArea = defineSlotRecipe({
  className: "scroll",
  slots: ["root", "viewport", "track", "thumb"],
  base: {
    root: { position: "relative", overflow: "hidden", minWidth: 0 },
    viewport: {
      height: "100%",
      width: "100%",
      borderRadius: "inherit",
      overscrollBehavior: "contain",
      outline: "none",
      "& > div": {
        minWidth: "0 !important",
        display: "block !important",
        paddingRight: "23px",
      },
      "&:focus-visible": {
        outline: "1px solid #9dada475",
        outlineOffset: "-1px",
      },
    },
    track: {
      display: "flex",
      width: "22px",
      padding: "6px 7px",
      boxSizing: "border-box",
      right: 0,
      userSelect: "none",
      touchAction: "none",
      background: "transparent",
    },
    thumb: {
      position: "relative",
      flex: 1,
      minHeight: "28px",
      cursor: "grab",
      borderRadius: "999px",
      background: "transparent",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: "0 1px",
        borderRadius: "999px",
        background: "var(--nc-scroll-rest)",
        transition: "background 180ms cubic-bezier(.16,1,.3,1)",
      },
      "&[data-dragging=true]": {
        cursor: "grabbing",
        "&::before": { background: "var(--nc-scroll-drag)" },
      },
      "@media (forced-colors: active)": {
        "&::before": { background: "ButtonText" },
      },
    },
  },
});


export const avatar = defineRecipe({
  className: "avatar",
  base: {
    ...lettering,
    boxSizing: "border-box", display: "inline-grid", placeItems: "center",
    flexShrink: 0, position: "relative", overflow: "hidden", verticalAlign: "middle",
    borderRadius: "50%", color: "var(--nc-avatar-ink)",
    background: "color-mix(in srgb,var(--nc-avatar-ink) 14%,transparent)",
    "&:focus-visible": focus,
    "& img": { width: "100%", height: "100%", objectFit: "cover", gridArea: "1 / 1" },
  },
  variants: {
    size: {
      sm: { width: "24px", height: "24px", fontSize: "10px" },
      md: { width: "32px", height: "32px", fontSize: "12px" },
      lg: { width: "40px", height: "40px", fontSize: "14px" },
    },
    kind: {
      person: { "--nc-avatar-ink": "var(--nc-sage)" },
      agent: { "--nc-avatar-ink": "var(--nc-sage)", borderRadius: "30%" },
    },
  },
  defaultVariants: { size: "md", kind: "person" },
});

export const identity = defineSlotRecipe({
  className: "identity",
  slots: ["root", "text", "name", "description", "actions"],
  base: {
    root: { ...lettering, display: "flex", alignItems: "center", gap: "12px", minWidth: 0, color: "var(--il-ink)" },
    text: { minWidth: 0, flex: 1 },
    name: { display: "block", overflowWrap: "anywhere", fontWeight: 500 },
    description: { display: "block", color: "var(--il-muted)", overflowWrap: "anywhere", marginTop: "3px" },
    actions: { display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 },
  },
  variants: {
    variant: {
      chip: { root: { display: "inline-flex", maxWidth: "100%", gap: "8px", padding: "5px 9px 5px 6px", borderRadius: "999px", background: "var(--il-fill)", border: "1px solid var(--il-edge)" } },
      card: { root: { padding: "16px", borderRadius: "18px", background: "var(--il-surface)", border: "1px solid var(--il-edge)" } },
    },
  },
  defaultVariants: { variant: "card" },
});


export const disclosure = defineSlotRecipe({
  className: "disclosure",
  slots: ["root", "heading", "trigger", "chevron", "panel", "content"],
  base: {
    root: { minWidth: 0 },
    heading: { margin: 0 },
    trigger: {
      ...control, display: "flex", alignItems: "center", gap: "10px",
      width: "100%", textAlign: "left", padding: "8px 0", borderRadius: "10px",
      fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit",
      letterSpacing: "inherit", wordSpacing: "inherit",
      color: "var(--il-ink)",
    },
    chevron: {
      flexShrink: 0, color: "var(--il-muted)",
      transition: "transform 380ms var(--il-ease)",
      "&[data-open=true]": { transform: "rotate(90deg)" },
    },
    panel: {
      display: "grid", gridTemplateRows: "0fr", opacity: 0, visibility: "hidden",
      transition: "grid-template-rows 380ms var(--il-ease), opacity 380ms var(--il-ease), visibility 0s 380ms",
      "&[data-open=true]": {
        gridTemplateRows: "1fr", opacity: 1, visibility: "visible",
        transition: "grid-template-rows 380ms var(--il-ease), opacity 380ms var(--il-ease), visibility 0s",
      },
    },
    content: { minHeight: 0, overflow: "hidden" },
  },
});

// Approved Level 1 modal/drawer placement; surface chemistry remains Card's glass recipe.
export const overlay = defineSlotRecipe({
  className: "overlay", slots: ["backdrop", "content", "header", "title", "body"],
  base: {
    backdrop: { position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,.55)", animation: "nc-overlay-in 200ms var(--il-ease)", "&[data-state=closed]": { animation: "nc-overlay-out 160ms var(--il-ease)" } },
    content: { position: "fixed", zIndex: 51, display: "flex", flexDirection: "column", padding: 0, minHeight: 0, outline: "none", maxHeight: "calc(100dvh - 32px)", animation: "nc-overlay-in 200ms var(--il-ease)", "&[data-state=closed]": { animation: "nc-overlay-out 160ms var(--il-ease)" } },
    header: { display: "flex", alignItems: "flex-start", gap: "8px", flexShrink: 0, padding: "24px 24px 16px" },
    title: { flex: 1, minWidth: 0, "&[data-heading]": { fontFamily: "'Yrsa',serif", fontSize: "26px", fontWeight: 400, lineHeight: 1.15 } },
    body: { flex: 1, minHeight: 0, padding: "10px 24px 24px" },
  },
  variants: { placement: {
    dialog: { content: { top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "calc(100vw - 32px)", maxWidth: "448px" }, backdrop: { backdropFilter: "blur(6px)" } },
    drawer: { content: { top: 0, right: 0, height: "100dvh", maxHeight: "100dvh", width: "480px", maxWidth: "100vw", borderRadius: 0, animation: "nc-drawer-in 280ms var(--il-ease)", "&[data-state=closed]": { animation: "nc-drawer-out 200ms var(--il-ease)" } } },
  } }, defaultVariants: { placement: "dialog" },
});
