# Review 03 — shaped hover and live tab reference

User feedback after Refinement 03:

- Text-button glow is perfect; preserve it.
- Hover was overcorrected and needs more definition and rounded form.
- Selected surfaces need softer boundaries, using edge blur and/or a light glow.
- The live Taskgraph blue selection and dawn-cream selected text are central to the desired identity. Inactive labels should be grayer but legible.
- The live sidebar's squared highlight is disliked. The vertical blue marker is undecided.
- Live project tabs use freestanding uppercase labels with a rounded blue selected capsule. User remains fond of them and asks whether to prefer them to study 10's enclosed tabs.

## Refinement 04 — proposed for review

Study 04 now uses a shaped blue-violet hover, slightly feathered blue-violet selection, dawn-cream selected text from the existing `--sys-text-primary` token (currently #ede3cf), and muted inactive labels. Blur affects only the background plane. Surface only is the recommended default; Soft marker enables a short rounded glowing vertical marker for comparison. Pin actions and focus behavior remain functional.

Study 08 and portal menus use the same clearer rounded hover vocabulary with a fine feathered edge and cream active label. The duplicate Radix item focus ring is removed; the focused menu item remains visibly highlighted. Light materials retain dark foregrounds.

Study 10 offers Freestanding pills (default) and Enclosed control. The first adapts the live project-tab geometry and uppercasing; the second retains the original atlas treatment. Both demonstrate the same inspector content and accepted gentle acceleration. These are styling comparisons, not a new production navigation implementation.

Recommendation: use freestanding pills for project-level navigation, where open spacing suits the current Caelos identity. Reserve enclosed controls for compact, local view switches. Do not add the sidebar marker by default unless the surface/text combination proves insufficient in a dense real tree.

These changes are proposed, not newly approved. Existing browser votes and notes remain intact. Primary button, text-button glow, accepted task rows, chips, materials and motion curves are preserved.
