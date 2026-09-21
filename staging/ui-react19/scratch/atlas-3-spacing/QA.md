# Atlas 3 — verification record

## Iter 2 review follow-up and icon glossary (2026-09-19)

- Applied the exported Iter 2 feedback in scratch only; archived the supplied review at `reviews/2026-09-19-iter2-completed-review.md`. Existing review storage keys remain unchanged. No new option was automatically approved.
- Added a glossary of 26 Lucide icons and the Ripple/Nova loaders, mapped to their visible labels and uses. It includes shared button/status specimens and opens from `?tab=studio&iteration=iter2#i2-icons`.
- Failure cards use maintained semantic danger tint, line, glow and foreground variables. Deny and retry controls use shared danger Button/IconButton variants. Activity status spans use the package Chip recipe to avoid nesting buttons inside disclosure buttons.
- Scratch TypeScript and Vite production build passed. Vite retained its nonfatal large-chunk warning.
- Browser checks used the Codex in-app browser and local fixtures: immediate question advancement; Other draft preservation through previous/next navigation; custom-answer submission and draft-restoration status; Clarify alignment, sending clarification and Deny; failed attachment Retry returning the file to ready; expanded artifact rendering and Escape dismissal; generating previews with NovaLoader and no incremental body text; final preview rendering; glossary navigation.
- Visually sampled the narrow panel and a desktop override (observed 1024 CSS pixels). The desktop sample had no page horizontal overflow and no nested buttons. Reset the viewport override afterward. Captured browser error log was empty during the checked run.
- Composer internals, shared package source/dist, Foundry, Atlas Two and approved `study.css` were not edited. Composer host alignment/width changes are local fixtures. These checks do not certify production workflows, every theme, every hover or a full accessibility matrix. No promotion is implied.

Checked 2026-09-19 in the Codex in-app browser against the local production preview at `http://127.0.0.1:5187/`. This records bounded implementation checks, **not design approval**.

The initial two-density and midpoint records below are retained as history. The user subsequently approved all three densities and promotion, with Default as the standard. See the shared-package promotion record at the end for the current revision.

## Build and isolation

- Isolated Panda code generation and CSS generation completed. Scratch TypeScript check and Vite production build exited 0.
- TypeScript and Vite were run again after simplifying review notes to select-and-copy text. Final build: 1,694 modules; CSS 59.73 kB, JS 394.92 kB, before compression.
- Nonfatal build messages: Vite ignores imported `use client` directives for this standalone client build; Panda's update-check config store was not writable. CSS generation and builds completed.
- Existing package `dist` was consumed as a snapshot; this work did not rebuild or certify every shared component against current source.
- Fonts are bundled from existing local Fontsource dependencies. Computed field typography was Plex Sans 500, 13px / 19.5px; title was Yrsa Variable 500, 30px / 34.5px. Screenshots were visually inspected. No separate font-network or glyph-coverage audit was performed.
- No dependency installation, shared recipe/token/export edit, production route change or Foundry snapshot refresh was performed. Generated scratch output is ignored.

## Geometry matrix

Long content enabled, dark theme. These are **measured specimen widths**, not just viewport requests. Complete field-to-field gaps include each preceding field's helper/error content.

| Specimen width | Density | Field gaps | Chip section → card section | Visible grid columns | Horizontal overflow / escaped specimen descendants |
| --- | --- | --- | --- | --- | --- |
| 320px | comfortable | 24px | 30px | 1 | none / 0 |
| 390px | comfortable | 24px | 30px | 1 | none / 0 |
| 560px | comfortable | 24px | 30px | 2 | none / 0 |
| 840px | comfortable | 24px | 30px | 2 | none / 0 |
| 320px | compact | 18px | 24px | 1 | none / 0 |
| 390px | compact | 18px | 24px | 1 | none / 0 |
| 560px | compact | 18px | 24px | 2 | none / 0 |
| 840px | compact | 18px | 24px | 2 | none / 0 |

The wide test used an observed 960×800 CSS viewport. A second test used an observed 320×880 CSS viewport, light theme, compact density and long content: the requested 840px surface shrank to 284px, with no page horizontal overflow. Viewport API requests and observed CSS dimensions differed due to browser scaling; the observed dimensions are reported here. A final lower-bound check measured a 280px specimen in the normal 353px-wide panel, dark/comfortable/long content, with no horizontal overflow and zero escaped descendants.

The missing-wrapper comparison measured approximately 0px between complete fields in the unstyled wrapper and 24px with `FieldGroup`. The small floating-point residuals were below 0.001px.

## Visual and interaction checks

- Inspected viewport screenshots of wide dark composition, narrow long-content fields, and narrow light people/actions/comparison. Long labels and helpers increased height; chip and action groups wrapped without visible collisions in these samples.
- Inspected computed relationship gaps/insets and actual descendant bounds. This is stronger evidence for those relationships than a whole-page pairwise overlap test, which would flag intentional nesting.
- Removed and restored Daniel's chip; both chips returned. Edited project name. Save, Reset draft and Preview showed their respective local status messages; Reset restored the initial name.
- Tab from project name moved focus to Search. The focused search wrapper retained the library's subtle border/glow (`rgba(168,150,240,0.28)` shadow). This was a focused keyboard check, not an accessibility or focus-contrast certification.
- Comparison toggled open, showing both cases. Review textarea accepted input and cleared after reload. Notes use ordinary text selection/copy; there is no download dependency.
- Captured browser warning/error log list was empty during the checked run.
- Restored default theme/density/content, reset the temporary viewport override and left the preview at the top for review.

