import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Playwright normally hides scrollbars, concealing duplicate scroll-lock gutters.
const browser = await chromium.launch({ headless: true, ignoreDefaultArgs: ['--hide-scrollbars'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:3101/ui-lab';
const position = () => page.evaluate(() => ({
  width: document.body.getBoundingClientRect().width,
  x: document.querySelector('main').getBoundingClientRect().x,
  y: scrollY,
}));
const stable = (before, after) => {
  for (const key of Object.keys(before)) assert.ok(Math.abs(before[key] - after[key]) < 1, `${key} shifted: ${before[key]} → ${after[key]}`);
};
try {
  for (const width of [1280, 353]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(url);
    await page.getByRole('tab', { name: 'Info', exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (process.env.REGRESSION_OLD_LOCK) await page.addStyleTag({content:'html:has(.nova-ui-lab) { overflow: hidden auto !important; }'});
    for (const [trigger, option] of [
      [page.getByRole('combobox', { name: 'Workspace', exact: true }), page.getByRole('option', { name: 'Design studio', exact: true })],
      [page.getByRole('combobox', { name: 'Project', exact: true }), page.getByRole('option', { name: 'Engineering', exact: true })],
      [page.getByRole('button', { name: /^Change status:/ }).first(), page.getByRole('menuitemradio', { name: 'Completed', exact: true })],
    ]) {
      await trigger.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const before = await position();
      await trigger.click();
      await option.waitFor();
      stable(before, await position());
      await page.waitForTimeout(250);
      await option.click();
      await option.waitFor({state:'hidden'});
      await page.waitForFunction(() => !document.body.hasAttribute('data-scroll-locked'));
      stable(before, await position());
      assert.ok(await trigger.evaluate(e => e === document.activeElement), 'selection restores trigger focus');
    }
    const field = page.getByRole('combobox', {name:'Workspace',exact:true,includeHidden:true});
    await field.click();
    await page.getByRole('option', {name:'Design studio',exact:true}).waitFor();
    await page.waitForTimeout(250);
    const triggerBox = await field.boundingBox(), menuBox = await page.getByRole('listbox').boundingBox();
    assert.ok(Math.abs(triggerBox.width - menuBox.width) < 1, 'form dropdown matches field width');
    assert.ok(menuBox.x >= 0 && menuBox.x + menuBox.width <= width, 'dropdown fits viewport');
    await page.screenshot({path:`/private/tmp/caelos-react19/dropdown-${width}.png`});
    await page.keyboard.press('Escape');
    await page.getByRole('listbox').waitFor({state:'hidden'});
    assert.ok(await field.evaluate(e => e === document.activeElement));
    console.log(`PASS ${width}px dropdown selection: stable page width/scroll, focus return, field width, Escape`);
  }

  await page.setViewportSize({width:1280,height:850});
  await page.goto(url);
  const tabs = page.getByRole('tablist', {name:'Project sections'});
  const indicator = tabs.locator('[data-nc-tab-indicator]');
  assert.deepEqual(await tabs.getByRole('tab').allTextContents(), ['Info', 'Tasks', 'Cycles', 'Team']);
  await tabs.scrollIntoViewIfNeeded();
  const start = await indicator.boundingBox();
  await page.getByRole('tab', {name:'Team',exact:true}).click();
  await indicator.evaluate(e => { for(const a of e.getAnimations()){ a.pause(); a.currentTime=160; } });
  const mid = await indicator.boundingBox(), target = await page.getByRole('tab', {name:'Team',exact:true}).boundingBox();
  assert.ok(mid.x > start.x && mid.x < target.x, 'highlight visibly travels between tabs');
  await indicator.evaluate(e => e.getAnimations().forEach(a=>a.finish()));
  const aligned = async () => {
    await page.waitForTimeout(350);
    const pill = await indicator.boundingBox(), active = await tabs.locator('[aria-selected=true]').boundingBox();
    for(const key of ['x','y','width','height']) assert.ok(Math.abs(pill[key]-active[key]) <= 1, `tab indicator ${key} aligned`);
  };
  await aligned();
  await page.getByRole('tab', {name:'Team',exact:true}).press('ArrowLeft');
  await tabs.locator('[role="tab"][aria-selected="true"]').filter({hasText:'Cycles'}).waitFor();
  assert.equal(await page.getByRole('tab', {name:'Cycles',exact:true}).getAttribute('aria-selected'), 'true');
  await aligned();
  await tabs.screenshot({path:'/private/tmp/caelos-react19/tabs.png'});
  await page.setViewportSize({width:353,height:850});
  await page.getByRole('tab', {name:'Team',exact:true}).click();
  await aligned();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('tab', {name:'Tasks',exact:true}).click();
  assert.equal(await indicator.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await aligned();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button', {name:'Reduce motion',exact:true}).click();
  assert.equal(await indicator.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await page.getByRole('button', {name:'Switch to light',exact:true}).click();
  await page.getByRole('combobox', {name:'Workspace',exact:true}).click();
  await page.waitForTimeout(100);
  await page.screenshot({path:'/private/tmp/caelos-react19/dropdown-light.png'});
  assert.equal(await page.getByRole('listbox').getAttribute('data-caelos-theme'),'light');
  assert.deepEqual(errors, []);
  console.log('PASS normal-case tabs, sliding highlight, keyboard, wrapped layout, system/provider reduced motion, light dropdown; zero page errors');
} finally { await browser.close(); }
