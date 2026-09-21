/**
 * Cross-server fidelity probe for the packaged Atlas 2 conversation header family.
 *
 *   specimen : http://127.0.0.1:5183/                      (the live approved study)
 *   packaged : http://127.0.0.1:5187/?tab=studio&iteration=iter5
 *
 * 1512x806, deviceScaleFactor 2, dark. Reads the DOM, never a screenshot: every number here
 * is getBoundingClientRect or getComputedStyle. Writes JSON to stdout.
 *
 * Throwaway scratch harness for the 2026-09-20 overnight run. Run from packages/ui.
 */
import { chromium } from "playwright";

const PROPS = [
  "display", "position", "boxSizing", "width", "height", "padding", "margin", "border",
  "borderRadius", "background", "backgroundColor", "backgroundImage", "boxShadow", "opacity",
  "color", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "wordSpacing",
  "textAlign", "whiteSpace", "overflow", "zIndex", "transform", "transformOrigin", "transition",
  "animation", "gap", "columnGap", "rowGap", "alignItems", "justifyContent", "justifyItems",
  "gridTemplateColumns", "flexDirection", "flexWrap", "minHeight", "minWidth", "maxWidth",
  "maxHeight", "inset", "top", "right", "bottom", "left", "pointerEvents", "backdropFilter",
  "stroke", "strokeWidth", "fill",
];

const READ = (props) => `(sel, root) => {
  const scope = root ? document.querySelector(root) : document;
  const el = scope && scope.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const out = { box: { w: +r.width.toFixed(2), h: +r.height.toFixed(2), x: +r.x.toFixed(2), y: +r.y.toFixed(2) } };
  for (const p of ${JSON.stringify(props)}) out[p] = cs[p];
  return out;
}`;

async function read(page, sel, root = null) {
  return page.evaluate(new Function("return " + READ(PROPS))(), [sel, root]);
}
// Playwright passes a single arg; wrap.
async function probe(page, sel, root = null) {
  return page.evaluate(
    ({ sel, root, props }) => {
      const scope = root ? document.querySelector(root) : document;
      const el = scope && scope.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const out = { box: { w: +r.width.toFixed(2), h: +r.height.toFixed(2), x: +r.x.toFixed(2), y: +r.y.toFixed(2) } };
      for (const p of props) out[p] = cs[p];
      return out;
    },
    { sel, root, props: PROPS },
  );
}

async function probeAll(page, sel, root = null) {
  return page.evaluate(
    ({ sel, root }) => {
      const scope = root ? document.querySelector(root) : document;
      if (!scope) return [];
      return Array.from(scope.querySelectorAll(sel)).map(el => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          w: +r.width.toFixed(2), h: +r.height.toFixed(2),
          x: +r.x.toFixed(2), y: +r.y.toFixed(2),
          transform: cs.transform, opacity: cs.opacity, text: (el.textContent || "").trim().slice(0, 40),
        };
      });
    },
    { sel, root },
  );
}

const diffKeys = (a, b, ignore = []) => {
  if (!a || !b) return [`MISSING ${!a ? "specimen" : ""}${!b ? " packaged" : ""}`];
  const out = [];
  for (const k of Object.keys(a)) {
    if (ignore.includes(k)) continue;
    if (k === "box") {
      for (const d of ["w", "h"]) {
        if (Math.abs(a.box[d] - b.box[d]) > 0.5) out.push(`box.${d}: ${a.box[d]} vs ${b.box[d]}`);
      }
      continue;
    }
    if (a[k] !== b[k]) out.push(`${k}: ${JSON.stringify(a[k])} vs ${JSON.stringify(b[k])}`);
  }
  return out;
};

