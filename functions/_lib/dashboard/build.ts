// Assembles the two responses. Panels are independent: one failing source degrades one panel.

import type { Config } from "./config.ts";
import * as P from "./panels.ts";
import { NotConfigured, type Sources } from "./sources.ts";

export const CONTRACT_VERSION = 1;

type Panel<T> = ({ status: "ok" } & T) | { status: "error"; error: string } | { status: "unavailable"; reason: string };

async function guard<T extends object>(fn: () => Promise<T>): Promise<Panel<T>> {
  try {
    return { status: "ok", ...(await fn()) };
  } catch (e) {
    if (e instanceof NotConfigured) return { status: "unavailable", reason: `not configured: ${e.secret}` };
    // Error TYPE or source code only: exception text can echo request details.
    const code = e instanceof Error && "code" in e ? String((e as { code: unknown }).code) : e instanceof Error ? e.name : "Error";
    return { status: "error", error: code };
  }
}

const ROWS_TO_DECIDE = {
  status: "unavailable" as const,
  reason: "Verifier 'unverifiable' verdicts live in Mac-only run files (graph-machine/run/verifications); no cloud source exists yet.",
};

export async function buildDashboard(src: Sources, config: Config, viewerEmail: string | null, now: Date = new Date()) {
  const [queue, escalated, ciData, next, crazy, ws, lp, open, verifier] = await Promise.all([
    guard(() => P.queueSummaries(src, config)),
    guard(() => P.escalatedPrs(src, config.org)),
    guard(() => P.ci(src, config.org)),
    guard(() => P.nextPriority(src)),
    guard(() => P.crazyList(src)),
    guard(() => P.workstream(src, now)),
    guard(() => P.loops(src)),
    guard(() => P.openWork(src, config)),
    guard(() => P.verifierCloses(src, config, now)),
  ]);
  const originMain = ciData.status === "ok" ? ciData.originMainSha : null;
  const escalatedKeys = escalated.status === "ok" ? escalated.escalatedKeys : new Set<string>();
  const [prs, deploys] = await Promise.all([
    guard(() => P.openPrs(src, config.org, escalatedKeys)),
    guard(() => P.runtimeDeploys(src, originMain, now)),
  ]);

  const queueRows = queue.status === "ok" ? queue.rows : [];
  const prTotal = escalated.status === "ok" ? escalated.total : 0;
  const prsPanel = escalated.status === "ok" ? { status: "ok" as const, total: escalated.total, groups: escalated.groups, repins: escalated.repins } : escalated;
  // One half loading is enough to show the panel; the failed half is marked inside it (queue_status / prs.status).
  const waiting =
    queue.status === "ok" || escalated.status === "ok"
      ? { status: "ok" as const, count: prTotal + queueRows.length, prs: prsPanel, queue_status: queue.status, queue_rows: queueRows, rows_to_decide: ROWS_TO_DECIDE }
      : queue;

  return {
    contract_version: CONTRACT_VERSION,
    generated_at: now.toISOString(),
    viewer: { email: viewerEmail },
    panels: {
      waiting_on_daniel: waiting,
      queue: queue.status === "ok" ? { status: "ok" as const, count: queue.rows.length, by_state: queue.by_state } : queue,
      next_priority: next,
      crazy_list: crazy,
      workstream: ws,
      loops: lp,
      open_work: open,
      open_prs: prs,
      verifier_closes: verifier,
      runtime_deploys: deploys,
      ci: ciData.status === "ok" ? { status: "ok" as const, checked: ciData.checked, red: ciData.red } : ciData,
    },
  };
}

export async function buildQueue(src: Sources, config: Config, now: Date = new Date()) {
  const rows = await P.queueRows(src, config);
  return { contract_version: CONTRACT_VERSION, generated_at: now.toISOString(), count: rows.length, rows };
}
