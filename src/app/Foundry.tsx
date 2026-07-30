import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Clipboard, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { hexToOklch, oklchToHex } from "../design/color";
import { derive } from "../design/derive";
import { deriveShape } from "../design/deriveShape";
import { injectTokens } from "../design/inject";
import { cloneSeed, DEFAULT_SEED, type Seed } from "../design/seed";
import { cloneShapeSeed, DEFAULT_SHAPE_SEED, type ShapeSeed } from "../design/shapeSeed";
import { Row } from "../primitives";
import PrimitiveGallery from "./PrimitiveGallery";

const ROUND_TRIP_HEXES = [
  "#12121E", "#1C1B28", "#221E33", "#2A2540", "#F4EAD5", "#9089A0",
  "#6E677E", "#55506A", "#6D5AD1", "#7A9E93", "#5B7D73", "#E8B87A",
  "#C25B62", "#8E96CC", "#8879A0", "#4E4C82", "#8F8A80",
];

const panel: CSSProperties = {
  position: "fixed",
  zIndex: 2147483000,
  top: 20,
  right: 20,
  width: "min(560px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 40px)",
  overflow: "auto",
  color: "var(--sys-text-primary)",
  background: "color-mix(in srgb, var(--sys-chrome) 94%, transparent)",
  border: "1px solid var(--sys-hair-2)",
  borderRadius: 18,
  boxShadow: "0 28px 90px rgba(0,0,0,.52), 0 10px 32px rgba(0,0,0,.28)",
  backdropFilter: "blur(22px) saturate(1.12)",
  WebkitBackdropFilter: "blur(22px) saturate(1.12)",
  fontFamily: "var(--nc-font-ui, Inter, ui-sans-serif, system-ui)",
};

const section: CSSProperties = {
  padding: "18px 20px",
  borderTop: "1px solid var(--sys-hair-1)",
};

const labelStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  color: "var(--sys-text-secondary)",
  fontSize: 12,
  fontWeight: 620,
  letterSpacing: ".01em",
};

function round(value: number, precision = 4): number {
  return Number(value.toFixed(precision));
}

function hexChannelDistance(a: string, b: string): number {
  const channel = (hex: string, offset: number) => parseInt(hex.slice(offset, offset + 2), 16);
  return Math.max(
    Math.abs(channel(a, 1) - channel(b, 1)),
    Math.abs(channel(a, 3) - channel(b, 3)),
    Math.abs(channel(a, 5) - channel(b, 5)),
  );
}

function seedLiteral(color: Seed, shape: ShapeSeed): string {
  const normalize = (value: unknown): unknown => {
    if (typeof value === "number") return round(value, 5);
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, normalize(child)]));
    }
    return value;
  };
  return [
    `export const DEFAULT_SEED = ${JSON.stringify(normalize(color), null, 2)} satisfies Seed;`,
    `export const DEFAULT_SHAPE_SEED = ${JSON.stringify(normalize(shape), null, 2)} satisfies ShapeSeed;`,
  ].join("\n\n");
}

function cssLiteral(css: Record<string, string>): string {
  return `:root {\n${Object.entries(css).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`;
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={labelStyle}>
        <span>{label}</span>
        <span style={{ color: "var(--sys-text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {value.toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 0)}{unit}
        </span>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(event) => onChange(Number((event.currentTarget as HTMLInputElement).value))}
        style={{ width: "100%", accentColor: "var(--sys-accent)", cursor: "ew-resize" }}
      />
    </label>
  );
}

