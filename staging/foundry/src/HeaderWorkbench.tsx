import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Composer } from "@caelos/ui";
import { ApprovedChatHeader } from "@caelos/header";
import { agentAvatarSizes, approvedHeaderLayout, approvedHeaderMotion } from "@caelos/header-layout";
import { readTokens, type Token } from "./tokens";

/**
 * Create · Conversation header.
 *
 * Geometry and motion were approved on 2026-09-20 (the 23:19 screenshot) and are LOCKED: this
 * workbench renders the approved header itself and never exposes a control for them. Material is
 * the open surface — it was deliberately excluded from the approved configuration.
 *
 * Every material control offers existing tokens only, read from the live stylesheet. The live
 * preview and the generated Panda recipe are both produced from ONE style object, so the recipe
 * written out is exactly what is on screen.
 */

type Feather = "off" | "reveal" | "always";
export interface HeaderMaterial {
  fill: string;
  edge: string;
  elevation: string;
  glow: string;
  glowSize: "12" | "18";
  blur: string;
  texture: "none" | "graph";
  feather: Feather;
}

/** The approved study's Composer-material proposal, expressed in the same terms. */
export const COMPOSER_MATERIAL: HeaderMaterial = {
  fill: "--il-fill",
  // Verified in the render: the approved glass carries a 1px --il-edge border.
  edge: "--il-edge",
  elevation: "literal:card-lifted",
  glow: "none",
  glowSize: "18",
  blur: "none",
  texture: "none",
  feather: "off",
};

/** The one value in the current material that is not a token — kept so the baseline reproduces exactly. */
const LITERALS: Record<string, { label: string; value: string }> = {
  "literal:card-lifted": { label: "card lifted shadow — literal, not a token", value: "0 12px 30px #00000015" },
};

type Styles = Record<string, string | Record<string, string>>;

/** The single source for both the preview CSS and the generated recipe. */
export function glassStyles(m: HeaderMaterial): Styles {
  const out: Styles = {};
  const graph =
    "linear-gradient(var(--nc-graph-line) 1px,transparent 1px),linear-gradient(90deg,var(--nc-graph-line) 1px,transparent 1px)";
  const fill = m.fill === "none" ? "transparent" : `var(${m.fill})`;
  out.background = m.texture === "graph" ? `${graph},${fill}` : fill;
  if (m.texture === "graph") out.backgroundSize = "var(--nc-graph-size) var(--nc-graph-size),var(--nc-graph-size) var(--nc-graph-size),auto";
  out.border = m.edge === "none" ? "0" : `1px solid var(${m.edge})`;
  const shadows: string[] = [];
  if (m.elevation !== "none") shadows.push(LITERALS[m.elevation]?.value ?? `var(${m.elevation})`);
  if (m.glow !== "none") shadows.push(`0 0 ${m.glowSize}px var(${m.glow})`);
  out.boxShadow = shadows.length ? shadows.join(",") : "none";
  out.backdropFilter = m.blur === "none" ? "none" : `blur(var(${m.blur})) saturate(140%)`;
  if (m.feather !== "off") {
    out["&::before"] = {
      content: '""',
      position: "absolute",
      inset: "0",
      borderRadius: "inherit",
      pointerEvents: "none",
      background: "var(--nc-feather-fill)",
      filter: "blur(var(--nc-feather-blur))",
      // `--reveal` is driven by the approved header motion; the feather follows it, never re-times it.
      opacity: m.feather === "reveal" ? "var(--reveal, 0)" : "1",
    };
  }
  return out;
}

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function toCss(selector: string, styles: Styles): string {
  const own: string[] = [];
  const nested: string[] = [];
  for (const [k, v] of Object.entries(styles)) {
    if (typeof v === "string") own.push(`  ${kebab(k)}: ${v};`);
    else nested.push(toCss(k.replace(/&/g, selector), v));
  }
  return [`${selector} {\n${own.join("\n")}\n}`, ...nested].join("\n");
}

