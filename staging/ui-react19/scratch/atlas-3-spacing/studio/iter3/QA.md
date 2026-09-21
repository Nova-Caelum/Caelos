# Iter 3 correction pass

These are Atlas-local proposals, not promoted library components.

## September 20 · final 06/07 approval

The user explicitly approved and closed permissions (06) and questions (07). Clarify/Other now focus the existing composer with `clarifying question: ` / `other answer: ` and submit through its normal Send flow. This supersedes all separate-input and attached/morphing behavior documented below. Complete padded cards retain composer-aligned width; shared composer source is unchanged. A/B browser interaction checks and Vite build passed before approval. See the [session worklog](../../reviews/2026-09-20-iter3-5-followup.md) for the final decision and verification scope. 04/05 remain unresolved.

## September 20 · Iter 3.5 follow-up

This follow-up supersedes the earlier composer-attachment behavior described below.

- Activity check/RippleLoader and chevron sit beside the action label (9px gaps), rather than at the column edge. Step-count summaries have a leading dot; individual actions retain their semantic icon.
- Clarify and Other open a focused, tokenized Input immediately below their controls. Enter submits nonempty text; blank submission is disabled. Removed composer fusion, width measurement, and attached-corner rules. The composer retains its own draft and shape.
- Zap is the approved thinking icon; Flame is the approved general-action icon, including Request suggestions. The thought-cloud experiment has been removed from the glossary.
- 02, 03 and 08 are preserved. 04/05 redesign is deferred to the user's next focused review; the requested suggestions icon replacement is the only cross-cutting change there.

Fresh verification: scratch TypeScript and Vite production build exit 0 (existing chunk-size advisory remains). In-app browser checked completed and active activity indicators, Clarify in A/B, Other in A/B, Enter submission, automatic focus, disabled empty Send, question advancement/completion and composer draft preservation. Wide side-by-side and narrow stacked inputs were visually inspected. Narrow layout measured 300px document scroll width at 312 CSS-pixel viewport width; no horizontal overflow. No console errors observed; temporary viewport override reset. These are fixture-only checks, not backend validation.

## Earlier pass · historical scope

- Restored 06 permissions and 07 questions; included 08 files for the requested sizing review. Original Iter 2 study numbers and all existing storage keys remain intact.
- Activity has a stronger connector, smaller muted completed rows, right-side checkmarks/RippleLoader, and no count summary until three steps.
- User-message A uses stronger composer diffusion. Preview B has tighter inset spacing, no separator, and progressive blur. All preview phases share the compact relative maximum width.
- Expanded workspace restores graph-paper ground and glass top chrome. B's frame wraps only the left, right, and bottom; the tool strip is retained.
- File cards use `width: 100%` with a `21rem` maximum, so they stay compact in wide columns, shrink to available space, and scale with browser zoom.
- Permission and question wrappers consume the unchanged shared composer. No composer source, shared token/component, Foundry, staging, Atlas Two, or approved `study.css` edits belong to this pass.

## Earlier pass · historical verification

- Scratch TypeScript and Vite production build exit 0. Vite still reports its large-chunk advisory.
- Own in-app browser: seven-study navigation; wide side-by-side and narrow stacked specimens; active and completed activity rows; two-step state without a summary; stronger message surface; preview waiting/in-progress/final; compact files and failed-file retry.
- Permission Clarify narrows the composer from the selected button at wide widths. At a 312 CSS-pixel viewport it occupies its own full-width attached row, keeping every composer control inside the card. Sending clarification records it locally; Allow restores the saved draft.
- Question Other attaches to the composer. Sending custom text advances the question; clicking a predefined answer completes it directly and restores the draft. Narrow Other layout inspected.
- Expanded editor opens from B, closes with Escape, and returns focus to its full-screen trigger. Ground, glass chrome and reading plane inspected at wide and narrow widths.
- Narrow document scroll width was 300 at a 312 CSS-pixel viewport (no horizontal document overflow). Temporary viewport override reset after inspection. No console errors observed.

## Limits

- These interactions remain in local fixtures and do not exercise real backend calls.
- Existing review storage keys and merge behavior are retained. The user's exported review is archived verbatim; their personal browser session was not used or modified.
- This pass visually tested dark mode. Light mode and a saved Markdown export download were not reverified.
- Shared Iter 2 specimen edits also appear in Iter 3. Historical notes remain historical feedback, not approval of the revised specimens.
