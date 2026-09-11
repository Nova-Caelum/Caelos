# Composer reply · revision 08

## Menu persistence correction

Model, reasoning, permissions, and Add menus open on completed click. Previously the pointer-down opened a docked menu over the trigger; releasing that same click could select the menu item underneath, immediately closing the menu and changing the value.

The existing docking, entrance motion, tooltip treatment, and keyboard behavior remain in place. Explicit selection, outside click, and Escape dismiss the menus.

## Verification

- Reproduced the failure before the fix with a 900ms hover followed by a 140ms mouse click.
- After the fix, all three choice menus remained open for the observation interval and accepted deliberate selections.
- Enter, Space, ArrowDown, Escape, and outside-click dismissal passed for permissions, model, and reasoning.
- Add menu persistence passed; no browser page errors.
- Confirmed permissions menu remains open in the user's existing in-app preview without changing its setting.
- Vite production build passed.

Scope: design atlas preview. No production rollout performed.
