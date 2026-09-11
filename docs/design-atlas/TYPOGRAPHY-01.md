# Typography pass 01 — review proposal

Preview: http://localhost:5181/#typography

## Scope
Added a separate Typography lab view using the existing SidebarDemo, TaskDemo, FilterDemo, ButtonDemo, and MotionDemo. The ten approved studies remain unchanged. Typography overrides are scoped to `.type-preview`; the primary button is untouched. This pass is a proposal awaiting Daniel’s review.

The approved source has been preserved in `baselines/refinement-06/`. The original approval fingerprints refer to that snapshot; main.jsx now additionally hosts the typography view.

## Source reconciliation
- `_agentOS/skills_library/nova-caelum-brand-ui/SKILL.md`: IBM Plex Sans for operational and semantic text, IBM Plex Mono for structural coordinates, Yrsa only for the brand signature.
- `Caelos-console/src/styles/theme.css`: matches Plex roles; wordmark is rendered as a raster asset.
- `brand_library/resources/typography.md`: older broader brand guidance names Instrument Sans. Product UI source and user preference take precedence for this task. No upstream brand documents changed.

## Directions
1. Approved atlas: original component typography as reference.
2. Refined hierarchy (recommended): 13px / 19.5px working copy, 13px / 18.2px nav at 500 weight, 10px / 13.5px IDs, Sans signposts and ordinary counts, 11–12px semantic controls at 500.
3. Reading comfort: 14px / 21px working copy, 14px navigation, 12px metadata, 12–13px semantic controls.

A separate natural-case tab toggle supports comparison without changing the chosen surface language. Material surfaces and motion retain approved recipes. Original atlas demo geometry stays intact apart from natural sizing from the type itself. Contextual paragraph/title specimens are new in this lab, so they do not claim a previous baseline.

## Interaction and storage
Existing controls remain interactive. Typography notes use a new browser storage key, `caelos-atlas-typography-note-v1`; original review keys remain intact. Typography has its own Markdown export. Direction choice is a temporary comparison, not approval.

## Validation
- Vite production build passed: 2084 modules.
- Browser checked three presets; comfort task text computed 14px / 21px.
- Refined hierarchy computed nav 13px / 18.2px / 500; working copy 13px / 19.5px / 400; IDs Plex Mono 10px / 13.5px.
- Natural-case toggle works; keyboard ArrowRight changed Overview to Activity and its panel.
- Primary identical in approved/comfort: 10.5px / 650, 30px height, 10px radius.
- No page horizontal overflow at the inspected desktop viewport.
- Visually checked upper workspace and lower controls/tabs. Mobile and full contrast audit remain pending; no accessibility conformance claimed.

## Reading comparison — September 7 follow-up
Daniel requested thicker Plex Sans strokes and more comfortable letter/word spacing. Added an independent reading-treatment comparison (default B); the existing size/hierarchy modes remain available.

- Original lettering: reading overrides off.
- A: working weight 450, letter spacing .008em, extra word spacing .025em.
- B: working weight 500, letter spacing .015em, extra word spacing .05em.
- C: working weight 500, letter spacing .025em, extra word spacing .09em.
- Custom controls: weight 400/450/500/550, letter spacing 0–.04em, extra word spacing 0–.14em.

Navigation and semantic controls use at least 500 weight; working text and supporting copy use the selected weight. Primary button and IDs are excluded. Heading weights are unchanged. Added a side-by-side regular/tuned reading sample beside the controls. Review export includes all reading values. Reset restores refined hierarchy + B and uppercase tabs. Presets are proposals, not new approvals. Original atlas reviews remain untouched.

Validated A/B/C/original computed weights and spacing, keyboard slider adjustment to custom, and reset in the browser. Primary remains 650 / 10.5px and IDs remain 400 / 10px with no added spacing. Desktop screenshots inspected; no page horizontal overflow at inspected viewport. Production build passed after changes.

## Typography — locked September 7, 2026

Daniel approved the saved custom lettering with “great lock it in.”

- Family: IBM Plex Sans for ordinary UI; Plex Mono for coordinates; Yrsa for the Nova Caelum signature.
- Hierarchy: Refined hierarchy (13px working text / 19.5px line height).
- Ordinary working/supporting text weight: 500 (Medium).
- Navigation and semantic controls: 500.
- Letter spacing: .019em.
- Extra word spacing: .055em, added to the normal font word space.
- Freestanding project/divider pill labels: natural case (no uppercase transform), 13px; approved reading spacing applies.
- Heading and signpost roles retain their existing treatment. IDs retain Plex Mono at 400 / 10px. The primary button retains its approved 650 / 10.5px typography, spacing, and geometry.

These settings are now the typography lab's initial and restore defaults. A/B/C remain comparison alternatives, and exports distinguish the approved combination from variations. Review notes remain saved separately and are not overwritten. This locks the design choice and handoff; production Panda migration remains separate.

Saved user note: “Okay! Natural Lettering on divider pills .019 em letter spacing. 0.055 word spacing extra. Perfect!”
