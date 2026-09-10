import { chromium } from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('/private/tmp/caelos-release-20260909', { recursive: true });
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000);
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const project={code:'migration-fixture',name:'Migration fixture',description:'Local isolated migration verification',folder_path:'/workspace/fixture',created_at:'2026-09-01T12:00:00Z',status:'in-progress',team:[],owner:'daniel'};
let failSave=false;let failHydration=false;const patches=[];
const tasks=[{id:'task-uuid',external_id:'fixture-task',project_code:project.code,name:'Verify migration interactions',state:'ready',source_references:[{uri:'/notes/existing.md',anchor:'L12'}],priority:'medium',assignee_agent:'daniel',description:'Keep this draft when saving fails',acceptance_criteria:'Controls preserve their application behavior.'}];
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
    if(route.request().method()==='GET' && failHydration){await route.fulfill({status:500,body:'fixture detail failure'});return;}
    if(route.request().method()==='PATCH') {
      patches.push(route.request().postDataJSON());
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

const assert=(condition,message)=>{if(!condition)throw Error(message);};
const settle=async locator=>locator.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
try {
await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
await page.getByRole('button',{name:'Verify migration interactions',exact:true}).click();
const dialog=page.getByRole('dialog');await dialog.waitFor();await settle(dialog);
const title=dialog.getByRole('heading',{name:'Verify migration interactions',exact:true});
await title.focus();await page.keyboard.press('Enter');
const edit=dialog.getByLabel('Edit title',{exact:true});await edit.fill('Retained title draft');
failSave=true;await edit.press('Enter');await page.getByText('Failed to save',{exact:true}).waitFor();
assert(await edit.inputValue()==='Retained title draft','Failed inline title lost draft');
assert(await edit.isVisible(),'Failed inline title exited edit mode');
assert(tasks[0].name==='Verify migration interactions','Failure changed persisted name');
failSave=false;await edit.press('Enter');await dialog.getByRole('heading',{name:'Retained title draft',exact:true}).waitFor();
assert(tasks[0].name==='Retained title draft','Title retry did not persist');
await dialog.getByRole('heading',{name:'Retained title draft',exact:true}).dblclick();await edit.fill('Cancel me');await edit.press('Escape');
await dialog.getByRole('heading',{name:'Retained title draft',exact:true}).waitFor();assert(await dialog.isVisible(),'Editor Escape closed drawer');
const path=dialog.getByLabel('Related document path',{exact:true});await path.fill('/notes/retain-this.md');
failSave=true;await path.press('Enter');await page.getByText('Failed to save',{exact:true}).first().waitFor();
assert(await path.inputValue()==='/notes/retain-this.md','Failed document save lost draft');
assert(await dialog.isVisible(),'Failed document save corrupted task');
failSave=false;await path.press('Enter');await dialog.getByRole('button',{name:'Remove document /notes/retain-this.md',exact:true}).waitFor();
assert(JSON.stringify(patches.at(-1).source_references)===JSON.stringify([{uri:'/notes/existing.md',anchor:'L12'},{uri:'/notes/retain-this.md'}]),'Document patch lost source reference anchors');
await page.screenshot({path:'/private/tmp/caelos-release-20260909/task-detail-draft-guard.png'});
await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
failHydration=true;
await page.getByRole('button',{name:'Retained title draft',exact:true}).click();await dialog.waitFor();await settle(dialog);
await page.getByText('Could not load full detail — description is read-only until reload',{exact:true}).waitFor();
assert(await dialog.getByLabel('Description',{exact:true}).isDisabled(),'Unhydrated description editable');
await dialog.getByLabel('Assignee',{exact:true}).fill('caelum');await dialog.getByRole('button',{name:'Save changes',exact:true}).click();
await page.getByText('Saved',{exact:true}).first().waitFor();
const patch=patches.at(-1);
assert(patch.assignee_agent==='caelum','Unhydrated safe field not saved');
for(const key of ['description','acceptance_criteria','acceptance_criteria_ref'])assert(!(key in patch),'Unhydrated save wrote '+key);
assert(tasks[0].description==='Keep this draft when saving fails','Stored heavy detail was cleared');
assert(errors.length===0,errors.join('\n'));
console.log('PASS inline title keyboard/edit/failure/retry/cancel, document failure/retry and source reference anchor preservation, and failed hydration safe save; zero page errors');
} catch(error){await page.screenshot({path:'/private/tmp/caelos-release-20260909/task-detail-guard-failure.png'});throw error;}finally{await browser.close();}
