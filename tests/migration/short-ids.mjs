// Short task identifiers (`TCF-42`) on rows, in the drawer header, in search, and in the
// clipboard — plus the case that matters most right now: the backend column does not exist
// yet, so a project whose rows carry no `short_id` must lay out exactly as it does today.
//
// Run as documented in README.md, against the production preview (a dev server can serve a
// stale optimized copy of @nova-caelum/ui and silently test the previous build):
//   ./node_modules/.bin/vite build
//   VITE_API_BASE_URL=http://127.0.0.1:5199 VITE_BEARER_TOKEN= \
//     ./node_modules/.bin/vite preview --host 127.0.0.1 --port 5194 --strictPort
//   MIGRATION_PREVIEW_URL=http://127.0.0.1:5194 node tests/migration/short-ids.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const evidence = '/private/tmp/caelos-release-20260909'; await fs.mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
// Chromium-only, and the reason this suite reads the real clipboard instead of stubbing
// navigator.clipboard: a stub would pass even if the control never called it.
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5194' });
const page = await context.newPage(); page.setDefaultTimeout(10000);
const errors = []; page.on('pageerror', e => errors.push(e.message));

const project = { code: 'migration-fixture', name: 'Migration fixture', status: 'in-progress', team: [], owner: 'daniel' };
const modules = [{ id: 'mod-uuid', external_id: 'module-fixture', project_code: project.code, name: 'Module fixture', state: 'ready', team: [] }];
const task = (id, name, extra = {}) => ({ id: id + '-uuid', external_id: id, project_code: project.code, name, state: 'ready', description: 'Full task detail', assignee_agent: 'daniel', ...extra });
// Three identified rows and two unidentified ones, in one project. The mixed fixture is
// deliberate: a half-migrated project is the state production is actually in the moment
// the backend starts numbering, and the two shapes have to coexist in one list.
const tasks = [
  // Three identifier lengths on purpose — 5, 6 and 7 characters — so the alignment
  // check below has something to fail on if the slot ever goes back to shrink-to-fit.
  task('task-a', 'Task Alpha', { module_id: 'module-fixture', short_id: 'TCF-42' }),
  task('task-b', 'Task Beta', { module_id: 'module-fixture', short_id: 'TCF-7' }),
  task('task-root', 'Root task', { short_id: 'TCF-108' }),
  task('task-child', 'Child task', { parent_work_item_id: 'task-root' }),
  task('task-bare', 'Unnumbered task'),
  // Long enough to wrap at 1440px and far past it at 390px. The wrap state is the one
  // that regressed: centring put the dot and the identifier 10px below the title's
  // first line, and a one-line fixture could never have caught it.
  task('task-wrap', 'A deliberately long task title that wraps onto more than one line so the identifier beside it can be checked against the first line rather than against the middle of the whole block', { module_id: 'module-fixture', short_id: 'TCF-9001' }),
];
const writes = [];
await page.route('**/*', async route => {
  const req = route.request(), u = new URL(req.url());
  if (u.pathname.startsWith('/api/')) {
    let data = [];
    if (u.pathname === '/api/projects') data = [project];
    if (u.pathname.endsWith('/modules')) data = modules;
    if (u.pathname.endsWith('/work-items')) data = tasks;
    if (u.pathname.startsWith('/api/work-items/')) {
      data = tasks.find(t => t.external_id === decodeURIComponent(u.pathname.split('/').at(-1)));
      if (req.method() === 'PATCH') { const patch = req.postDataJSON(); writes.push(patch); Object.assign(data, patch); }
    }
    if (req.method() === 'POST' && u.pathname.endsWith('/work-items')) writes.push(req.postDataJSON());
    await route.fulfill({ json: data }); return;
  }
  if (u.pathname === '/mcp') {
    const { params } = req.postDataJSON(); let data = [];
    if (params.name === 'list_agents') data = [{ agent_name: 'daniel' }, { agent_name: 'caelum' }];
    await route.fulfill({ json: { result: { content: [{ type: 'text', text: JSON.stringify(data) }] } } }); return;
  }
  if (!['localhost', '127.0.0.1'].includes(u.hostname)) { await route.abort(); return; }
  await route.continue();
});

