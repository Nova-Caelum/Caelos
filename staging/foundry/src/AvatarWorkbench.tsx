import React, { useCallback, useEffect, useMemo, useState } from "react";
import { agentAvatarSizes } from "@caelos/header-layout";
import { readTokens, type Token } from "./tokens";

/**
 * Create · Avatar and AvatarBadge.
 *
 * A proposal for a replacement avatar, styled in the conversation header's material (nc-chathead):
 * circle and square, five sizes, an image or initials, a focus state (no expansion), and a badge
 * for status — attention (permission / action needed) and running (a background process or
 * subagent). Composition follows shadcn's Avatar: root › image | fallback, plus badge.
 *
 * Each user carries their own colour (`--av-color`, set per avatar from the user's token); the
 * fill is built from it, so a roster colours itself. One recipe-shaped object produces both the
 * live preview and the generated Panda slot recipe, so the recipe is exactly what is on screen.
 */

type Size = "sm" | "md" | "lg" | "xl" | "xxl";
type Shape = "circle" | "square";
type Status = "none" | "attention" | "running";

/** The five package sizes. Text sizes are the current avatar recipe's, per size. */
const SIZES: { key: Size; px: number; text: number }[] = [
  { key: "sm", px: 24, text: 10 },
  { key: "md", px: 32, text: 12 },
  { key: "lg", px: 40, text: 14 },
  { key: "xl", px: agentAvatarSizes.xl, text: 14 },
  { key: "xxl", px: agentAvatarSizes.xxl, text: 14 },
];

export interface AvatarMaterial {
  /** paired mirrors the Composer's focus fill (--il-focus: two hues at 22% → 16%) with the user's colour as the first hue. */
  fillMode: "paired" | "tonal" | "tint" | "glass";
  pairWith: string;
  /** Where the blend between the two colours is centred, 50 (even) to 95 (the user's colour dominates). */
  balance: number;
  /** Strength of the user's colour and of the second colour, % opacity. The Composer's focus fill is 22 / 16. */
  primaryStrength: number;
  secondaryStrength: number;
  overGlass: "yes" | "no";
  edge: string;
  edgeWidth: number;
  /** Multiplies the edge token's own opacity: 100 = the token as declared. */
  edgeIntensity: number;
  edgeBlur: number;
  elevation: string;
  squareRadius: string;
  font: string;
  weight: "500" | "600" | "700";
  textColour: string;
  textSize: "recipe" | "proportional";
  /** Letter height as % of the avatar, when proportional. */
  textScale: number;
  /** Margin between the frame and a picture, % of the avatar; and how the picture fills what remains. */
  imageInset: number;
  imageFit: "cover" | "contain";
  focusEdge: string;
  focusGlow: string;
  focusGlowSize: "12" | "18" | "20";
  focusFeather: "on" | "off";
  focusRing: "material" | "outline";
  attention: string;
  running: string;
  badgeRing: string;
  badgeSize: "24" | "28" | "34";
  badgeGlyph: "dot" | "glyph";
}

/** Starting point: the header's nc-chathead material, with the Composer's focus fill shape. */
export const AVATAR_BASELINE: AvatarMaterial = {
  fillMode: "paired",
  pairWith: "--nc-sage",
  balance: 50,
  primaryStrength: 22,
  secondaryStrength: 16,
  overGlass: "yes",
  edge: "--il-edge",
  edgeWidth: 1,
  edgeIntensity: 100,
  edgeBlur: 0,
  elevation: "--sys-elev-1",
  squareRadius: "30%",
  font: "--font-nova-sans",
  weight: "500",
  textColour: "user",
  textSize: "recipe",
  textScale: 38,
  imageInset: 0,
  imageFit: "cover",
  focusEdge: "--nc-focus-edge",
  focusGlow: "--nc-focus-glow",
  focusGlowSize: "18",
  focusFeather: "on",
  focusRing: "material",
  attention: "--nc-progress",
  running: "--nc-sage",
  badgeRing: "--nc-ground",
  badgeSize: "28",
  badgeGlyph: "dot",
};
const withDefaults = (m: Partial<AvatarMaterial>): AvatarMaterial => ({ ...AVATAR_BASELINE, ...m });

