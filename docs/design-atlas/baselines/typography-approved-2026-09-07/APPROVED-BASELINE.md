# Caelos design atlas — approved visual baseline

Approved by Daniel on 2026-09-07 following refinement 06: “i think thats literally perfect. Lets call it a smashing success. and lock it in.”

This records the current chosen atlas direction, with explicit final approval of the freestanding tonal pill treatment. Earlier glass-tab experiments are superseded; declined alternatives remain reference studies. Approval is a design decision, not a production deployment or completed Panda migration.

## Freestanding tabs — locked

- Existing pill shape and spacing.
- Refined tonal fill, with a soft blue-violet hover plane.
- Dawn-cream selected text; muted resting labels.
- No glass blur, sheen, or raised glass lighting.
- Accepted gentle acceleration and functional keyboard tab behavior.

Keep the selected project visible independently of hover in sidebar navigation. Preserve accepted panel/menu material presets, primary button and text-button glow. The typography decision below extends this approved material direction.

## Remaining work

Typography is part of the design-system foundations and primitive recipes: font roles, size, weight, line height, tracking, case, foreground contrast and text-to-edge spacing. The lab typography is now approved below; validate dense real screens during integration before applying shared text styles broadly. Wording and editorial voice are a related content-design pass.

Implementation follow-through remains: Panda recipe extraction, actual taskgraph integration, and contextual checks for contrast, keyboard focus, long labels, density and light mode. Inputs/chatbar and loading animation remain their existing separate workstreams. No additional visual exploration is required to approve this tab treatment.

## Source fingerprint at approval

| Source | SHA-256 |
| --- | --- |
| `src/main.jsx` | `bf5897c4d706c25f4c39cdf7cecec74c90de6af9bde12c711cc39e94bf1e8271` |
| `src/style.css` | `1b69cd64a1746382c33c11bec7f5eb11dc87958f3ff29c843cc61f90d478c350` |
| `src/refinement.css` | `ddfefe6b9488e0c25f5d4ccada2480de30555c5d198b2068243414622e147a5d` |
| `src/MaterialLab.jsx` | `4b06cd736f864e3d759045fee6435a37035e2ba686c7fd420e795adee4cc2526` |

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
