# Shared UI source ownership

Updated 2026-09-20. The React 19 candidate moved into this repository from `caelos-chat-react19`, a clone of `vercel/chatbot` whose `origin` pointed at Vercel; its package source had never been committed there. Replaces the 2026-09-19 table.

| Track | Authoring location | Purpose |
|---|---|---|
| React 18 baseline | Caelos-console/packages/ui | Existing task graph runtime and rollback baseline |
| React 19 candidate | Caelos-console/staging/ui-react19 (`@nova-caelum/ui-react19`) | Approved recent composer/message work |
| Foundry snapshot | Caelos-console/staging/foundry-react19/vendor | Immutable built staging package; never edit directly. **Not on `main` as of 2026-09-20** — uncommitted local work. |

**Why `staging/` and not `packages/`:** the root `workspaces` glob is `packages/*`, and this package's peers (`react@^19`, `motion@^12.42`) conflict with the console's React 18 — placing it under `packages/` makes the console's own `npm install` fail with `ERESOLVE`. It installs on its own: `npm --prefix staging/ui-react19 install --workspaces=false`. (The same pattern is used by `staging/foundry-react19`, which at the time of this move existed only as uncommitted work in a local checkout, not on `main`.) It is renamed `@nova-caelum/ui-react19` so the two tracks never collide by name.

No automatic bidirectional sync. Author candidate components in the React 19 location, build, then explicitly refresh the pinned Foundry snapshot. Review before promoting the main runtime; do not overwrite the React 18 source or peer dependencies as a shortcut.

The retired NovaCaelum-UI-Primitives remains an archive. Historical validation/migration ledgers are dated evidence. DESIGN-REFERENCES.md and CURRENT-DESIGN-DECISIONS.md define precedence.

The staging gallery has its own React 19 document. The administration frame and legacy tuning remain React 18. Full task graph runtime migration is separate. The default production build does not enable staging.
