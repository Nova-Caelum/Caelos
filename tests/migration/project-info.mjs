import { chromium } from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('/private/tmp/caelos-release-20260909', { recursive: true });
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const project={code:'migration-fixture',name:'Migration fixture',description:'Local isolated migration verification',folder_path:'/workspace/fixture',created_at:'2026-09-01T12:00:00Z',status:'in-progress',team:[],owner:'daniel'};
let failSave=false;
const tasks=[{id:'task-uuid',external_id:'fixture-task',project_code:project.code,name:'Verify migration interactions',state:'ready',priority:'medium',assignee_agent:'daniel',description:'Keep this draft when saving fails',acceptance_criteria:'Controls preserve their application behavior.'}];
await page.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(u.pathname.startsWith('/api/')) {
  let data=[];
  if(u.pathname==='/api/projects') data=[project];
  if(u.pathname.endsWith('/work-items')) data=tasks;
  await route.fulfill({json:data}); return;
 }
 if(u.pathname==='/mcp'){const {params}=route.request().postDataJSON(); if(params.name==='upsert_project'){ if(failSave){await route.fulfill({status:500,body:'fixture save failure'});return;} Object.assign(project,params.arguments); await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify({row:project})}]}}});return;}await route.fulfill({json:{jsonrpc:'2.0',id:1,result:{content:[{type:'text',text:'[]'}]}}}); return;}
 if(process.env.VERIFY_REMOTE_FONTS==='1' && ['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)){await route.continue();return;}
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});
await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193'); await page.getByText('Verify migration interactions',{exact:true}).waitFor();
await page.getByRole('button',{name:'Change status: In Progress',exact:true}).click();
await page.getByRole('menuitemradio',{name:'Paused',exact:true}).click();
await page.getByRole('button',{name:'Change status: Paused',exact:true}).waitFor();
await page.reload();await page.getByRole('button',{name:'Change status: Paused',exact:true}).waitFor();
failSave=true;
await page.getByRole('button',{name:'Change status: Paused',exact:true}).click();
await page.getByRole('menuitemradio',{name:'Completed',exact:true}).click();
await page.getByText('Failed to update project',{exact:true}).waitFor();
await page.getByRole('button',{name:'Change status: Paused',exact:true}).waitFor();
failSave=false;
await page.getByRole('button',{name:'Change status: Paused',exact:true}).click();
await page.getByRole('menuitemradio',{name:'In Progress',exact:true}).click();
await page.getByRole('button',{name:'Change status: In Progress',exact:true}).waitFor();
await page.getByRole('tab',{name:'Tasks',exact:true}).focus();
await page.keyboard.press('ArrowLeft');
await page.getByRole('tabpanel').getByLabel('Name',{exact:true}).waitFor();
if(await page.getByRole('tab',{name:'Info',exact:true}).getAttribute('aria-selected')!=='true')throw Error('Keyboard tab navigation lost selection');
const save=page.getByRole('button',{name:'Save changes',exact:true});
if(!await save.isDisabled())throw Error('Clean form must disable save');
await page.getByLabel('Name',{exact:true}).fill('Saved migration name');
await page.getByLabel('Status',{exact:true}).click();await page.getByRole('option',{name:'Paused',exact:true}).click();
await save.click();await page.getByText('Project updated',{exact:true}).waitFor();
await page.reload();await page.getByRole('tab',{name:'Info',exact:true}).click();
if(await page.getByLabel('Name',{exact:true}).inputValue()!=='Saved migration name')throw Error('Saved name did not survive reload');
if(!await page.getByRole('combobox',{name:'Status',exact:true}).innerText().then(x=>x.includes('Paused')))throw Error('Status did not persist');
if(await page.getByLabel('Description',{exact:true}).getAttribute('rows')!=='8')throw Error('Info description lost eight-row size');
if(await page.getByLabel('Description',{exact:true}).evaluate(e=>getComputedStyle(e).resize)!=='vertical')throw Error('Info description lost vertical resize');
failSave=true;await page.getByLabel('Description',{exact:true}).fill('Retain my draft');await save.click();
await page.getByText('Failed to update project',{exact:true}).waitFor();
if(await page.getByLabel('Description',{exact:true}).inputValue()!=='Retain my draft')throw Error('Failure lost draft');
failSave=false;await save.click();await page.getByText('Project updated',{exact:true}).waitFor();
await page.getByText('daniel',{exact:true}).last().waitFor();
await page.getByRole('button',{name:'Manage in Team tab',exact:true}).click();
if(await page.getByRole('tab',{name:'Team',exact:true}).getAttribute('aria-selected')!=='true')throw Error('Manage team lost navigation');
await page.getByRole('tab',{name:'Info',exact:true}).click();
if(process.env.VERIFY_REMOTE_FONTS==='1') {
 const loaded=await page.evaluate(async()=> (await document.fonts.load('500 13px "IBM Plex Sans"')).length);
 if(!loaded)throw Error('Application font did not download');
 console.log('PASS application IBM Plex Sans downloaded');
}
const panel=page.getByRole('tabpanel');
console.log('Info panel before visual reset',await panel.evaluate(el=>({scrollTop:el.scrollTop,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight})));
await panel.evaluate(el=>{el.scrollTop=0;});
const nameLabel=panel.locator('label').filter({hasText:/^Name$/});
const panelBounds=await panel.boundingBox(), labelBounds=await nameLabel.boundingBox();
if(!panelBounds || !labelBounds || labelBounds.y < panelBounds.y)throw Error('Name label clipped at top of Info panel');
await page.screenshot({path:'/private/tmp/caelos-release-20260909/slice1-info.png'});
await page.setViewportSize({width:768,height:900});await page.screenshot({path:'/private/tmp/caelos-release-20260909/slice1-narrow.png'});
if(errors.length)throw Error(errors.join('\n'));console.log('PASS Info labels, clean disabled, name/status save+reload, failure draft retention and retry; zero page errors');await browser.close();
