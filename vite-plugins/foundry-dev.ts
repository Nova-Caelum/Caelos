import type { IncomingMessage, ServerResponse } from "node:http";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { Plugin, ResolvedConfig } from "vite";
import { diffFoundrySeeds, renderSeedModule } from "../src/design/codegen";
import { DEFAULT_CHARACTER } from "../src/design/characterSeed";
import {
  applyOverride,
  parseFoundryOverride,
  type FoundryOverride,
} from "../src/design/override";
import { DEFAULT_SEED } from "../src/design/seed";
import { DEFAULT_SHAPE_SEED } from "../src/design/shapeSeed";

const BODY_LIMIT = 1024 * 1024;
const execFileAsync = promisify(execFile);
const SEED_PATH = "src/design/seed.ts";
const OVERRIDE_PATH = "src/design/seed.override.json";

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > BODY_LIMIT) throw new Error("Override payload exceeds 1 MB");
    chunks.push(buffer);
  }
  const source = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(source || "{}");
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(body)}\n`);
}

async function run(root: string, command: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, GH_PROMPT_DISABLED: "1", GIT_TERMINAL_PROMPT: "0" },
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

async function getPromoteStatus(root: string): Promise<{
  currentBranch: string;
  manualSeedDiff: boolean;
  ghReady: boolean;
}> {
  const [currentBranch, headSeed, workingSeed, ghStatus] = await Promise.all([
    run(root, "git", ["branch", "--show-current"]),
    run(root, "git", ["show", `HEAD:${SEED_PATH}`]),
    fs.readFile(path.resolve(root, SEED_PATH), "utf8"),
    run(root, "gh", ["auth", "status"]).then(() => true, () => false),
  ]);
  return {
    currentBranch,
    manualSeedDiff: headSeed !== workingSeed,
    ghReady: ghStatus,
  };
}

function branchTimestamp(now = new Date()): string {
  return now.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
}

async function promote(root: string, override: FoundryOverride): Promise<{
  branch: string;
  prUrl: string;
  manualSeedDiff: boolean;
  seedSource: string;
}> {
  const status = await getPromoteStatus(root);
  if (!status.currentBranch) throw new Error("Foundry promote requires a named git branch");
  if (!status.ghReady) throw new Error("GitHub CLI authentication is unavailable");

  const seeds = applyOverride(DEFAULT_SEED, DEFAULT_SHAPE_SEED, override, DEFAULT_CHARACTER);
  const committedSeeds = applyOverride(DEFAULT_SEED, DEFAULT_SHAPE_SEED, {}, DEFAULT_CHARACTER);
  const diff = diffFoundrySeeds(committedSeeds, seeds);
  const seedSource = renderSeedModule(seeds);
  const emptyOverride = "{}\n";
  const stamp = branchTimestamp();
  const branch = `foundry/seed-${stamp}`;
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "caelos-foundry-"));
  let worktreeAdded = false;

  try {
    await run(root, "git", ["worktree", "add", "-b", branch, tempRoot, "HEAD"]);
    worktreeAdded = true;
    await fs.mkdir(path.join(tempRoot, "src/design"), { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(tempRoot, SEED_PATH), seedSource, "utf8"),
      fs.writeFile(path.join(tempRoot, OVERRIDE_PATH), emptyOverride, "utf8"),
    ]);
    await run(tempRoot, "git", ["add", "--", SEED_PATH, OVERRIDE_PATH]);
    await run(tempRoot, "git", ["commit", "-m", `feat(foundry): seed promote ${stamp.slice(0, 8)}`]);
    await run(tempRoot, "git", ["push", "-u", "origin", branch]);

    const prUrl = await run(tempRoot, "gh", [
      "pr",
      "create",
      "--base",
      "main",
      "--head",
      branch,
      "--title",
      `Foundry seed promote ${stamp}`,
      "--body",
      [
        "Promotes the current Caelos Foundry staging override into the committed seed.",
        "",
        "Authored in Foundry.",
        "",
        "## Seed diff",
        ...(diff.length > 0
          ? diff.map(({ path: seedPath, before, after }) => `- \`${seedPath}\`: \`${before}\` → \`${after}\``)
          : ["- No effective seed changes."]),
        "",
        "This branch is expected to receive a Cloudflare Pages branch preview before human review and merge.",
      ].join("\n"),
    ]);

    return { branch, prUrl, manualSeedDiff: status.manualSeedDiff, seedSource };
  } finally {
    if (worktreeAdded) {
      await run(root, "git", ["worktree", "remove", "--force", tempRoot]).catch(() => undefined);
    }
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

export function foundryDevPlugin(): Plugin {
  let config: ResolvedConfig;

  return {
    name: "caelos-foundry-dev",
    apply: "serve",
    configResolved(resolved) {
      config = resolved;
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        const isPromote = pathname === "/__foundry/promote";
        if (pathname !== "/__foundry/override" && pathname !== "/__foundry/reset-override" && !isPromote) {
          next();
          return;
        }

        if (isPromote && request.method === "GET") {
          try {
            sendJson(response, 200, await getPromoteStatus(config.root));
          } catch (error) {
            sendJson(response, 500, { error: error instanceof Error ? error.message : "Could not inspect promotion state" });
          }
          return;
        }

        if (request.method !== "POST") {
          sendJson(response, 405, { error: "Method not allowed" });
          return;
        }

        try {
          if (isPromote) {
            const override = parseFoundryOverride(await readJsonBody(request));
            const { seedSource, ...result } = await promote(config.root, override);
            sendJson(response, 200, { ok: true, ...result });
            setTimeout(() => {
              void Promise.all([
                fs.writeFile(path.resolve(config.root, SEED_PATH), seedSource, "utf8"),
                fs.writeFile(path.resolve(config.root, OVERRIDE_PATH), "{}\n", "utf8"),
              ]).catch((error) => server.config.logger.error(`Foundry live sync failed: ${String(error)}`));
            }, 400);
            return;
          }
          const override = pathname === "/__foundry/reset-override"
            ? {}
            : parseFoundryOverride(await readJsonBody(request));
          const overridePath = path.resolve(config.root, OVERRIDE_PATH);
          await fs.writeFile(overridePath, `${JSON.stringify(override, null, 2)}\n`, "utf8");
          sendJson(response, 200, { ok: true, override });
        } catch (error) {
          sendJson(response, 400, { error: error instanceof Error ? error.message : "Invalid override" });
        }
      });
    },
  };
}
