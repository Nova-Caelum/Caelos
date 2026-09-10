import { chromium } from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('/private/tmp/caelos-release-20260909', { recursive: true });
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000);
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const project={code:'migration-fixture',name:'Migration fixture',description:'Local isolated migration verification',folder_path:'/workspace/fixture',created_at:'2026-09-01T12:00:00Z',status:'in-progress',team:[],owner:'daniel'};
let failSave=false, failActivity=true;
const tasks=[{id:'task-uuid',external_id:'fixture-task',project_code:project.code,name:'Verify migration interactions',state:'ready',priority:'medium',assignee_agent:'daniel',description:'Keep this draft when saving fails',acceptance_criteria:'Controls preserve their application behavior.'}];
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
    if(route.request().method()==='PATCH') {
      if(failSave){await route.fulfill({status:500,body:'fixture failure'});return;}
      Object.assign(tasks[0],route.request().postDataJSON());
    }
    data=tasks[0];
  }
  await route.fulfill({json:data}); return;
 }
 if(u.pathname==='/mcp'){const {params}=route.request().postDataJSON(); if(params.name==='get_recent_activity'){ if(failActivity)return route.fulfill({status:500,body:'fixture activity failure'}); return route.fulfill({json:{jsonrpc:'2.0',id:1,result:{content:[{type:'text',text:JSON.stringify([{id:'own',work_item_id:'task-uuid',project:project.code,summary:'Correct task UUID entry',author:'Fixture',created_at:'2026-09-10T12:00:00Z'},{id:'other',work_item_id:'other-task',project:project.code,summary:'Unrelated task entry',author:'Fixture',created_at:'2026-09-10T12:00:00Z'}])}]}}}); } if(params.name==='upsert_project'){ if(failSave){await route.fulfill({status:500,body:'fixture save failure'});return;} Object.assign(project,params.arguments); await route.fulfill({json:{result:{content:[{type:'text',text:JSON.stringify({row:project})}]}}});return;}await route.fulfill({json:{jsonrpc:'2.0',id:1,result:{content:[{type:'text',text:'[]'}]}}}); return;}
 if(!['localhost','127.0.0.1'].includes(u.hostname)){await route.abort();return;}
 await route.continue();
});

try {
 await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5195');
 await page.getByText('Verify migration interactions',{exact:true}).click();
 const drawer=page.getByRole('dialog');await drawer.waitFor();
 const trigger=drawer.getByRole('button',{name:'Activity',exact:true});await trigger.click();
 const panel=page.locator('[data-activity-panel]');await panel.getByText('Could not load activity.',{exact:true}).waitFor();
 failActivity=false;await panel.getByRole('button',{name:'Retry',exact:true}).click();
 await panel.getByText('Correct task UUID entry',{exact:true}).waitFor();
 if(await panel.getByText('Unrelated task entry',{exact:true}).count())throw Error('Activity includes unrelated task');
 await panel.getByText('Activity is read-only here.',{exact:true}).waitFor();
 if(await panel.getByRole('textbox').count())throw Error('No-op note field remains');
 await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});
 if(!await trigger.evaluate(e=>e===document.activeElement))throw Error('Activity focus not restored');
 if(!await drawer.isVisible())throw Error('Escape closed parent drawer');
 await page.setViewportSize({width:390,height:844});await trigger.click();
 await panel.getByText('Correct task UUID entry',{exact:true}).waitFor();
 const bounds=await panel.boundingBox();if(bounds.x<0||bounds.x+bounds.width>390)throw Error('Activity clips viewport');
 await page.mouse.move(0,0);await page.waitForTimeout(350);
 console.log('Popover surface',await panel.evaluate(e=>({background:getComputedStyle(e).background,blur:getComputedStyle(e).backdropFilter,opacity:getComputedStyle(e).opacity})));
 await page.screenshot({path:'/private/tmp/caelos-release-20260909/activity-narrow.png'});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS Activity Popover: UUID scope, failed load/retry, read-only disclosure, Escape/focus preserves drawer, narrow bounds; intercepted data only');
} finally { await browser.close(); }
