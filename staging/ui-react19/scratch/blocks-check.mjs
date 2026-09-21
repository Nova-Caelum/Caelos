import { chromium } from "playwright";
const b=await chromium.launch();
const p=await (await b.newContext({viewport:{width:1512,height:806},deviceScaleFactor:2,colorScheme:"dark"})).newPage();
const errs=[]; p.on("console",m=>m.type()==="error"&&errs.push(m.text())); p.on("pageerror",e=>errs.push("PAGEERROR "+e.message));
await p.goto("http://127.0.0.1:5187/?tab=studio&iteration=iter5",{waitUntil:"networkidle"}); await p.waitForTimeout(1500);
const out=await p.evaluate(()=>{
  const ids=["i5-conversation-header","i5-agent-detail","i5-working-files"];
  const r={};
  for(const id of ids){const el=document.getElementById(id);
    r[id]=el?{present:true,h:+el.getBoundingClientRect().height.toFixed(0),
      headers:[...el.querySelectorAll("[data-nc-conversation-card]")].length,
      cards:[...el.querySelectorAll("[class*=agent-detail__root]")].length,
      fileRows:[...el.querySelectorAll("[class*=working-files__row]")].length}:{present:false};}
  r.allTabPairs=[...document.querySelectorAll("[data-pair]")].map(e=>e.getAttribute("data-pair"));
  return r;
});
console.log(JSON.stringify({errs,out},null,1));
await b.close();
