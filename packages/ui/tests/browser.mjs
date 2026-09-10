// Run against the built-package preview; PLAYWRIGHT_MODULE can point at a shared runtime.
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const failures = [];
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const test = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (e) {
    failures.push(name);
    console.error(`FAIL ${name}: ${e.message}`);
  }
};
await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5182");
await page.waitForTimeout(500);
const primary = page.locator("[data-composer-demo=primary]");
await test("Composer outside dismissal preserves motion, position and clicked focus", async () => {
  const check = await browser.newPage({viewport:{width:1280,height:1000}});
  try {
    for (const name of ["Agent: Hermes", "Model: GPT-6 Astra", "Reasoning: High", "Permissions: Ask before acting", "Add to this conversation"]) {
      for (const interrupted of [false, true]) {
        await check.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5182");
        const composer = check.locator('[data-composer-demo=primary]');
        const nested = /^(Agent|Model|Reasoning):/.test(name);
        if (nested) {
          await composer.getByRole('button',{name:/Model and reasoning:/}).click();
          await check.waitForTimeout(300);
        }
        await composer.getByRole('button',{name,exact:true}).click();
        const menu = check.locator('.nc-composer-emerging-menu[data-state=open]');
        await menu.waitFor();
        if (!interrupted) await check.waitForTimeout(300);
        const before = await menu.evaluate((e, interrupted) => {
          if (interrupted) {const a=e.getAnimations()[0];a.pause();a.currentTime=35;}
          const s=getComputedStyle(e);
          return {opacity:Number(s.opacity),transform:s.transform,position:getComputedStyle(e.parentElement).transform};
        }, interrupted);
        // Real outside pointer event; nested selectors allow the clicked editor to focus.
        const box=await composer.locator('textarea').boundingBox();
        await check.mouse.click(box.x+20,box.y+15);
        const exiting=check.locator('.nc-composer-emerging-menu[data-state=closed]');
        const first=await exiting.evaluate(e=>{
          const a=e.getAnimations()[0];a.pause();a.currentTime=0;
          const s=getComputedStyle(e);
          return {opacity:Number(s.opacity),transform:s.transform,position:getComputedStyle(e.parentElement).transform};
        });
        assert.ok(Math.abs(first.opacity-before.opacity)<.001, `${name}: exit opacity jumps`);
        assert.equal(first.transform,before.transform,`${name}: exit scale jumps`);
        if (nested) {
          assert.equal(await composer.locator('.nc-composer-brain').getAttribute('data-state'),'closed');
          assert.equal(first.position,before.position);
        }
        await check.waitForTimeout(200);
        const middle=await exiting.evaluate(e=>{
          const a=e.getAnimations()[0];a.currentTime=80;
          return {opacity:Number(getComputedStyle(e).opacity),position:getComputedStyle(e.parentElement).transform};
        });
        assert.ok(middle.opacity>0 && middle.opacity<before.opacity);
        if(nested) assert.equal(middle.position,before.position,`${name}: dock moves during retreat`);
        await exiting.evaluate(e=>e.getAnimations().forEach(a=>a.finish()));
        await exiting.waitFor({state:'detached'});
        if(nested) {
          assert.equal(await composer.locator('.nc-composer-brain').getAttribute('data-state'),'closed');
          assert.ok(await composer.locator('textarea').evaluate(e=>document.activeElement===e));
        }
      }
    }
  } finally { await check.close(); }
});
await test("All exported recipe variants are emitted", async () => {
  assert.match(
    await page
      .getByRole("button", { name: "Create project", exact: true })
      .evaluate((e) => getComputedStyle(e).backgroundImage),
    /linear-gradient/,
  );
  assert.equal(
    await page
      .getByRole("searchbox")
      .evaluate((e) => getComputedStyle(e.parentElement).borderRadius),
    "999px",
  );
  assert.equal(
    await page
      .locator(".caelos-card--variant_glass")
      .evaluate((e) => getComputedStyle(e).backdropFilter),
    "blur(19px) saturate(1.2)",
  );
});
await test("Permission click remains open; choice changes value", async () => {
  await primary
    .getByRole("button", { name: "Permissions: Ask before acting" })
    .click();
  await page.waitForTimeout(500);
  assert.equal(
    await page
      .getByRole("menuitemradio", { name: "Full access", exact: true })
      .count(),
    1,
  );
  await page
    .getByRole("menuitemradio", { name: "Full access", exact: true })
    .click();
  await primary
    .getByRole("button", { name: "Permissions: Full access" })
    .waitFor();
});
await test("Model and reasoning menus remain open after click", async () => {
  await primary.getByRole("button", { name: /Model and reasoning:/ }).click();
  await primary
    .getByRole("button", { name: "Model: GPT-6 Astra", exact: true })
    .click();
  await page.waitForTimeout(500);
  await page
    .getByRole("menuitemradio", { name: "GPT-5.6 Sol", exact: true })
    .click();
  await primary
    .getByRole("button", { name: "Reasoning: High", exact: true })
    .click();
  await page.waitForTimeout(500);
  await page.getByRole("menuitemradio", { name: "Low", exact: true }).click();
  assert.match(
    await primary
      .getByRole("button", { name: /Model and reasoning:/ })
      .getAttribute("aria-label"),
    /GPT-5.6 Sol, Low/,
  );
  await page.keyboard.press("Escape");
});
await test("Brain hover shows agent avatar; click reveals its name and pins settings", async () => {
  const brain = primary.getByRole("button", {name:/Model and reasoning:/});
  await primary.locator("textarea").click();
  await brain.hover();
  const agent = primary.getByRole("button", {name:"Agent: Hermes",exact:true});
  await agent.waitFor();
  await page.waitForTimeout(300);
  assert.equal(await primary.locator('.nc-composer-brain').getAttribute('data-state'), 'hover');
  assert.equal(await agent.locator('[role=img]').count(), 1);
  assert.equal(await agent.locator('.nc-composer-agent-name').evaluate(e=>e.clientWidth), 0);
  const agentBox=await agent.boundingBox();
  const modelBox=await primary.getByRole('button',{name:'Model: GPT-5.6 Sol',exact:true}).boundingBox();
  assert.ok(agentBox.x < modelBox.x);
  await brain.click();
  await page.waitForTimeout(300);
  assert.ok(await agent.locator('.nc-composer-agent-name').evaluate(e=>e.clientWidth) > 0);
  await page.mouse.move(10,10);
  await page.waitForTimeout(350);
  assert.equal(await primary.locator('.nc-composer-brain').getAttribute('data-state'), 'pinned');
  await brain.press('Escape');
});
await test("Agent selector switches independently saved model and reasoning settings", async () => {
  const brain=primary.getByRole('button',{name:/Model and reasoning:/});
  await brain.click();
  await primary.getByRole('button',{name:'Agent: Hermes',exact:true}).click();
  const menu=page.getByRole('menu',{name:'Agent: Hermes',exact:true});
  assert.deepEqual(await menu.getByRole('menuitemradio').allTextContents(), ['HHermes','AAthena','DLDesign Lead']);
  await menu.getByRole('menuitemradio',{name:'Athena',exact:true}).click();
  await primary.getByRole('button',{name:'Model: GPT-5.6 Sol',exact:true}).click();
  await page.getByRole('menuitemradio',{name:'GPT-5.6 Terra',exact:true}).click();
  await primary.getByRole('button',{name:'Reasoning: Medium',exact:true}).click();
  await page.getByRole('menuitemradio',{name:'High',exact:true}).click();
  await primary.getByRole('button',{name:'Agent: Athena',exact:true}).click();
  await page.getByRole('menuitemradio',{name:'Hermes',exact:true}).click();
  await primary.getByRole('button',{name:'Model: GPT-5.6 Sol',exact:true}).waitFor();
  await primary.getByRole('button',{name:'Reasoning: Low',exact:true}).waitFor();
  await primary.getByRole('button',{name:'Agent: Hermes',exact:true}).click();
  await page.getByRole('menuitemradio',{name:'Athena',exact:true}).click();
  await primary.getByRole('button',{name:'Model: GPT-5.6 Terra',exact:true}).waitFor();
  await primary.getByRole('button',{name:'Reasoning: High',exact:true}).waitFor();
  assert.match(await page.locator('[data-composer-demo=secondary]').getByRole('button',{name:/Model and reasoning:/}).getAttribute('aria-label'),/GPT-6 Astra, High/);
  await primary.getByRole('button',{name:'Agent: Athena',exact:true}).click();
  await page.getByRole('menuitemradio',{name:'Hermes',exact:true}).click();
  await brain.press('Escape');
});
await test("Agent settings support keyboard selection and Escape returns focus", async () => {
  const brain=primary.getByRole('button',{name:/Model and reasoning:/});
  await brain.focus();
  await brain.press('ArrowDown');
  const agent=primary.getByRole('button',{name:'Agent: Hermes',exact:true});
  await page.waitForTimeout(100);
  assert.equal(await agent.evaluate(e=>e===document.activeElement),true);
  await agent.press('ArrowDown');
  await page.getByRole('menuitemradio',{name:'Hermes',exact:true}).waitFor();
  await page.waitForTimeout(100);
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('Design Lead'));
  await page.keyboard.press('Enter');
  await primary.getByRole('button',{name:'Agent: Design Lead',exact:true}).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await brain.evaluate(e=>e===document.activeElement),true);
  await brain.click();
  await primary.getByRole('button',{name:'Agent: Design Lead',exact:true}).click();
  await page.getByRole('menuitemradio',{name:'Hermes',exact:true}).click();
  await brain.press('Escape');
});
await test("Agent, model and reasoning submenus meet the card edge without covering their fields", async () => {
  const specimen = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await specimen.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5182");
  const composer = specimen.locator('[data-composer-demo=primary]');
  const brain = composer.getByRole('button', { name: /Model and reasoning:/ });
  await brain.click();
  for (const width of [1280, 360, 280]) {
    await specimen.setViewportSize({width, height: 1000});
    for (const name of ['Agent: Hermes', 'Model: GPT-6 Astra', 'Reasoning: High']) {
      const trigger = composer.getByRole('button', {name, exact:true, includeHidden:true});
      await trigger.click();
      const menu = specimen.getByRole('menu', {name, exact:true});
      await menu.waitFor();
      await specimen.waitForTimeout(400);
      const card = await composer.locator('.nc-composer-model-settings').boundingBox();
      const popup = await menu.boundingBox();
      const field = await trigger.boundingBox();
      assert.equal(await menu.getAttribute('data-side'), 'top');
      assert.ok(Math.abs(popup.y + popup.height - card.y) < 2, 'Bottom edge must meet parent card top');
      assert.ok(popup.y + popup.height <= field.y + 1, 'Clicked field must stay uncovered');
      assert.ok(popup.x >= 10 && popup.x + popup.width <= width - 10, 'Menu must fit viewport width');
      await specimen.keyboard.press('Escape');
      await menu.waitFor({state:'hidden'});
    }
  }
  await specimen.setViewportSize({width:360,height:800});
  await composer.getByRole('button', {name:'Agent: Hermes',exact:true}).click();
  const menu = specimen.getByRole('menu', {name:'Agent: Hermes',exact:true});
  await menu.waitFor();
  await specimen.waitForTimeout(400);
  await composer.locator('.nc-composer-model-settings').evaluate(e => window.scrollBy(0,e.getBoundingClientRect().top - 30));
  await specimen.waitForTimeout(400);
  const card = await composer.locator('.nc-composer-model-settings').boundingBox();
  const popup = await menu.boundingBox();
  assert.equal(await menu.getAttribute('data-side'), 'bottom');
  assert.ok(Math.abs(popup.y - (card.y + card.height)) < 2, 'Fallback must meet parent card bottom');
  await specimen.close();
});
await test("Reply selector supports keyboard and keeps other instance independent", async () => {
  const trigger = primary.getByRole("button", {
    name: "Reply format: Text",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(100);
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await primary
    .getByRole("button", { name: "Reply format: Text + voice", exact: true })
    .waitFor();
  assert.equal(
    await page
      .locator("[data-composer-demo=secondary]")
      .getByRole("button", { name: "Reply format: Text", exact: true })
      .count(),
    1,
  );
});
await test("Composer expands to eight lines and caps height", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  await text.fill(
    Array.from({ length: 12 }, (_, i) => `Line ${i + 1}`).join("\n"),
  );
  assert.equal(await text.evaluate((e) => e.clientHeight), 192);
  assert.equal(await text.evaluate((e) => e.style.overflowY), "auto");
  await text.fill("One line");
  assert.equal(await text.evaluate((e) => e.clientHeight), 24);
});
await test("Enter sends structured values; Shift+Enter preserves draft", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  await text.fill("A draft");
  await text.press("End");
  await text.press("Shift+Enter");
  assert.match(await text.inputValue(), /\n/);
  await text.press("Enter");
  assert.equal(await text.inputValue(), "");
  assert.match(
    await primary.locator("output").innerText(),
    /Sent: A draft.*both/s,
  );
});
await test("IME Enter does not submit", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  await text.fill("Composition");
  await text.evaluate((e) =>
    e.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        isComposing: true,
        bubbles: true,
      }),
    ),
  );
  assert.equal(await text.inputValue(), "Composition");
  await text.fill("");
});
await test("Slash picker shows names only and summaries beside hovered rows", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  await text.fill("/");
  const list = page.getByRole("listbox", { name: "Commands and skills" });
  assert.deepEqual(await list.getByRole("option").allTextContents(), [
    "/review", "/summarize", "/plan", "/design-audit", "/research", "/write-tests", "/explain", "/document", "/handoff",
  ]);
  assert.equal(await text.evaluate(e => e === document.activeElement), true);
  await list.getByRole("option", { name: "/research", exact: true }).hover();
  const tip = page.locator('.caelos-tooltip').filter({ hasText: "Investigate a topic" });
  await tip.waitFor();
  await page.waitForTimeout(220);
  const box = await page.locator('.nc-composer-command-menu').boundingBox();
  const summary = await tip.boundingBox();
  assert.ok(summary.x >= box.x + box.width, JSON.stringify({box, summary}));
  assert.equal(await text.getAttribute("aria-activedescendant"), await list.getByRole("option", { name: "/research", exact: true }).getAttribute("id"));
  await text.press("Escape");
  assert.equal(await list.count(), 0);
  assert.equal(await text.inputValue(), "/");
});
await test("Slash filtering and Enter insert a skill without submitting", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  const before = await primary.locator("output").innerText();
  await text.fill("Please /DES");
  assert.equal(await page.getByRole("option").count(), 1);
  await text.press("Enter");
  assert.equal(await text.inputValue(), "Please /design-audit ");
  assert.equal(await text.evaluate(e => e.selectionStart), 21);
  assert.equal(await primary.locator("output").innerText(), before);
  assert.equal(await page.getByRole("listbox", {name:"Commands and skills"}).count(), 0);
  await text.press("Enter");
  assert.equal(await text.inputValue(), "");
  assert.match(await primary.locator("output").innerText(), /Sent: Please \/design-audit/);
});
await test("Slash keyboard navigation wraps, reveals summaries, and scrolls long lists", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  await text.fill("/");
  await text.press("ArrowUp");
  assert.equal(await page.getByRole("option", {name:"/handoff",exact:true}).getAttribute("aria-selected"), "true");
  assert.ok(await page.locator('.nc-composer-command-menu').evaluate(e => e.scrollTop) > 0);
  await page.locator('.caelos-tooltip').filter({hasText:"Prepare a concise handoff"}).waitFor();
  await text.press("ArrowDown");
  assert.equal(await page.getByRole("option", {name:"/review",exact:true}).getAttribute("aria-selected"), "true");
  await text.press("Enter");
  assert.equal(await text.inputValue(), "/review ");
});
await test("Slash selection preserves surrounding draft and positions an unchanged-token caret", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  await text.fill("Please /rev next");
  for (let i=0;i<5;i++) await text.press("ArrowLeft");
  await page.getByRole("option", {name:"/review",exact:true}).click();
  assert.equal(await text.inputValue(), "Please /review next");
  assert.equal(await text.evaluate(e=>e.selectionStart), 15);
  await text.fill("/review ");
  await text.press("ArrowLeft");
  await text.press("Enter");
  assert.equal(await text.inputValue(), "/review ");
  assert.equal(await text.evaluate(e=>e.selectionStart), 8);
});
await test("Slash empty results, paths, selection ranges, and IME preserve writing", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  const list = page.getByRole("listbox", {name:"Commands and skills"});
  await text.fill("/no-such-command");
  await page.getByRole("status").filter({hasText:"No matching commands"}).waitFor();
  await text.press("Enter");
  assert.equal(await text.inputValue(), "/no-such-command");
  await text.press("Shift+Enter");
  assert.equal(await text.inputValue(), "/no-such-command\n");
  for (const value of ["https://example.com/path", "src/components", "/Users/me/file", "word/review"]) {
    await text.fill(value);
    assert.equal(await list.count(), 0, value);
  }
  await text.fill("/rev");
  await text.press("Shift+ArrowLeft");
  assert.equal(await list.count(), 0);
  await text.fill("/");
  await text.evaluate(e => e.dispatchEvent(new CompositionEvent("compositionstart", {bubbles:true})));
  assert.equal(await list.count(), 0);
  await text.evaluate(e => e.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter",isComposing:true,bubbles:true})));
  assert.equal(await text.inputValue(), "/");
  await text.evaluate(e => e.dispatchEvent(new CompositionEvent("compositionend", {bubbles:true})));
  await list.waitFor();
  await text.press("Escape");
});
await test("Slash dismissal allows Tab and other composer menus", async () => {
  const text = primary.getByRole("textbox", { name: "Message" });
  const list = page.getByRole("listbox", {name:"Commands and skills"});
  await text.fill("/p");
  await text.press("Tab");
  assert.equal(await list.count(), 0);
  assert.equal(await text.evaluate(e => e === document.activeElement), false);
  await text.fill("/re");
  await primary.getByRole("button", {name:"Add to this conversation"}).click();
  assert.equal(await list.count(), 0);
  await page.getByRole("menuitem", {name:"Session instruction",exact:true}).waitFor();
  await page.keyboard.press("Escape");
  await text.fill("");
});
await test("Slash menu and summary fit narrow viewports and inherit light theme", async () => {
  await page.setViewportSize({width:360,height:740});
  await page.getByRole("button", {name:"Switch to light"}).click();
  const text = primary.getByRole("textbox", { name: "Message" });
  await text.fill("/rev");
  await text.press("ArrowDown");
  const menu = page.locator('.nc-composer-command-menu');
  const tip = page.locator('.caelos-tooltip').filter({hasText:"Review the current changes"});
  await tip.waitFor();
  await page.waitForTimeout(220);
  assert.equal(await menu.getAttribute("data-caelos-theme"), "light");
  assert.equal(await tip.getAttribute("data-caelos-theme"), "light");
  for (const el of [menu,tip]) {
    const box = await el.boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 361 && box.y + box.height <= 741, JSON.stringify(box));
  }
  await text.press("Escape");
  await page.getByRole("button", {name:"Switch to dark"}).click();
  await page.setViewportSize({width:1280,height:1000});
});
await test("Touch selects commands and agents and retains composer focus", async () => {
  const touchPage = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  try {
    await touchPage.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5182");
    const text=touchPage.locator('[data-composer-demo=primary] textarea');
    await text.fill("/res");
    await touchPage.getByRole("option", {name:"/research",exact:true}).tap();
    assert.equal(await text.inputValue(), "/research ");
    assert.equal(await text.evaluate(e=>e===document.activeElement), true);
    await text.fill("@ath");
    await touchPage.getByRole("option", {name:"@Athena",exact:true}).tap();
    assert.equal(await text.inputValue(), "@Athena ");
    assert.equal(await text.evaluate(e=>e===document.activeElement), true);
  } finally { await touchPage.close(); }
});
await test("Agent picker shows participant names only and summaries to the right", async () => {
  const text = primary.getByRole("textbox", {name:"Message"});
  await text.fill("@");
  const list = page.getByRole("listbox", {name:"Agents in this chat"});
  assert.deepEqual(await list.getByRole("option").allTextContents(), ["@Hermes", "@Athena", "@Design Lead"]);
  assert.equal(await page.getByRole("listbox", {name:"Commands and skills"}).count(), 0);
  await list.getByRole("option", {name:"@Athena",exact:true}).hover();
  const tip = page.locator('.caelos-tooltip').filter({hasText:"Helps with research, analysis"});
  await tip.waitFor();
  await page.waitForTimeout(220);
  const box = await page.locator('.nc-composer-command-menu').boundingBox();
  const summary = await tip.boundingBox();
  assert.ok(summary.x >= box.x + box.width, JSON.stringify({box,summary}));
  assert.equal(await text.evaluate(e=>e===document.activeElement), true);
  await text.press("Escape");
  assert.equal(await list.count(), 0);
  assert.equal(await text.inputValue(), "@");
});
await test("Agent filtering and keyboard selection insert tags without sending", async () => {
  const text = primary.getByRole("textbox", {name:"Message"});
  const before = await primary.locator("output").innerText();
  await text.fill("Please @ATH");
  assert.equal(await page.getByRole("option").count(), 1);
  await text.press("Enter");
  assert.equal(await text.inputValue(), "Please @Athena ");
  assert.equal(await primary.locator("output").innerText(), before);
  await text.press("@");
  await text.press("ArrowUp");
  assert.equal(await page.getByRole("option", {name:"@Design Lead",exact:true}).getAttribute("aria-selected"), "true");
  await text.press("Enter");
  assert.equal(await text.inputValue(), "Please @Athena @design-lead ");
  await text.press("/");
  await page.getByRole("option", {name:"/review",exact:true}).click();
  assert.equal(await text.inputValue(), "Please @Athena @design-lead /review ");
  assert.equal(await primary.locator("output").innerText(), before);
  await text.press("Enter");
  assert.equal(await text.inputValue(), "");
  assert.match(await primary.locator("output").innerText(), /Sent: Please @Athena @design-lead \/review/);
});
await test("Agent selection preserves surrounding text and supports explicit handles", async () => {
  const text = primary.getByRole("textbox", {name:"Message"});
  await text.fill("Ask @des next");
  for (let i=0;i<5;i++) await text.press("ArrowLeft");
  await page.getByRole("option", {name:"@Design Lead",exact:true}).click();
  assert.equal(await text.inputValue(), "Ask @design-lead next");
  assert.equal(await text.evaluate(e=>e.selectionStart), 17);
  await text.fill("@design-le");
  assert.equal(await page.getByRole("option", {name:"@Design Lead",exact:true}).count(), 1);
  await text.press("Tab");
  assert.equal(await page.getByRole("listbox", {name:"Agents in this chat"}).count(), 0);
});
await test("Agent picker ignores emails, preserves unmatched drafts, and respects chat roster", async () => {
  const text = primary.getByRole("textbox", {name:"Message"});
  const list = page.getByRole("listbox", {name:"Agents in this chat"});
  await text.fill("Email hello@example.com");
  assert.equal(await list.count(), 0);
  await text.fill("@unknown");
  await page.getByRole("status").filter({hasText:"No matching agents"}).waitFor();
  await text.press("Enter");
  assert.equal(await text.inputValue(), "@unknown");
  const other = page.locator('[data-composer-demo=secondary] textarea');
  await other.fill("@");
  await page.getByRole("status").filter({hasText:"No agents in this chat"}).waitFor();
  assert.equal(await page.getByRole("option").count(), 0);
  await other.press("Escape");
  await other.fill("");
  await text.fill("");
});
await test("Add menu invokes callback; Escape restores focus", async () => {
  const add = primary.getByRole("button", { name: "Add to this conversation" });
  await add.click();
  await page
    .getByRole("menuitem", { name: "Session instruction", exact: true })
    .click();
  assert.equal(
    await primary.locator("output").innerText(),
    "Add: Session instruction",
  );
  await add.click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  assert.equal(await add.evaluate((e) => e === document.activeElement), true);
});
await test("Tooltip matches typography and frosted material; border is uniform", async () => {
  const specimen = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await specimen.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5182");
  const trigger = specimen.getByRole("button", { name: "Tooltip specimen", exact: true });
  await trigger.scrollIntoViewIfNeeded();
  await specimen.mouse.move(0, 0);
  await specimen.waitForTimeout(100);
  await trigger.hover();
  const tip = specimen
    .locator(".caelos-tooltip")
    .filter({ hasText: "Copy project reference" })
    .last();
  const s = await tip.evaluate((e) => {
    const c = getComputedStyle(e);
    return {
      font: c.fontFamily,
      weight: c.fontWeight,
      spacing: c.letterSpacing,
      blur: c.backdropFilter,
      top: c.borderTopWidth,
      bottom: c.borderBottomWidth,
      shadow: c.boxShadow,
      background: c.backgroundColor,
    };
  });
  assert.match(s.font, /IBM Plex Sans/);
  assert.equal(s.weight, "500");
  assert.equal(s.spacing, "0.247px");
  assert.equal(s.blur, "blur(10px)");
  assert.equal(s.top, s.bottom);
  assert.doesNotMatch(s.shadow, /inset/);
  assert.match(s.background, /0.8\)/);
  await specimen.close();
});
await test("Scrollbar stays quiet on hover and scrolls with keyboard", async () => {
  const viewport = page.getByRole("region", { name: "Scroll specimen" });
  const thumb = page.locator(".caelos-scroll__thumb");
  const before = await thumb.evaluate(
    (e) => getComputedStyle(e, "::before").backgroundColor,
  );
  await thumb.hover();
  assert.equal(
    await thumb.evaluate(
      (e) => getComputedStyle(e, "::before").backgroundColor,
    ),
    before,
  );
  assert.match(before, /0.15\)/);
  await viewport.focus();
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(400);
  assert.ok((await viewport.evaluate((e) => e.scrollTop)) > 0);
});
await test("Light preset follows portaled menus", async () => {
  await page.getByRole("button", { name: "Switch to light" }).click();
  assert.equal(
    await page
      .locator(".caelos-card--variant_glass")
      .evaluate((e) => getComputedStyle(e).backdropFilter),
    "blur(2px) saturate(1.2)",
  );
  await primary
    .getByRole("button", { name: "Permissions: Full access" })
    .click();
  assert.equal(
    await page.getByRole("menu").getAttribute("data-caelos-theme"),
    "light",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Switch to dark" }).click();
});
await test("Reduced motion disables menu animation", async () => {
  await page
    .getByRole("button", { name: "Reduce motion", exact: true })
    .click();
  await primary
    .getByRole("button", { name: "Add to this conversation" })
    .click();
  assert.equal(
    await page
      .getByRole("menu")
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  await page.keyboard.press("Escape");
});
await test("Narrow viewport keeps controls within composer", async () => {
  await page.setViewportSize({ width: 360, height: 740 });
  await primary.scrollIntoViewIfNeeded();
  const overflow = await primary.evaluate((el) => {
    const shell = el
      .querySelector(".nc-composer-shell")
      .getBoundingClientRect();
    return [...el.querySelectorAll(".nc-composer-controls>div")].some((e) => {
      const r = e.getBoundingClientRect();
      return r.left < shell.left || r.right > shell.right;
    });
  });
  assert.equal(overflow, false);
  await primary
    .getByRole("button", { name: "Reply format: Text + voice", exact: true })
    .click();
  await page.waitForTimeout(350);
  const box = await primary
    .getByRole("menu", { name: "Reply format", exact: true })
    .boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 360, JSON.stringify(box));
});
await test("Bottom-edge composer flips compact pickers above without clipping", async () => {
  await page.keyboard.press("Escape");
  await primary.evaluate((el) => {
    el.style.cssText =
      "position:fixed;bottom:0;left:12px;right:12px;z-index:1;padding-bottom:0";
    el.querySelector("output").style.display = "none";
  });
  await primary
    .getByRole("button", { name: "Reply format: Text + voice", exact: true })
    .click();
  await page.waitForTimeout(350);
  const dock = primary.locator(".nc-composer-format-bridge");
  assert.equal(await dock.getAttribute("data-dock"), "top");
  const box = await primary
    .getByRole("menu", { name: "Reply format", exact: true })
    .boundingBox();
  const shell = await primary.locator(".nc-composer-shell").boundingBox();
  assert.ok(
    box.y >= 0 && Math.abs(box.y + box.height - shell.y) < 2,
    JSON.stringify({ box, shell }),
  );
  await primary
    .getByRole("menuitemradio", { name: "Voice", exact: true })
    .click();
  await primary
    .getByRole("button", { name: "Reply format: Voice", exact: true })
    .waitFor();
  await primary.getByRole("button", { name: /Model and reasoning:/ }).click();
  await page.waitForTimeout(350);
  assert.equal(
    await primary
      .locator(".nc-composer-brain-bridge")
      .getAttribute("data-dock"),
    "top",
  );
  await primary
    .getByRole("button", { name: "Model: GPT-5.6 Sol", exact: true })
    .click();
  await page
    .getByRole("menuitemradio", { name: "GPT-6 Astra", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await primary.evaluate((el) => {
    el.removeAttribute("style");
    el.querySelector("output").removeAttribute("style");
  });
});
await page.setViewportSize({ width: 1280, height: 1000 });
await page.keyboard.press("Escape");
await page.screenshot({
  path: "/private/tmp/caelos-panda-verified.png",
  fullPage: true,
});
await test("No runtime errors", async () => assert.deepEqual(errors, []));
await browser.close();
if (failures.length) {
  console.error(failures);
  process.exitCode = 1;
}
