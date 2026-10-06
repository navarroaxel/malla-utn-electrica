import type { Graph } from "./graph";

/**
 * The longest prerequisite path, first to last subject. Every edge costs one term (even a
 * "taken" prerequisite must be completed before the next term), so its length is the
 * minimum number of terms to graduate. Ties resolve to the earliest subject in plan order.
 * Throws if the graph has a cycle.
 */
export function longestChain(graph: Graph): string[] {
  const best = new Map<string, { length: number; previous?: string }>();
  const visiting = new Set<string>();

  const solve = (id: string): number => {
    const known = best.get(id);
    if (known) return known.length;
    if (visiting.has(id)) throw new Error(`Prerequisite cycle through "${id}"`);
    visiting.add(id);
    let entry: { length: number; previous?: string } = { length: 1 };
    for (const e of graph.incoming.get(id) ?? []) {
      const length = solve(e.from) + 1;
      if (length > entry.length) entry = { length, previous: e.from };
    }
    visiting.delete(id);
    best.set(id, entry);
    return entry.length;
  };

  let end: string | undefined;
  let max = 0;
  for (const id of graph.nodes) {
    const length = solve(id);
    if (length > max) {
      max = length;
      end = id;
    }
  }

  const chain: string[] = [];
  for (let id = end; id !== undefined; id = best.get(id)?.previous)
    chain.unshift(id);
  return chain;
}
