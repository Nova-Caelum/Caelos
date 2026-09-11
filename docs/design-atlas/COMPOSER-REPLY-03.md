# Composer reply study 03

September 8, 2026. Preview: http://localhost:5181/#composer-reply

User requested a brain icon replacing the always-visible model and reasoning buttons, revealing both buttons on hover to prevent toolbar displacement at narrow widths.

Implemented a fixed-size brain control with a floating panel, a 260ms pointer departure grace period, click-to-pin, keyboard opening with ArrowDown, and Escape dismissal. Model and reasoning remain separate selectors. Opening a child dropdown pins the panel so it remains available while choosing. Narrow and mobile toolbar rules now keep the compact input and response controls on one row.

Validation: production build passed. Narrow screenshots confirmed the collapsed and expanded panel fits without moving the other controls. Keyboard selection changed model to GPT-6 Astra and reasoning to High independently, retaining the panel after selection. Escape dismissed it. Pointer-only hover timing was reviewed in code but not exercised through automation; one coordinate-driven nested-menu click missed its target, so menu selection verification used keyboard interaction.

Files: src/ReplyComposer.jsx and src/reply-composer.css. This revision supersedes study 02's always-visible model and reasoning labels. Settings, messages, and audio remain prototype simulations.
