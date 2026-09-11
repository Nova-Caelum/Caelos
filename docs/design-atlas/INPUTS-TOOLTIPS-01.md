# Inputs and tooltips — review study

September 7, 2026. Proposed for review, not an approved replacement.

Preview: http://localhost:5181/#inputs

## Scope

An isolated extension of the atlas. The approved primary, tonal controls, selection language, materials, motion, and typography baseline are preserved. No production code or parallel input workstream was changed. The new study uses the approved type settings as a starting point and does not reopen those settings.

## Input direction

- Compare compact current field styles with refined short, search, and large inputs. Values stay in sync. Rest, hover, focus, disabled, and empty-name validation can be inspected; real focus and typing also work.
- Refined work text: IBM Plex Sans 13px / 19.5px, weight 500, letter spacing .019em, extra word spacing .055em. Current comparison: 12.25px / 17.5px, weight 400, normal spacing.
- More legible placeholders, persistent labels, 11px × 14px input padding, quiet rest fill, 11px corners for ordinary inputs, pill search shape.
- Preserve indigo-to-sage focus: rgba(142,150,204,.22) to rgba(122,158,147,.16), soft 10px violet glow. Search is brought into the same focus family.
- Both large inputs resize vertically. Refined minimum height 108px, maximum 420px.
- Light surfaces are a proposed adaptation, not a captured live light theme. Panel material presets are not applied to every text field; reading surfaces remain calm.

## Composer

Geometry adapted from the existing input fork's ChatComposer.tsx and chatComposer.css in /private/tmp/caelos-chat-preview/src/app/. Its source is read-only in this workstream.

- 22.4px text line height, 8px text padding, 48.6px shell chrome.
- Single-line shell 79px tall, radius 39.5px, inline inset 32.89px.
- Expanded radius 28px, inset 21.39px; grow to eight visual lines then scroll internally.
- Measure at the single-line inset first to avoid oscillating between wrap decisions; remeasure on font readiness and width changes.
- Proposed lettering: 14px, weight 500, approved letter/word spacing. Toggle to current 400/normal lettering.
- Proposed height transition 380ms; radius and padding 320ms; cubic-bezier(.4,0,.2,1). Reduced motion disables transitions.
- Enter submits only within the local demonstration; Shift+Enter inserts a newline. IME composition is guarded. No message is sent to an agent or service.

## Tooltips

Tooltips belong in the primitive system: their surface, type, delay, placement, and accessible behavior should be reusable. Application context supplies the label. They are not a substitute for persistent field labels, essential instructions, errors, or interactive popovers.

The atlas already had basic tooltip instances. This study makes the proposed treatment explicit, with always-visible appearance samples and working action, owner, reference, and guidance triggers.

- IBM Plex Sans 12px/1.5, medium; supporting detail 11px.
- 11px rounded corners, 10px × 13px padding, quiet shadow, protected near-opaque surface. Dark cream text; a separately tuned light surface.
- Radix Tooltip: 380ms initial hover delay, 250ms skip delay in the dedicated group; keyboard focus; Escape dismissal; portal placement and 14px collision padding.
- 180ms gentle entry / 110ms fade-out; reduced-motion override.
- Guidance also has a click-to-toggle persistent hint for touch access.
- New styles are scoped; existing gallery tooltips are not globally replaced before review.

Behavior reference: [Radix Tooltip documentation](https://www.radix-ui.com/primitives/docs/components/tooltip).

## Review persistence

A separate notes field saves under `caelos-input-review-v1`. Download review exports the proposed settings and the notes as Markdown. Existing atlas and typography storage keys are untouched.

## Files

`src/InputLab.jsx`, `src/input-lab.css`, and the new view/navigation wiring in `src/main.jsx`. This study is still React/CSS; convert reviewed choices into Panda semantic tokens and recipes after approval, following PANDA-HANDOFF.md.
