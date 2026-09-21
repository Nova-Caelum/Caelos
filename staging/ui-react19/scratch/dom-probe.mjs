import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newContext({ viewport:{width:1512,height:806}, deviceScaleFactor:2, colorScheme:"dark" }).then(c=>c.newPage());
await p.goto("http://127.0.0.1:5187/?tab=studio&iteration=iter5", { waitUntil:"networkidle" });
await p.waitForTimeout(1200);
const out = await p.evaluate(() => {
  const host = document.querySelector("#i5-agent-detail .i5-card-host");
  const root = host?.querySelector("[class*=agent-detail__root]");
  const plane = host?.querySelector("[data-nc-plane=agent]");
  const sess  = host?.querySelector("[data-nc-plane=session]");
  return {
    rootClass: root?.className,
    rootAttrs: root ? Array.from(root.attributes).map(a=>a.name) : null,
    planeClass: plane?.className,
    planeAttrs: plane ? Array.from(plane.attributes).map(a=>`${a.name}=${a.value}`) : null,
    planePaddingBottom: plane ? getComputedStyle(plane).paddingBottom : null,
    sessPaddingTop: sess ? getComputedStyle(sess).paddingTop : null,
    matchesSelector: plane ? plane.matches('.caelos-header-control--kind_agentCard[data-nc-header-control] [data-nc-plane=agent]') : null,
    rootMatches: root ? root.matches('.caelos-header-control--kind_agentCard[data-nc-header-control]') : null,
  };
});
console.log(JSON.stringify(out,null,1));
await b.close();
