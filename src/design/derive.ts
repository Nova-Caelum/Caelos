import {
  clampToGamut,
  mixOklch,
  oklchToHex,
  oklchToRgbaString,
  type Oklch,
} from "./color";
import { apcaLc, solveTextL } from "./contrast";
import { SEMANTIC_NAMES, type Seed } from "./seed";

export interface NcCompat {
  cream: string;
  textMuted: string;
  textDim: string;
  textFaint: string;
  bg: string;
  ground: string;
  chrome: string;
  card: string;
  elevated: string;
  elevated2: string;
  green: string;
  accent: string;
  accentHover: string;
  accentTint: string;
  accentLine: string;
  accentCream: string;
  sage: string;
  seaGreen: string;
  peachGold: string;
  deepMaroon: string;
  lightIndigo: string;
  desaturatedViolet: string;
  violet: string;
  slateViolet: string;
  stone: string;
  mutedStone: string;
  border: string;
  borderFaint: string;
  hair3: string;
}

export interface ThemeMeta {
  clamped: string[];
  measuredLc: Record<string, number>;
}

export interface Theme {
  css: Record<string, string>;
  nc: NcCompat;
  meta: ThemeMeta;
}

const NC_COMPAT: NcCompat = {
  cream: "var(--sys-text-primary)",
  textMuted: "var(--sys-text-secondary)",
  textDim: "var(--sys-text-tertiary)",
  textFaint: "var(--sys-text-faint)",
  bg: "var(--sys-ground)",
  ground: "var(--sys-ground)",
  chrome: "var(--sys-chrome)",
  card: "var(--sys-elevated)",
  elevated: "var(--sys-elevated)",
  elevated2: "var(--sys-elevated-2)",
  green: "var(--sys-accent)",
  accent: "var(--sys-accent)",
  accentHover: "var(--sys-accent-hover)",
  accentTint: "var(--sys-accent-tint)",
  accentLine: "var(--sys-accent-line)",
  accentCream: "var(--sys-accent-on-tint)",
  sage: "var(--sys-sem-sage)",
  seaGreen: "var(--sys-sem-done)",
  peachGold: "var(--sys-sem-progress)",
  deepMaroon: "var(--sys-sem-danger)",
  lightIndigo: "var(--sys-sem-ready)",
  desaturatedViolet: "var(--sys-sem-atmospheric)",
  violet: "var(--sys-sem-structural)",
  slateViolet: "var(--sys-sem-structural)",
  stone: "var(--sys-sem-neutral)",
  mutedStone: "var(--sys-sem-neutral)",
  border: "var(--sys-hair-2)",
  borderFaint: "var(--sys-hair-1)",
  hair3: "var(--sys-hair-3)",
};

function accentSet(
  css: Record<string, string>,
  clamped: Set<string>,
  prefix: string,
  source: Oklch,
  primary: Oklch,
  alpha: { tint: number; line: number },
) {
  const putHex = (suffix: string, color: Oklch) => {
    const name = `${prefix}${suffix}`;
    const gamut = clampToGamut(color);
    css[name] = oklchToHex(gamut.color);
    if (gamut.clamped) clamped.add(name);
  };

  putHex("", source);
  putHex("-hover", { ...source, l: source.l + 0.055 });
  css[`${prefix}-tint`] = oklchToRgbaString(source, alpha.tint);
  css[`${prefix}-line`] = oklchToRgbaString(source, alpha.line);
  css[`${prefix}-glow`] = oklchToRgbaString(source, 0.28);
  // Lift toward the primary text's lightness/chroma while holding the authored
  // accent hue. A full hue interpolation can cross warm red on the shortest arc
  // (indigo → cream), which changes the semantic identity of the accent.
  css[`${prefix}-on-tint`] = oklchToRgbaString(
    mixOklch(source, { ...primary, h: source.h }, 0.55),
    0.9,
  );
}

export function derive(seed: Seed): Theme {
  const css: Record<string, string> = {};
  const clamped = new Set<string>();
  const measuredLc: Record<string, number> = {};
  const surfaceNames = ["chrome", "ground", "elevated", "elevated-2", "top"] as const;

  surfaceNames.forEach((name, index) => {
    const token = `--sys-${name}`;
    const requested: Oklch = {
      l: seed.groundBase.l + index * 0.033 * seed.contrast,
      c: Math.min(0.045, seed.hueVector.c + index * seed.hueVector.cRamp),
      h: seed.hueVector.h,
    };
    const gamut = clampToGamut(requested);
    css[token] = oklchToHex(gamut.color);
    if (gamut.clamped) clamped.add(token);
  });

  const background = css["--sys-ground"];
  // Text character: solver holds luminance to the APCA target; each tier's
  // identity is expressed via chroma + hue directly. Primary keeps full
  // warm-cream. Secondary dims warmth (same warm hue, lower chroma — a
  // "quieter cream"). Tertiary + faint cross to the cool-structural hue at
  // low chroma — a "violet whisper." Matches the hand-authored legacy
  // character (#F4EAD5→#9089A0→#6E677E→#55506A) while dodging the mixOklch
  // shortest-arc pitfall: cream(~66°)→violet(~284°) routes through RED on
  // the short path, which pink-shifted every intermediate tier before this fix.
  const textPolicies: Record<
    keyof typeof seed.textTargets,
    { c: number; h: number }
  > = {
    primary:   { c: seed.lightWarm.c,        h: seed.lightWarm.h },
    secondary: { c: seed.lightWarm.c * 0.55, h: seed.lightWarm.h },
    tertiary:  { c: seed.hueVector.c * 0.9,  h: seed.hueVector.h },
    faint:     { c: seed.hueVector.c * 1.4,  h: seed.hueVector.h },
  };

  (Object.keys(textPolicies) as Array<keyof typeof textPolicies>).forEach((name) => {
    const token = `--sys-text-${name}`;
    const policy = textPolicies[name];
    const solved = solveTextL(background, seed.textTargets[name], policy);
    css[token] = solved.hex;
    measuredLc[token] = solved.lc;
    if (solved.clamped) clamped.add(token);
  });

  const hairScale = 0.7 + 0.3 * seed.contrast;
  seed.hairAlphas.forEach((alpha, index) => {
    css[`--sys-hair-${index + 1}`] = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha * hairScale)).toFixed(3)})`;
  });

  const primary = seed.lightWarm;
  accentSet(css, clamped, "--sys-accent", seed.accents.cool, primary, { tint: 0.1, line: 0.22 });
  accentSet(css, clamped, "--sys-accent-hot", seed.accents.hot, primary, { tint: 0.1, line: 0.22 });

  SEMANTIC_NAMES.forEach((name) => {
    accentSet(css, clamped, `--sys-sem-${name}`, seed.semantics[name], primary, { tint: 0.14, line: 0.26 });
  });

  measuredLc["--sys-text-primary"] = apcaLc(css["--sys-text-primary"], background);
  measuredLc["--sys-text-secondary"] = apcaLc(css["--sys-text-secondary"], background);
  measuredLc["--sys-text-tertiary"] = apcaLc(css["--sys-text-tertiary"], background);
  measuredLc["--sys-text-faint"] = apcaLc(css["--sys-text-faint"], background);

  return { css, nc: { ...NC_COMPAT }, meta: { clamped: [...clamped].sort(), measuredLc } };
}
