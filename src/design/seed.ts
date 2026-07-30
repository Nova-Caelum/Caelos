import { hexToOklch, type Oklch } from "./color";

export type { Oklch } from "./color";

export const SEMANTIC_NAMES = [
  "sage",
  "done",
  "progress",
  "danger",
  "ready",
  "atmospheric",
  "structural",
  "neutral",
] as const;

export type SemanticName = typeof SEMANTIC_NAMES[number];

export interface Seed {
  groundBase: Oklch;
  hueVector: { h: number; c: number; cRamp: number };
  contrast: number;
  lightWarm: Oklch;
  accents: { cool: Oklch; hot: Oklch };
  semantics: Record<SemanticName, Oklch>;
  textTargets: { primary: number; secondary: number; tertiary: number; faint: number };
  hairAlphas: [number, number, number];
}

const chrome = hexToOklch("#12121E");

const authoredSeed: Seed = {
  groundBase: chrome,
  hueVector: { h: chrome.h, c: chrome.c, cRamp: 0.004 },
  contrast: 1,
  lightWarm: hexToOklch("#F4EAD5"),
  accents: {
    cool: hexToOklch("#6D5AD1"),
    hot: hexToOklch("#C25B62"),
  },
  semantics: {
    sage: hexToOklch("#7A9E93"),
    done: hexToOklch("#5B7D73"),
    progress: hexToOklch("#E8B87A"),
    danger: hexToOklch("#C25B62"),
    ready: hexToOklch("#8E96CC"),
    atmospheric: hexToOklch("#8879A0"),
    structural: hexToOklch("#4E4C82"),
    neutral: hexToOklch("#8F8A80"),
  },
  // APCA |Lc| targets against the derived ground. Calibrated to sit near the
  // legacy hand-authored tiers' measured contrast (93/39/23/14 against #1C1B28)
  // while giving Daniel headroom to dial UP toward legibility in the Foundry —
  // the seed-authoring session is where these get their final values.
  textTargets: { primary: 90, secondary: 45, tertiary: 28, faint: 16 },
  hairAlphas: [0.045, 0.09, 0.14],
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach((child) => deepFreeze(child));
  }
  return value;
}

export const DEFAULT_SEED: Seed = deepFreeze(authoredSeed);

export function cloneSeed(seed: Seed = DEFAULT_SEED): Seed {
  return {
    ...seed,
    groundBase: { ...seed.groundBase },
    hueVector: { ...seed.hueVector },
    lightWarm: { ...seed.lightWarm },
    accents: { cool: { ...seed.accents.cool }, hot: { ...seed.accents.hot } },
    semantics: Object.fromEntries(
      SEMANTIC_NAMES.map((name) => [name, { ...seed.semantics[name] }]),
    ) as Record<SemanticName, Oklch>,
    textTargets: { ...seed.textTargets },
    hairAlphas: [...seed.hairAlphas],
  };
}