const settle = (page, ms = 700) => page.waitForTimeout(ms);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1512, height: 806 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  const spec = await ctx.newPage();
  const pack = await ctx.newPage();
  const errors = { specimen: [], packaged: [] };
  spec.on("console", m => m.type() === "error" && errors.specimen.push(m.text()));
  pack.on("console", m => m.type() === "error" && errors.packaged.push(m.text()));
  spec.on("pageerror", e => errors.specimen.push("PAGEERROR " + e.message));
  pack.on("pageerror", e => errors.packaged.push("PAGEERROR " + e.message));

  await spec.goto("http://127.0.0.1:5183/", { waitUntil: "networkidle" });
  await pack.goto("http://127.0.0.1:5187/?tab=studio&iteration=iter5", { waitUntil: "networkidle" });
  await spec.waitForSelector(".conversation-card");
  await pack.waitForSelector("[data-nc-conversation-card]");
  await settle(spec, 900);
  await settle(pack, 900);

  const report = { generated: new Date().toISOString(), sections: {}, consoleErrors: errors };

  // Specimen roots, in DOM order: capsule then rounded.
  const SPEC = {
    capsule: ".wrap-frame > .wrap-candidate:nth-of-type(1)",
    rounded: ".wrap-frame > .wrap-candidate:nth-of-type(2)",
  };
  const PACK = {
    capsule: "#i5-conversation-header .i5-header-candidate:nth-of-type(1)",
    rounded: "#i5-conversation-header .i5-header-candidate:nth-of-type(2)",
  };

  // ── A. Card geometry, counts 1-6, both shapes, rest + pinned ─────────────────────────
  const geometry = [];
  for (const count of [1, 2, 3, 4, 5, 6]) {
    await spec.click(`.wrap-counts button[aria-label="${count} participants"]`);
    await pack.click(`#i5-conversation-header .i2-controls button[aria-label="${count} participants"]`);
    await settle(spec, 500); await settle(pack, 500);
    for (const shape of ["capsule", "rounded"]) {
      const s = await probe(spec, ".conversation-card", SPEC[shape]);
      const p = await probe(pack, "[data-nc-conversation-card]", PACK[shape]);
      const sf = await probe(spec, ".wrap-participant-field", SPEC[shape]);
      const pf = await probe(pack, "[class*=participantField]", PACK[shape]);
      geometry.push({
        count, shape, state: "rest",
        card: { specimen: [s?.box.w, s?.box.h], packaged: [p?.box.w, p?.box.h] },
        field: { specimen: [sf?.box.w, sf?.box.h], packaged: [pf?.box.w, pf?.box.h] },
        cardDiff: diffKeys(s, p, ["box"]).length ? diffKeys(s, p, ["box"]) : "identical",
        boxDiff: diffKeys({ box: s?.box }, { box: p?.box }),
      });
    }
    // Pin ONE shape at a time: clicking the second card's trigger is an outside-pointerdown
    // for the first and unpins it, on both sides alike.
    for (const shape of ["capsule", "rounded"]) {
      await spec.click(`${SPEC[shape]} .conversation-trigger`);
      await pack.click(`${PACK[shape]} [class*=__trigger]`);
      await settle(spec, 900); await settle(pack, 900);
      const s = await probe(spec, ".conversation-card", SPEC[shape]);
      const p = await probe(pack, "[data-nc-conversation-card]", PACK[shape]);
      const sa = await probeAll(spec, ".detached-agent", SPEC[shape]);
      const pa = await probeAll(pack, "[class*=__agent]:not([class*=agentName])", PACK[shape]);
      // Both pages lay the cards out at different absolute positions, so roster geometry is
      // only comparable RELATIVE to each side's own card origin.
      const so = { x: s?.box.x ?? 0, y: s?.box.y ?? 0 }, po = { x: p?.box.x ?? 0, y: p?.box.y ?? 0 };
      sa.forEach(a => { a.x = +(a.x - so.x).toFixed(2); a.y = +(a.y - so.y).toFixed(2); });
      pa.forEach(a => { a.x = +(a.x - po.x).toFixed(2); a.y = +(a.y - po.y).toFixed(2); });
      geometry.push({
        count, shape, state: "pinned",
        card: { specimen: [s?.box.w, s?.box.h], packaged: [p?.box.w, p?.box.h] },
        boxDiff: diffKeys({ box: s?.box }, { box: p?.box }),
        roster: sa.map((a, i) => ({
          i, specimen: [a.x, a.y, a.w, a.h], packaged: pa[i] ? [pa[i].x, pa[i].y, pa[i].w, pa[i].h] : null,
          dx: pa[i] ? +(pa[i].x - a.x).toFixed(2) : null, dy: pa[i] ? +(pa[i].y - a.y).toFixed(2) : null,
        })),
      });
      // Unpin through the approved keyboard path: Escape on the focused trigger closes the
      // card and returns focus to it. Clicking the trigger again is blocked once pinned,
      // because the roster field sits above it — identically on both sides.
      await spec.keyboard.press("Escape");
      await pack.keyboard.press("Escape");
      await settle(spec, 700); await settle(pack, 700);
    }
  }
  report.sections.geometry = geometry;

  // back to the study default
  await spec.click('.wrap-counts button[aria-label="4 participants"]');
  await pack.click('#i5-conversation-header .i2-controls button[aria-label="4 participants"]');
  await settle(spec, 500); await settle(pack, 500);

  // ── B. Type and parts ────────────────────────────────────────────────────────────────
  const parts = [];
  const pairs = [
    ["title", ".wrap-title-frame", "[class*=__titleFrame]"],
    ["titleText", ".wrap-title-text", "[class*=__titleText]"],
    ["copy", ".wrap-copy", "[class*=__copy]"],
    ["subtitleRow", ".wrap-subtitle-row", "[class*=__subtitleRow]"],
    ["chatId", ".header-chat-id", "[class*=__chatId]"],
    ["surface", ".conversation-surface", "[class*=__surface]"],
    ["glass", ".conversation-glass", "[class*=__glass]"],
    ["trigger", ".conversation-trigger", "[class*=__trigger]"],
    ["avatarButton", ".agent-avatar-button", "[class*=__avatarButton]"],
    ["contextRing", ".agent-context-ring", "[class*=__contextRing]"],
    ["linkedWorkLinks", ".linked-work-links", "[class*=linked-work__links]"],
    ["linkedWorkTrigger", ".linked-work-trigger", "[class*=linkedWorkTrigger]"],
  ];
  for (const shape of ["capsule", "rounded"]) {
    for (const [name, ss, ps] of pairs) {
      const s = await probe(spec, ss, SPEC[shape]);
      const p = await probe(pack, ps, PACK[shape]);
      parts.push({ shape, part: name, diff: diffKeys(s, p), specimen: s && s.box, packaged: p && p.box });
    }
  }
  report.sections.parts = parts;

  // ── C. Pinned parts: agent name, status badge, link button ───────────────────────────
  await spec.click(`${SPEC.capsule} .conversation-trigger`);
  await pack.click(`${PACK.capsule} [class*=__trigger]`);
  await settle(spec, 900); await settle(pack, 900);
  // Focus-return check on the approved Escape path, before anything else moves focus.
  report.sections.keyboard = {
    specimenFocusAfterPin: await spec.evaluate(() => document.activeElement?.className || null),
    packagedFocusAfterPin: await pack.evaluate(() => document.activeElement?.className || null),
  };
  const pinnedParts = [];
  for (const [name, ss, ps] of [
    ["agentName", ".detached-agent-name", "[class*=__agentName]"],
    ["statusBadge", ".agent-status-badge", "[class*=__statusBadge]"],
    ["headerLink", ".header-link", '[class~="caelos-header-control--kind_link"]'],
    ["chatId", ".header-chat-id", "[class*=__chatId]"],
  ]) {
    const s = await probe(spec, ss, SPEC.capsule);
    const p = await probe(pack, ps, PACK.capsule);
    pinnedParts.push({ part: name, diff: diffKeys(s, p), specimen: s && s.box, packaged: p && p.box });
  }
  report.sections.pinnedParts = pinnedParts;

  // ── D. Agent detail card, in situ, agent 0 ───────────────────────────────────────────
  await spec.hover(`${SPEC.capsule} .agent-avatar-button`);
  await spec.click(`${SPEC.capsule} .agent-avatar-button`);
  await pack.hover(`${PACK.capsule} [class*=__avatarButton]`);
  await pack.click(`${PACK.capsule} [class*=__avatarButton]`);
  await settle(spec, 900); await settle(pack, 900);
  const PACKCARD = '[data-header-owner="i5-header-capsule"][data-nc-detail-host]';
  const card = [];
  for (const [name, ss, ps] of [
    ["cardRoot", ".agent-card-v2", "[class*=agent-detail__root]"],
    ["agentPlane", ".profile-agent-plane", "[data-nc-plane=agent]"],
    ["identity", ".profile-identity", "[class*=agent-detail__identity]"],
    ["avatar", ".profile-avatar", "[class*=agent-detail__avatar]"],
    ["name", ".profile-name", "[class*=agent-detail__name]"],
    ["subtitle", ".profile-subtitle", "[class*=agent-detail__subtitle]"],
    ["harness", ".profile-harness", "[class*=agent-detail__harness]"],
    ["surfaceBtn", ".profile-surface", "[class*=agent-detail__surface]"],
    ["statusControls", ".profile-status-controls", "[class*=agent-detail__statusControls]"],
    ["status", ".profile-status", "[class*=agent-detail__status]:not([class*=statusControls])"],
    ["sessionPlane", ".profile-session-plane", "[data-nc-plane=session]"],
    ["sessionId", ".profile-session-id", "[class*=agent-detail__sessionId]"],
    ["contextLabel", ".profile-context-label", "[class*=agent-detail__contextLabel]"],
    ["progress", "progress", "progress"],
    ["selectors", ".profile-selectors", "[class*=agent-detail__selectors]"],
    ["composerModel", ".nc-composer-model", ".nc-composer-model"],
    ["workTrigger", ".profile-work-trigger", "[class*=agent-detail__workTrigger]"],
    ["workSummary", ".profile-work-summary", "[class*=agent-detail__workSummary]"],
    ["liveItem", ".profile-live-item", "[class*=agent-detail__liveItem]"],
    ["itemName", ".profile-item-name", "[class*=agent-detail__itemName]"],
  ]) {
    const s = await probe(spec, ss, ".agent-detail-popover");
    const p = await probe(pack, ps, PACKCARD);
    card.push({ part: name, diff: diffKeys(s, p), specimen: s && s.box, packaged: p && p.box });
  }
  // popover geometry itself is measured unscoped
  const sp = await probe(spec, ".agent-detail-popover");
  const pp = await probe(pack, PACKCARD);
  card.unshift({ part: "popoverRoot", diff: diffKeys(sp, pp, ["box", "top", "left", "right", "bottom", "transform", "inset"]), specimen: sp && sp.box, packaged: pp && pp.box });
  report.sections.agentCard = card;

  // ── E. Declared motion ───────────────────────────────────────────────────────────────
  const motion = {};
  motion.specimen = await spec.evaluate(() => {
    const g = (s) => { const el = document.querySelector(s); return el ? getComputedStyle(el).transition : null; };
    return {
      titleText: g(".wrap-title-text"),
      chevron: g(".working-file-disclosure svg"),
      animations: document.getAnimations().map(a => ({
        name: a.animationName || a.id || "(css-transition)",
        duration: a.effect?.getTiming().duration, easing: a.effect?.getTiming().easing,
      })).slice(0, 12),
    };
  });
  motion.packaged = await pack.evaluate(() => {
    const g = (s) => { const el = document.querySelector(s); return el ? getComputedStyle(el).transition : null; };
    return {
      titleText: g("[class*=__titleText]"),
      chevron: g("[class*=working-files__disclosure] svg"),
      animations: document.getAnimations().map(a => ({
        name: a.animationName || a.id || "(css-transition)",
        duration: a.effect?.getTiming().duration, easing: a.effect?.getTiming().easing,
      })).slice(0, 12),
    };
  });
  report.sections.motion = motion;

  // Open the Working files row on both sides before measuring it.
  await spec.click('.agent-detail-popover .profile-work-group:last-of-type .profile-work-trigger, .agent-detail-popover section[aria-label="Working files"] .profile-work-trigger');
  await pack.click(`${PACKCARD} section[aria-label="Working files"] [class*=agent-detail__workTrigger]`);
  await settle(spec, 500); await settle(pack, 500);

  // ── F. Working files rows ────────────────────────────────────────────────────────────
  const files = [];
  for (const [name, ss, ps] of [
    ["row", ".working-file-row", "[class*=working-files__row]"],
    ["open", ".working-file-open", "[class*=working-files__open]"],
    ["disclosure", ".working-file-disclosure", "[class*=working-files__disclosure]"],
    ["space", ".working-file-space", "[class*=working-files__space]"],
    ["diff", ".working-file-diff", "[class*=working-files__diff]"],
    ["diffButton", ".working-file-diff button", "[class*=working-files__diff] button"],
  ]) {
    const s = await probe(spec, ss, ".agent-detail-popover");
    const p = await probe(pack, ps, PACKCARD);
    files.push({ part: name, diff: diffKeys(s, p), specimen: s && s.box, packaged: p && p.box });
  }
  report.sections.workingFiles = files;

  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})().catch(e => { console.error("HARNESS FAILED:", e); process.exit(1); });
