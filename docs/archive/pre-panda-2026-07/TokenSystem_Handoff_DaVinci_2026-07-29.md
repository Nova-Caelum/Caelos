# Caelos Console — 3×3 Token System Handoff

> **From:** Da Vinci (Nova Caelum visual-sprint orchestrator), Daniel Eghdami session, 2026-07-29
> **Purpose:** Compress the decisions and reasoning trail from this session into a single doc so a fresh Claude instance can pick up the token-system work without rebuilding the context.
> **Companion doc:** `UI_ErrorCorrection_Notes.md` (same folder — session log of Daniel-driven visual corrections).
> **State at write time:** commit `bab5682` on branch `fix/pnpm-lockfile-2026-07-28`, plus uncommitted work landed after (light-rig rebuild, drawer header rebalance, module drawer folder-chip removal, project header rhythm unify).

---

## 1. Frame — what "3×3" means

Daniel's directive at session close: **collapse the token system to 3×3 for Nova Caelum.** Three tiers of text color, three tiers of button emphasis. Semantic variants (destructive, warning, etc.) are orthogonal to the tier system, not additional tiers.

Why this shape:
- Linear/Material-derived 4-tier systems (primary/secondary/tertiary/quaternary text; filled/tonal/outlined/ghost buttons) are the *industry-general* answer. They're correct at scale.
- Nova Caelum is smaller-surface than Linear/Vercel. A 4-tier system on Caelos-scope creates decision fatigue ("is this button *outlined* or *ghost*?") without the payoff of finer hierarchical distinctions.
- 3 is the smallest number that produces a genuine ladder. Below 3 you can't express hierarchy; above 3 the marginal information per tier drops off fast for a system of Caelos's size.
- Session precedent for Nova Caelum's preference: NC currently defines four text tokens (`cream / textMuted / textDim / textFaint`) but uses only two meaningfully in practice (cream + stone). A 3×3 system with strict usage rules will get further than 4×4 with lax rules.

---

## 2. Text tokens — 3 tiers

### The tiers

| Tier | Role | Suggested NC token mapping | Where it lives |
|---|---|---|---|
| **Primary** | Content that matters — the reason the user is on this screen | `NC.cream` = `#F4EAD5` | Page/drawer titles, task/module titles, description body text, task-row primary text, form input values |
| **Secondary** | Meaningful support text — you should see it but not before primary | `NC.textMuted` = `#9089A0` | Assignee values, "In Progress" status text on light backgrounds, active-item highlights, subtitles |
| **Tertiary** | Chrome — you should be able to find it, not compete with content | `NC.textDim` = `#6E677E` | Section labels (ASSIGNEE, DESCRIPTION, SUBTASKS), breadcrumbs, sidebar items, tabs, folder-path chips, kicker labels (PROJECT, TASK, MODULE) |

### What happens to `NC.textFaint` (`#55506A`)

Not a tier. Becomes a **semantic modifier**: placeholder text, disabled state. Any tier can use `textFaint` when the element is in a disabled/placeholder state. Do not use as a fourth tier of active content.

### Usage rules (enforce during audit)

- **Chrome doesn't earn primary.** Sidebar labels, nav, breadcrumbs, kicker labels, tabs — all tertiary. If any of these are at `NC.cream`, they're wrong.
- **Value text is primary or secondary, never tertiary.** The actual value of an input field, a task title, a description body — those are what the user came to read. Primary if it's the point of the screen; secondary if it's supporting.
- **Section labels are tertiary.** "ASSIGNEE", "DESCRIPTION", "SUBTASKS", "RELATED DOCS", "BLOCKED BY" — all labels-for-values, all tertiary. Currently many are at `NC.stone` (which maps between secondary and tertiary). Move to tertiary.
- **Status pills carry the semantic color** (blocked=maroon, in-progress=peach-gold, done=sea-green). Not part of the text-tier system.

### Current state (as of this session close)

Most of the app is running at 2 tiers — `NC.cream` (primary) for basically everything visible, and `NC.stone` (roughly tier-2/tier-3) for labels. The 3-tier reshuffle is essentially a **usage audit**, not a token-definition change. The tokens already exist in [App.tsx:741-770](src/app/App.tsx) and [theme.css](src/styles/theme.css).