function toRecipe(name: string, m: HeaderMaterial): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "draft";
  const styles = glassStyles(m);
  const lines = (o: Styles, depth: number): string =>
    Object.entries(o)
      .map(([k, v]) => {
        const pad = "  ".repeat(depth);
        const key = /^[a-zA-Z]+$/.test(k) ? k : JSON.stringify(k);
        return typeof v === "string" ? `${pad}${key}: ${JSON.stringify(v)},` : `${pad}${key}: {\n${lines(v, depth + 1)}\n${pad}},`;
      })
      .join("\n");
  const literal = Object.values(m).filter((v) => String(v).startsWith("literal:"));
  return [
    `// Proposed material for the conversation header — staged from the Caelos Foundry, NOT applied.`,
    `// Geometry and motion are the approved 2026-09-20 baseline and are not touched here.`,
    `// Add under \`variants.material\` in staging/ui-react19/src/conversation-header-recipe.ts,`,
    `// then render the header with material="${slug}".`,
    ...(literal.length ? [`// NOTE: uses a literal that is not a token (${literal.join(", ")}). Consider tokenising it.`] : []),
    `material: {`,
    `  ${JSON.stringify(slug)}: {`,
    `    glass: {`,
    lines(styles, 3),
    `    },`,
    `  },`,
    `},`,
  ].join("\n");
}

/* ─── UI ─── */

const PARTICIPANTS = ["Caelos", "Athena", "Hermes", "Nova", "Apollo", "Iris"];

function TokenSelect({ label, value, onChange, options, extra = [] }: { label: string; value: string; onChange: (v: string) => void; options: Token[]; extra?: { value: string; label: string }[] }) {
  return (
    <label className="fd-field">
      {label}
      <select className="fd-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {extra.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        {options.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
      </select>
    </label>
  );
}

type SavedMaterial = { name: string; slug?: string; kind?: string; recipe?: string; material?: HeaderMaterial; savedAt?: string };

