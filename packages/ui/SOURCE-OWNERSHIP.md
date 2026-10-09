# Shared UI source ownership

Updated 2026-09-19. Replaces the September 10 assertion that only one active copy exists.

| Track | Authoring location | Purpose |
|---|---|---|
| React 18 baseline | Caelos-console/packages/ui | Existing task graph runtime and rollback baseline |
| React 19 candidate | caelos-chat-react19/packages/ui | Approved recent composer/message work |
| Foundry snapshot | Caelos-console/staging/foundry-react19/vendor | Immutable built staging package; never edit directly |

No automatic bidirectional sync. Author candidate components in the React 19 location, build, then explicitly refresh the pinned Foundry snapshot. Review before promoting the main runtime; do not overwrite the React 18 source or peer dependencies as a shortcut.

The retired NovaCaelum-UI-Primitives remains an archive. Historical validation/migration ledgers are dated evidence. DESIGN-REFERENCES.md and CURRENT-DESIGN-DECISIONS.md define precedence.

The staging gallery has its own React 19 document. The administration frame and legacy tuning remain React 18. Full task graph runtime migration is separate. The default production build does not enable staging.
