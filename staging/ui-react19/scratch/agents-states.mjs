/** Six-agent + state coverage pass. specimen 5183 vs packaged 5187, 1512x806 DPR2 dark. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = "/Users/danieleghdami/NovaCaelum_Obs/_launchers/da-vinci/.playwright-mcp";
mkdirSync(OUT, { recursive: true });
const P = ["display","position","width","height","padding","margin","border","borderRadius","background",
 "backgroundImage","boxShadow","opacity","color","fontFamily","fontSize","fontWeight","lineHeight",
 "letterSpacing","wordSpacing","gap","gridTemplateColumns","transform","zIndex","minHeight","flexWrap",
 "stroke","strokeWidth","fill","alignItems","justifyContent","textAlign"];
const settle=(p,ms=800)=>p.waitForTimeout(ms);
const probe=(page,sel,root)=>page.evaluate(({sel,root,P})=>{
  const sc=root?document.querySelector(root):document; const el=sc&&sc.querySelector(sel); if(!el) return null;
  const r=el.getBoundingClientRect(), c=getComputedStyle(el); const o={w:+r.width.toFixed(2),h:+r.height.toFixed(2)};
  for(const p of P) o[p]=c[p]; return o;},{sel,root,P});
const diff=(a,b)=>{ if(!a||!b) return [`MISSING ${!a?'specimen':''}${!b?' packaged':''}`];
  const o=[]; for(const k of Object.keys(a)){ if(k==='w'||k==='h'){ if(Math.abs(a[k]-b[k])>0.5) o.push(`${k}: ${a[k]} vs ${b[k]}`); continue;} if(a[k]!==b[k]) o.push(`${k}: ${a[k]} vs ${b[k]}`);} return o;};

const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1512,height:806},deviceScaleFactor:2,colorScheme:"dark"});
const spec=await ctx.newPage(), pack=await ctx.newPage();
const errs={specimen:[],packaged:[]};
spec.on("console",m=>m.type()==="error"&&errs.specimen.push(m.text()));
pack.on("console",m=>m.type()==="error"&&errs.packaged.push(m.text()));
spec.on("pageerror",e=>errs.specimen.push("PAGEERROR "+e.message));
pack.on("pageerror",e=>errs.packaged.push("PAGEERROR "+e.message));
await spec.goto("http://127.0.0.1:5183/",{waitUntil:"networkidle"});
await pack.goto("http://127.0.0.1:5187/?tab=studio&iteration=iter5",{waitUntil:"networkidle"});
await settle(spec,1200); await settle(pack,1200);
const S=".wrap-frame > .wrap-candidate:nth-of-type(1)", K="#i5-conversation-header .i5-header-candidate:nth-of-type(1)";
const CARD='[data-header-owner="i5-header-capsule"][data-nc-detail-host]';
const R={consoleErrors:errs};

// count 6, pin capsule
await spec.click('.wrap-counts button[aria-label="6 participants"]');
await pack.click('#i5-conversation-header .i2-controls button[aria-label="6 participants"]');
await settle(spec,600); await settle(pack,600);
await spec.click(`${S} .conversation-trigger`); await pack.click(`${K} [class*=__trigger]`);
await settle(spec,1000); await settle(pack,1000);

// ── 1. all six rings + badges at once ───────────────────────────────────────────────────
const rings=(page,root,ringSel,badgeSel)=>page.evaluate(({root,ringSel,badgeSel})=>{
  const sc=document.querySelector(root);
  return {
    rings:[...sc.querySelectorAll(ringSel)].map(svg=>{const c=getComputedStyle(svg);
      const arc=[...svg.querySelectorAll("rect")][1];
      return {color:c.color, dash:arc?.getAttribute("stroke-dasharray"), rx:arc?.getAttribute("rx")};}),
    badges:[...sc.querySelectorAll(badgeSel)].map(e=>{const c=getComputedStyle(e);
      return {text:e.textContent, bg:c.backgroundColor, attention:e.getAttribute("data-attention"), w:+e.getBoundingClientRect().width.toFixed(2)};}),
  };},{root,ringSel,badgeSel});
R.sixAgents={
  specimen: await rings(spec,S,".wrap-participant-field .agent-context-ring",".agent-status-badge"),
  packaged: await rings(pack,K,"[class*=participantField] [class*=__contextRing]","[class*=__statusBadge]"),
};
R.sixAgentsDiff = JSON.stringify(R.sixAgents.specimen)===JSON.stringify(R.sixAgents.packaged) ? "IDENTICAL" : "SEE ABOVE";

// ── 2. each of the six agent cards ──────────────────────────────────────────────────────
const CARDSELS=[["root",".agent-card-v2","[class*=agent-detail__root]"],
 ["agentPlane",".profile-agent-plane","[data-nc-plane=agent]"],["sessionPlane",".profile-session-plane","[data-nc-plane=session]"],
 ["avatar",".profile-avatar","[class*=agent-detail__avatar]"],["name",".profile-name","[class*=agent-detail__name]"],
 ["subtitle",".profile-subtitle","[class*=agent-detail__subtitle]"],["surfaceBtn",".profile-surface","[class*=agent-detail__surface]"],
 ["status",".profile-status","[class*=agent-detail__status]:not([class*=statusControls])"],
 ["contextLabel",".profile-context-label","[class*=agent-detail__contextLabel]"],
 ["progress","progress","progress"],["contextUnknown",".profile-context-unknown","[class*=contextUnknown]"],
 ["workTrigger",".profile-work-trigger","[class*=agent-detail__workTrigger]"],
 ["liveItem",".profile-live-item","[class*=agent-detail__liveItem]"]];
R.perAgent=[];
for(let i=0;i<6;i++){
  await spec.click(`${S} .wrap-participant-field > div:nth-child(${i+1}) .agent-avatar-button`);
  await pack.click(`${K} [class*=participantField] > div:nth-child(${i+1}) [class*=__avatarButton]`);
  await settle(spec,900); await settle(pack,900);
  const rows=[];
  for(const [n,ss,ps] of CARDSELS){
    const a=await probe(spec,ss,".agent-detail-popover"), z=await probe(pack,ps,CARD);
    if(a===null&&z===null) { rows.push({part:n,both:"absent"}); continue; }
    const d=diff(a,z); if(d.length) rows.push({part:n,diff:d});
  }
  const ringInCard=async(pg,root,sel)=>pg.evaluate(({root,sel})=>{const s=document.querySelector(root);const svg=s&&s.querySelector(sel);
    if(!svg)return null;const arc=[...svg.querySelectorAll("rect")][1];return {color:getComputedStyle(svg).color,dash:arc?.getAttribute("stroke-dasharray")};},{root,sel});
  const rs=await ringInCard(spec,".agent-detail-popover",".profile-avatar svg");
  const rp=await ringInCard(pack,CARD,"[class*=agent-detail__avatar] svg");
  rows.push({part:"cardRing", specimen:rs, packaged:rp, match:JSON.stringify(rs)===JSON.stringify(rp)});
  const names=["Hermes","Athena","Design Lead","Engineer","Research","Reviewer"];
  R.perAgent.push({i,name:names[i],mismatches:rows.filter(r=>r.diff||r.match===false)});
}

// ── 3. states on agent 0: status hover/click, bot mark, background open, files open ─────
await spec.click(`${S} .wrap-participant-field > div:nth-child(1) .agent-avatar-button`);
await pack.click(`${K} [class*=participantField] > div:nth-child(1) [class*=__avatarButton]`);
await settle(spec,900); await settle(pack,900);
const states={};
// status hover -> tooltip word
await spec.hover('.agent-detail-popover .profile-status'); await pack.hover(`${CARD} [class*=agent-detail__status]:not([class*=statusControls])`);
await settle(spec,900); await settle(pack,900);
const tip=(pg)=>pg.evaluate(()=>{const t=document.querySelector('[data-radix-popper-content-wrapper] [class*=tooltip]')||document.querySelector('[role=tooltip]');
  return t?{text:t.textContent,fontSize:getComputedStyle(t).fontSize}:null;});
states.statusTooltip={specimen:await tip(spec),packaged:await tip(pack)};
// status click -> detail popover
await spec.click('.agent-detail-popover .profile-status'); await pack.click(`${CARD} [class*=agent-detail__status]:not([class*=statusControls])`);
await settle(spec,900); await settle(pack,900);
const small=(pg,sel)=>pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e),r=e.getBoundingClientRect();
  return {w:+r.width.toFixed(2),padding:c.padding,zIndex:c.zIndex,fontSize:c.fontSize,maxWidth:c.maxWidth,text:e.textContent.slice(0,60)};},sel);
states.statusDetail={specimen:await small(spec,'.profile-small-popover'),packaged:await small(pack,'[class*=kind_smallPopover]')};
// bot mark
await spec.keyboard.press("Escape"); await pack.keyboard.press("Escape"); await settle(spec,600); await settle(pack,600);
await spec.click('.agent-detail-popover .profile-status[aria-label^="Subagents"]').catch(()=>{});
await pack.click(`${CARD} [aria-label^="Subagents"]`).catch(()=>{});
await settle(spec,900); await settle(pack,900);
states.botMark={specimen:await small(spec,'.profile-subagents-popover'),packaged:await small(pack,'[data-detail=subagents]')};
await spec.keyboard.press("Escape"); await pack.keyboard.press("Escape"); await settle(spec,600); await settle(pack,600);
// background + working files rows open
const openRow=async(pg,root,label,ss)=>{ await pg.click(`${root} section[aria-label="${label}"] ${ss}`).catch(()=>{}); };
await openRow(spec,".agent-detail-popover","Background",".profile-work-trigger");
await openRow(pack,CARD,"Background","[class*=agent-detail__workTrigger]");
await openRow(spec,".agent-detail-popover","Working files",".profile-work-trigger");
await openRow(pack,CARD,"Working files","[class*=agent-detail__workTrigger]");
await settle(spec,900); await settle(pack,900);
states.workContent={specimen:await probe(spec,".profile-work-content",".agent-detail-popover"),packaged:await probe(pack,"[class*=workContent]",CARD)};
states.workContentDiff=diff(states.workContent.specimen,states.workContent.packaged);
// the hidden Section header inside the card
const hdr=(pg,root,sel)=>pg.evaluate(({root,sel})=>{const s=document.querySelector(root);const e=s&&s.querySelector(sel);
  return e?getComputedStyle(e).display:null;},{root,sel});
states.filesSectionHeader={specimen:await hdr(spec,".agent-detail-popover",".agent-working-files > header"),
  packaged:await hdr(pack,CARD,"[data-nc-files] > section > header")};
// file row now visible: the recorded §5.1 discrepancy
states.fileRow={specimen:await probe(spec,".working-file-open",".agent-detail-popover"),packaged:await probe(pack,"[class*=working-files__open]",CARD)};
states.fileRowDiff=diff(states.fileRow.specimen,states.fileRow.packaged);
R.states=states;
// crops WITH the row open
await spec.locator(".agent-detail-popover").screenshot({path:`${OUT}/hdr-filerow-SPECIMEN.png`});
await pack.locator(CARD).screenshot({path:`${OUT}/hdr-filerow-PACKAGED.png`});
// standalone list keeps its header
R.standaloneHeader=await pack.evaluate(()=>{const e=document.querySelector("#i5-working-files section > header");return e?getComputedStyle(e).display:null;});

// ── 4. tab order, pinned ────────────────────────────────────────────────────────────────
const tabWalk=async(pg,startSel)=>{ await pg.click(startSel); const seq=[];
  for(let i=0;i<7;i++){ await pg.keyboard.press("Tab"); await pg.waitForTimeout(160);
    seq.push(await pg.evaluate(()=>{const a=document.activeElement; if(!a)return null;
      return (a.getAttribute("aria-label")||a.textContent||a.tagName).trim().slice(0,34);})); }
  return seq; };
await spec.keyboard.press("Escape"); await pack.keyboard.press("Escape"); await settle(spec,800); await settle(pack,800);
R.tabOrder={specimen:await tabWalk(spec,`${S} .conversation-trigger`),packaged:await tabWalk(pack,`${K} [class*=__trigger]`)};
console.log(JSON.stringify(R,null,1));
await b.close();
