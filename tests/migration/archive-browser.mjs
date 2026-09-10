import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const projects=[{code:'active',name:'Active project',status:'in-progress'},{code:'archived',name:'Archived project',status:'archived'},{code:'closed',name:'Closed project',status:'closed'}];
const initiatives=[{external_id:'INIT-archived',title:'Archived initiative',state:'archived'}];let fail=false;
await page.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.pathname.startsWith('/api/')){
  let data=[];
  if(u.pathname==='/api/projects')data=projects;
  if(u.pathname==='/api/initiatives')data=initiatives;
  if(u.pathname==='/api/initiatives/INIT-archived'){
   if(fail){await route.fulfill({status:500,body:'fixture failure'});return;}
   Object.assign(initiatives[0],req.postDataJSON());data=initiatives[0];
  }
  await route.fulfill({json:data});return;
 }
 if(u.pathname==='/mcp'){
  const {params}=req.postDataJSON();let data=[];
  if(params.name==='upsert_project'){
   if(fail){await route.fulfill({status:500,body:'fixture failure'});return;}
   const p=projects.find(p=>p.code===params.arguments.code);Object.assign(p,params.arguments);data={row:p};
  }
  await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify(data)}]}}});return;
 }
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}await route.continue();
});
try{
 await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('menuitem',{name:'Archived',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Archived',exact:true});await dialog.waitFor();
 assert.equal(await dialog.getByRole('button',{name:'Unarchive Closed project',exact:true}).count(),0);
 for(const name of ['Archived project','Archived initiative']){
  const restore=dialog.getByRole('button',{name:`Unarchive ${name}`,exact:true});fail=true;await restore.click();
  await page.getByText(name==='Archived project'?'Failed to update project':'Failed to update initiative',{exact:true}).waitFor();
  await page.waitForFunction(label=>!document.querySelector(`[aria-label="${label}"]`).disabled,`Unarchive ${name}`);
  assert(await restore.isVisible());
  await page.setViewportSize({width:390,height:844});await dialog.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
  const box=await dialog.boundingBox();assert(box.x>=0&&box.x+box.width<=391);
  assert(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth));
  await page.screenshot({path:'/private/tmp/caelos-release-20260909/archive-browser-narrow.png'});
  fail=false;await restore.click();await restore.waitFor({state:'detached'});assert(await dialog.isVisible());
 }
 await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
 await page.setViewportSize({width:1440,height:1000});await page.reload();
 await page.locator('aside').getByRole('button',{name:'Archived project',exact:true}).waitFor();
 await page.locator('aside').getByRole('button',{name:'Archived initiative',exact:true}).waitFor();
 assert.equal(projects[1].status,'planned');assert.equal(initiatives[0].state,'planned');assert.deepEqual(errors,[]);
 console.log('PASS archive browser: Settings menu, closed project remains read-only, project/initiative failure retry, narrow fit, Escape, restored entries survive fixture reload; zero page errors');
}finally{await browser.close();}
