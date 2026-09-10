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
let failSave=false;const writes=[];
await page.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.pathname.startsWith('/api/')){
  let data=[];
  if(u.pathname==='/api/projects')data=[project];
  if(u.pathname.endsWith('/modules'))data=modules;
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
 const menuMetrics=async label=>{
  const menu=page.getByRole('menu');await settle(menu);
  const metrics=await menu.evaluate(el=>({width:el.getBoundingClientRect().width,items:[...el.querySelectorAll('[role="menuitem"]')].map(item=>{
   const icon=item.querySelector('svg'), text=[...item.childNodes].find(n=>n.nodeType===Node.TEXT_NODE && n.textContent.trim());
   if(!icon || !text)throw Error('Expected icon and label');
   const range=document.createRange();range.selectNodeContents(text);
   return {gap:range.getBoundingClientRect().left-icon.getBoundingClientRect().right,justify:getComputedStyle(item).justifyContent};
  })}));
  assert.ok(metrics.items.every(i=>i.justify==='flex-start' && i.gap>=7 && i.gap<=10),JSON.stringify(metrics));
  await menu.screenshot({path:evidence+'/compact-menu-'+label+'.png'});
  return metrics.width;
 };
 await row('task-a').click({button:'right'});
 const taskMenuWidth=await menuMetrics('task');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Migration fixture',exact:true}).click({button:'right'});
 const projectMenuWidth=await menuMetrics('project');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Add new',exact:true}).click();
 const addMenuWidth=await menuMetrics('add');await page.keyboard.press('Escape');
 assert.ok(addMenuWidth<projectMenuWidth && projectMenuWidth<taskMenuWidth,'Menu width must follow its longest label');
 console.log('PASS content-sized, left-aligned menus', {taskMenuWidth,projectMenuWidth,addMenuWidth});
 const moduleHeader=page.locator('[data-module-id="module-fixture"]');
 await moduleHeader.getByRole('button',{name:'Collapse Module fixture',exact:true}).click();
 await row('task-a').waitFor({state:'detached'});assert.equal(await page.getByRole('dialog').count(),0);
 await moduleHeader.getByRole('button',{name:'Expand Module fixture',exact:true}).click();await row('task-a').waitFor();
 await moduleHeader.getByRole('button',{name:'Task',exact:true}).click();
 const createTask=page.getByRole('dialog',{name:'New Task',exact:true});await settle(createTask);
 assert.equal(await page.getByRole('dialog').count(),1);
 await page.keyboard.press('Escape');await createTask.waitFor({state:'detached'});
 await moduleHeader.getByRole('button',{name:/Module fixture 0\/2/}).focus();await page.keyboard.press('Shift+F10');
 await page.getByRole('menuitem',{name:'Open',exact:true}).waitFor();
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await page.getByLabel('Search tasks',{exact:true}).fill('Alpha');await row('task-b').waitFor({state:'detached'});assert.equal(await row('task-a').count(),1);
 await page.getByLabel('Search tasks',{exact:true}).fill('');await row('task-b').waitFor();
 await page.getByLabel('Filter task states',{exact:true}).click();await settle(page.getByRole('menu'));
 await page.getByRole('menuitemcheckbox',{name:'Ready',exact:true}).click();await row('task-a').waitFor({state:'detached'});
 assert.equal(await page.getByRole('menu').count(),1,'Multi-state filter must remain open');
 await page.getByRole('menuitemcheckbox',{name:'In Progress',exact:true}).click();
 await page.keyboard.press('Escape');await page.reload();
 await page.getByLabel('Filter task states',{exact:true}).click();await settle(page.getByRole('menu'));
 assert.equal(await page.getByRole('menuitemcheckbox',{name:'Ready',exact:true}).getAttribute('aria-checked'),'false');
 assert.equal(await page.getByRole('menuitemcheckbox',{name:'In Progress',exact:true}).getAttribute('aria-checked'),'false');
 await page.getByRole('menuitemcheckbox',{name:'Ready',exact:true}).click();
 await page.getByRole('menuitemcheckbox',{name:'In Progress',exact:true}).click();await page.keyboard.press('Escape');await row('task-a').waitFor();
 await page.getByRole('button',{name:'Hide done',exact:true}).click();await page.reload();
 await page.getByLabel('Filter task states',{exact:true}).click();await settle(page.getByRole('menu'));
 for(const name of ['Done','Deferred','Archived'])assert.equal(await page.getByRole('menuitemcheckbox',{name,exact:true}).getAttribute('aria-checked'),'false');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Hide done',exact:true}).click();
 await page.getByLabel('Filter task states',{exact:true}).click();await settle(page.getByRole('menu'));
 for(const name of ['Done','Deferred'])assert.equal(await page.getByRole('menuitemcheckbox',{name,exact:true}).getAttribute('aria-checked'),'true');
 assert.equal(await page.getByRole('menuitemcheckbox',{name:'Archived',exact:true}).getAttribute('aria-checked'),'false');
 await page.keyboard.press('Escape');
 await row('task-root').getByRole('button',{name:'Expand Root task',exact:true}).click();await row('task-child').waitFor();
 assert.equal(await page.getByRole('dialog').count(),0,'Expansion must not open detail');
 for(const id of ['task-root','task-child']){
  await row(id).getByRole('button',{name:'Change status: Ready',exact:true}).click();
  await page.getByRole('menuitemradio',{name:'In Progress',exact:true}).click();
  await row(id).getByRole('button',{name:'Change status: In Progress',exact:true}).waitFor();
  assert.equal(tasks.find(t=>t.external_id===id).state,'in-progress');
  failSave=true;await row(id).getByRole('button',{name:'Change status: In Progress',exact:true}).click();
  await page.getByRole('menuitemradio',{name:'Done',exact:true}).click();
  await page.getByText('Failed to save',{exact:true}).last().waitFor();
  assert.equal(tasks.find(t=>t.external_id===id).state,'in-progress');failSave=false;
 }
 assert.deepEqual(errors,[],'Root and subtask save failures must be handled');

 await row('task-root').getByRole('button',{name:'Collapse Root task',exact:true}).click();assert.equal(await row('task-child').count(),0);
 await row('task-a').getByRole('button',{name:'Change status: Ready',exact:true}).click();
 await page.getByRole('menuitemradio',{name:'In Progress',exact:true}).click();
 await row('task-a').getByRole('button',{name:'Change status: In Progress',exact:true}).waitFor();assert.equal(await page.getByRole('dialog').count(),0);
 await page.reload();await row('task-a').getByRole('button',{name:'Change status: In Progress',exact:true}).waitFor();
 failSave=true;await row('task-a').getByRole('button',{name:'Change status: In Progress',exact:true}).click();await page.getByRole('menuitemradio',{name:'Done',exact:true}).click();await page.getByText('Failed to save',{exact:true}).waitFor();
 assert.equal(tasks[0].state,'in-progress');failSave=false;
 // Real pointer drag through the existing HTML5 DnD backend.
 const grip=row('task-a').getByLabel('Drag Task Alpha',{exact:true});await row('task-a').hover();
 const g=await grip.boundingBox(),target=await row('task-b').boundingBox();
 await page.mouse.move(g.x+g.width/2,g.y+g.height/2);await page.mouse.down();
 await page.mouse.move(g.x+g.width/2,g.y+g.height/2+8,{steps:4});
 await page.mouse.move(target.x+target.width/2,target.y+target.height-3,{steps:16});await page.mouse.up();
 await page.waitForFunction(()=>document.querySelector('[data-task-id]')?.getAttribute('data-task-id')==='task-b');
 assert.deepEqual((await order()).slice(0,2),['task-b','task-a']);
 await page.reload();await row('task-b').waitFor();assert.deepEqual((await order()).slice(0,2),['task-b','task-a'],'Drag order survives reload');assert(writes.some(p=>typeof p.position==='number'));
 // Keyboard opens the title without any nested-button ambiguity; assignment is saved by the existing detail form.
 await row('task-root').getByRole('button',{name:'Root task',exact:true}).focus();await page.keyboard.press('Enter');
 const detail=page.getByRole('dialog');await settle(detail);await detail.getByLabel('Assignee',{exact:true}).fill('caelum');
 await detail.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByText('Saved',{exact:true}).last().waitFor();
 await page.keyboard.press('Escape');await detail.waitFor({state:'detached'});
 await page.reload();await row('task-root').getByRole('img',{name:'caelum',exact:true}).waitFor();
 await row('task-root').click({button:'right'});await page.getByRole('menuitem',{name:'Move…',exact:true}).click();
 const move=page.getByRole('dialog',{name:'Move task',exact:true});await settle(move);
 assert(await move.getByRole('button',{name:'Move',exact:true}).isDisabled());
 await move.getByLabel('Module',{exact:true}).click();await page.getByRole('option',{name:'Module fixture',exact:true}).click();
 failSave=true;await move.getByRole('button',{name:'Move',exact:true}).click();await page.getByText(/Failed to move:/).waitFor();
 assert(await move.isVisible());assert((await move.getByLabel('Module',{exact:true}).innerText()).includes('Module fixture'));
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:evidence+'/move-task-narrow.png'});
 failSave=false;await move.getByRole('button',{name:'Move',exact:true}).click();await move.waitFor({state:'detached'});assert.equal(tasks[2].module_id,'module-fixture');
 await page.setViewportSize({width:768,height:900});await page.screenshot({path:evidence+'/task-rows-narrow.png'});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:evidence+'/task-rows.png'});
 await row('task-b').getByRole('button',{name:'Archive Task Beta',exact:true}).click();
 const archive=page.getByRole('dialog',{name:'Archive task?',exact:true});await settle(archive);
 failSave=true;await archive.getByRole('button',{name:'Archive',exact:true}).click();await page.getByText('Failed to delete',{exact:true}).waitFor();assert(await archive.isVisible());
 failSave=false;await archive.getByRole('button',{name:'Archive',exact:true}).click();await archive.waitFor({state:'detached'});await row('task-b').waitFor({state:'detached'});
 assert(writes.some(p=>p.state==='archived'));assert.deepEqual(errors,[]);
 console.log('PASS task expansion, independent status save/reload/failure, real pointer reorder, keyboard detail, assignment persistence, move failure/retry, archive failure/retry, narrow screenshots; zero page errors');
}catch(error){await page.screenshot({path:evidence+'/task-rows-failure.png'});console.log(JSON.stringify({writes,tasks,errors,body:await page.locator('body').innerText()},null,2));throw error;}finally{await browser.close();}