type Style = { [k: string]: string | Style };
type Slot = "root" | "frame" | "image" | "fallback" | "badge";
type SlotStyles = Partial<Record<Slot, Style>>;
interface AvatarRecipe {
  base: SlotStyles;
  variants: Record<"shape" | "size" | "status", Record<string, SlotStyles>>;
}
const SLOTS: Slot[] = ["root", "frame", "image", "fallback", "badge"];

const FONT_FALLBACK: Record<string, string> = {
  "--font-nova-sans": "'IBM Plex Sans', sans-serif",
  "--font-nova-heading": "'Yrsa', serif",
  "--font-nova-mono": "'IBM Plex Mono', monospace",
};
const mix = (colour: string, pct: number) => `color-mix(in srgb, ${colour} ${pct}%, transparent)`;
const USER = "var(--av-color, var(--avatar-green))";
const EASE = "260ms var(--il-ease, ease)";

/**
 * The single source for preview and recipe. `focusSelector` is `&:focus-visible` in the recipe;
 * the preview adds `&[data-focus]` so the state can be held on screen without tabbing.
 */
export function avatarRecipe(m: AvatarMaterial, focusSelector = "&:focus-visible"): AvatarRecipe {
  let fill: string;
  // The colour hint (`balance%`) moves the blend's midpoint: 50 is even, higher lets the user's colour run further.
  const second = m.fillMode === "paired" ? `var(${m.pairWith})` : USER;
  if (m.fillMode === "paired" || m.fillMode === "tonal")
    fill = `linear-gradient(135deg, ${mix(USER, m.primaryStrength)}, ${m.balance}%, ${mix(second, m.secondaryStrength)})`;
  else if (m.fillMode === "tint") fill = `linear-gradient(${mix(USER, m.primaryStrength)}, ${mix(USER, m.primaryStrength)})`;
  else fill = "var(--nc-glass-bg)";
  if (m.overGlass === "yes" && m.fillMode !== "glass") fill = `${fill}, var(--nc-glass-bg)`;

  const restEdge = m.edge === "none" ? "transparent" : `var(${m.edge})`;
  const edgeColour =
    m.focusEdge !== "none" && m.focusEdge !== m.edge
      ? `color-mix(in srgb, ${restEdge}, var(${m.focusEdge}) calc(var(--av-focus) * 100%))`
      : restEdge;
  // Intensity scales the token's own alpha (relative colour syntax), so 100 is the token exactly.
  const edgeStroke = m.edgeIntensity === 100 ? edgeColour : `rgb(from ${edgeColour} r g b / calc(alpha * ${m.edgeIntensity / 100}))`;

  const focusState: Style = { "--av-focus": "1" };
  if (m.focusRing === "outline") Object.assign(focusState, { outline: "2px solid var(--il-muted)", outlineOffset: "2px" });

  const root: Style = {
    position: "relative",
    display: "inline-grid",
    flexShrink: "0",
    verticalAlign: "middle",
    width: "var(--av-size)",
    height: "var(--av-size)",
    // Badge diameter follows the avatar, never below a legible 8px.
    "--av-badge": `max(8px, calc(var(--av-size) * ${Number(m.badgeSize) / 100}))`,
    "--av-focus": "0",
    outline: "none",
    [focusSelector]: focusState,
  };
  if (m.focusGlow !== "none") {
    root["&::after"] = {
      content: '""',
      position: "absolute",
      inset: "0",
      borderRadius: "inherit",
      pointerEvents: "none",
      boxShadow: `0 0 ${m.focusGlowSize}px var(${m.focusGlow})`,
      opacity: "var(--av-focus)",
      transition: `opacity ${EASE}`,
    };
  }

  const frame: Style = {
    position: "absolute",
    inset: "0",
    borderRadius: "inherit",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    boxSizing: "border-box",
    background: fill,
    boxShadow: m.elevation === "none" ? "none" : `var(${m.elevation})`,
    color: m.textColour === "user" ? USER : `var(${m.textColour})`,
    fontFamily: `var(${m.font}, ${FONT_FALLBACK[m.font] ?? "sans-serif"})`,
    fontWeight: m.weight,
    fontSize: m.textSize === "recipe" ? "var(--av-text)" : `calc(var(--av-size) * ${m.textScale / 100})`,
    lineHeight: "1",
    transition: `border-color ${EASE}`,
  };
  if (m.focusFeather === "on") {
    frame["&::before"] = {
      content: '""',
      position: "absolute",
      inset: "0",
      borderRadius: "inherit",
      pointerEvents: "none",
      background: "var(--nc-feather-fill)",
      filter: "blur(var(--nc-feather-blur))",
      opacity: "var(--av-focus)",
      transition: `opacity ${EASE}`,
    };
  }

  // The edge is its own layer above the picture, so it can be thickened and softened without moving anything.
  if (m.edge !== "none" && m.edgeWidth > 0) {
    frame["&::after"] = {
      content: '""',
      position: "absolute",
      inset: "0",
      zIndex: "2",
      borderRadius: "inherit",
      pointerEvents: "none",
      border: `${m.edgeWidth}px solid ${edgeStroke}`,
      ...(m.edgeBlur > 0 ? { filter: `blur(${m.edgeBlur}px)` } : {}),
      transition: `border-color ${EASE}`,
    };
  }

  const badge: Style = {
    position: "absolute",
    zIndex: "2",
    width: "var(--av-badge)",
    height: "var(--av-badge)",
    borderRadius: "50%",
    boxSizing: "border-box",
    // The cutout: a ring in the surface colour separates the badge from the avatar.
    boxShadow: `0 0 0 max(1.5px, calc(var(--av-size) * .04)) var(${m.badgeRing})`,
  };
  if (m.badgeGlyph === "glyph") {
    Object.assign(badge, { display: "grid", placeItems: "center", color: `var(${m.badgeRing})`, fontFamily: frame.fontFamily, fontWeight: "700", fontSize: "calc(var(--av-badge) * .72)", lineHeight: "1" });
  }

  const running: Style = { background: `var(${m.running})` };
  if (m.badgeGlyph === "glyph") {
    Object.assign(running, {
      background: `var(${m.badgeRing})`,
      border: `calc(var(--av-badge) * .2) solid var(${m.running})`,
      borderRightColor: "transparent",
      animation: "avatarBadgeSpin 1.1s linear infinite",
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    });
  }
  const attention: Style = { background: `var(${m.attention})` };
  if (m.badgeGlyph === "glyph") attention["&::before"] = { content: '"!"' };

  // A badge's centre sits on the circle's edge at 45°: r(1 − cos 45°) from each side.
  const circleBadge = "calc(var(--av-size) * .146 - var(--av-badge) / 2)";
  const squareBadge = "calc(var(--av-badge) / -4)";
  const squareRadius = m.squareRadius.startsWith("--") ? `var(${m.squareRadius})` : m.squareRadius;

  return {
    base: {
      root,
      frame,
      image: {
        position: "relative",
        width: `calc(100% - var(--av-size) * ${(2 * m.imageInset) / 100})`,
        height: `calc(100% - var(--av-size) * ${(2 * m.imageInset) / 100})`,
        objectFit: m.imageFit,
      },
      fallback: { position: "relative", userSelect: "none" },
      badge,
    },
    variants: {
      shape: {
        circle: { root: { borderRadius: "50%" }, badge: { right: circleBadge, bottom: circleBadge } },
        square: { root: { borderRadius: squareRadius }, badge: { right: squareBadge, bottom: squareBadge } },
      },
      size: Object.fromEntries(SIZES.map((s) => [s.key, { root: { "--av-size": `${s.px}px`, "--av-text": `${s.text}px` } }])),
      status: { attention: { badge: attention }, running: { badge: running } },
    },
  };
}

