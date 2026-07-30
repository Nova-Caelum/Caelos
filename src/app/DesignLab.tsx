// ═══════════════════════════════════════════════════════════════════════════════
//  DESIGN LAB — Caelos component sandbox
// ───────────────────────────────────────────────────────────────────────────────
//  Toggle: append `?lab=1` to the URL. main.tsx swaps App→DesignLab on that flag.
//
//  Iteration 5 — 2026-07-29 — SLATE + INPUT BAR, SIDE BY SIDE
//  ─────────────────────────────────────────────────────────────
//  Two fixes in one pass:
//
//  1. EDGE SYMMETRY. Killed the inset top-highlight entirely. The top-edge-thicker
//     mistake persisted across two iters because I kept `inset 0 1px 0 rgba(white,0.07)`
//     in the shadow rig. That stripe is the culprit at wider surface scale — nc-glass-menu
//     survives it because it's compact. Now: uniform 1px hairline border at 6% white
//     (matches nc-input's rest-state border chemistry exactly, which has NO inset).
//     Edge lift comes from a soft outer halo (0 0 20px accent at 8%) — symmetric in all
//     directions. This is the "blurred edges" axis applied.
//
//  2. INPUT BAR ADJACENT. Each slate variant now sits next to the actual nc-input
//     element in focus state, so you can point at the input and say "make it do THAT."
//     Same calibration surface, direct comparison.
//
//  Slate spread kept at 4 variants (A neutral → D strong blue) per your call — useful
//  for designing across multiple substrates before committing.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { FolderInput } from "lucide-react";

const LAB = {
  bg:        "#1C1B28",
  cream:     "#F4EAD5",
  creamDim:  "rgba(244, 234, 213, 0.62)",
  creamMute: "rgba(244, 234, 213, 0.42)",
  creamHair: "rgba(244, 234, 213, 0.08)",
  // Constants across all slate variants
  accent:         "#6E78B0",                       // Light Blue — the highlight hue
  accentActive:   "rgba(110, 120, 176, 0.14)",     // active-segment whisper wash
  accentGlow:     "rgba(110, 120, 176, 0.28)",     // hover outer bloom (stronger)
  accentHalo:     "rgba(110, 120, 176, 0.08)",     // always-on soft outer halo (edge)
  hairBorder:     "rgba(255, 255, 255, 0.06)",     // uniform low-alpha hairline
  ease:           "cubic-bezier(0.16, 1, 0.3, 1)",
};

const SLATES = [
  { id: "A", label: "Neutral charcoal",   note: "No blue shift. Baseline.",                         fill: "rgba(42, 44, 52, 0.72)",  swatch: "rgb(42, 44, 52)"  },
  { id: "B", label: "Slight blue-shift",  note: "Whisper of cool.",                                 fill: "rgba(44, 52, 72, 0.72)",  swatch: "rgb(44, 52, 72)"  },
  { id: "C", label: "Medium blue-shift",  note: "Visible cool cast.",                               fill: "rgba(46, 58, 82, 0.72)",  swatch: "rgb(46, 58, 82)"  },
  { id: "D", label: "Strong blue-slate",  note: "Assertive cool. Maximum tension against warm bg.", fill: "rgba(48, 66, 96, 0.72)",  swatch: "rgb(48, 66, 96)"  },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  Breadcrumb — edges NOW SYMMETRIC. No inset top-highlight. Uniform hairline border
//  + soft outer halo (accent, always-on) as the "edge." Blurred-edges axis applied.
// ═══════════════════════════════════════════════════════════════════════════════

function Breadcrumb({ fill, id }: { fill: string; id: string }) {
  const cls = `bc-${id}`;
  return (
    <>
      <style>{`
        .${cls}-shell {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 5px 6px 5px 12px;
          border-radius: 12px;
          background: ${fill};
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          backdrop-filter: blur(18px) saturate(160%);
          border: 1px solid ${LAB.hairBorder};
          /* Symmetric edge chemistry — no inset, no micro-ring. Outer halo IS the edge. */
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.42),
            0 0 20px ${LAB.accentHalo};
        }
        .${cls}-seg {
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          font-size: 12.5px;
          letter-spacing: -0.005em;
          color: ${LAB.creamDim};
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 240ms ${LAB.ease}, color 240ms ${LAB.ease};
        }
        .${cls}-seg:hover {
          background: rgba(244, 234, 213, 0.04);
          color: rgba(244, 234, 213, 0.94);
        }
        .${cls}-seg--active {
          color: rgba(244, 234, 213, 0.98);
          font-weight: 500;
          background: ${LAB.accentActive};
        }
        .${cls}-sep {
          color: rgba(244, 234, 213, 0.24);
          font-size: 11px;
          user-select: none;
          padding: 0 2px;
        }
        .${cls}-icon {
          margin-left: 2px;
          padding: 5px 7px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: rgba(244, 234, 213, 0.48);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          transition: background 240ms ${LAB.ease}, color 240ms ${LAB.ease}, box-shadow 240ms ${LAB.ease};
        }
        .${cls}-icon:hover {
          color: rgba(244, 234, 213, 0.95);
          background: rgba(244, 234, 213, 0.04);
          box-shadow: 0 0 12px ${LAB.accentGlow};
        }
      `}</style>
      <div className={`${cls}-shell`}>
        <span className={`${cls}-seg`}>Client — Rachael's Game</span>
        <span className={`${cls}-sep`}>·</span>
        <span className={`${cls}-seg`}>v1-operationalization</span>
        <span className={`${cls}-sep`}>·</span>
        <span className={`${cls}-seg ${cls}-seg--active`}>Overview</span>
        <button className={`${cls}-icon`} title="Move to different project" aria-label="Move to different project">
          <FolderInput size={13} />
        </button>
      </div>
    </>
  );
}

// ── BEFORE — for reference ─────────────────────────────────────────────────────

function OldBreadcrumb() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13 }}>
        <span style={{ color: "rgba(244, 234, 213, 0.55)", cursor: "pointer" }}>Client — Rachael's Game</span>
        <span style={{ color: "rgba(244, 234, 213, 0.28)" }}>/</span>
        <span style={{ color: "rgba(244, 234, 213, 0.55)", cursor: "pointer" }}>v1-operationalization</span>
        <span style={{ color: "rgba(244, 234, 213, 0.28)" }}>/</span>
        <span style={{ color: "rgba(244, 234, 213, 0.42)" }}>…</span>
      </div>
      <button style={{ padding: 4, borderRadius: 4, background: "transparent", border: "none", color: "rgba(244, 234, 213, 0.42)", cursor: "pointer" }} title="Move to different project">
        <FolderInput size={13} />
      </button>
    </div>
  );
}

