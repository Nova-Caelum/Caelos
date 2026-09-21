/**
 * Tokens are read from the live stylesheet, not from a list. Every custom property the
 * package declares on its theme scope is enumerated, resolved against the current theme,
 * grouped, and cross-referenced to the recipes whose rules consume it.
 */

export type TokenGroup =
  | "Colour"
  | "Glow"
  | "Fill & gradient"
  | "Typography"
  | "Space"
  | "Radius"
  | "Elevation"
  | "Motion"
  | "Other";

export const TOKEN_GROUPS: TokenGroup[] = [
  "Colour",
  "Glow",
  "Fill & gradient",
  "Typography",
  "Space",
  "Radius",
  "Elevation",
  "Motion",
  "Other",
];

export interface Token {
  name: string;
  declared: string;
  resolved: string;
  group: TokenGroup;
  consumers: string[];
  /** Referenced by the package but never declared by it — a hook the host app supplies, or a recipe-local variable. */
  hostSupplied?: boolean;
  fallback?: string;
}

const THEME_SCOPES = new Set(["[data-caelos-theme]", "[data-caelos-theme=light]", '[data-caelos-theme="light"]']);

function styleRules(): CSSStyleRule[] {
  const out: CSSStyleRule[] = [];
  const walk = (list: CSSRuleList) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) out.push(rule);
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested) walk(nested);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      /* cross-origin sheet (web fonts) — not ours */
    }
  }
  return out;
}

const VAR_REF = /var\(\s*(--[a-zA-Z0-9-_]+)/g;
/** `.caelos-control-skin--kind_danger` → control-skin; `.caelos-alert__root` → alert. */
const RECIPE_CLASS = /\.caelos-([a-z0-9]+(?:-[a-z0-9]+)*?)(?=__|--|[^a-z0-9-]|$)/g;

function groupOf(name: string, value: string): TokenGroup {
  const n = name.toLowerCase();
  const v = value.toLowerCase();
  if (n.includes("glow")) return "Glow";
  if (v.includes("gradient") || /fill|focus|feather|wash|tint/.test(n)) return "Fill & gradient";
  if (/font|lettering|leading|tracking|weight|text-size|type-|family/.test(n)) return "Typography";
  if (/elev|shadow/.test(n)) return "Elevation";
  if (/radius/.test(n)) return "Radius";
  if (/space|gap|pad|inset|cushion/.test(n)) return "Space";
  if (/ease|duration|motion|delay/.test(n)) return "Motion";
  if (v && CSS.supports("color", v)) return "Colour";
  return "Other";
}

/** Every recipe that references each token, keyed by token name. */
export function consumerMap(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const rule of styleRules()) {
    if (THEME_SCOPES.has(rule.selectorText.trim())) continue;
    const recipes = new Set<string>();
    for (const m of rule.selectorText.matchAll(RECIPE_CLASS)) recipes.add(m[1]);
    if (/\.nc-composer/.test(rule.selectorText)) recipes.add("composer");
    if (!recipes.size) continue;
    for (const m of rule.style.cssText.matchAll(VAR_REF)) {
      let set = map.get(m[1]);
      if (!set) map.set(m[1], (set = new Set()));
      for (const r of recipes) set.add(r);
    }
  }
  return map;
}

export function readTokens(scope: Element): Token[] {
  const declared = new Map<string, string>();
  for (const rule of styleRules()) {
    if (!THEME_SCOPES.has(rule.selectorText.trim())) continue;
    for (let i = 0; i < rule.style.length; i++) {
      const prop = rule.style[i];
      if (prop.startsWith("--") && !declared.has(prop)) declared.set(prop, rule.style.getPropertyValue(prop).trim());
    }
  }
  const computed = getComputedStyle(scope);
  const consumers = consumerMap();

  // Hooks: names the package references with var() but never declares — the fonts are the main case
  // (--font-nova-sans → 'IBM Plex Sans'). Their fallback is what renders when the host sets nothing.
  const fallbacks = new Map<string, string>();
  const referenced = new Set<string>();
  const WITH_FALLBACK = /var\(\s*(--[a-zA-Z0-9-_]+)\s*,\s*([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
  for (const rule of styleRules()) {
    // Only the package's own rules — never the Foundry's chrome, which is not part of the design system.
    if (!/caelos|\.nc-/.test(rule.selectorText)) continue;
    const text = rule.style.cssText;
    for (const m of text.matchAll(VAR_REF)) referenced.add(m[1]);
    for (const m of text.matchAll(WITH_FALLBACK)) if (!fallbacks.has(m[1])) fallbacks.set(m[1], m[2].trim());
  }
  const hooks: Token[] = [...referenced]
    .filter((n) => !declared.has(n))
    .map((name) => {
      const fallback = fallbacks.get(name);
      const resolved = computed.getPropertyValue(name).trim();
      return {
        name,
        declared: "",
        resolved: resolved || fallback || "",
        group: groupOf(name, resolved || fallback || ""),
        consumers: [...(consumers.get(name) ?? [])].sort(),
        hostSupplied: true,
        fallback,
      };
    });

  return [...declared.entries()]
    .map(([name, value]) => {
      const resolved = computed.getPropertyValue(name).trim() || value;
      return {
        name,
        declared: value,
        resolved,
        group: groupOf(name, resolved),
        consumers: [...(consumers.get(name) ?? [])].sort(),
      };
    })
    .concat(hooks)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The tokens a rendered specimen actually resolves, found by matching its classes against live rules. */
export function tokensForClasses(classes: string[], scope: Element) {
  const wanted = new Set(classes.filter(Boolean));
  const names = new Set<string>();
  for (const rule of styleRules()) {
    const hit = [...wanted].some((c) => rule.selectorText.includes(`.${c}`));
    if (!hit) continue;
    for (const m of rule.style.cssText.matchAll(VAR_REF)) names.add(m[1]);
  }
  const computed = getComputedStyle(scope);
  return [...names].sort().map((name) => ({ name, resolved: computed.getPropertyValue(name).trim() }));
}
