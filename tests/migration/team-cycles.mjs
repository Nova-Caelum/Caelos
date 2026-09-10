import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const evidence='/private/tmp/caelos-release-20260909';await fs.mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const project={code:'migration-fixture',name:'Migration fixture',description:'Local isolated verification',status:'in-progress',team:[],owner:'daniel'};
const cycles=[];let failSave=false;
await page.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.pathname.startsWith('/api/')){
  let data=[];
  if(u.pathname==='/api/projects')data=[project];
  if(u.pathname.endsWith('/cycles')){
   data=cycles;
   if(req.method()==='POST'){
    if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
    data={id:'cycle-uuid',project_code:project.code,...req.postDataJSON()};cycles.push(data);
   }
  }
  await route.fulfill({json:data});return;
 }
 if(u.pathname==='/mcp'){
  const {params}=req.postDataJSON();let data=[];
  if(params.name==='list_agents') data=[{agent_name:'daniel'},{agent_name:'caelum'}];
  if(params.name==='get_cycle') data=cycles[0];
  if(params.name==='upsert_cycle'){
   if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
   Object.assign(cycles[0],params.arguments);data={row:cycles[0]};
  }
  await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify(data)}]}}});return;
 }
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});
const settle=async el=>el.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
try{
 await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
 await page.getByRole('tab',{name:'Team',exact:true}).click();
 await page.getByRole('button',{name:'Remove caelum',exact:true}).click();
 await page.getByRole('button',{name:'Add member',exact:true}).click();
 const team=page.getByRole('dialog',{name:'Add Team Member',exact:true});await settle(team);
 await team.getByRole('button',{name:'Add',exact:true}).click();await page.getByText('Select a team member',{exact:true}).waitFor();
 await team.getByLabel('Person',{exact:true}).click();await page.getByRole('option',{name:'caelum',exact:true}).click();
 await team.getByRole('button',{name:'Add',exact:true}).click();await team.waitFor({state:'detached'});
 await page.getByRole('region',{name:'Project team',exact:true}).getByText('caelum',{exact:true}).waitFor();
 assert(await page.getByRole('button',{name:'Add member',exact:true}).isDisabled());
 await page.screenshot({path:evidence+'/team.png'});
 await page.getByRole('tab',{name:'Cycles',exact:true}).click();await page.getByRole('button',{name:'New cycle',exact:true}).click();
 const create=page.getByRole('dialog',{name:'New Cycle',exact:true});await settle(create);
 await create.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Name is required',{exact:true}).waitFor();
 await create.getByLabel('Name',{exact:true}).fill('Cycle fixture');await create.getByLabel('Description',{exact:true}).fill('Cycle draft');
 await create.getByLabel('Start Date',{exact:true}).fill('2026-09-01');await create.getByLabel('End Date',{exact:true}).fill('2026-09-30');
 failSave=true;await create.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Failed to create cycle',{exact:true}).waitFor();
 assert.equal(await create.getByLabel('Start Date',{exact:true}).inputValue(),'2026-09-01');
 await page.setViewportSize({width:390,height:844});await settle(create);await page.screenshot({path:evidence+'/cycle-create-narrow.png'});
 const bounds=await create.boundingBox();
 for(const label of ['Start Date','End Date']){const b=await create.getByLabel(label,{exact:true}).boundingBox();assert(b.x>=bounds.x && b.x+b.width<=bounds.x+bounds.width);}
 failSave=false;await create.getByRole('button',{name:'Create',exact:true}).click();await create.waitFor({state:'detached'});
 await page.setViewportSize({width:1440,height:1000});await page.reload();await page.getByRole('tab',{name:'Cycles',exact:true}).click();
 const row=page.getByRole('tabpanel').getByText('Cycle fixture',{exact:true});await row.click({button:'right'});await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
 const edit=page.getByRole('dialog',{name:'Edit Cycle',exact:true});await settle(edit);
 assert.equal(await edit.getByLabel('Start Date',{exact:true}).inputValue(),'2026-09-01');
 await edit.getByLabel('Description',{exact:true}).fill('Updated cycle draft');
 failSave=true;await edit.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Failed to update',{exact:true}).waitFor();
 assert.equal(await edit.getByLabel('Description',{exact:true}).inputValue(),'Updated cycle draft');
 failSave=false;await edit.getByRole('button',{name:'Save',exact:true}).click();await edit.waitFor({state:'detached'});
 await page.reload();await page.getByRole('tab',{name:'Cycles',exact:true}).click();await page.getByText('Updated cycle draft',{exact:true}).waitFor();
 await page.getByRole('button',{name:'New cycle',exact:true}).click();await settle(create);await page.keyboard.press('Escape');await create.waitFor({state:'detached'});
 await page.getByText('Cycle fixture',{exact:true}).click({button:'right'});
 await page.getByRole('menuitem',{name:'Archive',exact:true}).click();
 const archive=page.getByRole('dialog',{name:'Archive cycle?',exact:true});await settle(archive);
 failSave=true;await archive.getByRole('button',{name:'Archive',exact:true}).click();
 await page.getByText('Failed to delete cycle',{exact:true}).waitFor();
 assert(await archive.isVisible());assert(await page.getByText('Cycle fixture',{exact:true}).isVisible());
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:evidence+'/archive-narrow.png'});
 failSave=false;await archive.getByRole('button',{name:'Archive',exact:true}).click();await archive.waitFor({state:'detached'});
 assert.equal(cycles[0].state,'archived');await page.getByText('No cycles yet',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS Team session remove/add and disabled roster; Cycle create/edit validation, dates, failure draft/retry, reload, narrow bounds, Escape; zero page errors');
}finally{await browser.close();}
