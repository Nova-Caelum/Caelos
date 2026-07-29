// ═══════════════════════════════════════════════════════════════════════════════
//  DESIGN LAB — Caelos component sandbox
// ───────────────────────────────────────────────────────────────────────────────
//  Toggle: append `?lab=1` to the URL. main.tsx swaps App→DesignLab on that flag.
//  No app state, no data fetches, no MCP calls. Pure component gallery for iteration.
//
//  Two universal directives from Daniel (2026-07-28):
//    A. LESS BOXY. Structure via whitespace + soft depth, not rectangles-around-things.
//       Radius up, borders demoted, separators earned. Live in the space.
//    B. 4-TOKEN BUTTON LADDER. Linear-inspired visual-weight scale (semantics stay
//       orthogonal). One primary per surface; the other three carry decreasing chrome.
//
//  Placeholder primary color: #5B7D73 (Sea Green, NC-legit). Real palette lands
//  from the parallel color instance — do not fight it here.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Plus, ChevronDown, ArrowRight, X } from "lucide-react";

// ── Design tokens for the lab (mirror final semantics; not the app's live tokens) ──

const LAB = {
  // Neutrals (existing NC dark palette)
  bg:        "#1C1B28",  // page ground
  bgLift:    "#221E33",  // one step up, used for hover fills — NOT card borders
  cream:     "#F4EAD5",  // primary text
  creamDim:  "rgba(244,234,213,0.65)",
  creamMute: "rgba(244,234,213,0.42)",
  creamHair: "rgba(244,234,213,0.08)",  // hairline rules
  creamGhost:"rgba(244,234,213,0.04)",  // whisper backdrop for ghost/hover
  // Primary placeholder (Sea Green — color instance owns final)
  primary:      "#5B7D73",
  primaryHover: "#6A8D82",
  primaryPress: "#4E6E64",
  // States
  danger:    "#C25B62",
  warn:      "#E8B87A",
};

// ── The 4-token button ladder ──────────────────────────────────────────────────

type BtnWeight = "primary" | "secondary" | "ghost" | "tertiary";
type BtnSize   = "sm" | "md" | "lg";

function LabButton({
  weight = "primary",
  size = "md",
  loading = false,
  disabled = false,
  danger = false,
  children,
  onClick,
}: {
  weight?: BtnWeight;
  size?: BtnSize;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  // Size axis — height, horizontal padding, font-size, icon-gap
  const sizeCfg = {
    sm: { h: 26, px: 10, fs: 12, gap: 6, r: 6 },
    md: { h: 32, px: 14, fs: 13, gap: 8, r: 8 },
    lg: { h: 40, px: 18, fs: 14, gap: 10, r: 10 },
  }[size];

  // Weight axis — background, text, border, hover
  const brandColor = danger ? LAB.danger : LAB.primary;

  const weightStyle: React.CSSProperties = (() => {
    if (weight === "primary") {
      return {
        background: brandColor,
        color: LAB.cream,
        border: "1px solid rgba(0,0,0,0.16)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
      };
    }
    if (weight === "secondary") {
      return {
        background: LAB.creamGhost,
        color: LAB.cream,
        border: "1px solid transparent",
      };
    }
    if (weight === "ghost") {
      return {
        background: "transparent",
        color: LAB.creamDim,
        border: "1px solid transparent",
      };
    }
    // tertiary
    return {
      background: "transparent",
      color: LAB.creamMute,
      border: "1px solid transparent",
      padding: `0 ${sizeCfg.px / 2}px`, // less horizontal chrome
    };
  })();

  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  const hoverOverlay = (() => {
    if (disabled) return {};
    if (!hover) return {};
    if (weight === "primary") {
      return {
        background: danger ? "#D06B72" : LAB.primaryHover,
        boxShadow: "0 2px 6px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)",
      };
    }
    if (weight === "secondary") {
      return { background: "rgba(244,234,213,0.08)" };
    }
    if (weight === "ghost") {
      return { background: LAB.creamGhost, color: LAB.cream };
    }
    // tertiary — no bg, only color lift + underline
    return { color: LAB.cream, textDecoration: "underline", textDecorationColor: LAB.creamHair, textUnderlineOffset: 3 };
  })();

  const pressStyle = pressed && !disabled ? { transform: "translateY(1px)" } : {};

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        height: sizeCfg.h,
        padding: `0 ${sizeCfg.px}px`,
        fontSize: sizeCfg.fs,
        fontWeight: 500,
        borderRadius: sizeCfg.r,
        display: "inline-flex",
        alignItems: "center",
        gap: sizeCfg.gap,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        letterSpacing: "-0.005em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 100ms ease",
        outline: "none",
        ...weightStyle,
        ...hoverOverlay,
        ...pressStyle,
      }}
      onFocus={e => {
        e.currentTarget.style.boxShadow =
          weight === "primary"
            ? `0 1px 2px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 2px ${LAB.bg}, 0 0 0 3px ${LAB.creamHair}`
            : `0 0 0 2px ${LAB.bg}, 0 0 0 3px ${LAB.creamHair}`;
      }}
      onBlur={e => {
        e.currentTarget.style.boxShadow =
          weight === "primary"
            ? "0 1px 2px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "none";
      }}
    >
      {loading && (
        <span
          style={{
            width: sizeCfg.fs,
            height: sizeCfg.fs,
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "lab-spin 700ms linear infinite",
          }}
        />
      )}
      {children}
    </button>
  );
}

