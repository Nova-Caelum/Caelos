# Composer reply 04 — shared popover edge

2026-09-08 · Local atlas prototype, not production package integration.

## Approved placement and icon decisions

- The rounded key (Lucide KeyRound, aliased PermissionsIcon) is the definitive permissions icon. Preserve it when building the Panda component package.
- On the launch screen, agent identity and permission controls belong beside the composer.
- During established conversations, agent identity and permissions belong in the chat header. This revision records that decision; it does not implement the conversation header. The current atlas remains the launch composition.
- Composer popover cards share a vertical anchor: panel bottom meets the outer top edge of the writing surface. This applies to hover previews and click-open cards, including Add, reply format, model/reasoning and their choice menus. Tooltips retain local placement.

## Implementation

The composer provides its actual mounted shell element through context. A shared measurement hook observes shell and trigger size and viewport resizing. Inline panels use an invisible pointer bridge spanning the distance to the composer top; portalled Radix menus use the equivalent measured offset. Hover and pinned views use the same positioning. Panel reveal changes opacity without moving the dock edge. Radix collision handling remains enabled when the viewport cannot accommodate the preferred placement.

## Verification

- Production Vite build passed, 2088 modules.
- Browser geometry: single-line model and reply panels had 0px edge delta; Add and nested model choice menu were within 0.35px (subpixel rounding).
- Narrow composer settled at 390px wide, eight-line shell 276px tall. Model and reply panels had 0px delta; Add within 0.35px; permission menu within 0.16px.
- Visually inspected expanded narrow reply selector against the eight-line draft.
- Keyboard opening and Escape dismissal exercised. Click-open reply selector exercised. Pointer-only hover travel was code-reviewed, not directly automated with the available browser API.
- Runtime and durable source copies were byte-compared after saving.

Preview: http://localhost:5181/#composer-reply
