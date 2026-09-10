import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let failSave=true,failPromotion=true,staged=null,promotionWrites=0;
await page.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(u.pathname.startsWith('/__foundry/')){
  if(u.pathname==='/__foundry/override'){
   if(failSave)return route.fulfill({status:500,json:{error:'Fixture staging failure'}});
   staged=route.request().postDataJSON();return route.fulfill({json:{ok:true}});
  }
  if(u.pathname==='/__foundry/promote'){
   if(route.request().method()==='GET')return route.fulfill({json:{currentBranch:'fixture',manualSeedDiff:false,ghReady:true}});
   promotionWrites++;await new Promise(resolve=>setTimeout(resolve,450));
   if(failPromotion)return route.fulfill({status:500,json:{error:'Fixture promotion failure'}});
   return route.fulfill({json:{branch:'fixture-local-only',prUrl:'https://example.invalid/fixture',manualSeedDiff:false}});
  }
  return route.fulfill({status:400,json:{error:'Unexpected Foundry endpoint'}});
 }
 if(u.pathname.startsWith('/api/')||u.pathname==='/mcp')return route.fulfill({json:[]});
 if(!['localhost','127.0.0.1'].includes(u.hostname))return route.abort();
 await route.continue();
});
try {
 await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193/?foundry=1');
 const panel=page.getByTestId('foundry-panel');await panel.waitFor();
 await page.getByRole('button',{name:'Collapse Foundry',exact:true}).click();
 await page.waitForTimeout(350);
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Reveal Foundry');
 assert.equal(await panel.getAttribute('inert'),'');
 await page.reload();await page.getByRole('button',{name:'Reveal Foundry',exact:true}).click();await page.waitForTimeout(350);
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Collapse Foundry');
 const select=page.getByRole('combobox',{name:'Test against',exact:true});
 await select.click();const empty=page.getByRole('option',{name:'Empty state',exact:true});await empty.waitFor();await page.waitForTimeout(250);
 assert.ok(await empty.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Target selector is behind Foundry');
 await empty.click();assert.equal(await page.evaluate(()=>localStorage.getItem('caelos.foundryTarget')),null);
 await select.click();await page.getByRole('option',{name:/Project · Foundry calibration/}).click();
 assert.ok(await page.evaluate(()=>localStorage.getItem('caelos.foundryTarget')));
 await page.getByRole('button',{name:'Legacy app tuning',exact:true}).click();
 const ledger=page.getByRole('button',{name:/Token ledger ·/});
 await ledger.click();assert.equal(await ledger.getAttribute('aria-expanded'),'true');
 await ledger.press('Enter');assert.equal(await ledger.getAttribute('aria-expanded'),'false');
 const hex=page.getByRole('textbox',{name:'Ground hex',exact:true});await hex.fill('#121826');await hex.press('Enter');
 assert.equal(await hex.inputValue(),'#121826');
 await page.getByRole('button',{name:'Save to staging',exact:true}).click();await page.getByText('Fixture staging failure',{exact:true}).waitFor();
 assert.equal(await hex.inputValue(),'#121826');
 failSave=false;await page.getByRole('button',{name:'Save to staging',exact:true}).click();await page.getByText('Foundry proposal saved to staging',{exact:true}).waitFor();assert.ok(staged?.color);
 const launcher=page.getByRole('button',{name:'Commit + Push',exact:true});await launcher.click();
 let dialog=page.getByRole('dialog',{name:'Commit + Push',exact:true});await dialog.waitFor();
 await page.waitForTimeout(350);assert.ok(await dialog.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Promotion is behind Foundry');
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.ok(await launcher.evaluate(e=>e===document.activeElement));
 await launcher.click();await dialog.getByRole('button',{name:'Create branch + PR',exact:true}).click();await page.keyboard.press('Escape');assert.ok(await dialog.isVisible(),'Busy promotion dismissed');
 await dialog.getByText('Fixture promotion failure',{exact:true}).waitFor();assert.equal(promotionWrites,1);
 failPromotion=false;await dialog.getByRole('button',{name:'Create branch + PR',exact:true}).click();await dialog.getByText('Promotion PR opened',{exact:true}).waitFor();assert.equal(promotionWrites,2);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/private/tmp/caelos-release-20260909/foundry-promotion-narrow.png'});
 const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=390);
 await dialog.getByRole('button',{name:'Close promotion dialog',exact:true}).click();await dialog.waitFor({state:'hidden'});
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Legacy app tuning',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'/private/tmp/caelos-release-20260909/foundry-admin.png'});
 assert.deepEqual(errors,[]);console.log('PASS Foundry target selector/stacking, collapse persistence/focus, staging draft/failure/retry, promotion dismissal/busy/failure/retry and narrow bounds; all writes intercepted');
} catch(e){await page.screenshot({path:'/private/tmp/caelos-release-20260909/foundry-admin-failure.png'});throw e;} finally {await browser.close();}
