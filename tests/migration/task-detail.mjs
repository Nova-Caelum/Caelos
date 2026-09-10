import { chromium } from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('/private/tmp/caelos-release-20260909', { recursive: true });
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000);
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const project={code:'migration-fixture',name:'Migration fixture',description:'Local isolated migration verification',folder_path:'/workspace/fixture',created_at:'2026-09-01T12:00:00Z',status:'in-progress',team:[],owner:'daniel'};
let failSave=false;
const tasks=[{id:'task-uuid',external_id:'fixture-task',project_code:project.code,name:'Verify migration interactions',state:'ready',priority:'medium',assignee_agent:'daniel',description:'Keep this draft when saving fails',acceptance_criteria:'Controls preserve their application behavior.'}];
await page.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(u.pathname.startsWith('/api/')) {
  let data=[];
  if(u.pathname==='/api/projects') data=[project];
  if(u.pathname.endsWith('/work-items')) {
    data=tasks;
    if(route.request().method()==='POST') {
      if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
      const body=route.request().postDataJSON();
      data={id:'subtask-uuid',project_code:project.code,...body,parent_work_item_id:body.parent_work_item};tasks.push(data);
    }
  }
  if(u.pathname==='/api/work-items/fixture-task') {
    if(route.request().method()==='PATCH') {
      if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
      Object.assign(tasks[0],route.request().postDataJSON());
    }
    data=tasks[0];
  }
  await route.fulfill({json:data}); return;
 }
 if(u.pathname==='/mcp'){const {params}=route.request().postDataJSON(); if(params.name==='upsert_project'){ if(failSave){await route.fulfill({status:500,body:'fixture save failure'});return;} Object.assign(project,params.arguments); await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify({row:project})}]}}});return;}await route.fulfill({json:{jsonrpc:'2.0',id:1,result:{content:[{type:'text',text:'[]'}]}}}); return;}
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});

await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193'); console.log('loaded');
const task = page.getByText('Verify migration interactions',{exact:true}); await task.waitFor(); console.log('task found');
await task.click({button:'right'});
await page.getByRole('menuitem',{name:'View / Edit'}).click();
const dialog=page.getByRole('dialog');await dialog.waitFor();console.log('dialog open');
await page.screenshot({path:'/private/tmp/caelos-release-20260909/slice2-debug.png'});
await page.getByLabel('Description',{exact:true}).fill('Saved detail description'); console.log('filled');
await dialog.getByRole('button',{name:'Save changes'}).click();
await page.getByText('Saved',{exact:true}).waitFor();
if(tasks[0].description!=='Saved detail description')throw Error('Detail save did not persist');
failSave=true;await page.getByLabel('Description',{exact:true}).fill('Retain failed detail draft');
await dialog.getByRole('button',{name:'Save changes'}).click();await page.getByText('Failed to save',{exact:true}).waitFor();
if(await page.getByLabel('Description',{exact:true}).inputValue()!=='Retain failed detail draft')throw Error('Lost failed draft');
if(await dialog.getByRole('button',{name:'Save changes'}).isDisabled())throw Error('Save stuck busy');
failSave=false;await dialog.getByRole('button',{name:'Save changes'}).click();
await page.waitForFunction(()=>!document.querySelector('[aria-busy=true]'),null,{timeout:10000});
// The quick-add path clears both fields only after accepted creation.
const subTitle=dialog.getByLabel('Subtask title',{exact:true});
const subCriteria=dialog.getByLabel('Subtask acceptance criteria',{exact:true});
await subTitle.fill('Retained child draft');await subCriteria.fill('The child keeps its own acceptance criteria.');
failSave=true;await dialog.getByRole('button',{name:'Add subtask',exact:true}).click();
await page.getByText('Failed to add subtask',{exact:true}).waitFor();
if(await subTitle.inputValue()!=='Retained child draft' || await subCriteria.inputValue()!=='The child keeps its own acceptance criteria.')throw Error('Failed child creation lost drafts');
failSave=false;await subTitle.press('Enter');
await dialog.getByRole('button',{name:'Retained child draft',exact:true}).waitFor();
if(await subTitle.inputValue()!=='')throw Error('Accepted child creation did not clear title');
if(tasks[1].acceptance_criteria!=='The child keeps its own acceptance criteria.')throw Error('Child criteria not persisted');
await page.screenshot({path:'/private/tmp/caelos-release-20260909/slice2-drawer.png'});
await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
await page.getByRole('menu').waitFor({state:'detached'});
await task.click({button:'right'});
const menu=page.locator('[role="menu"][data-state="open"]');
await menu.waitFor();
await menu.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
await page.waitForFunction(()=>document.activeElement?.closest('[role="menu"][data-state="open"]'));
await page.keyboard.press('Escape');await page.getByRole('menu').waitFor({state:'detached'});
await task.click();await dialog.waitFor();
if(await page.getByLabel('Description',{exact:true}).inputValue()!=='Retain failed detail draft')throw Error('Retry not persisted on reopen');
await page.setViewportSize({width:768,height:900});await dialog.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));await page.screenshot({path:'/private/tmp/caelos-release-20260909/slice2-narrow.png'});
await dialog.getByRole('button',{name:'Close task',exact:true}).click();await dialog.waitFor({state:'hidden'});
if(errors.length)throw Error(errors.join('\n'));console.log('PASS subtask failure/drafts/Enter/retry; detail hydration, save, failure draft, retry/reopen, context actions and Escape; zero page errors');await browser.close();
