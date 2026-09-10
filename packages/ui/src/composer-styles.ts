// Approved composer rules expressed as Panda global styles. Preview-only rules are excluded.
export const composerCss = {
  ".nc-composer-context": {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBlock: "10px",
  },
  ".nc-composer-docked-bridge[data-dock=top] > *": {
    transformOrigin: "center bottom",
  },
  ".nc-composer-docked-bridge[data-dock=top][data-open=false] > *": {
    transform: "translateY(7px) scale(.94)",
  },

  ".nc-composer-workspace": {
    maxWidth: "780px",
    margin: "auto",
    transition: "max-width 360ms var(--il-ease)",
    font: "500 13px/19.5px 'IBM Plex Sans',sans-serif",
    letterSpacing: ".019em",
    wordSpacing: ".055em",
  },
  ".nc-composer-recipient": {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "0 18px",
    marginBottom: "12px",
    color: "var(--il-ink)",
  },
  ".nc-composer-avatar": {
    display: "grid",
    placeItems: "center",
    width: "23px",
    height: "23px",
    borderRadius: "8px",
    background: "#a1b5a421",
    color: "var(--sys-sem-sage)",
    fontSize: "9px",
  },
  ".nc-composer-recipient-detail": {
    color: "var(--il-dim)",
    fontSize: "11px",
    marginLeft: "auto",
  },
  ".nc-composer-shell": {
    position: "relative",
    isolation: "isolate",
    background: "var(--il-fill)",
    border: "1px solid var(--il-edge)",
    padding: "18px 14px 10px",
    boxShadow: "0 12px 30px #00000015",
    transition:
      "border-radius 340ms var(--il-ease),box-shadow 320ms var(--il-ease),border-color 320ms var(--il-ease)",
  },
  ".nc-composer-shell:before": {
    content: "''",
    position: "absolute",
    inset: "0",
    zIndex: "-1",
    borderRadius: "inherit",
    background: "var(--il-focus)",
    opacity: "0",
    transition: "opacity 320ms var(--il-ease)",
    pointerEvents: "none",
  },
  ".nc-composer-shell:focus-within:before": {
    opacity: ".8",
  },
  ".nc-composer-shell:focus-within": {
    borderColor: "#a896f028",
    boxShadow: "0 0 20px #a896f024,0 12px 30px #00000015",
  },
  ".nc-composer-shell textarea": {
    display: "block",
    resize: "none",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "24px",
    border: "0",
    background: "transparent",
    outline: "none !important",
    boxShadow: "none !important",
    color: "var(--il-ink)",
    font: "500 14px/24px 'IBM Plex Sans',sans-serif",
    letterSpacing: ".019em",
    wordSpacing: ".055em",
    padding: "0 7px",
    scrollbarWidth: "thin",
    scrollbarColor: "var(--nc-scroll-rest) transparent",
  },
  ".nc-composer-shell textarea::placeholder": {
    color: "var(--il-muted)",
    opacity: ".85",
  },
  ".nc-composer-controls, .nc-composer-left, .nc-composer-right": {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  ".nc-composer-controls": {
    justifyContent: "space-between",
    marginTop: "20px",
    gap: "12px",
  },
  ".nc-composer-icon": {
    display: "grid",
    placeItems: "center",
    width: "34px",
    height: "34px",
    borderRadius: "12px",
    color: "var(--il-muted)",
    flexShrink: "0",
    transition: "background 240ms var(--il-ease),color 240ms var(--il-ease)",
  },
  ".nc-composer-icon:hover, .nc-composer-icon[aria-expanded=true]": {
    background: "#b09dd517",
    color: "var(--il-ink)",
  },
  ".nc-composer-model": {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    font: "inherit",
    fontSize: "12px",
    color: "var(--il-muted)",
    padding: "7px 10px",
    borderRadius: "12px",
    whiteSpace: "nowrap",
  },
  ".nc-composer-model:hover": {
    background: "#b09dd511",
    color: "var(--il-ink)",
  },
  ".nc-composer-main-action": {
    width: "34px",
    height: "34px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    color: "var(--il-ink)",
    background: "#aca2cc22",
    marginLeft: "3px",
    transition:
      "background 240ms var(--il-ease),box-shadow 240ms var(--il-ease)",
  },
  ".nc-composer-main-action[data-ready=true]": {
    background: "var(--sys-accent)",
    color: "var(--sys-text-primary)",
    boxShadow: "0 0 16px var(--sys-accent-glow)",
  },
  ".nc-composer-main-action[data-ready=true]:hover": {
    background: "var(--sys-accent-hover)",
    boxShadow: "0 0 24px var(--sys-accent-glow)",
  },
  ".nc-composer-reply": {
    position: "relative",
  },
  ".nc-composer-format-bridge": {
    position: "absolute",
    bottom: "100%",
    right: "-39px",
    paddingBottom: "12px",
    zIndex: "30",
  },
  ".nc-composer-format-menu": {
    maxWidth: "calc(100vw - 24px)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px",
    width: "132px",
    borderRadius: "16px",
    background: "color-mix(in srgb,var(--sys-top) 85%,transparent)",
    backdropFilter: "blur(19px)",
    border: "1px solid #baa6d31c",
    boxShadow: "0 10px 32px #0005",
    animation: "nc-composer-reveal 220ms var(--il-ease)",
    transition: "width 300ms var(--il-ease)",
  },
  ".nc-composer-format-menu[data-expanded=true]": {
    width: "308px",
  },
  ".nc-composer-format-option": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0",
    height: "38px",
    minWidth: "36px",
    flex: "1",
    borderRadius: "11px",
    color: "var(--il-muted)",
    padding: "0",
    transition:
      "background 220ms var(--il-ease),color 220ms var(--il-ease),gap 260ms cubic-bezier(.16,1,.3,1),flex-grow 260ms cubic-bezier(.16,1,.3,1)",
  },
  ".nc-composer-format-option:hover": {
    background: "#b7a8cb18",
    color: "var(--il-ink)",
    boxShadow: "0 0 9px #b7a8cb09",
  },
  ".nc-composer-format-option[aria-checked=true]": {
    background: "linear-gradient(120deg,#b09dd52e,#abbfb81a)",
    color: "var(--il-ink)",
    boxShadow: "0 0 10px #b09dd510",
  },
  ".nc-composer-format-label": {
    display: "none",
    font: "500 13px/19.5px 'IBM Plex Sans',sans-serif",
    letterSpacing: ".019em",
    wordSpacing: ".055em",
    whiteSpace: "nowrap",
  },
  ".nc-composer-format-menu[data-expanded=true] .nc-composer-format-label": {
    display: "block",
    maxWidth: "90px",
    opacity: "1",
    transition:
      "max-width 260ms cubic-bezier(.16,1,.3,1),opacity 160ms ease-out 50ms",
  },
  ".nc-composer-format-menu[data-expanded=true] .nc-composer-format-option:last-child":
    {
      flex: "1.45",
    },
  ".nc-composer-under": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    fontSize: "11px",
    color: "var(--il-dim)",
  },
  ".nc-composer-under button": {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "4px",
    borderRadius: "6px",
    color: "var(--il-muted)",
  },
  ".nc-composer-live": {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 18px",
    marginBottom: "12px",
    borderRadius: "14px",
    background: "#a1b5a418",
    color: "var(--il-ink)",
    fontSize: "12px",
  },
  ".nc-composer-live button": {
    marginLeft: "auto",
    color: "var(--il-muted)",
  },
  ".nc-composer-small-menu": {
    zIndex: "100",
    minWidth: "215px",
    padding: "7px",
    borderRadius: "15px",
    background: "var(--nc-glass-bg)",
    border: "1px solid #baa6d31c",
    boxShadow: "0 12px 32px #0005",
    backdropFilter: "blur(var(--nc-glass-blur)) saturate(135%)",
    color: "var(--il-ink)",
    font: "500 13px/19.5px 'IBM Plex Sans',sans-serif",
    letterSpacing: ".019em",
    wordSpacing: ".055em",
    borderColor: "var(--nc-glass-edge)",
  },
  ".nc-composer-small-item": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "10px 12px",
    borderRadius: "10px",
    outline: "none",
    cursor: "pointer",
    position: "relative",
    isolation: "isolate",
    color: "var(--il-muted)",
  },
  ".nc-composer-small-item[data-highlighted], .nc-composer-small-item[data-state=checked]":
    {
      background: "transparent",
    },
  ".nc-composer-small-menu[data-mode=light]": {
    background: "var(--nc-glass-bg)",
    color: "var(--il-ink)",
  },
  "[data-caelos-theme=light] .nc-composer-format-menu": {
    background: "#f3eef6ed",
    borderColor: "#775e921c",
    boxShadow: "0 10px 32px #33283e22",
  },
  "@media (max-width:650px)": {
    ".nc-composer-controls": {
      flexWrap: "nowrap",
      gap: "12px",
    },
    ".nc-composer-right": {
      width: "auto",
      justifyContent: "flex-end",
    },
    ".nc-composer-model": {
      fontSize: "11px",
      paddingLeft: "3px",
    },
    ".nc-composer-format-menu[data-expanded=true]": {
      width: "280px",
    },
    ".nc-composer-format-bridge": {
      right: "-39px",
    },
    ".nc-composer-format-label": {
      fontSize: "12px",
    },
    ".nc-composer-recipient-detail": {
      display: "none",
    },
    ".nc-composer-model-settings": {
      marginRight: "auto",
    },
    ".nc-composer-model-settings .nc-composer-model": {
      padding: "7px 4px",
    },
  },
  "@media (prefers-reduced-motion:reduce)": {
    ".nc-composer-emerging-menu": {
      animation: "none !important",
    },
  },
  ".nc-composer-model-settings": {
    display: "flex",
    alignItems: "center",
    gap: "0",
    minWidth: "0",
  },
  ".nc-composer-model-settings .nc-composer-model": {
    padding: "7px 6px",
  },
  ".nc-composer-model-settings .nc-composer-reasoning": {
    color: "var(--il-dim)",
  },
  ".nc-composer-model-settings .nc-composer-model:hover, .nc-composer-model-settings .nc-composer-model[aria-expanded=true]":
    {
      color: "var(--il-ink)",
      background: "#b09dd511",
    },
  ".nc-composer-recipient>.nc-composer-icon": {
    width: "30px",
    height: "30px",
    marginLeft: "-3px",
    color: "var(--il-dim)",
    borderRadius: "10px",
  },
  ".nc-composer-recipient>.nc-composer-icon:hover, .nc-composer-recipient>.nc-composer-icon[aria-expanded=true]":
    {
      color: "var(--il-ink)",
    },
  ".nc-composer-brain": {
    position: "relative",
    flexShrink: "0",
  },
  ".nc-composer-brain-bridge": {
    position: "absolute",
    bottom: "100%",
    right: "-78px",
    paddingBottom: "12px",
    zIndex: "31",
  },
  ".nc-composer-brain .nc-composer-model-settings": {
    display: "flex",
    gap: "5px",
    width: "max-content",
    maxWidth: "calc(100vw - 48px)",
    padding: "7px",
    borderRadius: "16px",
    background: "color-mix(in srgb,var(--sys-top) 85%,transparent)",
    backdropFilter: "blur(19px)",
    border: "1px solid #baa6d31c",
    boxShadow: "0 10px 32px #0005",
    animation: "nc-composer-reveal 220ms var(--il-ease)",
    margin: "0",
  },
  ".nc-composer-brain .nc-composer-model-settings .nc-composer-model": {
    fontSize: "12px",
    padding: "9px 11px",
  },
  ".nc-composer-brain .nc-composer-model-settings .nc-composer-reasoning": {
    color: "var(--il-muted)",
  },
  ".nc-composer-brain .nc-composer-model:focus-visible, .nc-composer-brain>.nc-composer-icon:focus-visible":
    {
      outline: "none",
      boxShadow: "inset 0 0 0 1px #abb9f04d,0 0 9px #91a7ef20",
    },
  "[data-caelos-theme=light] .nc-composer-brain .nc-composer-model-settings": {
    background: "#f3eef6ed",
    borderColor: "#775e921c",
    boxShadow: "0 10px 32px #33283e22",
  },
  ".nc-composer-brain-bridge.nc-composer-docked-bridge, .nc-composer-format-bridge.nc-composer-docked-bridge":
    {
      top: "100%",
      bottom: "auto",
      paddingBottom: "0",
    },
  ".nc-composer-docked-bridge": {
    visibility: "hidden",
    pointerEvents: "none",
    transition: "visibility 0s 160ms",
  },
  ".nc-composer-docked-bridge[data-open=true]": {
    visibility: "visible",
    pointerEvents: "auto",
    transitionDelay: "0s",
  },
  ".nc-composer-docked-bridge>.nc-composer-format-menu, .nc-composer-docked-bridge>.nc-composer-model-settings":
    {
      animation: "none",
      opacity: "0",
      transform: "translateY(-7px) scale(.94)",
      transition:
        "transform 160ms cubic-bezier(.4,0,.8,.3),opacity 130ms ease-out,width 260ms cubic-bezier(.16,1,.3,1)",
    },
  ".nc-composer-docked-bridge>.nc-composer-format-menu": {
    transformOrigin: "calc(100% - 56px) -12px",
  },
  ".nc-composer-docked-bridge>.nc-composer-model-settings": {
    transformOrigin: "calc(100% - 95px) -12px",
  },
  ".nc-composer-docked-bridge[data-open=true]>.nc-composer-format-menu, .nc-composer-docked-bridge[data-open=true]>.nc-composer-model-settings":
    {
      opacity: "1",
      transform: "translateY(0) scale(1)",
      transition:
        "transform 260ms cubic-bezier(.16,1,.3,1),opacity 170ms ease-out,width 260ms cubic-bezier(.16,1,.3,1)",
    },
  ".nc-composer-format-option svg": {
    flexShrink: "0",
  },
  ".nc-composer-format-menu .nc-composer-format-label": {
    display: "block",
    maxWidth: "0",
    overflow: "hidden",
    opacity: "0",
    transition:
      "max-width 260ms cubic-bezier(.16,1,.3,1),opacity 100ms ease-out",
  },
  ".nc-composer-format-menu[data-expanded=true] .nc-composer-format-option": {
    gap: "8px",
  },
  ".nc-composer-emerging-menu": {
    transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)",
    "--rc-emerge-y": "7px",
  },
  ".nc-composer-emerging-menu[data-side=bottom]": {
    "--rc-emerge-y": "-7px",
  },
  ".nc-composer-emerging-menu[data-state=open]": {
    animation: "nc-composer-menu-emerge 260ms cubic-bezier(.16,1,.3,1) both",
  },
  ".nc-composer-emerging-menu[data-state=closed]": {
    pointerEvents: "none",
    animation: "nc-composer-menu-retreat 160ms cubic-bezier(.4,0,.8,.3) both",
  },
  ".nc-composer-emerging-menu[data-reduced=true]": {
    animation: "none !important",
  },
  ":where(.nc-composer-workspace, .nc-composer-recipient) button": {
    appearance: "none",
    border: 0,
    cursor: "pointer",
    font: "inherit",
    backgroundColor: "transparent",
  },
  ".nc-composer-workspace button:focus-visible, .nc-composer-recipient button:focus-visible":
    {
      outline: "none",
      boxShadow: "inset 0 0 0 1px #abb9f04d,0 0 9px #91a7ef20",
    },
  ".nc-composer-small-item::before": {
    content: '""',
    position: "absolute",
    inset: "1px 0",
    borderRadius: "9px",
    filter: "blur(.7px)",
    zIndex: -1,
    opacity: 0,
    background: "linear-gradient(100deg,#8099e83b,#9690d124)",
  },
  ".nc-composer-small-item[data-highlighted]": {
    color: "var(--il-ink)",
  },
  ".nc-composer-small-item[data-highlighted]::before": {
    opacity: 1,
  },
  ".nc-composer-workspace button:disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  "@media (prefers-reduced-transparency: reduce)": {
    ".nc-composer-small-menu, .nc-composer-format-menu, .nc-composer-brain .nc-composer-model-settings":
      {
        background: "var(--nc-opaque)",
        backdropFilter: "none",
      },
  },
} as const;
export const composerKeyframes = {
  "nc-composer-reveal": {
    from: {
      opacity: "0",
      transform: "translateY(5px)",
    },
    to: {
      opacity: "1",
      transform: "translateY(0)",
    },
  },
  "nc-composer-menu-emerge": {
    from: {
      opacity: "0",
      transform: "translateY(var(--rc-emerge-y)) scale(.94)",
    },
    to: {
      opacity: "1",
      transform: "translateY(0) scale(1)",
    },
  },
  "nc-composer-menu-retreat": {
    from: {
      opacity: "1",
      transform: "translateY(0) scale(1)",
    },
    to: {
      opacity: "0",
      transform: "translateY(var(--rc-emerge-y)) scale(.94)",
    },
  },
} as const;
