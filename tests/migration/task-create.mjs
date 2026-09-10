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
      data={id:'created-'+tasks.length,project_code:project.code,...body,parent_work_item_id:body.parent_work_item};tasks.push(data);
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

const settle=async locator=>locator.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
const add=page.getByRole('button',{name:'Add new',exact:true});await add.click();
await page.getByRole('menuitem',{name:'Task',exact:true}).click();
const dialog=page.getByRole('dialog',{name:'New Task',exact:true});await dialog.waitFor();await settle(dialog);
await dialog.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Title is required',{exact:true}).waitFor();
await dialog.getByLabel('Title',{exact:true}).fill('Created by migration fixture');
await dialog.getByLabel('Description',{exact:true}).fill('Description retained across failed create');
await dialog.getByLabel('Acceptance Criteria',{exact:true}).fill('A saved task appears and survives reload.');
await dialog.getByLabel('State',{exact:true}).click();await page.getByRole('option',{name:'In Progress',exact:true}).click();
await dialog.getByLabel('Related document path',{exact:true}).fill('/notes/create.md');
await dialog.getByRole('button',{name:'Add related document',exact:true}).click();
failSave=true;await dialog.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Failed to create task',{exact:true}).waitFor();
if(await dialog.getByLabel('Title',{exact:true}).inputValue()!=='Created by migration fixture')throw Error('Create failure lost title');
if(await dialog.getByRole('button',{name:'Create',exact:true}).isDisabled())throw Error('Create remained busy');
await page.screenshot({path:'/private/tmp/caelos-release-20260909/create-desktop.png'});
await page.setViewportSize({width:390,height:844});await settle(dialog);await page.screenshot({path:'/private/tmp/caelos-release-20260909/create-narrow.png'});
const box=await dialog.boundingBox();if(box.x<0||box.x+box.width>391||box.height>845)throw Error('Dialog exceeds viewport');
failSave=false;await dialog.getByRole('button',{name:'Create',exact:true}).click();await dialog.waitFor({state:'detached'});
if(tasks.at(-1).state!=='in-progress'||tasks.at(-1).description!=='Description retained across failed create')throw Error('Create payload lost fields');
if(JSON.stringify(tasks.at(-1).source_references)!==JSON.stringify([{uri:'/notes/create.md'}]))throw Error('Create document mapping failed');
await page.setViewportSize({width:1440,height:1000});await page.reload();await page.getByText('Created by migration fixture',{exact:true}).waitFor();
await add.click();await page.getByRole('menuitem',{name:'Task',exact:true}).click();await dialog.waitFor();await settle(dialog);if(await dialog.getByRole('button',{name:'Remove /notes/create.md',exact:true}).count())throw Error('New form retained previous docs');await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Add new');
await page.locator('[data-task-id="fixture-task"]').click({button:'right'});
await page.getByRole('menuitem',{name:'Add Subtask',exact:true}).click();
const sub=page.getByRole('dialog',{name:'New Subtask',exact:true});await settle(sub);
await sub.getByLabel('Title',{exact:true}).fill('Created subtask with docs');
await sub.getByLabel('Related document path',{exact:true}).fill('/notes/subtask.md');
await sub.getByRole('button',{name:'Add related document',exact:true}).click();
await sub.getByRole('button',{name:'Create',exact:true}).click();await sub.waitFor({state:'detached'});
if(tasks.at(-1).parent_work_item!=='fixture-task')throw Error('Subtask lost parent');
if(JSON.stringify(tasks.at(-1).source_references)!==JSON.stringify([{uri:'/notes/subtask.md'}]))throw Error('Subtask lost docs');
await page.reload();await page.locator('[data-task-id="fixture-task"]').getByRole('button',{name:'Expand Verify migration interactions',exact:true}).click();
await page.getByText('Created subtask with docs',{exact:true}).waitFor();
if(errors.length)throw Error(errors.join('\n'));console.log('PASS create validation, state, failure draft/retry, reload, narrow bounds, Escape; zero page errors');await browser.close();
