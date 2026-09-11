# UI Error-Correction Notes — Caelos Console

> **Session:** 2026-07-28 → 2026-07-29, Da Vinci + Daniel eyeballing loop, `/use-codex` orchestrator mode
> **Purpose:** Every Daniel-driven correction from the polish session, why it was made, exactly how it was fixed. Craft feedback loop capture.

---

## 1. Sidebar section-group has boxy edges (rest state)

- **Correction:** *"for the boxes that enclose the project, i hate the edges, tooo boxy. Can you completely remove the edges in the dropdown hidden rest state. However When the dropdown is activated there is the awesome gradient that i love, can you preserve that though?"*
- **Why:** rectangles reading as containers; edges felt too hard/boxy on the sidebar chrome.
- **How I fixed it:** in `src/styles/theme.css` `.nc-section-group` — removed `border-top: 1px solid var(--nc-hair)`; replaced the linear-gradient with a radial-vignette gradient (`radial-gradient(ellipse 68% 82% at 50% 18%, rgba(255,255,255,0.024) 0%, … transparent 92%)`) — fill preserved, perimeter faded to zero.

## 2. Radial-vignette v1 fill too weak

- **Correction:** implicit — my first attempt at (1) killed the edges but also made the "clickable button" fill essentially invisible; I flagged it and bumped intensity before Daniel saw the render.
- **Why:** Daniel had explicitly said the fill = button-feel = wanted to keep.
- **How I fixed it:** bumped alphas `0.024/0.012/0.004` → `0.055/0.028/0.010` and widened the ellipse `68%/82% at 50%/18%` → `92%/140% at 50%/28%` so the fill survives at the ~28px collapsed height while horizontal edges still fade.

## 3. Whole app feels flat, large elements lifeless

- **Correction:** *"The whole thing feels kind of flat. I think the small cards and buttons and markers are all great but the large elements - ground and large cards like the task pop up are still just pretty lifeless. any easy way to add something to that?"*
- **Why:** ground had no atmosphere; task popup / slide-over sat as flat rectangles on ground.
- **How I fixed it:** theme.css got `.nc-lit-surface` utility (vertical fill gradient + inset top highlight `rgba(255,255,255,0.085)` + ambient drop shadow `0 24px 56px + 0 2px 6px`); applied to Modal + SlideOver in App.tsx by adding the class and removing inline `background: NC.card`. Ground got SVG fractal-noise grain layer (~1.8% white, 140px tile, fixed-attachment) + boosted radials (indigo 10%→13%, sage 6%→8%, wider spread).

## 4. Local dev not showing data (no .env.local)

- **Correction:** *"so this 5175 local host screen does not have the projects and tasks and modules populated from the source of truth backend the way they were is the task graph previous one. Can you correct that?"*
- **Why:** Caelos-console had no `.env.local`, so Vite had no backend URL or bearer to reach Railway.
- **How I fixed it:** copied `.env.local` from `legacy_TaskManagerUI_polish/` via `/bin/cp` (never opened the file / never brought the token into context); restarted vite; CORS blocked on port 5174, so killed the orphan polish-vite on 5173, rebooted Caelos vite on 5173 which IS in the Railway backend's CORS allowlist.

## 5. Sidebar sections STILL boxy in hover state (annotated screenshot)

- **Correction:** *"There is a screenshot attached of the project and initiatives still having that box in the hover state. the edges are still very visible, and i don't like it. It may be too complicated, so just remove the box around the project and initiative entirely."*
- **Why:** the radial-vignette from (1)+(2) still read as boxy in hover; Daniel told me to drop the fill entirely rather than iterate further.
- **How I fixed it:** in theme.css `.nc-section-shelf` — removed the `background: rgba(255,255,255,0.006)` at rest and the `rgba(255,255,255,0.018)` on hover; removed the entire `.nc-section-group` background rule. Bare labels sit directly on sidebar chrome now, no fill in any state.

## 6. Nav-active vertical bar clipped the folder icon

