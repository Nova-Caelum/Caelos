import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = [], loaded = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => loaded.push(new URL(r.url()).pathname));
await page.route('**/*', async route => {
  const u = new URL(route.request().url());
  if (u.pathname.startsWith('/api/') || u.pathname === '/mcp') return route.fulfill({ json: [] });
  if (u.pathname.startsWith('/__foundry/')) return route.fulfill({ status: 400, json: { error: 'Fixture: no administrative writes' } });
  if (process.env.VERIFY_REMOTE_FONTS === '1' && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname)) return route.continue();
  if (!['localhost', '127.0.0.1'].includes(u.hostname)) return route.abort();
  return route.continue();
});
try {
  const base = process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5193/';
  for (const query of ['lab=1', 'lab=2', 'lab=3', 'locked=1', 'primitives=1']) {
    await page.goto(new URL('?' + query, base).href);
    await page.getByRole('heading', { name: 'The approved collection.', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Components', exact: true }).getAttribute('aria-current'), 'page');
  }
  assert.ok(!loaded.some(p => /DesignLab|LockedStudio|PrimitivesReview|PrimitiveGallery|src\/primitives/.test(p)), 'Retired showcase code loaded');
  const disclosure = page.getByRole('button', { name: 'People & agents', exact: true });
  await disclosure.click();
  const duration = await disclosure.evaluate(e => getComputedStyle(document.getElementById(e.getAttribute('aria-controls'))).transitionDuration);
  assert.ok(duration.split(',').every(s => parseFloat(s) <= 0.001), 'Reduced motion not applied to disclosure: ' + duration);
  if (process.env.VERIFY_REMOTE_FONTS === '1') {
    const fonts = await page.evaluate(async () => {
      const families = ['IBM Plex Sans', 'IBM Plex Mono', 'Yrsa'];
      return Promise.all(families.map(async family => ({ family, loaded: (await document.fonts.load('400 14px "' + family + '"')).length })));
    });
    assert.ok(fonts.every(f => f.loaded > 0), 'Font downloads not verified: ' + JSON.stringify(fonts));
    console.log('PASS downloaded font faces: ' + JSON.stringify(fonts));
  }
  await page.screenshot({ path: '/private/tmp/caelos-release-20260909/showcase-current-dark.png' });
  await page.getByRole('button', { name: 'Switch to light', exact: true }).click();
  await page.screenshot({ path: '/private/tmp/caelos-release-20260909/showcase-current-light.png' });
  assert.deepEqual(errors, []);
  console.log('PASS all five retired bookmarks use the shared gallery; retired modules absent; reduced motion; zero page errors');
} finally { await browser.close(); }
