import {
  cloneCharacterSeed,
  DEFAULT_CHARACTER,
  SURFACE_NAMES,
  type CharacterSeed,
} from "./characterSeed";
import { cloneSeed, DEFAULT_SEED, type Seed } from "./seed";
import { cloneShapeSeed, DEFAULT_SHAPE_SEED, type ShapeSeed } from "./shapeSeed";

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T;

export interface FoundryOverride {
  color?: DeepPartial<Seed>;
  shape?: DeepPartial<ShapeSeed>;
  character?: DeepPartial<CharacterSeed>;
}

export interface FoundrySeeds {
  color: Seed;
  shape: ShapeSeed;
  character: CharacterSeed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertPartialShape(value: unknown, template: unknown, path: string): void {
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length !== template.length) {
      throw new Error(`${path} must be an array with ${template.length} entries`);
    }
    value.forEach((child, index) => assertPartialShape(child, template[index], `${path}[${index}]`));
    return;
  }

  if (isRecord(template)) {
    if (!isRecord(value)) throw new Error(`${path} must be an object`);
    Object.entries(value).forEach(([key, child]) => {
      if (!Object.prototype.hasOwnProperty.call(template, key)) {
        throw new Error(`${path}.${key} is not a supported override key`);
      }
      assertPartialShape(child, template[key], `${path}.${key}`);
    });
    return;
  }

  if (typeof template === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${path} must be a finite number`);
    return;
  }

  if (typeof value !== typeof template) throw new Error(`${path} must be a ${typeof template}`);
}

export function parseFoundryOverride(value: unknown): FoundryOverride {
  if (!isRecord(value)) throw new Error("Foundry override must be a JSON object");
  const supported = new Set(["color", "shape", "character"]);
  Object.keys(value).forEach((key) => {
    if (!supported.has(key)) throw new Error(`${key} is not a supported override section`);
  });

  if (value.color !== undefined) assertPartialShape(value.color, DEFAULT_SEED, "color");
  if (value.shape !== undefined) assertPartialShape(value.shape, DEFAULT_SHAPE_SEED, "shape");
  if (value.character !== undefined) {
    assertPartialShape(value.character, DEFAULT_CHARACTER, "character");
    const modes = (value.character as { modes?: Record<string, unknown> }).modes;
    if (modes) {
      SURFACE_NAMES.forEach((surface) => {
        const mode = modes[surface];
        if (mode !== undefined && mode !== "plain" && mode !== "graph" && mode !== "glass") {
          throw new Error(`character.modes.${surface} must be plain, graph, or glass`);
        }
      });
    }
  }

  return value as FoundryOverride;
}

function mergePartial<T extends Record<string, unknown>>(target: T, partial: DeepPartial<T> | undefined): T {
  if (!partial) return target;
  Object.entries(partial).forEach(([key, value]) => {
    if (value === undefined) return;
    const current = target[key];
    if (isRecord(current) && isRecord(value)) {
      mergePartial(current, value as DeepPartial<typeof current>);
    } else {
      target[key] = (Array.isArray(value) ? [...value] : value) as T[string];
    }
  });
  return target;
}

export function applyOverride(
  seed: Seed = DEFAULT_SEED,
  shapeSeed: ShapeSeed = DEFAULT_SHAPE_SEED,
  override: unknown = {},
  characterSeed: CharacterSeed = DEFAULT_CHARACTER,
): FoundrySeeds {
  const parsed = parseFoundryOverride(override);
  return {
    color: mergePartial(cloneSeed(seed) as unknown as Record<string, unknown>, parsed.color as never) as unknown as Seed,
    shape: mergePartial(cloneShapeSeed(shapeSeed) as unknown as Record<string, unknown>, parsed.shape as never) as unknown as ShapeSeed,
    character: mergePartial(cloneCharacterSeed(characterSeed) as unknown as Record<string, unknown>, parsed.character as never) as unknown as CharacterSeed,
  };
}

function countLeaves(value: unknown): number {
  if (Array.isArray(value)) return value.length ? 1 : 0;
  if (!isRecord(value)) return 1;
  return Object.values(value).reduce((total, child) => total + countLeaves(child), 0);
}

export function countOverrideKeys(value: unknown): number {
  return countLeaves(parseFoundryOverride(value));
}
