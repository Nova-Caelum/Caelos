# Caelos atlas — refinement 05

User direction: keep surface-only sidebar selection; brighten selected/active cream text; extend the soft tint and text-change language to discipline filters and freestanding pill tabs.

## Behavior clarification

Study 04 is navigation. Current project remains selected while another row is hovered or focused; clicking another project moves the single aria-current marker. A menu highlight follows the candidate action, while a chosen radio option keeps its checkmark. No selection behavior was changed.

## Implemented for review

- Shared selected foreground #f5ead5, a slightly brighter warm cream, scoped to sidebar selection, active dark-menu labels, selected filters and tabs. Original primary tokens remain untouched.
- Menu status labels gain cream when highlighted; their dots retain semantic status color. Light menu highlights retain dark foreground #33213e.
- Discipline filters retain padding, size, checkmarks and multiple selection. Selected fill gently transitions from violet to sage, without an outlined border.
- Freestanding selected tabs retain pill shape, spacing and accepted 320ms motion. Their material adds a restrained violet/sage fill, diffused top light, and 6px backdrop blur. Opaque and unsupported-blur fallbacks are supplied. Full panel intensity is intentionally not applied to a small tab.
- Surface-only remains the default sidebar choice; the existing marker comparison remains available as a reference.

These updated visual values await review. This is the isolated atlas; no production or Panda components were changed. Browser review decisions and notes were not overwritten.

## Follow-up: refinement 06 supersedes the glass tab proposal

User found the freestanding glass pills excessive and proposed combining the refined tonal button with the shared hover language. Implemented: selected tab uses the tonal button hover fill with a faint diffuse aura; unselected hover uses the rounded blue-violet background plane at lower strength. Selected text stays dawn cream. Removed tab backdrop blur, top sheen, inset lighting and elevated shadow. Preserved shape, spacing, tab semantics and motion. Other studies unchanged.

## Final approval

Daniel approved refinement 06 on 2026-09-07 and requested it be locked in. The freestanding tonal pill treatment is now the approved design baseline; see APPROVED-BASELINE.md. No visual code changes accompanied this approval. Typography was identified as the next potential focused pass.
