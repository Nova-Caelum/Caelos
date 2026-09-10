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
  if(u.pathname==='/api/projects')data=[project,...Array.from({length:30},(_,i)=>({code:'extra-'+i,name:'Extra project '+i,status:'planned'}))];
  if(u.pathname==='/api/initiatives')data=[{external_id:'INIT-test',title:'Sidebar initiative',state:'planned'}];
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
const aside=page.locator('aside');
try{
 await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
 const projectRow=aside.getByRole('button',{name:'Migration fixture',exact:true});await projectRow.waitFor();
 assert.equal(await projectRow.getAttribute('aria-current'),'page');
 const search=aside.getByLabel('Search projects and initiatives',{exact:true});
 await search.fill('Sidebar');assert.equal(await projectRow.count(),0);await aside.getByRole('button',{name:'Sidebar initiative',exact:true}).waitFor();
 await search.fill('Migration');await projectRow.waitFor();assert.equal(await aside.getByRole('button',{name:'Sidebar initiative',exact:true}).count(),0);
 await search.fill('');
 const projectsToggle=aside.getByRole('button',{name:'Projects',exact:true});await projectsToggle.focus();await page.keyboard.press('Enter');
 assert.equal(await projectsToggle.getAttribute('aria-expanded'),'false');assert.equal(await projectRow.count(),0);
 await page.reload();assert.equal(await projectsToggle.getAttribute('aria-expanded'),'false');await projectsToggle.click();await projectRow.waitFor();
 await aside.getByRole('button',{name:'Expand Migration fixture',exact:true}).click();
 const moduleRow=aside.getByRole('button',{name:'Module fixture',exact:true});await moduleRow.waitFor();await moduleRow.focus();await page.keyboard.press('Enter');
 await aside.getByRole('button',{name:'Task Alpha',exact:true}).click();
 const drawer=page.getByRole('dialog').filter({has:page.getByRole('heading',{name:'Task Alpha',exact:true})});await drawer.waitFor();
 await drawer.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
 await page.keyboard.press('Escape');await drawer.waitFor({state:'detached'});
 await page.waitForFunction(()=>document.activeElement?.textContent?.trim()==='Task Alpha');
 await projectRow.focus();await page.keyboard.press('Shift+F10');await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
 await page.getByRole('tab',{name:'Info',exact:true}).waitFor();assert.equal(await page.getByRole('tab',{name:'Info',exact:true}).getAttribute('aria-selected'),'true');
 await projectRow.click({button:'right'});await page.getByRole('menuitem',{name:'Duplicate',exact:true}).waitFor();
 await page.getByRole('menu').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished));});
 await page.keyboard.press('Escape');
 await page.getByRole('menuitem',{name:'Duplicate',exact:true}).waitFor({state:'detached'});
 await page.setViewportSize({width:768,height:900});
 await page.mouse.move(700,850);
 const region=page.getByRole('region',{name:'Workspace navigation',exact:true});
 assert(await region.evaluate(e=>e.scrollHeight>e.clientHeight));
 await aside.getByRole('button',{name:'Sidebar initiative',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:evidence+'/sidebar-navigation-narrow.png'});
 assert(await aside.evaluate(e=>e.scrollWidth<=e.clientWidth));
 assert.deepEqual(errors,[]);console.log('PASS sidebar search, persisted keyboard collapse, selected project, nested task navigation, keyboard context Edit, dismissal and scroll/narrow bounds; zero page errors');
}catch(e){await page.screenshot({path:evidence+'/sidebar-failure.png'});throw e;}finally{await browser.close();}
