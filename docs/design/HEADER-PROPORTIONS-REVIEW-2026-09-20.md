# Header proportions review and message rhythm

## Approved baseline — September 20, 23:19 screenshot

The user approved spacing, proportions, motion and avatar sizing. This supersedes the provisional values and pending-approval statements below. Texture and color remain open; full header PandaCSS conversion is deferred. The user subsequently requested staging promotion; the approved baseline is now used there.

- Rest / expanded width: **45% / 56%** of Composer width.
- Compact density; Composer height minimum **off**.
- Clicked bubble: **30px** avatar gap, **60px** trailing text cushion, **280–460px** content width, always fit to content within available space.
- Object insets: vertical **space-4 / 12px**, leading **space-7 / 24px**, trailing **space-4 / 12px**, content gap **space-7 / 24px**; curved-cap compensation **10%**.
- Title: existing Yrsa 21px header recipe; secondary: small.
- **Agent XL = 48px** (formerly Header Roster), **Agent XXL = 52px** (formerly Header Solo). Shared Avatar now accepts `xl` and `xxl` sizes.
- Rest cluster: XXL for every participant tier. Clicked avatars: XL for one agent, lg / 40px for 2–3, md / 32px for 4–6.
- Motion preserved: split spring stiffness 280 / damping 34 / mass 1; disclosure 260ms; title reveal 340ms; collapse 130ms. Reduced-motion behavior preserved.
- Screenshot study context: 888px pane, three participants. These are preview defaults, not production viewport constraints.

Saved in `packages/ui/src/header-layout.ts`; the study consumes this baseline on reload. Controls remain available for exploration. Material is deliberately excluded from the approved configuration.

Approval verification: package build and isolated study typecheck passed. Browser checks confirmed all screenshot defaults, restoration on reload, 78px resting height, 30px clicked gap, and shared XL/XXL rendered sizes of 48/52px. The 17-check study-controls regression passed with no browser errors, including density, typography, participant tiers and narrow layouts.


## Staging promotion

The staging header now uses the same `StudyHeader.tsx` implementation and shared `header-layout.css` as the approved study. `components/chat/approved-header.tsx` adapts the baseline to the actual Composer width in the available conversation pane, including sidebar/workspace resizing. It consumes existing typography and spacing values; the full production Panda recipe remains deferred.

Existing agent details, project/work-item drawers, linking control, visibility control, and sidebar controls remain connected. Staging-specific CSS reserves room for the link control and contains the conversation ID at narrow widths. Material currently matches the study's Composer-material proposal; texture/color are not newly locked by this port.

Verification: `scripts/verification/staging-approved-header.mjs` checks 1512, 1024, 640 and 390px viewports, 45% / 56% proportions, 78px rest height, centering, clicked solo XL size, metadata containment, agent detail, and both drawers. The staging typecheck and production build pass. The existing study baseline check also passes after sharing its CSS.

## Earlier review history (superseded by the approved baseline above)

http://127.0.0.1:5183/?tab=studies#header-proportions

The new 03A study sits ahead of the existing header studies. It renders the packaged Composer and a local fork of ConversationHeader. It is not exported by the UI package or imported by staging. Atlas entry point: `/Users/danieleghdami/.codex/visualizations/2026/09/10/01a08c27-bbae-7a63-bc97-6b8f68574e69/design-atlas-2/main.tsx`.

- Pane can be resized with a slider or its lower-right resize handle.
- Separate percentage sliders control rest and expanded width relative to the Composer (initially 80% / 90%). Moving either past the other adjusts its counterpart to keep expanded width at least as wide as rest.
- Base height now follows content and the existing spacing recipe: compact inset 18px, default 21px, comfortable 24px. With the initial title, secondary text and 40px solo avatar this yields 86 / 92 / 98px. An optional checkbox restores the observed Composer height as a minimum.
- Expanded title measurement supports more than two lines. Only the extra lines increase hover height. Click retains the existing participant separation and extra chat-id row.
- Curved cap radius follows the base height so long titles do not turn the surface into an oval with text outside its edges.
- Short/long title, editable title, participant count, and material comparison controls are included.
- Title and secondary typography selectors use the package typography recipes (body, small, label, mono, display, page, section, title), plus the existing Yrsa 21px header title. Hidden recipe probes supply the actual computed font metrics to both title rendering and measurement.
- Avatar settings are independent for 1, 2–3 and 4–6 agents. Rest size sets the whole cluster height and preserves the asymmetric composition; expanded size sets each avatar after click/separation. Hover retains the cluster. Options distinguish shared Avatar sm/md/lg (24/32/40px) from adjustable Header Roster / Header Solo presets (initially 48/64px). Each preset has an independent 24–96px slider, in 1px increments. A tier assigned to that named preset follows its slider for either rest or expanded state; fixed shared Avatar choices remain unchanged. These are study controls, not newly approved production tokens.
- Widths share the Gallery calculation: zero Composer inset through 1024px, growing linearly to 200px per side at 1748px; outer chat margins retain their 640–1320px interval. The study is capped by the available browser width.

