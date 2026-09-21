import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.env.PREVIEW_URL || 'http://127.0.0.1:3101/ui-lab';
const output = '/private/tmp/caelos-react19';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && /React|hydration|inert|Invalid hook/i.test(message.text())) errors.push(message.text());
});
await page.addInitScript(() => {
  const observers = new Set(), visibility = new Set(), motion = new Set(), frames = new Set();
  let observed = 0, disconnected = 0;
  const OriginalObserver = window.ResizeObserver;
  window.ResizeObserver = class extends OriginalObserver {
    observe(target, options) {
      if (target.closest('[data-loader-fixture]')) { observers.add(this); observed++; }
      return super.observe(target, options);
    }
    disconnect() {
      if (observers.delete(this)) disconnected++;
      return super.disconnect();
    }
  };
  const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function(type, callback, options) {
    if (this === document && type === 'visibilitychange') visibility.add(callback);
    if (this instanceof MediaQueryList && this.media === '(prefers-reduced-motion: reduce)' && type === 'change') motion.add(callback);
    return add.call(this, type, callback, options);
  };
  EventTarget.prototype.removeEventListener = function(type, callback, options) {
    if (this === document && type === 'visibilitychange') visibility.delete(callback);
    if (this instanceof MediaQueryList && this.media === '(prefers-reduced-motion: reduce)' && type === 'change') motion.delete(callback);
    return remove.call(this, type, callback, options);
  };
  const request = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
  window.requestAnimationFrame = callback => {
    const id = request(time => { frames.delete(id); callback(time); });
    frames.add(id);
    return id;
  };
  window.cancelAnimationFrame = id => { frames.delete(id); cancel(id); };
  window.loaderResources = () => ({ observers: observers.size, observed, disconnected, visibility: visibility.size, motion: motion.size, frames: frames.size });
});

try {
  await page.goto(url);
  const small = page.getByRole('status', { name: 'Small loading indicator', exact: true });
  const large = page.getByRole('status', { name: 'Large loading indicator', exact: true });
  const still = page.getByRole('status', { name: 'Static loading indicator', exact: true });
  await small.locator('svg').waitFor();
  const shape = locator => locator.locator('path').first().getAttribute('d');
  const unchanged = async locator => {
    await page.waitForTimeout(100);
    const before = await shape(locator);
    await page.waitForTimeout(150);
    assert.equal(await shape(locator), before);
  };
  const animates = async locator => {
    const before = await shape(locator);
    await page.waitForFunction(({ label, before }) => document.querySelector(`[aria-label="${label}"] path`)?.getAttribute('d') !== before,
      { label: await locator.getAttribute('aria-label'), before });
  };
  assert.equal((await small.boundingBox()).width, 32);
  assert.equal((await large.boundingBox()).width, 64);
  assert.equal(await page.locator('[data-loader-fixture] svg').count(), 3);
  const first = await page.evaluate(() => window.loaderResources());
  assert.equal(first.observers, 3);
  await animates(small);
  await unchanged(still);
  console.log('PASS React 19 loader sizes, animated and static states');

  await page.getByRole('button', { name: 'Pause loaders', exact: true }).click();
  await unchanged(small); await unchanged(large);
  await page.getByRole('button', { name: 'Resume loaders', exact: true }).click();
  await animates(small);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await unchanged(small); await unchanged(large);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await animates(small);
  await page.getByRole('button', { name: 'Reduce motion', exact: true }).click();
  await unchanged(small);
  await page.getByRole('button', { name: 'Reduce motion', exact: true }).click();
  await animates(small);
  console.log('PASS pause/resume, system reduced motion and provider reduced motion');

  await page.getByRole('button', { name: 'Unmount loaders', exact: true }).click();
  await page.waitForTimeout(250);
  const baseline = await page.evaluate(() => window.loaderResources());
  assert.equal(baseline.observers, 0);
  assert.equal(baseline.observed, baseline.disconnected);
  for (let i = 0; i < 3; i++) {
    const beforeMount = await page.evaluate(() => window.loaderResources());
    await page.getByRole('button', { name: 'Mount loaders', exact: true }).click();
    await animates(small);
    const mounted = await page.evaluate(() => window.loaderResources());
    assert.equal(mounted.observers, 3);
    // Each fresh client mount runs setup → cleanup → setup under StrictMode.
    assert.equal(mounted.observed - beforeMount.observed, 6);
    assert.equal(mounted.disconnected - beforeMount.disconnected, 3);
    assert.equal(mounted.visibility, baseline.visibility + 3);
    assert.equal(mounted.motion, baseline.motion + 3);
    await page.getByRole('button', { name: 'Unmount loaders', exact: true }).click();
    await page.waitForTimeout(250);
    const removed = await page.evaluate(() => window.loaderResources());
    assert.equal(removed.observers, 0);
    assert.equal(removed.observed, removed.disconnected);
    assert.equal(removed.visibility, baseline.visibility);
    assert.equal(removed.motion, baseline.motion);
    assert.equal(removed.frames, baseline.frames);
  }
  console.log('PASS StrictMode effect replay and repeated unmount/remount release observers, listeners and animation frames');
  await page.getByRole('button', { name: 'Mount loaders', exact: true }).click();
  await page.getByRole('button', { name: 'Pause loaders', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${output}/desktop-dark.png`, fullPage: true });
  await page.getByRole('button', { name: 'Switch to light', exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${output}/desktop-light.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${output}/narrow-light.png`, fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark', exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${output}/narrow-dark.png`, fullPage: true });
  await page.getByRole('region', { name: 'Nova Caelum loading animation' }).screenshot({ path: `${output}/loaders.png` });
  console.log('PASS desktop/narrow layout bounds and screenshots');

  await page.goto(new URL('/', url).href);
  await page.getByRole('textbox').first().waitFor();
  await page.getByRole('textbox').first().fill('React 19 compatibility draft');
  assert.equal(await page.getByRole('textbox').first().inputValue(), 'React 19 compatibility draft');
  await page.screenshot({ path: `${output}/chat.png`, fullPage: true });
  const original = await page.request.get('http://127.0.0.1:3100/ping');
  assert.equal(original.status(), 200);
  assert.equal(await original.text(), 'pong');
  assert.deepEqual(errors, []);
  console.log('PASS chatbot loads and accepts a draft; original port 3100 healthy; zero React/page errors');
} finally {
  await browser.close();
}
