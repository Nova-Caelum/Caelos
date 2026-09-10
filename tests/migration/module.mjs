import { chromium } from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('/private/tmp/caelos-release-20260909', { recursive: true });
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000);
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const project={code:'migration-fixture',name:'Migration fixture',description:'Local isolated migration verification',folder_path:'/workspace/fixture',created_at:'2026-09-01T12:00:00Z',status:'in-progress',team:[],owner:'daniel'};
let failSave=false;
const modules=[];
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
      data={id:'created-uuid',project_code:project.code,...body};tasks.push(data);
    }
  }
  if(u.pathname.endsWith('/modules')) {
    data=modules;
    if(route.request().method()==='POST') {
      if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
      data={id:'module-uuid',project_code:project.code,...route.request().postDataJSON()}; modules.push(data);
    }
  }
  if(u.pathname.startsWith('/api/modules/')) data=modules.find(m=>m.external_id===decodeURIComponent(u.pathname.split('/').at(-1)));
  if(u.pathname==='/api/work-items/fixture-task') {
    if(route.request().method()==='PATCH') {
      if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
      Object.assign(tasks[0],route.request().postDataJSON());
    }
    data=tasks[0];
  }
  await route.fulfill({json:data}); return;
 }
 if(u.pathname==='/mcp'){const {params}=route.request().postDataJSON(); if(params.name==='get_module' || params.name==='upsert_module') {
   const current=modules.find(m=>m.external_id===params.arguments.external_id);
   if(params.name==='upsert_module') {
     if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
     Object.assign(current, params.arguments);
   }
   await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify(params.name === 'get_module' ? current : {row:current})}]}}});return;
 } if(params.name==='upsert_project'){ if(failSave){await route.fulfill({status:500,body:'fixture save failure'});return;} Object.assign(project,params.arguments); await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify({row:project})}]}}});return;}await route.fulfill({json:{jsonrpc:'2.0',id:1,result:{content:[{type:'text',text:'[]'}]}}}); return;}
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});

const settle=async locator=>locator.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
await page.getByRole('button',{name:'Add new',exact:true}).click();
await page.getByRole('menuitem',{name:'Module',exact:true}).click();
let dialog=page.getByRole('dialog',{name:'New Module',exact:true});await dialog.waitFor();await settle(dialog);
await dialog.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Name is required',{exact:true}).waitFor();
await dialog.getByLabel('Name',{exact:true}).fill('Module migration fixture');
await dialog.getByLabel('Description',{exact:true}).fill('Module description persists');
await dialog.getByLabel('Acceptance Criteria',{exact:true}).fill('The module is saved with its full description.');
failSave=true;await dialog.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Failed to create module',{exact:true}).waitFor();
if(await dialog.getByLabel('Name',{exact:true}).inputValue()!=='Module migration fixture')throw Error('Failure lost module draft');
failSave=false;await dialog.getByRole('button',{name:'Create',exact:true}).click();await dialog.waitFor({state:'detached'});
await page.reload();await page.getByText('Module migration fixture',{exact:true}).click();
dialog=page.getByRole('dialog');await dialog.getByLabel('Description',{exact:true}).waitFor();
await page.waitForFunction(()=>document.querySelector('textarea[name=description]')?.value==='Module description persists');
await dialog.getByLabel('Description',{exact:true}).fill('Updated module description');
failSave=true;await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByText('Failed to update module',{exact:true}).waitFor();
if(await dialog.getByLabel('Description',{exact:true}).inputValue()!=='Updated module description')throw Error('Failure lost detail draft');
failSave=false;await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByText('Module updated',{exact:true}).waitFor();
await page.setViewportSize({width:768,height:900});await settle(dialog);await page.screenshot({path:'/private/tmp/caelos-release-20260909/module-detail.png'});
await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
await page.reload();await page.getByText('Module migration fixture',{exact:true}).click();
await page.waitForFunction(()=>document.querySelector('textarea[name=description]')?.value==='Updated module description');
if(errors.length)throw Error(errors.join('\n'));console.log('PASS module create validation/failure/retry, hydration, save failure/retry/reload, narrow, Escape; zero page errors');await browser.close();
