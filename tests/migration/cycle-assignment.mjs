import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const evidence='/private/tmp/caelos-release-20260909';await fs.mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const project={code:'migration-fixture',name:'Migration fixture',status:'in-progress',team:[],owner:'daniel'};
const modules=[{id:'mod-uuid',external_id:'module-fixture',project_code:project.code,name:'Module fixture',state:'ready',team:[]}];
const task=(id,name,extra={})=>({id:id+'-uuid',external_id:id,project_code:project.code,name,state:'ready',description:'Full task detail',assignee_agent:'daniel',...extra});
const tasks=[task('task-a','Task Alpha',{module_id:'module-fixture'}),task('task-b','Task Beta',{module_id:'module-fixture'}),task('task-root','Root task'),task('task-child','Child task',{parent_work_item_id:'task-root'})];
let failSave=false;let failCreate=false;const writes=[];
const cycles=[{id:"cycle-uuid",external_id:"cycle-fixture",project_code:project.code,name:"Cycle fixture",start_date:"2026-09-01",end_date:"2026-09-30"}];
const assignments=[];let creations=0;
await page.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.pathname.startsWith('/api/')){
  let data=[];
  if(u.pathname==='/api/projects')data=[project];
  if(u.pathname.endsWith('/modules'))data=modules;
  if(u.pathname==='/api/modules/module-fixture')data=modules[0];
  if(u.pathname.endsWith('/cycles')){
   data=cycles;
   if(req.method()==='POST'){
    if(failCreate){await route.fulfill({status:500,body:'fixture create failure'});return;}
    creations++;data={id:'new-cycle-uuid',external_id:'new-cycle',project_code:project.code,...req.postDataJSON()};cycles.push(data);
   }
  }
  if(u.pathname.endsWith('/work-items'))data=tasks;
  if(u.pathname.startsWith('/api/work-items/')){
   data=tasks.find(t=>t.external_id===decodeURIComponent(u.pathname.split('/').at(-1)));
   if(req.method()==='PATCH'){
    const patch=req.postDataJSON();writes.push(patch);
    if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
    Object.assign(data,patch);
    if('module' in patch)data.module_id=patch.module;
   }
  }
  await route.fulfill({json:data});return;
 }
 if(u.pathname==='/mcp'){
  const {params}=req.postDataJSON();let data=[];
  if(params.name==='assign_cycle_work_items'){
   writes.push(params.arguments);
   if(failSave){await route.fulfill({status:500,body:'fixture assignment failure'});return;}
   assignments.push(params.arguments);data={assigned:params.arguments.work_items.length};
  }
  if(params.name==='list_agents')data=[{agent_name:'daniel'},{agent_name:'caelum'}];
  await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify(data)}]}}});return;
 }
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});
const settle=async el=>el.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
const row=id=>page.locator(`[data-task-id="${id}"]`);
const order=()=>page.locator('[data-task-id]').evaluateAll(es=>es.map(e=>e.dataset.taskId));
try{
 await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
 await page.getByRole('button',{name:'Expand Module fixture',exact:true}).waitFor();
 assert.equal(await row('task-a').count(),0,'Modules must start collapsed');
 await page.getByRole('button',{name:'Expand Module fixture',exact:true}).click();await row('task-a').waitFor();
 await row('task-a').click({button:'right'});await page.getByRole('menuitem',{name:'Add to Cycle…',exact:true}).click();
 const picker=page.getByRole('dialog',{name:'Add to Cycle',exact:true});await settle(picker);
 failSave=true;await picker.getByRole('button',{name:/Cycle fixture/}).click();
 await page.getByText(/fixture assignment failure/).first().waitFor();assert(await picker.isVisible());assert.equal(assignments.length,0);
 failSave=false;await picker.getByRole('button',{name:/Cycle fixture/}).click();await picker.waitFor({state:'detached'});
 assert.equal(assignments[0].cycle,'cycle-fixture');assert.deepEqual(assignments[0].work_items,['task-a']);assert.equal(assignments[0].project,project.code);assert(assignments[0].idempotency_key);
 // Both creation failure and assignment-after-create failure must preserve the name.
 await row('task-root').click({button:'right'});await page.getByRole('menuitem',{name:'Add to Cycle…',exact:true}).click();await settle(picker);
 await picker.getByLabel('New cycle name',{exact:true}).fill('Retry cycle');
 failCreate=true;await picker.getByRole('button',{name:'Create and assign cycle',exact:true}).click();
 await page.getByText(/fixture create failure/).first().waitFor();assert.equal(await picker.getByLabel('New cycle name',{exact:true}).inputValue(),'Retry cycle');assert.equal(creations,0);
 failCreate=false;failSave=true;await picker.getByLabel('New cycle name',{exact:true}).press('Enter');
 await page.waitForFunction(()=>document.querySelectorAll('[role="dialog"] button').length>0);await picker.getByRole('button',{name:/Retry cycle/}).waitFor();
 await picker.getByRole('button',{name:'Create and assign cycle',exact:true}).waitFor({state:'visible'});
 await page.waitForFunction(()=>!document.querySelector('input[name="cycleName"]').disabled);
 assert.equal(creations,1);assert.equal(await picker.getByLabel('New cycle name',{exact:true}).inputValue(),'Retry cycle');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:evidence+'/cycle-picker-narrow.png'});
 const box=await picker.boundingBox();assert(box.x>=0&&box.x+box.width<=390);
 failSave=false;await picker.getByRole('button',{name:'Create and assign cycle',exact:true}).click();await picker.waitFor({state:'detached'});
 assert.equal(creations,1,'Retry assignment must reuse the created cycle');assert.deepEqual(assignments[1].work_items,['task-root']);assert.equal(assignments[1].cycle,cycles[1].external_id);
 // Nested picker assigns the module roots in one request, then restores its drawer.
 await page.setViewportSize({width:1440,height:1000});await page.reload();
 await page.getByText('Module fixture',{exact:true}).first().click();
 const drawer=page.getByRole('dialog').filter({has:page.getByRole('button',{name:'Add to cycle',exact:true})});await settle(drawer);
 await drawer.getByRole('button',{name:'Add to cycle',exact:true}).click();await settle(picker);
 await picker.getByRole('button',{name:/Cycle fixture/}).click();await picker.waitFor({state:'detached'});
 assert.deepEqual(assignments[2].work_items,['task-a','task-b']);assert(await drawer.isVisible());
 await drawer.getByRole('button',{name:'Task Alpha',exact:true}).focus();await page.keyboard.press('Enter');
 const taskDrawer=page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Task Alpha',exact:true})});await taskDrawer.waitFor();await settle(taskDrawer);
 await page.keyboard.press('Escape');await taskDrawer.waitFor({state:'detached'});
 await page.getByText('Module fixture',{exact:true}).first().click();await drawer.waitFor();
 await drawer.getByRole('button',{name:'Add task',exact:true}).click();
 const create=page.getByRole('dialog',{name:'New Task',exact:true});await create.waitFor();await settle(create);await page.keyboard.press('Escape');await create.waitFor({state:'detached'});
 if(await drawer.isVisible()){await page.keyboard.press('Escape');await drawer.waitFor({state:'detached'});}
 await page.getByRole('tab',{name:'Cycles',exact:true}).click();await page.getByRole('region',{name:'Project cycles',exact:true}).waitFor();
 await page.mouse.move(1400,900);
 await settle(page.getByRole('tablist',{name:'Project sections'}));
 const tabStates=await page.getByRole('tab').evaluateAll(es=>es.map(e=>({label:e.textContent,selected:e.getAttribute('aria-selected'),opacity:getComputedStyle(e,'::before').opacity})));
 assert.equal(tabStates.find(t=>t.label==='Cycles').selected,'true');
 assert.equal(tabStates.find(t=>t.label==='Cycles').opacity,'1');
 assert.equal(tabStates.find(t=>t.label==='Tasks').opacity,'0');
 await page.screenshot({path:evidence+'/cycles-cards.png'});
 assert.deepEqual(errors,[]);console.log('PASS cycle assignment adapter payload; failed creation and assignment retain picker/draft; retry reuses created cycle; nested module batch and Escape; narrow dialog; zero page errors');
}catch(error){await page.screenshot({path:evidence+'/cycle-assignment-failure.png'});console.log(JSON.stringify({assignments,writes,errors,body:await page.locator('body').innerText()},null,2));throw error;}finally{await browser.close();}
