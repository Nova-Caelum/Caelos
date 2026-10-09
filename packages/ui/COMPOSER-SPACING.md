# Approved composer dock spacing

Approved 2026-09-19 in the Caelos Chat preview.

- Model/reasoning and reply-format pickers: 42px tall, with 4px padding and 13px corners.
- Model labels: 12px, 20px line height. Reply labels: 12.5px, 19px line height; icons: 17px.
- Below-composer gap: 2px. Minimum viewport floor cushion: 3px.
- Host reservation: 47px (42 + 2 + 3), including while menus are closed.

Wrap a viewport-docked Composer in `className="nc-composer-dock-space"` and place that wrapper flush with the viewport floor. This opt-in shared class reserves the popup lane without adding space inside the writing surface. Foundry and the package preview use the same class for their specimens. A scrolling gallery demonstrates the menu gap and density; the exact floor cushion applies when the wrapper is at the viewport floor.

Compact pickers still flip above when the available space requires it. Add-menu positioning is separate and unchanged. This change does not alter context pills, composer controls, footer behavior, or React compatibility.

The React 19 candidate uses these same targeted style and compact-dock changes. Its Foundry snapshot is refreshed separately; this spacing promotion does not migrate the main runtime to React 19.
