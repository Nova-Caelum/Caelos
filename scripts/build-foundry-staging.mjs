import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const run = (args) => execFileSync("npm", args, { cwd: root, stdio: "inherit" });
run(["run", "build:ui"]);
run(["--prefix", "staging/foundry-react19", "run", "build"]);
execFileSync("node", ["node_modules/vite/bin/vite.js", "build", "--mode", "foundry-staging"], { cwd: root, stdio: "inherit" });
cpSync(`${root}/staging/foundry-react19/dist`, `${root}/dist-foundry-react19/foundry-react19`, { recursive: true });
