import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const project={code:'order-fixture',name:'Ordering fixture',status:'in-progress',team:[]};
const mod={id:'module-uuid',external_id:'module-order',project_code:project.code,name:'Ordering module',state:'ready',team:[],position:null};
const task=(id,name,state='ready',module_id=null)=>({id:id+'-uuid',external_id:id,name,state,module_id,project_code:project.code,position:null});
const hiddenMod={...mod,id:'hidden-module-uuid',external_id:'hidden-module',name:'Finished module',state:'done'};
const tasks=[task('hidden','Hidden finished','done',mod.external_id),task('alpha','Alpha','ready',mod.external_id),task('beta','Beta','ready',mod.external_id),task('root','Root')];
const writes=[];let failOrder=false;
await page.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());let data=[];
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/projects')data=[project];
  if(u.pathname.endsWith('/modules'))data=[mod,hiddenMod];
  if(u.pathname.endsWith('/work-items'))data=tasks;
  if(u.pathname.startsWith('/api/work-items/')){
   data=tasks.find(t=>t.external_id===u.pathname.split('/').at(-1));
   if(req.method()==='PATCH'){
    const patch=req.postDataJSON();writes.push({id:data.external_id,...patch});
    if(failOrder){await route.fulfill({status:500,body:'order failure'});return;}
    Object.assign(data,patch);
   }
  }
  await route.fulfill({json:data});return;
 }
 if(u.pathname==='/mcp'){
  const {params}=req.postDataJSON();
  if(params.name==='get_module')data=params.arguments.external_id===hiddenMod.external_id?hiddenMod:mod;
  if(params.name==='upsert_module'){
   const target=params.arguments.external_id===hiddenMod.external_id?hiddenMod:mod;
   writes.push({id:target.external_id,...params.arguments});Object.assign(target,params.arguments);data={row:target};
  }
  await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify(data)}]}}});return;
 }
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});
const row=id=>page.locator(`[data-task-id="${id}"]`);
const moduleRow=()=>page.locator(`[data-module-id="${mod.external_id}"]`);
const order=()=>page.locator('[data-module-id],[data-task-id]').evaluateAll(es=>es.map(e=>e.dataset.moduleId||e.dataset.taskId));
const drag=async(source,target,name)=>{
 await source.hover();const grip=await source.getByLabel('Drag '+name,{exact:true}).boundingBox(),box=await target.boundingBox();
 await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();
 await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2+8,{steps:4});
 await page.mouse.move(box.x+box.width/2,box.y+box.height-3,{steps:16});await page.mouse.up();
};
try{
 await page.goto(process.env.MIGRATION_PREVIEW_URL||'http://127.0.0.1:5193');
 await page.getByRole('button',{name:'Expand Ordering module',exact:true}).click();await row('hidden').waitFor();
 await page.getByRole('button',{name:'Hide done',exact:true}).click();await row('hidden').waitFor({state:'detached'});
 const saved=page.waitForResponse(r=>r.url().endsWith('/api/work-items/alpha')&&r.request().method()==='PATCH');
 await drag(row('alpha'),row('beta'),'Alpha');await saved;
 await page.reload();await row('beta').waitFor();
 assert.deepEqual(await order(),['module-order','beta','alpha','root'],'Filtered module drop survives reload');
 assert.equal(tasks[0].position,null,'Hidden task must not receive the visible row position');
 assert(!writes.some(w=>w.id==='hidden'),'Hidden task must not be patched');
 assert(tasks[2].position<tasks[1].position);
 // Failed ordering must restore the persisted sequence and preserve the filter.
 failOrder=true;await drag(row('beta'),row('alpha'),'Beta');await page.getByText(/Failed to save order:/).waitFor();
 await row('beta').waitFor();assert.deepEqual(await order(),['module-order','beta','alpha','root']);failOrder=false;
 // Root sequence combines modules and tasks and must persist through both adapters.
 await page.getByRole('button',{name:'Collapse Ordering module',exact:true}).click();
 const rootSaved=page.waitForResponse(r=>r.url().endsWith('/mcp')&&r.request().postDataJSON()?.params?.name==='upsert_module');
 await drag(moduleRow(),row('root'),'Ordering module');await rootSaved;
 await page.reload();await row('root').waitFor();
 assert.deepEqual(await order(),['root','module-order'],'Mixed root order survives reload');
 assert(tasks[3].position<mod.position);
 assert.equal(hiddenMod.position,null,'Hidden module retains its position');
 assert(!writes.some(w=>w.id==='hidden-module'),'Hidden modules must not receive reorder writes');
 assert.deepEqual(errors,[]);
 console.log('PASS filtered module pointer order, hidden-row preservation, failed-drop recovery, mixed root/module persistence and reload; zero page errors');
}finally{await browser.close();}
