# Caelos

Caelos is a console for commanding a fleet of AI agents, from Nova Caelum & Co.

*Pronounced KAL-ohs. See it running at [task.novacaelum.com](https://task.novacaelum.com) — access is invite-only during the current pre-1.0 phase.*

---

## What Caelos is not

Caelos does not replace individual agent runtimes — Claude Code, Codex, or custom Anthropic Agent SDK harnesses. It sits above them, as the shared operator surface that a fleet composed of any of those runtimes reports into. It is also not a chatbot, a no-code builder, or a consumer AI wrapper — the fleet is the product; the console is where you command it.

Creator Note: This is an actively developing project, and it is built specifically for a personal system and has not been tailored for wider system use. We encourage branching and contribution and feedback.

---

## See it in action

The Task Graph facet has been live at [task.novacaelum.com](https://task.novacaelum.com) since 2026-07-26, running on the current substrate (Vite + React + shadcn, backed by a FastAPI + Supabase stack on Railway). Access is gated by Cloudflare Access during pre-1.0 — email daniel@novacaelum.com for an invite.

A public demo, a self-host path, and a hosted-tier signup will land alongside the cockpit + file editor + fleet manager fusion. See [Status](#status) for the current shipping cadence.

---

## Why Caelos

- **One console for the whole fleet.** Task graph, cockpit chat, file editor, and fleet controls share a single surface — operators do not context-switch between orchestration tooling and the agents that execute the work.
- **Runtime-agnostic.** Composes with Claude Code, Codex, and custom Agent SDK harnesses. Individual agent processes are pluggable; the console is the constant.
- **Persistent task graph as first-class state.** Projects, initiatives, cycles, modules, work items, and subtasks are structured entities in a Postgres substrate — retained across agent restarts, not derived from chat scrollback.
- **Deterministic audit trail.** Every task state change, agent hand-off, and worklog write persists to an append-only log. Replay of a completed cycle reads the same on the tenth review as on the first.
- **Multi-operator by design.** Built for a team surface, not a single-user IDE extension. Role-based access and per-agent scoping are architectural, not feature-flagged.

---

## How it works

Caelos is a three-layer system.

**The console** is a React + TypeScript single-page application (Vite build, shadcn + Radix component substrate, IBM Plex typography). It renders the task graph, chat surface, file editor, and fleet controls as coordinated views over a shared state store — not as independent tabs.

**The substrate** is a FastAPI service (deployed on Railway) that exposes the console's operations as both a REST surface (16 endpoints, human-callable) and a Model Context Protocol server (37 tools, agent-callable). Agents inside the fleet read and write to the same substrate the console does — the surface a human uses and the surface an agent uses are the same substrate under different transports.

**The persistence layer** is Supabase Postgres. Tasks, worklog entries, and agent session records live there. Nova Caelum operates its own instance; self-hosters bring their own.

Model access flows through the Anthropic Agent SDK. Agent processes are launched externally (Claude Code sessions, Codex CLI, custom harnesses) and report progress back through the MCP surface — Caelos does not embed a model, and does not attempt to.

---

## Status

**Current release:** pre-alpha. The fusion repo (this repo) is being populated from the Task Graph substrate and the cockpit substrate; expect the tree to change substantially through v0.x.

### Shipped

| Facet | State | Notes |
|---|---|---|
| **Task Graph** | ✅ Live | Running at [task.novacaelum.com](https://task.novacaelum.com) since 2026-07-26. Projects, initiatives, cycles, modules, work items, subtasks, and cross-entity linking are all end-to-end functional. React + Vite + shadcn frontend, FastAPI backend on Railway, Supabase persistence. This is the facet you can see today. |
| **Backend substrate** | ✅ Live | 37 MCP tools + 16 REST endpoints, deployed on Railway as `nova-caelum-ops`. Serves both the console and the agent fleet. |
| **Worklog + task queue** | ✅ Live | Cross-agent persistence for session summaries, decisions, and per-agent task queues. Consumed by every Nova Caelum agent persona. |

### Under development

| Facet | State | Notes |
|---|---|---|
| **Cockpit chat** | 🟡 In build | Command surface for the fleet — liquid-glass shell, plasma core aesthetic. Substrate exists privately; cherry-pick into this repo is in flight. |
| **File editor** | 🟡 In build | In-console browser and editor for the fleet's working files. Depends on cockpit substrate. |
| **Fleet manager** | 🟡 In build | Spawn, monitor, terminate, and coordinate agent processes from inside the console. |
| **Fusion** | 🟡 In flight | Surgical cherry-picks from the cockpit substrate into this repo, then unified builds. Track progress in the repo commit history. |
| **Public demo path** | 🟡 Pending | Task Graph will move from Cloudflare-Access invite-only to a public demo tier once the fusion lands a shared auth model. |

### Not planned

- **Consumer or no-code builder tier.** Caelos is infrastructure for operators, not a low-code product. The console assumes technical fluency and a real agent fleet on the other side of it.
- **Model marketplace or third-party runtime plugins.** Runtime integrations flow exclusively through the Anthropic Agent SDK for the foreseeable term; the composition surface is the SDK, not a plugin registry.

---

## Naming and pronunciation

Caelos is pronounced **KAL-ohs** — matching the vowel of the parent brand, Nova Caelum (KAY-lum). Written references default to standalone (`Caelos`); attributed references use `Caelos, from Nova Caelum & Co.` (never `Nova Caelum Caelos` back-to-back). The `Cael-` prefix is the architectural constant for future Nova Caelum products in this family; anticipate `Cael-` siblings in the runtime, storage, and networking layers as the product line grows.

Verbal descriptor is *the Caelos console* — a deliberate register borrowed from the Sun Console, AWS Console, and Google Cloud Console lineage. Not *app*, not *interface*, not *dashboard*.

---

## Security, privacy, data handling

Caelos runs against your own persistence layer and does not phone home to Nova Caelum by default. This section describes exactly what the hosted deployment at [task.novacaelum.com](https://task.novacaelum.com) collects; a self-host deployment collects only what your own configuration directs.

### What Caelos collects

- **Task graph state** — projects, initiatives, cycles, modules, work items, subtasks, and the relationships between them, plus the descriptions and comments your operators write into them.
- **Worklog entries** — the append-only log of session summaries and per-decision records that agents write during their runs. Includes author (persona name), project, summary, optional long-form detail, tags, and timestamps.
- **Agent session metadata** — which persona ran, against which repo, in which surface (CLI, Desktop, cloud), for cost and coordination tracking.
- **Authentication state** — email address and Cloudflare Access identity for gated tenants. No passwords stored; auth flows through the identity provider.

### What Caelos does with it

- Persists all of the above to a Supabase Postgres instance (the hosted deployment uses Nova Caelum's own Supabase project; self-hosters point at their own).
- Emits optional downstream notifications: Telegram messages for escalations, webhook calls for external integrations. Both are configured per-deployment and off by default.
- **User data is never used to train models.** Anthropic, OpenAI, and other model providers reached via the Agent SDK operate under their own privacy terms — Caelos does not add a training-consent layer on top; the runtime call is between the agent process and the model provider.
- No advertising, no analytics resale, no third-party trackers embedded in the console.

### Opting out and self-hosting

The full self-host path (Cloudflare + Railway + Supabase, or a fully-in-your-VPC variant) will ship alongside v1.0. Until then, the hosted deployment is the only run-path and access is invite-only — request access from daniel@novacaelum.com if you need to evaluate before v1.0.

There is no telemetry emitted to Nova Caelum from the console itself. Session cost and duration are recorded per-tenant in your own persistence layer, not aggregated centrally.

---

## Documentation

- Product documentation: forthcoming at [docs.novacaelum.com](https://docs.novacaelum.com) alongside v1.0.
- API reference (REST + MCP): forthcoming; the MCP tool surface is currently discoverable via any Anthropic Agent SDK-compatible client pointed at `nova-caelum-ops-production.up.railway.app/mcp`.
- Changelog: [CHANGELOG.md](CHANGELOG.md) — populated once the fusion tree stabilizes.

---

## Contributing

Caelos is in pre-alpha and this repository is public for transparency, not for open contribution. External contributions are not open at this stage. If you have run a serious multi-agent workflow, hit the coordination wall, and want to compare notes on what a fleet console should look like, email daniel@novacaelum.com — a small number of design conversations are actively shaping v1.0.

---

## License

License selection is deferred until v1.0. See [LICENSE](LICENSE) for the pre-alpha terms (all rights reserved; permissive license planned for v1.0).

---

*Caelos, from Nova Caelum & Co. — an AI-native strategy and transformation firm building the operator's substrate for the agentic age.*

<!-- Caelos repo bootstrap verification test 2026-07-28: first PR after initial push; exercises DevOps-Lead PR-review workflow end-to-end on the new Caelos substrate. -->
