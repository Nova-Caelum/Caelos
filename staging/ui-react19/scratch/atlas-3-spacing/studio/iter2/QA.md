# Iter 2 verification — 2026-09-19

Local proposals for review, not staging replacements or approved library components.

## Verified

- Scratch TypeScript check and Vite production build pass. Vite reports the existing large-bundle advisory.
- Own in-app browser: Iter 1 / Iter 2 navigation; checklist navigation; activity disclosure; shared playback.
- Source RippleLoader cells animate with `nc-ripple`, inherit dawn cream, and stop under the reduced-motion control.
- Question choices populate the unchanged composer; Send advances; final Send submits both answers and restores the prior draft. External Restart scenario fills the composer and triggers its actual Send button.
- Permission clarification is recorded locally; Allow via the keyboard shortcut resolves the fixture and restores the draft.
- Expanded workspace opens, supports local editing and undo, offers full-screen mode, and closes with Escape while restoring trigger focus.
- Review notes survive reload. Temporary verification notes were removed and the empty value survived reload. Iter 2 uses its own storage key; Iter 1 source and storage key are retained.
- Narrow viewport: question/composer layout stacks without horizontal document overflow. Dark and light specimens inspected; light review controls now have a matching ground.
- No browser console errors observed during these checks.

## Boundaries and limits

- Edits for this work are confined to Atlas Three. No production or shared-package changes were made by this task.
- Protected-file comparison confirms approved `study.css` and original `studio/Studio.tsx` are unchanged. Two shared composer source files changed concurrently in the workspace; this task did not write or revert them.
- The original exported review is preserved verbatim at `reviews/2026-09-19-completed-review.md`, SHA256 `9b33c544d9f26691e0f6091f5f96e7ebc49f6205c03c885ad9fd8a460dd01c52`.
- Specimen actions use in-memory fixtures. They do not call real tools, save real documents, vote on messages, or invoke microphone/AI services. Composer controls outside the studied flow report fixture feedback.
- Existing message actions, empty conversation, and composer design are carried forward. The ten studies consolidate the reviewed families; they do not claim that every production state has been redesigned.
- Notes belong to the browser that enters them. Export Markdown for a durable cross-browser handoff. No review choice automatically promotes a component.
