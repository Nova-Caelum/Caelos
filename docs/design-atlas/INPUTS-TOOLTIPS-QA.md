# Inputs and tooltips — verification

September 7, 2026. Local atlas on port 5181.

- Production bundle built successfully with the installed Vite CLI (2086 modules). The package-manager wrapper was rejected by the vault hook despite the temporary working directory; the direct build used existing dependencies in /private/tmp/caelos-design-atlas and installed nothing.
- Visually checked dark rest/focus and light validation states, expanded and narrow composers, dark and light owner tooltips.
- Browser-computed input type confirmed: current 12.25px/400/normal spacing; refined 13px/500, .247px letter spacing, .715px additional word spacing.
- Shared sample values and search filtering verified. All six comparison fields become disabled. Empty-name validation marks two fields and clears after entering a name.
- Composer one-line shell: 79px / radius 39.5px. Eight-line shell: approximately 235.6px / radius 28px, textarea 187px, no overflow. Ten-line content: shell remains approximately 235.8px, textarea 187.2px, internal overflow auto. Narrow width 360px wraps and grows.
- Shift+Enter produced a newline. Enter cleared the composer and showed the local preview receipt.
- Owner tooltip opened on keyboard focus, displayed the full name and role, and dismissed with Escape. Pin state toggled. Guidance click showed a persistent hint.
- Tooltip pointer hover uses the Radix implementation; a separate pointer-hover automation check was not available through the browser locator API. Keyboard interaction and rendered appearance were verified.
- Reduced-motion switch produced a computed 0s composer transition. Captured browser warning/error logs were empty.

Limits: this is a visual study, not a production migration or a full accessibility audit. Native textarea resize is enabled but its drag gesture was not automated. Narrow composer was checked; full mobile viewport and cross-browser testing remain for implementation. Notes persistence/export are implemented separately from existing review keys; existing user notes were not overwritten for testing.
