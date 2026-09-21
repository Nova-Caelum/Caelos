import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1512,height:806}, deviceScaleFactor:2, colorScheme:"dark" });
const p = await ctx.newPage();
const errs=[]; p.on("console",m=>m.type()==="error"&&errs.push(m.text())); p.on("pageerror",e=>errs.push("PAGEERROR "+e.message));
await p.goto("http://127.0.0.1:5187/?tab=studio&iteration=iter5",{waitUntil:"networkidle"});
await p.waitForTimeout(1200);
const C = "#i5-conversation-header .i5-header-candidate:nth-of-type(1)";
await p.click(`${C} [class*=__trigger]`); await p.waitForTimeout(900);
const before = await p.evaluate(c=>({pinned:document.querySelector(c+" [class*=__trigger]")?.getAttribute("aria-expanded"),
  triggers:[...document.querySelectorAll(c+" [class*=linkedWorkTrigger]")].map(e=>({cls:e.className,txt:e.textContent,state:e.getAttribute("data-state")}))}),C);
await p.click(`${C} [class*=linkedWorkTrigger]`); await p.waitForTimeout(900);
const after = await p.evaluate(c=>{
  const trg=document.querySelector(c+" [class*=linkedWorkTrigger]");
  const pop=document.querySelector('[class*=kind_linkedWorkPopover]');
  const anyPop=[...document.querySelectorAll('[data-radix-popper-content-wrapper]')].map(e=>e.innerHTML.slice(0,80));
  const card=document.querySelector(c+" [data-nc-conversation-card]");
  if(!pop) return {triggerState:trg?.getAttribute("data-state"), popovers:anyPop, found:false};
  const cr=card.getBoundingClientRect(), pr=pop.getBoundingClientRect(), cs=getComputedStyle(pop);
  return {found:true, triggerState:trg?.getAttribute("data-state"),
    gapTop:+(pr.top-cr.bottom).toFixed(3), dLeft:+(pr.left-cr.left).toFixed(3),
    w:+pr.width.toFixed(2), h:+pr.height.toFixed(2), zIndex:cs.zIndex, padding:cs.padding,
    animation:cs.animation, overflow:cs.overflow, resize:cs.resize, maxHeight:cs.maxHeight, minHeight:cs.minHeight};
},C);
console.log(JSON.stringify({errs,before,after},null,1));
await b.close();
