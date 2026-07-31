// ═══════════════════════════════════════════════════════════════════════════════
//  LOCKED STUDIO — Caelos component library
// ───────────────────────────────────────────────────────────────────────────────
//  Toggle: append `?locked=1` to the URL. main.tsx swaps App→LockedStudio.
//
//  This is the CANONICAL reference for every component we've locked. As we lock
//  more elements, they get added here. The design lab (?lab=1) is where we
//  explore and iterate; the studio is where the winners live.
//
//  Each element block: (1) rendered instance, (2) a pointer to its canonical
//  primitive stylesheet source, (3) framework classification (which cell in
//  the 2×2 matrix).
//
//  First locked element: the Unbounded Breadcrumb (blur 6px + mid-gray glow).
// ═══════════════════════════════════════════════════════════════════════════════

import { FolderInput } from "lucide-react";
import "../primitives/primitives.css";

const STU = {
  bg:        "#1C1B28",
  cream:     "#F4EAD5",
  creamDim:  "rgba(244, 234, 213, 0.62)",
  creamMute: "rgba(244, 234, 213, 0.42)",
  creamHair: "rgba(244, 234, 213, 0.08)",
  accent:    "#6E78B0",
};

// ── The locked unbounded breadcrumb ────────────────────────────────────────────

function LockedBreadcrumb() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="locked-bc">
          <div className="locked-bc-content">
            <span className="locked-bc-seg">Client — Rachael's Game</span>
            <span className="locked-bc-sep">·</span>
            <span className="locked-bc-seg">v1-operationalization</span>
            <span className="locked-bc-sep">·</span>
            <span className="locked-bc-seg">Overview</span>
          </div>
        </div>
        <button className="locked-folder-btn" title="Move to different project" aria-label="Move to different project">
          <FolderInput size={13} />
        </button>
      </div>
    </>
  );
}

// ── The locked 3-tier button ladder ────────────────────────────────────────────

function LockedButtonLadder() {
  return (
    <>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div className="locked-btn-row">
          <div className="locked-btn-row-label">Standard</div>
          <button className="locked-btn-primary">Save changes</button>
          <button className="locked-btn-secondary">
            <span style={{ fontSize: 14, lineHeight: 1, opacity: 0.7 }}>+</span>
            Add subtask
          </button>
          <button className="locked-btn-secondary">
            <span style={{ fontSize: 14, lineHeight: 1, opacity: 0.7 }}>+</span>
            Add to cycle
          </button>
          <button className="locked-btn-text">Cancel</button>
        </div>
        <div className="locked-btn-row">
          <div className="locked-btn-row-label">Destructive</div>
          <button className="locked-btn-primary locked-btn-primary--danger">Delete permanently</button>
          <button className="locked-btn-secondary locked-btn-secondary--danger">Archive</button>
          <button className="locked-btn-text locked-btn-text--danger">Dismiss</button>
        </div>
      </div>
    </>
  );
}

// ── Locked element card — rendered + CSS + classification + notes ──────────────

