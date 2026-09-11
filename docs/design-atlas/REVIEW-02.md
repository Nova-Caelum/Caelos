# Daniel’s second atlas review — September 7, 2026

Recorded from the review submitted in this thread. This is a summary, not a verbatim transcript. Source references remain in src/sources.js and the gallery export.

| Study | Decision | Requested refinement |
| --- | --- | --- |
| 01 Quiet veil | Unreviewed | No new note |
| 02 Depth without noise | Keep | Dark default: 76% transparency, 19px blur, 14% violet tint. Light: 24%, 2px, 23%. Separate theme presets. |
| 03 Responsive light | Pass | No new note |
| 04 A softer sidebar | Explore | Hover 15% stronger, selection 15% softer. Close their exaggerated contrast. |
| 05 The task row, considered | Keep | Perfect. |
| 06 Filters with room to breathe | Keep | Perfect. |
| 07 Information or action | Keep | Text plus chevron is perfect. Soften the dropdown outline. |
| 08 A floating layer | Keep | Perfect; apply separate material presets. |
| 09 Preserve the strongest thing | Keep | Extend text-button aura slightly farther beyond the word. |
| 10 Motion that explains | Keep | Gentle acceleration is perfect. |

## Implemented in Refinement 03

Material mode switches panels, menu surfaces, and their sample backdrops. Gallery chrome remains dark. Each mode holds its own slider values during the session. Reset material restores the selected mode’s exact preset. Export includes active mode and both settings. Light foregrounds and status colors switch along with the fill. Opaque mode and unsupported-blur fallback retain readable solid surfaces.

Sidebar hover alpha: 20/255 → 23/255 (+15%). Selection stops: 36/255 → 31/255 and 16/255 → 14/255 (approximately −15%, rounded to CSS hex channels). Geometry, typography and accepted motion unchanged.

Dropdown border: 10.2% → 4.3% opacity in dark material. Removed redundant focus outline on the menu container; highlighted menu items and trigger focus indicators remain. Text-button halo grows from inset 0/−5px and 4px blur to −3/−11px and 6px blur.

The submitted review seeds fresh browser records. Existing records differing from the original round-one seed retain precedence, including cleared decisions. This archive remains the authoritative record of this submission regardless of browser edits.
