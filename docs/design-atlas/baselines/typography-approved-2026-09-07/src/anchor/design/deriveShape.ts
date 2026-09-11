import { DEFAULT_SHAPE_SEED, type ShapeSeed } from "./shapeSeed";

export interface ShapeTheme {
  css: Record<string, string>;
}

const SPACE_STEPS = [1, 2, 3, 4, 5, 6, 8, 10] as const;

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function px(value: number): string {
  return `${Number(value.toFixed(2))}px`;
}

function alpha(value: number): number {
  return Math.max(0, Math.min(1, finite(value, 0)));
}

function shadow(level: number, seed: ShapeSeed): string {
  if (level === 0) return "0 0 0 rgba(0, 0, 0, 0)";
  const lift = Math.pow(level, Math.max(1, finite(seed.elevation.liftCurve, 1)));
  const y = 2.5 * lift;
  const ambientBlur = 12 * lift;
  const keyBlur = 4.5 * lift;
  const ambient = alpha(seed.elevation.ambientAlpha * (0.68 + level * 0.12));
  const key = alpha(seed.elevation.keyAlpha * (0.58 + level * 0.1));
  return `0 ${px(y)} ${px(ambientBlur)} rgba(0, 0, 0, ${ambient.toFixed(3)}), 0 ${px(Math.max(1, y * 0.42))} ${px(keyBlur)} rgba(0, 0, 0, ${key.toFixed(3)})`;
}

export function deriveShape(seed: ShapeSeed): ShapeTheme {
  const css: Record<string, string> = {};
  const unit = Math.max(1, finite(seed.spaceUnit, DEFAULT_SHAPE_SEED.spaceUnit));
  SPACE_STEPS.forEach((step, index) => {
    css[`--sys-space-${index + 1}`] = px(unit * step);
  });

  const floor = Math.max(0, finite(seed.radius.floor, DEFAULT_SHAPE_SEED.radius.floor));
  const base = Math.max(floor, finite(seed.radius.base, DEFAULT_SHAPE_SEED.radius.base));
  const curve = Math.max(1, finite(seed.radius.curve, DEFAULT_SHAPE_SEED.radius.curve));
  css["--sys-radius-sm"] = px(Math.max(floor, base / curve));
  css["--sys-radius-md"] = px(base);
  css["--sys-radius-lg"] = px(Math.max(floor, base * curve));
  css["--sys-radius-xl"] = px(Math.max(floor, base * curve * curve));
  css["--sys-radius-full"] = "999px";

  seed.borderAlphas.forEach((_value, index) => {
    css[`--sys-border-${index + 1}`] = `var(--sys-hair-${index + 1})`;
    css[`--sys-border-width-${index + 1}`] = px((index + 1) * 0.5);
  });

  for (let level = 0; level <= 3; level += 1) {
    css[`--sys-elev-${level}`] = shadow(level, seed);
  }

  const baseMs = Math.max(80, finite(seed.motion.baseMs, DEFAULT_SHAPE_SEED.motion.baseMs));
  css["--sys-motion-fast"] = `${Math.round(baseMs * 0.55)}ms`;
  css["--sys-motion-base"] = `${Math.round(baseMs)}ms`;
  css["--sys-motion-slow"] = `${Math.round(baseMs * 1.5)}ms`;
  css["--sys-ease-out"] = seed.motion.ease;
  css["--sys-ease-snap"] = seed.motion.easeSnap;

  return { css };
}

export const SHAPE = {
  space1: "var(--sys-space-1)",
  space2: "var(--sys-space-2)",
  space3: "var(--sys-space-3)",
  space4: "var(--sys-space-4)",
  space5: "var(--sys-space-5)",
  space6: "var(--sys-space-6)",
  space7: "var(--sys-space-7)",
  space8: "var(--sys-space-8)",
  radiusSm: "var(--sys-radius-sm)",
  radiusMd: "var(--sys-radius-md)",
  radiusLg: "var(--sys-radius-lg)",
  radiusXl: "var(--sys-radius-xl)",
  radiusFull: "var(--sys-radius-full)",
  border1: "var(--sys-border-1)",
  border2: "var(--sys-border-2)",
  border3: "var(--sys-border-3)",
  elevation0: "var(--sys-elev-0)",
  elevation1: "var(--sys-elev-1)",
  elevation2: "var(--sys-elev-2)",
  elevation3: "var(--sys-elev-3)",
  motionFast: "var(--sys-motion-fast)",
  motionBase: "var(--sys-motion-base)",
  motionSlow: "var(--sys-motion-slow)",
  easeOut: "var(--sys-ease-out)",
  easeSnap: "var(--sys-ease-snap)",
} as const;

export const shapeTheme = deriveShape(DEFAULT_SHAPE_SEED);