export function HeaderWorkbench({ scope, themeKey }: { scope: HTMLElement | null; themeKey: string }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  useEffect(() => { if (scope) setTokens(readTokens(scope)); }, [scope, themeKey]);

  const [material, setMaterial] = useState<HeaderMaterial>(COMPOSER_MATERIAL);
  const [mode, setMode] = useState<"draft" | "approved" | "compare">("compare");
  const [count, setCount] = useState(3);
  const [title, setTitle] = useState("Turning the Foundry into a design partner");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState<SavedMaterial[]>([]);
  const set = <K extends keyof HeaderMaterial>(k: K, v: HeaderMaterial[K]) => setMaterial((m) => ({ ...m, [k]: v }));

  const groups = useMemo(() => {
    const by = (g: string) => tokens.filter((t) => t.group === g && !t.hostSupplied);
    const colour = by("Colour");
    return {
      fill: [...by("Fill & gradient"), ...colour],
      edge: colour.filter((t) => /edge|line|hair|border|ink|muted|dim/.test(t.name)),
      glow: by("Glow"),
      elevation: tokens.filter((t) => /^--sys-elev-\d/.test(t.name)),
      blur: tokens.filter((t) => /blur/.test(t.name) && !/feather/.test(t.name)),
    };
  }, [tokens]);

  const loadSaved = useCallback(async () => {
    const r = await fetch("/__foundry/drafts");
    if (r.ok) setSaved(((await r.json()) as SavedMaterial[]).filter((d) => d.kind === "recipe" && d.recipe === "conversationHeader"));
  }, []);
  useEffect(() => { void loadSaved(); }, [loadSaved]);

  const css = toCss(`.fd-create [data-material="draft"] .caelos-conversation-header__glass`, glassStyles(material));
  const recipe = toRecipe(name || "draft", material);
  const changed = JSON.stringify(material) !== JSON.stringify(COMPOSER_MATERIAL);

  const save = async () => {
    if (!name.trim()) { setStatus("Name the material first."); return; }
    const body = { name: `conversation-header ${name}`, kind: "recipe", recipe: "conversationHeader", slot: "glass", material, styles: glassStyles(material), generated: recipe, backdrop: { layer: "ground", texture: "auto" }, elements: [] };
    const r = await fetch("/__foundry/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { setStatus(`Save failed: ${await r.text()}`); return; }
    const out = await r.json();
    setStatus(`Saved to foundry-drafts/${out.slug}.json — staged, not applied.`);
    void loadSaved();
  };

  const participants = PARTICIPANTS.slice(0, count).map((n) => ({ name: n, contextPercent: 42, status: "Ready" }));
  const pane = (which: "draft" | "composer", label: string) => (
    <div className="fd-create-pane" data-conversation-pane>
      <div className="fd-create-pane-label">{label}</div>
      <ApprovedChatHeader
        material={which}
        title={title}
        shape="capsule"
        owner={`foundry-create-${which}`}
        participants={participants}
        linkedWork={<span>No linked project · No work item</span>}
        chatId="Foundry conversation"
      />
      <div className="fd-create-spacer">Conversation space</div>
      <div className="nova-chat-composer fd-create-composer">
        <Composer value="" onValueChange={() => {}} onSend={() => {}} label={`${label} composer`} model="Fixture model" models={["Fixture model"]} onModelChange={() => {}} reasoning="Medium" reasoningLevels={["Low", "Medium", "High"]} onReasoningChange={() => {}} replyFormat="text" onReplyFormatChange={() => {}} />
      </div>
    </div>
  );

  return (
    <section className="fd-component fd-create">
      <style>{css}</style>
      <header className="fd-comp-head">
        <div>
          <div className="fd-eyebrow">Create</div>
          <h1 className="fd-h1">Conversation header</h1>
          <p className="fd-muted">
            The approved Atlas 2 header — geometry and motion locked 2026-09-20. Material is open: every control below offers existing tokens only, and the recipe on the right is generated from exactly what you see.
          </p>
        </div>
        <div className="fd-segment" role="group" aria-label="Preview">
          {([["compare", "Compare"], ["draft", "Draft"], ["approved", "Approved"]] as const).map(([v, l]) => (
            <button key={v} type="button" className={`fd-seg ${mode === v ? "is-on" : ""}`} aria-pressed={mode === v} onClick={() => setMode(v)}>{l}</button>
          ))}
        </div>
      </header>

      <div className="fd-create-grid">
        <div className="fd-create-stages">
          {mode !== "approved" && pane("draft", changed ? "Draft material" : "Draft (unchanged — matches approved)")}
          {mode !== "draft" && pane("composer", "Approved · Composer material")}
        </div>

        <aside className="fd-create-panel">
          <div className="fd-eyebrow">Material · glass layer</div>
          <TokenSelect label="Fill" value={material.fill} onChange={(v) => set("fill", v)} options={groups.fill} extra={[{ value: "none", label: "none" }]} />
          <TokenSelect label="Edge (1px)" value={material.edge} onChange={(v) => set("edge", v)} options={groups.edge} extra={[{ value: "none", label: "none" }]} />
          <TokenSelect label="Elevation" value={material.elevation} onChange={(v) => set("elevation", v)} options={groups.elevation}
            extra={[{ value: "none", label: "none" }, ...Object.entries(LITERALS).map(([value, l]) => ({ value, label: l.label }))]} />
          <div className="fd-field-row">
            <TokenSelect label="Glow" value={material.glow} onChange={(v) => set("glow", v)} options={groups.glow} extra={[{ value: "none", label: "none" }]} />
            <label className="fd-field">Spread
              <select className="fd-input" value={material.glowSize} onChange={(e) => set("glowSize", e.target.value as "12" | "18")} disabled={material.glow === "none"}>
                <option value="12">12px</option>
                <option value="18">18px</option>
              </select>
            </label>
          </div>
          <TokenSelect label="Backdrop blur" value={material.blur} onChange={(v) => set("blur", v)} options={groups.blur} extra={[{ value: "none", label: "none" }]} />
          <label className="fd-field" title="--nc-graph-line / --nc-graph-size">Texture
            <select className="fd-input" value={material.texture} onChange={(e) => set("texture", e.target.value as "none" | "graph")}>
              <option value="none">none</option>
              <option value="graph">graph paper</option>
            </select>
          </label>
          <label className="fd-field">Feather · --nc-feather-fill
            <select className="fd-input" value={material.feather} onChange={(e) => set("feather", e.target.value as Feather)}>
              <option value="off">off</option>
              <option value="reveal">follows the reveal motion</option>
              <option value="always">always on</option>
            </select>
          </label>
          <button type="button" className="fd-link" onClick={() => setMaterial(COMPOSER_MATERIAL)} disabled={!changed}>Reset to approved material</button>

          <hr className="fd-hr" />
          <div className="fd-eyebrow">Preview</div>
          <div className="fd-field-row">
            <label className="fd-field">Participants
              <select className="fd-input" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <label className="fd-field">Title
            <input className="fd-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <hr className="fd-hr" />
          <div className="fd-eyebrow">Locked · approved 2026-09-20</div>
          <dl className="fd-dl fd-locked">
            <dt>Width</dt><dd>{approvedHeaderLayout.restPercent}% rest → {approvedHeaderLayout.expandedPercent}% expanded, of Composer</dd>
            <dt>Density</dt><dd>{approvedHeaderLayout.density}</dd>
            <dt>Split</dt><dd>gap {approvedHeaderLayout.split.gap} · cushion {approvedHeaderLayout.split.cushion} · text {approvedHeaderLayout.split.minText}–{approvedHeaderLayout.split.maxText}px</dd>
            <dt>Insets</dt><dd>space-{approvedHeaderLayout.spacing.block} / {approvedHeaderLayout.spacing.leading} / {approvedHeaderLayout.spacing.trailing} · gap space-{approvedHeaderLayout.spacing.gap} · curve {approvedHeaderLayout.curveCompensation}%</dd>
            <dt>Avatars</dt><dd>XL {agentAvatarSizes.xl}px · XXL {agentAvatarSizes.xxl}px</dd>
            <dt>Motion</dt><dd>spring {approvedHeaderMotion.split.stiffness}/{approvedHeaderMotion.split.damping} · disclosure {approvedHeaderMotion.disclosure.duration * 1000}ms · reveal {approvedHeaderMotion.titleReveal.duration * 1000}ms · collapse {approvedHeaderMotion.titleCollapse.duration * 1000}ms</dd>
          </dl>
          <p className="fd-muted fd-note">Read live from <code>header-layout.ts</code> — not editable here.</p>
        </aside>
      </div>

      <div className="fd-create-recipe">
        <div className="fd-comp-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="fd-eyebrow">Generated recipe</div>
            <h2 className="fd-h2" style={{ margin: "4px 0 0" }}>Panda material variant</h2>
          </div>
          <div className="fd-field-row" style={{ alignItems: "flex-end" }}>
            <label className="fd-field">Material name
              <input className="fd-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. layered sage glass" />
            </label>
            <button type="button" className="fd-btn" onClick={() => void navigator.clipboard?.writeText(recipe)}>Copy</button>
            <button type="button" className="fd-btn fd-btn-primary" onClick={() => void save()}>Save material</button>
          </div>
        </div>
        {status && <p className="fd-status" role="status">{status}</p>}
        <pre className="fd-code"><code>{recipe}</code></pre>
        {saved.length > 0 && (
          <>
            <div className="fd-eyebrow" style={{ marginTop: 16 }}>Saved materials · {saved.length}</div>
            <div className="fd-saved">
              {saved.map((d) => (
                <button type="button" key={d.slug} className="fd-saved-item" onClick={() => { if (d.material) { setMaterial(d.material); setName(d.name.replace(/^conversation-header /, "")); } }}>
                  <div className="fd-saved-name">{d.name.replace(/^conversation-header /, "")}</div>
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