function LockedCard({
  title,
  category,
  notes,
  css,
  children,
}: {
  title: string;
  category: string;
  notes: string;
  css: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 88 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 10 }}>
        <h2 style={{ fontSize: 22, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 500, letterSpacing: "-0.01em", color: STU.cream, margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: STU.accent, fontWeight: 600 }}>{category}</span>
      </div>
      <p style={{ fontSize: 13, color: STU.creamDim, lineHeight: 1.65, maxWidth: 780, marginBottom: 28 }}>{notes}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
        {/* Rendered instance */}
        <div style={{ padding: "56px 32px", borderRadius: 12, background: "rgba(0, 0, 0, 0.14)", border: `1px solid ${STU.creamHair}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {children}
        </div>
        {/* Canonical stylesheet pointer */}
        <pre style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11.5, color: STU.creamDim, lineHeight: 1.65, margin: 0, padding: "20px 22px", borderRadius: 12, background: "rgba(0, 0, 0, 0.32)", border: `1px solid ${STU.creamHair}`, whiteSpace: "pre-wrap", overflow: "auto" }}>{css}</pre>
      </div>
    </section>
  );
}

// ── The studio page ───────────────────────────────────────────────────────────

export default function LockedStudio() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(1400px 900px at 5% -10%, rgba(168, 150, 240, 0.10), transparent 60%),
          radial-gradient(1000px 700px at 100% 100%, rgba(91, 125, 115, 0.08), transparent 55%),
          ${STU.bg}
        `,
        color: STU.cream,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      <header style={{ padding: "48px 80px 32px", borderBottom: `1px solid ${STU.creamHair}` }}>
        <div style={{ fontSize: 10, color: STU.creamMute, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
          Caelos · Locked Studio · Canonical Components
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 8 }}>Locked elements</h1>
        <p style={{ fontSize: 14, color: STU.creamDim, maxWidth: 780, lineHeight: 1.65 }}>
          The components we've committed to. Each block renders the canonical element, points to its shared stylesheet source, and notes which cell of the matrix it occupies. As we lock more, they land here.
        </p>
      </header>

      <main style={{ padding: "72px 80px 120px", maxWidth: 1240, margin: "0 auto" }}>

        {/* ── Framework reminder ── */}
        <section style={{ marginBottom: 72, padding: "20px 24px", borderRadius: 12, background: "rgba(110, 120, 176, 0.06)", border: `1px solid rgba(110, 120, 176, 0.14)` }}>
          <div style={{ fontSize: 10, letterSpacing: "0.20em", textTransform: "uppercase", color: STU.accent, fontWeight: 700, marginBottom: 10 }}>Framework · 2×2 matrix</div>
          <div style={{ fontSize: 13, color: STU.creamDim, lineHeight: 1.7, maxWidth: 780 }}>
            Every element is one of four: <strong style={{ color: STU.cream }}>bounded entity</strong> (buttons, input bar, cards), <strong style={{ color: STU.cream }}>bounded accent</strong> (status pills, badges, dots), <strong style={{ color: STU.cream }}>unbounded entity</strong> (breadcrumb, section labels, atmospheric ground), <strong style={{ color: STU.cream }}>unbounded accent</strong> (focus bloom, hover halo, toast shimmer). <em>Accents stack on entities. Entities stand alone. Never mix chemistries.</em>
          </div>
        </section>

        {/* ═══ LOCKED: Unbounded Breadcrumb + Bounded Folder Button ═══ */}
        <LockedCard
          title="Unbounded Breadcrumb"
          category="📍 TEXTBOOK · Unbounded Entity · no accent"
          notes="THE canonical unbounded-entity, no-accent implementation. Study this — it's the reference case. What that classification MEANS: (1) It's a sign, not an action, not an accent. Just presence, announcing WHERE you are. (2) The edge dissolves into the ground rather than announcing against it — via a real gaussian blur on a pseudo carrying the fill + a mid-gray box-shadow feather, no border. (3) NO active-segment highlight — all segments equal visual weight. Position in the chain tells you which is current, not styling. Adding an accent would turn the sign into a stateful component; signs are stateless by design. Generalizes to: section headers, wayfinding labels, location markers, anything that IS a sign. Never for buttons, inputs, tabs, or interactive elements. When in doubt, come back and read this."
          css="Canonical implementation: src/primitives/primitives.css"
        >
          <LockedBreadcrumb />
        </LockedCard>

        {/* ═══ LOCKED: 3-Tier Button Ladder (T1 / T2 / T3) — standard + destructive ═══ */}
        <LockedCard
          title="3-Tier Button Ladder"
          category="🔘 SYSTEM · Bounded Entity (all tiers) · standard + destructive"
          notes={
            "The canonical Caelos button system. Three tiers of loudness, expressed through a single monotonically-rising accent-volume ladder. T1 Primary — accent IS the entity (matte body + subtle glass character). T2 Secondary — nc-input rest DNA, accent surfaces only on hover (same chemistry as the locked folder button above). T3 Text — transparent, no chrome, neutral hover fill (NOT accent-tinted at rest — accent-tinted text is reserved for real inline links). " +
            "Why 3 and not 4: the T2-vs-T3 'is this tonal or outlined' split creates decision fatigue at Caelos scope. Verified against the Linear reference doc — Linear's own controls sit on neutral #28282c bg with brand indigo appearing only in the T1 fill / focus rings / links. This ladder is Linear-faithful. " +
            "Accent volume ladder: T3 = none at rest, T2 = hover-only bloom, T1 = is-the-entity. Restraint by structure. " +
            "T1 chemistry — compound of brand-ui's 'matte primary CTA' rule (SKILL.md L140-143) and nc-input focus DNA. Three background layers: (1) 135° dual-hue character gradient at whisper intensity — light-indigo → sage-green, exactly nc-input focus DNA at ~40% strength; (2) flat 8% black matte overlay across the whole face (no edge bias); (3) accent at 90% opacity + backdrop-filter blur(10px) saturate(140%) so real bg shows through 10% and gives glass character. Border 8% white (slight lift over neutral 6%). Whisper outer glow at rest (14%), triples on hover per Daniel — subtle at rest is non-negotiable, hover can be louder. " +
            "T2 chemistry — same as locked folder button. 135° subtle overlay gradient (2% white), 6% white hairline, cream-dim text 0.72. Hover: text brightens to 0.98, border to 10%, outer Light Blue glow blooms in at 28%. Zero accent at rest across all the `+` buttons in a drawer. " +
            "T3 chemistry — transparent, cream-dim text 0.62, transparent border. Hover: neutral 4% white wash + text to 0.94. No accent-tinted text — dismissing something doesn't earn accent. " +
            "Destructive orthogonality — same tier chemistry, hue-family swap. Standard uses cool-family character (light-indigo → sage-green); destructive uses warm-family (peach → deep-maroon). This is a controlled break from strict 'hue swap only' — the family-swap keeps character harmonic on each base. If you're adding new destructive tiers later, follow this pattern; don't stack cool character on warm base or vice-versa. " +
            "Use cases: T1 = commit actions only, ONE per surface (Save changes, Create, Confirm; destructive: Delete permanently). T2 = frequent CTAs (+ Add subtask, + Add to cycle, Add task; destructive: Archive, Remove). T3 = escape hatches (Cancel, Close, dismiss; destructive: Dismiss a destructive confirm). " +
            "Never mix ladders across surfaces — a drawer with two T1s is a design mistake, not two commit actions. When in doubt on tier assignment, prefer LOWER emphasis. The current app over-uses T1; the migration direction is toward fewer filled buttons, not more."
          }
          css="Canonical implementation: src/primitives/primitives.css"
        >
          <LockedButtonLadder />
        </LockedCard>

        {/* ── Placeholder for future locks ── */}
        <section style={{ padding: "36px 32px", borderRadius: 12, border: `1px dashed ${STU.creamHair}`, textAlign: "center", color: STU.creamMute, fontSize: 12, letterSpacing: "0.02em" }}>
          Future locked elements land here as we commit them. Next up (Daniel-selected): project tabs. Also in queue: status pill (bounded accent), input focus bloom (unbounded accent stacked on nc-input).
        </section>

        <div style={{ padding: "32px 0 0", borderTop: `1px solid ${STU.creamHair}`, fontSize: 11, color: STU.creamMute, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 80 }}>
          Locked Studio · 2 elements · 2026-07-29
        </div>
      </main>
    </div>
  );
}
