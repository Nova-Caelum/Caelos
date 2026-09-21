# Current design decisions

Recorded 2026-09-19 from the user approvals in the composer/template session. Supplements the historical Atlas handoff.

## Approved component direction

- Normal-case tabs with animated active indicator and reduced-motion support.
- Boxed select treatment; menu selection must not shift the page.
- Retain all composer controls even if a host has not connected a capability. Explain unavailable actions honestly.
- Goal and instruction are compact, editable/removable composer pills. Use Lucide `Goal`; hover/focus reveals specific content.
- Remove the duplicate reply/live-conversation footer.
- Established graph ground/chrome and elevation ladder distinguish reasoning, artifacts and floating surfaces.
- Agent messages use circle avatar, quiet name and indented unboxed text; continuations may omit repeated identity.
- Chat spacing and viewport positioning are host responsibilities, not a global fixed offset in the shared composer.

## Typography direction

The user's September 19 direction supersedes the earlier wordmark-only restriction on Yrsa. Use Yrsa selectively for the primary identity of a window, project or conversation. Keep IBM Plex Sans for body text, agent bylines, navigation, controls, metadata and routine section headings; Plex Mono for code and technical identifiers.

Atlas 2 illustrates the distinction: Yrsa gives the conversation title identity; the Plex subtitle and agent controls stay quiet and readable. Its 21px/24px, weight-500 title is a reference specimen, not a global size mandate.

Proposed implementation policy: an opt-in semantic identity-title variant, not a redefinition of every Heading or h1/h2. One primary Yrsa anchor per visual region. Verify real font weight/loading, long titles and narrow widths. No typography tokens changed in this staging migration.

## Approved spacing relationships — September 19

After reviewing Atlas 3 in Compact, Default and Comfortable, the user approved all three and explicitly confirmed that Default “should truly be our default.” Default is now the fallback of the public spacing components and the Panda `spacing` recipe.

| Relationship | Compact | Default | Comfortable |
| --- | --- | --- | --- |
| Complete fields (`FieldGroup`) | 18px | 21px | 24px |
| Sibling groups (`SectionStack`) | 24px | 27px | 30px |
| Section intro → content (`Section`) | 12px | 15px | 18px |
| Surface inset (`Inset`) | 18px | 21px | 24px |

Stable relationships: 6px title → description, 9px inline/action clusters, 12px generic stack, 24px responsive-grid gap. Existing field interiors remain 8px. Preserve all three density options via `SpacingDensity`; width or content length never silently switches the choice. New compositions use Default without configuration.

Implementation: `src/spacing.tsx`, `src/spacing-recipe.ts`, public package exports and the preset. Foundry’s React 19 **Spacing** tab is the maintained reference; Atlas 3 also consumes the shared build. [Reasoning, usage and adoption limits](../../docs/design/SPACING-RELATIONSHIPS.md). This approval does not itself migrate existing host layouts or the React 18 runtime.
