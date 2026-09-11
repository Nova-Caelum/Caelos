# Approved tooltip source snapshot

## Sage tooltips — locked September 7, 2026

Daniel approved: “Okay the 20% transperency option is perfect. Lock it IN!”

- Existing sage palette token; frosted sage is the default treatment.
- Base fill: 20% transparency (80% opacity), with 10px backdrop blur. Text remains fully opaque. The stationary broad gradient remains; no top-only inset highlight or animated sheen.
- Preserve the approved cream lettering in dark mode and legible ink in the light adaptation.
- IBM Plex Sans Medium 500, 13px / 19.5px, .019em tracking and .055em added word spacing for labels and supporting lines.
- 11px radius; 10px vertical and 13px horizontal padding; uniform 1px border; soft outer shadows.
- Retain opaque fallback when backdrop blur is unsupported. Opaque sage stays available as a comparison.
- Keep the existing keyboard/Escape, collision handling and reduced-motion behavior when extracting the primitive.

This supersedes earlier tooltip material proposals, including the 10% transparency experiment. Approval covers the tooltip treatment; inputs and composer remain under review. The atlas default is implemented; production integration and Panda extraction remain separate work.

## Source fingerprints

- InputLab.jsx: `e5d3618c45b6456d7d03f431f7a1716e0012baa20cf2e529ffd1055347bcc13d`
- input-lab.css: `3e885220410239d08a18112201a77a417be4d990a003ae8cdf529afbb7af15f5`

The JSX snapshot contains the surrounding input study for context; its inclusion does not approve the input or composer designs.
