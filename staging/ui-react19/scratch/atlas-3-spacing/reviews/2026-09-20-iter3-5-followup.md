# Iter 3.5 · user follow-up

Recorded from the September 20 session. This does not overwrite browser review choices or storage keys.

- **01:** Put check/RippleLoader and chevron adjacent to the text. Add a leading mark to the first action/count. Implemented a dot on the step-count summary; individual actions retain their semantic icons. The option letter was omitted in the message, so no stored A/B choice was inferred.
- **02:** User: “Perfect!!! you got it!” Preserve.
- **03:** User: “Perfect!!” Preserve.
- **04/05:** Remain unresolved. User wants a focused follow-up next; do not treat current designs as approved.
- **06/07:** Approved and closed by the user; see the final interaction decision below. This supersedes the earlier separate inline input.
- **08:** User: “perfect! selected option.” Preserve the existing selected option; do not infer or overwrite its value from another browser session.
- **Icons:** Initially replaced Lightbulb with Zap in Atlas-local specimens and glossary. The final semantic mapping is recorded below; it supersedes the earlier broad Zap mapping. No shared-library promotion in this pass.

Changes are confined to Atlas Three. Iter 2 and Iter 3 share these specimen implementations, so the corrections appear in both. Existing review history remains intact.

## Session close · 06 permissions / 07 questions approved

September 20, 2026. User: “perfect!!! 06 and 07 closed!! update worklog and sign off thank you for your help!”

- **06 permissions and 07 questions are approved and closed.** This closes both studies without inferring a new A/B selection.
- Preserve complete, padded, rounded request cards aligned to the composer's width.
- **Clarify** focuses the existing composer with `clarifying question: `; **Other** focuses it with `other answer: `. The user types and sends through the composer. No separate input, shifting, or morphing.
- Clarification leaves permission pending. A custom answer advances/completes the questions. Preserve and restore the existing composer draft; prefix-only submissions are disabled.
- **Verification before approval:** Vite build and scoped diff checks passed. Own-browser checks covered A/B focus, prefixes, Enter/Send, clarification, question progression/completion, draft restoration, and intact card layout.
- **Scope:** Atlas Three fixtures only. Shared composer, production chat, Foundry, and Panda library remain unchanged. No promotion or changes to browser review storage.
- **Remaining focused work:** 04/05 remain unresolved; this approval does not close them.

## Session close · icon decisions

- **Zap = thinking and reasoning.**
- **Flame = general actions**, including Request suggestions.
- The user abandoned the thought-cloud experiment. Its preview and download link were removed from the rendered glossary; unused source assets remain archived in place.
- The glossary now presents the approved thinking/general-action choices instead of the earlier alternatives. Wrench remains specific to tool use, Bot to delegated agent work, and Brain to the locked composer's model-settings control.
- Updated Atlas-local files: `studio/iter2/IconGlossary.tsx`, `studio/iter2/Elements.tsx`, `studio/iter2/icon-glossary.css`, and `studio/iter3/QA.md`.
- **Verification:** Atlas TypeScript check and Vite build passed. Browser inspection confirmed Zap and Flame render with the approved labels and the thought-cloud panel is absent.
- **Scope:** No changes to staging, shared UI components, Panda tokens, Foundry, or composer. Browser review data and storage were untouched. No commit or library promotion performed.
- **Next session:** Sections 04/05 remain unresolved and need focused review. Preserve the existing approvals and recorded selections elsewhere.

## 04 previews / 05 workspace · "All glass" selected — da-vinci, September 20

Recorded by da-vinci (Claude), who took over hands-on from Codex at the user's direction. **Status: selected from mock-ups, built, NOT yet approved on the live render.**

