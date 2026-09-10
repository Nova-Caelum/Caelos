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
  const tip = page
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