const kebab = (k: string) => (k.startsWith("--") ? k : k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));

function toCss(selector: string, styles: Style): string {
  const own: string[] = [];
  const nested: string[] = [];
  for (const [k, v] of Object.entries(styles)) {
    if (typeof v === "string") own.push(`  ${kebab(k)}: ${v};`);
    else if (k.startsWith("@")) nested.push(`${k} {\n${toCss(selector, v)}\n}`);
    else nested.push(toCss(k.replace(/&/g, selector), v));
  }
  return [own.length ? `${selector} {\n${own.join("\n")}\n}` : "", ...nested].filter(Boolean).join("\n");
}

function previewCss(r: AvatarRecipe): string {
  const scope = ".fd-avatar-create .fd-av";
  const at = (root: string, slot: string) => (slot === "root" ? root : `${root} .fd-av__${slot}`);
  const out: string[] = [];
  for (const slot of SLOTS) if (r.base[slot]) out.push(toCss(at(scope, slot), r.base[slot]!));
  for (const [axis, values] of Object.entries(r.variants))
    for (const [value, slots] of Object.entries(values))
      for (const slot of SLOTS) if (slots[slot]) out.push(toCss(at(`${scope}[data-${axis}="${value}"]`, slot), slots[slot]!));
  out.push("@keyframes avatarBadgeSpin { to { transform: rotate(360deg); } }");
  return out.join("\n");
}

