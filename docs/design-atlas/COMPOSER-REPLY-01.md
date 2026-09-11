# Composer reply-format study · 2026-09-08

Preview: http://localhost:5181/#composer-reply

## Scope
Interactive atlas mockup, pending user visual review. No production composer, backend, microphone, or audio integration. Source: src/ReplyComposer.jsx and src/reply-composer.css, embedded in InputLab.jsx.

## Interaction direction
- Rest: one icon for Text, Voice, or Text + voice.
- Hover: floating three-icon selector above the trigger; 260ms dismissal grace and pointer bridge. No toolbar reflow.
- Click: persistent labeled selector. Outside click, focus leaving, or Escape dismisses.
- Arrow keys open/navigate; selecting returns focus to trigger.
- Textarea grows up to eight visible lines, then scrolls. Controls remain beneath inside the shared surface.
- Empty primary action starts a simulated live conversation; a draft makes it the blue Send action. Dictation inserts sample text. An alternate live-conversation link preserves access while drafting.
- Model and reasoning remain visible. Permissions use an icon and labeled menu.
- Add menu contains File or folder, Agent, Goal, Session instruction as placement-only items.

## Visual grounding
Adapted the user's supplied Codex composer screenshot: common rounded shell, writing above, controls below, spacing instead of an internal divider. Uses the atlas's existing Caelos input surfaces, glow, primary action tokens, Plex Sans and Yrsa. This is a Caelos interaction study, not a pixel clone. The Both icon is a review candidate.

## Verification
- Vite production build passed: node node_modules/vite/bin/vite.js build --configLoader native. Native loader avoids writing temporary config into linked dependencies.
- Browser rendered resting and labeled selector in dark/light themes.
- Selected Voice by mouse and Text + voice via ArrowDown, ArrowRight, Enter; confirmed selected state and resulting reply-format label.
- Enter sent a local preview receipt and cleared the draft.
- Narrow 390px composer and eight-line expansion visually checked: controls wrap beneath, blue Send remains visible, text does not clip.
- Browser console returned no captured errors/warnings during these checks.
- Pointer-only hover traversal could not be exercised through the available browser API (no supported hover/move operation); bridge, timer and hover state reviewed in source. User hover review remains important.
- Reduced-motion rules implemented; touch hardware and screen-reader behavior not independently exercised.

## Review focus
Judge selector placement, opening feel, Both icon clarity, and composer proportions. Audio and transmission are explicitly simulated. This study does not lock the whole composer into the Panda package.