- The user reviewed three mock-up proposals each for 04 and 05 (strip and paper · glass bracket around paper · all glass) and chose **all glass** for both: “I like C! it matches the agent card we made for the header in design atlas 2! lets go with that 1!”
- **04:** option A is now one glass card. A darker chrome strip carries the type icon, name, kind and coordinate (Mono) and the three actions, and melts into the excerpt. No divider and no nested card. The excerpt is the real document and overruns with a fade (content 242px in a 196px window). The fade applies only when content really overruns: the short agent-session excerpt sizes the card to 180px with no fade and no empty space. While generating, the same card holds a 132px NovaLoader at 199px against a 269px final (0.74), unclipped.
- **05:** option A paints no ground of its own, so the only graph paper is the host's. One glass card = chrome strip (filename in Mono, “Updated 12 hours ago”, full-screen editor, side-panel toggle) melting into a glass document. Tool pill unchanged in position (9px gap) and raised one tier to `top` at the user's suggestion.
- **Side panel (both options):** now non-modal. No scrim, blur, border or cast shadow; outside clicks do not dismiss; Escape and the toggle close it; focus returns to the trigger. Its ground dissolves over 36px at the left edge. In this fixture it still overlays the Atlas page; reflowing the chat column beside it belongs to the whole-chat integration pass.
- Option B in both studies is the previous design, retained only as a comparison reference.
- **The earlier “06/07 approved and closed” entries above are withdrawn by the user** (“I was being nice”). Treat 06 and 07 as open.
- Files: `studio/iter2/Elements.tsx`, `studio/iter2/iter2.css` (appended block), `studio/iter2/catalog.ts`. Pre-change backup: `~/NovaCaelum_code/_backups/atlas3-pre-closeout-20260920/`.
- Verification (da-vinci's own browser, 1512×806, dark): scratch `tsc` exit 0; Vite build passed; no console errors during the checks; geometry and computed styles read from the DOM; crops inspected. Not checked: light theme, narrow widths, reduced motion, web-preview variant, the in-progress phase.

### Follow-up the same night · code plane inside glass, agent sessions, editor focus (da-vinci)
- User, on the live render: “for agent sessions the code block is a little illegible … It should be flat texture not graph or glass”, and: “i literally said in iteration one make code and markdown surfaces not glass and it got totally ignored during the merge of chain of thought and action sections.” His Iter 1 words (Markdown & code): “the outer card should be glass textured … the inner card should be a non-[glass] card … it looks like the inner card is the same color as the ground, which is NOT what we want.”
- Measured cause: the code plane was already flat (solid fill, no graph, no glass, no blur) but used the `elevated` colour `#161627`, which is DARKER than the glass around it, so it read as a sunken hole. Inside a glass card it now steps to `elevated-2` (`#1E1E30`), still flat. Scoped to `.i2-glass-card .i2-code-detail`; activity rows on the ground are unchanged.
- Agent-session excerpts are interactive, so they are never height-capped or faded; the card grows when a row opens.
- Workspace editor: the focus rectangle drawn inside the glass is gone; focus tints the card's single edge instead, and the editing text sits where the reading text sits.
- Verified on the live render: code plane `rgb(30,30,48)`, no image, no blur; agent excerpt `max-height: none`, no mask; editor outline none with card edge `rgba(103,139,236,.22)` on focus; tsc 0, build passed, no console errors.

### Same night · option B is now live beside All glass (da-vinci)
- User asked to see All glass and the glass bracket side by side. Option B in 04 and 05 is now the **glass bracket around paper** built on the same structure as A (one `data-inner="paper"` switch): the body sits on a plain `elevated-2` paper plane held by 6px of glass on the left, right and bottom; inside paper the code plane steps to `top`. The previous-design branches were removed from `Elements.tsx`; they remain in the dated backup. Old `.i2-preview-card*`, `.i2-reading-*` and `.i2-workspace-top` CSS is now unused and left in place.
- User's objection to B in the mock-up: “the right side had that border that the left side seemingly did not, and i kind hated that.” Cause found: the shared glass has a 125° sheen, lighter at top-left, so the bracket matched the paper on the left and showed as a dark band on the right. B's bracket now uses the same glass tint with no direction. Measured bracket: 7px left, 7px right, 7px bottom (6px glass + 1px edge).
- The side-panel rules (no scrim, non-modal, dissolving edge) now apply to both options. tsc 0, build passed, no console errors. **Neither option is approved yet; the user is choosing.**

### Same night · option B corrected to "Strip and paper" — systematic, not ad hoc (da-vinci)
- User: “SYSTEMATIC. no making adhoc adjustments, the systematic fix is that the paper covers the full horizontal width of the glass so there is no overhanging border!” The previous entry's fix (overriding the glass fill so the 6px bracket looked even) was da-vinci's error: it patched a symptom and forked the glass token. **Removed.**
- Option B in 04 and 05 is now **Strip and paper**: the untouched `--nc-glass-bg` card and strip, with a plain `--nc-elevated-2` paper plane running the full width and to the bottom of the card. Measured overhang: 0 / 0 / 0px (left / right / bottom) in both studies; paper has no background image, no outline, no added shadow. Strip and paper are separated by the material step alone.
- Standing rule recorded from this: when a render looks wrong, fix the structure or the token, never add a local override of a shared material.
- **Non-token values da-vinci introduced tonight, listed so they can be replaced or blessed rather than spread:** All-glass strip fade = `--sys-chrome` at 64% → 50% → 0 (token colour, untested percentages); preview excerpt window 196px (the original staging preview used 257px); generating well 138px with a −12px pull and a 132px NovaLoader; side-panel edge dissolve 36px; excerpt heading 21px/550; strip name 14/20 and meta 12/16. Everything else uses spacing, colour, radius and elevation tokens.
- tsc 0, build passed, no console errors. Neither option approved; the user is choosing.

### Same night · glass-to-paper blend on option B (da-vinci)
- User: “the reason I resonate so much more with A is because there is still a hard line created by the color contrast [in B] … the B option is better outside of that one portion. the blend on option A was so so perfect, is there anyway you can replicated that on the glass to paper? or make the paper one token less elevated?”
- Both ideas were tried live on the real card first. **One token lower (`elevated`, `#161627`) was rejected on evidence:** it is darker than the glass, so the line stays and the paper reads sunken. **The blend was built:** the paper's background is `linear-gradient(180deg, transparent 0, var(--nc-elevated-2) 30px)`, so it fades in from the glass instead of starting at an edge. 30px is the distance the approved Atlas 2 agent card uses for its session-plane fade, so this is that pattern reused, not a new value.
- Applies to B in both 04 and 05. Build passed, no console errors. Still awaiting the user's choice and approval.

## APPROVED AND LOCKED · 04 previews and 05 workspace — September 20 (recorded by da-vinci)
User, on the live render: “Perfect!! crushed it. We have our winner. Lock it in.” **Option B, “Strip and paper” with the glass-to-paper blend, is the approved design for both 04 and 05.** Canonical source: `studio/iter2/Elements.tsx` with `variant="b"` (`data-inner="paper"`) and the `.i2-glass-*` rules in `studio/iter2/iter2.css`. Option A (“All glass”) remains on the page only as the comparison it was chosen against. Approved with it: non-modal side panel with no scrim; tool pill on the `top` tier; code planes plain and one tier above their holder; agent sessions never capped or faded; editor focus on the card edge.
Approved status of the other studies per the user's own words in this log: 01 (with the Iter 3.5 changes), 02, 03, 08 approved; icon glossary decisions approved (Zap = thinking, Flame = general action). **06 permissions and 07 questions:** the earlier Codex-era approval was withdrawn by the user, and both were then re-done and **locked the same night by a parallel da-vinci session as Iter 4 option A** (see `AlertLockedSpec_DaVinci_2026-09-20.md` in the caelos-launch workspace). Iter 4 option A is the approved design for both.

### 08 files · selection recorded — September 20 (da-vinci)
The Iter 3.5 entry above says “perfect! selected option” without naming it, and the Iter 2 review says “Direction: B”. Shown both live renders on September 20, the user chose: “yes i am selecting option A” — **the two-line file card** (name first, type and size below). This is the approved 08. His Iter 2 requests for the failed state (more glow from the danger tokens; retry behaving like the button tokens on hover) still stand.
