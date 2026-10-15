// Fails when a credential can reach the browser:
//   source: any VITE_* name that looks like a secret (VITE_ vars are inlined into the public bundle);
//   dist:   a built JS file that attaches `Bearer ${...}` or `Bearer <literal>` (the 2026-10-14 leak).
// Usage: node scripts/check-no-client-secrets.mjs [--dist] [--require-dist]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SECRET_NAME = /VITE_[A-Z0-9_]*(TOKEN|BEARER|SECRET|KEY|PASSWORD|PASSWD|CREDENTIAL|AUTH)[A-Z0-9_]*/g;
const SOURCE_DIRS = ["src", "packages/ui/src", "functions", "docs"];
const SOURCE_FILES = [".env", ".env.example", ".env.production", ".env.development", "vite.config.ts", "index.html", "README.md"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".wrangler"]);
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|json|md|html|css|env)$/;

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else yield p;
  }
}

export function scanSource(root) {
  const found = [];
  const files = [...SOURCE_FILES.map((f) => join(root, f)).filter(existsSync)];
  for (const d of SOURCE_DIRS) for (const f of walk(join(root, d))) if (SOURCE_EXT.test(f)) files.push(f);
  for (const f of files) {
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((line, i) => {
      // docs may name the rule ("never VITE_BEARER_TOKEN"); only flag code and env files
      if (f.endsWith(".md")) return;
      for (const m of line.matchAll(SECRET_NAME)) found.push(`${relative(root, f)}:${i + 1} ${m[0]}`);
    });
  }
  return found;
}

export function scanDist(distDir) {
  const found = [];
  for (const f of walk(distDir)) {
    if (!f.endsWith(".js")) continue;
    const text = readFileSync(f, "utf8");
    for (const re of [/Bearer\s*\$\{/g, /Bearer\s+[A-Za-z0-9_\-.]{20,}/g]) {
      for (const m of text.matchAll(re)) found.push(`${relative(distDir, f)}@${m.index} ${m[0].slice(0, 9)}...`);
    }
  }
  return found;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(import.meta.url), "../..");
  const problems = scanSource(root).map((p) => `client-visible secret name: ${p}`);
  const dist = join(root, "dist");
  const wantDist = process.argv.includes("--dist") || process.argv.includes("--require-dist");
  if (wantDist) {
    if (!existsSync(dist)) {
      if (process.argv.includes("--require-dist")) problems.push("dist/ missing: build first");
    } else problems.push(...scanDist(dist).map((p) => `bearer attached in built bundle: ${p}`));
  }
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("check-no-client-secrets: clean");
}
