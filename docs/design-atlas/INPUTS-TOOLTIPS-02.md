# Inputs and tooltips — round two proposal

Date: 2026-09-07
Status: rendered for review, not approved.

## Tooltip comparison

Existing platform tokens, resolved from the atlas live-token snapshot:
- Cool accent: --sys-accent / #678BEC.
- Sage: --sys-sem-sage / #7A9E93.
- Top surface: --sys-top / #262639.

The proposed blue and sage materials mix their existing accent into the top surface, use a subtle cream upper highlight, and increase shadow separation. Reading surfaces remain opaque. Light previews mix the same accents into the existing cream token with dark text. No new brand hue was introduced; no approved shared palette was changed.

The Current, Indigo blue, and Sage samples are always visible together. The material selector applies to the working help tooltips and composer Send tooltip. Review export includes the selected material. Existing review notes are preserved.

Validation: Vite production build passed (2086 modules). Visually inspected dark and light comparisons. Keyboard Tab revealed the owner tooltip with the selected sage material; Escape was exercised. Pin toggling worked. Browser warning/error log was empty. Pointer hover was not automated in this pass. This is not a full accessibility audit.

## Composer direction collected from user — not implemented in this pass

The current minimum height is too large and is a legacy design artifact, not an approved constraint. Revisit compact dimensions while preserving fluid corner adjustment and one-to-eight-line expansion.

Primitive responsibility: writing surface, typography, focus treatment, sizing and expansion, overflow, disabled/error states, and slots for supporting controls.
Composer responsibility: arrangement of attachments, context, model selection, Send, voice controls, and secondary toolbar; explore placing secondary controls beneath the input, based on the supplied references.
Voice experience: distinguish voice-to-text input, spoken or text output, full conversational voice mode with its transition, and show/hide spoken-output transcript. These need a focused interaction design pass coordinated with composer layout.
Deferred by user: editor-like formatting and syntax color in the composer; Monaco integration feasibility is not evaluated here.

Next scope recommendation: design the composer layout and voice-state model together before locking control placement. Backend voice implementation can follow separately.

## Typography alignment — approved 2026-09-07

Tooltip labels and supporting lines now both use IBM Plex Sans Medium (500), 13px type with 19.5px line height, .019em letter spacing, and .055em extra word spacing. Supporting information is distinguished through quieter color rather than smaller or lighter lettering. This applies to the comparison specimens and interactive tooltips.

## Sage frost comparison — proposed 2026-09-07

The comparison now presents opaque sage against sage with 10% fill transparency and 10px backdrop blur. Typography, stationary highlight, border, and shadow are shared; text remains fully opaque. Graph paper and color backdrops can be switched together for both samples. The material selector applies either choice to the working tooltips and composer Send. Unsupported backdrop blur falls back to the opaque surface. Sage is the initial tone, following the user's preference; the frosted treatment is still awaiting review.

Validation: Vite production build passed. Browser computed styles confirmed opaque versus 0.9 fill alpha, none versus 10px blur, and identical 13px/19.5px Medium typography. Dark and light comparisons visually inspected.

## Sage tooltips — locked September 7, 2026

Daniel approved: “Okay the 20% transperency option is perfect. Lock it IN!”

- Existing sage palette token; frosted sage is the default treatment.
- Base fill: 20% transparency (80% opacity), with 10px backdrop blur. Text remains fully opaque. The stationary broad gradient remains; no top-only inset highlight or animated sheen.
- Preserve the approved cream lettering in dark mode and legible ink in the light adaptation.
- IBM Plex Sans Medium 500, 13px / 19.5px, .019em tracking and .055em added word spacing for labels and supporting lines.
- 11px radius; 10px vertical and 13px horizontal padding; uniform 1px border; soft outer shadows.
- Retain opaque fallback when backdrop blur is unsupported. Opaque sage stays available as a comparison.
- Keep the existing keyboard/Escape, collision handling and reduced-motion behavior when extracting the primitive.

This supersedes earlier tooltip material proposals, including the 10% transparency experiment. Approval covers the tooltip treatment; inputs and composer remain under review. The atlas default is implemented; production integration and Panda extraction remain separate work.
