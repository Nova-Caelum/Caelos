import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const foundryUrl = process.env.FOUNDRY_URL || 'http://127.0.0.1:5183/?foundry=1';
const rebuildUrl = new URL('/__foundry/rebuild-ui', foundryUrl).href;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const results=[];
async function test(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name)}catch(e){results.push({name,pass:false,error:e.message});console.log('FAIL',name,e.message)}}
const visibleFront=async l=>{await l.waitFor(); await page.waitForTimeout(400); assert.ok(await l.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),'Popover is behind another surface')};
await page.goto(foundryUrl);
const gallery=page.locator('.foundry-panda'); await gallery.waitFor();
const composer=gallery.locator('[data-composer-demo]');
await test('Built Panda styles and approved typography',async()=>{
 const style=await gallery.getByRole('button',{name:'Create project',exact:true}).evaluate(e=>({cls:e.className,font:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight}));
 assert.match(style.cls,/caelos-button/);assert.match(style.font,/IBM Plex Sans/);assert.equal(style.weight,'650');
 assert.equal(await gallery.locator('.caelos-card--variant_glass').first().evaluate(e=>getComputedStyle(e).backdropFilter),'blur(19px) saturate(1.2)');
});
await test('Permission menu stays open and sits above Foundry',async()=>{
 await composer.getByRole('button',{name:'Permissions: Ask before acting'}).click();
 const option=page.getByRole('menuitemradio',{name:'Full access',exact:true});
 await page.waitForTimeout(450); await visibleFront(option); await option.click();
 await composer.getByRole('button',{name:'Permissions: Full access'}).waitFor();
});
await test('Model and reasoning can be changed inside the panel',async()=>{
 await composer.getByRole('button',{name:/Model and reasoning:/}).click();
 await composer.getByRole('button',{name:'Model: GPT-6 Astra',exact:true}).click();
 const model=page.getByRole('menuitemradio',{name:'GPT-5.6 Sol',exact:true});await visibleFront(model);await model.click();
 await composer.getByRole('button',{name:'Reasoning: High',exact:true}).click();
 const low=page.getByRole('menuitemradio',{name:'Low',exact:true});await visibleFront(low);await low.click();
 assert.match(await composer.getByRole('button',{name:/Model and reasoning:/}).getAttribute('aria-label'),/GPT-5.6 Sol, Low/);await page.keyboard.press('Escape');
});
await test('Reply selector and demo send',async()=>{
 const trigger=composer.getByRole('button',{name:'Reply format: Text',exact:true});await trigger.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('End');await page.keyboard.press('Enter');
 await composer.getByRole('button',{name:'Reply format: Text + voice',exact:true}).waitFor();
 const text=composer.getByRole('textbox',{name:'Message'});await text.fill('Foundry integration check');await text.press('Enter');
 assert.match(await composer.locator('output').innerText(),/Preview send: Foundry integration check.*both/);
});
await test('Light theme reaches portal menus and approved glass settings',async()=>{
 await gallery.getByRole('button',{name:'Switch to light',exact:true}).click();
 assert.equal(await gallery.locator('.caelos-card--variant_glass').first().evaluate(e=>getComputedStyle(e).backdropFilter),'blur(2px) saturate(1.2)');
 await composer.getByRole('button',{name:'Permissions: Full access'}).click();
 assert.equal(await page.getByRole('menu').getAttribute('data-caelos-theme'),'light');await page.waitForTimeout(400);await page.keyboard.press('Escape');await page.getByRole('menu').waitFor({state:'hidden'});
 await gallery.getByRole('button',{name:'Switch to dark',exact:true}).click();
});
await test('Tooltip is visible above Foundry',async()=>{
 const trigger=gallery.getByRole('button',{name:'Project reference',exact:true});await trigger.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForTimeout(100);await trigger.hover();
 await page.getByRole('tooltip').waitFor();assert.match(await page.getByRole('tooltip').innerText(),/CAE-208/);
 await page.mouse.move(0,0);
});
await test('Legacy tuning is separated from the package gallery',async()=>{
 await page.getByRole('button',{name:'Legacy app tuning',exact:true}).click();
 assert.equal(await gallery.count(),0);await page.getByLabel('Ground hex',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Components',exact:true}).click();await gallery.waitFor();
 assert.equal(await page.getByRole('button',{name:'Save to staging',exact:true}).count(),0);
});
await test('Rebuild rejects foreign origins and wrong methods',async()=>{
 let r=await page.request.post(rebuildUrl,{headers:{Origin:'https://example.com','X-Caelos-Foundry':'rebuild-ui'}});assert.equal(r.status(),403);
 r=await page.request.get(rebuildUrl,{headers:{'X-Caelos-Foundry':'rebuild-ui'}});assert.equal(r.status(),405);
});
if (process.env.SKIP_FOUNDRY_REBUILD === '1') {
 console.log('SKIP real rebuild/refresh: explicit SKIP_FOUNDRY_REBUILD=1');
} else await test('Rebuild compiles the package and refreshes the Foundry',async()=>{
 await gallery.getByRole('button',{name:'Rebuild library',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.foundry-panda [role=status]')?.textContent?.startsWith('Library rebuilt'),{},{timeout:120000});
 await gallery.getByRole('button',{name:'Rebuild library',exact:true}).waitFor();
});
await test('No browser runtime errors',async()=>assert.deepEqual(errors,[]));
console.log(JSON.stringify(results,null,2));
await browser.close();
process.exit(results.some(r=>!r.pass)?1:0);