The reshuffle scope: probably 20-30 targeted edits in App.tsx replacing `NC.cream` → `NC.textDim` on chrome surfaces, plus a handful of `NC.stone` → `NC.textDim` on section labels for consistency.

---

## 3. Button tokens — 3 tiers

### The tiers

| Tier | Treatment | Existing NC token | Use case |
|---|---|---|---|
| **Primary (Filled)** | Solid accent bg, cream text, subtle rim | `NC.accent` (`#6D5AD1`) | THE commit action on a surface. Rare — one per drawer/modal max. Save changes, Create task, Confirm |
| **Secondary (Tonal)** | Accent-tinted bg (~10% accent), accent-tinted text, faint border | `NC.accentTint` (`rgba(109,90,209,0.10)`) + `NC.accentCream` (`rgba(196,185,240,0.90)`) | Meaningful secondary action. Add to Cycle, Add task, + buttons for subtasks/docs/blockers |
| **Tertiary (Text)** | Transparent bg, accent-tinted text, no border, subtle hover fill | `NC.accentCream` on hover fill `rgba(255,255,255,0.05)` | Cancel, Close, dismiss, inline links, any "escape hatch" action |

### Semantic modifier: destructive

Orthogonal to tier. Any tier can have a destructive variant that swaps hue from accent to `#C25B62` (deep maroon). Currently `GhostBtn` has a `danger` prop that does this. Preserve the pattern.

Recommended destructive-tier defaults:
- Destructive Primary (Filled): rare — hard delete confirmation modal
- Destructive Secondary (Tonal): Archive, Remove (most destructive actions in-app)
- Destructive Tertiary (Text): dismiss a destructive confirm

### Current state and gap

The app currently has two button components:
- `PrimaryBtn` — [App.tsx:853](src/app/App.tsx) — filled with `NC.accent`. Matches Primary tier.
- `GhostBtn` — [App.tsx:862](src/app/App.tsx) — currently uses `NC.stone` text on a barely-visible white/9 border. **Falls between tiers 2 and 3 in noise level but reads dead** because it's neutral-toned instead of accent-tinted. Daniel flagged 2026-07-29: *"the ghost button is too invisible."*

Gap: no Secondary (Tonal) tier exists. Actions that should be Tonal (Add to Cycle, + buttons) currently use PrimaryBtn — which is why the app feels like the accent is on every surface (accent frequency too high).

### Component-implementation sketch (for the fresh instance to build)

```tsx
// PrimaryBtn — already exists at App.tsx:853, keep as-is
function PrimaryBtn(props) { ... }

// NEW — TonalBtn
function TonalBtn({ children, danger, className = "", ...props }) {
  const hue = danger ? "rgba(194,91,98,0.10)" : "var(--nc-accent-tint)";
  const text = danger ? "#C25B62" : "var(--nc-accent-cream)";
  const border = danger ? "rgba(194,91,98,0.22)" : "var(--nc-accent-line)";
  return (
    <button
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:brightness-110 ${className}`}
      style={{ background: hue, color: text, border: `1px solid ${border}` }}
      {...props}
    >
      {children}
    </button>
  );
}

