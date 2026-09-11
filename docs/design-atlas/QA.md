# QA — September 6–7, 2026

## Round two — verified

- Final Vite production build passed: 2,081 modules; CSS 49.99 kB, JS 430.14 kB.

- Independent transparency, blur and tint values responded through keyboard range controls; Reset material restored 38% / 22px / 10%.
- Pointer drag moved the panel from (27,65) to (387,105), preserving the fixed background. Arrow and Shift+arrow movement also verified.
- Graph paper and Light & shade visually inspected; 390×844 viewport had no document horizontal overflow. Mobile panel and menu specimens fit inside their stages.
- Status changed to Blocked through the menu; leading mark and pill both computed to rgb(223,159,166). Restored to In progress. All three initial row colors matched their pills; completed text had line-through.
- Owner tooltip displayed Daniel Eghdami · assignee on keyboard focus.
- Meaningful icon alternative rendered four state-specific icons; text-only restored.
- Motion character, inspector tabs and disclosure responded. Reduced motion set both displayed durations to 0ms.
- Project actions opened by keyboard and Escape returned focus to the trigger.
- Copy Markdown verified with current material settings and seeded review notes. Existing browser reviews were not overwritten.
- IBM Plex Sans confirmed through computed filter typography.
- Final desktop and mobile material screenshots inspected; an overlapping heading selector found during development was fixed by scoping backdrop rules to the backdrop content.

## First round — previously passed

- Production Vite build after final interaction and export changes: 2,078 modules transformed; no build errors.
- Desktop visual review at the normal browser size; responsive checks at 390×844 and 800×900. No document horizontal overflow at those widths. Mobile status menu stayed within viewport; responsive override reset afterwards.
- Ten specimens and fifteen research source cards rendered.
- Glass range responded to keyboard Home, End and arrow keys; opaque mode disabled range. Busy backdrop and material CSS properties changed. Text opacity remained 1 at maximum glass.
- Sidebar selection and pin actions; action tooltip revealed on keyboard focus.
- Task status updated through Radix radio menu; completion summary updated; focus returned to trigger.
- Project action menu supported ArrowDown and Escape with focus return.
- Filter toggles and separate person removal updated the displayed summary.
- Inspector arrow-key tab selection and disclosure changed visible content; reduced-motion setting applied.
- Review vote and note persisted across a reload; shortlist showed exactly the chosen specimen; export dialog included all ten studies.
- Copy Markdown verified through the browser clipboard, including notes and source URLs.
- All temporary QA votes and notes cleared through the UI and confirmed after reload.
- Existing primary resting geometry/type/background/shadows matched the inspected live button.
- A development hot-reload warning about duplicate React roots was found and fixed by retaining the root between hot updates. Motion emitted its expected reduced-motion warning during the reduced-motion test.

## Limits

The embedded browser’s download event observer timed out; browser download completion is unverified. The copy export is verified, and the download action uses a standard Blob/object URL and download link. Its notification says the download was requested, not confirmed saved.

This is an interactive visual prototype using mock project data. Demonstration project-opening and creation actions provide contextual notifications. It does not implement backend workflows or a complete Panda migration. Formal WCAG contrast auditing, screen-reader testing, every browser/device combination, and exhaustive interaction testing of external reference libraries were not performed.

Source code is saved durably in AgentSecretBase; the active local server uses the isolated temporary runtime. Original Caelos code and original preview servers were left untouched.

## Refinement 03 — second review

- Production build passes: 2,082 modules, CSS 52.98 kB, JS 432.09 kB.
- Browser verified exact dark 76/19/14 and light 24/2/23 values, corresponding base alpha 0.24/0.76, and light foreground switching.
- Changed light transparency to 25, switched to dark (still 76), returned to light (still 25), then reset to 24. Independent mode state and current-mode reset work.
- Light opaque fallback computes solid #f0eaf5 with backdrop-filter none; sliders disable.
- Inspected portal status menu in light mode; corrected inherited status colors to darker semantic hues. Confirmed softened menu border and no redundant menu-container outline. Escape dismisses correctly.
- Inspected sidebar selected and focused-hover surfaces; computed alpha changes match approximately +15% / −15%. Selected row and revealed pin action retain keyboard affordances.
- Inspected forced button hover; text aura computes inset −3px/−11px with 6px blur. Primary source files unchanged.
- Desktop and 390 × 844 mobile screenshots inspected; no horizontal document overflow. Material controls stack cleanly on mobile.
- Review dialog opens; export code includes active mode and both material settings. Clipboard retrieval was empty in this automation session, so clipboard contents were not independently verified this round.
- Browser returned to desktop, dark 76/19/14, top of atlas. Current browser review text was preserved.
- Light material is a scoped preview of panels, menus and sample backdrops, not a complete light theme for Caelos. Production Panda recipes remain separate.

## Refinement 04 — third review

- Production build passed: 2,082 modules; CSS 56.50 kB, JS 433.10 kB.
- Compared sidebar rest, hover/focus-within and selected states against the user's live Taskgraph reference. New surfaces retain rounded form, with edge-only blur and blue-violet hue rather than the reference's square boundary. Selected label computes to the source dawn-cream token rgb(237,227,207); font remains IBM Plex Sans.
- Soft marker control inserts the short rounded marker; Surface only removes it. Restored Surface only.
- Opened Project actions with Enter. Focused item has cream text, visible pseudo-element highlight and 0.7px edge blur. Found and removed a duplicate hard outline inherited from the global tabindex focus rule. Verified the highlight remains visible after removal. Escape dismisses.
- Light menu inspected at 24/2/23: focused foreground rgb(51,33,62), no duplicate outline, 2px backdrop blur. Restored dark 76/19/14.
- Freestanding/Enclosed comparison changes tab treatment. ArrowRight selected Activity and updated panel content; End selected Files in the enclosed treatment. Restored freestanding Overview. Accepted easing and durations are unchanged.
- Mobile 390×844 comparison screenshot inspected: controls wrap cleanly, tabs fit, no horizontal document overflow (scrollWidth 375, innerWidth 390). Restored desktop and study 04 for review.
- Only atlas source and documentation changed. Existing browser review entries were not edited. Text-button aura and source primary files unchanged.

## Refinement 05 verification

- Vite production build passed: 2082 modules.
- Desktop screenshots inspected for filters, tabs, sidebar and light menu; geometry preserved.
- ArrowRight moved selected tab to Activity and updated its panel. Selected computed foreground rgb(245,234,213); tab backdrop blur 6px.
- Engineering filter toggled on alongside Design, then back off; selected text differs from muted Research.
- Menu opened with Enter, highlighted dark text computed rgb(245,234,213), light text rgb(51,33,62), Escape closed.
- Highlighted Ready option label used warm cream while its dot retained rgb(177,185,229).
- Focus on Agent workspace's action left Core platform current; clicking Agent workspace moved the single selected row. Restored Core platform afterward.
- Dark material preset restored. Review data untouched.

## Refinement 06 verification

Vite build passed (2082 modules). Inspected selected pill in browser; computed backdrop-filter is none and selected shadow is a single faint diffuse aura. ArrowRight changed Activity to Files and updated panel content. Selected hover layer computed opacity 0.25. Shape, spacing and existing keyboard focus remain intact. Saved sources to durable atlas; no review votes or notes modified.
