import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Caelos Foundry dev server.
 *
 * Everything the Foundry shows is read from the design system, never typed into it:
 *   - React 19 (chat) recipes: imported directly from staging/ui-react19's generated
 *     styled-system, in the browser.
 *   - React 18 (task graph) recipes: read here, in Node, from packages/ui's generated
 *     styled-system, and handed to the page as a virtual module. The two tracks are
 *     different React majors and cannot share one React root, but their recipe
 *     metadata is inert data and can be compared in one document.
 *
 * Four plugins, all local-development only:
 *   foundry-taskgraph-meta — the React 18 recipe list, regenerated on change
 *   foundry-drafts         — saves and lists drafts as JSON files in <repo>/foundry-drafts/
 *   foundry-name-proposals — stages rename proposals to <repo>/foundry-proposals/names.json
 *   foundry-live-library   — rebuilds a package when its source changes, then reloads
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const UI19 = path.join(REPO, "staging/ui-react19");
const UI18 = path.join(REPO, "packages/ui");
const DRAFTS = path.join(REPO, "foundry-drafts");
const PROPOSALS = path.join(REPO, "foundry-proposals");
const NAMES_FILE = path.join(PROPOSALS, "names.json");
const TASKGRAPH_ID = "virtual:foundry-taskgraph";
const LOCAL_ORIGIN = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;
const MAX_DRAFT_BYTES = 1_000_000;

function taskgraphMeta(): Plugin {
  const resolved = "\0" + TASKGRAPH_ID;
  return {
    name: "foundry-taskgraph-meta",
    resolveId: (id) => (id === TASKGRAPH_ID ? resolved : null),
    async load(id) {
      if (id !== resolved) return null;
      const file = path.join(UI18, "styled-system/recipes/index.mjs");
      if (!existsSync(file)) {
        return `export default ${JSON.stringify({
          available: false,
          reason: "packages/ui has no generated styled-system yet. The launcher runs `panda codegen` there on first start.",
          recipes: [],
        })};`;
      }
      // Cache-bust so a regenerated styled-system is re-read rather than served from Node's module cache.
      const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
      const recipes = Object.values(mod)
        .filter((v: any) => typeof v === "function" && v.variantMap && v.__name__)
        .map((v: any) => ({ name: v.__name__ as string, variantMap: v.variantMap as Record<string, string[]> }));
      return `export default ${JSON.stringify({ available: true, recipes })};`;
    },
  };
}

function drafts(): Plugin {
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "untitled";
  return {
    name: "foundry-drafts",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/__foundry/drafts")) return next();
        const origin = req.headers.origin;
        if (origin && !LOCAL_ORIGIN.test(origin)) {
          res.statusCode = 403;
          return res.end("Foundry drafts accept requests from this machine only.");
        }
        try {
          await fs.mkdir(DRAFTS, { recursive: true });
          if (req.method === "GET") {
            const files = (await fs.readdir(DRAFTS)).filter((f) => f.endsWith(".json")).sort();
            const list: unknown[] = [];
            for (const f of files) {
              try {
                list.push(JSON.parse(await fs.readFile(path.join(DRAFTS, f), "utf8")));
              } catch {
                /* a hand-edited or partial file is skipped, never fatal */
              }
            }
            res.setHeader("content-type", "application/json");
            return res.end(JSON.stringify(list));
          }
          if (req.method === "POST") {
            let body = "";
            for await (const chunk of req) {
              body += chunk;
              if (body.length > MAX_DRAFT_BYTES) {
                res.statusCode = 413;
                return res.end("Draft too large.");
              }
            }
            const draft = JSON.parse(body);
            draft.slug = slugify(String(draft.name ?? ""));
            draft.savedAt = new Date().toISOString();
            // Write to a temp file, then rename, so a crash never leaves a half-written draft.
            const target = path.join(DRAFTS, `${draft.slug}.json`);
            const tmp = `${target}.tmp`;
            await fs.writeFile(tmp, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
            await fs.rename(tmp, target);
            res.setHeader("content-type", "application/json");
            return res.end(JSON.stringify(draft));
          }
          res.statusCode = 405;
          res.end();
        } catch (error) {
          res.statusCode = 500;
          res.end(error instanceof Error ? error.message : "Draft request failed.");
        }
      });
    },
  };
}


/**
 * Rename proposals — staged, never applied. The Foundry writes what Daniel proposes to
 * <repo>/foundry-proposals/names.json and touches no source. An agent reads that file and
 * implements the renames deliberately, as a reviewed change.
 */
