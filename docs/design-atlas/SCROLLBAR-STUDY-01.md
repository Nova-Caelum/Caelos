# Scrollbar study · September 8, 2026

Status: exploration, not approved. Review at http://localhost:5181/#scrollbars.

Two treatments: quiet tonal (recommended) and faint hover aura. Same 6px visual thumb within 22px track region, fully rounded, inset from corners, no visible track. Sage-neutral rest, cream-tinted hover and drag; dark and light specimen modes. 240–280ms decelerated color/shadow transitions, no animation on scroll position. Reduced-motion and forced-colors treatment included.

Sidebar and long-menu specimens use native scrolling with Radix ScrollArea. The composer study uses an editable content region inside ScrollArea; decorative toolbar is context only, not a replacement for the approved composer. Real textarea integration remains package implementation work. Scope is vertical scrollbars; horizontal and production integration not yet covered.

Verification: production build; Chromium drag changed scrollTop to219; keyboard ArrowDown scroll; menu selection; composer editing and scrollbar visibility; no runtime errors; 680px viewport no horizontal overflow. Dark, light, and composer screenshots inspected. Existing approved frozen snapshots unchanged.

Sources: src/ScrollbarLab.jsx, src/scrollbar-lab.css; navigation integration src/main.jsx.