Screenshots were inspected in tool output, not saved as a versioned regression baseline. The final notes-only change was rebuilt and re-rendered; the complete geometry matrix was not repeated because it did not change specimen layout.

## Limits and next decision

This does not validate every library component, popover placement, Foundry nested scrolling, the actual chat shell, every locale, larger text zoom, motion or all keyboard/screen-reader paths. The preview uses reduced motion. Both themes were sampled, but the full eight-case matrix was dark only.

Review the hierarchy and density choices with the user before promotion. Then move the approved relationship APIs/recipes into the maintained library as a separate change, migrate specific consumers and verify their real containers. The production screenshot defects are not claimed fixed by this scratch study.

## Build inputs and outputs

SHA-256 fingerprints identify the checked snapshots. Generated output can be recreated using the [README](README.md); dependency or shared-dist changes require a new check.

| File relative to checkout | SHA-256 |
| --- | --- |
| `packages/ui/dist/index.js` | `660fbc90a331f1d7486e6bcef4f020e5bc177f4208bf9107f243686048961b6d` |
| `packages/ui/dist/styles.css` | `d9e6b208e64925a046e71a5e517a5d256ff47f9cd7ca3a80d349c8eee032a16a` |
| `packages/ui/scratch/atlas-3-spacing/dist/assets/index-BgyLha6S.js` | `4dbfd64f61ecb44ed691d6631c77ad314e85c20cd89b8e1b7fd41fec2b627185` |
| `packages/ui/scratch/atlas-3-spacing/dist/assets/index-CYqVzryG.css` | `7b47410b081d48298495e601bb9593e6d1293509c51ba5a902c859720b1bfe86` |

## Follow-up: Default density (2026-09-19)

User requested a midpoint after reviewing Compact and Comfortable with short and long content. Added Default and made it the initial selection, with individually selectable Compact / Default / Comfortable buttons. The active button uses the package's primary treatment and exposes `aria-pressed`.

- Regenerated Panda CSS; TypeScript and production build exited 0. Repeated TypeScript/build after the active-button visual refinement.
- Measured Default at 320px and 840px specimen widths, with normal and long content (four cases): 21px field gaps, 27px section gaps, 15px intro gaps, 21px inset; no page horizontal overflow and zero escaped specimen descendants.
- Exercised all three mode buttons: Compact retained 18px/24px field/section gaps; Comfortable retained 24px/30px; Default measured 21px/27px.
- Inspected wide dark long-content and narrow light long-content viewport screenshots. The existing comparison remains explicitly Comfortable and measured 24px despite the new context default.
- Restored the normal viewport, Default density, dark theme and short content. The earlier eight-case matrix is historical; it was not repeated in full for this additive mode change.
- Updated the spacing reference with the user's feedback and all three modes. Midpoint values are local candidate calculations, not new canonical tokens or production promotion.

Current built study output fingerprints:

| File | SHA-256 |
| --- | --- |
| `index-4gm92_3q.css` | `ade406bf31ede36a3e07723da9afff5079b4a714216bc929952666f3fe185f16` |
| `index-x_Qn3xiU.js` | `fcc136d833fcfe8a79279d1713a1cfbf0dbf83c9e2c5f5e0694d246016121db7` |

## Shared-package promotion (2026-09-19)

User approval makes Default the actual fallback. React components and the Panda recipe now live in `packages/ui/src/spacing.tsx` and `spacing-recipe.ts`. This harness re-exports the public built package; its historical local Panda config is no longer consumed. The React 19 Foundry has a Spacing tab using the pinned package.

- Shared Panda generation, TypeScript, JavaScript/declaration build and CSS generation passed. Scratch TypeScript and Vite builds passed. Console `npm run build:foundry-staging` passed, including staging TypeScript and both Vite builds.
- `node packages/ui/tests/spacing.mjs` passed against `http://127.0.0.1:5196/foundry-react19/?tab=spacing`. The browser portion required execution outside the shell sandbox on macOS. The test measures actual label/control geometry because the existing 8px interior is a margin, not a grid gap.
- All 18 cases passed: browser widths 1200/390/320px × short/long content × Compact/Default/Comfortable. Each checks recipe gaps/inset, actual field and intro gaps, unchanged 8px field interior, no escaped specimen descendants and no page horizontal overflow.
- Public API checks passed for Default without a provider, inherited Compact, nested Default reset, sibling isolation, accessible section heading association and the direct recipe fallback. Browser checks passed for the Default comparison, light theme, keyboard density controls and collection tabs, with no page errors.
- Visually inspected the new Foundry tab, wide dark Default fields, 320px long-content Default fields, and light long-content people/chip/card spacing. These are sampled visual checks, not a full accessibility or application migration audit.
- Opened the Spacing tab inside the outer Foundry iframe and confirmed Default selected; inspected the embedded panel screenshot. The full collection remains available separately.
- The comparison now explicitly demonstrates Default (21px). This supersedes the historical Comfortable comparison above.
- Pinned archive: `nova-caelum-ui-df1e36345d78c5d3.tgz`; SHA-256 `df1e36345d78c5d3053b70ab81d0550178ddd4c8f29861f6f8ed60d792e64abd`. All source fingerprints in staging `snapshot.json`, archive checksum and lockfile reference matched.
- No production runtime migration or existing product spacing repair is claimed. Hosts still need deliberate adoption and checks in their actual containers.
