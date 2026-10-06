import { isAtLeast, reachable, type Edge, type Graph } from "./graph";

/**
 * Edges to display by default. An edge A→C is redundant when another path A→B→…→C exists
 * whose first edge (A→B) is at least as strong: enrolling in B already required A at that
 * strength, so C's own requirement on A adds nothing. Keep `graph.edges` for computations.
 */
export function transitiveReduction(graph: Graph): Edge[] {
  const cache = new Map<string, Set<string>>();
  const reachFrom = (id: string) => {
    let set = cache.get(id);
    if (!set) {
      set = reachable(id, (n) =>
        (graph.outgoing.get(n) ?? []).map((e) => e.to),
      );
      cache.set(id, set);
    }
    return set;
  };

  return graph.edges.filter(
    (edge) =>
      !(graph.outgoing.get(edge.from) ?? []).some(
        (via) =>
          via.to !== edge.to &&
          isAtLeast(via.type, edge.type) &&
          reachFrom(via.to).has(edge.to),
      ),
  );
}
