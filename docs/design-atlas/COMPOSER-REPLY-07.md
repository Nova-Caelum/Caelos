# Composer reply · revision 07

The Add (+) and permissions (key) menus now share the approved restrained emergence: 7px travel, 94% to full scale, 260ms decelerating entrance and 160ms retreat. Trigger icons remain stationary. Radix supplies the transform origin and retains the menu for its exit animation. A single animation controls scale, translation, and opacity to avoid early unmount from separate fade completion. Above-composer docking and surface styling remain unchanged.

Tooltip rule: explain an unlabeled icon or clarify an action; do not repeat an already visible option label. Model and reasoning controls now say “Choose model” and “Choose reasoning.” Reply-format options show tooltips only in their compact icon-only presentation, not the expanded labeled presentation. Menu-trigger tooltips are suppressed while their menu is open. Other composer hints (permissions, add, dictation, send) still add useful context.

The empty composer action now reads “Live Conversation Mode” in its tooltip and accessible name. Its pressed state reflects the mode, and clicking toggles it both ways. Draft/send behavior is preserved. This remains a simulated local interaction preview.

Reduced motion is passed through context to portaled menus so both the gallery control and operating-system preference disable their animation.

Verification: production build passed (2088 modules). Isolated Chromium verified intermediate entrance and exit frames, stationary trigger coordinates, removal after exit, and menu alignment within 0.35px of the composer top. Model/reasoning contextual tooltips, compact-only reply hints, suppression while a choice menu is open, live mode in both directions, and both reduced-motion controls passed with no page errors. Natural pointer movement between neighboring model/reasoning controls was used to exercise the tooltip library’s hover grace behavior. Add and permissions screenshots were visually reviewed. Three runtime and durable source copies match byte for byte.
