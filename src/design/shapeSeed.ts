import { DEFAULT_SHAPE_SEED } from "./seed";

export interface ShapeSeed {
  spaceUnit: number;
  radius: {
    base: number;
    curve: number;
    floor: number;
  };
  borderAlphas: [number, number, number];
  elevation: {
    ambientAlpha: number;
    keyAlpha: number;
    liftCurve: number;
  };
  motion: {
    baseMs: number;
    ease: string;
    easeSnap: string;
  };
}

export { DEFAULT_SHAPE_SEED };

export function cloneShapeSeed(seed: ShapeSeed = DEFAULT_SHAPE_SEED): ShapeSeed {
  return {
    ...seed,
    radius: { ...seed.radius },
    borderAlphas: [...seed.borderAlphas],
    elevation: { ...seed.elevation },
    motion: { ...seed.motion },
  };
}
