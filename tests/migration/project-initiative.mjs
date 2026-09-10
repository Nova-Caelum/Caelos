import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const evidence='/private/tmp/caelos-release-20260909';
await fs.mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const projects=[{code:'migration-fixture',name:'Migration fixture',description:'Local isolated migration verification',status:'in-progress',team:[],owner:'daniel'}];
const initiatives=[];
let failSave=false;
const projectWrites=[];
await page.route('**/*',async route=>{
 const req=route.request(), u=new URL(req.url());
 if(u.pathname.startsWith('/api/')){
  let data=[];
  if(u.pathname==='/api/projects')data=projects;
  if(u.pathname==='/api/initiatives'){
   data=initiatives;
   if(req.method()==='POST'){
    if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
    data={id:'initiative-uuid',...req.postDataJSON()};initiatives.push(data);
   }
  }
  if(u.pathname==='/api/initiatives/INIT-fixture'){
   if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
   Object.assign(initiatives[0],req.postDataJSON());data=initiatives[0];
  }
  await route.fulfill({json:data});return;
 }
 if(u.pathname==='/mcp'){
  const {params}=req.postDataJSON();let data=[];
  if(params.name==='add_project'){
   await route.fulfill({json:{error:{code:-32601,message:'Unknown tool: add_project'}}});return;
  }
  if(params.name==='upsert_project'){
   projectWrites.push(params.arguments);
   if(failSave){await route.fulfill({json:{result:{isError:true,content:[{type:'text',text:'Project validation failed'}]}}});return;}
   assert.match(params.arguments.code,/^[a-z0-9]+(-[a-z0-9]+)*$/);
   assert.ok(params.arguments.code.length<=100);
   assert.ok(!projects.some(p=>p.code===params.arguments.code),'Create must never upsert over an existing project');
   data={row:{...params.arguments,status:'planned',team:[],owner:'daniel'}};projects.push(data.row);
  }
  await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify(data)}]}}});return;
 }
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});
const settle=async el=>el.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
try{
 await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
 assert.equal(await page.getByRole('button',{name:'New project',exact:true}).locator('svg').count(),1);
 await page.getByRole('button',{name:'New project',exact:true}).click();
 const project=page.getByRole('dialog',{name:'New Project',exact:true});await settle(project);
 await project.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Name is required',{exact:true}).waitFor();
 await project.getByLabel('Name',{exact:true}).fill('Created project fixture');
 await project.getByLabel('Description',{exact:true}).fill('Preserved project draft');
 // Folder path is optional, matching the reported failure.
 assert.equal(await project.getByLabel('Folder Path',{exact:true}).inputValue(),'');
 failSave=true;await project.getByRole('button',{name:'Create',exact:true}).click();await page.getByText(/Failed to create project/).waitFor();
 assert.equal(await project.getByLabel('Description',{exact:true}).inputValue(),'Preserved project draft');
 failSave=false;await project.getByRole('button',{name:'Create',exact:true}).click();await project.waitFor({state:'detached'});
 await page.getByRole('heading',{name:'Created project fixture',exact:true}).waitFor();
 await page.reload();await page.locator('aside').getByRole('button',{name:'Created project fixture',exact:true}).waitFor();
 assert.equal(projects.at(-1).description,'Preserved project draft');
 assert.ok(!projectWrites.at(-1).folder_path);
 // Same-name creation has a different key; an upsert must not alter the first project.
 const firstCreated=structuredClone(projects.at(-1));
 await page.getByRole('button',{name:'New project',exact:true}).click();await settle(project);
 await project.getByLabel('Name',{exact:true}).fill('Created project fixture');
 await project.getByLabel('Description',{exact:true}).fill('Separate project');
 await project.getByLabel('Folder Path',{exact:true}).fill('/workspace/fixture');
 await project.getByRole('button',{name:'Create',exact:true}).click();await project.waitFor({state:'detached'});
 assert.deepEqual(projects.find(p=>p.code===firstCreated.code),firstCreated);
 assert.notEqual(projects.at(-1).code,firstCreated.code);
 assert.equal(projects.at(-1).folder_path,'/workspace/fixture');
 await page.getByRole('button',{name:'New initiative',exact:true}).click();
 const init=page.getByRole('dialog',{name:'New Initiative',exact:true});await settle(init);
 assert.match(await init.getByLabel('State',{exact:true}).innerText(),/Planned/);
 await init.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Title is required',{exact:true}).waitFor();
 await init.getByLabel('Title',{exact:true}).fill('Initiative fixture');
 await init.getByLabel('Description',{exact:true}).fill('Preserved initiative draft');
 await init.getByLabel('External ID',{exact:true}).fill('INIT-fixture');
 await init.getByLabel('State',{exact:true}).click();await page.getByRole('option',{name:'Paused',exact:true}).click();
 failSave=true;await init.getByRole('button',{name:'Create',exact:true}).click();await page.getByText('Failed to create initiative',{exact:true}).waitFor();
 assert.equal(await init.getByLabel('Title',{exact:true}).inputValue(),'Initiative fixture');
 await page.setViewportSize({width:390,height:844});await settle(init);
 const bounds=await init.boundingBox();assert(bounds.x>=0 && bounds.x+bounds.width<=391 && bounds.height<=844);
 await page.screenshot({path:evidence+'/initiative-create-narrow.png'});
 failSave=false;await init.getByRole('button',{name:'Create',exact:true}).click();await init.waitFor({state:'detached'});
 assert.equal(initiatives[0].state,'paused');
 await page.setViewportSize({width:1440,height:1000});await page.reload();
 const row=page.locator('aside').getByRole('button',{name:'Initiative fixture',exact:true});await row.click({button:'right'});
 await page.getByRole('menuitem',{name:'Edit',exact:true}).click();
 const edit=page.getByRole('dialog',{name:'Edit Initiative',exact:true});await settle(edit);
 assert.equal(await edit.getByLabel('Description',{exact:true}).inputValue(),'Preserved initiative draft');
 await edit.getByLabel('Description',{exact:true}).fill('Edited initiative draft');
 failSave=true;await edit.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Failed to update initiative',{exact:true}).waitFor();
 assert.equal(await edit.getByLabel('Description',{exact:true}).inputValue(),'Edited initiative draft');
 failSave=false;await edit.getByRole('button',{name:'Save',exact:true}).click();await edit.waitFor({state:'detached'});
 await page.reload();await row.click({button:'right'});await page.getByRole('menuitem',{name:'Edit',exact:true}).click();await settle(edit);
 assert.equal(await edit.getByLabel('Description',{exact:true}).inputValue(),'Edited initiative draft');
 await page.screenshot({path:evidence+'/initiative-edit.png'});
 await page.keyboard.press('Escape');await edit.waitFor({state:'detached'});
 await page.getByRole('button',{name:'New project',exact:true}).click();await settle(project);await page.keyboard.press('Escape');await project.waitFor({state:'detached'});
 await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='New project');
 assert.deepEqual(errors,[]);
 console.log('PASS project/initiative create validation, failure draft/retry, selected state, reload, edit retry/reload, narrow bounds and Escape focus; zero page errors');
}finally{await browser.close();}
