# Composer width review

This is a Gallery-only composition host for the September 20 Composer revision. It does not change staging, the approved baseline specimen, or the shared Composer's default width. Numeric values below are adjustable review parameters, not finalized production Panda tokens.

`ResponsiveConversationPreview` accepts the Composer in `children`, suggestions/messages in `chatContent`, and optional `showControls` (defaults to `true`). Its preset selector changes the available pane independently of the browser viewport. A preset wider than its containing area is capped; the readout shows the actual measured width. Expand the browser to review the larger presets.

The host measures the available conversation pane with `ResizeObserver`; a sidebar or workspace changing that pane recomputes the layout without a browser resize. Both regions remain centered and update together without a width transition.

For pane width `P`, outer-margin progress `t = clamp((P - 640) / 680, 0, 1)` and inset progress `u = clamp((P - 1024) / 724, 0, 1)`:

- Minimum outer chat margin per side: `10 + 54t`.
- Chat overhang beyond the Composer per side: `200u`.
- Chat width: `min(P - 2 × outer margin, 1620)`.
- Composer width: `chat width - 2 × overhang`.

Revision after user review: the Composer and chat share a width through 1024px. The overhang grows linearly from zero at 1024px to 200px per side at 1748px, keeping the Composer more prominent at intermediate sizes. Outer chat margins independently grow from 10px at 640px to 64px at 1320px. Below 640px both surfaces share 10px side margins. At 1748px the Composer reaches 1220px and chat reaches 1620px; additional pane width becomes equal outer margins. The header proportions study imports the same measurement function.

Only this review host overrides the existing 780px Composer workspace and AlertStage maximum. Shared materials and controls remain owned by the package. The Gallery integrates the new host independently of its preserved approved Composer specimen.

Verification script: `scripts/verification/composer-width-review.mjs`. It checks actual Composer shell/workspace geometry, not just the wrapper. Recorded results and selected screenshots are saved under `docs/design/verification/`. Passing geometry checks are implementation evidence; user design signoff and production tokenization/promotion remain separate steps.

Verified September 20: actual panes of 390, 640, 800, 1024, 1320, 1512, 1748, 1920 and 2560px; a container-only resize to 950px; a 390px browser clamping an oversized preset; and the 1320px light-theme specimen. No JavaScript errors occurred. The review's descendants stay inside the narrow viewport. The overall Gallery still measures 421px at that 390px viewport because separate existing agent-card specimens and a Gallery chip extend past the edge; this host does not alter those specimens. The current review does not render an AlertStage, so its scoped width override has not been exercised by these browser checks.
