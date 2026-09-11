# Scrollbar — locked September 9, 2026

Daniel approved the final refinement: “perfect! lock it in. That is everything.”

## Definitive treatment

- One treatment: Soft presence. Earlier alternatives are superseded.
- Rest and hover: existing desaturated violet (`--sys-sem-atmospheric`) at 15% opacity. No hover brightening, glow, or expansion.
- Dragging: same tone at 24% opacity, with a restrained 180ms deceleration on the fill transition.
- Fully rounded 6px visible thumb within a 22px interaction track; minimum thumb height 28px.
- Transparent track. Native scroll position follows input directly.
- Light adaptation: existing slate violet (`--sys-sem-structural`), with the same opacity levels. No new palette colors.
- Preserve keyboard scrolling, reduced motion and forced-color adaptations during extraction.

The sidebar, menu and editable composer are review contexts for the same scrollbar. Their demonstration content does not change the separately approved composer design.

## Frozen reference

`baselines/scrollbar-approved-2026-09-09` contains the approved scrollbar sources and palette derivation references, with SHA-256 fingerprints in `manifest.json`. This is an archival reference, not another maintained component library.

The design is approved. Panda extraction and production replacement remain implementation work. See [PANDA-HANDOFF.md](PANDA-HANDOFF.md) for the full implementation scope.
