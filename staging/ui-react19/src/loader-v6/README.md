# Nova Caelum orbital loader — v6

Created from the written brief only. The reference MP4 was not opened or used.

Five tapered rays circulate around a fixed orb. Each ray follows a different closed, gently warped 3D ellipse with the orb at its focus. Perspective changes the projected curvature and thickness. The design uses one solid fill; no background, gradients, glow, particles, opacity animation, randomness, or secondary rotation.

The complete choreography repeats every 12 seconds. Two rays complete an orbit in six seconds, two in four seconds, and one in three seconds. The slowest now matches v2’s median orbital rate; the mean orbital rate is 75% higher. Ray segments are filled vector outlines sampled along their actual trajectories. Crossings share the same ink; they do not use cutout masks or lighting effects.

## Changes from v5

The lowest-reaching ray follows a tighter orbit: its orbital radius parameter is reduced from 79 to 69 vector units (approximately 13%). The other four rays, central orb size, speeds, and twelve-second loop are preserved.

## Files

- `preview.html`: self-contained offline preview with playback and timeline controls, plus 64 px and 32 px examples. The browser supplies its light/dark viewing surface; the animation has no background.
- `nova-loader.js`: dependency-free web renderer. Uses SVG and the display's animation clock, inherits CSS `color`, and adjusts ray weight and orb size for small loading states.
- `nova-loader.svg`: standalone animated SVG with one warm monochrome fill (`#edcbb5`), a transparent background, and a static alternative for reduced motion. Approximately 2 MB before compression because the path frames are embedded. Use the much smaller JavaScript renderer for application UI.
- `nova-loader-still.svg`: static vector mark.

## Web integration

```html
<div id="nova-loading" style="width:64px;height:64px;color:#edcbb5"></div>
<script src="nova-loader.js"></script>
<script>
  const loader = NovaLoader.mount(document.getElementById('nova-loading'));
  // When the loading state is removed:
  // loader.destroy();
</script>
```

The host determines the color and size. The renderer adds only five ray paths and one orb to its SVG. It provides a “Loading” accessible label, respects `prefers-reduced-motion`, and pauses when the document is hidden.

Methods: `pause()`, `play()`, `render(seconds)`, `destroy()`. Pause before calling `render()` to inspect a fixed frame. For a static initial mount, pass `{ autoplay: false }` as the second argument.

For an SVG image:

```html
<img src="nova-loader.svg" width="96" height="96" alt="Loading">
```

The SVG image has a fixed fill and fixed relative line weights. Change its root `fill` to recolor it; an external image does not inherit the surrounding page's CSS color. The web renderer supplies the optical adjustments shown in the small-size previews.

This package targets browsers and app webviews. It does not include a native SwiftUI, Android, React Native, or Lottie adapter.

## Verification

- Sampled 720 frames: exactly five ray geometries, finite coordinates, and all outlines inside the 240 × 240 viewBox.
- Verified matching geometry at zero and twelve seconds and at six other paired loop positions. Checked motion continuity across the seam numerically.
- Rasterized the vector to check transparent corners and a single solid source color. Edge antialiasing introduces normal coverage and channel-rounding differences.
- Visually reviewed twelve phases and enlarged, 64 px, and 32 px browser renderings.
- Tested playback, pause, timeline seeking, reduced-motion behavior, standalone animated SVG playback, and absence of page errors in local Chromium.
- Checked desktop and 360 px mobile preview layouts in light and dark themes.

No dependencies were installed, and no files were written to the Nova Caelum Obsidian vault.
