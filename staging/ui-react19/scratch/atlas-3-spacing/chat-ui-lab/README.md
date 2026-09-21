# Chat UI Lab

Open **http://127.0.0.1:5187/?tab=chat-ui-lab** in the existing Atlas Three preview. This is a local simulation harness with explicitly requested candidate experiments, not a live AI chat. Current preserves the existing baseline; Candidate adapts the five supplied references using built Caelos primitives.

## Use

- **States:** side-by-side lifecycle snapshots for the selected scenario, omitting states that do not apply. Static previews suppress motion.
- **Playback:** play, pause, replay, scrub in 100ms steps, or jump to labeled fixture events. The external panel sets speed and reduced-motion preview.
- **Conversation:** use the real shared composer, messages, tools and artifacts together. Enter sends; Shift+Enter inserts a newline. Stop interrupts the simulated response; recovery resumes the fixture.
- **Run scenario:** fills the composer, then activates its actual Send button after React commits the draft. The normal composer callback starts the fixture. Freely typed messages follow the selected scenario too.
- **Compare:** Current, Candidate or Side-by-side. Both panes share one clock, draft, scenario, decisions, unread boundary and composer settings. Narrow comparison surfaces stack vertically. Disclosure interaction and reading position remain local to each pane.
- **Inspect:** try the 320/390/560px surface presets, both themes, long agent names, overlapping tools, scroll-away/Jump to latest, and the expanded document dialog. Its body scrolls, Escape closes it and focus returns to the opener.
- **Reset lab:** clears in-memory fixture state and composer data only. No production chat store, browser persistence, upload service, microphone or backend is connected.

Fifteen presets cover text completion; thinking/tool/result/response; artifact creation/preview/expanded document; upload success; upload failure/retry; delegation; interruption/recovery; empty conversation; long-content/multiple-speaker/large-document/overlapping-tool stress cases; tool permission; user question; unread messages; inline citations; a local web preview; and a two-question questionnaire. The empty fixture intentionally keeps the transcript empty even after a composer send.

- **Tool permission:** pauses at the request. Allow runs the simulated tool; Deny skips it and changes the response. Review permission opens the existing shared dialog, with the same actions. Escape closes the popup without deciding.
- **User question:** pauses for an option or a free-text answer, with an explicit Skip action. Blank answers cannot submit. Choosing an option fills the answer field; Submit answer resumes the fixture.
- **Decision replay:** the recorded answer or permission branch is applied at the same virtual time on Replay. Run scenario and a new composer send ask again. Scrubbing cannot bypass an unanswered request or overwrite a recorded decision.
- **Unread messages:** starts with the reader in earlier content. Timed arrivals add a divider before the first unread message and a count on Jump to latest. Jump or scrolling to the bottom marks the messages read in both comparison panes. Seeking/replay restores the initial unread boundary; States shows no-unread, one-unread and multiple-unread examples.

The existing composer's model, reasoning, format, goal, instruction, agent and add controls remain available. Model/voice choices are recorded as simulation preferences. Add File attaches local metadata, and Dictate inserts the fixture prompt with an explicit simulation notice. These controls do not invoke external services. The last normal composer payload is inspectable in the external panel.

## Boundaries and files

Everything below is local to Atlas Three. Do not import it into production or promote a candidate without a separate request.

| File | Responsibility |
| --- | --- |
| `../main.tsx` | Adds the lab tab and keeps the original spacing reference mounted. |
| `../README.md` | Links to the lab. |
| `ChatUILab.tsx` | External controls, shared deterministic clock, actual Composer host, comparison and expanded-document host. |
| `fixtures.ts` | Immutable scenario definitions and pure time/lifecycle selectors. |
| `Baseline.tsx` | Existing shared primitives composed into fixture messages, tool/attachment/artifact/delegation specimens and scrollable conversation. |
| `InteractionCard.tsx` | Lab-only approval, user-question and unread-marker compositions using shared controls, surfaces and Dialog. |
| `Candidate.tsx` | Lab-only citations, unified work steps, deterministic word reveal, local web preview, questionnaire and permission code block. |
| `lab.css` | Lab host and candidate layout, with no shared component interior or token overrides. |
| `verify.mjs` | Baseline browser interaction and isolation checks using already installed Playwright. |
| `verify-candidates.mjs` | Candidate interactions, word timing, focus, navigation, themes and narrow-layout checks. |
| `README.md` | Usage, implementation boundaries and verification record. |

The baseline imports `AgentMessage`, `Composer`, `Surface`, `Disclosure`, `Progress`, `ScrollArea`, `Dialog`, spacing primitives and controls from the existing `packages/ui/dist`. There is no exported standalone tool/artifact/UserQuestion component in that build; lab-only wrappers compose these primitives rather than importing backend-coupled production chat wrappers. Production's weather-tool Allow/Deny actions are backend-bound; the lab's permission flow uses local decisions only. The unread divider is also a local specimen. This does not claim full production chat-shell parity.

Atlas Two, Foundry, shared UI source/build, Panda tokens, the production composer and `study.css` are outside this task's edit boundary. No dependencies were installed. Generated `dist` and `evidence` remain ignored local outputs.