- **Correction:** *"In the sidepanel when you click on a project, the vertical bar clips the folder icon and it does not look good."*
- **Why:** `.nc-nav-active` inset 2px shadow bar sits at button x=0; the folder icon also started at x=0 → 2px overlap.
- **How I fixed it:** in `src/app/App.tsx` added `pl-3` to the project nav button className (`pr-3 py-2` → `pl-3 pr-3 py-2`), giving the folder icon 12px left padding and the accent bar 10px clearance.

## 7. Row anatomy — DnD on wrong side, +Task in wrong position

- **Correction:** *"mirror the modules items to the task by moving the dnd marker to the right side, and moving the +task to just right of the module name, but the +Task stays invisible unless I am hovering on the module."*
- **Why:** DnD on left + +Task pinned far-right was inconsistent between tasks/modules and felt unbalanced.
- **How I fixed it:** Unit A codex delegation restructured `ModuleSection`: moved `GripVertical` from position 1 → LAST, `+Task` button from far-right → immediately after the name (still hover-only), `Layers` icon promoted to position 1.

## 8. My module state proposal was wrong (a/b/c)

- **Correction:** *"Neither. but the icon that already exists on the module can change color to match the state!"*
- **Why:** I proposed adding a new state-dot to modules (a/b/c options); Daniel rejected all three because the existing Layers icon could serve double duty (identity + state) via color.
- **How I fixed it:** Unit A prompt updated — Layers icon's `style={{ color: NC.green }}` swapped to `style={{ color: STATE_CFG[mod.state].color }}`; no new element added.

## 9. Priority badge on rows (unwanted)

