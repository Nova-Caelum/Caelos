import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AlertTriangle, Check, Clipboard, ExternalLink, GitPullRequest, RefreshCw, RotateCcw, Save, SlidersHorizontal, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cloneCharacterSeed, DEFAULT_CHARACTER, SURFACE_NAMES, type CharacterSeed, type SurfaceMode, type SurfaceName } from "../design/characterSeed";
import { diffFoundrySeeds, seedLiteral } from "../design/codegen";
import { hexToOklch, oklchToHex } from "../design/color";
import { derive } from "../design/derive";
import { applyCharacterCss, deriveCharacter } from "../design/deriveCharacter";
import { deriveShape } from "../design/deriveShape";
import { injectTokens } from "../design/inject";
import {
  applyOverride,
  countOverrideKeys,
  parseFoundryOverride,
  type FoundryOverride,
  type FoundrySeeds,
} from "../design/override";
import seedOverride from "../design/seed.override.json";
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

const IMPORTED_OVERRIDE = parseFoundryOverride(seedOverride);
const IMPORTED_STAGED_SEEDS = applyOverride(DEFAULT_SEED, DEFAULT_SHAPE_SEED, IMPORTED_OVERRIDE);

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

function cssLiteral(css: Record<string, string>): string {
  return `:root {\n${Object.entries(css).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`;
}

interface PromoteStatus {
  currentBranch: string;
  manualSeedDiff: boolean;
  ghReady: boolean;
}

interface PromotionResult {
  branch: string;
  prUrl: string;
  manualSeedDiff: boolean;
}

interface FoundryTarget {
  id: string;
  type: "project" | "initiative";
  label: string;
}

const PROMOTION_RECEIPT_KEY = "caelos-foundry-promotion";

function readPromotionReceipt(): PromotionResult | null {
  try {
    const value = window.sessionStorage.getItem(PROMOTION_RECEIPT_KEY);
    return value ? JSON.parse(value) as PromotionResult : null;
  } catch {
    return null;
  }
}

