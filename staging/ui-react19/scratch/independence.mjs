/**
 * Lesson 1: the packaged header family must own its approved appearance with NO Atlas wrapper.
 * Reads every probe, then strips every Atlas class from the stage and all its ancestors
 * (`iter5`, `atlas3`, `i2-specimen`, `i5-*`, `iter2`, `iter4`) and reads them again.
 * Any moved value is a dependency on the host stylesheet.
 */
import { chromium } from "playwright";
const PROPS = ["display","position","width","height","padding","margin","border","borderRadius",
 "background","boxShadow","opacity","color","fontFamily","fontSize","fontWeight","lineHeight",
 "letterSpacing","wordSpacing","textAlign","gap","gridTemplateColumns","transform","transition",
 "zIndex","minHeight","alignItems","justifyContent","stroke","strokeWidth","fill","flexWrap"];
const SELS = {
  card:"[data-nc-conversation-card]", canvas:"[class*=__canvas]", title:"[class*=__titleFrame]",
  titleText:"[class*=__titleText]", copy:"[class*=__copy]", surface:"[class*=__surface]",
  glass:"[class*=__glass]", trigger:"[class*=__trigger]", field:"[class*=participantField]",
  agent:"[class*=__agent]:not([class*=agentName])", avatarButton:"[class*=__avatarButton]",
  contextRing:"[class*=__contextRing]", contextTrack:"[class*=__contextTrack]",
  chatId:"[class*=__chatId]", subtitleRow:"[class*=__subtitleRow]",
  lwLinks:"[class*=linked-work__links]", lwTrigger:"[class*=kind_linkedWorkTrigger]",
  lwLabel:"[class*=triggerLabel]", lwDivider:"[class*=linked-work__divider]",
};
const CARDSELS = {
  root:"[class*=agent-detail__root]", agentPlane:"[data-nc-plane=agent]", sessionPlane:"[data-nc-plane=session]",
  identity:"[class*=agent-detail__identity]", avatar:"[class*=agent-detail__avatar]",
  name:"[class*=agent-detail__name]", subtitle:"[class*=agent-detail__subtitle]",
  status:"[class*=agent-detail__status]:not([class*=statusControls])",
  sessionId:"[class*=agent-detail__sessionId]", contextLabel:"[class*=agent-detail__contextLabel]",
  workTrigger:"[class*=agent-detail__workTrigger]", workSummary:"[class*=agent-detail__workSummary]",
  liveItem:"[class*=agent-detail__liveItem]", itemName:"[class*=agent-detail__itemName]",
  trailing:"[class*=agent-detail__trailing]",
};
const readAll = (page, root, sels, props) => page.evaluate(({root,sels,props})=>{
  const scope=document.querySelector(root); const out={};
  for (const [k,s] of Object.entries(sels)) {
    const el=scope&&scope.querySelector(s); if(!el){out[k]=null;continue;}
    const cs=getComputedStyle(el), r=el.getBoundingClientRect();
    const o={w:+r.width.toFixed(3),h:+r.height.toFixed(3)};
    for(const p of props) o[p]=cs[p];
    out[k]=o;
  }
  return out;
},{root,sels,props:props});

const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1512,height:806}, deviceScaleFactor:2, colorScheme:"dark" });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:5187/?tab=studio&iteration=iter5",{waitUntil:"networkidle"});
await p.waitForTimeout(1300);
const C="#i5-conversation-header .i5-header-candidate:nth-of-type(1)";
await p.click(`${C} [class*=__trigger]`); await p.waitForTimeout(900);
await p.click(`${C} [class*=__avatarButton]`); await p.waitForTimeout(900);
const CARD='[data-header-owner="i5-header-capsule"][data-nc-detail-host]';

// Tag a stable, non-Atlas handle first: the strip below removes the very class the scope uses.
await p.evaluate(c => document.querySelector(c)?.setAttribute("data-probe-root", ""), C);
const HROOT = "[data-probe-root]";
const before = { header: await readAll(p,HROOT,SELS,PROPS), card: await readAll(p,CARD,CARDSELS,PROPS) };

// Strip every Atlas class from the header block and all its ancestors, and from the portal root.
const stripped = await p.evaluate(({C,CARD})=>{
  const ATLAS=/^(iter5|iter2|iter4|atlas3|i2-|i5-|study|studio)/;
  const kill=(el)=>{ if(!el||!el.classList) return 0; let n=0;
    for(const c of [...el.classList]) if(ATLAS.test(c)){el.classList.remove(c);n++;} return n; };
  let removed=0;
  for (const root of [document.querySelector("[data-probe-root]"), document.querySelector(CARD)]) {
    let el=root; while(el && el!==document.documentElement){ removed+=kill(el); el=el.parentElement; }
    if(root) root.querySelectorAll("*").forEach(e=>{removed+=kill(e);});
  }
  // also drop the atlas stylesheets entirely
  let sheets=0;
  for (const s of [...document.styleSheets]) {
    try {
      const txt=[...s.cssRules].map(r=>r.cssText).join("");
      if(/\.iter2|\.atlas3|\.i2-|\.iter5/.test(txt) && !/caelos-/.test(txt.slice(0,400))) {
        s.disabled=true; sheets++;
      }
    } catch(e){}
  }
  return {removed, sheets};
},{C,CARD});
await p.waitForTimeout(700);
const after = { header: await readAll(p,HROOT,SELS,PROPS), card: await readAll(p,CARD,CARDSELS,PROPS) };

const drift=[];
for (const group of ["header","card"]) {
  for (const k of Object.keys(before[group])) {
    const a=before[group][k], z=after[group][k];
    if(!a||!z){ if(a!==z) drift.push(`${group}.${k}: present ${!!a} -> ${!!z}`); continue; }
    for(const prop of Object.keys(a)) if(String(a[prop])!==String(z[prop])) drift.push(`${group}.${k}.${prop}: ${a[prop]} -> ${z[prop]}`);
  }
}
console.log(JSON.stringify({stripped, probes:Object.keys(SELS).length+Object.keys(CARDSELS).length, driftCount:drift.length, drift},null,1));
await b.close();
