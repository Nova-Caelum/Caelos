# Composer reply study 02

Local atlas revision, September 8, 2026. Preview: http://localhost:5181/#composer-reply

User-approved changes:
- Move dictation beside Add on the left of the composer.
- Move permissions beside Nova above the writing surface, using a key icon. Hover provides the current permission name; click opens the choices.
- Split model and reasoning into independently adjustable buttons, without chevrons.
- Keep reply format and the main conversation/send action together on the right.

Validation: Vite production build passed. Browser checks confirmed model and reasoning change independently, permission choices open beside Nova, and the expanded reply selector fits the narrow preview. Pointer-only hover timing was not exercised in this pass. Messages, audio, and settings remain local prototype simulations.

Implementation: src/ReplyComposer.jsx and src/reply-composer.css. Preserve study 01 as historical context; this revision supersedes its toolbar arrangement.
