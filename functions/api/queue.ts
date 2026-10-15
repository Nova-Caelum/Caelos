import { buildQueue } from "../_lib/dashboard/build.ts";
import type { Env } from "../_lib/dashboard/config.ts";
import { serve } from "../_lib/dashboard/handler.ts";

export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  serve(request, env, (src, config) => buildQueue(src, config));
