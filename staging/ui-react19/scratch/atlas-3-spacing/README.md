# Design Atlas 3 — spacing relationships

Approved spacing review harness, 2026-09-19. Review at **http://127.0.0.1:5187/** while the local preview is running. All controls and spacing relationships come from this React 19 package’s `dist`. The user approved all three densities and Default as the standard; maintained source lives in `src/spacing.tsx` and `src/spacing-recipe.ts`. Foundry now has a Spacing reference tab.

Start with [agent launch brief](../../../../docs/design/AGENT-START-HERE.md) and [spacing reasoning](../../../../docs/design/SPACING-RELATIONSHIPS.md). [QA and limits](QA.md).

The **Demo** tab preserves the original Chat UI Lab simulation at **http://127.0.0.1:5187/?tab=chat-ui-lab**. Its primitive compositions are experiments, not staging baselines. See [lab usage, implementation and verification](chat-ui-lab/README.md).

The **Studio** tab supports discrete component review at **http://127.0.0.1:5187/?tab=studio**. Its checklist opens 23 studies with applicable states, actual staging imports, preserved local candidates, and explicit coverage gaps. Comparisons have width controls and full-size specimen links. Review dispositions and notes persist in this browser and can be exported as Markdown; none imply approval or promotion. See [Studio implementation, verification, and remaining gaps](studio/QA.md).

The Approved spacing tab retains the existing reference and stays mounted while switching tabs. Its approved `study.css` is unchanged.

## Studio iterations