function toRecipe(name: string, r: AvatarRecipe): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "draft";
  const lines = (o: Style | SlotStyles | Record<string, unknown>, depth: number): string =>
    Object.entries(o)
      .map(([k, v]) => {
        const pad = "  ".repeat(depth);
        const key = /^[a-zA-Z]+$/.test(k) ? k : JSON.stringify(k);
        return typeof v === "string" ? `${pad}${key}: ${JSON.stringify(v)},` : `${pad}${key}: {\n${lines(v as Style, depth + 1)}\n${pad}},`;
      })
      .join("\n");
  return [
    `// Proposed Avatar + AvatarBadge ("${slug}") — staged from the Caelos Foundry, NOT applied.`,
    `// Composition (shadcn Avatar): root › frame › image | fallback, plus badge.`,
    `// HOST: set --av-color on the root from the user's colour token, e.g. style={{ "--av-color": "var(--nc-sage)" }}.`,
    `// The running glyph animates with @keyframes avatarBadgeSpin { to { transform: rotate(360deg) } } — add to the preset.`,
    `export const avatar = defineSlotRecipe({`,
    `  className: "avatar",`,
    `  slots: ${JSON.stringify(SLOTS)},`,
    `  base: {`,
    lines(r.base, 2),
    `  },`,
    `  variants: {`,
    lines(r.variants, 2),
    `  },`,
    `  defaultVariants: { shape: "circle", size: "md" },`,
    `});`,
  ].join("\n");
}

/* ─── UI ─── */

const SAMPLE = "/samples/claude-code.png";
type User = { name: string; colour: string; image?: boolean };
/** One sample user per avatar identity colour (--avatar-*, Claude Code's eight subagent colours). */
const USERS: User[] = [
  { name: "Caelos", colour: "--avatar-orange", image: true },
  { name: "Daniel Eghdami", colour: "--avatar-blue" },
  { name: "Athena", colour: "--avatar-purple" },
  { name: "Hermes", colour: "--avatar-green" },
  { name: "Iris", colour: "--avatar-pink" },
  { name: "Nova", colour: "--avatar-cyan" },
  { name: "Apollo", colour: "--avatar-yellow" },
  { name: "Ares", colour: "--avatar-red" },
];
const initials = (name: string) =>
  name.trim().split(/[\s-]+/).filter(Boolean).slice(0, 2).map((p) => Array.from(p)[0]).join("").toUpperCase() || "?";

