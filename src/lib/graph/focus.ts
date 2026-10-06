import type { Edge, Graph, Requirement } from "./graph";
import { ancestors, descendants } from "./reachability";

export interface Focus {
  id: string;
  ancestors: Map<string, Requirement>;
  descendants: Map<string, Requirement>;
  /** The subject itself or anything upstream/downstream of it. */
  isRelated: (id: string) => boolean;
  /** Edge lies on a path leading to or from the focused subject. */
  isLit: (edge: Edge) => boolean;
}

export function focusSets(graph: Graph, id: string): Focus {
  const up = ancestors(graph, id);
  const down = descendants(graph, id);
  return {
    id,
    ancestors: up,
    descendants: down,
    isRelated: (other) => other === id || up.has(other) || down.has(other),
    isLit: (e) =>
      (up.has(e.from) && (up.has(e.to) || e.to === id)) ||
      (down.has(e.to) && (down.has(e.from) || e.from === id)),
  };
}
