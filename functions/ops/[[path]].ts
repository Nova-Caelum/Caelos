import type { Env } from "../_lib/dashboard/config.ts";
import { proxyToOps } from "../_lib/ops-proxy.ts";

export const onRequest = ({ request, env }: { request: Request; env: Env & { CONSOLE_OPS_BEARER?: string } }) =>
  proxyToOps(request, env);
