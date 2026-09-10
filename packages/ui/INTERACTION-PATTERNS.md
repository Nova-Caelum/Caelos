# Caelos interaction patterns

This is a normative part of the shared Caelos design system, alongside the locked material, typography, and motion contract in [README.md](README.md). Final user decisions take precedence over historical atlas proposals.

## Progressive Selector

**Principle: reveal detail as intent increases, while the control stays stable.**

Approved reference: the conversation composer's output-mode control in the Foundry Components view. The user approved its icon → hover choices → labeled choices behavior on September 9, 2026. Preserve this behavior when reusing the pattern.

### Required scope

Use this pattern for compact, icon-led settings with a small, stable set of mutually exclusive choices that can be applied immediately and reversed easily. Output mode is the reference use case. New controls with the same interaction needs must reuse this pattern rather than inventing different hover and click behavior.

It is not a universal replacement for dropdowns, tabs, action menus, or permission decisions. Keep conventional labeled controls when choices need explanation, a long list, confirmation, or a form. The model/reasoning control is a related disclosure into two separate settings, not an interchangeable three-choice selector.

### State contract

| State | Appearance | Interaction |
| --- | --- | --- |
| Rest | One stable icon representing the selected value. | Hover reveals quick choices; click or keyboard activation opens the labeled selector. |
| Hover | A compact row of option icons; the current choice is visibly selected. | Clicking an option applies it. Clicking the original trigger pins and expands the same selector to show labels. |
| Expanded | The same options, in the same order, with icons and visible text labels. | Remains open after pointer exit. Selection applies the value and dismisses the selector. Clicking the trigger again, clicking outside, or Escape dismisses it. |

Hover is a preview of available choices, never a change to the selected value. Moving from trigger to selector must not close it; retain the reference's pointer bridge and 260 ms departure grace. Do not require a precise pointer path. Never require hover to access a choice.

### Geometry and motion

- Keep the trigger, composer, and neighboring controls stationary. Only the revealed selector changes size, position, and opacity.
- Expand the existing surface; do not replace it with a visually unrelated menu. Preserve option order, selection, and the user's point of reference.
- Match the approved emergence: 260 ms with `cubic-bezier(.16,1,.3,1)` for entry/expansion, 170 ms opacity, and a restrained 7 px translation with scale from .94 to 1. Labels reveal with the surface. No bounce or moving highlight.
- Exit uses 160 ms transform and 130 ms opacity. Honor reduced motion with no transform/size animation.
- In the composer, prefer the selector below the bar and flip above when viewport space requires it. Keep the trigger still and the options within the viewport. Do not shrink the approved typography to force a fit.

### Tooltip contract

- One explanatory tooltip belongs to the original icon. It appears above that icon, leaving the usual hover selector below unobstructed.
- For output mode, the exact label is **Change Output mode**.
- Do not add tooltips to Text, Voice, or Text + voice in either selector state. Keep their accessible names even when the visible labels are collapsed.
- Model/reasoning uses **Change model/reasoning** above its brain icon. Its visible model and reasoning buttons have no additional tooltips.

### Keyboard and touch

- The trigger must be a labeled button exposing the current value, expanded state, and associated selector.
- Enter/Space or touch opens the labeled view directly. Touch must not depend on emulated hover.
- Arrow keys open/navigate choices; Home/End reach the first/last option. Expose the mutually exclusive choice and current selection with appropriate semantics; the reference uses `menuitemradio` and `aria-checked`.
- Escape dismisses and returns focus to the trigger. Selection also returns focus to the trigger. Preserve the approved soft focus treatment.
- Hidden choices are inert and absent from keyboard navigation. Focus entering the selector must not dismiss it.

### Implementation and reuse

The current reference is `ReplyFormat` in [src/composer-internal.jsx](src/composer-internal.jsx), with dock geometry in that file and motion in [src/composer-styles.ts](src/composer-styles.ts). It is part of the exported `Composer`; **there is not yet a standalone exported `ProgressiveSelector` component**.

Before adding a second independent use, extract the reference into a shared `ProgressiveSelector` in this package and make the composer consume it. Accept selected value, change callback, and options with stable IDs, icons, and labels. Preserve behavior and appearance during extraction. Consumers must not copy the interaction timers, motion CSS, or state machine into application files.

Panda recipes/tokens own the appearance and motion values; a shared React component owns hover, pinning, dismissal, keyboard, and touch behavior. A recipe alone cannot enforce this interaction contract.

### Acceptance checks

Review in the actual host Foundry, including a narrow viewport and reduced motion:

1. Rest shows the selected icon; hover reveals icons without moving the trigger or its neighbors.
2. Moving into the option row keeps it open. Hovering choices neither changes selection nor creates extra tooltips.
3. Clicking the trigger expands to icons and text; leaving the area does not dismiss the pinned selector.
4. Every option updates the selected value and closes cleanly; reopening shows that same value selected.
5. Outside click, repeat trigger click, and Escape dismiss as specified; keyboard navigation and focus restoration work.
6. Touch can reach labeled choices without hover; viewport collision handling keeps them usable.
7. Only the main tooltip appears, in its approved position; host styles do not reintroduce hard outlines or replace the motion.
