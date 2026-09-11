import type { CharacterSeed } from "./characterSeed";
import type { Oklch } from "./color";
import type { ShapeSeed } from "./shapeSeed";

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

const authoredSeed: Seed = {
  "groundBase": {
    "l": 0.145,
    "c": 0.024254,
    "h": 283.830366
  },
  "hueVector": {
    "h": 283,
    "c": 0.031,
    "cRamp": 0.001
  },
  "contrast": 1,
  "lightWarm": {
    "l": 0.939359,
    "c": 0.029814,
    "h": 85.564645
  },
  "accents": {
    "cool": {
      "l": 0.655,
      "c": 0.151,
      "h": 267
    },
    "hot": {
      "l": 0.614,
      "c": 0.132147,
      "h": 17.740348
    }
  },
  "semantics": {
    "sage": {
      "l": 0.669131,
      "c": 0.042903,
      "h": 174.28394
    },
    "done": {
      "l": 0.560675,
      "c": 0.041689,
      "h": 174.643075
    },
    "progress": {
      "l": 0.812101,
      "c": 0.096644,
      "h": 72.884383
    },
    "danger": {
      "l": 0.59934,
      "c": 0.132147,
      "h": 17.740348
    },
    "ready": {
      "l": 0.686927,
      "c": 0.080059,
      "h": 277.554877
    },
    "atmospheric": {
      "l": 0.603884,
      "c": 0.060618,
      "h": 302.197598
    },
    "structural": {
      "l": 0.443801,
      "c": 0.087397,
      "h": 283.925337
    },
    "neutral": {
      "l": 0.634788,
      "c": 0.015813,
      "h": 84.592613
    }
  },
  "textTargets": {
    "primary": 90,
    "secondary": 45,
    "tertiary": 28,
    "faint": 16
  },
  "hairAlphas": [
    0.045,
    0.09,
    0.14
  ]
};

const authoredShapeSeed: ShapeSeed = {
  "spaceUnit": 3,
  "radius": {
    "base": 10,
    "curve": 1.35,
    "floor": 6
  },
  "borderAlphas": [
    0.045,
    0.09,
    0.14
  ],
  "elevation": {
    "ambientAlpha": 0.18,
    "keyAlpha": 0.24,
    "liftCurve": 1.35
  },
  "motion": {
    "baseMs": 240,
    "ease": "cubic-bezier(0.16, 1, 0.3, 1)",
    "easeSnap": "cubic-bezier(0.2, 0.85, 0.25, 1)"
  }
};

const authoredCharacter: CharacterSeed = {
  "modes": {
    "chrome": "graph",
    "ground": "graph",
    "elevated": "glass",
    "elevated-2": "glass",
    "top": "glass"
  },
  "graphIntensity": 0.07,
  "glassIntensity": 0.52
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach((child) => deepFreeze(child));
  }
  return value;
}

export const DEFAULT_SEED: Seed = deepFreeze(authoredSeed);
export const DEFAULT_SHAPE_SEED: ShapeSeed = deepFreeze(authoredShapeSeed);
export const DEFAULT_CHARACTER: CharacterSeed = deepFreeze(authoredCharacter);

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
