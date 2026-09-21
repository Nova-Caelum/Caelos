import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1512,height:806}, deviceScaleFactor:2, colorScheme:"dark" });
for (const [name,url] of [["ATLAS2","http://127.0.0.1:5183/"],["ATLAS3","http://127.0.0.1:5187/?tab=studio&iteration=iter5"]]) {
  const p = await ctx.newPage();
  const fonts=[];
  p.on("response", r => { if (/\.(woff2?|ttf|otf)(\?|$)/.test(r.url())) fonts.push(r.url()); });
  await p.goto(url,{waitUntil:"networkidle"}); await p.waitForTimeout(1500);
  console.log(name, "font requests:");
  for (const f of [...new Set(fonts)].slice(0,10)) console.log("   ", f.replace(/^http:\/\/127\.0\.0\.1:\d+/,""));
  await p.close();
}
await b.close();
