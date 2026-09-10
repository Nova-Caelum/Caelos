# Caelos interaction patterns

This is a normative part of the shared Caelos design system, alongside the locked material, typography, and motion contract in [README.md](README.md). Final user decisions take precedence over historical atlas proposals.

## Click-opened popup placement

Approved September 10, 2026: a popup opened by a primary (left) click must never cover the control that opened it. Keep the trigger visible and stationary through opening, selection and dismissal. Apply the same placement to keyboard and touch activation.

For the composer’s agent, model and reasoning submenus, prefer above the complete parent settings card: the submenu’s bottom edge meets the parent card’s top edge with no gap. Align horizontally with the selected field, clamping to the viewport when necessary. Do not anchor these child menus to the writing surface or place them over the parent card. Track the card while its labels expand, its rows wrap, or the page scrolls.

If there is insufficient space above, use space below the parent card, with the submenu’s top edge meeting the card’s bottom edge. Constrain and scroll a long menu on the available side. Collision handling must preserve the unobscured trigger; it may not shift the popup back over its originating control. Existing popup primitives and future popup integrations must be verified against this rule.

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


## Slash command autocomplete

Approved September 10, 2026: a textarea autocomplete using the existing action-menu material and sage Tooltip. The menu contains command names only, including skills in the same list; no row descriptions, badges, group headings, or secondary labels. Pointer hover reveals a quick summary beside the row, preferably to the right; the existing tooltip collision rules keep it inside the viewport. Arrow navigation reveals the same summary. The highlighted row uses the shared tonal selection treatment.

The application supplies its installed catalog through `Composer.commands`. `composer-commands.tsx` owns matching, caret-preserving insertion, and the anchored listbox. `ComposerCommand` is exported from the public package. This is currently a composer interaction, not a general exported autocomplete component.

Acceptance contract:

- Recognize an unselected slash token at the start of the draft or after whitespace. Filter by case-insensitive name substring, preserving the supplied order. Exclude URLs and slash-separated paths.
- Keep focus and writing selection in the multiline textbox. Link it to the listbox with `aria-controls` and `aria-activedescendant`; each option exposes its description. These semantics follow the [WAI-ARIA textbox/listbox focus pattern](https://www.w3.org/TR/wai-aria-1.2/#aria-activedescendant).
- Up/Down navigates with wraparound and keeps the active option visible. Enter inserts, never submits on the same keypress. Click/tap selects. Preserve the rest of the draft and put the caret after the invocation’s space.
- Escape closes and leaves text intact. Tab closes and follows normal focus order. Clicking outside or another composer control closes the menu. IME composition suspends suggestions; Shift+Enter remains a newline.
- Opening a new query resets navigation. Empty results keep writing available and prevent Enter from accidentally submitting the unmatched command while suggestions are open.
- Prefer above the composer, flip below when needed, clamp within the viewport, and scroll long lists. Inherit theme and reduced-motion settings through portals.
- Catalog loading, availability checks, authorization, argument parsing, and command execution belong to the application. Selecting a row only edits the controlled draft.

The preview and Foundry use clearly labeled sample catalogs. Regression coverage lives in `tests/browser.mjs`, alongside existing composer checks. Assistive-technology and physical-device testing remain separate integration work.

### Agent mentions

`Composer.agents` supplies the current chat’s participants using the exported `ComposerAgent` type. `@` uses the same autocomplete behavior and material as `/`, including name-only rows, optional summary tooltips, keyboard navigation, collision handling, and insertion without sending. Match display names and optional insertion handles case-insensitively. Only start-of-draft or whitespace-delimited tokens open the menu, so emails do not trigger suggestions. An empty roster shows “No agents in this chat”; no matches shows “No matching agents.” Omission disables this trigger. The host owns participant membership and routing; selection does not add an agent to the chat.




## Per-agent model and reasoning

The brain remains the stable composer anchor. Hover reveals the active agent’s avatar to the left of model/reasoning. Pinning with click or keyboard reveals the agent name using the same 260 ms decelerating expansion. The identity is a button; opening it presents only the supplied chat participants with shared avatars, names, and a checked selection. Selecting another participant preserves the draft and loads that agent’s model/reasoning values from the host.

The identity selector reuses the composer Choice menu and shared Avatar, rather than adding another public primitive. Keyboard opening focuses the identity first; arrows, Home/End and typeahead navigate the roster. Selection returns focus to the identity; Escape from the pinned settings returns to the brain. Touch opens the full labeled view. The compact surface wraps within narrow viewports, follows the existing dock/flip rules, inherits portal themes and disables expansion under reduced motion.
