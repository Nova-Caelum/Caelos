#!/usr/bin/env bash
# Sets the dashboard/proxy Pages secrets on the caelos-console project from Bitwarden Secrets.
# Values are piped from bws to wrangler and never printed. A secret whose BWS entry does not exist yet is
# skipped and named. Usage: scripts/set-pages-secrets.sh <CF_ACCESS_AUD tag>
# Run AFTER minting the new frontend-daniel key and updating BWS FRONTEND_DANIEL_BEARER: run earlier, it would copy
# the leaked (old) value into CONSOLE_OPS_BEARER.
set -euo pipefail
PROJECT=caelos-console
AUD="${1:?usage: set-pages-secrets.sh <Access application AUD tag>}"

case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) export PATH="$HOME/.local/bin:$PATH" ;; esac
[ -n "${BWS_ACCESS_TOKEN:-}" ] || BWS_ACCESS_TOKEN=$(/usr/bin/security find-generic-password -s bws-access-token -w 2>/dev/null) || true
export BWS_ACCESS_TOKEN
LIST=$(bws secret list)

put() { # <pages secret> <bws entry>
  if printf '%s' "$LIST" | jq -e --arg k "$2" 'any(.[]; .key == $k)' >/dev/null; then
    printf '%s' "$LIST" | jq -j --arg k "$2" '.[] | select(.key == $k) | .value' | npx wrangler pages secret put "$1" --project-name "$PROJECT" >/dev/null
    echo "set   $1  <- $2"
  else
    echo "SKIP  $1  (no BWS entry named $2 yet)"
  fi
}

printf '%s' "$AUD" | npx wrangler pages secret put CF_ACCESS_AUD --project-name "$PROJECT" >/dev/null
echo "set   CF_ACCESS_AUD"
put CONSOLE_OPS_BEARER FRONTEND_DANIEL_BEARER
put DASHBOARD_OPS_BEARER DASHBOARD_OPS_BEARER
put DASHBOARD_VAULT_BEARER novacaelum_vault_ro_bearer
put DASHBOARD_GITHUB_TOKEN DASHBOARD_GITHUB_RO
