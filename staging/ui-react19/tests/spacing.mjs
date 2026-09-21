// Verify the built shared package and its actual pinned Foundry consumer.
// PREVIEW_URL may target another build of the React 19 gallery.
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FieldGroup, SectionStack, SpacingDensity, Section } from '../dist/index.js';
import { spacing } from '../dist/host-recipes.js';
import { chromium } from 'playwright';

const el = React.createElement;
const markup = renderToStaticMarkup(el(React.Fragment, null,
  el(FieldGroup, { id: 'bare' }),
  el(SpacingDensity, { value: 'compact' },
    el(FieldGroup, { id: 'inherited' }),
    el(SpacingDensity, { value: 'default' }, el(FieldGroup, { id: 'reset' })),
    el(SectionStack, { id: 'still-compact' })),
  el(Section, { title: 'Accessible section', level: 3 }, 'Body')));
for (const [id, density] of [['bare','default'],['inherited','compact'],['reset','default'],['still-compact','compact']]) {
  assert.match(markup, new RegExp(`id="${id}"[^>]*data-spacing-density="${density}"`));
}
assert.match(markup, /aria-labelledby="([^"]+)"[^>]*>.*?<h3 id="\1"/);
assert.match(spacing({ kind: 'fields' }), /density_default/);
console.log('PASS public API default, nested inheritance/reset, heading association and recipe default');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:5196/foundry-react19/?tab=spacing');
  const gallery = page.locator('.spacing-gallery');
  await gallery.waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await gallery.getByRole('button', { name: 'Default', exact: true }).getAttribute('aria-pressed'), 'true');
  const expected = { Compact: [18,24,12,18], Default: [21,27,15,21], Comfortable: [24,30,18,24] };
  let cases = 0;
  for (const width of [1200, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const long of [false, true]) {
      await gallery.getByRole('checkbox', { name: 'Long content' }).setChecked(long);
      for (const [density, values] of Object.entries(expected)) {
        await gallery.getByRole('button', { name: density, exact: true }).click();
        const geometry = await gallery.locator('[data-testid=specimen]').evaluate(root => {
          const get = selector => root.querySelector(selector);
          const number = (selector, prop) => parseFloat(getComputedStyle(get(selector))[prop]);
          const field = get('[data-relation=fields]');
          const first = field.children[0].getBoundingClientRect(), second = field.children[1].getBoundingClientRect();
          const label = field.children[0].querySelector('label');
          const control = label.nextElementSibling;
          const section = get('[data-relation=section]');
          const intro = section.children[0].getBoundingClientRect(), content = section.children[1].getBoundingClientRect();
          const box = root.getBoundingClientRect();
          return {
            values: [number('[data-relation=fields]','rowGap'), number('[data-relation=sections]','rowGap'), number('[data-relation=section]','rowGap'), number('[data-relation=inset]','paddingLeft')],
            actualField: second.top - first.bottom,
            actualIntro: content.top - intro.bottom,
            interior: control.getBoundingClientRect().top - label.getBoundingClientRect().bottom,
            overflow: [...root.querySelectorAll('*')].filter(e => { const b=e.getBoundingClientRect(); return b.width > 0 && (b.left < box.left-1 || b.right > box.right+1); }).map(e=>e.tagName),
            pageOverflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        assert.deepEqual(geometry.values, values, `${width}/${long}/${density}`);
        assert.ok(Math.abs(geometry.actualField - values[0]) < .6, 'actual field geometry includes unexpected margins');
        assert.ok(Math.abs(geometry.actualIntro - values[2]) < .6, 'actual section geometry includes unexpected margins');
        assert.equal(geometry.interior, 8, 'field interiors must stay unchanged');
        assert.deepEqual(geometry.overflow, [], `${width}/${long}/${density} specimen overflow`);
        assert.equal(geometry.pageOverflow, false, `${width}/${long}/${density} page overflow`);
        cases++;
      }
    }
  }
  console.log(`PASS ${cases} actual layout cases across 3 densities, 3 viewport widths and normal/long content`);
  await gallery.getByRole('button', { name: 'Show crowded comparison' }).click();
  assert.equal(await gallery.locator('.comparison [data-relation=fields]').evaluate(e => getComputedStyle(e).rowGap), '21px');
  await page.getByRole('button', { name: 'Switch to light' }).click();
  assert.equal(await page.locator('.foundry-panda').getAttribute('data-caelos-theme'), 'light');
  assert.equal(await gallery.locator('[data-testid=primary-fields]').evaluate(e => getComputedStyle(e).rowGap), '24px');
  // Native buttons preserve keyboard operation; Radix handles collection tabs.
  await gallery.getByRole('button', { name: 'Default', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await gallery.getByRole('button', { name: 'Default', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('tab', { name: 'Spacing', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await page.getByRole('heading', { name: 'Surfaces & selection' }).waitFor();
  await page.keyboard.press('ArrowRight');
  await gallery.waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS default comparison, light theme, keyboard density/tab switching and no page errors');
  await page.getByRole('tab', { name: 'Components', exact: true }).click();
  for (const width of [1200, 560, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const layout = await page.locator('.collection-specimens').evaluate(root => {
      const fields = root.querySelector('[data-testid=collection-fields]');
      const children = [...fields.children];
      const profile = [...root.querySelectorAll('button')].find(e => e.textContent === 'Profile');
      const card = profile.parentElement.parentElement;
      const identity = card.children[1].getBoundingClientRect();
      const action = profile.getBoundingClientRect();
      return {
        fields: children.slice(1).map((e, i) => e.getBoundingClientRect().top - children[i].getBoundingClientRect().bottom),
        groups: getComputedStyle(root).rowGap,
        intros: [...root.querySelectorAll('[data-relation=section]')].map(e => getComputedStyle(e).rowGap),
        overflow: document.documentElement.scrollWidth > innerWidth,
        identityWidth: identity.width,
        actionBelow: action.top >= identity.bottom,
      };
    });
    assert.ok(layout.fields.every(gap => Math.abs(gap - 21) < .6), `${width}: complete fields need 21px gaps`);
    assert.equal(layout.groups, '27px');
    assert.ok(layout.intros.every(gap => gap === '15px'));
    assert.equal(layout.overflow, false, `${width}: collection page overflow`);
    assert.ok(layout.identityWidth >= 100, `${width}: profile action must not crush the identity text`);
    if (width === 320) assert.equal(layout.actionBelow, true, 'narrow profile action must wrap below identity');
  }
  assert.deepEqual(errors, []);
  console.log('PASS Components gallery field/group rhythm and readable identity cards at 1200/560/390/320px');
} finally {
  await browser.close();
}
