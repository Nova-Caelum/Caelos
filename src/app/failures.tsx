// Every failed write in the console says why, in one place.
//
// The server already explains itself — the engine's door answers every failure with
// `{"error": "<reason>"}`, a FastAPI server with `{"detail": ...}`, an MCP tool with
// its own text. Before this file, each handler caught the error and showed a fixed
// "Failed to …" toast, throwing the reason away. Now the request layer keeps the
// reason on the error it throws (`ApiError`), and every handler hands that error to
// `reportFailure`, which shows what failed, the server's words, and the next step
// when one is knowable.
import { toast } from "sonner";
import { ErrorMessage } from "@nova-caelum/ui";

/** A failed call to the console's server, carrying the server's own reason. */
export class ApiError extends Error {
  readonly method: string;
  readonly path: string;
  /** HTTP status, or null when the failure arrived inside a 200 (an MCP tool error). */
  readonly status: number | null;
  /** The server's own words, untruncated. Also the error's `message`. */
  readonly reason: string;

  constructor({ method, path, status, reason }: { method: string; path: string; status: number | null; reason: string }) {
    super(reason);
    this.name = "ApiError";
    this.method = method;
    this.path = path;
    this.status = status;
    this.reason = reason;
  }
}

function textOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** The reason out of a failed response body: `{"error"}` (the engine's door),
 * `{"detail"}` as a string or as FastAPI's validation list, else the body itself. */
export function reasonFromBody(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown> | null;
    if (parsed && typeof parsed === "object") {
      const error = textOf(parsed.error) ?? textOf((parsed.error as { message?: unknown } | undefined)?.message);
      if (error) return error;
      const detail = textOf(parsed.detail);
      if (detail) return detail;
      if (Array.isArray(parsed.detail)) {
        const messages = parsed.detail
          .map(item => textOf((item as { msg?: unknown })?.msg))
          .filter((msg): msg is string => !!msg);
        if (messages.length) return messages.join("; ");
      }
    }
  } catch { /* not JSON — fall through to the raw body */ }
  return textOf(body) ?? `The server answered ${status} without a reason.`;
}

/** Build the error a failed `fetch` response should throw. */
export async function apiErrorFromResponse(method: string, path: string, response: Response): Promise<ApiError> {
  const body = await response.text().catch(() => "");
  return new ApiError({ method, path, status: response.status, reason: reasonFromBody(body, response.status) });
}

/**
 * A 404 from a read the console treats as optional means this server does not serve
 * that route at all (Nova's ops-server has no runs or worklog read; the engine's door
 * has both). The one 404 the door gives on those routes for another reason — an
 * unknown project — cannot happen here, because the project was already loaded.
 */
export const isMissingRoute = (error: unknown): boolean => error instanceof ApiError && error.status === 404;

/** The reason to show for any thrown value. */
export function failureReason(error: unknown): string {
  if (error instanceof ApiError) return error.reason;
  // `fetch` rejects with a TypeError when the server cannot be reached at all.
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) return "The server could not be reached.";
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  return "No reason was given.";
}

// The next step, when the reason makes it knowable. First match wins.
const NEXT_STEPS: Array<[RegExp, string]> = [
  [/acceptance_criteria must be 20-2000 characters/i, "Write acceptance criteria of 20 to 2,000 characters, or leave them empty."],
  [/\bname (is required|must be a non-empty)|\btitle is required/i, "Give it a name, then try again."],
  [/no such tool|not supported by this (engine|server)/i, "This server does not support this action yet."],
  [/\bproject not found/i, "Reload the page — this project may no longer exist."],
  [/not found/i, "Reload the page and try again — it may have been moved or archived."],
  [/could not be reached/i, "Check that the console's server is still running, then try again."],
];

export function nextStepFor(reason: string, error?: unknown): string | undefined {
  // A server that already states its own next step ("… Create a module and move the
  // task into it instead.") is not repeated with a generic one.
  if (/\binstead\.?$/i.test(reason)) return undefined;
  for (const [pattern, step] of NEXT_STEPS) if (pattern.test(reason)) return step;
  if (error instanceof ApiError && error.status !== null && error.status >= 500) {
    return "The server hit an error. Try again; if it keeps happening, check the server's log.";
  }
  return undefined;
}

const failureId = (what: string) => `failure:${what}`;

/**
 * Show a failure: what failed, the server's reason, and the next step when knowable.
 * It stays on screen until dismissed (a reason must be readable, not race a timer) and
 * the same action failing again replaces it rather than stacking. `fallbackNext` is
 * shown only when no next step is known from the reason itself.
 */
export function reportFailure(what: string, error: unknown, fallbackNext?: string): void {
  const reason = failureReason(error);
  const next = nextStepFor(reason, error) ?? fallbackNext;
  toast.custom(id => (
    <ErrorMessage
      data-failure=""
      title={what}
      description={<>
        <span data-failure-reason="" style={{ display: "block" }}>{reason}</span>
        {next && <span data-failure-next="" style={{ display: "block", marginTop: "var(--sys-space-1)" }}>{next}</span>}
      </>}
      onDismiss={() => toast.dismiss(id)}
    />
  ), {
    id: failureId(what),
    duration: Infinity,
    unstyled: true,
    style: { background: "transparent", border: 0, padding: 0, boxShadow: "none" },
  });
}

/** Clear a shown failure once the same action has succeeded. */
export function clearFailure(what: string): void {
  toast.dismiss(failureId(what));
}
