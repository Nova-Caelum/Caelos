import { oklchToHex } from "./color";
import type { CharacterSeed, SurfaceName } from "./characterSeed";
import type { Seed } from "./seed";

const SURFACES: SurfaceName[] = ["chrome", "ground", "elevated", "elevated-2", "top"];

export function deriveCharacter(character: CharacterSeed, color: Seed): string {
  const graphLine = oklchToHex({ l: 0.58, c: color.hueVector.c, h: color.hueVector.h });
  const graphMix = Math.round(character.graphIntensity * 100);
  const glassMix = Math.round((0.46 + character.glassIntensity * 0.34) * 100);
  const blur = Math.round(8 + character.glassIntensity * 24);

  return SURFACES.map((surface) => {
    const mode = character.modes[surface];
    const selector = `[data-surface="${surface}"]`;
    if (mode === "graph") {
      return `${selector} {
  background-color: var(--sys-${surface}) !important;
  background-image:
    linear-gradient(color-mix(in srgb, ${graphLine} ${graphMix}%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, ${graphLine} ${graphMix}%, transparent) 1px, transparent 1px) !important;
  background-size: 28px 28px !important;
}`;
    }
    if (mode === "glass") {
      return `${selector} {
  background-color: color-mix(in srgb, var(--sys-${surface}) ${glassMix}%, transparent) !important;
  background-image: none !important;
  -webkit-backdrop-filter: blur(${blur}px) saturate(140%);
  backdrop-filter: blur(${blur}px) saturate(140%);
}`;
    }
    return `${selector} {
  background-color: var(--sys-${surface}) !important;
  background-image: none !important;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}`;
  }).join("\n\n");
}

export function applyCharacterCss(css: string): void {
  let style = document.getElementById("sys-character") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "sys-character";
    document.head.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}