// REPLACE GhostBtn with TextBtn (or keep as alias)
function TextBtn({ children, danger, className = "", ...props }) {
  const text = danger ? "#C25B62" : "var(--nc-accent-cream)";
  return (
    <button
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/[0.05] ${className}`}
      style={{ color: text, background: "transparent" }}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Migration pass — what each existing call site becomes

Grep the app for `PrimaryBtn` and `GhostBtn`. Suggested tier assignments:

| Current call site | Suggested tier | Rationale |
|---|---|---|
| Save changes (task drawer, module drawer, cycle picker) | **Primary** | Commit action |
| Create task (cycle picker "Create") | **Primary** | Commit action |
| Add to cycle button (module drawer) | **Tonal** | Meaningful secondary CTA |
| Add task button (module drawer TASKS section) | **Tonal** | Frequent low-stakes add |
| + Subtask button (task drawer) | **Tonal** | Frequent low-stakes add |
| + Doc button (task drawer) | **Tonal** | Frequent low-stakes add |
| + Add blocker button (task drawer) | **Tonal** | Frequent low-stakes add |
| Cancel (all modals) | **Tertiary (Text)** | Escape action |
| Archive (module drawer, ConfirmDelete modal) | **Tonal + destructive** | Destructive secondary action |
| Modal close X button | keep as-is (icon-only) | Not part of button ladder |

Expected effect: accent-color footprint on-screen drops by ~50-70%. Primary CTA remains visible as THE action; other CTAs move to tonal (accent-tinted but not filled), keeping the color language without oppressing the frame.

### DesignLab sandbox

The button ladder should be prototyped in `src/app/DesignLab.tsx` (already scaffolded — access via `http://localhost:5173?lab=1`). Build all three tiers side-by-side, prove the visual hierarchy, then migrate call sites in `App.tsx`.

---

## 4. Context the fresh instance needs

### The visual-substrate conversation still open

This token system sits on top of an unresolved substrate question. Summary:

- **Caelos baseline is `#1C1B28`** — warm plum, ~11% luminance
- **Reference dark-UIs Daniel admires** (Linear, HeroUI, Vercel) sit at ~4-5% luminance, neutral (not tinted)
- **Every visual technique for "aliveness"** (light-rig, rim lighting, elevation contrast, chromatic accent restraint) works multiplicatively on baseline signal. At 11% luminance the ceiling on how "alive" the UI can look is roughly 1/3 of what the reference achieves.
- **Two paths** (from the session):
  - **Path A** — keep warm-plum baseline. Ceiling: "polished dark UI with brand tint." Notion, older Slack.
  - **Path B** — shift baseline to `~#0f1017` neutral near-black. Ceiling: "alive material surface." Linear, Vercel, Radix.
- **Decision pending.** Daniel is aware of the trade-off. The token system work should proceed regardless of path — 3×3 tiering is baseline-independent.

### The rhythm-pass state

Vertical rhythm across drawers and project header is unified at 24px between landmarks; kicker→title tightly at 10-12px. This session's edits landed:
- SlideOver header: `px-6 pt-6 pb-4` (was `py-4`)
- SlideOver body: `px-6 pt-2 pb-6` (was `py-5`)
- Drawer kicker (TASK/MODULE label): `mt-1` added (16px gap breadcrumb→kicker instead of 12px)
- Project card header: `mb-2.5` on kicker (10px to title), `mt-4` on description and folder-path (16px each)

The 3-tier text system should NOT re-open these spacing decisions.

### The light-rig / ambient depth state

`body` background in [theme.css:422-435](src/styles/theme.css) uses:
- SVG grain layer (1.8% white, 140px tile)
- 4 small neutral-white radial blooms at asymmetric positions (was 2 large colored corner blooms — replaced 2026-07-29 because indigo overlay was chromatically shifting entire canvas toward purple)

Ground now reads neutral, not tinted. Do not re-introduce colored overlays here without discussion.

### The `.nc-lit-surface` treatment

Used on Modal + SlideOver — inset top highlight + vertical fill gradient + ambient drop shadow. Gives large panels physical presence. Do not remove; extend to other large surfaces (project cards? task rows on hover?) if it makes sense.

---

## 5. How to get up to speed (fresh instance start-here)

**1. Read this doc in full.** Then:

**2. Look at what the app looks like right now.**
```bash
lsof -i :5173  # confirm vite is running
```
If not running: `cd /Users/danieleghdami/NovaCaelum_code/Caelos-console && pnpm dev` (or `npm run dev`).
Then navigate the in-app Playwright browser to `http://localhost:5173`.
Also try `http://localhost:5173?lab=1` for the DesignLab sandbox.

**3. Read the session log companion.**
- `UI_ErrorCorrection_Notes.md` (same folder) — every Daniel-driven correction from the polish session with the why and the how

**4. Read the Linear reference notes (the design-vocabulary source).**
- `/Users/danieleghdami/NovaCaelum_Obs/AgentSecretBase/research/LinearUI-success/02-color-system.md` — 3-token LCH system, one-accent principle, semantic palette
- `/Users/danieleghdami/NovaCaelum_Obs/AgentSecretBase/research/LinearUI-success/05-hierarchy-and-layout.md` — 4 text tiers, elevation, chrome-vs-content restraint
- `/Users/danieleghdami/NovaCaelum_Obs/AgentSecretBase/research/LinearUI-success/03-spacing-and-density.md` — 4/8-grid discipline
- `/Users/danieleghdami/NovaCaelum_Obs/AgentSecretBase/research/LinearUI-success/CHEATSHEET.md` — compact reference

**5. Read the current token definitions.**
- [src/app/App.tsx:739-780](src/app/App.tsx) — the `NC` constant with every color token
- [src/styles/theme.css](src/styles/theme.css) — CSS custom properties (`--nc-text-*`, `--nc-hair-*`, `--nc-accent-*`, `--nc-input-*`)
- [src/app/App.tsx:853-870](src/app/App.tsx) — `PrimaryBtn` and `GhostBtn` current implementations

**6. Search worklog for prior context.**
```
mcp__nova-caelum-ops__search_worklog with project="taskgraph-ui-fixes" or tags=["caelos-console"]
```

**7. See what's committed vs. pending.**
```bash
cd /Users/danieleghdami/NovaCaelum_code/Caelos-console && git log --oneline -20 && git status
```
Look for commit `bab5682` — the session close before this handoff — and everything since.

**8. Read Daniel's persona layer (for personalization).**
- `/Users/danieleghdami/NovaCaelum_Obs/AgentSecretBase/_agentOS/core_text/daniel.md`
- Note the energy-state framework (`sharp` / `steady` / drained). Daniel operated in `steady` / `sharp` mode this session.

---

## 6. Open items (queue for next session)

Ordered by ease → depth:

1. **Ghost button legibility floor** — even if you don't ship the full 3-tier ladder immediately, at minimum swap `GhostBtn`'s text color from `NC.stone` → `NC.cream` OR `--nc-text-muted`. Current state is below WCAG AA legibility.
2. **Build the 3-tier button ladder** in `DesignLab.tsx` — prove the visual hierarchy side-by-side before migrating call sites.
3. **Migrate call sites** per §3's tier-assignment table.
4. **Text-tier usage audit** — reshuffle `NC.cream` → `NC.textDim` on chrome surfaces per §2's usage rules. Grep-driven pass through `App.tsx`.
5. **Move-to-project picker** — the `FolderInput` button in task/module drawers is positioned correctly but has a `console.log` stub for its onClick. Needs a picker component + `onMove` handler + Supabase mutation. Da Vinci flagged as a small self-contained unit (~30-60min).
6. **Substrate baseline decision** — Path A vs Path B (see §4). Requires Daniel-call before implementation.

---

## 7. Non-negotiable rules for the fresh instance

- **Do NOT restructure the header rhythm** established in this session (drawer padding, kicker gaps, project card 10/16/16). Daniel iterated on those explicitly.
- **Do NOT reintroduce colored radial blooms** on the body background. The neutral light-rig is intentional.
- **Do NOT remove `.nc-lit-surface`** from Modal or SlideOver — it's load-bearing for the "surface has presence" read.
- **Do NOT touch `theme.css` `:focus-visible` outline** without checking whether `.nc-input` overrides still apply — that global rule was the root cause of a sharp-outline bug we fixed by scoping input focus treatment via `.nc-input`.
- **Always screenshot-verify** color/spacing changes via Playwright MCP against `localhost:5173`. Da Vinci discipline M2 (dual verdict: substrate + calibration). Confirming a file exists is not judging — you must multimodal Read the PNG.
- **When in doubt on a button-tier assignment, prefer LOWER emphasis.** The current app over-uses PrimaryBtn; the reshuffle direction is toward fewer filled buttons, not more.

---

## 8. Provenance

- Session: Da Vinci main-thread, cli-mac, 2026-07-29
- Prior committed state anchor: `bab5682` on `fix/pnpm-lockfile-2026-07-28`
- Uncommitted work landed after `bab5682` and covered by this doc: neutral light-rig replacement (theme.css), module drawer folder-chip removal + progress-bar move (App.tsx), SlideOver header/body padding rebalance (App.tsx), drawer kicker `mt-1` bump (App.tsx), project card `mb-2.5`/`mt-4` unification (App.tsx)
- Worklog entries: search project=`taskgraph-ui-fixes`
- Related brand docs: `/Users/danieleghdami/NovaCaelum_Obs/AgentSecretBase/_wiki/novacaelum_brand/`