function Avatar({ user, size, shape, status = "none", image, focus }: { user: User; size: Size; shape: Shape; status?: Status; image: boolean; focus: boolean }) {
  const label = status === "attention" ? `${user.name}, needs attention` : status === "running" ? `${user.name}, running in the background` : user.name;
  return (
    <span className="fd-av" role="img" aria-label={label} tabIndex={0} data-shape={shape} data-size={size} data-status={status} data-focus={focus || undefined}
      style={{ "--av-color": `var(${user.colour})` } as React.CSSProperties}>
      <span className="fd-av__frame">
        {image ? <img className="fd-av__image" src={SAMPLE} alt="" /> : <span className="fd-av__fallback">{initials(user.name)}</span>}
      </span>
      {status !== "none" && <span className="fd-av__badge" aria-hidden="true" />}
    </span>
  );
}

function Slider({ label, value, onChange, min, max, step = 1, unit = "%", disabled, title }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string; disabled?: boolean; title?: string }) {
  return (
    <label className="fd-field fd-slider" title={title}>
      <span className="fd-slider-head">{label}<output>{value}{unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Select<T extends string>({ label, value, onChange, options, title, disabled }: { label: string; value: T; onChange: (v: T) => void; options: { value: string; label: string }[]; title?: string; disabled?: boolean }) {
  return (
    <label className="fd-field" title={title}>
      {label}
      <select className="fd-input" value={value} onChange={(e) => onChange(e.target.value as T)} disabled={disabled}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
const tokenOptions = (tokens: Token[], extra: { value: string; label: string }[] = []) => [...extra, ...tokens.map((t) => ({ value: t.name, label: t.name }))];

type Saved = { name: string; slug?: string; kind?: string; recipe?: string; material?: Partial<AvatarMaterial> };

export function AvatarWorkbench({ scope, themeKey }: { scope: HTMLElement | null; themeKey: string }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  useEffect(() => { if (scope) setTokens(readTokens(scope)); }, [scope, themeKey]);
  const [m, setM] = useState<AvatarMaterial>(AVATAR_BASELINE);
  const set = <K extends keyof AvatarMaterial>(k: K, v: AvatarMaterial[K]) => setM((p) => ({ ...p, [k]: v }));
  const [users, setUsers] = useState<User[]>(USERS);
  const [subject, setSubject] = useState(0);
  const [hold, setHold] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState<Saved[]>([]);

  const groups = useMemo(() => {
    const own = tokens.filter((t) => !t.hostSupplied);
    // Identity colours (--avatar-*) are for who someone is, never for status or chrome — kept apart.
    const colour = own.filter((t) => t.group === "Colour" && !/^--avatar-/.test(t.name));
    return {
      colour,
      // Avatar identity colours — the only choices for a user's colour when they exist.
      identity: own.filter((t) => /^--avatar-/.test(t.name)),
      edge: colour.filter((t) => /edge|line|hair|border/.test(t.name)),
      glow: own.filter((t) => t.group === "Glow"),
      elevation: tokens.filter((t) => /^--sys-elev-\d/.test(t.name)),
      radius: own.filter((t) => t.group === "Radius"),
      // The fonts are host hooks (declared by the app, referenced by the package) — include them here.
      font: tokens.filter((t) => /^--font-nova-/.test(t.name)),
      surface: colour.filter((t) => /ground|elevated|top|chrome|opaque/.test(t.name)),
    };
  }, [tokens]);

  const recipe = avatarRecipe(m, "&:focus-visible, &[data-focus]");
  const css = previewCss(recipe);
  const generated = toRecipe(name || "draft", avatarRecipe(m));
  const changed = JSON.stringify(m) !== JSON.stringify(AVATAR_BASELINE);

  const loadSaved = useCallback(async () => {
    const r = await fetch("/__foundry/drafts");
    if (r.ok) setSaved(((await r.json()) as Saved[]).filter((d) => d.kind === "recipe" && d.recipe === "avatar"));
  }, []);
  useEffect(() => { void loadSaved(); }, [loadSaved]);
  const save = async () => {
    if (!name.trim()) { setStatus("Name the avatar first."); return; }
    const body = { name: `avatar ${name}`, kind: "recipe", recipe: "avatar", material: m, users, generated, elements: [] };
    const r = await fetch("/__foundry/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { setStatus(`Save failed: ${await r.text()}`); return; }
    setStatus(`Saved to foundry-drafts/${(await r.json()).slug}.json — staged, not applied.`);
    void loadSaved();
  };

  const who = users[subject] ?? users[0];
  const shapes: Shape[] = ["circle", "square"];

  return (
    <section className="fd-component fd-create fd-avatar-create">
      <style>{css}</style>
      <header className="fd-comp-head">
        <div>
          <div className="fd-eyebrow">Create</div>
          <h1 className="fd-h1">Avatar · AvatarBadge</h1>
          <p className="fd-muted">
            In the header's material. Each user's colour fills their avatar automatically; the badge marks attention (peach gold) or a process running (sage). No expansion — focus is the only state. Tab through the avatars, or hold focus.
          </p>
        </div>
      </header>

      <div className="fd-create-grid">
        <div className="fd-create-stages">
          <div className="fd-create-pane fd-av-pane">
            <div className="fd-create-pane-label">Sizes · {who.name}</div>
            {shapes.map((shape) => (
              <div key={shape} className="fd-av-block">
                <div className="fd-av-caption">{shape}</div>
                {[false, true].map((image) => (
                  <div key={String(image)} className="fd-av-row">
                    {SIZES.map((s) => (
                      <figure key={s.key} className="fd-av-cell">
                        <Avatar user={who} size={s.key} shape={shape} image={image} focus={hold} />
                        <figcaption>{s.key} · {s.px}{image ? "" : ` · ${m.textSize === "recipe" ? s.text : Math.round((s.px * m.textScale) / 100)}px text`}</figcaption>
                      </figure>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="fd-create-pane fd-av-pane">
            <div className="fd-create-pane-label">AvatarBadge · attention and running</div>
            {shapes.map((shape) => (
              <div key={shape} className="fd-av-row">
                {(["none", "attention", "running"] as Status[]).flatMap((st) =>
                  (["lg", "xxl"] as Size[]).map((size) => (
                    <figure key={`${st}-${size}`} className="fd-av-cell">
                      <Avatar user={who} size={size} shape={shape} status={st} image={size === "xxl"} focus={hold} />
                      <figcaption>{st === "none" ? "no badge" : st} · {size}</figcaption>
                    </figure>
                  )),
                )}
              </div>
            ))}
          </div>

          <div className="fd-create-pane fd-av-pane">
            <div className="fd-create-pane-label">Roster · each fill follows the user's colour</div>
            {shapes.map((shape) => (
              <div key={shape} className="fd-av-row">
                {users.map((u, i) => (
                  <figure key={u.name} className="fd-av-cell">
                    <Avatar user={u} size="xl" shape={shape} image={!!u.image} focus={hold} status={i === 1 ? "attention" : i === 2 ? "running" : "none"} />
                    <figcaption>{u.name.split(" ")[0]} · {u.colour.replace(/^--/, "")}</figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>

        <aside className="fd-create-panel">
          <div className="fd-eyebrow">Fill · from the user's colour</div>
          <Select label="Fill" value={m.fillMode} onChange={(v) => set("fillMode", v)} options={[
            { value: "paired", label: "paired gradient — mirrors the Composer focus fill" },
            { value: "tonal", label: "tonal gradient — the user's colour only" },
            { value: "tint", label: "flat tint — today's avatar" },
            { value: "glass", label: "glass — no colour" },
          ]} />
          <Select label="Paired with" value={m.pairWith} onChange={(v) => set("pairWith", v)} options={tokenOptions([...groups.identity, ...groups.colour])} disabled={m.fillMode !== "paired"} />
          <Slider label="Balance · the user's colour dominates →" value={m.balance} min={50} max={95} onChange={(v) => set("balance", v)} disabled={m.fillMode !== "paired" && m.fillMode !== "tonal"} title="Midpoint of the blend. 50 is the Composer's even split." />
          <div className="fd-field-row">
            <Slider label="User colour" value={m.primaryStrength} min={4} max={60} onChange={(v) => set("primaryStrength", v)} disabled={m.fillMode === "glass"} />
            <Slider label="Second colour" value={m.secondaryStrength} min={0} max={40} onChange={(v) => set("secondaryStrength", v)} disabled={m.fillMode !== "paired" && m.fillMode !== "tonal"} />
          </div>
          <Select label="Over glass" value={m.overGlass} onChange={(v) => set("overGlass", v)} options={[{ value: "yes", label: "yes — on --nc-glass-bg" }, { value: "no", label: "no — colour alone" }]} disabled={m.fillMode === "glass"} />

          <hr className="fd-hr" />
          <div className="fd-eyebrow">Edge and depth</div>
          <Select label="Edge" value={m.edge} onChange={(v) => set("edge", v)} options={tokenOptions(groups.edge, [{ value: "none", label: "none" }])} />
          <Slider label="Thickness" value={m.edgeWidth} min={0} max={3} step={0.25} unit="px" onChange={(v) => set("edgeWidth", v)} disabled={m.edge === "none"} />
          <div className="fd-field-row">
            <Slider label="Intensity" value={m.edgeIntensity} min={0} max={400} step={10} onChange={(v) => set("edgeIntensity", v)} disabled={m.edge === "none"} title="Multiplies the edge token's opacity; 100% is the token as declared" />
            <Slider label="Blur" value={m.edgeBlur} min={0} max={4} step={0.25} unit="px" onChange={(v) => set("edgeBlur", v)} disabled={m.edge === "none"} />
          </div>
          <Select label="Elevation" value={m.elevation} onChange={(v) => set("elevation", v)} options={tokenOptions(groups.elevation, [{ value: "none", label: "none" }])} />
          <Select label="Square corner" value={m.squareRadius} onChange={(v) => set("squareRadius", v)} options={[
            { value: "30%", label: "30% — today's agent avatar" }, { value: "25%", label: "25%" }, { value: "20%", label: "20%" },
            ...groups.radius.map((t) => ({ value: t.name, label: `${t.name} (${t.resolved})` })),
          ]} />

          <hr className="fd-hr" />
          <div className="fd-eyebrow">Initials · when there is no picture</div>
          <Select label="Font" value={m.font} onChange={(v) => set("font", v)} options={groups.font.map((t) => ({ value: t.name, label: `${t.name} (${(t.resolved || t.fallback || "").replace(/,.*$/, "")})` }))} />
          <div className="fd-field-row">
            <Select label="Weight" value={m.weight} onChange={(v) => set("weight", v)} options={[{ value: "500", label: "500" }, { value: "600", label: "600" }, { value: "700", label: "700" }]} />
            <Select label="Size" value={m.textSize} onChange={(v) => set("textSize", v)} options={[{ value: "recipe", label: "per size (today)" }, { value: "proportional", label: "proportional" }]} />
          </div>
          <Slider label="Letter size · % of the avatar" value={m.textScale} min={20} max={70} onChange={(v) => set("textScale", v)} disabled={m.textSize !== "proportional"} />
          <Select label="Colour" value={m.textColour} onChange={(v) => set("textColour", v)} options={tokenOptions(groups.colour, [{ value: "user", label: "the user's colour" }])} />

          <hr className="fd-hr" />
          <div className="fd-eyebrow">Picture · when there is one</div>
          <Slider label="Margin inside the frame" value={m.imageInset} min={0} max={25} onChange={(v) => set("imageInset", v)} />
          <Select label="Fit" value={m.imageFit} onChange={(v) => set("imageFit", v)} options={[{ value: "cover", label: "cover — fills, may crop" }, { value: "contain", label: "contain — whole picture" }]} />

          <hr className="fd-hr" />
          <div className="fd-eyebrow">Focus · the only state</div>
          <Select label="Edge on focus" value={m.focusEdge} onChange={(v) => set("focusEdge", v)} options={tokenOptions(groups.edge, [{ value: "none", label: "none — keeps the edge" }])} />
          <div className="fd-field-row">
            <Select label="Glow on focus" value={m.focusGlow} onChange={(v) => set("focusGlow", v)} options={tokenOptions(groups.glow, [{ value: "none", label: "none" }])} />
            <Select label="Spread" value={m.focusGlowSize} onChange={(v) => set("focusGlowSize", v)} options={[{ value: "12", label: "12px" }, { value: "18", label: "18px" }, { value: "20", label: "20px" }]} disabled={m.focusGlow === "none"} />
          </div>
          <Select label="Feather on focus" value={m.focusFeather} onChange={(v) => set("focusFeather", v)} options={[{ value: "on", label: "on — --nc-feather-fill" }, { value: "off", label: "off" }]} />
          <Select label="Keyboard ring" value={m.focusRing} onChange={(v) => set("focusRing", v)} options={[{ value: "material", label: "material only" }, { value: "outline", label: "plus a 2px outline" }]} />

          <hr className="fd-hr" />
          <div className="fd-eyebrow">Badge</div>
          <div className="fd-field-row">
            <Select label="Attention" value={m.attention} onChange={(v) => set("attention", v)} options={tokenOptions(groups.colour)} />
            <Select label="Running" value={m.running} onChange={(v) => set("running", v)} options={tokenOptions(groups.colour)} />
          </div>
          <div className="fd-field-row">
            <Select label="Size" value={m.badgeSize} onChange={(v) => set("badgeSize", v)} options={[{ value: "24", label: "24% of avatar" }, { value: "28", label: "28%" }, { value: "34", label: "34%" }]} />
            <Select label="Mark" value={m.badgeGlyph} onChange={(v) => set("badgeGlyph", v)} options={[{ value: "dot", label: "dot" }, { value: "glyph", label: "icon — ! and spinner" }]} />
          </div>
          <Select label="Cutout ring" value={m.badgeRing} onChange={(v) => set("badgeRing", v)} options={tokenOptions(groups.surface)} title="Matches the surface the avatar sits on" />
          <button type="button" className="fd-link" onClick={() => setM(AVATAR_BASELINE)} disabled={!changed}>Reset to the header material</button>

          <hr className="fd-hr" />
          <div className="fd-eyebrow">Preview</div>
          <Select label="Show sizes for" value={String(subject)} onChange={(v) => setSubject(Number(v))} options={users.map((u, i) => ({ value: String(i), label: u.name }))} />
          <label className="fd-check"><input type="checkbox" checked={hold} onChange={(e) => setHold(e.target.checked)} /> Hold focus on every avatar</label>
          <div className="fd-eyebrow" style={{ marginTop: 8 }}>User colours</div>
          {users.map((u, i) => (
            <Select key={u.name} label={u.name} value={u.colour} onChange={(v) => setUsers((p) => p.map((x, j) => (j === i ? { ...x, colour: v } : x)))} options={tokenOptions(groups.identity.length ? groups.identity : groups.colour)} />
          ))}
        </aside>
      </div>

      <div className="fd-create-recipe">
        <div className="fd-comp-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="fd-eyebrow">Generated recipe</div>
            <h2 className="fd-h2" style={{ margin: "4px 0 0" }}>Panda slot recipe · Avatar + AvatarBadge</h2>
          </div>
          <div className="fd-field-row" style={{ alignItems: "flex-end" }}>
            <label className="fd-field">Name
              <input className="fd-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. nc-avatar" />
            </label>
            <button type="button" className="fd-btn" onClick={() => void navigator.clipboard?.writeText(generated)}>Copy</button>
            <button type="button" className="fd-btn fd-btn-primary" onClick={() => void save()}>Save avatar</button>
          </div>
        </div>
        {status && <p className="fd-status" role="status">{status}</p>}
        <pre className="fd-code"><code>{generated}</code></pre>
        {saved.length > 0 && (
          <>
            <div className="fd-eyebrow" style={{ marginTop: 16 }}>Saved avatars · {saved.length}</div>
            <div className="fd-saved">
              {saved.map((d) => (
                <button type="button" key={d.slug} className="fd-saved-item" onClick={() => { if (d.material) { setM(withDefaults(d.material)); setName(d.name.replace(/^avatar /, "")); } }}>
                  <div className="fd-saved-name">{d.name.replace(/^avatar /, "")}</div>
                  <div className="fd-muted"><code>foundry-drafts/{d.slug}.json</code></div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
