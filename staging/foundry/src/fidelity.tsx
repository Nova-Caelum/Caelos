import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Fidelity: making a specimen honest.
 *
 * 1. Child markup. Some recipes style required children rather than themselves —
 *    rippleLoader paints nine `> i` cells. The markup is read from the recipe's own CSS
 *    (`.caelos-ripple-loader > i:nth-child(9)` ⇒ nine <i>), never typed per recipe.
 *
 * 2. Visual fingerprints. Every rendered tile is fingerprinted from its computed styles, so
 *    two variants that look identical are labelled as identical — an empty variant, or two
 *    tones that resolve to the same token, stop hiding behind different names.
 */

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
    try { walk(sheet.cssRules); } catch { /* cross-origin */ }
  }
  return out;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const childCache = new Map<string, { tag: string; count: number } | null>();

/** Required children for a recipe's base class, read from its child-combinator rules. */
export function childMarkup(baseClass: string): { tag: string; count: number } | null {
  if (childCache.has(baseClass)) return childCache.get(baseClass)!;
  const re = new RegExp(`\\.${escape(baseClass)}(?![\\w-])[^\\s,>]*\\s*>\\s*([a-z]+)(?::nth-child\\((\\d+)\\))?`, "g");
  let tag: string | null = null;
  let count = 0;
  for (const rule of styleRules()) {
    for (const m of rule.selectorText.matchAll(re)) {
      tag ??= m[1];
      if (m[1] === tag) count = Math.max(count, m[2] ? Number(m[2]) : 1);
    }
  }
  const out = tag ? { tag, count: Math.max(1, count) } : null;
  childCache.set(baseClass, out);
  return out;
}

const PROPS = [
  "color", "backgroundColor", "backgroundImage", "backgroundSize",
  "borderTopColor", "borderTopWidth", "borderTopStyle", "borderRightColor", "borderBottomColor", "borderLeftColor",
  "borderRadius", "boxShadow", "fontFamily", "fontSize", "fontWeight", "fontStyle", "letterSpacing", "lineHeight",
  "textTransform", "textDecorationLine", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "width", "height", "opacity", "filter", "backdropFilter", "outlineStyle", "outlineColor", "gap", "display", "transform",
] as const;
// Children often animate (loaders); their opacity and transform change frame to frame.
const CHILD_PROPS = PROPS.filter((p) => p !== "opacity" && p !== "transform");

const sig = (el: Element, props: readonly string[], pseudo?: string) => {
  const s = getComputedStyle(el, pseudo) as unknown as Record<string, string>;
  return props.map((p) => s[p]).join("|");
};

/** A rest-state visual signature: the element, its ::before/::after, and its first children. */
export function fingerprint(root: Element): string {
  const parts = [sig(root, PROPS), sig(root, PROPS, "::before"), sig(root, PROPS, "::after")];
  for (const child of Array.from(root.children).slice(0, 12)) parts.push(sig(child, CHILD_PROPS));
  return parts.join("§");
}

type Entry = { fp: string; caption: string };
type Registry = { entries: Map<string, Entry>; set: (key: string, fp: string, caption: string) => void; defaultKey?: string };
const Ctx = createContext<Registry | null>(null);

/** One comparison group. Tiles inside register their fingerprint; duplicates are found within the group. */
export function FingerprintScope({ defaultKey, children }: { defaultKey?: string; children: React.ReactNode }) {
  const [entries, setEntries] = useState<Map<string, Entry>>(() => new Map());
  const set = useCallback((key: string, fp: string, caption: string) => {
    setEntries((prev) => {
      if (prev.get(key)?.fp === fp) return prev;
      const next = new Map(prev);
      next.set(key, { fp, caption });
      return next;
    });
  }, []);
  const value = useMemo(() => ({ entries, set, defaultKey }), [entries, set, defaultKey]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFingerprintRegistry = () => useContext(Ctx);

/** The caption of the tile this one renders identically to, or null if it is distinct. */
export function duplicateOf(reg: Registry | null, key: string): string | null {
  if (!reg) return null;
  const mine = reg.entries.get(key);
  if (!mine) return null;
  if (reg.defaultKey && reg.defaultKey !== key && reg.entries.get(reg.defaultKey)?.fp === mine.fp) return "default";
  for (const [k, e] of reg.entries) {
    if (k === key) return null; // first occurrence is canonical
    if (e.fp === mine.fp) return e.caption;
  }
  return null;
}

/** Distinct looks within the group — the honest count behind a list of variant names. */
export function useDistinctCount(): { total: number; distinct: number } | null {
  const reg = useContext(Ctx);
  if (!reg || reg.entries.size === 0) return null;
  return { total: reg.entries.size, distinct: new Set([...reg.entries.values()].map((e) => e.fp)).size };
}
