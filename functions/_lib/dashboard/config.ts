// Dashboard data layer: environment contract and defaults.
// Secrets are Pages secrets (never in the repo). Everything else has a public default.

export interface Env {
  // Cloudflare Access (required: the function fails closed without them)
  CF_ACCESS_AUD?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  DASHBOARD_ALLOWED_EMAILS?: string; // optional comma list; empty = any identity Access let through

  // Sources (each panel degrades to "unavailable" when its secret is absent)
  DASHBOARD_OPS_BEARER?: string; // scoped, read-only ops-server key
  DASHBOARD_VAULT_BEARER?: string; // novacaelum_vault_ro_bearer
  DASHBOARD_GITHUB_TOKEN?: string; // fine-grained, read-only, org Nova-Caelum

  OPS_API_URL?: string;
  VAULT_MCP_URL?: string;
  GITHUB_ORG?: string;
  CONSOLE_URL?: string;
}

export interface Config {
  teamDomain: string;
  aud: string;
  allowedEmails: string[];
  opsUrl: string;
  vaultUrl: string;
  org: string;
  consoleUrl: string;
}

const DEFAULT_TEAM = "novacaelum.cloudflareaccess.com";

export function readConfig(env: Env): { config?: Config; missing: string[] } {
  const missing: string[] = [];
  if (!env.CF_ACCESS_AUD) missing.push("CF_ACCESS_AUD");
  if (missing.length) return { missing };
  return {
    missing,
    config: {
      teamDomain: (env.CF_ACCESS_TEAM_DOMAIN || DEFAULT_TEAM).replace(/^https?:\/\//, "").replace(/\/$/, ""),
      aud: env.CF_ACCESS_AUD as string,
      allowedEmails: (env.DASHBOARD_ALLOWED_EMAILS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      opsUrl: (env.OPS_API_URL || "https://nova-caelum-ops-production.up.railway.app").replace(/\/$/, ""),
      vaultUrl: (env.VAULT_MCP_URL || "https://novacaelum-vault-production.up.railway.app/mcp").replace(/\/$/, ""),
      org: env.GITHUB_ORG || "Nova-Caelum",
      consoleUrl: (env.CONSOLE_URL || "https://console.novacaelum.com").replace(/\/$/, ""),
    },
  };
}
