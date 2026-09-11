# Daniel’s first review — preserved decision record

Submitted September 6–7, 2026. Faithful summaries of the supplied notes; original wording remains in the conversation. Source links for every study remain in src/sources.js and in exported reviews.

| Study | Decision | Requested direction |
|---|---|---|
| 01 Quiet veil | Pass | No further note. |
| 02 Depth without noise | Explore | Favorite. Independently experiment with transparency, background blur, and color; glass intensity seemed to change pattern visibility. |
| 03 Responsive light | Pass | No further note. |
| 04 A softer sidebar | Explore | Less firm hover boundary, greater hover transparency, firmer selection. Subtle hover text color mutation and more pronounced selected text. |
| 05 The task row, considered | Explore | Remove redundant badge dots. Leading dot matches status color. Keep completed green check, dim completed text and strike it through. Show owner name in tooltip. |
| 06 Filters with room to breathe | Keep | Like this. Confirm updated brand typography; Yrsa and IBM were recalled. |
| 07 Information or action | Explore | Like these. Discuss whether dot and full word are both needed; compare alternatives that retain visual presence. |
| 08 A floating layer | Explore | Separate intensity from transparency; move glass over varied surfaces including graph paper. |
| 09 Preserve the strongest thing | Keep | Love this. Soften hover boundaries so text feels less confined. |
| 10 Motion that explains | Explore | Crisp but abrupt; experiment with variable acceleration. |

## Refinement judgments

- Transparency is the inverse alpha of the base surface; blur and tint are independent. Backdrops remain fixed. The exploratory extremes can reduce contrast; they are not declared production-safe presets. This is CSS backdrop filtering, not a recreation of Apple’s optical refraction.
- Use text-only status pills in task rows: the leading status mark already carries that signal. The standalone alternative uses a distinct shape per state, which adds information beyond color. Keep the chevron for editable pills.
- Keep the current primary button source intact. Soften companion text/tonal hover treatments.
- IBM Plex Sans covers operational UI; IBM Plex Mono covers identifiers and shortcuts. Yrsa is reserved for the exact Nova Caelum wordmark.
- Gentle acceleration uses cubic-bezier(.4,0,.2,1), with 320ms selection and 380ms expansion. Original crisp stays available for direct comparison. Reduced motion removes movement.
- These are review proposals in the isolated atlas, not accepted production migrations.