- **Correction:** *"No priority on either"*
- **Why:** cluttering the row; not needed at glance-scan level.
- **How I fixed it:** Unit A removed `<PriBadge priority={task.priority} />` from `TaskRow` (kept the component definition since it's still used elsewhere).

## 10. Done-form was under-specified (my initial pass)

- **Correction:** *"add a new 'done' form for tasks and modules that are marked with the : if they are done: the text is greyed out and strikethrough"* — plus later refinement: *"deferred states should be grey but not strikethroughed, archived states should be hidden immedietly"*
- **Why:** done tasks should visibly de-emphasize but deferred (still-active work) shouldn't get the "complete" strikethrough treatment.
- **How I fixed it:** Unit A added conditional in TaskRow title span and ModuleSection name span: `state === 'done'` → `NC.textMuted` + `textDecoration: 'line-through'`; `state === 'deferred'` → `NC.textMuted` only; other states unchanged. Archived is filtered from the view (pre-existing) so no styling needed.

## 11. Task-list icons cramped against sidebar edge

- **Correction:** *"can we create a smidge more left side margin between icons and sidebar on that task list session? or indent the list a bit?"*
- **Why:** the Layers icons and task state-dots sat too close to the sidebar-to-main boundary; no breathing room.
- **How I fixed it:** in App.tsx — TaskRow `paddingLeft: \`${depth * 20 + 8}px\`` → `\`${depth * 20 + 16}px\``; ModuleSection `paddingLeft: 8` → `paddingLeft: 16`.

## 12. Duplicate titles in module/task slide-overs

- **Correction:** *"the module and task cards have duplicate titles. It's not good. We should change. How does a breadcrumb that replaces the upper title sound?"*
- **Why:** the item title appeared in the drawer header AND again in the body (module: MODULE eyebrow + big name; task: TITLE input) — visual noise.
- **How I fixed it:** Unit E — created `src/app/components/ui/breadcrumb.tsx` (Nova Caelum-styled inline breadcrumb, adapted from einui/glass-breadcrumb pattern to our tokens); widened `SlideOver`'s `title` prop from `string` → `React.ReactNode`; both `TaskDetailSlideOver` and `ModuleDetailSlideOver` pass a breadcrumb JSX tree as title with `Project > [Module >] Title` format; added a `FolderInput`-icon button right of the breadcrumb for move-to-project (UI shell only, `console.log` placeholder onClick); removed the duplicate module-name h2 from module body; kept the task TITLE input (edit surface, semantically distinct from nav breadcrumb).

## 13. Hard border-t / border-b lines everywhere reading boxy

- **Correction:** *"Use this seperator instead of the hard edge to edge lines you use to make seperation. It makes the whole thing look so boxy, and it should make things look much much cleaner to not have so many of them."*
- **Why:** hairline borders proliferated across the app (per-task-row hairlines, module dividers, toolbar bottoms, panel splits, tab strips) — collectively read boxy and cluttered.
- **How I fixed it:** dispatched sonnet subagent for full-app audit (27 hits found, report at `AgentSecretBase/workspace/_artifacts/SeparatorAudit_sonnet-sub_2026-07-28.md`) → arbitrated the 3 judgment calls → installed einui's `@einui/glass-separator` (manually, via WebFetch + Write because shadcn CLI was blocked by a phantom monorepo config) → Unit A folded in the 2 row-level borderBottom deletes → Unit D executed 15 more deletes + 5 replacements producing 9 rendered `<GlassSeparator />` instances app-wide. Baseline dropped from 22 → 3 `border-t/border-b` references (delta −19); the 3 remaining are protected active-tab underlines + spinner rings.

## 14. Over-use of the accent color (single-color everywhere)

- **Correction:** *"i have attached an annotated screenshot that has buttons, highlights, and text circled. They are all the same color. That color you are using you are using entirely and wholly too much. Are we only allowed to use one color for all buttons text and highlight?"*
- **Why:** Nova Caelum Indigo `#6D5AD1` was showing up on the `PROJECT` eyebrow, tab underlines, `+Task` button, other buttons — monotonous and mis-cast per the brand-ui SKILL.
- **How I fixed it:** audited `nova-caelum-brand-ui/SKILL.md` — confirmed SKILL prescribes accent ONLY for primary CTAs + active-state identity; ghost secondaries + Section-label roles use muted. Unit C swept 4 sites: `PROJECT` eyebrow → `NC.textMuted`; `Manage in Team tab →` link → `NC.textMuted`; both `Unarchive` buttons → `NC.textMuted`. Protected sites (active-nav `FolderOpen`, tab active underline, primary CTAs, focus rings, token definitions, semantic state colors) all untouched. Inline `NC.accent` count dropped 3 → 0. **Post-fork revert:** ProjectView eyebrow reset to `NC.accent` per correction #16 (Project stays accent per the entity-eyebrow color system Daniel locked after Unit C's original prompt was fired).

## 15. Inconsistency between project card header and drawer headers ("allergic to consistency")

- **Correction:** *"okay... idk why you're allergic to consistency between project module and task. I have attached a screenshot of what the top of the project card looks like."*
- **Why:** the project card has a rich 6-element header (eyebrow, title, state pill, external icon, description, structural coordinate) but my Unit E drawers just had a breadcrumb + move button + close — same conceptual thing (entity header) speaking different visual languages.
- **How I fixed it:** broke down the 6 elements + named the inconsistency + proposed options (A: drawers adopt the 6-element pattern, B: project card simplifies to breadcrumb) + recommended A. Daniel confirmed A + gave the exact 3-row spec + separately forked a session for the parallel D/C work while I stayed on the drawer restructure.

## 16. Drawer header restructure (Unit F 3-row hero mirror)

- **Correction:** exact spec — *"[Entity's project > '…'] [move icon] … [x close card] / [Module eyebrow in unique color] / [Module title (double-click editor)] [state pill (click for dropdown edit)] [activity item]"* (and analogous for tasks with 3-segment breadcrumb). Also: *"the state dropdown and priority dropdown can be removed from the task card that are currently there."*
- **Why:** achieve the consistency called out in #15 — drawers should mirror project-card hero pattern adapted for 480px width; body should shed elements now rendered inline on the new title-row.
- **How I fixed it:** Unit F codex delegation (`gpt-5.6-sol`, `xhigh` reasoning) — modified `SlideOver` to `items-start` alignment for multi-row title support; built `EditableTitleInline` helper (display span → double-click → autofocus input → save on Enter/blur, cancel on Escape); rewrote both drawer title props to a 3-row `<div className="flex flex-col gap-3">` containing (Row 1) breadcrumb-ending-in-"…" + FolderInput move-button (Row 2) per-entity eyebrow (Row 3) `EditableTitleInline` + inline `NcSelect` state pill + `ActivityButton` atom; stripped body of TITLE input + STATE dropdown + PRIORITY dropdown (task drawer); ensured module body big-name is absent (was removed by Unit E).

## 17. Entity-eyebrow colors all the same (Project=purple only)

- **Correction:** *"Module (in an accent color, they should not all be the same color. Project is the purple color so find a new color for module eyebrow and a unique color for the Task eyebrow)"*
- **Why:** entity type is important semantic information at header-glance; a single accent color for all three types (Project / Module / Task) collapses the distinction.
- **How I fixed it:** proposed a color triad from the Nova Caelum semantic palette that avoids state-color collisions and forms a coherent visual family — **Project = Accent Indigo `#6D5AD1`** (existing), **Module = Sage `#7A9E93`** (earthy container hue), **Task = Desaturated Violet `#8879A0`** (leaf-level unit, sits between accent and sage). Daniel confirmed. Wired inline in Unit F drawer headers (Task eyebrow at App.tsx L1396, Module eyebrow at L1684). Project eyebrow reverted to `NC.accent` inline post-fork (fork's Unit C had muted it under the pre-revision prompt).

## 18. Liquid-glass primitives not translating to Nova Caelum language

- **Correction:** *"you don't really have the 'how to translate these stock liquid glass elements into Nova Caelum liquid glass elements down. The right click card is perfect, but you havent quite figured out how to do much with it yet?"*
- **Why:** my adaptations of einui components (glass-separator, breadcrumb) were token-swap-lite — I substituted NC tokens for white/opacity values but didn't inherit the actual visual language that makes `.nc-glass-menu` (right-click context menu) read as genuine Nova Caelum. The right-click card was the one exemplar that got it right; the others were flavorless.
- **How I fixed it:** launched **designer subagent** (sonnet, 4-min turnaround) with brief to study `.nc-glass-menu` as the exemplar and rebuild 4 primitives on its design language (semi-transparent Elevated-2 substrate + blur/saturate backdrop + accent-line border + layered shadow + inset top highlight — applied at intensities per each primitive's available surface). Designer produced (report at `AgentSecretBase/workspace/_artifacts/caelos-glass-primitives-designer-2026-07-28.md`):
  - **glass-separator** — engraved-channel: hairline track gathering into accent-line pit at midspan + groove shadow pair (light above / dark below). Not a flat gradient.
  - **breadcrumb** — 1px accent-line rotated tick replaces `lucide-react` ChevronRight (shares "gathered accent" DNA with separator). Opt-in `glass` prop for chrome-header-over-drawer-edge case.
  - **popover** — near-verbatim `.nc-glass-menu` inheritance. API-compatible drop-in for shadcn-default `popover.tsx`. Added `PopoverArrow` with accent-line stroke.
  - **skeleton** — Elevated-1 substrate + accent-tinted shimmer + inset top rim-light. Self-injects `@keyframes` (no theme.css touch required). Replaces shadcn `animate-pulse` default.
  All 4 swapped in place at `Caelos-console/src/app/components/ui/*.tsx`. Design-language table at the bottom of the report shows which of `.nc-glass-menu`'s four ingredients each primitive inherits.

## 19. Missing component library primitives (glass-popover + glass-skeleton)

- **Correction:** *"Component Library beneath. popover cards: (but they should occupy the same space they do now on the right side, they just should have a boundary between them and the edge of the screen. npx shadcn@latest add @einui/glass-popover … skeleton: npx shadcn@latest add @einui/glass-skeleton"*
- **Why:** wanted the einui liquid-glass popover + skeleton primitives available for future use; popovers specifically should have proper glass-edge boundaries from the screen edge.
- **How I fixed it:** WebFetched einui registry JSON for both (`https://ui.eindev.ir/r/glass-popover.json` and `.../glass-skeleton.json`) → included sources in designer subagent's brief → designer rebuilt both on `.nc-glass-menu` language (see #18 detail) → swapped the existing shadcn-default `popover.tsx` (bg-popover + shadow-md) and `skeleton.tsx` (bg-accent + animate-pulse) with designer's NC-native versions. Both are API-compatible drop-ins.

## 20. Fork owning D + C in parallel session (workflow correction)

- **Correction:** *"i have a forked session working on D and C"*
- **Why:** parallel-work directive — Daniel wanted me to focus my main-thread cycles on the substantive drawer restructure (Unit F) + designer coordination, while a forked session handled the more mechanical D + C units.
- **How I fixed it:** dropped D and C from my active queue; continued only on designer subagent + Unit F draft; monitored fork completion via verdict-file existence check (not by reading the fork's transcript, per the "don't peek" discipline). Fork returned D-v2 PASS (border-t/border-b 22→3, delta -19; 6 GlassSeparator instances) + C PASS (4 sites muted per the pre-revision Unit C spec). Applied one inline post-fork revert (ProjectView eyebrow → `NC.accent`) since fork's C ran the pre-revision prompt that muted Project (per correction #14+#17 timeline).

## 21. Codex agents apparently stopped (Unit D bailed silently on my watch)

- **Correction:** *"i think the background tasks stopped. What is the issue with the codex agents?"*
- **Why:** Unit D had bailed 30+ min prior with a clean bailout verdict; I hadn't caught it because I was focused on other prep, and the "background task completed" notification was ambiguous (shell handoff vs actual completion).
- **How I fixed it:** read the bailout verdict (Unit D couldn't find the separator audit at `AgentSecretBase/workspace/_artifacts/…` because that path lives outside codex's `--cd` sandbox scoped to Caelos-console); rewrote the Unit D prompt with the entire audit content INLINED (no external file dependency); re-fired → PASS. Flagged the pattern as a `codex-delegation-discipline` skill-body defect to surface to CTO after the sprint: "any external reference the prompt tells codex to fetch must live inside `--cd`, or be inlined."

---

## Meta-observations on the pattern

Items 1 / 2 / 5 are the same theme (sidebar box) iterated three times because I under-shot then over-shot — I kept the fill "for the button feel" instead of trusting Daniel's first "just remove it" instinct. Items 7 / 8 / 9 similarly — I proposed elaborate options when the answer was simpler (recolor existing element, differentiate done vs deferred, remove priority entirely). Item 15 (consistency) is the pattern that would have caught 1 / 2 / 5 and 7 / 8 upstream: I was optimizing per-surface instead of thinking about system coherence across surfaces. Item 18 (liquid glass not translating) is the same disease at the primitive level — I picked defaults per primitive instead of asking "which cues from `.nc-glass-menu` does this shape have room for."

**Lessons to keep for future visual sprints:**

1. **Trust Daniel's first instinct on "just remove it" corrections** — if his correction is stated in reductive terms, don't try to preserve the removed thing via clever mechanism unless he asks. First iteration should be the maximal-simplification version.
2. **Propose the minimal-new-element solution before elaborate options** — the module state answer was "recolor the existing icon," not "add a new dot." Ask what existing elements could carry the new job before adding new elements.
3. **Systems-first framing** — before touching a per-surface treatment, check the sibling surfaces for the same conceptual thing. If the project card has a rich header, don't design a bare drawer header without at least asking whether they should align.
4. **When adapting external component libraries, inherit the exemplar's recipe, not its tokens** — the answer to "translate einui to Nova Caelum" isn't "swap `white/20` for `--nc-hair-2`." It's "which of `.nc-glass-menu`'s ingredients does this shape have room for?"
5. **Notice bailout notifications proactively** — the "background task completed" event fires for both success and shell-handoff exits. Verify verdict file contents explicitly, don't assume "completed" = "passed."
6. **Codex sandbox scope** — any external file the prompt references must live inside `--cd` OR be inlined. This is worth pushing back into the `codex-delegation-discipline` skill body.
7. **Entity-type identity is a semantic axis, not a stylistic choice** — one color per entity type (Project / Module / Task) carries real information that a single accent-for-all collapses. When you have N discrete categories of the same concept, use N colors from the semantic palette (with state-color collision-avoidance).
</content>
</invoke>