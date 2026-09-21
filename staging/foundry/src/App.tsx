import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CaelosProvider, Surface } from "@caelos/ui";
import {
  inventory,
  taskgraphAvailable,
  taskgraphOnly,
  taskgraphReason,
  toCallProps,
  totals,
  type RecipeInfo,
} from "./inventory";
import { readTokens, TOKEN_GROUPS, tokensForClasses, type Token } from "./tokens";
import { HeaderWorkbench } from "./HeaderWorkbench";
import { childMarkup, duplicateOf, fingerprint, FingerprintScope, useDistinctCount, useFingerprintRegistry } from "./fidelity";

type View = "create" | "components" | "tokens" | "drafts" | "proposals";
type Variants = Record<string, string>;
type Pick = { recipe: string; variants: Variants };

const LAYERS = ["ground", "chrome", "elevated", "elevated-2", "top"] as const;
const TEXTURES = [
  { value: "graph", label: "Paper" },
  { value: "glass", label: "Glass" },
  { value: "plain", label: "Plain" },
  { value: "auto", label: "Auto (ships)" },
] as const;

const byName = new Map(inventory.map((r) => [r.name, r]));

/* ─── Rename proposals: staged to a file, never applied to source ─── */

type Proposal = { key: string; kind: string; current: string; proposed: string; recipe?: string; note?: string; proposedAt?: string };
type NamesApi = { all: Proposal[]; get: (key: string) => Proposal | undefined; save: (p: Proposal) => Promise<void>; remove: (key: string) => Promise<void> };
const NamesCtx = createContext<NamesApi>({ all: [], get: () => undefined, save: async () => {}, remove: async () => {} });

function NamesProvider({ children }: { children: React.ReactNode }) {
  const [all, setAll] = useState<Proposal[]>([]);
  useEffect(() => {
    fetch("/__foundry/names").then((r) => (r.ok ? r.json() : [])).then(setAll).catch(() => setAll([]));
  }, []);
  const byKey = useMemo(() => new Map(all.map((p) => [p.key, p])), [all]);
  const send = async (method: "POST" | "DELETE", body: unknown) => {
    const r = await fetch("/__foundry/names", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) setAll(await r.json());
  };
  const api: NamesApi = {
    all,
    get: (k) => byKey.get(k),
    save: (p) => send("POST", p),
    remove: (key) => send("DELETE", { key }),
  };
  return <NamesCtx.Provider value={api}>{children}</NamesCtx.Provider>;
}

