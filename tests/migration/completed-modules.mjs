import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const project={code:'completion-fixture',name:'Completion fixture',status:'in-progress',team:[]};
const module=(id,state='ready',extra={})=>({id:id+'-uuid',external_id:id,name:id,project_code:project.code,state,team:[],...extra});
const mods=[module('finished'),module('mixed','done'),module('empty'),module('empty-done','done'),module('subtask-active','done'),module('parent'),module('child','ready',{parent_module_id:'parent'}),module('finish-now')];
const task=(id,module_id,state='done',extra={})=>({id:id+'-uuid',external_id:id,name:id,project_code:project.code,module_id,state,...extra});
const tasks=[task('finished-a','finished'),task('finished-b','finished','deferred'),task('mixed-done','mixed'),task('mixed-ready','mixed','ready'),task('done-parent','subtask-active'),task('active-child',null,'ready',{parent_work_item_id:'done-parent'}),task('parent-task','parent'),task('child-task','child','ready'),task('last-open','finish-now','ready')];
await page.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());let data=[];
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/projects')data=[project];
  if(u.pathname.endsWith('/modules'))data=mods;
  if(u.pathname.endsWith('/work-items'))data=tasks;
  if(u.pathname.startsWith('/api/work-items/')){
   data=tasks.find(t=>t.external_id===u.pathname.split('/').at(-1));
   if(req.method()==='PATCH')Object.assign(data,req.postDataJSON());
  }
  await route.fulfill({json:data});return;
 }
 if(u.pathname==='/mcp'){await route.fulfill({json:{result:{content:[{type:'text',text:'[]'}]}}});return;}
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});
const settle=async el=>el.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
const moduleRow=id=>page.locator(`[data-module-id="${id}"]`);
const expectHidden=async()=>{
 for(const id of ['finished','empty-done'])assert.equal(await moduleRow(id).count(),0,id+' must hide');
 for(const id of ['mixed','empty','subtask-active','parent','child','finish-now'])assert.equal(await moduleRow(id).count(),1,id+' must remain');
};
try{
 await page.goto(process.env.MIGRATION_PREVIEW_URL||'http://127.0.0.1:5195');
 await moduleRow('finished').waitFor();
 await page.getByRole('button',{name:'Hide done',exact:true}).click();
 await moduleRow('finished').waitFor({state:'detached'});await expectHidden();
 await page.reload();await moduleRow('mixed').waitFor();await expectHidden();
 // Completion is independent of search text and unrelated state exclusions.
 await page.getByLabel('Search tasks',{exact:true}).fill('no matching task');await expectHidden();
 await page.getByLabel('Search tasks',{exact:true}).fill('');
 await page.getByLabel('Filter task states',{exact:true}).click();await settle(page.getByRole('menu'));
 await page.getByRole('menuitemcheckbox',{name:'Ready',exact:true}).click();await page.keyboard.press('Escape');await page.getByRole('menu').waitFor({state:'detached'});await expectHidden();
 await page.getByLabel('Filter task states',{exact:true}).click();await settle(page.getByRole('menu'));
 await page.getByRole('menuitemcheckbox',{name:'Ready',exact:true}).click();await page.keyboard.press('Escape');await page.getByRole('menu').waitFor({state:'detached'});
 // Completing the last unfinished task removes its module immediately.
 await page.getByRole('button',{name:'Expand finish-now',exact:true}).click();
 await page.locator('[data-task-id="last-open"]').getByRole('button',{name:'Change status: Ready',exact:true}).click();
 await page.getByRole('menuitemradio',{name:'Done',exact:true}).click();await moduleRow('finish-now').waitFor({state:'detached'});
 await page.getByRole('button',{name:'Hide done',exact:true}).click();
 for(const m of mods)await moduleRow(m.external_id).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS completed module hiding, empty/mixed modules, active descendants, filter persistence, search independence, immediate completion and restore; zero page errors');
}finally{await browser.close();}
