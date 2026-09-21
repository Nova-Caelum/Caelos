/**
 * Second pass: the linked-work attachment, declared and running motion, reduced motion, and
 * the crops for the two recorded discrepancies. Same viewport contract as header-fidelity.mjs.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "/Users/danieleghdami/NovaCaelum_Obs/_launchers/da-vinci/.playwright-mcp";
mkdirSync(OUT, { recursive: true });
const settle = (p, ms = 700) => p.waitForTimeout(ms);
const R = {};

const browser = await chromium.launch();
const mk = async (reduced) => {
  const ctx = await browser.newContext({
    viewport: { width: 1512, height: 806 }, deviceScaleFactor: 2, colorScheme: "dark",
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const spec = await ctx.newPage(); const pack = await ctx.newPage();
  await spec.goto("http://127.0.0.1:5183/", { waitUntil: "networkidle" });
  await pack.goto("http://127.0.0.1:5187/?tab=studio&iteration=iter5", { waitUntil: "networkidle" });
  await spec.waitForSelector(".conversation-card"); await pack.waitForSelector("[data-nc-conversation-card]");
  await settle(spec, 900); await settle(pack, 900);
  return { ctx, spec, pack };
};

const SPECC = ".wrap-frame > .wrap-candidate:nth-of-type(1)";
const PACKC = "#i5-conversation-header .i5-header-candidate:nth-of-type(1)";

// ── A. sub-pixel hypothesis: is the card at a fractional x on either page? ──────────────
{
  const { ctx, spec, pack } = await mk(false);
  R.cardOrigin = {
    specimen: await spec.evaluate(s => { const r = document.querySelector(s + " .conversation-card").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; }, SPECC),
    packaged: await pack.evaluate(s => { const r = document.querySelector(s + " [data-nc-conversation-card]").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; }, PACKC),
  };
  R.copyBox = {
    specimen: await spec.evaluate(s => { const c = document.querySelector(s + " .conversation-card").getBoundingClientRect(); const e = document.querySelector(s + " .wrap-copy").getBoundingClientRect(); return { relX: +(e.x - c.x).toFixed(4), w: +e.width.toFixed(4) }; }, SPECC),
    packaged: await pack.evaluate(s => { const c = document.querySelector(s + " [data-nc-conversation-card]").getBoundingClientRect(); const e = document.querySelector(s + " [class*=__copy]").getBoundingClientRect(); return { relX: +(e.x - c.x).toFixed(4), w: +e.width.toFixed(4) }; }, PACKC),
  };

  // ── B. Linked-work attachment: preview top edge against the card's bottom edge ────────
  await spec.click(`${SPECC} .conversation-trigger`);
  await pack.click(`${PACKC} [class*=__trigger]`);
  await settle(spec, 900); await settle(pack, 900);
  await spec.click(`${SPECC} .linked-work-trigger`);
  await pack.click(`${PACKC} [class*=linkedWorkTrigger]`);
  await settle(spec, 900); await settle(pack, 900);
  const attach = async (page, cardSel, popSel) => page.evaluate(({ cardSel, popSel }) => {
    const card = document.querySelector(cardSel), pop = document.querySelector(popSel);
    if (!card || !pop) return null;
    const c = card.getBoundingClientRect(), p = pop.getBoundingClientRect();
    const cs = getComputedStyle(pop);
    return {
      gapTop: +(p.top - c.bottom).toFixed(3), dLeft: +(p.left - c.left).toFixed(3),
      w: +p.width.toFixed(2), h: +p.height.toFixed(2),
      zIndex: cs.zIndex, padding: cs.padding, animation: cs.animation, overflow: cs.overflow,
      resize: cs.resize, maxHeight: cs.maxHeight, minHeight: cs.minHeight,
      running: document.getAnimations().filter(a => a.effect && pop.contains(a.effect.target))
        .map(a => ({ name: a.animationName, duration: a.effect.getTiming().duration, easing: a.effect.getTiming().easing })),
    };
  }, { cardSel, popSel });
  R.linkedWork = {
    specimen: await attach(spec, `${SPECC} .conversation-card`, ".linked-work-popover"),
    packaged: await attach(pack, `${PACKC} [data-nc-conversation-card]`, "[class*=kind_linkedWorkPopover]"),
  };
  // The preview's max height is min(720, innerHeight - cardBottom - 12). The two pages put the
  // card at different viewport positions, so the INPUT differs; record it to prove the formula
  // is the same on both sides rather than the geometry being wrong.
  const avail = (page, cardSel) => page.evaluate(sel => {
    const c = document.querySelector(sel).getBoundingClientRect();
    return { cardBottom: +c.bottom.toFixed(3), innerHeight: window.innerHeight,
             expectedMaxHeight: +Math.max(0, Math.min(720, window.innerHeight - c.bottom - 12)).toFixed(3) };
  }, cardSel);
  R.linkedWorkAvailable = {
    specimen: await avail(spec, `${SPECC} .conversation-card`),
    packaged: await avail(pack, `${PACKC} [data-nc-conversation-card]`),
  };

  // ── C. Declared motion on the header's own parts ───────────────────────────────────────
  const motion = async (page, root, map) => page.evaluate(({ root, map }) => {
    const out = {};
    for (const [k, sel] of Object.entries(map)) {
      const el = document.querySelector(root + " " + sel);
      if (!el) { out[k] = null; continue; }
      const cs = getComputedStyle(el);
      out[k] = { transition: cs.transition, animation: cs.animation, opacity: cs.opacity };
    }
    return out;
  }, { root, map });
  R.motion = {
    specimen: await motion(spec, SPECC, {
      titleText: ".wrap-title-text", titleEllipsis: ".wrap-title-ellipsis", card: ".conversation-card",
      surface: ".conversation-surface", field: ".wrap-participant-field",
      expandedDecoration: ".agent-expanded-decoration", agentName: ".detached-agent-name",
      contextDecoration: ".agent-context-decoration",
    }),
    packaged: await motion(pack, PACKC, {
      titleText: "[class*=__titleText]", titleEllipsis: "[class*=__titleEllipsis]", card: "[data-nc-conversation-card]",
      surface: "[class*=__surface]", field: "[class*=participantField]",
      expandedDecoration: "[class*=expandedDecoration]", agentName: "[class*=__agentName]",
      contextDecoration: "[class*=contextDecoration]",
    }),
  };

  // ── D. Split settle: the spring's own clock, sampled ───────────────────────────────────
  const splitTrace = async (page, canvasSel, triggerSel) => page.evaluate(async ({ canvasSel, triggerSel }) => {
    const canvas = document.querySelector(canvasSel);
    const trg = document.querySelector(triggerSel);
    const read = () => parseFloat(getComputedStyle(canvas).getPropertyValue("--split")) || 0;
    const t0 = performance.now(); const samples = [];
    trg.click();
    await new Promise(res => {
      const tick = () => {
        const t = performance.now() - t0, v = read();
        samples.push([+t.toFixed(0), +v.toFixed(4)]);
        if (t > 1400) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const settleAt = samples.find(([, v]) => v > 0.999);
    const at = (ms) => { const s = samples.find(([t]) => t >= ms); return s ? s[1] : null; };
    return { settleMs: settleAt ? settleAt[0] : null, at100: at(100), at200: at(200), at300: at(300), at500: at(500), final: samples[samples.length - 1][1] };
  }, { canvasSel, triggerSel });
  // Close the preview and unpin first, so the trace samples a clean rise from 0 on both.
  const ensureUnpinned = async (page, trg) => {
    for (let i = 0; i < 4; i++) {
      const open = await page.evaluate(sel => document.querySelector(sel)?.getAttribute("aria-expanded") === "true", trg);
      if (!open) return true;
      await page.keyboard.press("Escape");
      await settle(page, 700);
    }
    return page.evaluate(sel => document.querySelector(sel)?.getAttribute("aria-expanded") !== "true", trg);
  };
  R.unpinnedForTrace = {
    specimen: await ensureUnpinned(spec, `${SPECC} .conversation-trigger`),
    packaged: await ensureUnpinned(pack, `${PACKC} [class*=__trigger]`),
  };
  await settle(spec, 600); await settle(pack, 600);
  R.split = {
    specimen: await splitTrace(spec, `${SPECC} .wrap-canvas`, `${SPECC} .conversation-trigger`),
    packaged: await splitTrace(pack, `${PACKC} [class*=__canvas]`, `${PACKC} [class*=__trigger]`),
  };
  // The trace leaves both pinned; the avatar buttons are live only in that state.

  // ── E. Crops for the two recorded discrepancies ────────────────────────────────────────
  await settle(spec, 800); await settle(pack, 800);
  // Make sure both are pinned before touching an avatar: the buttons are inert until then.
  const ensurePinned = async (page, trg) => {
    for (let i = 0; i < 3; i++) {
      const open = await page.evaluate(sel => document.querySelector(sel)?.getAttribute("aria-expanded") === "true", trg);
      if (open) return true;
      await page.click(trg, { force: true });
      await settle(page, 900);
    }
    return page.evaluate(sel => document.querySelector(sel)?.getAttribute("aria-expanded") === "true", trg);
  };
  R.pinnedForCrops = {
    specimen: await ensurePinned(spec, `${SPECC} .conversation-trigger`),
    packaged: await ensurePinned(pack, `${PACKC} [class*=__trigger]`),
  };
  await spec.click(`${SPECC} .agent-avatar-button`); await pack.click(`${PACKC} [class*=__avatarButton]`);
  await settle(spec, 900); await settle(pack, 900);
  await spec.locator(".agent-detail-popover").screenshot({ path: `${OUT}/hdr-agentcard-SPECIMEN.png` });
  await pack.locator('[data-header-owner="i5-header-capsule"][data-nc-detail-host]').screenshot({ path: `${OUT}/hdr-agentcard-PACKAGED.png` });
  // permission popover — the Button type discrepancy
  await spec.click('.agent-detail-popover .profile-status[aria-label^="Permissions"]');
  await pack.click('[data-header-owner="i5-header-capsule"][data-nc-detail-host] [aria-label^="Permissions"]');
  await settle(spec, 700); await settle(pack, 700);
  const sp = spec.locator('.profile-permissions-popover'), pp = pack.locator('[data-detail=permissions]');
  if (await sp.count()) await sp.first().screenshot({ path: `${OUT}/hdr-permission-SPECIMEN.png` });
  if (await pp.count()) await pp.first().screenshot({ path: `${OUT}/hdr-permission-PACKAGED.png` });
  R.permissionButton = {
    specimen: await spec.evaluate(() => { const b = document.querySelector('.profile-permissions-popover button'); if (!b) return null; const c = getComputedStyle(b), r = b.getBoundingClientRect(); return { fontSize: c.fontSize, fontWeight: c.fontWeight, lineHeight: c.lineHeight, letterSpacing: c.letterSpacing, w: +r.width.toFixed(2), h: +r.height.toFixed(2) }; }),
    packaged: await pack.evaluate(() => { const b = document.querySelector('[data-detail=permissions] button'); if (!b) return null; const c = getComputedStyle(b), r = b.getBoundingClientRect(); return { fontSize: c.fontSize, fontWeight: c.fontWeight, lineHeight: c.lineHeight, letterSpacing: c.letterSpacing, w: +r.width.toFixed(2), h: +r.height.toFixed(2) }; }),
  };
  // header at rest, both shapes, for the eye
  await spec.keyboard.press("Escape"); await pack.keyboard.press("Escape");
  await settle(spec, 900); await settle(pack, 900);
  await spec.locator(".wrap-frame").screenshot({ path: `${OUT}/hdr-rest-SPECIMEN.png` });
  await pack.locator("#i5-conversation-header .i5-header-frame").screenshot({ path: `${OUT}/hdr-rest-PACKAGED.png` });
  await ctx.close();
}

// ── F. Reduced motion ────────────────────────────────────────────────────────────────────
{
  const { ctx, spec, pack } = await mk(true);
  const still = async (page, root, sels) => page.evaluate(({ root, sels }) => {
    const out = {};
    for (const [k, sel] of Object.entries(sels)) {
      const el = document.querySelector(root + " " + sel);
      out[k] = el ? { transition: getComputedStyle(el).transition, animation: getComputedStyle(el).animation } : null;
    }
    out.runningAnimations = document.getAnimations().length;
    return out;
  }, { root, sels });
  R.reducedMotion = {
    specimen: await still(spec, SPECC, { titleText: ".wrap-title-text", card: ".conversation-card", ripple: ".nc-ripple-cell" }),
    packaged: await still(pack, PACKC, { titleText: "[class*=__titleText]", card: "[data-nc-conversation-card]", ripple: ".nc-ripple-cell" }),
  };
  await ctx.close();
}

console.log(JSON.stringify(R, null, 1));
await browser.close();
