# Caelos design atlas

A separate interactive review prototype for Daniel’s evolved Caelos direction. Ten studies, fifteen credited research sources, and browser-local review notes. Built September 6–7, 2026.

Preview: http://localhost:5181/

## Start and build

The active runtime is `/private/tmp/caelos-design-atlas`. Its `node_modules` is a read-only dependency link to the existing Caelos-console installation. Cache and build output stay in this runtime; no original app files are changed.

```sh
cd /private/tmp/caelos-design-atlas
node node_modules/vite/bin/vite.js --configLoader native --host 127.0.0.1 --port 5181 --strictPort
node node_modules/vite/bin/vite.js build --configLoader native
```

This folder (`docs/design-atlas/` in the Caelos repo) is the durable source copy. The temporary runtime is disposable. To recover it, copy this source into a development directory and provide the dependencies in package.json. The native config loader avoids writing Vite’s temporary bundled config into the shared dependency installation. No new packages were installed for this exploration.

## Review

- Start with **02 · Depth without noise**, **04 · A softer sidebar**, and **06 · Filters with room to breathe**.
- Switch Material mode between Dark (76% / 19px / 14%) and Light (24% / 2px / 23%). Panels, menus, and sample backdrops switch together; gallery chrome stays dark. Each mode retains independent session adjustments. Reset material restores that mode’s preset.
- Adjust transparency (0–100%), background blur (0–48px), and tint strength (0–30%) independently. Choose Violet, Sage or Neutral. Text opacity remains unchanged.
- Drag the panel and menu across Graph paper, Workspace, or Light & shade. The handle also accepts arrow keys; Shift moves 40px rather than 10px. Reset position returns the specimen to its starting position.
- Compare text-only statuses with meaningful icons, and Gentle acceleration with Original crisp motion.
- Try the sidebar, editable statuses, filter tokens, dropdown, button states, and expanding inspector. Menus and tabs support keyboard navigation.
- Mark **Keep / Explore / Pass** and add notes. Keep and Explore appear in Your shortlist. Clicking the selected decision clears it.
- Export review provides **Copy Markdown** and **Download Markdown**, including active mode, both material settings and source links for all ten studies.

The submitted first review is summarized in `src/reviewRoundOne.js` and archived in `REVIEW-01.md`. The second review is in `src/reviewRoundTwo.js` and `REVIEW-02.md`. It supersedes missing entries and unchanged round-one seeds; other browser edits, including cleared decisions, retain precedence. See `PANDA-HANDOFF.md` for the theme-token mapping.

Review data uses localStorage key `caelos-atlas-reviews-v1`, scoped to this browser and origin. It is not a cloud save. Material settings and demonstration task state reset on reload. No real project actions or live backend writes occur.

## Scope and provenance

The primary button and design derivation files in `src/anchor` were copied from the existing Caelos-console source. Its computed resting height (30px), radius (10px), font (10.5px), background and shadows were compared against the live localhost app. Typography follows the updated brand skill: IBM Plex Sans for operational UI, IBM Plex Mono for structural coordinates, and Yrsa reserved for the exact “Nova Caelum” wordmark (not rendered here). The gallery uses cream text, and the existing design token derivation. Supporting styles are new review proposals.

The user’s current preferences and live app take precedence over older brand guidance. Local brand and surviving Linear research derivatives informed spacing, hierarchy, and restraint. Sources and exact adaptation decisions are embedded in `src/sources.js` and the Sources & rationale view.

These are original adaptations, not imported skins from fifteen libraries. The runtime uses the existing React, Radix, Motion and Lucide installations. This is not a completed Panda component migration. Inputs, chatbar expansion and loading animation remain in their separate workstreams.

See RESEARCH.md for the design judgment and proposed recipe boundaries, and QA.md for checks and limits.

### Inputs and tooltips study

Open http://localhost:5181/#inputs for the current/refined input comparison, expanding chatbar, and dedicated tooltip examples. This proposal is documented in INPUTS-TOOLTIPS-01.md, with verification in INPUTS-TOOLTIPS-QA.md. Review notes save separately from the approved gallery decisions.


## Inputs and composer — locked September 8, 2026

The Refined / Proposed input family and composer through revision 08 are approved. See [INPUTS-COMPOSER-APPROVED.md](INPUTS-COMPOSER-APPROVED.md) and the frozen source snapshot for the definitive scope. This supersedes earlier pending-review language for these treatments. Panda extraction and production integration remain implementation work.