function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw.split("").map((digit) => digit + digit).join("")}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`.toUpperCase();
  return null;
}

function nextSurfaceMode(mode: SurfaceMode): SurfaceMode {
  return mode === "plain" ? "graph" : mode === "graph" ? "glass" : "plain";
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

function MiniButton({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function Foundry() {
  const [seeds, setSeeds] = useState<FoundrySeeds>(() => ({
    color: cloneSeed(IMPORTED_STAGED_SEEDS.color),
    shape: cloneShapeSeed(IMPORTED_STAGED_SEEDS.shape),
    character: cloneCharacterSeed(IMPORTED_STAGED_SEEDS.character),
  }));
  const [stagedOverride, setStagedOverride] = useState<FoundryOverride>(() => IMPORTED_OVERRIDE);
  const [stagingBusy, setStagingBusy] = useState(false);
  const [promotionResult, setPromotionResult] = useState<PromotionResult | null>(() => readPromotionReceipt());
  const [promotionOpen, setPromotionOpen] = useState(() => Boolean(readPromotionReceipt()));
  const [promotionBusy, setPromotionBusy] = useState(false);
  const [promoteStatus, setPromoteStatus] = useState<PromoteStatus | null>(null);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"seed" | "css" | null>(null);
  const [motionActive, setMotionActive] = useState(false);
  const [view, setView] = useState<"components" | "tune">("components");
  const [groundHex, setGroundHex] = useState(() => oklchToHex(IMPORTED_STAGED_SEEDS.color.groundBase).toUpperCase());
  const [groundHexEditing, setGroundHexEditing] = useState(false);
  const [groundHexError, setGroundHexError] = useState(false);
  const [lightnessOnly, setLightnessOnly] = useState(false);
  const [targets, setTargets] = useState<FoundryTarget[]>([]);
  const [testTarget, setTestTarget] = useState(() => window.localStorage.getItem("caelos.foundryTarget") ?? "");
  const [primitiveRefresh, setPrimitiveRefresh] = useState(0);
  const [primitivePulse, setPrimitivePulse] = useState(false);
  const frame = useRef<number | null>(null);
  const latestCss = useRef<Record<string, string>>({});
  const theme = useMemo(() => derive(seeds.color), [seeds.color]);
  const shapeTheme = useMemo(() => deriveShape(seeds.shape), [seeds.shape]);
  const combinedCss = useMemo(() => ({ ...theme.css, ...shapeTheme.css }), [theme.css, shapeTheme.css]);
  const characterCss = useMemo(() => deriveCharacter(seeds.character, seeds.color), [seeds.character, seeds.color]);
  const effectiveGroundHex = useMemo(() => oklchToHex(seeds.color.groundBase).toUpperCase(), [seeds.color.groundBase]);
  const stagedSeeds = useMemo(() => (
    applyOverride(DEFAULT_SEED, DEFAULT_SHAPE_SEED, stagedOverride, DEFAULT_CHARACTER)
  ), [stagedOverride]);
  const committedSeeds = useMemo(() => (
    applyOverride(DEFAULT_SEED, DEFAULT_SHAPE_SEED, {}, DEFAULT_CHARACTER)
  ), []);
  const promotionDiff = useMemo(() => diffFoundrySeeds(committedSeeds, stagedSeeds), [committedSeeds, stagedSeeds]);
  const hasUnsavedLiveChanges = useMemo(() => (
    diffFoundrySeeds(stagedSeeds, seeds).length > 0
  ), [seeds, stagedSeeds]);

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

  useLayoutEffect(() => {
    applyCharacterCss(characterCss);
  }, [characterCss]);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--foundry-panel-offset", "600px");
    return () => document.documentElement.style.removeProperty("--foundry-panel-offset");
  }, []);

  useEffect(() => {
    if (!groundHexEditing) setGroundHex(effectiveGroundHex);
  }, [effectiveGroundHex, groundHexEditing]);

  useEffect(() => {
    const receiveTargets = (event: Event) => {
      const detail = (event as CustomEvent<{ targets: FoundryTarget[]; selectedId: string }>).detail;
      setTargets(detail.targets);
      const preferred = window.localStorage.getItem("caelos.foundryTarget");
      const selected = preferred && detail.targets.some((target) => target.id === preferred)
        ? preferred
        : detail.selectedId;
      setTestTarget(selected);
    };
    window.addEventListener("caelos:foundry-options", receiveTargets);
    window.dispatchEvent(new CustomEvent("caelos:foundry-request-options"));
    return () => window.removeEventListener("caelos:foundry-options", receiveTargets);
  }, []);

  useLayoutEffect(() => () => {
    injectTokens([
      derive(IMPORTED_STAGED_SEEDS.color).css,
      deriveShape(IMPORTED_STAGED_SEEDS.shape).css,
    ], { legacyBridge: true });
    applyCharacterCss(deriveCharacter(IMPORTED_STAGED_SEEDS.character, IMPORTED_STAGED_SEEDS.color));
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

  const updateCharacter = useCallback((change: (next: CharacterSeed) => void) => {
    setSeeds((current) => {
      const character = cloneCharacterSeed(current.character);
      change(character);
      return { ...current, character };
    });
  }, []);

  const applyGroundHex = useCallback(() => {
    const normalized = normalizeHex(groundHex);
    if (!normalized) {
      setGroundHexError(true);
      window.setTimeout(() => setGroundHexError(false), 520);
      return;
    }
    const nextGround = hexToOklch(normalized);
    updateColor((next) => {
      if (lightnessOnly) {
        next.groundBase.l = nextGround.l;
      } else {
        next.groundBase = { ...nextGround };
        next.hueVector.h = nextGround.h;
        next.hueVector.c = nextGround.c;
      }
    });
    setGroundHex(normalized);
    setGroundHexError(false);
  }, [groundHex, lightnessOnly, updateColor]);

  const chooseTarget = useCallback((value: string) => {
    setTestTarget(value);
    if (value) window.localStorage.setItem("caelos.foundryTarget", value);
    else window.localStorage.removeItem("caelos.foundryTarget");
    window.dispatchEvent(new CustomEvent("caelos:foundry-select", { detail: { id: value || null } }));
  }, []);

  const refreshPrimitives = useCallback(async () => {
    if (import.meta.env.DEV) {
      const response = await fetch(`/src/primitives/primitives.css?foundry-refresh=${Date.now()}`);
      if (response.ok) {
        let style = document.getElementById("foundry-primitives-refresh") as HTMLStyleElement | null;
        if (!style) {
          style = document.createElement("style");
          style.id = "foundry-primitives-refresh";
          document.head.appendChild(style);
        }
        style.textContent = await response.text();
      }
    }
    setPrimitiveRefresh((value) => value + 1);
    setPrimitivePulse(true);
    window.setTimeout(() => setPrimitivePulse(false), 650);
    toast.success("Canonical primitives refreshed");
  }, []);

  const copy = useCallback(async (kind: "seed" | "css") => {
    const value = kind === "seed" ? seedLiteral(seeds.color, seeds.shape, seeds.character) : cssLiteral(combinedCss);
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1400);
  }, [combinedCss, seeds]);

  const postOverride = useCallback(async (path: "/__foundry/override" | "/__foundry/reset-override", body?: FoundryOverride) => {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw new Error(result.error || `Foundry staging request failed (${response.status})`);
  }, []);

  const saveToStaging = useCallback(async () => {
    const nextOverride: FoundryOverride = { color: seeds.color, shape: seeds.shape, character: seeds.character };
    setStagingBusy(true);
    try {
      await postOverride("/__foundry/override", nextOverride);
      setStagedOverride(nextOverride);
      toast.success("Foundry proposal saved to staging");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save Foundry staging");
    } finally {
      setStagingBusy(false);
    }
  }, [postOverride, seeds]);

  const resetToStaged = useCallback(() => {
    const staged = applyOverride(DEFAULT_SEED, DEFAULT_SHAPE_SEED, stagedOverride);
    setSeeds({ color: staged.color, shape: staged.shape, character: staged.character });
    toast.success("Foundry reset to staged values");
  }, [stagedOverride]);

  const resetStaging = useCallback(async () => {
    const confirmed = window.confirm("Reset staging to the committed seed values? This clears the entire Foundry override.");
    if (!confirmed) return;
    setStagingBusy(true);
    try {
      await postOverride("/__foundry/reset-override");
      setStagedOverride({});
      setSeeds({ color: cloneSeed(), shape: cloneShapeSeed(), character: cloneCharacterSeed() });
      toast.success("Foundry staging cleared");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset Foundry staging");
    } finally {
      setStagingBusy(false);
    }
  }, [postOverride]);

  const openPromotion = useCallback(async () => {
    setPromotionOpen(true);
    setPromotionError(null);
    setPromoteStatus(null);
    try {
      const response = await fetch("/__foundry/promote");
      const result = await response.json().catch(() => ({})) as PromoteStatus & { error?: string };
      if (!response.ok) throw new Error(result.error || `Could not inspect promotion state (${response.status})`);
      setPromoteStatus(result);
    } catch (error) {
      setPromotionError(error instanceof Error ? error.message : "Could not inspect promotion state");
    }
  }, []);

  const confirmPromotion = useCallback(async () => {
    setPromotionBusy(true);
    setPromotionError(null);
    try {
      const response = await fetch("/__foundry/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stagedOverride),
      });
      const result = await response.json().catch(() => ({})) as PromotionResult & { error?: string };
      if (!response.ok) throw new Error(result.error || `Foundry promotion failed (${response.status})`);
      window.sessionStorage.setItem(PROMOTION_RECEIPT_KEY, JSON.stringify(result));
      setPromotionResult(result);
      setStagedOverride({});
      toast.success("Foundry promotion PR opened");
    } catch (error) {
      setPromotionError(error instanceof Error ? error.message : "Foundry promotion failed");
    } finally {
      setPromotionBusy(false);
    }
  }, [stagedOverride]);

  const closePromotion = useCallback(() => {
    window.sessionStorage.removeItem(PROMOTION_RECEIPT_KEY);
    setPromotionOpen(false);
    setPromotionResult(null);
    setPromotionError(null);
  }, []);

  const roundTripMax = useMemo(() => Math.max(...ROUND_TRIP_HEXES.map((hex) => (
    hexChannelDistance(hex, oklchToHex(hexToOklch(hex)))
  ))), []);
  const contrastErrors = Object.entries(seeds.color.textTargets).map(([name, target]) => (
    Math.abs(Math.abs(theme.meta.measuredLc[`--sys-text-${name}`] ?? 0) - target)
  ));
  const maxContrastError = Math.max(...contrastErrors);
  const mathPassed = roundTripMax <= 1 && maxContrastError <= 2;
  const stagedKeyCount = countOverrideKeys(stagedOverride);

  return (
    <aside
      data-surface="top"
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
      <style>{`
        @keyframes foundry-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes foundry-pulse { 0%,100% { opacity: 1; } 50% { opacity: .72; } }
      `}</style>
      <header style={{ padding: "20px 20px 18px", display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--sys-text-faint)", fontSize: 10, fontWeight: 720, letterSpacing: ".1em", textTransform: "uppercase" }}>Test against</span>
          <select
            aria-label="Test against"
            value={testTarget}
            onChange={(event) => chooseTarget(event.currentTarget.value)}
            style={{ minWidth: 0, height: 32, border: "1px solid var(--sys-hair-2)", borderRadius: 9, padding: "0 10px", color: "var(--sys-text-secondary)", background: "var(--sys-elevated)" }}
          >
            <option value="">Empty state</option>
            {targets.map((target) => <option key={`${target.type}:${target.id}`} value={target.id}>{target.type === "project" ? "Project" : "Initiative"} · {target.label}</option>)}
          </select>
        </label>
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
            <span
              data-testid="foundry-staging-status"
              data-staged-keys={stagedKeyCount}
              style={{ color: stagedKeyCount ? "var(--sys-sem-progress)" : "var(--sys-text-faint)", fontSize: 10, fontWeight: 650 }}
            >
              staged: {stagedKeyCount ? `override active (${stagedKeyCount} keys)` : "clean"}
            </span>
          </div>
          <div style={{ display: "grid", justifyItems: "end", gap: 8 }}>
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
            <MiniButton
              primary
              disabled={stagingBusy || promotionBusy || stagedKeyCount === 0}
              onClick={() => void openPromotion()}
            >
              <GitPullRequest size={13} /> Commit + Push
            </MiniButton>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7 }} aria-label="Surface ladder">
          {SURFACE_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              aria-label={`${name} surface · ${seeds.character.modes[name]}`}
              onClick={() => updateCharacter((next) => { next.modes[name] = nextSurfaceMode(next.modes[name]); })}
              style={{ display: "grid", gap: 5, padding: 0, border: 0, color: "inherit", background: "transparent", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ color: "var(--sys-accent-on-tint)", fontSize: 7, fontWeight: 760, letterSpacing: ".08em", textTransform: "uppercase" }}>{seeds.character.modes[name]}</span>
              <span data-surface={name} style={{ display: "block", height: 28, borderRadius: 7, border: "1px solid var(--sys-hair-1)" }} />
              <span style={{ overflow: "hidden", color: "var(--sys-text-faint)", fontSize: 8, textOverflow: "ellipsis" }}>{name}</span>
            </button>
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

      {view === "components" ? <>
        <div style={{ ...section, display: "flex", justifyContent: "flex-end", paddingBlock: 10 }}>
          <MiniButton onClick={() => void refreshPrimitives()}><RefreshCw size={13} /> Refresh primitives</MiniButton>
        </div>
        <div key={primitiveRefresh} style={{ animation: primitivePulse ? "foundry-pulse 650ms ease" : undefined }}>
          <PrimitiveGallery />
        </div>
      </> : <>
      <section style={{ ...section, display: "grid", gap: 15 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--sys-text-tertiary)" />
          <h2 style={{ margin: 0, fontSize: 12, fontWeight: 720, letterSpacing: ".08em", textTransform: "uppercase" }}>Surface field</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "end", gap: 10 }}>
          <label style={{ display: "grid", gap: 7 }}>
            <span style={labelStyle}><span>Ground hex</span><span style={{ color: groundHexError ? "var(--sys-sem-danger-on-tint)" : "var(--sys-text-faint)", fontSize: 10 }}>{groundHexError ? "Use #RGB or #RRGGBB" : lightnessOnly ? "L only" : "full re-anchor"}</span></span>
            <input
              aria-label="Ground hex"
              value={groundHex}
              onFocus={() => setGroundHexEditing(true)}
              onChange={(event) => setGroundHex(event.currentTarget.value)}
              onBlur={() => { applyGroundHex(); setGroundHexEditing(false); }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyGroundHex();
                  event.currentTarget.blur();
                }
              }}
              style={{ height: 34, border: `1px solid ${groundHexError ? "var(--sys-sem-danger)" : "var(--sys-hair-2)"}`, borderRadius: 9, padding: "0 10px", color: "var(--sys-text-primary)", background: "var(--sys-ground)", fontFamily: "var(--sys-font-mono, ui-monospace, monospace)", animation: groundHexError ? "foundry-shake 360ms ease" : undefined }}
            />
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 34, color: "var(--sys-text-secondary)", fontSize: 11, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={lightnessOnly} onChange={(event) => setLightnessOnly(event.currentTarget.checked)} /> L only
          </label>
        </div>
        <RangeControl label="Ground lightness" value={seeds.color.groundBase.l} min={0.08} max={0.36} step={0.001} onChange={(value) => updateColor((next) => { next.groundBase.l = value; })} />
        <RangeControl label="Hue vector" value={seeds.color.hueVector.h} min={0} max={360} step={1} unit="°" onChange={(value) => updateColor((next) => { next.hueVector.h = value; })} />
        <RangeControl label="Surface chroma" value={seeds.color.hueVector.c} min={0} max={0.08} step={0.001} onChange={(value) => updateColor((next) => { next.hueVector.c = value; })} />
        <RangeControl label="Chroma ramp" value={seeds.color.hueVector.cRamp} min={-0.01} max={0.015} step={0.001} onChange={(value) => updateColor((next) => { next.hueVector.cRamp = value; })} />
        <RangeControl label="Contrast" value={seeds.color.contrast} min={0.55} max={1.65} step={0.01} unit="×" onChange={(value) => updateColor((next) => { next.contrast = value; })} />
        {SURFACE_NAMES.some((name) => seeds.character.modes[name] === "graph") && (
          <RangeControl label="Graph intensity" value={seeds.character.graphIntensity} min={0.04} max={0.2} step={0.01} onChange={(value) => updateCharacter((next) => { next.graphIntensity = value; })} />
        )}
        {SURFACE_NAMES.some((name) => seeds.character.modes[name] === "glass") && (
          <RangeControl label="Glass intensity" value={seeds.character.glassIntensity} min={0} max={1} step={0.01} onChange={(value) => updateCharacter((next) => { next.glassIntensity = value; })} />
        )}
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

      {promotionOpen && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            zIndex: 2147483100,
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(5, 6, 12, .78)",
            backdropFilter: "blur(10px)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="foundry-promote-title"
            style={{
              width: "min(520px, 100%)",
              maxHeight: "min(680px, calc(100vh - 36px))",
              overflow: "auto",
              border: "1px solid var(--sys-hair-3)",
              borderRadius: 16,
              color: "var(--sys-text-primary)",
              background: "var(--sys-elevated-2)",
              boxShadow: "var(--sys-elev-3)",
            }}
          >
            <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: 20, borderBottom: "1px solid var(--sys-hair-1)" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <span style={{ color: "var(--sys-accent-on-tint)", fontSize: 10, fontWeight: 760, letterSpacing: ".14em", textTransform: "uppercase" }}>Promote staging</span>
                <h2 id="foundry-promote-title" style={{ margin: 0, fontSize: 19, letterSpacing: "-.02em" }}>Commit + Push</h2>
                <p style={{ margin: 0, color: "var(--sys-text-tertiary)", fontSize: 12, lineHeight: 1.5 }}>
                  Create an isolated seed branch and open a GitHub pull request.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close promotion dialog"
                onClick={closePromotion}
                disabled={promotionBusy}
                style={{ display: "grid", placeItems: "center", width: 32, height: 32, padding: 0, border: "1px solid var(--sys-hair-2)", borderRadius: 9, color: "var(--sys-text-secondary)", background: "transparent", cursor: promotionBusy ? "not-allowed" : "pointer" }}
              >
                <X size={15} />
              </button>
            </header>

            <div style={{ display: "grid", gap: 16, padding: 20 }}>
              {promotionResult ? (
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--sys-sem-done-on-tint)", fontSize: 13, fontWeight: 720 }}>
                    <Check size={16} /> Promotion PR opened
                  </div>
                  <div style={{ padding: 13, border: "1px solid var(--sys-hair-2)", borderRadius: 11, background: "var(--sys-ground)", fontSize: 11 }}>
                    <div style={{ color: "var(--sys-text-faint)", marginBottom: 5 }}>Branch</div>
                    <code style={{ color: "var(--sys-text-secondary)" }}>{promotionResult.branch}</code>
                  </div>
                  <a
                    href={promotionResult.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 40, border: "1px solid var(--sys-accent-line)", borderRadius: 10, color: "var(--sys-accent-on-tint)", background: "var(--sys-accent-tint)", fontSize: 12, fontWeight: 720, textDecoration: "none" }}
                  >
                    Open pull request <ExternalLink size={13} />
                  </a>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                      <strong style={{ fontSize: 12 }}>Seed diff</strong>
                      <span style={{ color: "var(--sys-text-faint)", fontSize: 10 }}>{promotionDiff.length} changed values</span>
                    </div>
                    <div style={{ maxHeight: 210, overflow: "auto", border: "1px solid var(--sys-hair-1)", borderRadius: 11, background: "var(--sys-ground)" }}>
                      {promotionDiff.length ? promotionDiff.slice(0, 24).map((entry) => (
                        <div key={entry.path} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, padding: "9px 11px", borderTop: "1px solid var(--sys-hair-1)", fontSize: 10 }}>
                          <code title={entry.path} style={{ overflow: "hidden", color: "var(--sys-text-tertiary)", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.path}</code>
                          <span style={{ color: "var(--sys-text-faint)", fontVariantNumeric: "tabular-nums" }}>{entry.before} → <span style={{ color: "var(--sys-text-secondary)" }}>{entry.after}</span></span>
                        </div>
                      )) : (
                        <div style={{ padding: 13, color: "var(--sys-text-faint)", fontSize: 11 }}>No staged seed values differ from the committed defaults.</div>
                      )}
                    </div>
                  </div>

                  {promoteStatus?.manualSeedDiff && (
                    <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: 12, border: "1px solid var(--sys-sem-progress-line)", borderRadius: 11, color: "var(--sys-sem-progress-on-tint)", background: "var(--sys-sem-progress-tint)", fontSize: 11, lineHeight: 1.45 }}>
                      <AlertTriangle size={15} style={{ flex: "0 0 auto", marginTop: 1 }} />
                      <span><strong>Working seed differs from HEAD.</strong> Promotion will replace the manual seed edit in this worktree after the PR opens.</span>
                    </div>
                  )}

                  {hasUnsavedLiveChanges && (
                    <div role="note" style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: 12, border: "1px solid var(--sys-hair-2)", borderRadius: 11, color: "var(--sys-text-secondary)", background: "var(--sys-elevated)", fontSize: 11, lineHeight: 1.45 }}>
                      <AlertTriangle size={15} style={{ flex: "0 0 auto", marginTop: 1 }} />
                      <span>Live dials differ from staging. Save them first if they should be included; promotion uses staged values only.</span>
                    </div>
                  )}

                  {promoteStatus && !promoteStatus.ghReady && (
                    <div role="alert" style={{ color: "var(--sys-sem-danger-on-tint)", fontSize: 11 }}>GitHub CLI authentication is unavailable.</div>
                  )}
                  {promotionError && <div role="alert" style={{ color: "var(--sys-sem-danger-on-tint)", fontSize: 11 }}>{promotionError}</div>}

                  <p style={{ margin: 0, color: "var(--sys-text-secondary)", fontSize: 12, lineHeight: 1.5 }}>
                    Are you sure? This opens a PR that deploys a preview.
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <MiniButton disabled={promotionBusy} onClick={closePromotion}>Cancel</MiniButton>
                    <MiniButton
                      primary
                      disabled={promotionBusy || !promoteStatus?.ghReady || promotionDiff.length === 0 || hasUnsavedLiveChanges}
                      onClick={() => void confirmPromotion()}
                    >
                      <GitPullRequest size={13} /> {promotionBusy ? "Promoting…" : "Create branch + PR"}
                    </MiniButton>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      <footer style={{ ...section, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, position: "sticky", bottom: 0, background: "color-mix(in srgb, var(--sys-chrome) 96%, transparent)", backdropFilter: "blur(18px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <MiniButton disabled={stagingBusy} onClick={resetToStaged}><RotateCcw size={13} /> Reset to staged</MiniButton>
          <MiniButton disabled={stagingBusy || stagedKeyCount === 0} onClick={() => void resetStaging()}><Trash2 size={13} /> Reset staging</MiniButton>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <MiniButton onClick={() => void copy("seed")}><Clipboard size={13} /> {copied === "seed" ? "Copied" : "Seed"}</MiniButton>
          <MiniButton onClick={() => void copy("css")}><Clipboard size={13} /> {copied === "css" ? "Copied" : "CSS"}</MiniButton>
          <MiniButton primary disabled={stagingBusy} onClick={() => void saveToStaging()}><Save size={13} /> {stagingBusy ? "Saving…" : "Save to staging"}</MiniButton>
        </div>
      </footer>
    </aside>
  );
}
