import { DEFAULT_CHARACTER } from "./seed";

export const SURFACE_NAMES = ["chrome", "ground", "elevated", "elevated-2", "top"] as const;

export type SurfaceName = typeof SURFACE_NAMES[number];
export type SurfaceMode = "plain" | "graph" | "glass";

export interface CharacterSeed {
  modes: Record<SurfaceName, SurfaceMode>;
  graphIntensity: number;
  glassIntensity: number;
}

export { DEFAULT_CHARACTER };

export function cloneCharacterSeed(seed: CharacterSeed = DEFAULT_CHARACTER): CharacterSeed {
  return {
    ...seed,
    modes: { ...seed.modes },
  };
}