function MiniButton({ children, onClick, primary = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        minHeight: 34,
        padding: "0 11px",
        borderRadius: 9,
        border: `1px solid ${primary ? "var(--sys-accent-line)" : "var(--sys-hair-2)"}`,
        color: primary ? "var(--sys-accent-on-tint)" : "var(--sys-text-secondary)",
        background: primary ? "var(--sys-accent-tint)" : "rgba(255,255,255,.025)",
        font: "inherit",
        fontSize: 12,
        fontWeight: 650,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function Foundry() {
  const [seeds, setSeeds] = useState<{ color: Seed; shape: ShapeSeed }>(() => ({
    color: cloneSeed(),
    shape: cloneShapeSeed(),
  }));
  const [copied, setCopied] = useState<"seed" | "css" | null>(null);
  const [motionActive, setMotionActive] = useState(false);
  const [view, setView] = useState<"components" | "tune">("components");
  const frame = useRef<number | null>(null);
  const latestCss = useRef<Record<string, string>>({});
  const theme = useMemo(() => derive(seeds.color), [seeds.color]);
  const shapeTheme = useMemo(() => deriveShape(seeds.shape), [seeds.shape]);
  const combinedCss = useMemo(() => ({ ...theme.css, ...shapeTheme.css }), [theme.css, shapeTheme.css]);

  latestCss.current = combinedCss;

  useLayoutEffect(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      injectTokens([latestCss.current], { legacyBridge: true });
      frame.current = null;
    });
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [combinedCss]);

  useLayoutEffect(() => () => {
    injectTokens([derive(DEFAULT_SEED).css, deriveShape(DEFAULT_SHAPE_SEED).css], { legacyBridge: true });
  }, []);

  const updateColor = useCallback((change: (next: Seed) => void) => {
    setSeeds((current) => {
      const color = cloneSeed(current.color);
      change(color);
      return { ...current, color };
    });
  }, []);

  const updateShape = useCallback((change: (next: ShapeSeed) => void) => {
    setSeeds((current) => {
      const shape = cloneShapeSeed(current.shape);
      change(shape);
      return { ...current, shape };
    });
  }, []);

  const copy = useCallback(async (kind: "seed" | "css") => {
    const value = kind === "seed" ? seedLiteral(seeds.color, seeds.shape) : cssLiteral(combinedCss);
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1400);
  }, [combinedCss, seeds.color, seeds.shape]);

  const roundTripMax = useMemo(() => Math.max(...ROUND_TRIP_HEXES.map((hex) => (
    hexChannelDistance(hex, oklchToHex(hexToOklch(hex)))
  ))), []);
  const contrastErrors = Object.entries(seeds.color.textTargets).map(([name, target]) => (
    Math.abs(Math.abs(theme.meta.measuredLc[`--sys-text-${name}`] ?? 0) - target)
  ));
  const maxContrastError = Math.max(...contrastErrors);
  const mathPassed = roundTripMax <= 1 && maxContrastError <= 2;

  return (
    <aside
      data-testid="foundry-panel"
      data-math-status={mathPassed ? "passed" : "failed"}
      data-roundtrip-max={roundTripMax}
      data-contrast-max-error={maxContrastError.toFixed(2)}
      data-clamped-count={theme.meta.clamped.length}
      data-shape-token-count={Object.keys(shapeTheme.css).length}
      data-space-unit={seeds.shape.spaceUnit}
      data-radius-floor={seeds.shape.radius.floor}
      data-foundry-view={view}
      style={panel}
      aria-label="Caelos Foundry"
    >
      <header style={{ padding: "20px 20px 18px", display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--sys-accent-on-tint)" }}>
              <Sparkles size={15} strokeWidth={1.8} />
              <span style={{ fontSize: 10, fontWeight: 760, letterSpacing: ".16em", textTransform: "uppercase" }}>The Foundry</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 21, lineHeight: 1.15, letterSpacing: "-.025em", fontWeight: 680 }}>Derived design system</h1>
            <p style={{ margin: 0, maxWidth: 360, color: "var(--sys-text-tertiary)", fontSize: 12, lineHeight: 1.5 }}>
              {view === "components"
                ? "Exercise the five token-only primitives, then inspect every authored size and state."
                : "Tune authored color and shape seeds. Every component and output specimen follows live."}
            </p>
          </div>
          <div
            title={mathPassed ? "Color math and APCA targets verified" : "Math verification needs attention"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 8px",
              borderRadius: 999,
              color: mathPassed ? "var(--sys-sem-done-on-tint)" : "var(--sys-sem-danger-on-tint)",
              background: mathPassed ? "var(--sys-sem-done-tint)" : "var(--sys-sem-danger-tint)",
              border: `1px solid ${mathPassed ? "var(--sys-sem-done-line)" : "var(--sys-sem-danger-line)"}`,
              fontSize: 10,
              fontWeight: 720,
              whiteSpace: "nowrap",
            }}
          >
            {mathPassed ? <Check size={12} /> : <SlidersHorizontal size={12} />}
            {mathPassed ? "Math verified" : "Check math"}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7 }} aria-label="Surface ladder">
          {["chrome", "ground", "elevated", "elevated-2", "top"].map((name) => (
            <div key={name} style={{ display: "grid", gap: 5 }}>
              <div style={{ height: 28, borderRadius: 7, border: "1px solid var(--sys-hair-1)", background: `var(--sys-${name})` }} />
              <span style={{ overflow: "hidden", color: "var(--sys-text-faint)", fontSize: 8, textOverflow: "ellipsis" }}>{name}</span>
            </div>
          ))}
        </div>
        <Row.Group variant="pill" aria-label="Foundry view">
          <Row variant="tab" selected={view === "components"} onClick={() => setView("components")} leadingIcon={<Sparkles />}>
            Components
          </Row>
          <Row variant="tab" selected={view === "tune"} onClick={() => setView("tune")} leadingIcon={<SlidersHorizontal />}>
            Tune system
          </Row>
        </Row.Group>
      </header>

      {view === "components" ? <PrimitiveGallery /> : <>
      <section style={{ ...section, display: "grid", gap: 15 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--sys-text-tertiary)" />
          <h2 style={{ margin: 0, fontSize: 12, fontWeight: 720, letterSpacing: ".08em", textTransform: "uppercase" }}>Surface field</h2>
        </div>
        <RangeControl label="Ground lightness" value={seeds.color.groundBase.l} min={0.08} max={0.36} step={0.001} onChange={(value) => updateColor((next) => { next.groundBase.l = value; })} />
        <RangeControl label="Hue vector" value={seeds.color.hueVector.h} min={0} max={360} step={1} unit="°" onChange={(value) => updateColor((next) => { next.hueVector.h = value; })} />
        <RangeControl label="Surface chroma" value={seeds.color.hueVector.c} min={0} max={0.08} step={0.001} onChange={(value) => updateColor((next) => { next.hueVector.c = value; })} />
        <RangeControl label="Chroma ramp" value={seeds.color.hueVector.cRamp} min={-0.01} max={0.015} step={0.001} onChange={(value) => updateColor((next) => { next.hueVector.cRamp = value; })} />
        <RangeControl label="Contrast" value={seeds.color.contrast} min={0.55} max={1.65} step={0.01} unit="×" onChange={(value) => updateColor((next) => { next.contrast = value; })} />
      </section>

      <section style={{ ...section, display: "grid", gap: 17 }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 720, letterSpacing: ".08em", textTransform: "uppercase" }}>Accent authorship</h2>
        {(["cool", "hot"] as const).map((name) => (
          <div key={name} style={{ display: "grid", gap: 10, padding: 12, border: "1px solid var(--sys-hair-1)", borderRadius: 12, background: "rgba(255,255,255,.018)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ ...labelStyle, textTransform: "capitalize" }}>{name}</span>
              <span style={{ width: 26, height: 16, borderRadius: 99, background: name === "cool" ? "var(--sys-accent)" : "var(--sys-accent-hot)", border: "1px solid var(--sys-hair-2)" }} />
            </div>
            <RangeControl label="Lightness" value={seeds.color.accents[name].l} min={0.3} max={0.9} step={0.001} onChange={(value) => updateColor((next) => { next.accents[name].l = value; })} />
            <RangeControl label="Chroma" value={seeds.color.accents[name].c} min={0} max={0.32} step={0.001} onChange={(value) => updateColor((next) => { next.accents[name].c = value; })} />
            <RangeControl label="Hue" value={seeds.color.accents[name].h} min={0} max={360} step={1} unit="°" onChange={(value) => updateColor((next) => { next.accents[name].h = value; })} />
          </div>
        ))}
      </section>

      <section style={{ ...section, display: "grid", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 720, letterSpacing: ".08em", textTransform: "uppercase" }}>Text contrast targets</h2>
        {(["primary", "secondary", "tertiary", "faint"] as const).map((name) => (
          <RangeControl
            key={name}
            label={name[0].toUpperCase() + name.slice(1)}
            value={seeds.color.textTargets[name]}
            min={30}
            max={105}
            step={1}
            unit=" Lc"
            onChange={(value) => updateColor((next) => { next.textTargets[name] = value; })}
          />
        ))}
      </section>

      <section style={{ ...section, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SlidersHorizontal size={14} color="var(--sys-text-tertiary)" />
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 720, letterSpacing: ".08em", textTransform: "uppercase" }}>Shape field</h2>
          </div>
          <span style={{ color: "var(--sys-text-faint)", fontSize: 10 }}>{Object.keys(shapeTheme.css).length} tokens</span>
        </div>

        <RangeControl label="Space unit" value={seeds.shape.spaceUnit} min={2} max={8} step={1} unit="px" onChange={(value) => updateShape((next) => { next.spaceUnit = value; })} />
        <RangeControl label="Radius base" value={seeds.shape.radius.base} min={4} max={24} step={1} unit="px" onChange={(value) => updateShape((next) => { next.radius.base = value; })} />
        <RangeControl label="Radius curve" value={seeds.shape.radius.curve} min={1} max={2} step={0.05} unit="×" onChange={(value) => updateShape((next) => { next.radius.curve = value; })} />
        <RangeControl label="Radius floor" value={seeds.shape.radius.floor} min={0} max={14} step={1} unit="px" onChange={(value) => updateShape((next) => { next.radius.floor = value; })} />
        <RangeControl label="Ambient shadow" value={seeds.shape.elevation.ambientAlpha} min={0} max={0.45} step={0.01} onChange={(value) => updateShape((next) => { next.elevation.ambientAlpha = value; })} />
        <RangeControl label="Key shadow" value={seeds.shape.elevation.keyAlpha} min={0} max={0.55} step={0.01} onChange={(value) => updateShape((next) => { next.elevation.keyAlpha = value; })} />
        <RangeControl label="Motion base" value={seeds.shape.motion.baseMs} min={120} max={520} step={10} unit="ms" onChange={(value) => updateShape((next) => { next.motion.baseMs = value; })} />
      </section>

      <section aria-label="Shape specimens" style={{ ...section, display: "grid", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 12, fontWeight: 720, letterSpacing: ".08em", textTransform: "uppercase" }}>Shape specimens</h2>
          <span style={{ color: "var(--sys-text-faint)", fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase" }}>Output only · move dials</span>
        </div>

        <div style={{ display: "grid", gap: 9 }}>
          <span style={labelStyle}>Spacing ruler</span>
          <div data-testid="spacing-ruler" style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", alignItems: "end", gap: 5, height: 54 }}>
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} style={{ display: "grid", placeItems: "end center", gap: 4 }}>
                <div style={{ width: 7, height: `var(--sys-space-${index + 1})`, maxHeight: 42, borderRadius: "var(--sys-radius-full)", background: index > 5 ? "var(--sys-accent)" : "var(--sys-accent-tint)", border: "1px solid var(--sys-accent-line)" }} />
                <span style={{ color: "var(--sys-text-faint)", fontSize: 8 }}>{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 9 }}>
          <span style={labelStyle}>Radius curve</span>
          <div data-testid="radius-specimens" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7 }}>
            {(["sm", "md", "lg", "xl", "full"] as const).map((name) => (
              <div key={name} style={{ display: "grid", gap: 5, textAlign: "center" }}>
                <div style={{ aspectRatio: "1", borderRadius: `var(--sys-radius-${name})`, border: "1px solid var(--sys-border-2)", background: "linear-gradient(145deg, var(--sys-elevated-2), var(--sys-ground))", boxShadow: "var(--sys-elev-1)" }} />
                <span style={{ color: "var(--sys-text-faint)", fontSize: 8 }}>{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 9 }}>
          <span style={labelStyle}>Elevation stack</span>
          <div data-testid="elevation-specimens" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 9 }}>
            {[0, 1, 2, 3].map((level) => (
              <div key={level} style={{ display: "grid", placeItems: "center", minHeight: 44, borderRadius: "var(--sys-radius-md)", color: "var(--sys-text-tertiary)", background: "var(--sys-elevated)", border: "1px solid var(--sys-border-1)", boxShadow: `var(--sys-elev-${level})`, fontSize: 9 }}>
                {level}
              </div>
            ))}
          </div>
        </div>

        <button
          data-testid="motion-specimen"
          type="button"
          onPointerDown={() => setMotionActive(true)}
          onPointerUp={() => setMotionActive(false)}
          onPointerLeave={() => setMotionActive(false)}
          style={{
            width: "100%",
            minHeight: 46,
            borderRadius: "var(--sys-radius-lg)",
            border: "1px solid var(--sys-accent-line)",
            color: "var(--sys-accent-on-tint)",
            background: "var(--sys-accent-tint)",
            boxShadow: motionActive ? "var(--sys-elev-0)" : "var(--sys-elev-2)",
            transform: motionActive ? "translateY(2px) scale(.985)" : "translateY(0) scale(1)",
            transition: "transform var(--sys-motion-fast) var(--sys-ease-snap), box-shadow var(--sys-motion-base) var(--sys-ease-out)",
            font: "inherit",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Press to preview motion
        </button>
      </section>

      <details style={section}>
        <summary style={{ cursor: "pointer", listStyle: "none", fontSize: 12, fontWeight: 720, letterSpacing: ".08em", textTransform: "uppercase" }}>
          Token ledger · {Object.keys(combinedCss).length}
        </summary>
        <div style={{ marginTop: 14, overflow: "hidden", border: "1px solid var(--sys-hair-1)", borderRadius: 11 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 10 }}>
            <thead style={{ color: "var(--sys-text-faint)", background: "rgba(255,255,255,.025)", textAlign: "left" }}>
              <tr><th style={{ padding: "8px 9px", width: "53%" }}>Token</th><th style={{ padding: "8px 5px" }}>Value</th><th style={{ padding: "8px 5px", width: 44 }}>Lc</th><th style={{ padding: "8px 5px", width: 30 }} aria-label="Clamped">C</th></tr>
            </thead>
            <tbody>
              {Object.entries(combinedCss).map(([name, value]) => {
                const lc = theme.meta.measuredLc[name];
                const isClamped = theme.meta.clamped.includes(name);
                return (
                  <tr key={name} style={{ borderTop: "1px solid var(--sys-hair-1)" }}>
                    <td title={name} style={{ padding: "7px 9px", overflow: "hidden", color: "var(--sys-text-tertiary)", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--nc-font-mono, ui-monospace)" }}>{name.replace("--sys-", "")}</td>
                    <td title={value} style={{ padding: "7px 5px", overflow: "hidden", color: "var(--sys-text-secondary)", textOverflow: "ellipsis", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{value}</td>
                    <td style={{ padding: "7px 5px", color: "var(--sys-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{lc === undefined ? "—" : Math.abs(lc).toFixed(1)}</td>
                    <td style={{ padding: "7px 5px", color: isClamped ? "var(--sys-sem-progress)" : "var(--sys-text-faint)" }}>{isClamped ? "●" : "·"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
      </>}

      <footer style={{ ...section, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, position: "sticky", bottom: 0, background: "color-mix(in srgb, var(--sys-chrome) 96%, transparent)", backdropFilter: "blur(18px)" }}>
        <MiniButton onClick={() => setSeeds({ color: cloneSeed(), shape: cloneShapeSeed() })}><RotateCcw size={13} /> Reset</MiniButton>
        <div style={{ display: "flex", gap: 7 }}>
          <MiniButton onClick={() => void copy("seed")}><Clipboard size={13} /> {copied === "seed" ? "Copied" : "Seed"}</MiniButton>
          <MiniButton primary onClick={() => void copy("css")}><Clipboard size={13} /> {copied === "css" ? "Copied" : "CSS"}</MiniButton>
        </div>
      </footer>
    </aside>
  );
}
