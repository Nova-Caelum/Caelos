import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1512,height:806}, deviceScaleFactor:2, colorScheme:"dark" });
const read = async (url, sel) => {
  const p = await ctx.newPage();
  await p.goto(url,{waitUntil:"networkidle"}); await p.waitForTimeout(1200);
  const out = await p.evaluate(s=>{
    const btn=document.querySelector(s);
    if(!btn) return null;
    const label=btn.querySelector("span");
    const cs=getComputedStyle(btn), ls=label?getComputedStyle(label):null;
    const range=document.createRange(); range.selectNodeContents(label.firstChild||label);
    const tr=range.getBoundingClientRect();
    const cv=document.createElement("canvas").getContext("2d");
    cv.font=`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return {
      btnW:+btn.getBoundingClientRect().width.toFixed(4),
      labelW:label?+label.getBoundingClientRect().width.toFixed(4):null,
      textRangeW:+tr.width.toFixed(4),
      canvasW:+cv.measureText(label.textContent).width.toFixed(4),
      font:`${cs.fontStyle}|${cs.fontWeight}|${cs.fontSize}|${cs.fontFamily}`,
      ls:cs.letterSpacing, ws:cs.wordSpacing, pad:cs.padding, bw:cs.borderWidth,
      labelFont:ls?`${ls.fontWeight}|${ls.fontSize}|${ls.fontFamily}|${ls.letterSpacing}|${ls.wordSpacing}`:null,
      text:JSON.stringify(label.textContent),
      fontsReady: document.fonts.status,
      loaded: [...document.fonts].filter(f=>f.status==="loaded").map(f=>`${f.family} ${f.weight} ${f.style}`).slice(0,12),
    };
  }, sel);
  await p.close(); return out;
};
const spec = await read("http://127.0.0.1:5183/", ".wrap-frame > .wrap-candidate:nth-of-type(1) .linked-work-trigger");
const pack = await read("http://127.0.0.1:5187/?tab=studio&iteration=iter5", "#i5-conversation-header .i5-header-candidate:nth-of-type(1) [class*=linkedWorkTrigger]");
console.log(JSON.stringify({spec,pack},null,1));
await b.close();
