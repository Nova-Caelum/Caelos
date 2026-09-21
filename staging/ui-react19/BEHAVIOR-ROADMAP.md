# Reusable behavior components — Level 2 plan

Status: proposal/documentation only, 2026-09-10. This work does not add these exports, install a skill, or authorize new interactions.

The goal is for an agent to select one component and inherit its approved appearance, motion, keyboard behavior, focus and state transitions. Tokens/recipes define appearance; a React component owns reusable interaction; application adapters own data and effects.

## First extraction: ProgressiveSelector

Extract the existing Composer `ReplyFormat` reference into `src/ProgressiveSelector.tsx`, then make Composer consume it. Do this before a second independent consumer; do not copy its timers/state machine. The exact approved behavior is already in [INTERACTION-PATTERNS.md](INTERACTION-PATTERNS.md).

Proposed API: `value`, `onValueChange`, `options` with stable IDs/icons/labels, accessible trigger label and disabled state. Keep anchoring/motion shared. Rest shows the selected icon; hover previews icon choices; click/touch/keyboard opens labeled choices; selection/outside click/Escape dismiss with correct focus. Hover never changes a value. Retain the pointer bridge/departure grace, stable trigger geometry, viewport flipping and reduced-motion behavior.

Acceptance: the existing Composer behaves and looks unchanged, keyboard and touch reach every option, separate instances stay independent, selected value survives reopen, and narrow/bottom-edge positioning works. Demonstrate the extracted component in Foundry alongside Composer before accepting another consumer.

## Candidates after actual reuse is established

| Candidate | Composition | Shared behavior to extract | What remains application-owned |
| --- | --- | --- | --- |
| InlineEditor | Text + Input/TextArea + Button | Display/edit transitions, focus, Enter/ Escape rules, draft retention on failure | Validation, API request, accepted value, routing |
| AsyncSubmission | Existing form controls + Loading + notification feedback | Prevent duplicate submit, pending/failed/success states, preserve failed draft, close only after accepted save | Backend operation, retries permitted by product, permissions |
| FilterGroup | ActionMenuCheckboxItem + existing trigger | Controlled set of selected values, clear selection semantics, stay-open multi-choice behavior, keyboard use | Available filters and actual query/filter predicates |
| Expandable grouped rows | Card + Disclosure + TaskRow | A documented composition whose surface encloses header and expanded children; responsive rows | Module IDs, task data, completion predicate, drag/drop and persistence |

The last candidate may remain a documented recipe for composition; do not create a duplicate Disclosure or module-specific primitive merely to increase component count. Similarly, Dialog/Drawer, Popover, ContextMenu and ResizeHandle already provide reusable behavior: use them as they stand.

## Documentation and implementation location

The library's sole source is `packages/ui` in the Caelos repository; see [SOURCE-OWNERSHIP.md](SOURCE-OWNERSHIP.md). Put each implemented behavior in `src/`, recipe/motion additions beside existing recipes, real examples in `preview/`, and meaningful browser checks in `tests/`. Update [COMPONENTS.md](COMPONENTS.md) only when an export exists. Keep behavior contracts in this folder, linking longer contracts from INTERACTION-PATTERNS.md. The vault workflow and brand-library pointer should stay small and link here.

For each accepted pattern document: intended use and counterexamples; exact public props; state transitions and callback ownership; pointer/keyboard/touch/focus; overlay placement and reduced motion; pending/error/disabled states; a working example; integration evidence and known limits. An API table alone is insufficient.

## Delivery order

1. Finish and verify Level 1 consumer migration and the `packages/ui` single-source consolidation.
2. Extract ProgressiveSelector with Composer as its first consumer.
3. Identify a second real destination for each further candidate, compare its behavior, and approve any unsupported design before extracting it.
4. Apply the draft workflow's review/verification checklist. Skill installation, mandatory CI and package publishing remain separate work.