## Reproduce

From `/Users/danieleghdami/NovaCaelum_code/caelos-chat-react19` using existing dependencies:

```sh
packages/ui/node_modules/.bin/tsc --project packages/ui/scratch/atlas-3-spacing/tsconfig.json
node_modules/.bin/vite build --config packages/ui/scratch/atlas-3-spacing/vite.config.mjs
node_modules/.bin/vite preview --config packages/ui/scratch/atlas-3-spacing/vite.config.mjs
```

Reuse the existing preview if port 5187 is occupied by this study. The preview serves the build, so rebuild after source changes. In another terminal:

```sh
node packages/ui/scratch/atlas-3-spacing/chat-ui-lab/verify.mjs
node packages/ui/scratch/atlas-3-spacing/chat-ui-lab/verify-candidates.mjs
```

The macOS shell sandbox may block Chromium startup; the verification run needs browser-launch permission in that environment. It does not install a browser. `ATLAS_THREE_URL` can override the local preview address.

## Verification, 2026-09-19

TypeScript and Vite build passed; all 85 baseline browser checks and 46 candidate browser checks passed. Browser verification covers normal composer send/focus/keyboard behavior; composer settings and metadata controls; pause/replay/scrub/rate/reduced motion; synchronized comparison; scenario completions; applicable states; interruption and retry; tool disclosure determinism; permission gating/Allow/Deny/popup focus/branch replay; option/free-text/skip question responses; timed unread arrivals, divider placement, counts and read-boundary reset; scroll-away and return; dialog focus trap/return/body scrolling; narrow surfaces and a 390px browser; unchanged browser storage on reset; and retained spacing draft/default density across tab changes.

The browser checks record no runtime page errors and only local static GET requests, with no fetch/XHR/WebSocket backend activity. SHA-256 comparisons against pre-task files confirmed the spacing stylesheet, shared UI JavaScript/CSS and both composer source files were unchanged.

Candidate checks cover reversible word reveal and reduced motion; unified tool overlap, stopping and recovery; citation hover/keyboard/focus return; sandboxed preview navigation, reload, console and expanded-dialog focus; questionnaire validation, navigation, submission focus, replay and reset; permission request details; both themes at 320px and a 390px browser. Candidate screenshots and `verification.json` live in `../evidence/chat-ui-lab/candidates/`.

Local baseline evidence lives in `../evidence/chat-ui-lab/`: `verification.json`, `comparison.png`, `narrow-stress.png`, `narrow-light.png`, `states.png`, `expanded-document.png`, `permission-dialog.png`, `narrow-question.png`, and `unread-comparison.png`. Screenshots are sampled visual checks, not a new approved design baseline. This is not a screen-reader audit, a live upload/voice/backend test, or approval to promote candidates into production.

## Candidate references and intentional adaptations

These are lab-owned adaptations of the supplied interaction patterns, not installed registry files. No package manifest, lockfile or shared UI source changed. The existing controls satisfy the experiments without additional dependencies.

- [Prompt Kit Source](https://www.prompt-kit.com/docs/source), inspected through its [source registry](https://prompt-kit.com/c/source.json): inline numbered citations with title, URL and description. A shared Caelos Popover supports hover, click, Enter and Escape. Sources are labeled fixtures and do not navigate to pretend documents or request favicons.
- [AI Elements Web Preview](https://elements.ai-sdk.dev/components/web-preview): navigation, reload, console disclosure and expanded preview. Two trusted local `srcDoc` pages run in an iframe with no script or network capability; the coordinate is read-only. This deliberately does not browse arbitrary sites. Preview navigation is local exploration; Run, Replay and Reset restore the initial page.
- [AI Elements Chain of Thought](https://elements.ai-sdk.dev/components/chain-of-thought): one collapsible work log combines scripted thinking summaries and tool steps from the same agent. Each step keeps its status and result, including overlapping tools. These are authored activity summaries, not a live model's private reasoning.
- [Aceternity Typewriter Effect](https://ui.aceternity.com/components/typewriter-effect): Candidate reveals words on the lab clock while Current shows the original fixture chunks. Pause, seek and replay are deterministic; already revealed chunks persist. Reduced motion and static snapshots show the full current chunk. There are no independent animation timers or Motion dependencies.
- [shadcn Questionnaire](https://ui.shadcn.com/docs/components/base/questionnaire): a required priority with choices or custom text, followed by optional context. Previous/Next retain edits, navigation focuses the new prompt, submission records a single branch, and replay keeps that branch. The separate permission candidate exposes concrete tool arguments above the existing Allow/Deny controls and inside their shared dialog.

Choose the corresponding scenario in the external panel, then **Candidate** or **Side-by-side**. Text uses the typewriter candidate; Thinking → tool and Stress use the unified work log. The existing single-question scenario remains available alongside the new questionnaire.

Dominant voice: operational working copy and controls in IBM Plex Sans. URLs and code use structural IBM Plex Mono. State is semantic; no new palette or token definitions. The unchanged Current layout remains the reference, including its existing spacing and composer.
