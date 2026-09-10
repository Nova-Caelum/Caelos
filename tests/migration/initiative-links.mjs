// Browser contract fixtures: UUID link writes and MCP reads; no production mutations.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const project={code:'migration-fixture',name:'Migration fixture',status:'in-progress',team:[]};
const initiative={id:'init-uuid',external_id:'INIT-fixture',title:'Initiative fixture',state:'planned',doc_paths:[]};
const mod={id:'module-uuid',external_id:'module-fixture',name:'Linked module',project_code:project.code,state:'ready',team:[]};
const task={id:'task-uuid',external_id:'task-fixture',name:'Linked task',project_code:project.code,state:'ready',assignee_agent:'daniel'};
let failLink=false,failDoc=false;const writes=[];const links=[];
await page.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.pathname.startsWith('/api/')){
  let data=[];
  if(u.pathname==='/api/projects')data=[project];
  if(u.pathname==='/api/initiatives')data=[initiative];
  if(u.pathname.endsWith('/modules'))data=[mod];
  if(u.pathname.endsWith('/work-items'))data=[task];
  if(u.pathname.includes('/links')){
   writes.push({method:req.method(),body:req.method()==='POST'?req.postDataJSON():null,path:u.pathname});
   if(failLink){await route.fulfill({status:500,body:'fixture link failure'});return;}
   assert(u.pathname.startsWith('/api/initiatives/init-uuid/links'),'Link write must use initiative UUID');
   if(req.method()==='POST'){const body=req.postDataJSON();links.push({link_type:body.link_type,target:body.target_id});}
   if(req.method()==='DELETE'){const parts=u.pathname.split('/');const at=links.findIndex(l=>l.link_type===parts.at(-2)&&l.target===decodeURIComponent(parts.at(-1)));assert(at>=0);links.splice(at,1);}
   data={};
  }
  if(u.pathname==='/api/initiatives/INIT-fixture'){
   assert.equal(req.method(),'PATCH');writes.push({path:u.pathname,method:req.method(),body:req.postDataJSON()});
   if(failDoc){await route.fulfill({status:500,body:'fixture save failure'});return;}
   Object.assign(initiative,req.postDataJSON());data=initiative;
  }
  await route.fulfill({json:data});return;
 }
 if(u.pathname==='/mcp'){const {params}=req.postDataJSON();await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify(params.name==='list_initiative_links'?links:[])}]}}});return;}
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});
const settle=async l=>l.evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
try{
 await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
 await page.locator('aside').getByRole('button',{name:'Initiative fixture',exact:true}).click();
 assert(await page.getByRole('button',{name:'Link module',exact:true}).isDisabled());
 for(const [kind,label,field,id] of [['project','Migration fixture','project_ids','migration-fixture'],['module','Linked module','module_ids','module-fixture'],['work item','Linked task','work_item_ids','task-fixture']]){
  const trigger=page.getByRole('button',{name:`Link ${kind}`,exact:true});await trigger.click();
  const dialog=page.getByRole('dialog');await settle(dialog);failLink=true;
  await dialog.getByRole('button',{name:new RegExp(label)}).click();await page.getByText('Failed',{exact:true}).last().waitFor();
  assert(await dialog.isVisible());await page.waitForFunction(()=>!document.querySelector('[role=dialog] button[disabled]'));
  await page.setViewportSize({width:390,height:844});await settle(dialog);
  const b=await dialog.boundingBox();assert(b.x>=0 && b.x+b.width<=391);
  await page.screenshot({path:`/private/tmp/caelos-release-20260909/initiative-link-${kind.replace(' ','-')}.png`});
  failLink=false;await dialog.getByRole('button',{name:new RegExp(label)}).click();await dialog.waitFor({state:'detached'});
  assert.deepEqual(writes.at(-1).body,{link_type:kind==='work item'?'work_item':kind,target_id:id});
  await page.getByRole('button',{name:`Unlink ${label}`,exact:true}).waitFor();
  await page.setViewportSize({width:1440,height:1000});
 }
 await page.reload();await page.locator('aside').getByRole('button',{name:'Initiative fixture',exact:true}).click();
 for(const label of ['Migration fixture','Linked module','Linked task'])await page.getByRole('button',{name:`Unlink ${label}`,exact:true}).waitFor();
 failLink=true;await page.getByRole('button',{name:'Unlink Linked task',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('[aria-label="Unlink Linked task"][disabled]'));
 assert(await page.getByRole('button',{name:'Unlink Linked task',exact:true}).isVisible());
 failLink=false;await page.getByRole('button',{name:'Unlink Linked task',exact:true}).click();
 await page.getByRole('button',{name:'Unlink Linked task',exact:true}).waitFor({state:'detached'});
 const path=page.getByRole('textbox',{name:'Relevant file path',exact:true});await path.fill('/workspace/notes.md');
 failDoc=true;await path.press('Enter');await page.getByText('Failed to update initiative',{exact:true}).waitFor();
 assert.equal(await path.inputValue(),'/workspace/notes.md');
 failDoc=false;await page.getByRole('button',{name:'Add relevant file',exact:true}).click();
 await page.getByRole('button',{name:'Remove /workspace/notes.md',exact:true}).waitFor();assert.equal(await path.inputValue(),'');
 await page.mouse.move(900,100);await page.screenshot({path:'/private/tmp/caelos-release-20260909/initiative-details.png'});
 await page.getByRole('button',{name:'Link project',exact:true}).click();await settle(page.getByRole('dialog'));
 await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});
 await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Link project');
 await page.reload();await page.locator('aside').getByRole('button',{name:'Initiative fixture',exact:true}).click();
 await page.getByRole('button',{name:'Remove /workspace/notes.md',exact:true}).waitFor();
 await page.getByRole('button',{name:'Change status: Planned',exact:true}).click();
 await page.getByRole('menuitemradio',{name:'In Progress',exact:true}).click();
 await page.getByRole('button',{name:'Change status: In Progress',exact:true}).waitFor();assert.equal(initiative.state,'in-progress');
 await page.reload();await page.locator('aside').getByRole('button',{name:'Initiative fixture',exact:true}).click();
 await page.getByRole('button',{name:'Change status: In Progress',exact:true}).waitFor();
 await page.locator('aside').getByRole('button',{name:'Initiative fixture',exact:true}).click({button:'right'});
 await page.getByRole('menuitem',{name:'Archive',exact:true}).click();
 const archive=page.getByRole('dialog');await settle(archive);await archive.getByRole('button',{name:'Archive',exact:true}).click();await archive.waitFor({state:'hidden'});
 assert.equal(initiative.state,'archived');assert.equal(writes.at(-1).method,'PATCH');assert.deepEqual(writes.at(-1).body,{state:'archived'});
 assert.deepEqual(errors,[]);console.log('PASS initiative UI adapter fixtures: three link retries, unlink failure/retry, narrow dialogs, Escape focus, document failure draft/retry/reload; zero page errors. UUID write contracts and fixture-backed reload verified; production untouched.');
}finally{await browser.close();}
