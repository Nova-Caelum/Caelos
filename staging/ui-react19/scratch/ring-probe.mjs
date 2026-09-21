import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1512,height:806}, deviceScaleFactor:2, colorScheme:"dark" });
const go = async (url, cardTrigger, avatar) => {
  const p = await ctx.newPage();
  await p.goto(url,{waitUntil:"networkidle"}); await p.waitForTimeout(1200);
  await p.click(cardTrigger); await p.waitForTimeout(900);
  await p.click(avatar); await p.waitForTimeout(900);
  return p;
};
const S=".wrap-frame > .wrap-candidate:nth-of-type(1)", P="#i5-conversation-header .i5-header-candidate:nth-of-type(1)";
const sp = await go("http://127.0.0.1:5183/", `${S} .conversation-trigger`, `${S} .agent-avatar-button`);
const pk = await go("http://127.0.0.1:5187/?tab=studio&iteration=iter5", `${P} [class*=__trigger]`, `${P} [class*=__avatarButton]`);
const ring = (page, host, svgSel, trackSel) => page.evaluate(({host,svgSel,trackSel})=>{
  const h=document.querySelector(host); if(!h) return null;
  const svg=h.querySelector(svgSel); if(!svg) return {err:"no svg"};
  const rects=[...svg.querySelectorAll("rect")].map(r=>{const c=getComputedStyle(r);return{
    cls:r.getAttribute("class"), rx:r.getAttribute("rx"), dash:r.getAttribute("stroke-dasharray"),
    pathLength:r.getAttribute("pathLength"), transform:r.getAttribute("transform"),
    stroke:c.stroke, strokeWidth:c.strokeWidth, opacity:c.opacity, fill:c.fill, strokeLinecap:c.strokeLinecap};});
  const cs=getComputedStyle(svg), r=svg.getBoundingClientRect();
  return {svg:{w:+r.width.toFixed(2),h:+r.height.toFixed(2),color:cs.color,position:cs.position,inset:cs.inset,overflow:cs.overflow,stroke:cs.stroke,fill:cs.fill,strokeWidth:cs.strokeWidth}, rects};
},{host,svgSel,trackSel});
const out = {
  specimen: await ring(sp, ".agent-detail-popover .profile-avatar", "svg"),
  packaged: await ring(pk, '[data-header-owner="i5-header-capsule"][data-nc-detail-host] [class*=agent-detail__avatar]', "svg"),
};
console.log(JSON.stringify(out,null,1));
await b.close();
