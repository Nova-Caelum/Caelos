import type { Env } from "../../_lib/dashboard/config.ts";
import { completeQueueRow } from "../../_lib/queue-complete.ts";

export const onRequest = ({ request, env }: { request: Request; env: Env & { CONSOLE_OPS_BEARER?: string } }) =>
  completeQueueRow(request, env);
