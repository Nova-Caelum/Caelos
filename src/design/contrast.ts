import { clampToGamut, hexToOklch, oklchToHex, type Oklch } from "./color";

const MAIN_TRC = 2.4;
const R_CO = 0.2126729;
const G_CO = 0.7151522;
const B_CO = 0.072175;
const BLACK_THRESHOLD = 0.022;
const BLACK_CLAMP = 1.414;
const NORM_BG = 0.56;
const NORM_TEXT = 0.57;
const REV_TEXT = 0.62;
const REV_BG = 0.65;
const SCALE = 1.14;
const LOW_OFFSET = 0.027;
const DELTA_Y_MIN = 0.0005;
const LOW_CLIP = 0.1;

function channelFromHex(hex: string, start: number): number {
  return parseInt(hex.slice(start, start + 2), 16) / 255;
}

function luminance(hex: string): number {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) throw new Error(`Invalid hex color: ${hex}`);
  return R_CO * Math.pow(channelFromHex(normalized, 0), MAIN_TRC)
    + G_CO * Math.pow(channelFromHex(normalized, 2), MAIN_TRC)
    + B_CO * Math.pow(channelFromHex(normalized, 4), MAIN_TRC);
}

function softClampBlack(value: number): number {
  return value >= BLACK_THRESHOLD
    ? value
    : value + Math.pow(BLACK_THRESHOLD - value, BLACK_CLAMP);
}

/** APCA-W3 0.0.98G-4g. Positive is dark-on-light; negative is light-on-dark. */
export function apcaLc(foregroundHex: string, backgroundHex: string): number {
  const textY = softClampBlack(luminance(foregroundHex));
  const backgroundY = softClampBlack(luminance(backgroundHex));
  if (Math.abs(backgroundY - textY) < DELTA_Y_MIN) return 0;

  if (backgroundY > textY) {
    const sapc = (Math.pow(backgroundY, NORM_BG) - Math.pow(textY, NORM_TEXT)) * SCALE;
    return sapc < LOW_CLIP ? 0 : (sapc - LOW_OFFSET) * 100;
  }

  const sapc = (Math.pow(backgroundY, REV_BG) - Math.pow(textY, REV_TEXT)) * SCALE;
  return sapc > -LOW_CLIP ? 0 : (sapc + LOW_OFFSET) * 100;
}

export interface SolvedText {
  color: Oklch;
  hex: string;
  lc: number;
  reachable: boolean;
  clamped: boolean;
}

/** Builds the requested H/C first, then solves L against the quantized, gamut-mapped output. */
export function solveTextL(
  backgroundHex: string,
  targetLc: number,
  huePolicy: Pick<Oklch, "h" | "c">,
): SolvedText {
  const background = hexToOklch(backgroundHex);
  const target = Math.abs(targetLc);
  let low = Math.min(1, Math.max(0, background.l));
  let high = 1;
  let best: SolvedText | null = null;

  const sample = (l: number): SolvedText => {
    const requested = { l, c: Math.max(0, huePolicy.c), h: huePolicy.h };
    const gamut = clampToGamut(requested);
    const hex = oklchToHex(gamut.color);
    const lc = apcaLc(hex, backgroundHex);
    return {
      color: gamut.color,
      hex,
      lc,
      reachable: true,
      clamped: gamut.clamped,
    };
  };

  for (let index = 0; index < 14; index += 1) {
    const middle = (low + high) / 2;
    const candidate = sample(middle);
    if (!best || Math.abs(Math.abs(candidate.lc) - target) < Math.abs(Math.abs(best.lc) - target)) {
      best = candidate;
    }
    if (Math.abs(candidate.lc) < target) low = middle;
    else high = middle;
  }

  const top = sample(1);
  if (!best || Math.abs(Math.abs(top.lc) - target) < Math.abs(Math.abs(best.lc) - target)) best = top;
  best.reachable = Math.abs(Math.abs(best.lc) - target) <= 2;
  return best;
}
