import type { Plan } from "@/data/schema";

export type Requirement = "taken" | "passed";

/** `from` is the prerequisite, `to` is the subject that requires it. */
export interface Edge {
  from: string;
  to: string;
  type: Requirement;
}

export interface Graph {
  /** Subject ids, in plan order (keeps every result deterministic). */
  nodes: readonly string[];
  edges: readonly Edge[];
  incoming: ReadonlyMap<string, readonly Edge[]>;
  outgoing: ReadonlyMap<string, readonly Edge[]>;
}

const RANK: Record<Requirement, number> = { taken: 0, passed: 1 };

/** "passed" beats "taken". */
export function strongest(a: Requirement, b: Requirement): Requirement {
  return RANK[a] >= RANK[b] ? a : b;
}

export function isAtLeast(a: Requirement, b: Requirement): boolean {
  return RANK[a] >= RANK[b];
}

/**
 * Builds the full prerequisite graph. Tolerant of bad data: self-references and unknown
 * ids are dropped (report them with `validatePlan`). If an id is listed as both taken and
 * passed, the stronger requirement wins.
 */
export function buildGraph(plan: Pick<Plan, "subjects">): Graph {
  const nodes = plan.subjects.map((s) => s.id);
  const known = new Set(nodes);
  const edges: Edge[] = [];

  for (const subject of plan.subjects) {
    const byPrerequisite = new Map<string, Requirement>();
    const add = (id: string, type: Requirement) => {
      if (id === subject.id || !known.has(id)) return;
      byPrerequisite.set(id, strongest(byPrerequisite.get(id) ?? type, type));
    };
    subject.prerequisites.taken.forEach((id) => add(id, "taken"));
    subject.prerequisites.passed.forEach((id) => add(id, "passed"));
    for (const [from, type] of byPrerequisite) {
      edges.push({ from, to: subject.id, type });
    }
  }

  const incoming = new Map<string, Edge[]>(nodes.map((id) => [id, []]));
  const outgoing = new Map<string, Edge[]>(nodes.map((id) => [id, []]));
  for (const edge of edges) {
    incoming.get(edge.to)?.push(edge);
    outgoing.get(edge.from)?.push(edge);
  }
  return { nodes, edges, incoming, outgoing };
}

/** Ids reachable from `start` (excluding `start` itself) following `next`. */
export function reachable(
  start: string,
  next: (id: string) => readonly string[],
): Set<string> {
  const seen = new Set<string>();
  const stack = [...next(start)];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...next(id));
  }
  seen.delete(start);
  return seen;
}
