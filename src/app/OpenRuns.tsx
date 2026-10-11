// "Open runs" — which runs of work are open in this project, and which step each is on.
// Shown on the project page and on the module page (runs are not linked to modules
// yet, so a module shows its project's runs). Reads `GET /api/projects/<code>/runs`.
// A server without the runs route (404) gets no section at all, not an error.
import { useEffect, useState, type ReactNode } from "react";
import { Badge, Text, type Tone } from "@nova-caelum/ui";
import { failureReason, isMissingRoute } from "./failures";

/** One run, as the engine's door lists it. */
export type Run = { goal: string; status: string | null; current_node: string | null; run_folder: string; open: boolean };

export const NO_OPEN_RUN = "No run open yet — the first step of new work is Understand.";

// The engine's step names. A run that is live stays on node "executing", so status
// decides Live before the node is read; a run still framing has no node yet.
const STEP_BY_NODE: Record<string, string> = {
  framing: "Understand",
  understanding: "Understand",
  deciding: "Decide",
  specifying: "Draft",
  executing: "Build",
  verifying: "Build",
};
const STALLED: Record<string, string> = { blocked_external: "(blocked)", abandoned_budget: "(over budget)" };

export function stepName(run: Pick<Run, "status" | "current_node">): string {
  if (run.status === "live") return "Live";
  // An unknown node is shown as-is rather than guessed into a step.
  const step = run.current_node == null ? "Understand" : STEP_BY_NODE[run.current_node] ?? run.current_node;
  const stalled = run.status ? STALLED[run.status] : undefined;
  return stalled ? `${step} ${stalled}` : step;
}

function stepTone(run: Pick<Run, "status">): Tone {
  if (run.status && run.status in STALLED) return "danger";
  return run.status === "live" ? "sage" : "progress";
}

// Whether this server serves the runs route, learned from the first read and kept for
// the session: "unknown" renders nothing until it is known, so a server without the
// route never flashes the section.
let runsRoute: "unknown" | "present" | "absent" = "unknown";

export function OpenRuns({ projectCode, load, where, className, after }: {
  projectCode: string;
  /** Reads a project's runs. */
  load: (projectCode: string) => Promise<Run[]>;
  /** Which page the section is on — the browser checks find it by this. */
  where: "project" | "module";
  className?: string;
  /** Rendered after the section, and only when the section is (a divider, say). */
  after?: ReactNode;
}) {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState(runsRoute);

  useEffect(() => {
    if (runsRoute === "absent") return;
    let cancelled = false;
    setRuns(null); setError(null);
    load(projectCode)
      .then(all => {
        runsRoute = "present";
        if (!cancelled) { setRoute(runsRoute); setRuns(all.filter(run => run.open)); }
      })
      .catch(e => {
        // A 404 means this server has no runs at all: hide, say nothing. Any other
        // failure is shown in place, quietly — not as a toast on every page open.
        runsRoute = isMissingRoute(e) ? "absent" : "present";
        if (!cancelled) { setRoute(runsRoute); if (runsRoute === "present") setError(failureReason(e)); }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-read per project, not per loader identity
  }, [projectCode]);

  if (route !== "present") return null;
  return (
    <>
    <section data-open-runs={where} aria-label="Open runs" className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <Text as="p" variant="label">Open runs</Text>
      {error ? (
        <Text as="p" variant="small" tone="muted" data-open-runs-error="">Couldn't read this project's runs: {error}</Text>
      ) : runs === null ? (
        <Text as="p" variant="small" tone="dim">Reading runs…</Text>
      ) : runs.length === 0 ? (
        <Text as="p" variant="small" tone="muted">{NO_OPEN_RUN}</Text>
      ) : (
        <ul className="flex flex-col gap-1.5" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {runs.map(run => (
            <li key={run.run_folder} className="flex items-center gap-2.5 min-w-0" data-run-goal={run.goal}>
              <Text variant="mono" className="truncate" style={{ fontSize: 12, lineHeight: "18px" }} title={run.run_folder}>{run.goal}</Text>
              <Badge tone={stepTone(run)}>{stepName(run)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
    {after}
    </>
  );
}
