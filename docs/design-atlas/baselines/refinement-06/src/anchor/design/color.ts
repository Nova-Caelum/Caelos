export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export interface GamutResult {
  color: Oklch;
  clamped: boolean;
}

type Rgb = { r: number; g: number; b: number };

const EPSILON = 1e-7;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function normalizeHue(hue: number): number {
  const normalized = hue % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function linearToSrgb(channel: number): number {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.trim().replace(/^#/, "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(expanded.slice(0, 2), 16) / 255,
    g: parseInt(expanded.slice(2, 4), 16) / 255,
    b: parseInt(expanded.slice(4, 6), 16) / 255,
  };
}

function oklchToLinearRgb(color: Oklch): Rgb {
  const hue = normalizeHue(color.h) * Math.PI / 180;
  const a = color.c * Math.cos(hue);
  const b = color.c * Math.sin(hue);

  const l_ = color.l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = color.l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = color.l - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function inLinearGamut(rgb: Rgb): boolean {
  return rgb.r >= -EPSILON && rgb.r <= 1 + EPSILON
    && rgb.g >= -EPSILON && rgb.g <= 1 + EPSILON
    && rgb.b >= -EPSILON && rgb.b <= 1 + EPSILON;
}

function colorToRgb(color: Oklch): Rgb {
  const linear = oklchToLinearRgb(color);
  return {
    r: clamp01(linearToSrgb(clamp01(linear.r))),
    g: clamp01(linearToSrgb(clamp01(linear.g))),
    b: clamp01(linearToSrgb(clamp01(linear.b))),
  };
}

export function hexToOklch(hex: string): Oklch {
  const rgb = hexToRgb(hex);
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const labL = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const labA = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const labB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const chroma = Math.sqrt(labA * labA + labB * labB);

  return {
    l: labL,
    c: chroma,
    h: chroma < EPSILON ? 0 : normalizeHue(Math.atan2(labB, labA) * 180 / Math.PI),
  };
}

export function clampToGamut(input: Oklch, iterations = 12): GamutResult {
  const color = {
    l: clamp01(input.l),
    c: Math.max(0, input.c),
    h: normalizeHue(input.h),
  };
  const lWasClamped = Math.abs(color.l - input.l) > EPSILON;

  if (inLinearGamut(oklchToLinearRgb(color))) {
    return { color, clamped: lWasClamped };
  }

  let low = 0;
  let high = color.c;
  for (let index = 0; index < iterations; index += 1) {
    const next = (low + high) / 2;
    if (inLinearGamut(oklchToLinearRgb({ ...color, c: next }))) low = next;
    else high = next;
  }

  return { color: { ...color, c: low }, clamped: true };
}

export function oklchToHex(input: Oklch): string {
  const { color } = clampToGamut(input);
  const rgb = colorToRgb(color);
  const channel = (value: number) => Math.round(value * 255).toString(16).padStart(2, "0");
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`.toUpperCase();
}

export function oklchToRgbaString(input: Oklch, alpha: number): string {
  const { color } = clampToGamut(input);
  const rgb = colorToRgb(color);
  const channel = (value: number) => Math.round(value * 255);
  const safeAlpha = Math.round(clamp01(alpha) * 1000) / 1000;
  return `rgba(${channel(rgb.r)}, ${channel(rgb.g)}, ${channel(rgb.b)}, ${safeAlpha})`;
}

export function mixOklch(a: Oklch, b: Oklch, amount: number): Oklch {
  const t = clamp01(amount);
  const hueA = a.c < EPSILON ? b.h : a.h;
  const hueB = b.c < EPSILON ? a.h : b.h;
  const delta = ((hueB - hueA + 540) % 360) - 180;

  return {
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: normalizeHue(hueA + delta * t),
  };
}
