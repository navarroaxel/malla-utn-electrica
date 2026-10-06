import { reachable, type Graph, type Requirement } from "./graph";

/**
 * Every subject that must come before `id`, mapped to the strongest requirement it
 * imposes: "passed" if some path leaves it through a "passed" edge, else "taken".
 */
export function ancestors(graph: Graph, id: string): Map<string, Requirement> {
  const upstream = reachable(id, (n) =>
    (graph.incoming.get(n) ?? []).map((e) => e.from),
  );
  const result = new Map<string, Requirement>();
  for (const a of upstream) {
    const passed = (graph.outgoing.get(a) ?? []).some(
      (e) => e.type === "passed" && (e.to === id || upstream.has(e.to)),
    );
    result.set(a, passed ? "passed" : "taken");
  }
  return result;
}

/** Every subject `id` (transitively) unlocks, with the strongest requirement `id` imposes on it. */
export function descendants(
  graph: Graph,
  id: string,
): Map<string, Requirement> {
  const next = (n: string) => (graph.outgoing.get(n) ?? []).map((e) => e.to);
  const downstream = reachable(id, next);
  const viaPassed = new Set<string>();
  for (const e of graph.outgoing.get(id) ?? []) {
    if (e.type !== "passed") continue;
    viaPassed.add(e.to);
    reachable(e.to, next).forEach((d) => viaPassed.add(d));
  }
  const result = new Map<string, Requirement>();
  for (const d of downstream)
    result.set(d, viaPassed.has(d) ? "passed" : "taken");
  return result;
}
