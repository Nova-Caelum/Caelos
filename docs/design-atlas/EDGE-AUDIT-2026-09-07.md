# Atlas edge audit — 2026-09-07

Removed the tooltip top-only inset highlight in both dark and light themes. The shared rule covers sage, frosted sage, and the retained blue variant. Uniform 1px borders, equal 10px vertical padding, typography, outer shadows, and the existing frost settings remain intact.

## Scope and findings

Reviewed all atlas CSS and JSX for top-only inset shadows, asymmetric component borders, inline shadows, and edge overlays. Checked browser-computed borders and shadows for material cards, floating panels, specimen cards, filter chips, status badges and controls, freestanding tabs, and the open project menu. Visually inspected chips/status, the floating and open menus, and tooltip comparisons.

The duplicate top-edge highlight was isolated to the tooltip rules. Other inspected component borders are equal at top and bottom. The two remaining inset shadows are uniform keyboard-focus rings on navigation and menu rows; these are intentional. Section and table dividers are structural separators, not duplicate surface borders.

Verified both tooltip themes in the browser: 1px top/bottom borders, 10px top/bottom padding, and no inset shadow. Restored the input study to dark mode.

Scope is the local design atlas at localhost:5181. This is not a production Taskgraph audit or a cross-browser rasterization certification.