/** Shows the current name, or current → proposed. Click the pencil to propose; Enter or click away stages it, Esc cancels. */
function NameEditor({ nameKey, kind, current, recipe, mono = false }: { nameKey: string; kind: string; current: string; recipe?: string; mono?: boolean }) {
  const { get, save } = useContext(NamesCtx);
  const staged = get(nameKey);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(staged?.proposed ?? current);
  useEffect(() => { if (!editing) setValue(staged?.proposed ?? current); }, [staged?.proposed, current, editing]);
  const commit = () => {
    setEditing(false);
    const next = value.trim();
    if (next === (staged?.proposed ?? current)) return;
    void save({ key: nameKey, kind, current, proposed: next === current ? "" : next, recipe });
  };
  const Label = mono ? "code" : "span";
  if (editing) {
    return (
      <input
        autoFocus
        className={`fd-rename-input ${mono ? "is-mono" : ""}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") { setValue(staged?.proposed ?? current); setEditing(false); }
        }}
        aria-label={`Propose a new name for ${current}`}
      />
    );
  }
  return (
    <span className="fd-name">
      {staged ? (
        <>
          <Label className="fd-name-old">{current}</Label>
          <span className="fd-arrow" aria-hidden>→</span>
          <Label className="fd-name-new" title="Staged proposal — not applied">{staged.proposed}</Label>
        </>
      ) : (
        <Label>{current}</Label>
      )}
      <button type="button" className="fd-pencil" onClick={() => setEditing(true)} aria-label={`Propose a new name for ${current}`} title="Propose a new name">✎</button>
    </span>
  );
}

function ProposalsView() {
  const { all, remove } = useContext(NamesCtx);
  const order = ["recipe", "axis", "value", "slot", "token"];
  const sorted = [...all].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.key.localeCompare(b.key));
  return (
    <section className="fd-component">
      <header className="fd-comp-head">
        <div>
          <div className="fd-eyebrow">Proposals</div>
          <h1 className="fd-h1">{all.length} staged rename{all.length === 1 ? "" : "s"}</h1>
          <p className="fd-muted">
            Written to <code>foundry-proposals/names.json</code> at the repo root. Nothing here has touched source — an agent reads this file and implements the renames as a reviewed change.
          </p>
        </div>
      </header>
      {sorted.length === 0 ? (
        <p className="fd-muted">No renames staged. Use the ✎ next to any recipe, axis, variant, slot or token name.</p>
      ) : (
        <div className="fd-token-table">
          {sorted.map((p) => (
            <div key={p.key} className="fd-proposal-row">
              <span className="fd-badge">{p.kind}</span>
              <code className="fd-name-old">{p.current}</code>
              <span className="fd-arrow">→</span>
              <code className="fd-name-new">{p.proposed}</code>
              <span className="fd-muted fd-trunc">{p.recipe ? `in ${p.recipe}` : ""}</span>
              <button type="button" className="fd-link" onClick={() => void remove(p.key)}>Withdraw</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Specimen: renders a recipe from its own className output, nothing hand-styled ─── */

/** Rendering hints only — which HTML element a class needs to be meaningful. Not inventory. */
function StandardElement({ info, variants, className, label }: { info: RecipeInfo; variants: Variants; className: string; label: string }) {
  const kind = variants.kind;
  if (info.name === "button") return <button type="button" className={className}>{label}</button>;
  if (info.name === "foundation") {
    if (kind === "range") return <input type="range" defaultValue={40} className={className} aria-label="range specimen" />;
    if (kind === "checkbox") return <input type="checkbox" defaultChecked className={className} aria-label="checkbox specimen" />;
    if (kind === "progress") return <progress value={62} max={100} className={className} />;
    if (kind === "separator") return <div className={className} style={{ width: 140 }} />;
    if (kind === "dot") return <span className={className} />;
    return <div className={className} style={{ padding: 12 }}>{label}</div>;
  }
  if (info.name === "surface") return <div className={className} style={{ minHeight: 64, minWidth: 140, padding: 12, borderRadius: 12 }}>{label}</div>;
  if (info.name === "typography") return <span className={className}>The quick brown fox</span>;
  if (info.name === "avatar") return <span className={className}>DE</span>;
  if (info.name === "chip") return <span className={className}>{label}</span>;
  // Recipes that paint required children (rippleLoader: nine `> i` cells) get them, read from their CSS.
  const kids = childMarkup(className.split(/\s+/)[0]);
  if (kids) return <div className={className} aria-label={label}>{Array.from({ length: kids.count }, (_, i) => React.createElement(kids.tag, { key: i }))}</div>;
  return <div className={className}>{label}</div>;
}

function Specimen({ info, variants, label }: { info: RecipeInfo; variants: Variants; label?: string }) {
  const out = info.fn(toCallProps(variants));
  const text = label ?? info.name;
  if (typeof out === "string") return <StandardElement info={info} variants={variants} className={out} label={text} />;
  const entries = Object.entries(out);
  const root = entries.find(([k]) => k === "root") ?? entries[0];
  return (
    <div className={root[1]} data-slot-root={root[0]}>
      {entries
        .filter(([k]) => k !== root[0])
        .map(([k, c]) => (
          <div key={k} className={c} data-slot={k}>
            {k}
          </div>
        ))}
    </div>
  );
}

const classesOf = (info: RecipeInfo, variants: Variants): string[] => {
  const out = info.fn(toCallProps(variants));
  const joined = typeof out === "string" ? out : Object.values(out).join(" ");
  return joined.split(/\s+/).filter(Boolean);
};

/* ─── Provenance ─── */

function Provenance({ pick, scope, onClose, onMatrix }: { pick: Pick; scope: HTMLElement | null; onClose: () => void; onMatrix: () => void }) {
  const info = byName.get(pick.recipe)!;
  const { __slot: slot, ...variants } = pick.variants;
  const classes = slot ? String((info.fn(toCallProps(variants)) as Record<string, string>)[slot] ?? "").split(/\s+/).filter(Boolean) : classesOf(info, variants);
  const tokens = scope ? tokensForClasses(classes, scope) : [];
  return (
    <aside className="fd-provenance" aria-label="Provenance">
      <div className="fd-prov-head">
        <div>
          <div className="fd-eyebrow">Provenance</div>
          <div className="fd-prov-title">{info.name}</div>
        </div>
        <button type="button" className="fd-link" onClick={onClose}>Close</button>
      </div>
      <dl className="fd-dl">
        <dt>Recipe</dt>
        <dd><code>{info.name}</code> · {info.kind === "slot" ? "slot recipe" : "recipe"}{slot ? <> · slot <code>{slot}</code></> : null}</dd>
        <dt>Tracks</dt>
        <dd>{info.tracks.map((t) => <TrackBadge key={t} track={t} />)}</dd>
        <dt>Variants</dt>
        <dd>
          {Object.keys(variants).length === 0 ? <em>none</em> : Object.entries(variants).map(([k, v]) => (
            <div key={k}><code>{k}</code> = <code>{v}</code>{info.defaults[k] === v ? <span className="fd-muted"> (default)</span> : null}</div>
          ))}
        </dd>
        <dt>Classes</dt>
        <dd className="fd-classes">{classes.map((c) => <code key={c}>{c}</code>)}</dd>
      </dl>
      <div className="fd-eyebrow" style={{ marginTop: 16 }}>Tokens it resolves · {tokens.length}</div>
      <ul className="fd-token-list">
        {tokens.map((t) => (
          <li key={t.name}>
            <Swatch name={t.name} resolved={t.resolved} />
            <code>{t.name}</code>
            <span className="fd-muted fd-trunc" title={t.resolved}>{t.resolved || "—"}</span>
          </li>
        ))}
        {tokens.length === 0 && <li className="fd-muted">No custom properties referenced.</li>}
      </ul>
      <button type="button" className="fd-btn" onClick={onMatrix} style={{ marginTop: 16 }}>
        See it on every surface
      </button>
    </aside>
  );
}

function TrackBadge({ track }: { track: "chat" | "taskgraph" }) {
  return <span className={`fd-badge fd-badge-${track}`}>{track === "chat" ? "Chat · React 19" : "Task graph · React 18"}</span>;
}

function Swatch({ name, resolved }: { name: string; resolved: string }) {
  const v = resolved.toLowerCase();
  if (name.includes("glow")) return <span className="fd-swatch" style={{ boxShadow: `0 0 12px 2px var(${name})`, background: "var(--il-surface)" }} />;
  if (v.includes("gradient") || CSS.supports("color", resolved) || CSS.supports("background", resolved)) {
    if (CSS.supports("color", resolved) || v.includes("gradient")) return <span className="fd-swatch" style={{ background: `var(${name})` }} />;
  }
  if (name.includes("elev") || name.includes("shadow")) return <span className="fd-swatch" style={{ boxShadow: `var(${name})`, background: "var(--sys-elevated)" }} />;
  return <span className="fd-swatch fd-swatch-empty" />;
}

/* ─── Surface matrix: one specimen on every layer × material ─── */

function SurfaceMatrix({ pick, onClose }: { pick: Pick; onClose: () => void }) {
  const info = byName.get(pick.recipe)!;
  const { __slot: slot, ...variants } = pick.variants;
  const body = slot
    ? <div className={(info.fn(toCallProps(variants)) as Record<string, string>)[slot]} data-slot={slot}>{slot}</div>
    : <Specimen info={info} variants={variants} />;
  return (
    <div className="fd-overlay" role="dialog" aria-label="Surface matrix">
      <div className="fd-matrix-panel">
        <div className="fd-prov-head">
          <div>
            <div className="fd-eyebrow">Surface matrix</div>
            <div className="fd-prov-title">{info.name}{slot ? ` · ${slot}` : ""} on every layer × material</div>
          </div>
          <button type="button" className="fd-link" onClick={onClose}>Close</button>
        </div>
        <div className="fd-matrix" style={{ gridTemplateColumns: `120px repeat(${TEXTURES.length}, minmax(0, 1fr))` }}>
          <div />
          {TEXTURES.map((t) => <div key={t.value} className="fd-matrix-col">{t.label}</div>)}
          {LAYERS.map((layer) => (
            <React.Fragment key={layer}>
              <div className="fd-matrix-row"><code>{layer}</code></div>
              {TEXTURES.map((t) => (
                <Surface key={t.value} layer={layer} texture={t.value} className="fd-matrix-cell">
                  {body}
                </Surface>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Components view ─── */

function ComponentView({ info, onPick }: { info: RecipeInfo; onPick: (p: Pick) => void }) {
  const [all, setAll] = useState(false);
  const canAll = info.kind === "standard" && info.combinations <= 64 && info.axes.length > 1;
  const combos = useMemo(() => {
    if (!all || !canAll) return [];
    let acc: Variants[] = [{}];
    for (const a of info.axes) acc = acc.flatMap((c) => a.values.map((v) => ({ ...c, [a.name]: v })));
    return acc;
  }, [all, canAll, info]);

  return (
    <section className="fd-component" aria-labelledby="fd-recipe-title">
      <header className="fd-comp-head">
        <div>
          <div className="fd-eyebrow">{info.kind === "slot" ? "Slot recipe" : "Recipe"}</div>
          <h1 id="fd-recipe-title" className="fd-h1"><NameEditor nameKey={`recipe:${info.name}`} kind="recipe" current={info.name} /></h1>
          <div className="fd-badges">{info.tracks.map((t) => <TrackBadge key={t} track={t} />)}</div>
        </div>
        <div className="fd-stats">
          <div><b>{info.axes.length}</b> axes</div>
          <div><b>{info.combinations}</b> combinations</div>
          {info.kind === "slot" && <div><b>{info.slots.length}</b> slots</div>}
        </div>
      </header>

      {info.delta.length > 0 && (
        <div className="fd-delta" role="note">
          <div className="fd-eyebrow">Differs between tracks</div>
          <ul>{info.delta.map((d) => <li key={d} dangerouslySetInnerHTML={{ __html: d.replace(/`([^`]+)`/g, "<code>$1</code>") }} />)}</ul>
        </div>
      )}

      {info.kind === "slot" ? (
        <SlotAnatomy info={info} onPick={onPick} />
      ) : (
        <StandardVariants info={info} onPick={onPick} />
      )}

      {canAll && !(info.axes.length === 2) && (
        <div className="fd-axis">
          <button type="button" className="fd-link" onClick={() => setAll((x) => !x)}>
            {all ? "Hide" : "Show"} all {info.combinations} combinations
          </button>
          {all && (
            <FingerprintScope defaultKey={JSON.stringify(info.defaults)}>
              <div style={{ marginTop: 12 }}><DistinctNote /></div>
              <div className="fd-tiles">
                {combos.map((c) => (
                  <Tile key={JSON.stringify(c)} info={info} variants={c} tileKey={JSON.stringify(c)} caption={Object.values(c).join(" · ")} onPick={onPick} />
                ))}
              </div>
            </FingerprintScope>
          )}
        </div>
      )}
    </section>
  );
}