## Material finding

The original header does use the system `Card variant="glass"`. In dark mode its computed background includes a 24%-alpha base and a tinted gradient; its backdrop filter is `blur(19px) saturate(1.2)`. It is translucent, but the substantial blur removes grid detail. The Composer uses the existing `--il-fill` / `--il-edge` material without that blur. The study defaults to the Composer material as a proposal, with the current system glass available for direct comparison. No global glass token was changed.

## Staging message rhythm

http://127.0.0.1:3106/ui-lab?fixtures=chat#message-rhythm

Previously every turn received a uniform 24px gap. Staging now uses `--sys-space-4` (12px) between consecutive user turns or replies from the same agent, and `--sys-space-7` (24px) on a speaker change. These are existing scale tokens; the speaker-dependent mapping is new. Assistant identity is checked by agent ID, not merely role. Existing action rows still reserve their own space below message content, so visible bubble-to-bubble distance includes that row. No hover layout shifts or action relocation were introduced.

Implementation: `components/chat/message-turn.tsx`, `components/chat/messages.tsx`, `lib/message-agent.ts`; fixture in `app/ui-lab/ChatFixtures.tsx`.

## Validation and status

- Staging typecheck and isolated Atlas-study typecheck pass.
- Staging production build passes (existing bundle-size warning remains).
- Browser checks cover 1320, 900, 640 and 390px pane settings, rest/hover ratios, base height, multi-line expansion and click state.
- A 390px browser check covers long titles and six pinned participants.
- Message rhythm checked at 1512px and 390px with consecutive users, consecutive same-agent replies and a different agent.
- Header and material proposal await user approval before staging/package promotion.
- `scripts/verification/header-study-controls.mjs` verifies both percentage controls, three density heights, all nine title choices, secondary typography, tier-specific rest/expanded avatars, long-title growth, narrow layouts and absence of browser errors. Evidence: `docs/design/verification/header-study-controls-report.json` and matching desktop/narrow screenshots.
- Settings last for the current page session; refresh returns to the study defaults.

- Header preset slider check: isolated study typecheck passed; browser verified independent Solo/Roster changes, live resizing while pinned, three-agent roster sizing, and no page errors. Screenshot inspected at `/tmp/header-avatar-sliders.png`.

## Object-spacing controls

Added independent token-stepped sliders for vertical inset, leading text inset, trailing avatar inset, and text–avatar gap, plus 0–100% curved-cap compensation and Reset object spacing. Density presets remain the inherited starting values. Explicit overrides survive density changes. Actual cluster width replaces the fixed 88px avatar reservation. See `SPACING-RELATIONSHIPS.md` for the proposed semantic roles and promotion boundary. These changes remain in the study.

### Clicked text bubble sizing

The clicked bubble always fits its title, linked-work text, and identity line, within minimum and maximum text widths. The previous fit toggle and percentage slider have been replaced by four independent controls:

- **Bubble–avatar gap:** distance from the bubble edge to the detached avatars (initially 24px).
- **Text end cushion:** space between the text area and the bubble’s right edge (initially 24px). Leading inset remains under Object spacing.
- **Minimum text width:** lower bound on the content width (initially 180px).
- **Maximum text width:** upper bound on the content width (initially 560px).

The roster follows the fitted bubble at the selected gap. Minimum and maximum controls keep each other in range. Available pane width takes priority over the minimum; the gap contracts if necessary. Rest and hover percentage controls remain independent. These pixel-valued geometry controls remain study-only pending review and token promotion.

Very long titles show at most four lines in the clicked bubble, with scrolling to read the complete title. The animated rest/hover preview is bounded to avoid creating thousands of animated glyphs. Browser verification covered independent gap and cushion changes, minimum/maximum bounds, a 10,000-word title with scrolling, and a narrow pane with six avatars. No browser errors were observed. Evidence: `/tmp/header-spacing-report.json`, `/tmp/header-spacing-long.png`, and `/tmp/header-spacing-narrow.png`.
