# Studio correction — implementation and verification

Date: 2026-09-19

Preview: http://127.0.0.1:5187/?tab=studio

## Scope and provenance

Studio follows the discrete component study pattern inspected in Atlas One and Two. The previous conversation lab remains available as Demo, including its experiments. The approved spacing study remains available and its stylesheet is unchanged. No shared components, Panda tokens, Foundry source, production composer, staging application, or Atlas Two files were edited for this correction.

Actual specimens import the staging implementations, including PreviewMessage, ThinkingMessage, MessageReasoning, DocumentPreview, Artifact, PreviewAttachment, Messages, Greeting, and MultimodalInput. They use the application fonts and stylesheet ordering in their own iframe document. Synthetic fixture content and local providers make these review specimens; they are not a copy of the saved staging conversation.

The checklist covers 23 studies: identity, user messages, assistant text/motion, markdown/code, waiting/loading, reasoning, tools, permissions, questionnaires, attachments, upload recovery, inline artifacts, expanded artifacts, message actions, citations, web previews, work progress, delegation, navigation, unread markers, interruption/recovery, empty conversation, and the locked composer. The catalog records actual source paths and explicitly marks missing staging wiring. Existing experiments are labeled as candidates, never as the current implementation.

## Isolation

The fetch adapter is installed before application imports. Document reads/writes, votes, session, model capability, and suggestion requests resolve against local memory. Unknown requests return an explicit failure rather than forwarding to a backend. The specimen CSP additionally blocks network connections. Each actual specimen has its own SWR cache. Reload/reset discards in-memory edits. The composer is imported unchanged with local fixture callbacks.

Review notes and dispositions use localStorage in the Atlas browser origin. Nothing is automatically approved. Keep / Explore / Pass are review feedback, not authorization to promote a component.

## Verification performed

- TypeScript check passed: `../../node_modules/.bin/tsc --project tsconfig.json` from Atlas Three.
- Production build passed: `../../../../node_modules/.bin/vite build --config vite.config.mjs`.
- Desktop browser inspection confirmed aligned current/candidate frames, actual rounded reasoning disclosure, actual rich inline document preview, and the expanded artifact's conversation/reading-plane split.
- Enter expanded the actual reasoning disclosure and activated checklist navigation and permission actions.
- Actual Allow and Deny actions updated only their fixture; successful weather output and failed weather output both rendered.
- Actual voting incremented the isolated request counter. Actual document editing reached its save path in fixture memory. Closing and reopening the artifact restored the seeded document correctly.
- Review notes and disposition survived reload; QA-only notes were removed and disposition reset. No specimens were approved.
- Narrow Studio at a measured 390px viewport stacked comparisons and moved navigation above the studies without horizontal overflow. Expanded artifact inspection at a measured 312px viewport showed the mobile reading plane and toolbar.
- Demo and Approved spacing tabs remained accessible with their original controls. The approved `study.css` SHA-1 remained `b3303fe1a23de226a784073a4dc89c560e964935`.

## Limits and remaining review work

- Live visual parity with the saved staging conversation is **unverified**. The available staging browser session reports “This chat belongs to another user.” No authorization was bypassed. Source fidelity and rendered fixture appearance were checked; exact live-conversation comparison remains outstanding.
- Not every state/action combination was exhaustively exercised. The checks above are targeted smoke tests, not a claim of full application coverage.
- Actual and candidate fixtures can contain different copy and content lengths. Candidate rendering preserves existing experiments; a state with no matching candidate snapshot is labeled explicitly. Running candidate animations may reach their terminal display while still viewed under the selected lifecycle state.
- Generic tool coverage, questionnaire wiring, citations/web previews, delegation, unread markers, and recovery gaps are documented per study. A missing integration is not replaced by an invented staging equivalent.
- The iframe has its own viewport and scroll context. Use full-size links for expanded artifacts and final layout inspection. Real provider latency, uploads, persistence, and authenticated backend workflows are intentionally not simulated as production guarantees.

## Files changed for this correction

All paths below are relative to `packages/ui/scratch/atlas-3-spacing/`:

- `main.tsx`, `README.md`
- `vite.config.mjs`, `tsconfig.json`, `specimen.html`
- `chat-ui-lab/ChatUILab.tsx` — provenance copy only; experiments preserved
- `studio/catalog.ts`, `studio/Studio.tsx`, `studio/studio.css`
- `studio/context-adapter.tsx`, `studio/fixture-network.ts`, `studio/entry.ts`
- `studio/actual-frame.tsx`, `studio/candidate-frame.tsx`, `studio/frame.css`
- `studio/QA.md`

Generated build output remains local/ignored. No dependencies were installed.