// ── Scratchpad snippet — reusable card for locked-in CSS chemistry ─────────────

function ScratchSnippet({ name, usage, css }: { name: string; usage: string; css: string }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(0, 0, 0, 0.36)", border: `1px solid ${LAB.creamHair}` }}>
      <div style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11.5, color: LAB.accent, fontWeight: 500, letterSpacing: "0.01em", marginBottom: 6 }}>
        {name}
      </div>
      <div style={{ fontSize: 11, color: LAB.creamDim, lineHeight: 1.55, marginBottom: 10 }}>
        {usage}
      </div>
      <pre style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11, color: LAB.cream, lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" }}>
        {css}
      </pre>
    </div>
  );
}

// ── Stack cell — renders one breadcrumb variant with a shared content template ──

function StackCell({ cls }: { cls: string }) {
  return (
    <div className={cls}>
      <div className="blur-content">
        <span className="blur-seg">Client — Rachael's Game</span>
        <span className="blur-sep">·</span>
        <span className="blur-seg">v1-operationalization</span>
        <span className="blur-sep">·</span>
        <span className="blur-seg blur-seg--active">Overview</span>
      </div>
    </div>
  );
}

// ── Blur variant row — used in the blur-mechanism comparison section ──────────

function BlurVariant({ cls, label, mechanism, css }: { cls: string; label: string; mechanism: string; css: string }) {
  return (
    <div style={{ padding: "36px 40px 40px", borderBottom: `1px solid ${LAB.creamHair}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
      <div>
        <div className={cls}>
          <div className="blur-content">
            <span className="blur-seg">Client — Rachael's Game</span>
            <span className="blur-sep">·</span>
            <span className="blur-seg">v1-operationalization</span>
            <span className="blur-sep">·</span>
            <span className="blur-seg blur-seg--active">Overview</span>
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: LAB.accent, fontWeight: 600, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 12, color: LAB.creamDim, lineHeight: 1.6, marginBottom: 12 }}>{mechanism}</div>
        <pre style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11, color: LAB.cream, lineHeight: 1.55, margin: 0, padding: "10px 14px", borderRadius: 8, background: "rgba(0, 0, 0, 0.32)", border: `1px solid ${LAB.creamHair}`, whiteSpace: "pre-wrap" }}>{css}</pre>
      </div>
    </div>
  );
}

// ── Section + row helpers ──────────────────────────────────────────────────────

function LabSection({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 80 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600, letterSpacing: "0.20em", textTransform: "uppercase", color: LAB.creamMute, marginBottom: 8 }}>
          {label}
        </div>
        {note && (
          <p style={{ fontSize: 13, color: LAB.creamDim, maxWidth: 780, lineHeight: 1.65 }}>{note}</p>
        )}
        <div style={{ height: 1, background: LAB.creamHair, marginTop: 24 }} />
      </div>
      <div>{children}</div>
    </section>
  );
}

function ComparisonRow({
  id, label, note, fill, swatch,
}: { id: string; label: string; note: string; fill: string; swatch: string }) {
  return (
    <div
      style={{
        padding: "36px 40px 40px",
        borderBottom: `1px solid ${LAB.creamHair}`,
        display: "grid",
        gridTemplateColumns: "180px 1fr 1fr",
        gap: 32,
        alignItems: "center",
      }}
    >
      {/* Label + swatch */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: swatch, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />
          <div style={{ fontSize: 20, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 500, letterSpacing: "-0.01em", color: LAB.cream }}>
            {id}
          </div>
        </div>
        <div style={{ fontSize: 12, color: LAB.cream, fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 11, color: LAB.creamDim, lineHeight: 1.55, marginBottom: 6 }}>{note}</div>
        <div style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 10, color: LAB.creamMute, letterSpacing: "0.02em" }}>{fill}</div>
      </div>

      {/* Breadcrumb variant */}
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <Breadcrumb fill={fill} id={id} />
      </div>

      {/* Input bar — the calibration reference; renders identically per row */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          className="nc-input w-full px-3 py-2 rounded-lg text-sm outline-none"
          placeholder="Click me — this is what you love"
          style={{ maxWidth: 320, fontSize: 13 }}
          autoFocus={id === "A"}
        />
        <p style={{ fontSize: 10, color: LAB.creamMute, letterSpacing: "0.02em", maxWidth: 320 }}>
          nc-input reference (unchanged, from theme.css:566). Click for the focus bloom.
        </p>
      </div>
    </div>
  );
}

// ── The lab page ───────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
//  COLOR INVENTORY — visual swatches with hex/rgba for every color we reference
//  ─────────────────────────────────────────────────────────────────────────────
//  Groups: text tiers · substrate · brand accent · structural · semantic ·
//  session-specific chemistry. Pulled directly from App.tsx NC token block
//  (source of truth) + the specific rgba() values used in locked chemistry.
//  When any hex/rgba is dropped in conversation, this section shows what it is.
// ═══════════════════════════════════════════════════════════════════════════════

function ColorInventory() {
  const groups: Array<{ name: string; note: string; items: Array<{ name: string; hex: string; role: string }> }> = [
    {
      name: "TEXT TIERS",
      note: "Cream family — hierarchy expressed through opacity",
      items: [
        { name: "cream", hex: "#F4EAD5", role: "T1 primary text (full)" },
        { name: "cream @ 0.98", hex: "rgba(244,234,213,0.98)", role: "T1 button label / active tab" },
        { name: "cream @ 0.72", hex: "rgba(244,234,213,0.72)", role: "T2 button label at rest" },
        { name: "cream @ 0.62", hex: "rgba(244,234,213,0.62)", role: "T3 button / non-active tab" },
        { name: "textMuted", hex: "#9089A0", role: "meaningful support text" },
        { name: "textDim", hex: "#6E677E", role: "chrome / section labels" },
        { name: "textFaint", hex: "#55506A", role: "placeholder / disabled" },
      ],
    },
    {
      name: "SUBSTRATE / SURFACES",
      note: "The ground everything sits on",
      items: [
        { name: "chrome", hex: "#12121E", role: "sidebar / structural chrome" },
        { name: "ground", hex: "#1C1B28", role: "primary work canvas (--bg)" },
        { name: "elevated", hex: "#221E33", role: "cards, task groups" },
        { name: "elevated2", hex: "#2A2540", role: "popovers / hover surfaces" },
      ],
    },
    {
      name: "BRAND ACCENT",
      note: "Purple is the offender · Light Blue is the direction (this session)",
      items: [
        { name: "NC.accent (purple)", hex: "#6D5AD1", role: "current app — the offender" },
        { name: "Light Blue", hex: "#6E78B0", role: "proposed accent (buttons, focus)" },
        { name: "accentHover", hex: "#7E6DE5", role: "brighter purple hover (current)" },
        { name: "accentTint", hex: "rgba(109,90,209,0.10)", role: "faint purple wash" },
      ],
    },
    {
      name: "STRUCTURAL / COOL",
      note: "Cool-family for structure + engaged states",
      items: [
        { name: "slateViolet", hex: "#4E4C82", role: "structural cool accent" },
        { name: "DSV darkened", hex: "rgba(30,28,52,0.75)", role: "active tab pill fill (session)" },
        { name: "desaturatedViolet", hex: "#8879A0", role: "atmospheric / engineer" },
      ],
    },
    {
      name: "SEMANTIC",
      note: "Meaning-carrying — status, priority, state",
      items: [
        { name: "seaGreen", hex: "#5B7D73", role: "done / positive" },
        { name: "sage", hex: "#7A9E93", role: "brand app-icon teal" },
        { name: "peachGold", hex: "#E8B87A", role: "high priority / in-progress" },
        { name: "deepMaroon", hex: "#C25B62", role: "urgent / blocked / destructive" },
        { name: "lightIndigo", hex: "#8E96CC", role: "medium priority" },
        { name: "stone", hex: "#8F8A80", role: "low priority / muted labels" },
      ],
    },
    {
      name: "SESSION CHEMISTRY (locked components)",
      note: "The specific rgba values used in locked breadcrumb + button ladder",
      items: [
        { name: "Breadcrumb fill", hex: "rgba(42,44,52,0.60)", role: "atmospheric slate — ::before base" },
        { name: "Edge feather (outer)", hex: "rgba(130,130,145,0.205)", role: "mid-gray outer glow" },
        { name: "Edge feather (inset)", hex: "rgba(130,130,145,0.144)", role: "mid-gray inset feather" },
        { name: "T1 char top-left", hex: "rgba(168,178,240,0.18)", role: "light-indigo character (nc-input DNA)" },
        { name: "T1 char bottom-right", hex: "rgba(91,125,115,0.12)", role: "sage-green character (nc-input DNA)" },
      ],
    },
  ];

  return (
    <div style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 30 }}>
      {groups.map(g => (
        <div key={g.name}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.18em", fontWeight: 600, color: LAB.cream, textTransform: "uppercase" }}>{g.name}</div>
            <div style={{ fontSize: 11, color: LAB.creamMute, marginTop: 3 }}>{g.note}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10 }}>
            {g.items.map(it => (
              <div key={it.name} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", borderRadius: 8, background: "rgba(0,0,0,0.20)", border: `1px solid ${LAB.creamHair}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: it.hex, border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: LAB.cream, fontWeight: 500, lineHeight: 1.2 }}>{it.name}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 9.5, color: LAB.creamDim, wordBreak: "break-all", lineHeight: 1.3 }}>{it.hex}</div>
                  <div style={{ fontSize: 10.5, color: LAB.creamMute, lineHeight: 1.4, marginTop: 2 }}>{it.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB BAR MOCK — v4 (proper pill, 2026-07-29)
//  ─────────────────────────────────────────────────────────────────────────────
//  v3 label+underline SCRAPPED — that pattern is on Daniel's hate list from Turn 1.
//  Regressing to it after v1/v2 pill failures was misreading the failure signal.
//  Failure of v1/v2 was NOT "pill is wrong" — it was "my pill chemistry was wrong"
//  (imported breadcrumb DNA to a wide surface = soft-on-soft, nothing to pop).
//
//  Correct pill chemistry: CRISP glass container + CRISP darker active pill inside.
//  Container: nc-glass-menu DNA (semi-opaque neutral fill, backdrop-filter, hairline
//  border, subtle drop shadow — but NO inset top-highlight, that's banned per
//  brand-ui SKILL.md Edge chemistry section).
//  Active pill: solid darker fill, crisp edge matching container radius, symmetric
//  inset shadow for pressed-in cue. Darkening works BECAUSE container is visibly
//  lifted — darkening reads as "pressed into it."
//
//  Framework classification: Bounded entity (container) + Bounded accent (active
//  pill). Both crisp. Both defined. No fighting chemistries.
// ═══════════════════════════════════════════════════════════════════════════════

function TabBarMock() {
  const [active, setActive] = useState("TASKS");
  const tabs = ["INFO", "TASKS", "CYCLES", "TEAM"];

  return (
    <>
      <style>{`
        /* ─── Container: crisp glass, hairline edge, drop shadow. ─── */
        .pill-tab-bar {
          display: inline-flex;
          gap: 2px;
          padding: 5px;
          border-radius: 999px;
          background: rgba(28, 26, 42, 0.55);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
        }

        /* ─── Tab item (non-active): transparent, tier-3 chrome text. ─── */
        .pill-tab-item {
          padding: 9px 20px;
          border-radius: 999px;
          background: transparent;
          color: rgba(244, 234, 213, 0.62);
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: color 180ms ${LAB.ease}, background 180ms ${LAB.ease};
        }
        .pill-tab-item:hover:not(.pill-tab-item--active) {
          color: rgba(244, 234, 213, 0.92);
          background: rgba(255, 255, 255, 0.04);
        }

        /* ─── Active tab: CRISP darker pill, solid fill, pressed-in cue. ─── */
        .pill-tab-item--active {
          background: rgba(14, 12, 22, 0.88);   /* visibly darker than container */
          color: rgba(244, 234, 213, 0.98);
          /* Symmetric inset shadow — pressed-in cue, no directional bias.
             Container is visibly lifted, so darkening reads correctly. */
          box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.24);
          cursor: default;
        }
      `}</style>

      <div className="pill-tab-bar">
        {tabs.map(t => (
          <button
            key={t}
            className={`pill-tab-item ${t === active ? "pill-tab-item--active" : ""}`}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  );
}

export default function DesignLab() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(1400px 900px at 5% -10%, rgba(168, 150, 240, 0.10), transparent 60%),
          radial-gradient(1000px 700px at 100% 100%, rgba(91, 125, 115, 0.08), transparent 55%),
          ${LAB.bg}
        `,
        color: LAB.cream,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      <header style={{ padding: "48px 80px 32px", borderBottom: `1px solid ${LAB.creamHair}` }}>
        <div style={{ fontSize: 10, color: LAB.creamMute, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
          Caelos · Design Lab · Iter 5 · Side by Side
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 8 }}>Slate variants + input bar</h1>
        <p style={{ fontSize: 14, color: LAB.creamDim, maxWidth: 780, lineHeight: 1.65 }}>
          Each row shows a slate variant of the breadcrumb WITH the nc-input focus reference right next to it. Point at the input, tell me what needs to match. Edges are now symmetric — dropped the inset top-highlight, replaced with a uniform 1px hairline border + soft outer halo (blurred-edges chemistry, matches the input bar's edge treatment).
        </p>
      </header>

      <main style={{ padding: "64px 0 120px", maxWidth: 1360, margin: "0 auto" }}>

        {/* ═════════════════════════════════════════════════════════════════════
            SCRATCHPAD — always visible on the lab. Copy-paste-ready.
            The locked-in chemistry so we never drift. Never rebuild from scratch.
            ═════════════════════════════════════════════════════════════════════ */}
        <section style={{ margin: "0 40px 88px", padding: "28px 32px", borderRadius: 14, background: "rgba(0, 0, 0, 0.28)", border: `1px solid ${LAB.creamHair}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: LAB.accent }}>Scratchpad</span>
            <div style={{ height: 1, flex: 1, background: LAB.creamHair }} />
            <span style={{ fontSize: 10, color: LAB.creamMute, letterSpacing: "0.14em", textTransform: "uppercase" }}>Locked · reference values</span>
          </div>
          <p style={{ fontSize: 12, color: LAB.creamDim, lineHeight: 1.6, marginBottom: 22, maxWidth: 720 }}>
            The chemistry that worked. Named by function. If I ever try to reinvent an outer glow from scratch, look here first.
          </p>

          {/* Framework — the 2×2 matrix */}
          <div style={{ padding: "18px 20px", marginBottom: 22, borderRadius: 10, background: "rgba(110, 120, 176, 0.06)", border: `1px solid rgba(110, 120, 176, 0.14)` }}>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: LAB.accent, fontWeight: 600, marginBottom: 10 }}>
              Framework · the 2×2 matrix
            </div>
            <div style={{ fontSize: 12, color: LAB.creamDim, lineHeight: 1.65, marginBottom: 16, padding: "10px 14px", borderRadius: 6, background: "rgba(0, 0, 0, 0.24)" }}>
              <strong style={{ color: LAB.cream, fontWeight: 500 }}>Rule:</strong> Accents stack on entities. Accents never exist alone. Entities stand alone. Never mix the two chemistries into one element — that's the failure pattern.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 12, fontSize: 12, color: LAB.creamDim, lineHeight: 1.55 }}>
              {/* Header row */}
              <div />
              <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: LAB.cream, fontWeight: 600, textAlign: "center", padding: "8px 4px", borderBottom: `1px solid ${LAB.creamHair}` }}>Entity · <span style={{ color: LAB.creamDim, fontWeight: 400 }}>the thing</span></div>
              <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: LAB.cream, fontWeight: 600, textAlign: "center", padding: "8px 4px", borderBottom: `1px solid ${LAB.creamHair}` }}>Accent · <span style={{ color: LAB.creamDim, fontWeight: 400 }}>signal about the thing</span></div>

              {/* Bounded row */}
              <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: LAB.cream, fontWeight: 600, alignSelf: "center", writingMode: "horizontal-tb" }}>Bounded</div>
              <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255, 255, 255, 0.02)", borderTop: `1px solid ${LAB.creamHair}` }}>
                <div style={{ color: LAB.cream, fontWeight: 500, fontSize: 12, marginBottom: 6 }}>Bounded entity</div>
                <div style={{ marginBottom: 8 }}>Hairline border + subtle transparent fill + backdrop-filter + <code style={{ fontSize: 11, color: LAB.cream }}>--nc-shadow-lift</code></div>
                <div style={{ fontSize: 11, color: LAB.creamMute, letterSpacing: "0.01em" }}>Buttons · input bar · card container · modal shell · ⌘K palette · folder button</div>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255, 255, 255, 0.02)", borderTop: `1px solid ${LAB.creamHair}` }}>
                <div style={{ color: LAB.cream, fontWeight: 500, fontSize: 12, marginBottom: 6 }}>Bounded accent</div>
                <div style={{ marginBottom: 8 }}>Small finite fill in accent hue at low alpha, optional matching hairline — stacks INSIDE or ON a bounded entity</div>
                <div style={{ fontSize: 11, color: LAB.creamMute, letterSpacing: "0.01em" }}>Status pills · state dots · badge chips · notification counts · category tags · active-tab underline · glass-menu row-hover tint</div>
              </div>

              {/* Unbounded row */}
              <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: LAB.cream, fontWeight: 600, alignSelf: "center" }}>Unbounded</div>
              <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255, 255, 255, 0.02)", borderTop: `1px solid ${LAB.creamHair}` }}>
                <div style={{ color: LAB.cream, fontWeight: 500, fontSize: 12, marginBottom: 6 }}>Unbounded entity</div>
                <div style={{ marginBottom: 8 }}>NO border + very transparent fill + optional lighter backdrop-filter + neutral outer glow substitutes for edge</div>
                <div style={{ fontSize: 11, color: LAB.creamMute, letterSpacing: "0.01em" }}>Breadcrumb · section headers ("MODULE") · inline text labels · the atmospheric ground</div>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255, 255, 255, 0.02)", borderTop: `1px solid ${LAB.creamHair}` }}>
                <div style={{ color: LAB.cream, fontWeight: 500, fontSize: 12, marginBottom: 6 }}>Unbounded accent</div>
                <div style={{ marginBottom: 8 }}>NO border + NO fill + pure <code style={{ fontSize: 11, color: LAB.cream }}>box-shadow</code> at low alpha + <code style={{ fontSize: 11, color: LAB.cream }}>--nc-easing-buttery</code> for state changes</div>
                <div style={{ fontSize: 11, color: LAB.creamMute, letterSpacing: "0.01em" }}>Focus bloom (nc-input) · hover halo on buttons · always-on whisper halo on cards · toast fade-in · loading skeleton shimmer</div>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 6, background: "rgba(0, 0, 0, 0.18)", fontSize: 11, color: LAB.creamMute, lineHeight: 1.6 }}>
              <strong style={{ color: LAB.creamDim, fontWeight: 500 }}>Design flow for any element:</strong> (1) Which entity is this? Bounded or unbounded? (2) Does it need any accents? (3) For each accent — bounded or unbounded? (4) Apply the recipe for each cell. Done.
            </div>

            {/* ─── Textbook case callout ─── */}
            <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: 10, background: "rgba(110, 120, 176, 0.10)", border: `1px solid rgba(110, 120, 176, 0.24)` }}>
              <div style={{ fontSize: 10, letterSpacing: "0.20em", textTransform: "uppercase", color: LAB.accent, fontWeight: 700, marginBottom: 10 }}>
                📍 Textbook case · unbounded entity · no accent
              </div>
              <div style={{ fontSize: 12, color: LAB.creamDim, lineHeight: 1.7 }}>
                The <strong style={{ color: LAB.cream }}>Locked Breadcrumb</strong> (visit <code style={{ color: LAB.cream }}>/?locked=1</code>) is the canonical implementation.
                <br /><br />
                <strong style={{ color: LAB.cream }}>What "unbounded-no-accent" means:</strong>
                <ul style={{ paddingLeft: 20, margin: "8px 0", lineHeight: 1.7 }}>
                  <li><strong style={{ color: LAB.cream }}>Category:</strong> a sign. Not an action, not an accent. Just presence.</li>
                  <li><strong style={{ color: LAB.cream }}>Why no accent:</strong> a breadcrumb announces WHERE you are — the last segment being "current" is communicated by POSITION in the chain, not by a highlighted box. Adding an accent turns the sign into a stateful component. Signs aren't stateful.</li>
                  <li><strong style={{ color: LAB.cream }}>Chemistry:</strong> <code style={{ color: LAB.cream }}>::before</code> pseudo carries fill + box-shadow · <code style={{ color: LAB.cream }}>filter: blur(6px)</code> softens both together · mid-gray glow (halfway between white and atmospheric indigo — neither lifts nor sinks the element).</li>
                  <li><strong style={{ color: LAB.cream }}>Generalizes to:</strong> section headers, wayfinding labels, location markers, any element that IS a sign. Never for buttons, inputs, tabs, or interactive things.</li>
                </ul>
                <strong style={{ color: LAB.cream }}>When I forget:</strong> read this. Do not add a "current segment" highlight to a breadcrumb — that turns the sign into a component with state, and the sign is stateless by design.
              </div>
            </div>
          </div>

          {/* Glow chemistry snippets */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <ScratchSnippet
              name="--nc-glow-whisper-halo"
              usage="Always-on unbound accent on a BOUND container (breadcrumb, card, panel)."
              css={`box-shadow: 0 0 20px rgba(110, 120, 176, 0.08);\n/* Light Blue #6E78B0 at 8% alpha — whisper. */`}
            />
            <ScratchSnippet
              name="--nc-glow-hover-bloom"
              usage="On-hover UNBOUND bloom around an interactive icon or button."
              css={`box-shadow: 0 0 12px rgba(110, 120, 176, 0.28);\n/* Light Blue #6E78B0 at 28% alpha — lantern. */`}
            />
            <ScratchSnippet
              name="--nc-glow-focus-bloom"
              usage="On-focus UNBOUND diffuse glow — the nc-input chef's-kiss. Uses focus-purple (not accent) for the softer hue."
              css={`box-shadow: 0 0 10px rgba(168, 150, 240, 0.28);\n/* Focus-purple #A896F0 at 28% alpha. */`}
            />
            <ScratchSnippet
              name="--nc-shadow-lift"
              usage="BOUND depth. Not a glow — a drop shadow for elevation. Uniform vertical bias. Every raised bound surface."
              css={`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.42);\n/* Pure black at 42%, 8px vertical offset. */`}
            />
            <ScratchSnippet
              name="--nc-border-bound-hairline"
              usage="BOUND container border. Uniform, low-alpha, no hue — the border defines the boundary without adding chrome. Hue lives in the unbound accent, never in the border."
              css={`border: 1px solid rgba(255, 255, 255, 0.06);\n/* Neutral white at 6% — matches nc-input rest border. */`}
            />
            <ScratchSnippet
              name="--nc-easing-buttery"
              usage="Every transition on a bound→unbound state change (hover, focus, active). No exceptions."
              css={`transition: all 240ms cubic-bezier(0.16, 1, 0.3, 1);\n/* Deceleration curve — buttery, no snap. */`}
            />
          </div>

          {/* Compose example */}
          <div style={{ marginTop: 22, padding: "16px 18px", borderRadius: 10, background: "rgba(0, 0, 0, 0.32)", border: `1px solid ${LAB.creamHair}` }}>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: LAB.creamMute, fontWeight: 600, marginBottom: 8 }}>
              Compose · a bound container with unbound whisper
            </div>
            <pre style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11.5, color: LAB.creamDim, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{`.container {
  background:       rgba(SLATE, 0.72);            /* bound fill — pick slate */
  backdrop-filter:  blur(18px) saturate(160%);    /* bound frost */
  border:           1px solid rgba(255,255,255,0.06);  /* bound hairline */
  border-radius:    12px;                          /* bound radius */
  box-shadow:
    0 8px 24px rgba(0,0,0,0.42),                   /* --nc-shadow-lift  */
    0 0 20px  rgba(110,120,176,0.08);              /* --nc-glow-whisper-halo (unbound accent) */
  transition: all 240ms cubic-bezier(0.16, 1, 0.3, 1);
}`}</pre>
          </div>
        </section>

        {/* ─── Everything between the scratchpad and the reference input bar was cleared
             2026-07-29 (Daniel directive). The locked breadcrumb + folder button now live
             in the Locked Studio (/?locked=1). Blur mechanism comparisons and blur+glow
             2×2 grid served their purpose — the winning combo is locked. Lab surface
             below stays for continued exploration of unrelated elements. ─── */}

        {/* ── Color inventory · swatches with hex ─────────────────────────────
             Reference panel — pulled directly from src/app/App.tsx:739-773 (NC token
             block, source of truth) + the session-specific chemistry hues we've
             been building on. When I say "#6E78B0" or "cream at 0.72" you can
             point at the swatch and see what I mean. ──────────────────────── */}
        <LabSection
          label="Color inventory · what the hex codes actually look like"
          note="Every color we've been talking about, grouped by role. Rgba values render against LAB.bg so transparency composites correctly (what you see is what you'd see on the ground)."
        >
          <ColorInventory />
        </LabSection>

        {/* ── Input bar reference (rest / focus) at the top ── */}
        <LabSection
          label="Reference · the input bar you love"
          note="Actual .nc-input from theme.css:566. Rest state (top), then focus state visible in each row below. This is the edge chemistry we're matching."
        >
          <div style={{ padding: "0 40px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
            <input
              className="nc-input w-full px-3 py-2 rounded-lg text-sm outline-none"
              placeholder="Rest state — hairline border at rgba(white, ~6%), no inset, no top stripe"
              style={{ fontSize: 14 }}
            />
            <input
              className="nc-input w-full px-3 py-2 rounded-lg text-sm outline-none"
              placeholder="Click me — focus state, dual-hue gradient bloom + 10px outer glow"
              style={{ fontSize: 14 }}
            />
          </div>
        </LabSection>

        {/* ── Tab bar mock — v4, proper pill: crisp glass + crisp darker active ── */}
        <LabSection
          label="Project tabs · v4 (proper pill)"
          note="v3 label+underline scrapped — that was the anti-pattern from Daniel's Turn 1 hate list. Regressing to it after v1/v2 pill failures was misreading the failure signal. Correct diagnosis: v1/v2 chemistry was wrong (breadcrumb DNA on wide surface = soft-on-soft). v4 uses nc-glass-menu DNA on the container (crisp glass + hairline border + drop shadow, NO inset top-highlight per brand-ui ban) and a crisp darker fill inside for the active pill. Darkening reads as pressed-in because the container is visibly lifted."
        >
          <div style={{ padding: "8px 40px", display: "flex", justifyContent: "center" }}>
            <TabBarMock />
          </div>
          <div style={{ padding: "20px 40px 0", fontSize: 11.5, color: LAB.creamDim, lineHeight: 1.75, maxWidth: 900 }}>
            <strong style={{ color: LAB.cream }}>What to check:</strong> (1) container — does it read as a real defined object (not blurry/dissolving)? Hairline border + drop shadow should give it presence without shouting; (2) active pill — is the darkness delta right? Container fill is rgba(28,26,42,0.55); active fill is rgba(14,12,22,0.88). Active should read as "pressed into" the container, not "hole"; (3) proportions — pill container padding 5px, tab padding 9px 20px, both fully-rounded (999px). Feels right or wants to be more compact? Dials from here — container fill opacity 0.55 ↔ 0.70 (more solid glass); active fill opacity 0.88 ↔ 0.75 (less depth); inset shadow 0.24 ↔ 0.14 (subtler pressed cue).
          </div>
        </LabSection>

        {/* ─── 3-TIER BUTTON LADDER — LOCKED 2026-07-29. Now lives in Locked Studio
             (?locked=1). Chemistry captured there in full: matte body + glass character
             T1, nc-input rest DNA T2, transparent T3, family-swap destructive. ─── */}

        {/* ── Side-by-side comparison ── */}
        <LabSection
          label="Slate variants · with input bar adjacent"
          note="Each row: slate variant of breadcrumb (left) · nc-input focus reference (right). Direct visual comparison. Point at the input, name what needs to match in the breadcrumb."
        >
          {SLATES.map(s => (
            <ComparisonRow key={s.id} {...s} />
          ))}
        </LabSection>

        {/* ── Edge fix notes ── */}
        <LabSection
          label="Edge chemistry — what changed"
          note="The top-edge-thicker mistake persisted for two iters. Now killed at the root."
        >
          <ul style={{ fontSize: 13, color: LAB.creamDim, lineHeight: 1.85, paddingLeft: 20, maxWidth: 820 }}>
            <li><strong style={{ color: LAB.cream, fontWeight: 500 }}>Dropped:</strong> <code style={{ fontSize: 12, color: LAB.cream }}>inset 0 1px 0 rgba(255,255,255,0.07)</code> — the top-heavy stripe from nc-glass-menu that survives at compact scale but reads as an uneven border at breadcrumb scale.</li>
            <li><strong style={{ color: LAB.cream, fontWeight: 500 }}>Dropped:</strong> <code style={{ fontSize: 12, color: LAB.cream }}>0 0 0 1px rgba(255,255,255,0.02)</code> — the white micro-ring. Also asymmetric-feeling on a wide surface.</li>
            <li><strong style={{ color: LAB.cream, fontWeight: 500 }}>Kept:</strong> <code style={{ fontSize: 12, color: LAB.cream }}>0 8px 24px rgba(0,0,0,0.42)</code> — outer depth shadow. Uniform, symmetric.</li>
            <li><strong style={{ color: LAB.cream, fontWeight: 500 }}>Added:</strong> <code style={{ fontSize: 12, color: LAB.cream }}>0 0 20px rgba(110,120,176,0.08)</code> — soft always-on Light Blue halo. The glow IS the edge. Symmetric by definition (0 0 offset).</li>
            <li><strong style={{ color: LAB.cream, fontWeight: 500 }}>Border simplified:</strong> from <code style={{ fontSize: 12, color: LAB.cream }}>rgba(110,120,176,0.22)</code> down to <code style={{ fontSize: 12, color: LAB.cream }}>rgba(255,255,255,0.06)</code> — matches nc-input's rest-state border chemistry exactly. No hue in the border; the halo carries the accent.</li>
          </ul>
        </LabSection>

        <div style={{ padding: "32px 80px 0", borderTop: `1px solid ${LAB.creamHair}`, fontSize: 11, color: LAB.creamMute, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 40 }}>
          Iter 5 · edges symmetric · input bar adjacent · 2026-07-29
        </div>
      </main>
    </div>
  );
}
