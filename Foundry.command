#!/bin/bash
# Caelos Foundry — double-click to open. No agent session needed.
#
# Starts the Foundry dev server and opens it in your browser. Close this Terminal window
# (or press Ctrl-C) to stop it. If the Foundry is already running, this just opens it.
#
# Every launch rebuilds both design-system tracks first, so what you see is the working
# tree as it is right now — never a stale build. While it runs, editing either package's
# source rebuilds it and reloads the page.

set -euo pipefail

# A double-clicked .command does not load your shell profile, so name Node's homes explicitly.
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

# Resolve the real script location, so a Desktop alias or symlink still finds the repo.
SELF="$(readlink -f "$0" 2>/dev/null || python3 -c 'import os,sys;print(os.path.realpath(sys.argv[1]))' "$0")"
REPO="$(cd "$(dirname "$SELF")" && pwd)"
PORT=5199
URL="http://127.0.0.1:${PORT}/"

say() { printf '\033[1m[Foundry]\033[0m %s\n' "$*"; }

if curl -sf -o /dev/null "$URL"; then
  say "Already running — opening ${URL}"
  open "$URL"
  exit 0
fi

command -v node >/dev/null || { say "Node.js not found. Install it, then double-click again."; read -r -p "Press Return to close."; exit 1; }

cd "$REPO"
[ -d node_modules ] || { say "First run: installing the console's dependencies…"; npm install --no-audit --no-fund; }
[ -d staging/ui-react19/node_modules ] || { say "First run: installing the chat library…"; npm --prefix staging/ui-react19 install --workspaces=false --no-audit --no-fund; }
[ -d staging/foundry/node_modules ] || { say "First run: installing the Foundry…"; npm --prefix staging/foundry install --workspaces=false --no-audit --no-fund; }

say "Reading the task-graph recipes (React 18)…"
(cd packages/ui && npx panda codegen >/dev/null)
say "Building the chat library (React 19)…"
(cd staging/ui-react19 && npm run build >/dev/null)

say "Starting on ${URL}"
cd staging/foundry
npm run dev &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT INT TERM

for _ in $(seq 1 60); do
  if curl -sf -o /dev/null "$URL"; then
    open "$URL"
    say "Running. Close this window to stop the Foundry."
    wait "$SERVER"
    exit 0
  fi
  if ! kill -0 "$SERVER" 2>/dev/null; then
    say "The server stopped before it was ready — see the messages above."
    read -r -p "Press Return to close."
    exit 1
  fi
  sleep 0.5
done

say "Timed out waiting for the server. See the messages above."
read -r -p "Press Return to close."
exit 1