function nameProposals(): Plugin {
  const read = async (): Promise<any[]> => {
    try {
      const data = JSON.parse(await fs.readFile(NAMES_FILE, "utf8"));
      return Array.isArray(data.proposals) ? data.proposals : [];
    } catch {
      return [];
    }
  };
  const write = async (proposals: any[]) => {
    await fs.mkdir(PROPOSALS, { recursive: true });
    const body = {
      note: "Rename proposals staged from the Caelos Foundry. Nothing here has been applied to source.",
      updatedAt: new Date().toISOString(),
      proposals,
    };
    const tmp = `${NAMES_FILE}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    await fs.rename(tmp, NAMES_FILE);
  };
  return {
    name: "foundry-name-proposals",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/__foundry/names")) return next();
        const origin = req.headers.origin;
        if (origin && !LOCAL_ORIGIN.test(origin)) {
          res.statusCode = 403;
          return res.end("Foundry proposals accept requests from this machine only.");
        }
        try {
          const list = await read();
          if (req.method === "GET") {
            res.setHeader("content-type", "application/json");
            return res.end(JSON.stringify(list));
          }
          let body = "";
          for await (const chunk of req) {
            body += chunk;
            if (body.length > MAX_DRAFT_BYTES) {
              res.statusCode = 413;
              return res.end("Proposal too large.");
            }
          }
          const input = body ? JSON.parse(body) : {};
          if (req.method === "POST") {
            const entry = { ...input, proposedAt: new Date().toISOString() };
            const next = list.filter((p) => p.key !== entry.key);
            if (String(entry.proposed ?? "").trim() && entry.proposed !== entry.current) next.push(entry);
            await write(next);
            res.setHeader("content-type", "application/json");
            return res.end(JSON.stringify(next));
          }
          if (req.method === "DELETE") {
            const next = list.filter((p) => p.key !== input.key);
            await write(next);
            res.setHeader("content-type", "application/json");
            return res.end(JSON.stringify(next));
          }
          res.statusCode = 405;
          res.end();
        } catch (error) {
          res.statusCode = 500;
          res.end(error instanceof Error ? error.message : "Proposal request failed.");
        }
      });
    },
  };
}

/** Rebuild a package when its source changes; reload the page only once the build is complete. */
function liveLibrary(): Plugin {
  type Job = { label: string; cwd: string; cmd: string; args: string[]; after?: (s: ViteDevServer) => void };
  const running = new Set<string>();
  const queued = new Set<string>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const run = (server: ViteDevServer, job: Job) => {
    if (running.has(job.label)) {
      queued.add(job.label);
      return;
    }
    running.add(job.label);
    server.config.logger.info(`[foundry] ${job.label}: rebuilding…`, { timestamp: true });
    const child = spawn(job.cmd, job.args, { cwd: job.cwd, stdio: "ignore" });
    child.on("close", (code) => {
      running.delete(job.label);
      if (code === 0) {
        job.after?.(server);
        server.moduleGraph.invalidateAll();
        server.ws.send({ type: "full-reload" });
        server.config.logger.info(`[foundry] ${job.label}: rebuilt, page reloaded`, { timestamp: true });
      } else {
        server.config.logger.error(
          `[foundry] ${job.label}: build failed (exit ${code}). Run it by hand in ${job.cwd} to see why.`,
          { timestamp: true },
        );
      }
      if (queued.delete(job.label)) run(server, job);
    });
  };

  const schedule = (server: ViteDevServer, job: Job) => {
    clearTimeout(timers.get(job.label));
    timers.set(job.label, setTimeout(() => run(server, job), 300));
  };

  return {
    name: "foundry-live-library",
    configureServer(server) {
      const chat: Job = { label: "chat library (React 19)", cwd: UI19, cmd: "npm", args: ["run", "build"] };
      const taskgraph: Job = {
        label: "task-graph recipes (React 18)",
        cwd: UI18,
        cmd: "npx",
        args: ["panda", "codegen"],
        after: (s) => {
          const mod = s.moduleGraph.getModuleById("\0" + TASKGRAPH_ID);
          if (mod) s.moduleGraph.invalidateModule(mod);
        },
      };
      const watched = [
        { dir: path.join(UI19, "src"), job: chat },
        { dir: path.join(UI18, "src"), job: taskgraph },
      ];
      for (const { dir } of watched) server.watcher.add(dir);
      const onFile = (file: string) => {
        for (const { dir, job } of watched) if (file.startsWith(dir + path.sep)) schedule(server, job);
      };
      server.watcher.on("change", onFile);
      server.watcher.on("add", onFile);
      server.watcher.on("unlink", onFile);
    },
  };
}

export default defineConfig({
  plugins: [react(), taskgraphMeta(), drafts(), nameProposals(), liveLibrary()],
  resolve: {
    alias: [
      { find: /^@caelos\/ui$/, replacement: path.join(UI19, "dist/index.js") },
      { find: /^@caelos\/recipes$/, replacement: path.join(UI19, "styled-system/recipes/index.mjs") },
      { find: /^@caelos\/styles\.css$/, replacement: path.join(UI19, "dist/styles.css") },
    ],
    // The package and the Foundry must share one React; two copies break every hook.
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: { allow: [REPO] },
    watch: {
      // Generated output changes mid-build. Reloading is driven by liveLibrary once a build
      // finishes, never by the watcher seeing a half-written file.
      ignored: [
        "**/node_modules/**",
        "**/ui-react19/dist/**",
        "**/ui-react19/styled-system/**",
        "**/packages/ui/dist/**",
        "**/packages/ui/styled-system/**",
        "**/foundry-drafts/**",
        "**/foundry-proposals/**",
      ],
    },
  },
});
