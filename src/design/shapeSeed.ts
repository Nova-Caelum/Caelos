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

const authoredShapeSeed: ShapeSeed = {
  spaceUnit: 4,
  radius: {
    base: 10,
    curve: 1.4,
    floor: 6,
  },
  borderAlphas: [0.045, 0.09, 0.14],
  elevation: {
    ambientAlpha: 0.18,
    keyAlpha: 0.28,
    liftCurve: 1.35,
  },
  motion: {
    baseMs: 240,
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeSnap: "cubic-bezier(0.2, 0.85, 0.25, 1)",
  },
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach((child) => deepFreeze(child));
  }
  return value;
}

export const DEFAULT_SHAPE_SEED: ShapeSeed = deepFreeze(authoredShapeSeed);

export function cloneShapeSeed(seed: ShapeSeed = DEFAULT_SHAPE_SEED): ShapeSeed {
  return {
    ...seed,
    radius: { ...seed.radius },
    borderAlphas: [...seed.borderAlphas],
    elevation: { ...seed.elevation },
    motion: { ...seed.motion },
  };
}