/** A slot recipe is an anatomy, not one element: each slot is rendered alone so none overlaps another. */
/** Interacting axes are shown together: two axes become a grid, so a value that only matters in combination is visible. */
function StandardVariants({ info, onPick }: { info: RecipeInfo; onPick: (p: Pick) => void }) {
  if (info.axes.length === 2 && info.combinations <= 64) {
    const [a, b] = info.axes;
    const defaultKey = JSON.stringify({ ...info.defaults });
    return (
      <FingerprintScope defaultKey={defaultKey}>
        <DistinctNote />
        <div className="fd-grid2" style={{ gridTemplateColumns: `120px repeat(${b.values.length}, minmax(112px, 1fr))` }}>
          <div className="fd-grid2-corner"><code>{a.name}</code> ↓ · <code>{b.name}</code> →</div>
          {b.values.map((bv) => (
            <div key={bv} className="fd-grid2-col"><NameEditor nameKey={`value:${info.name}.${b.name}.${bv}`} kind="value" current={bv} recipe={info.name} mono /></div>
          ))}
          {a.values.map((av) => (
            <React.Fragment key={av}>
              <div className="fd-grid2-row"><NameEditor nameKey={`value:${info.name}.${a.name}.${av}`} kind="value" current={av} recipe={info.name} mono /></div>
              {b.values.map((bv) => {
                const v = { ...info.defaults, [a.name]: av, [b.name]: bv };
                return <Tile key={bv} info={info} variants={v} tileKey={JSON.stringify(v)} caption={`${av} · ${bv}`} onPick={onPick} />;
              })}
            </React.Fragment>
          ))}
        </div>
      </FingerprintScope>
    );
  }
  return (
    <>
      <div className="fd-axis">
        <div className="fd-axis-name">Defaults</div>
        <div className="fd-tiles">
          <FingerprintScope><Tile info={info} variants={info.defaults} caption="default" onPick={onPick} /></FingerprintScope>
        </div>
      </div>
      {info.axes.map((axis) => (
        <FingerprintScope key={axis.name} defaultKey={JSON.stringify({ ...info.defaults, [axis.name]: info.defaults[axis.name] ?? axis.values[0] })}>
          <div className="fd-axis">
            <div className="fd-axis-name"><NameEditor nameKey={`axis:${info.name}.${axis.name}`} kind="axis" current={axis.name} recipe={info.name} mono /> <span className="fd-muted">· {axis.values.length}</span> <DistinctNote inline /></div>
            <div className="fd-tiles">
              {axis.values.map((v) => {
                const vs = { ...info.defaults, [axis.name]: v };
                return <Tile key={v} info={info} variants={vs} tileKey={JSON.stringify(vs)} caption={v} onPick={onPick} rename={{ key: `value:${info.name}.${axis.name}.${v}`, kind: "value" }} />;
              })}
            </div>
          </div>
        </FingerprintScope>
      ))}
    </>
  );
}

