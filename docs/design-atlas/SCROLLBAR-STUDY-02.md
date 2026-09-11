# Scrollbar study 02 — quieter presence

2026-09-08 · Proposed revision, awaiting review.

User direction: both options were too loud; no hover treatment. Visible but easy to ignore.

- Removed all scrollbar hover brightening and aura, including the hover preview control.
- A: sage at 24% opacity at rest and hover; 32% while dragging.
- B: sage at 18% opacity at rest and hover; 26% while dragging.
- Light theme uses muted dark sage at the same opacity levels.
- Preserved rounded 6px visible thumbs, inset geometry, and 22px interaction tracks.
- No glow, width change, or movement on hover. Dragging has only a small tonal change.
- Approved input/composer baselines remain untouched; this is a scrollbar study.

Verification: production build passed; both variants have identical computed rest/hover fills and no shadow; native scrolling, thumb dragging (219px), keyboard scrolling (40px), menu actions, and editable composer exercised. No browser errors or narrow-layout horizontal overflow. Dark and light screenshots visually reviewed.
