# Layer C Foundry design QA

final result: passed

## Comparison target

- Source visual truth path: `http://127.0.0.1:5173/?locked=1` (Caelos Locked Studio canonical chemistry).
- Implementation path: `http://127.0.0.1:5173/?foundry=1` (Foundry Components view).
- Implementation screenshot path: in-app browser capture of the implementation URL, recorded in the 2026-07-30 comparison run.
- Source screenshot path: in-app browser capture of the source URL, recorded in the same comparison run.
- Viewport: 1280 × 720 CSS px; device pixel ratio 2.
- Source and implementation captures: 1280 × 720 rendered comparison images. The browser capture normalized both to the same visible viewport; no further density conversion was used.
- State: dark theme, Foundry default `Components` view, live playground at rest, Button matrix open.

## Full-view comparison evidence

The source and implementation captures were emitted together in one comparison input. They are intentionally different screens, so the comparison is limited to the Locked Studio visual language rather than information architecture. The implementation preserves the source's dark violet field, warm primary text, small tracked labels, restrained hairlines, matte/glass layering, quiet indigo accent, and compact control density. The Foundry panel remains visually subordinate to the underlying app while making the live mechanism test the dominant panel task.

No actionable P0, P1, or P2 differences were found.

## Focused-region comparison evidence

The live instrument panel and the open Button matrix were inspected at readable scale. Button hierarchy, neutral rest states, accent bloom, destructive family swap, disabled opacity, card surfaces, compact chips, icon sizing, and control alignment all follow the canonical chemistry. A DOM geometry probe measured icon-to-label center delta at 0.5 px, below the 1 px gate.

## Required fidelity surfaces

- Fonts and typography: existing application font stack is preserved. Compact UI labels, tracked eyebrows, restrained weights, truncation, and hierarchy match the Locked Studio character.
- Spacing and layout rhythm: panel density is compact and consistent; token-derived gaps, padding, radii, control heights, and elevations respond live to the shape seed. No persistent controls are clipped at the 1280 × 720 viewport.
- Colors and visual tokens: all primitive CSS consumes `--sys-*` variables. The cool accent remains the identity family; danger is a warm family swap. No hex, `rgb()`/`rgba()`, or pixel literals occur under `src/primitives/`.
- Image quality and asset fidelity: no new raster imagery is required. The existing Nova Caelum wordmark remains untouched, and all new interface icons use the existing Lucide library.
- Copy and content: labels describe mechanism behavior directly. Static radius/elevation specimens are explicitly marked `Output only · move dials`, removing the prior false click affordance.

## Interaction and implementation checks

- View tabs, status filters, cards, primary action, and search input were exercised in the in-app browser.
- Readout changed to reflect view/filter/input/action state.
- Radius curve moved from 1.4 to 2.0 and changed the XL specimen radius from 19.6 px to 40 px.
- Ambient shadow moved from 0.18 to 0.40 and changed the elevation specimen shadow.
- Space/radius tuning changed the matrix primary button from 40 px / 10 px radius to 70 px / 18 px radius; Reset restored defaults.
- Review matrix contents: Button 24 base combinations plus 4 danger specimens, Row 32, Chip 24, Input 6, Card 6.
- Color math status passed; source token purity grep passed.
- Routes `/`, `/?lab=1`, `/?locked=1`, and `/?foundry=1` rendered successfully.
- Production build passed. Browser diagnostics reported zero console errors.

## Comparison history

- Initial implementation finding: the Foundry exposed only dials and static output tiles, leaving Layer B mechanically present but not meaningfully testable.
- Fix: added a default Components view with a live instrument panel, real interactive primitive controls, complete review matrices, explicit static-output labeling, and a separate Tune view.
- Post-fix evidence: the paired source/implementation capture, focused Button matrix capture, interaction assertions, dial-style deltas, and geometry measurements listed above.

## Findings

- No actionable P0/P1/P2 findings remain at this primitive-review checkpoint.

## Open questions

- Daniel still needs to lock or revise the five primitive matrices before any consumer migration into `App.tsx`.

## Implementation checklist

- Review Button, Row, Chip, Input, and Card matrices in the Foundry.
- Lock or request changes to the primitive recipes.
- Only after that approval, migrate project tabs and one task-drawer group.

## Follow-up polish

- P3: consider remembering the last open matrix during the same browser session after the primitive set is locked.

## Foundry v2 authoring-pipeline worklog — 2026-07-30

- Added an isolated dev-only Foundry route with sidecar staging, reset controls, human-readable diffs, and guarded branch/PR promotion.
- Added systematic ground-hex authoring, plain/graph/glass character modes across all five surfaces, global graph/glass intensity controls, and major App surface tagging.
- Added a populated Foundry calibration project, initiative and task hierarchy, persistent `Test against` targeting, plus an explicit empty-state target.
- Unified Locked Studio and Foundry primitive chemistry through `src/primitives/primitives.css`; the manual refresh path pulses the live gallery.
- Browser QA verified graph-ground on the canvas and specimen, visibly offset elevated-2 glass on a real task drawer, intensity-driven blur/radius output, target persistence, empty/project/initiative switching, and canonical primitive refresh.
- Static gates passed: production build, no Foundry endpoint strings in the production bundle, zero raw literals under `src/primitives/`, one `.locked-btn-primary` definition, and no banned edge mechanisms in the new character/Foundry CSS.
- Route probes returned 200 for `/`, `/?lab=1`, `/?locked=1`, and `/?foundry=1`; localhost browser diagnostics contained no warning or error entries.
- Final real Save-to-staging → two-tab comparison → Commit + Push verification is intentionally performed after this implementation checkpoint so the generated promotion branch is based on reviewed code. The generated branch and PR are reported in the task handoff; no PR is merged by this workflow.