**[Iter 4](http://127.0.0.1:5187/?tab=studio&iteration=iter4)** (September 20, da-vinci) holds only the four open studies, with their Iter 2 numbers: 04 previews, 05 expanded workspace, 06 permission, 07 questions. **The user reopened 06/07 on September 20: the earlier "approved and closed" note below was a courtesy, not an approval.** 06/07 are re-derived as temporary alerts rather than info cards (one anatomy; permission = tonal material in a token tone, question = the package glass Card). **The user locked 06 option A and 07 option A on September 20** (06: gold tonal wash and token glow inside the system `--il-edge`; 07: plain glass Card, answer rows centred, labels on the title axis). These are the user's own approvals of the Atlas specimens, not a library promotion. 04/05 are carried forward unchanged, marked as not yet reworked, and are being reworked in a separate session. Iter 4 lives in `studio/iter4/` with its own specimens, `.iter4`-scoped CSS and storage key `caelos-atlas3-studio-review-v4`; Iter 1–3 sources are imported read-only. The only shared-file change is the additive Iter 4 tab in `studio/StudioIterations.tsx`. Nothing is approved or promoted.

**[Iter 3](http://127.0.0.1:5187/?tab=studio&iteration=iter3)** contains seven studies with their original Iter 2 numbers: 01 activity, 03 user-message material, 04 inline previews, 05 expanded workspace, 06 permissions, 07 questions, and 08 files/upload/retry. On September 20 the user withdrew the earlier 06/07 approval, so 06 and 07 are open. **04 and 05 were approved and locked on September 20: option B, “Strip and paper” with the glass-to-paper blend.** Option A (“All glass”) stays only as the comparison it was chosen against. See the [session worklog](reviews/2026-09-20-iter3-5-followup.md) for decisions. The glossary remains a collapsed reference. Iter 1/2 and their storage remain intact. Iter 3 retains its `caelos-atlas3-studio-review-v3` storage and Markdown export. Nothing is automatically approved or promoted.

Latest Iter 3 verification: scratch TypeScript and Vite build passed. Own in-app browser checks covered seven-study navigation, wide and narrow specimens, permission clarification and draft restoration, immediate question answers and custom Other submission, attachment retry, preview loading phases, and the expanded editor's Escape/focus return. At a 312 CSS-pixel viewport the attached Clarify row spans the available width so it does not squeeze the unchanged composer. No browser console errors were observed. See [correction-pass evidence and limits](studio/iter3/QA.md). The attached review is archived verbatim in `reviews/atlas-three-iter3-review-2026-09-19.md`.

**Iter 1** preserves the original 23-study Studio and its review storage. **[Iter 2](http://127.0.0.1:5187/?tab=studio&iteration=iter2)** consolidates the completed review into ten focused studies, each comparing two local proposals around one explicit decision. Neither option is presented as staging or an approved component. The exported first review is preserved verbatim in `reviews/2026-09-19-completed-review.md`.

Iter 2 has shared example, width and playback controls, independent review notes, and Markdown export. Permission and question fixtures use the unchanged shared composer; their scenario controls populate it and trigger its Send button. All actions stay in local fixtures. Existing message actions and the empty conversation are carried forward for now.

The loader imports `src/RippleLoader.tsx` directly. Before rebuilding this scratch preview, run `node studio/iter2/generate-ripple.mjs` to generate its isolated recipe CSS from the source recipe and preset keyframes. This does not regenerate or edit the shared package. See [Iter 2 verification and limits](studio/iter2/QA.md).

## Review

- Resize the inner surface continuously from 280–1000px; presets are 320, 390, 560 and 840.
- Compare Compact / Default / Comfortable, long content and both themes. Default starts selected and uses midpoint spacing (21px fields, 27px sections, 15px intro-to-content, 21px inset). Density changes relationship spacing, not input interiors.
- Remove/restore people, edit the project name, and use the local demo actions. No backend writes occur.
- Open the crowded comparison to see the specific missing-wrapper relationship.
- Record notes in the textarea and select and copy them before leaving. Notes are session state and are not persisted across reload. Neither notes nor successful rendering promote the design.

The Glass preference is passed through the existing provider. Ground surfaces intentionally remain graph surfaces; this control does not turn them into glass cards.

## Reproduce without installing dependencies

From the physical directory `/Users/danieleghdami/NovaCaelum_code/caelos-chat-react19/packages/ui/scratch/atlas-3-spacing`:

```sh
../../node_modules/.bin/tsc --project tsconfig.json
../../../../node_modules/.bin/vite build --config vite.config.mjs
../../../../node_modules/.bin/vite preview --config vite.config.mjs
```

The package's existing `dist/index.js` and `dist/styles.css` must exist and correspond to the intended library revision. Rebuild the maintained package separately if the task calls for updated controls. This study's build does not rebuild the library. Shared recipe changes require a package rebuild and the preview serves a production build, so rebuild/reload after edits.

The server binds loopback only, with strict port 5187. If occupied, identify the existing process instead of silently serving a different study. Existing dependencies are used from the code checkout; do not install in the vault. Fonts are bundled from the application's existing Fontsource dependencies.

## Files and boundaries

- `panda.config.mjs`: original candidate recipe retained as historical evidence; no longer consumed by this harness. Do not edit it to change the shared implementation.
- `relationships.tsx`: re-exports the built public spacing API; contains no duplicate implementation.
- `main.tsx`: review harness consuming existing built controls.
- `study.css`: scoped Atlas composition/typography, not a product stylesheet.
- `studio/`: component checklist, local review state, source inventory, and isolated specimen adapters. Actual specimens import application implementations and the application font/stylesheet order; candidate specimens retain the lab experiments.
- `specimen.html`: separate iframe entry with network connections blocked by CSP. A fixture fetch adapter handles known application requests in memory and fails closed for unknown requests. No staging API proxy is configured.
- `vite.config.mjs`: builds the Atlas and specimen entries; resolves application imports and isolates the active-chat context through a local fixture adapter. Application styles are compiled for the specimen entry and do not enter the spacing study document.
- `styled-system`, `dist`, `.vite`, `evidence`: ignored generated/local output.

The scratch directory is outside the UI package's `src`/typecheck inputs and published file list. Do not import it into production. Promotion was approved September 19. Future changes belong in the maintained source; product consumer adoption remains a separate scoped task.
