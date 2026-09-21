import * as recipes from "@caelos/recipes";
import taskgraph from "virtual:foundry-taskgraph";

/**
 * The inventory is DERIVED, never listed. Every recipe Panda emits carries `__name__` and
 * `variantMap`; this module reads those and nothing else, so a recipe or variant added to
 * either package appears here without anyone editing the Foundry.
 */

export type Axis = { name: string; values: string[] };

export type Track = "chat" | "taskgraph";

export interface RecipeInfo {
  name: string;
  kind: "standard" | "slot";
  axes: Axis[];
  defaults: Record<string, string>;
  slots: string[];
  fn: (props?: Record<string, unknown>) => string | Record<string, string>;
  tracks: Track[];
  /** Where the React 18 task-graph definition of the same recipe differs from React 19. */
  delta: string[];
  combinations: number;
}

const axesOf = (variantMap: Record<string, string[]>): Axis[] =>
  Object.entries(variantMap ?? {}).map(([name, values]) => ({ name, values: [...values] }));

/** Panda boolean variants are keyed "true"/"false" in variantMap but called with booleans. */
export const toCallProps = (variants: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(variants).map(([k, v]) => [k, v === "true" ? true : v === "false" ? false : v]),
  );

function describeDelta(chat: Axis[], tg: Axis[]): string[] {
  const out: string[] = [];
  const chatByName = new Map(chat.map((a) => [a.name, a]));
  const tgByName = new Map(tg.map((a) => [a.name, a]));
  for (const a of chat) {
    const t = tgByName.get(a.name);
    if (!t) {
      out.push(`\`${a.name}\` axis exists only in the chat track`);
      continue;
    }
    const onlyChat = a.values.filter((v) => !t.values.includes(v));
    const onlyTg = t.values.filter((v) => !a.values.includes(v));
    if (onlyChat.length) out.push(`\`${a.name}\`: ${onlyChat.map((v) => `"${v}"`).join(", ")} only in chat`);
    if (onlyTg.length) out.push(`\`${a.name}\`: ${onlyTg.map((v) => `"${v}"`).join(", ")} only in task graph`);
  }
  for (const t of tg) if (!chatByName.has(t.name)) out.push(`\`${t.name}\` axis exists only in the task-graph track`);
  return out;
}

const tgMap = new Map(taskgraph.recipes.map((r) => [r.name, axesOf(r.variantMap)]));

export const inventory: RecipeInfo[] = Object.values(recipes as Record<string, any>)
  .filter((v) => typeof v === "function" && v.variantMap && v.__name__)
  .map((fn) => {
    const axes = axesOf(fn.variantMap);
    const rawDefaults = typeof fn.getVariantProps === "function" ? fn.getVariantProps({}) : {};
    const defaults = Object.fromEntries(
      Object.entries(rawDefaults ?? {})
        // getVariantProps also returns Panda's internal "__ignore__" sentinel and keys that are not axes.
        .filter(([k, v]) => v !== undefined && v !== null && v !== "__ignore__" && k in (fn.variantMap ?? {}))
        .map(([k, v]) => [k, String(v)]),
    );
    const sample = fn(toCallProps(defaults));
    const kind = typeof sample === "string" ? ("standard" as const) : ("slot" as const);
    const tg = tgMap.get(fn.__name__);
    return {
      name: fn.__name__ as string,
      kind,
      axes,
      defaults,
      slots: kind === "slot" ? Object.keys(sample) : [],
      fn,
      tracks: tg ? (["chat", "taskgraph"] as Track[]) : (["chat"] as Track[]),
      delta: tg ? describeDelta(axes, tg) : [],
      combinations: axes.reduce((n, a) => n * Math.max(1, a.values.length), 1),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

/** Task-graph recipes that have no chat-track counterpart at all. Empty today: React 19 is a superset by name. */
export const taskgraphOnly = taskgraph.recipes
  .filter((r) => !inventory.some((i) => i.name === r.name))
  .map((r) => r.name);

export const taskgraphAvailable = taskgraph.available;
export const taskgraphReason = taskgraph.reason;

export const totals = {
  recipes: inventory.length,
  standard: inventory.filter((r) => r.kind === "standard").length,
  slot: inventory.filter((r) => r.kind === "slot").length,
  axes: inventory.reduce((n, r) => n + r.axes.length, 0),
  combinations: inventory.reduce((n, r) => n + r.combinations, 0),
  shared: inventory.filter((r) => r.tracks.includes("taskgraph")).length,
  taskgraph: taskgraph.recipes.length,
};
