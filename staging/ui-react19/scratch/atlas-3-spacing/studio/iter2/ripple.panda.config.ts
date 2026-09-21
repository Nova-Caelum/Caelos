import { defineConfig } from '@pandacss/dev';
import { rippleLoader } from '../../../../src/ripple-loader-recipe';
import preset from '../../../../src/preset';

// Consume the authored recipe and keyframes without rebuilding or changing the package.
export default defineConfig({
  preflight: false, prefix: 'caelos', presets: [], include: [],
  outdir: './studio/iter2/generated',
  theme: { extend: { recipes: { rippleLoader }, keyframes: { 'nc-ripple': preset.theme!.extend!.keyframes!['nc-ripple'] } } },
  staticCss: { recipes: { rippleLoader: ['*'] } },
});