const settle = async el => el.evaluate(e => Promise.all(e.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))));
const row = id => page.locator(`[data-task-id="${id}"]`);
const search = () => page.getByLabel('Search tasks', { exact: true });
const expand = async () => { await page.getByRole('button', { name: 'Expand Module fixture', exact: true }).click(); await row('task-a').waitFor(); };

try {
  await page.goto(process.env.MIGRATION_PREVIEW_URL || 'http://127.0.0.1:5194');
  await page.getByRole('button', { name: 'Expand Module fixture', exact: true }).waitFor();

  // ── 1. Render: every identified row carries its identifier, in the design system's
  //       locked Plex Mono identifier role, quieter than the title beside it.
  await row('task-root').waitFor();
  const idOf = async id => row(id).locator('[data-short-id]').first();
  for (const [id, shortId] of [['task-root', 'TCF-108']]) {
    const chip = await idOf(id);
    assert.equal(await chip.innerText(), shortId, `${id} must show ${shortId}`);
    assert.equal(await chip.getAttribute('data-short-id'), shortId);
  }
  await expand();
  for (const [id, shortId] of [['task-a', 'TCF-42'], ['task-b', 'TCF-7']]) {
    assert.equal(await (await idOf(id)).innerText(), shortId, `${id} must show ${shortId}`);
  }
  const treatment = await (await idOf('task-a')).evaluate(el => {
    const own = getComputedStyle(el);
    const title = el.parentElement.querySelector('button:last-of-type');
    const parse = c => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    // Relative luminance per WCAG 2.1, so the contrast figure below is computed from the
    // pixels the browser actually resolved rather than asserted from the token table.
    const lum = ([r, g, b]) => {
      const [R, G, B] = [r, g, b].map(v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    // Walk up for the nearest painted background: the control is transparent by design.
    let bg = 'rgba(0, 0, 0, 0)', node = el;
    while (node && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) { bg = getComputedStyle(node).backgroundColor; node = node.parentElement; }
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    return {
      font: own.fontFamily, size: own.fontSize, numeric: own.fontVariantNumeric,
      color: own.color, titleColor: getComputedStyle(title).color, background: bg,
      contrast: Math.round(ratio(parse(own.color), parse(bg)) * 100) / 100,
      titleContrast: Math.round(ratio(parse(getComputedStyle(title).color), parse(bg)) * 100) / 100,
      // Position in the DOM order the row actually renders, not the order it was authored.
      beforeTitle: el.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING ? true : false,
    };
  });
  assert.match(treatment.font, /Plex Mono/, 'Identifiers take the locked Plex Mono role: ' + treatment.font);
  assert.equal(treatment.size, '10px', 'Identifier must use the mono recipe size, not an invented one');
  assert.equal(treatment.numeric, 'tabular-nums', 'Digits must align down a column of rows');
  assert.ok(treatment.beforeTitle, 'Identifier must precede the title, not trail a wrapping one');
  assert.notEqual(treatment.color, treatment.titleColor, 'Identifier must read quieter than the title');
  assert.ok(treatment.contrast < treatment.titleContrast, 'Quieter means lower contrast than the title, measured: ' + JSON.stringify(treatment));
  // 4.5:1 at 10px. The identifier is supplementary — the title names the row and the
  // accessible label carries the value — but it is still text a reader must be able to
  // read, so it is held to AA for normal-size text rather than to the large-text floor.
  assert.ok(treatment.contrast >= 4.5, 'Identifier must clear WCAG AA 4.5:1 at 10px, measured: ' + JSON.stringify(treatment));
  console.log('PASS identifier in the mono identifier role, ahead of the title, quieter than it, AA-legible', treatment);

  // ── 1b. The identifier is a column, not a shrink-to-fit chip: identifiers of
  //        different lengths must leave the titles beside them starting at one x.
  const edges = await page.locator('[data-task-id]').evaluateAll(rows => rows
    .filter(r => r.querySelector('[data-short-id]'))
    .map(r => ({
      id: r.querySelector('[data-short-id]').dataset.shortId,
      titleX: Math.round(r.querySelector('[data-task-content] > button:last-of-type').getBoundingClientRect().x * 100) / 100,
      // Subtasks are indented, so compare each title against its own row's identifier.
      idX: Math.round(r.querySelector('[data-short-id]').getBoundingClientRect().x * 100) / 100,
    }))
    .map(e => ({ ...e, offset: Math.round((e.titleX - e.idX) * 100) / 100 })));
  assert.ok(edges.length >= 3, 'Alignment needs several identifier lengths to be meaningful');
  const offsets = [...new Set(edges.map(e => e.offset))];
  assert.equal(offsets.length, 1, 'Titles must start at one offset from their identifier regardless of its length: ' + JSON.stringify(edges));
  console.log('PASS identifiers form a column; every title starts at the same offset', { offset: offsets[0], edges });

  // ── 1c. Vertical alignment, by geometry. The dot, the identifier and the title's
  //        FIRST line must share one axis at every width, theme and wrap state. This is
  //        the check that would have caught the shipped defect: centring held on a
  //        one-line row and put the dot and identifier 10px low the moment a title
  //        wrapped, which at 390px is nearly every row.
  //
  //        Gated on two content-independent quantities:
  //          • the identifier and the title share a BASELINE, and
  //          • the dot sits half an x-height above that shared baseline — the optical
  //            middle of a line of Latin text, and what `vertical-align: middle` means.
  //
  //        Ink centres and inline-box centres are reported but deliberately NOT gated,
  //        because neither is stable under correct layout. An ink centre moves with the
  //        letters the title happens to contain — "Root task" has no descender and
  //        measures 1.45px off a title that does, at an identical baseline — so gating
  //        on it would fail a correct row for its wording. An inline box runs from the
  //        font's ascent to its descent, so two different sizes sharing a baseline can
  //        never also be concentric, and a 6px circle has no descent at all. Baselines
  //        are what a reader actually reads two adjacent texts against.
  const ALIGN_TOLERANCE = 0.5;
  const measureRow = async (taskId) => page.locator(`[data-task-id="${taskId}"] [data-task-content]`).evaluate(content => {
    const round = value => Math.round(value * 100) / 100;
    const fontMetrics = (el, text) => {
      const cs = getComputedStyle(el);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText(text);
      // 'x' gives the x-height of the face at this size — the figure `vertical-align:
      // middle` uses, measured here rather than assumed.
      const xh = ctx.measureText('x').actualBoundingBoxAscent;
      return { ascent: m.fontBoundingBoxAscent, inkAscent: m.actualBoundingBoxAscent, inkDescent: m.actualBoundingBoxDescent, xHeight: xh };
    };
    // Range rects, with nothing inserted into the DOM — a probe element of its own
    // changes the line box it is trying to measure.
    const firstLine = el => {
      const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      const range = document.createRange(); range.selectNodeContents(node);
      const rects = [...range.getClientRects()];
      return { rect: rects[0], lines: rects.length, text: node.textContent };
    };
    const dot = content.querySelector('span[aria-hidden]');
    const id = content.querySelector('[data-short-id]');
    const title = content.querySelector('button:last-of-type');
    const idLine = firstLine(id), titleLine = firstLine(title);
    const idFont = fontMetrics(id, idLine.text), titleFont = fontMetrics(title, titleLine.text);
    const idBaseline = idLine.rect.top + idFont.ascent;
    const titleBaseline = titleLine.rect.top + titleFont.ascent;
    const idInk = idBaseline - (idFont.inkAscent - idFont.inkDescent) / 2;
    const titleInk = titleBaseline - (titleFont.inkAscent - titleFont.inkDescent) / 2;
    const dotBox = dot.getBoundingClientRect(), dotCentre = dotBox.top + dotBox.height / 2;
    return {
      titleLines: titleLine.lines,
      // Gated.
      baseline_id_vs_title: round(idBaseline - titleBaseline),
      dot_vs_optical_middle: round(dotCentre - (titleBaseline - titleFont.xHeight / 2)),
      // Reported only — see the note above on why neither is a gate.
      ink_id_vs_title: round(idInk - titleInk),
      ink_dot_vs_title: round(dotCentre - titleInk),
      inlineBox_id_vs_title: round((idLine.rect.top + idLine.rect.height / 2) - (titleLine.rect.top + titleLine.rect.height / 2)),
    };
  });
  const GATED = ['baseline_id_vs_title', 'dot_vs_optical_middle'];
  const alignmentReport = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['dark', 'light']) {
      // The console pins dark on the provider; flipping the class is how the light
      // surface is reachable at all, and proving geometry does not move with it is
      // the point of running both.
      await page.evaluate(t => {
        const provider = document.querySelector('[data-caelos-theme]') || document.querySelector('.dark') || document.body;
        provider.classList.toggle('dark', t === 'dark');
        provider.setAttribute('data-caelos-theme', t);
      }, theme);
      await page.waitForTimeout(150);
      for (const [surface, id] of [['card row', 'task-a'], ['card row, wrapped', 'task-wrap'], ['root row', 'task-root']]) {
        const m = await measureRow(id);
        const worst = Math.max(...GATED.map(k => Math.abs(m[k])));
        alignmentReport.push({ width, theme, surface, lines: m.titleLines, worst: Math.round(worst * 100) / 100, ...m });
        assert.ok(worst <= ALIGN_TOLERANCE, `Alignment ${surface} @${width}px ${theme}: worst ${worst}px > ${ALIGN_TOLERANCE}px — ${JSON.stringify(m)}`);
      }
    }
  }
  // Wrap-invariance: whatever the residual is, it must not CHANGE when a title wraps.
  // That difference, not the absolute figure, is what the shipped defect actually was.
  for (const key of GATED) {
    const spread = Math.max(...alignmentReport.map(r => r[key])) - Math.min(...alignmentReport.map(r => r[key]));
    assert.ok(spread <= 0.5, `${key} must not move between widths, themes or wrap states; spread ${Math.round(spread * 100) / 100}px`);
  }
  await page.evaluate(() => { const p = document.querySelector('[data-caelos-theme]'); if (p) { p.classList.add('dark'); p.setAttribute('data-caelos-theme', 'dark'); } });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.waitForTimeout(200);
  console.log('PASS dot, identifier and title line 1 share one axis at every width, theme and wrap state');
  console.table(alignmentReport);

  // ── 2. Graceful absence: a row with no identifier renders no identifier element, no
  //       placeholder and no reserved width — and its title is not shifted by its
  //       numbered neighbours. This is production's state until the backend ships.
  assert.equal(await row('task-bare').locator('[data-short-id]').count(), 0, 'Absent short_id must render nothing');
  const [bareBox, numberedBox] = await Promise.all([
    row('task-bare').locator('[data-task-content] > button:last-of-type').boundingBox(),
    row('task-a').locator('[data-task-content] > button:last-of-type').boundingBox(),
  ]);
  assert.ok(bareBox.x < numberedBox.x, 'An unnumbered title must start left of a numbered one, not be padded to match');
  assert.ok(await row('task-bare').locator('[role="status"]').count() === 0, 'Absence must not leave a live region behind');
  // The same assertion the responsive check in task-rows.mjs makes, re-run with the
  // identifier present: the identifier must not be what finally compresses a title.
  await page.setViewportSize({ width: 768, height: 900 }); await page.waitForTimeout(250);
  const widths = await page.locator('[data-task-content] > button:last-of-type').evaluateAll(els => els.filter(e => e.getBoundingClientRect().width > 0).map(e => e.getBoundingClientRect().width));
  assert.ok(widths.length > 0 && widths.every(w => w >= 110), 'Titles compressed by the identifier at 768px: ' + widths.join(','));
  await page.screenshot({ path: evidence + '/short-ids-narrow.png' });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.waitForTimeout(250);
  console.log('PASS absent identifier renders nothing, reserves nothing, and compresses no title', { bareTitleX: bareBox.x, numberedTitleX: numberedBox.x, widths });

  // ── 3. Search finds a task by its identifier, in any case, and does not match rows
  //       that merely share the project key.
  for (const needle of ['TCF-42', 'tcf-42', 'tCf-42']) {
    await search().fill(needle);
    await row('task-b').waitFor({ state: 'detached' });
    assert.equal(await row('task-a').count(), 1, `${needle} must find TCF-42`);
    assert.equal(await row('task-bare').count(), 0, `${needle} must not match an unnumbered row`);
  }
  await search().fill('TCF-');
  await row('task-a').waitFor();
  assert.equal(await row('task-bare').count(), 0, 'A key-only query must not sweep in unnumbered rows');
  await search().fill('Alpha');
  await row('task-a').waitFor();
  assert.equal(await row('task-b').count(), 0, 'Title search must still work');
  await search().fill(''); await row('task-b').waitFor();
  console.log('PASS identifier search: exact, lower case, mixed case, key prefix; titles unaffected');

  // ── 4. Copy: one click puts the identifier on the real clipboard, confirms visibly
  //       and audibly, reverts, and never opens the task drawer behind it.
  await page.evaluate(() => navigator.clipboard.writeText('sentinel-before-copy'));
  const chip = await idOf('task-a');
  assert.match(await chip.getAttribute('aria-label'), /^Copy task ID TCF-42$/, 'Accessible label must name the action and the value');
  const widthBefore = (await chip.boundingBox()).width;
  await chip.click();
  await chip.getByText('Copied', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'TCF-42', 'Click must write the identifier to the clipboard');
  // The live region is the button's next sibling, deliberately — see ShortId.
  const status = row('task-a').locator('[role="status"]').first();
  assert.equal(await status.getAttribute('aria-live'), 'polite', 'Confirmation must be announced, not only shown');
  assert.equal(await status.textContent(), 'Copied');
  assert.ok(await status.evaluate(el => {
    const r = el.getBoundingClientRect();
    return el.previousElementSibling?.hasAttribute('data-short-id') && r.width <= 1 && r.height <= 1;
  }), 'Live region must sit outside the button and take no visible space');
  const widthDuring = (await chip.boundingBox()).width;
  assert.equal(widthDuring, widthBefore, `Confirmation shifted the row: ${widthBefore} → ${widthDuring}`);
  assert.equal(await page.getByRole('dialog').count(), 0, 'Copying must not open the task drawer');
  await chip.getByText('TCF-42', { exact: true }).waitFor();
  assert.equal(await chip.innerText(), 'TCF-42', 'Confirmation must revert to the identifier');
  // Keyboard reaches the same control: it is a real button, not a click handler on text.
  // The application's global focus ring excludes this package's subtree, so a visible
  // keyboard indicator has to come from the package itself — assert it actually paints.
  await page.keyboard.press('Shift+Tab'); // arrive by keyboard so :focus-visible matches
  await chip.focus();
  assert.ok(await chip.evaluate(el => el === document.activeElement), 'Identifier must be keyboard focusable');
  const ring = await chip.evaluate(el => {
    el.focus();
    const matched = el.matches(':focus-visible');
    const s = getComputedStyle(el);
    return { matched, outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle, outlineColor: s.outlineColor, offset: s.outlineOffset };
  });
  assert.ok(ring.matched, 'Programmatic focus on a button should satisfy :focus-visible in Chromium');
  assert.notEqual(ring.outlineStyle, 'none', 'Keyboard focus must paint a visible ring: ' + JSON.stringify(ring));
  assert.ok(parseFloat(ring.outlineWidth) >= 2, 'Focus ring must be at least 2px: ' + JSON.stringify(ring));
  console.log('PASS keyboard focus paints a visible ring from the package', ring);
  // WCAG 2.2 SC 2.5.8 wants 24×24. The identifier earns that from the line box the
  // alignment fix gave it — one inherited line plus the row's block padding — so the
  // `::after` overlay an earlier revision used is gone, and with it the only part of
  // this control that could have overlapped a neighbour. Measured on the real box and
  // confirmed by a hit test at its corners, not inferred from the CSS.
  const hit = await chip.evaluate(el => {
    const b = el.getBoundingClientRect();
    const at = (x, y) => { const t = document.elementFromPoint(x, y); return t === el || el.contains(t); };
    return { box: { w: Math.round(b.width), h: Math.round(b.height) },
      topEdge: at(b.x + b.width / 2, b.top + 1), bottomEdge: at(b.x + b.width / 2, b.bottom - 1) };
  });
  assert.ok(hit.box.w >= 24 && hit.box.h >= 24, 'Copy target must clear WCAG 2.2 SC 2.5.8 (24×24): ' + JSON.stringify(hit));
  assert.ok(hit.topEdge && hit.bottomEdge, 'The whole box must be the target, not just the glyphs: ' + JSON.stringify(hit));
  console.log('PASS copy target clears 24×24 from its own line box, no overlay needed', hit);
  await page.keyboard.press('Enter');
  await chip.getByText('Copied', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'TCF-42');
  assert.equal(await page.getByRole('dialog').count(), 0, 'Enter on the identifier must not open the drawer');
  await chip.getByText('TCF-42', { exact: true }).waitFor();
  console.log('PASS copy by pointer and keyboard, real clipboard, announced confirmation, no layout shift, no drawer');

  // ── 5. Drawer header carries the identifier on the signpost line, and copies there too.
  await row('task-a').getByRole('button', { name: 'Task Alpha', exact: true }).click();
  const detail = page.getByRole('dialog'); await settle(detail);
  const headerId = detail.locator('[data-short-id="TCF-42"]');
  await headerId.waitFor();
  assert.ok(await headerId.evaluate(el => {
    const label = [...el.parentElement.children].find(n => n !== el);
    return label && label.textContent.trim() === 'Task';
  }), 'Drawer identifier belongs beside the "Task" signpost, not inside the editable title row');
  // The grown hit area must never win a click that belongs to a neighbour. The drawer is
  // the tight case: the editable title sits directly under the signpost line, inside the
  // identifier's x-span, and "copy fired when I meant to edit the title" would be the
  // worst failure this control could have.
  const theft = await detail.evaluate(dlg => {
    const id = dlg.querySelector('[data-short-id]'), ib = id.getBoundingClientRect();
    const top = ib.top - 14, bottom = ib.bottom + 14, out = [];
    dlg.querySelectorAll('h1,h2,button,input,textarea,[role="button"],a').forEach(n => {
      if (n === id || id.contains(n)) return;
      const r = n.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.left >= ib.right || r.right <= ib.left || r.top >= bottom || r.bottom <= top) return;
      const w = document.elementFromPoint(Math.max(r.left, ib.left) + 1, Math.max(r.top, top) + 1);
      if (w === id || id.contains(w)) out.push(n.tagName + '.' + String(n.className || '').slice(0, 30));
    });
    return out;
  });
  assert.deepEqual(theft, [], 'Identifier hit area must not steal a click from a neighbour: ' + JSON.stringify(theft));
  console.log('PASS grown hit area steals no click from any drawer neighbour');
  await page.evaluate(() => navigator.clipboard.writeText('sentinel-before-drawer-copy'));
  await headerId.click();
  await headerId.getByText('Copied', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'TCF-42', 'Drawer copy must write the identifier');
  await detail.screenshot({ path: evidence + '/short-ids-drawer.png' });
  await page.keyboard.press('Escape'); await detail.waitFor({ state: 'detached' });
  // The drawer for an unnumbered task shows no identifier and no empty signpost gap.
  await row('task-bare').getByRole('button', { name: 'Unnumbered task', exact: true }).click();
  const bareDetail = page.getByRole('dialog'); await settle(bareDetail);
  assert.equal(await bareDetail.locator('[data-short-id]').count(), 0, 'Unnumbered task drawer must render no identifier');
  await page.keyboard.press('Escape'); await bareDetail.waitFor({ state: 'detached' });
  console.log('PASS drawer header identifier on the signpost line, copies, and is absent when unnumbered');

  // ── 6. The identifier is read-only. It must never ride along into a write — a
  //       duplicate is a new row and earns a new identifier from the database.
  await row('task-a').click({ button: 'right' }); await settle(page.getByRole('menu'));
  await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).click();
  await page.getByText('Duplicated', { exact: true }).waitFor();
  assert.ok(writes.length > 0, 'Duplicate must have issued a write');
  for (const body of writes) assert.ok(!('short_id' in body), 'short_id must never reach a write body: ' + JSON.stringify(body));
  console.log('PASS identifier never enters a write body', { writes: writes.length });

  await page.screenshot({ path: evidence + '/short-ids-rows.png' });
  assert.deepEqual(errors, [], 'Zero page errors');
  console.log('PASS short identifiers: render, absence, search, copy, drawer, read-only; zero page errors');
} catch (error) {
  await page.screenshot({ path: evidence + '/short-ids-failure.png' });
  console.log(JSON.stringify({ writes, errors, body: await page.locator('body').innerText() }, null, 2));
  throw error;
} finally { await browser.close(); }
