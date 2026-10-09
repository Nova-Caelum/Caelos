// Optional reads: the Open runs section and the Worklog tab read routes that only the
// Hyperspace engine's door serves. A server without them (Nova's ops-server) answers 404,
// and the console must then hide both — no error text. Any other failure (here 500) is a
// real failure and must still show its inline error. A 200 shows both normally.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000);
const errors = []; page.on('pageerror', e => errors.push(e.message));

const project = { code: 'optional-reads', name: 'Optional reads fixture', created_at: '2026-09-01T12:00:00Z', status: 'in-progress', team: [] };
const module = { id: 'module-uuid', external_id: 'reads-module', project_code: project.code, name: 'Reads module', state: 'ready', team: [] };
let mode = '404';
const reads = { runs: 0, worklog: 0 };

await page.route('**/*', async route => {
  const u = new URL(route.request().url());
  if (u.pathname === '/mcp') { await route.fulfill({ json: { jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: '[]' }] } } }); return; }
  if (u.pathname.startsWith('/api/')) {
    const optional = u.pathname === '/api/worklog' ? 'worklog' : u.pathname.endsWith('/runs') ? 'runs' : null;
    if (optional) {
      reads[optional] += 1;
      if (mode === '404') { await route.fulfill({ status: 404, json: { detail: 'Not Found' } }); return; }
      if (mode === '500') { await route.fulfill({ status: 500, json: { error: `${optional} read exploded` } }); return; }
      await route.fulfill({ json: [] }); return;
    }
    let data = [];
    if (u.pathname === '/api/projects') data = [project];
    if (u.pathname.endsWith('/modules')) data = [module];
    if (u.pathname.startsWith('/api/modules/')) data = module;
    await route.fulfill({ json: data }); return;
  }
  if (!['localhost', '127.0.0.1'].includes(u.hostname)) { await route.abort(); return; }
  await route.continue();
});

async function open(nextMode) {
  mode = nextMode; reads.runs = 0; reads.worklog = 0;
  await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193');
  await page.getByRole('heading', { name: project.name, exact: true }).waitFor();
  // Let both optional reads land before asserting what they left behind.
  await page.waitForFunction(() => !document.body.innerText.includes('Reading runs…'));
  await page.waitForTimeout(300);
}
async function openModule() {
  await page.getByRole('button', { name: `Open ${module.name}`, exact: true }).click();
  const drawer = page.getByRole('dialog').filter({ hasText: module.name }).first();
  await drawer.waitFor();
  await page.waitForTimeout(300);
  return drawer;
}
const worklogTab = () => page.getByRole('tab', { name: 'Worklog', exact: true });

try {
  // 404: the server has no such reads — hide both, say nothing.
  await open('404');
  // Give the console its chance to try both reads (it may probe the worklog route on load).
  for (let i = 0; i < 25 && !(reads.runs && reads.worklog); i++) await page.waitForTimeout(200);
  const hidden = [];
  if (await page.locator('[data-open-runs]').count()) hidden.push('404: the project page still shows an Open runs section');
  if (await page.getByText("Couldn't read", { exact: false }).count()) hidden.push('404: the project page shows an error');
  if (await worklogTab().count()) hidden.push('404: the Worklog tab is still offered');
  let drawer = await openModule();
  if (await drawer.locator('[data-open-runs]').count()) hidden.push('404: the module page still shows an Open runs section');
  if (await drawer.getByText("Couldn't read", { exact: false }).count()) hidden.push('404: the module page shows an error');
  assert.deepEqual(hidden, [], hidden.join('; '));
  await page.keyboard.press('Escape');

  // 500: a real failure — both still say so.
  await open('500');
  const projectError = page.locator('[data-open-runs="project"] [data-open-runs-error]');
  await projectError.waitFor();
  assert.match(await projectError.innerText(), /runs read exploded/, '500: the project page hides the reason');
  drawer = await openModule();
  await drawer.locator('[data-open-runs="module"] [data-open-runs-error]').waitFor();
  await page.keyboard.press('Escape');
  await worklogTab().click();
  const worklogError = page.locator('[data-worklog-error]');
  await worklogError.waitFor();
  assert.match(await worklogError.innerText(), /worklog read exploded/, '500: the Worklog tab hides the reason');

  // 200: both present as normal.
  await open('200');
  await page.locator('[data-open-runs="project"]').getByText('No run open yet — the first step of new work is Understand.', { exact: true }).waitFor();
  await worklogTab().click();
  await page.getByText('No worklog entries for this project yet.', { exact: true }).waitFor();

  assert.deepEqual(errors, []);
  console.log('PASS optional reads: 404 hides Open runs (project + module) and the Worklog tab with no error; 500 shows both errors with the reason; 200 shows both; zero page errors');
} finally {
  await browser.close();
}