function DistinctNote({ inline = false }: { inline?: boolean }) {
  const n = useDistinctCount();
  if (!n || n.total < 2) return null;
  const all = n.distinct === n.total;
  const text = all ? `all ${n.total} distinct` : `${n.distinct} distinct of ${n.total}`;
  return inline
    ? <span className={`fd-distinct ${all ? "" : "is-redundant"}`}>{text}</span>
    : <p className={`fd-distinct-banner ${all ? "" : "is-redundant"}`}>{all ? `All ${n.total} combinations look different at rest.` : `${n.distinct} visually distinct looks across ${n.total} combinations at rest — the rest are identical to one another.`}</p>;
}

function SlotAnatomy({ info, onPick }: { info: RecipeInfo; onPick: (p: Pick) => void }) {
  const [variants, setVariants] = useState<Variants>(info.defaults);
  const out = info.fn(toCallProps(variants)) as Record<string, string>;
  return (
    <>
      {info.axes.length > 0 && (
        <div className="fd-axis">
          {info.axes.map((axis) => (
            <div key={axis.name} className="fd-variant-row">
              <span className="fd-variant-label"><NameEditor nameKey={`axis:${info.name}.${axis.name}`} kind="axis" current={axis.name} recipe={info.name} mono /></span>
              <div className="fd-segment" role="group" aria-label={axis.name}>
                {axis.values.map((v) => (
                  <button key={v} type="button" className={`fd-seg ${variants[axis.name] === v ? "is-on" : ""}`} aria-pressed={variants[axis.name] === v} onClick={() => setVariants({ ...variants, [axis.name]: v })}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="fd-axis">
        <div className="fd-axis-name">Anatomy <span className="fd-muted">· {info.slots.length} slots, each rendered on its own</span></div>
        <div className="fd-tiles">
          {info.slots.map((slot) => (
            <div key={slot} className="fd-tile">
              <div role="button" tabIndex={0} className="fd-tile-stage" title="Show provenance"
                onClick={() => onPick({ recipe: info.name, variants: { ...variants, __slot: slot } })}
                onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPick({ recipe: info.name, variants: { ...variants, __slot: slot } }); } }}>
                <div className={out[slot]} data-slot={slot}>{slot}</div>
              </div>
              <div className="fd-tile-caption"><NameEditor nameKey={`slot:${info.name}.${slot}`} kind="slot" current={slot} recipe={info.name} mono /></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Tile({ info, variants, caption, onPick, rename, tileKey }: { info: RecipeInfo; variants: Variants; caption: string; onPick: (p: Pick) => void; rename?: { key: string; kind: string }; tileKey?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const reg = useFingerprintRegistry();
  const key = tileKey ?? JSON.stringify(variants);
  useLayoutEffect(() => {
    const el = stage.current?.firstElementChild;
    if (!el || !reg) return;
    const measure = () => reg.set(key, fingerprint(el), caption);
    measure();
    void document.fonts?.ready.then(measure);
  });
  const same = duplicateOf(reg, key);
  return (
    <div className={`fd-tile ${same ? "is-duplicate" : ""}`}>
      {same && <div className="fd-dup" title={`Computed styles at rest are identical to ${same}`}>= {same}</div>}
      {/* A div, not a button: specimens are often buttons themselves, and buttons cannot nest. */}
      <div ref={stage} role="button" tabIndex={0} className="fd-tile-stage" title="Show provenance"
        onClick={() => onPick({ recipe: info.name, variants })}
        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPick({ recipe: info.name, variants }); } }}>
        <Specimen info={info} variants={variants} />
      </div>
      <div className="fd-tile-caption">
        {rename ? <NameEditor nameKey={rename.key} kind={rename.kind} current={caption} recipe={info.name} mono /> : caption}
      </div>
    </div>
  );
}

/* ─── Tokens view ─── */

function TokenView({ scope, themeKey }: { scope: HTMLElement | null; themeKey: string }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    if (scope) setTokens(readTokens(scope));
  }, [scope, themeKey]);
  const filtered = tokens.filter((t) => !q || t.name.includes(q) || t.consumers.some((c) => c.includes(q)));
  return (
    <section className="fd-component">
      <header className="fd-comp-head">
        <div>
          <div className="fd-eyebrow">Tokens</div>
          <h1 className="fd-h1">{tokens.length} design tokens</h1>
          <p className="fd-muted">Read from the live stylesheet and resolved against the current theme. Consumers are the recipes whose rules reference each token. <span className="fd-badge">host-supplied</span> marks a hook the package references but never declares — the fonts are the main case; what renders is its fallback unless the host sets it.</p>
        </div>
        <input className="fd-input" placeholder="Filter tokens or recipes…" value={q} onChange={(e) => setQ(e.target.value)} />
      </header>
      {TOKEN_GROUPS.map((g) => {
        const rows = filtered.filter((t) => t.group === g);
        if (!rows.length) return null;
        return (
          <div key={g} className="fd-token-group">
            <h2 className="fd-h2">{g} <span className="fd-muted">· {rows.length}</span></h2>
            <div className="fd-token-table">
              {rows.map((t) => (
                <div key={t.name} className="fd-token-row">
                  {g === "Typography" && t.resolved && !t.resolved.match(/^[\d.]/) ? (
                    <span className="fd-font-sample" style={{ fontFamily: t.fallback ? `var(${t.name}, ${t.fallback})` : `var(${t.name})` }}>Aa</span>
                  ) : (
                    <Swatch name={t.name} resolved={t.resolved} />
                  )}
                  <span className="fd-token-name"><NameEditor nameKey={`token:${t.name}`} kind="token" current={t.name} mono /></span>
                  <span className="fd-muted fd-trunc" title={t.resolved}>
                    {t.hostSupplied ? <><span className="fd-badge">host-supplied</span> {t.fallback ? `fallback ${t.fallback}` : "no fallback"}</> : t.resolved}
                  </span>
                  <span className="fd-consumers" title={t.consumers.join(", ")}>
                    {t.consumers.length ? `${t.consumers.length} · ${t.consumers.slice(0, 4).join(", ")}${t.consumers.length > 4 ? "…" : ""}` : <span className="fd-muted">unused by recipes</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* ─── Drafts: durable prototypes, saved as files ─── */

type DraftElement = { recipe: string; variants: Variants; text: string };
type Draft = { name: string; slug?: string; savedAt?: string; kind?: string; recipe?: string; backdrop: { layer: string; texture: string }; elements: DraftElement[] };

function DraftsView() {
  const [saved, setSaved] = useState<Draft[]>([]);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<Draft>({ name: "", backdrop: { layer: "elevated", texture: "glass" }, elements: [] });
  const [recipe, setRecipe] = useState(inventory[0]?.name ?? "");
  const [variants, setVariants] = useState<Variants>(inventory[0]?.defaults ?? {});
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/__foundry/drafts");
    if (res.ok) setSaved(await res.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const info = byName.get(recipe);
  useEffect(() => { if (info) setVariants(info.defaults); }, [recipe]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => {
    if (!info) return;
    setDraft((d) => ({ ...d, elements: [...d.elements, { recipe, variants, text: text || recipe }] }));
    setText("");
  };
  const save = async () => {
    if (!draft.name.trim()) { setStatus("Name the draft first."); return; }
    const res = await fetch("/__foundry/drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
    if (!res.ok) { setStatus(`Save failed: ${await res.text()}`); return; }
    const out: Draft = await res.json();
    setStatus(`Saved to foundry-drafts/${out.slug}.json`);
    void load();
  };

  return (
    <section className="fd-component">
      <header className="fd-comp-head">
        <div>
          <div className="fd-eyebrow">Drafts</div>
          <h1 className="fd-h1">Prototype with the system</h1>
          <p className="fd-muted">Compose from existing recipes and variants. Saved drafts are JSON files in <code>foundry-drafts/</code> at the repo root — durable across restarts and committable.</p>
        </div>
      </header>

      <div className="fd-draft-grid">
        <div className="fd-draft-controls">
          <label className="fd-field">Draft name
            <input className="fd-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. header — layered glass" />
          </label>
          <div className="fd-field-row">
            <label className="fd-field">Backdrop layer
              <select className="fd-input" value={draft.backdrop.layer} onChange={(e) => setDraft({ ...draft, backdrop: { ...draft.backdrop, layer: e.target.value } })}>
                {LAYERS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="fd-field">Material
              <select className="fd-input" value={draft.backdrop.texture} onChange={(e) => setDraft({ ...draft, backdrop: { ...draft.backdrop, texture: e.target.value } })}>
                {TEXTURES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
          </div>
          <hr className="fd-hr" />
          <label className="fd-field">Add element
            <select className="fd-input" value={recipe} onChange={(e) => setRecipe(e.target.value)}>
              {inventory.map((r) => <option key={r.name} value={r.name}>{r.name}{r.kind === "slot" ? " (slot)" : ""}</option>)}
            </select>
          </label>
          {info?.axes.map((a) => (
            <label key={a.name} className="fd-field">{a.name}
              <select className="fd-input" value={variants[a.name] ?? ""} onChange={(e) => setVariants({ ...variants, [a.name]: e.target.value })}>
                {!info.defaults[a.name] && <option value="">(none)</option>}
                {a.values.map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
          ))}
          <label className="fd-field">Label
            <input className="fd-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={recipe} />
          </label>
          <div className="fd-field-row">
            <button type="button" className="fd-btn" onClick={add}>Add to draft</button>
            <button type="button" className="fd-btn fd-btn-primary" onClick={() => void save()}>Save draft</button>
          </div>
          {status && <p className="fd-status" role="status">{status}</p>}
        </div>

        <div>
          <div className="fd-eyebrow">Canvas</div>
          <Surface layer={draft.backdrop.layer} texture={draft.backdrop.texture} className="fd-canvas">
            {draft.elements.length === 0 && <span className="fd-muted">Add elements to see them here.</span>}
            {draft.elements.map((el, i) => {
              const r = byName.get(el.recipe);
              return r ? (
                <div key={i} className="fd-canvas-item">
                  <Specimen info={r} variants={el.variants} label={el.text} />
                  <button type="button" className="fd-link" onClick={() => setDraft({ ...draft, elements: draft.elements.filter((_, j) => j !== i) })}>remove</button>
                </div>
              ) : <div key={i} className="fd-muted">Unknown recipe “{el.recipe}” — it may have been renamed.</div>;
            })}
          </Surface>
        </div>
      </div>

      <h2 className="fd-h2" style={{ marginTop: 32 }}>Saved drafts <span className="fd-muted">· {saved.length}</span></h2>
      <div className="fd-saved">
        {saved.map((d) => (
          <button type="button" key={d.slug} className="fd-saved-item" onClick={() => setDraft({ name: d.name, backdrop: d.backdrop, elements: d.elements })}>
            <div className="fd-saved-name">{d.name}</div>
            <div className="fd-muted">{d.kind === "recipe" ? `recipe material · ${d.recipe}` : `${d.elements.length} elements · ${d.backdrop.layer} / ${d.backdrop.texture}`}</div>
            <div className="fd-muted"><code>foundry-drafts/{d.slug}.json</code></div>
          </button>
        ))}
        {saved.length === 0 && <p className="fd-muted">Nothing saved yet.</p>}
      </div>
    </section>
  );
}

/* ─── Shell ─── */

export function App() {
  const params = new URLSearchParams(location.search);
  const [theme, setTheme] = useState<"dark" | "light">((params.get("theme") as "light") ?? "dark");
  const [glass, setGlass] = useState(true);
  const [view, setView] = useState<View>((params.get("view") as View) ?? "create");
  const [selected, setSelected] = useState<string>(params.get("recipe") ?? "conversationHeader");
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Pick | null>(null);
  const [matrix, setMatrix] = useState(false);
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const [scope, setScope] = useState<HTMLElement | null>(null);
  useEffect(() => { setScope(scopeRef.current); }, []);

  const info = byName.get(selected) ?? inventory[0];
  const shared = inventory.filter((r) => r.tracks.includes("taskgraph"));
  const chatOnly = inventory.filter((r) => !r.tracks.includes("taskgraph"));
  const match = (r: RecipeInfo) => !q || r.name.toLowerCase().includes(q.toLowerCase());

  return (
    <CaelosProvider theme={theme} glass={glass}>
      <NamesProvider>
      <div ref={scopeRef} className="fd-root" data-foundry-recipe-count={totals.recipes}>
        <Surface layer="ground" texture="auto" className="fd-shell">
          <header className="fd-top">
            <div className="fd-brand">
              <span className="fd-wordmark">Caelos Foundry</span>
              <span className="fd-muted fd-counts">
                {totals.recipes} recipes · {totals.axes} variant axes · {totals.combinations} combinations · {totals.shared} shared with task graph
              </span>
            </div>
            <nav className="fd-tabs" aria-label="Foundry sections">
              {(["create", "components", "tokens", "drafts", "proposals"] as View[]).map((v) => (
                <button key={v} type="button" className={`fd-tab ${view === v ? "is-on" : ""}`} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>
              ))}
            </nav>
            <div className="fd-toggles">
              <button type="button" className="fd-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "Light" : "Dark"} theme</button>
              <button type="button" className="fd-btn" aria-pressed={!glass} onClick={() => setGlass(!glass)}>{glass ? "Glass on" : "Glass off"}</button>
            </div>
          </header>

          {!taskgraphAvailable && <div className="fd-banner">Task-graph track unavailable: {taskgraphReason}</div>}

          <div className="fd-body">
            {view === "components" && (
              <aside className="fd-nav" aria-label="Recipes">
                <input className="fd-input" placeholder="Search recipes…" value={q} onChange={(e) => setQ(e.target.value)} />
                <NavGroup title={`Shared · chat + task graph (${shared.length})`} items={shared.filter(match)} selected={selected} onSelect={(n) => { setSelected(n); setPick(null); }} />
                <NavGroup title={`Chat only · React 19 (${chatOnly.length})`} items={chatOnly.filter(match)} selected={selected} onSelect={(n) => { setSelected(n); setPick(null); }} />
                <div className="fd-nav-foot fd-muted">
                  Task graph only: {taskgraphOnly.length === 0 ? "none — the chat package contains every task-graph recipe" : taskgraphOnly.join(", ")}
                </div>
              </aside>
            )}
            <main className="fd-main">
              {view === "components" && info && <ComponentView key={info.name} info={info} onPick={setPick} />}
              {view === "tokens" && <TokenView scope={scope} themeKey={`${theme}-${glass}`} />}
              {view === "create" && <HeaderWorkbench scope={scope} themeKey={`${theme}-${glass}`} />}
              {view === "drafts" && <DraftsView />}
              {view === "proposals" && <ProposalsView />}
            </main>
            {view === "components" && pick && <Provenance pick={pick} scope={scope} onClose={() => setPick(null)} onMatrix={() => setMatrix(true)} />}
          </div>
        </Surface>
        {matrix && pick && <SurfaceMatrix pick={pick} onClose={() => setMatrix(false)} />}
      </div>
      </NamesProvider>
    </CaelosProvider>
  );
}

function NavGroup({ title, items, selected, onSelect }: { title: string; items: RecipeInfo[]; selected: string; onSelect: (n: string) => void }) {
  return (
    <div className="fd-nav-group">
      <div className="fd-eyebrow">{title}</div>
      {items.map((r) => (
        <button key={r.name} type="button" className={`fd-nav-item ${r.name === selected ? "is-on" : ""}`} onClick={() => onSelect(r.name)}>
          <span>{r.name}</span>
          <span className="fd-muted">{r.axes.length ? `${r.axes.length}×` : ""}{r.kind === "slot" ? " slot" : ""}{r.delta.length ? " Δ" : ""}</span>
        </button>
      ))}
    </div>
  );
}
