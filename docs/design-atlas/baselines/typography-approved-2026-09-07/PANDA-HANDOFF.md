# Caelos material presets — Panda handoff

This atlas is a React/CSS review prototype. The production Panda migration remains a separate workstream.

| Property | Dark (default) | Light |
| --- | --- | --- |
| Base-layer transparency | 76% | 24% |
| Base-layer alpha | 0.24 | 0.76 |
| Backdrop blur | 19px | 2px |
| Violet tint strength | 0.14 | 0.23 |
| Base RGB | 30, 28, 43 | 249, 246, 251 |
| Main panel foreground | #f1e9f4 | #302638 |

The three requested numerical settings are approved. Light fill and foreground colors are supporting preview implementation values for review. Violet RGB remains 145, 125, 190. Tint is a gradient from full strength to 20% of that strength at 72%. Transparency measures the base fill, not the composite of both layers. Never apply component-level opacity: text must remain opaque. Panel saturation is 120%, portal menu saturation 135%, retained from the accepted atlas.

Use shared semantic material tokens with a root theme condition. Panda supports conditional semantic values and custom parent selectors, so an explicit application theme switch can update every consuming recipe. A dark default can use `base` dark values with a custom `_light` condition. Use the application's existing theme selector; keep the selector above portal containers too. See [Panda semantic tokens](https://panda-css.com/docs/theming/tokens) and [custom theme conditions](https://panda-css.com/docs/guides/multiple-themes).

Suggested token roles: material.panel.fill, material.menu.fill, material.blur, material.foreground, material.foregroundMuted, material.edge. Recipes consume these roles; no manual dark/light prop is required on every instance. A scoped theme override is optional for foundry comparisons. Root preference should default to dark; an explicit user light choice should select the light values and corresponding foregrounds.

Keep material usage strongest on panels and menus. Do not automatically transfer these settings onto the primary button, chips or task rows. Preserve accepted primary anchor geometry and glow. Keep reduced-motion handling, keyboard focus and opaque fallbacks. Audit actual light app contexts before calling the whole product’s light theme complete.

Current implementation: src/MaterialLab.jsx contains MATERIAL_PRESETS; src/main.jsx tracks separate mode settings; src/refinement.css scopes light material and foregrounds. REVIEW-02.md records the other accepted refinements.

## Pending navigation refinement (04)

See REVIEW-03.md. Proposed shared roles: navigation.foregroundMuted, navigation.foregroundHover, navigation.foregroundSelected (existing dawn cream), navigation.iconSelected, navigation.hoverFill, navigation.selectedFill, navigation.edgeBlur, navigation.glow. Keep the label opaque and unblurred; feather a separate background layer. Keyboard menu focus uses the visible highlighted item, and selected radio options keep their checkmark. Freestanding project tabs are the recommendation; enclosed controls remain a contextual alternative. These refinements await user review and are not production approvals.

## Selection language refinement (05)

See REVIEW-04.md. Surface-only sidebar direction is accepted. Keep navigation's current-item state independent of hover/focus. Proposed small-control selection roles: selection.foreground (#f5ead5 in dark), selection.fill (violet-to-sage tint), selection.sheen and selection.backdropBlur (6px for tabs only). Active menu text uses the foreground role while semantic status dots keep their colors. Light menus require their dark foreground counterpart. Updated color and tab material are atlas proposals awaiting review; do not migrate as final approval.

## Freestanding tabs correction (06 — latest)

The glass tab proposal above is superseded. Do not carry selection.backdropBlur or selection.sheen into the freestanding tab recipe. Reuse the refined tonal fill, soft shaped hover, and dawn-cream selected text. Keep glass on larger panels and menus. The tonal tab rendering in study 10 was approved by Daniel on 2026-09-07. See APPROVED-BASELINE.md for the locked treatment and source fingerprint.

## Typography — locked September 7, 2026

Daniel approved the saved custom lettering with “great lock it in.”

- Family: IBM Plex Sans for ordinary UI; Plex Mono for coordinates; Yrsa for the Nova Caelum signature.
- Hierarchy: Refined hierarchy (13px working text / 19.5px line height).
- Ordinary working/supporting text weight: 500 (Medium).
- Navigation and semantic controls: 500.
- Letter spacing: .019em.
- Extra word spacing: .055em, added to the normal font word space.
- Freestanding project/divider pill labels: natural case (no uppercase transform), 13px; approved reading spacing applies.
- Heading and signpost roles retain their existing treatment. IDs retain Plex Mono at 400 / 10px. The primary button retains its approved 650 / 10.5px typography, spacing, and geometry.

These settings are now the typography lab's initial and restore defaults. A/B/C remain comparison alternatives, and exports distinguish the approved combination from variations. Review notes remain saved separately and are not overwritten. This locks the design choice and handoff; production Panda migration remains separate.

Saved user note: “Okay! Natural Lettering on divider pills .019 em letter spacing. 0.055 word spacing extra. Perfect!”
