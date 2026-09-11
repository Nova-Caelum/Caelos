import type { CharacterSeed } from "./characterSeed";
import type { FoundrySeeds } from "./override";
import type { Seed } from "./seed";
import type { ShapeSeed } from "./shapeSeed";

export interface SeedDiffEntry {
  path: string;
  before: string;
  after: string;
}

function normalize(value: unknown): unknown {
  if (typeof value === "number") return Number(value.toFixed(6));
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, normalize(child)]));
  }
  return value;
}

function literal(value: unknown): string {
  return JSON.stringify(normalize(value), null, 2);
}

export function seedLiteral(color: Seed, shape: ShapeSeed, character: CharacterSeed): string {
  return [
    `export const DEFAULT_SEED = ${literal(color)} satisfies Seed;`,
    `export const DEFAULT_SHAPE_SEED = ${literal(shape)} satisfies ShapeSeed;`,
    `export const DEFAULT_CHARACTER = ${literal(character)} satisfies CharacterSeed;`,
  ].join("\n\n");
}

export function renderSeedModule({ color, shape, character }: FoundrySeeds): string {
  return `import type { CharacterSeed } from "./characterSeed";
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

const authoredSeed: Seed = ${literal(color)};

const authoredShapeSeed: ShapeSeed = ${literal(shape)};

const authoredCharacter: CharacterSeed = ${literal(character)};

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
`;
}

function flatten(value: unknown, prefix: string, target: Map<string, string>): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) => flatten(child, `${prefix}[${index}]`, target));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key, target));
    return;
  }
  target.set(prefix, typeof value === "number" ? String(Number(value.toFixed(6))) : String(value));
}

export function diffFoundrySeeds(before: FoundrySeeds, after: FoundrySeeds): SeedDiffEntry[] {
  const oldValues = new Map<string, string>();
  const newValues = new Map<string, string>();
  flatten(before, "", oldValues);
  flatten(after, "", newValues);
  return [...newValues.entries()].flatMap(([path, value]) => {
    const previous = oldValues.get(path);
    return previous === value ? [] : [{ path, before: previous ?? "—", after: value }];
  });
}
