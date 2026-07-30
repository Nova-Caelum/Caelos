const LEGACY_BRIDGE: Record<string, string> = {
  "--nc-chrome": "var(--sys-chrome)",
  "--nc-ground": "var(--sys-ground)",
  "--nc-elevated": "var(--sys-elevated)",
  "--nc-elevated-2": "var(--sys-elevated-2)",
  "--nc-accent": "var(--sys-accent)",
  "--nc-accent-hover": "var(--sys-accent-hover)",
  "--nc-accent-tint": "var(--sys-accent-tint)",
  "--nc-accent-line": "var(--sys-accent-line)",
  "--nc-accent-cream": "var(--sys-accent-on-tint)",
  "--nc-sage": "var(--sys-sem-sage)",
  "--nc-sea-green": "var(--sys-sem-done)",
  "--nc-slate-violet": "var(--sys-sem-structural)",
  "--nc-desaturated-violet": "var(--sys-sem-atmospheric)",
  "--nc-peach-gold": "var(--sys-sem-progress)",
  "--nc-deep-maroon": "var(--sys-sem-danger)",
  "--nc-light-indigo": "var(--sys-sem-ready)",
  "--nc-muted-stone": "var(--sys-sem-neutral)",
  "--nc-text-cream": "var(--sys-text-primary)",
  "--nc-text-muted": "var(--sys-text-secondary)",
  "--nc-text-dim": "var(--sys-text-tertiary)",
  "--nc-text-faint": "var(--sys-text-faint)",
  "--nc-hair": "var(--sys-hair-1)",
  "--nc-hair-2": "var(--sys-hair-2)",
  "--nc-hair-3": "var(--sys-hair-3)",
};

const appliedTokens = new WeakMap<HTMLElement, Set<string>>();
const appliedBridge = new WeakMap<HTMLElement, Set<string>>();

export interface InjectOptions {
  legacyBridge?: boolean;
  root?: HTMLElement;
}

export function injectTokens(maps: Record<string, string>[], opts: InjectOptions = {}): void {
  const root = opts.root ?? document.documentElement;
  const merged = Object.assign({}, ...maps);
  const previousTokens = appliedTokens.get(root) ?? new Set<string>();
  const nextTokens = new Set(Object.keys(merged));

  previousTokens.forEach((name) => {
    if (!nextTokens.has(name)) root.style.removeProperty(name);
  });
  Object.entries(merged).forEach(([name, value]) => root.style.setProperty(name, value));
  appliedTokens.set(root, nextTokens);

  const previousBridge = appliedBridge.get(root) ?? new Set<string>();
  if (!opts.legacyBridge) {
    previousBridge.forEach((name) => root.style.removeProperty(name));
    appliedBridge.set(root, new Set());
    return;
  }

  Object.entries(LEGACY_BRIDGE).forEach(([name, value]) => root.style.setProperty(name, value));
  appliedBridge.set(root, new Set(Object.keys(LEGACY_BRIDGE)));
}

export { LEGACY_BRIDGE };