// ── Section helpers ────────────────────────────────────────────────────────────

function LabSection({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 96 }}>
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 10,
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: LAB.creamMute,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        {note && (
          <p style={{ fontSize: 13, color: LAB.creamDim, maxWidth: 640, lineHeight: 1.6 }}>{note}</p>
        )}
        <div style={{ height: 1, background: LAB.creamHair, marginTop: 20 }} />
      </div>
      <div>{children}</div>
    </section>
  );
}

function LabRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 32, alignItems: "center", marginBottom: 20 }}>
      <div style={{ fontSize: 12, color: LAB.creamMute, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{children}</div>
    </div>
  );
}

// ── The lab page ───────────────────────────────────────────────────────────────

export default function DesignLab() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: LAB.bg,
        color: LAB.cream,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      {/* Spin keyframes */}
      <style>{`
        @keyframes lab-spin { to { transform: rotate(360deg); } }
        body { background: ${LAB.bg}; }
      `}</style>

      {/* Header — hairline rule underneath, no top nav card */}
      <header
        style={{
          padding: "48px 80px 32px",
          borderBottom: `1px solid ${LAB.creamHair}`,
        }}
      >
        <div style={{ fontSize: 10, color: LAB.creamMute, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
          Caelos · Design Lab
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 8 }}>Component bones</h1>
        <p style={{ fontSize: 14, color: LAB.creamDim, maxWidth: 640, lineHeight: 1.6 }}>
          Less boxy. Live in the space. 4-token button ladder as the atomic unit — everything else
          builds from here. Primary color is placeholder Sea Green; final palette from the parallel
          color instance.
        </p>
      </header>

      <main style={{ padding: "64px 80px 120px", maxWidth: 1120, margin: "0 auto" }}>

        {/* ── 4-token button ladder ── */}
        <LabSection
          label="Buttons · 4-token weight ladder"
          note="Weight tokens are visual-only. Semantics (danger, disabled) are orthogonal. One primary per surface; the ladder descends by chrome, not by function."
        >
          <LabRow label="Primary">
            <LabButton weight="primary" size="sm">Small</LabButton>
            <LabButton weight="primary" size="md">Medium</LabButton>
            <LabButton weight="primary" size="lg">Large</LabButton>
            <LabButton weight="primary" size="md"><Plus size={14} /> With icon</LabButton>
            <LabButton weight="primary" size="md" loading>Loading</LabButton>
            <LabButton weight="primary" size="md" disabled>Disabled</LabButton>
          </LabRow>

          <LabRow label="Secondary">
            <LabButton weight="secondary" size="sm">Small</LabButton>
            <LabButton weight="secondary" size="md">Medium</LabButton>
            <LabButton weight="secondary" size="lg">Large</LabButton>
            <LabButton weight="secondary" size="md"><ChevronDown size={14} /> With icon</LabButton>
            <LabButton weight="secondary" size="md" disabled>Disabled</LabButton>
          </LabRow>

          <LabRow label="Ghost">
            <LabButton weight="ghost" size="sm">Small</LabButton>
            <LabButton weight="ghost" size="md">Medium</LabButton>
            <LabButton weight="ghost" size="lg">Large</LabButton>
            <LabButton weight="ghost" size="md"><Plus size={14} /> Add</LabButton>
            <LabButton weight="ghost" size="md"><X size={14} /></LabButton>
          </LabRow>

          <LabRow label="Tertiary">
            <LabButton weight="tertiary" size="sm">Cancel</LabButton>
            <LabButton weight="tertiary" size="md">View history</LabButton>
            <LabButton weight="tertiary" size="md">Learn more <ArrowRight size={12} /></LabButton>
          </LabRow>

          <LabRow label="Danger">
            <LabButton weight="primary" size="md" danger>Delete</LabButton>
            <LabButton weight="secondary" size="md" danger>Delete</LabButton>
            <LabButton weight="ghost" size="md" danger>Remove</LabButton>
            <LabButton weight="tertiary" size="md" danger>Discard</LabButton>
          </LabRow>
        </LabSection>

        {/* ── In-context probe — do the buttons live in the space? ── */}
        <LabSection
          label="In context · a Task row without a card"
          note="A row of information — no border, no card frame, no separator above. Structure comes from whitespace + the shift in text weight. The row is a row because we spaced it like one."
        >
          <div style={{ padding: "20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: LAB.warn, // peach-gold for in-progress
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: LAB.cream, marginBottom: 4 }}>
                  Nova Caelum landing site — hero refactor
                </div>
                <div style={{ fontSize: 12, color: LAB.creamMute, letterSpacing: "0.02em" }}>
                  Landing · In Progress · 3 subtasks
                </div>
              </div>
              <LabButton weight="ghost" size="sm">Open</LabButton>
              <LabButton weight="tertiary" size="sm">···</LabButton>
            </div>
          </div>
          <div style={{ padding: "20px 0", opacity: 0.72 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: LAB.primary, // sea green for done
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: LAB.creamDim, textDecoration: "line-through" }}>
                  Delete the teammate role concept
                </div>
                <div style={{ fontSize: 12, color: LAB.creamMute, letterSpacing: "0.02em" }}>
                  Caelos · Done · today
                </div>
              </div>
              <LabButton weight="tertiary" size="sm">Restore</LabButton>
            </div>
          </div>
          <div style={{ padding: "20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: LAB.danger,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: LAB.cream, marginBottom: 4 }}>
                  Olympus1 vault sync — DNS gate
                </div>
                <div style={{ fontSize: 12, color: LAB.creamMute, letterSpacing: "0.02em" }}>
                  Vulcan · Blocked · waiting on Daniel
                </div>
              </div>
              <LabButton weight="ghost" size="sm">Open</LabButton>
              <LabButton weight="tertiary" size="sm">···</LabButton>
            </div>
          </div>
        </LabSection>

        {/* ── Contrast panel — an intentional card, if we need one ── */}
        <LabSection
          label="When a card earns its keep"
          note="A card should be a rare instrument, not a default. Reserved for compositions where enclosure genuinely helps — a compact summary, a callout, a promo. Radius up, border demoted to whisper, generous inner padding."
        >
          <div
            style={{
              maxWidth: 480,
              padding: 28,
              borderRadius: 16,
              background: "linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.006) 60%, transparent 100%), rgba(255,255,255,0.014)",
              border: `1px solid ${LAB.creamHair}`,
            }}
          >
            <div style={{ fontSize: 10, color: LAB.creamMute, letterSpacing: "0.20em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
              Cycle · in progress
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", marginBottom: 6 }}>
              Sprint 42 — Caelos UI Elevation
            </div>
            <p style={{ fontSize: 13, color: LAB.creamDim, lineHeight: 1.6, marginBottom: 20 }}>
              Component bones this week; color revamp next. 12 of 17 elements documented; 1 shipped (role deletion).
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <LabButton weight="primary" size="md">Open sprint</LabButton>
              <LabButton weight="ghost" size="md">View history</LabButton>
            </div>
          </div>
        </LabSection>

        {/* ── Footer note ── */}
        <div style={{ fontSize: 11, color: LAB.creamMute, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 64 }}>
          Iteration 1 · buttons + row + card · placeholder color · 2026-07-28
        </div>
      </main>
    </div>
  );
}
