import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { scanDist, scanSource } from "../../scripts/check-no-client-secrets.mjs";

const repo = resolve(fileURLToPath(import.meta.url), "../../..");
const tmp = () => mkdtempSync(join(tmpdir(), "nocs-"));

describe("no credential reaches the browser", () => {
  it("THIS repo's source declares no secret-looking VITE_ variable (the real guard)", () => {
    assert.deepEqual(scanSource(repo), []);
  });

  it("flags VITE_BEARER_TOKEN in source and env files", () => {
    const root = tmp();
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "src", "a.ts"), 'const t = import.meta.env.VITE_BEARER_TOKEN;\n');
    writeFileSync(join(root, ".env.production"), "VITE_API_SECRET_KEY=abc\n");
    const found = scanSource(root);
    assert.equal(found.length, 2);
    assert.match(found.join("\n"), /VITE_BEARER_TOKEN/);
    assert.match(found.join("\n"), /VITE_API_SECRET_KEY/);
  });

  it("does not flag harmless VITE_ names", () => {
    const root = tmp();
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "src", "a.ts"), "VITE_HUMAN_OWNER VITE_OPS_PROXY\n");
    assert.deepEqual(scanSource(root), []);
  });

  it("flags a built bundle that attaches `Bearer ${...}` or a Bearer literal (the 2026-10-14 leak shape)", () => {
    const dist = tmp();
    mkdirSync(join(dist, "assets"));
    writeFileSync(join(dist, "assets", "index.js"), 'const vc="x";n.Authorization=`Bearer ${vc}`;');
    writeFileSync(join(dist, "assets", "b.js"), 'h("Authorization","Bearer abcdefghijklmnopqrstuvwxyz0123456789")');
    writeFileSync(join(dist, "assets", "clean.js"), 'const msg = "Bearer token required";');
    const found = scanDist(dist);
    assert.equal(found.length, 2);
  });

  it("a clean bundle passes", () => {
    const dist = tmp();
    writeFileSync(join(dist, "app.js"), 'fetch("/ops/api/projects")');
    assert.deepEqual(scanDist(dist), []);
  });
});
