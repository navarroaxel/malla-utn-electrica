import type { Edge, Graph, Requirement } from "./graph";

export interface Progress {
  taken: ReadonlySet<string>;
  passed: ReadonlySet<string>;
}

export interface MissingRequirement {
  id: string;
  requirement: Requirement;
}

export interface Availability {
  /** Subjects the student can enroll in now. */
  available: string[];
  /** Subjects not yet enrollable, with what is still missing. */
  blocked: { id: string; missing: MissingRequirement[] }[];
}

/**
 * Subjects not yet taken or passed, split into available and blocked. A passed subject
 * counts as taken. Results follow plan order.
 */
export function availableSubjects(
  graph: Graph,
  progress: Progress,
): Availability {
  const satisfied = (e: Edge) =>
    progress.passed.has(e.from) ||
    (e.type === "taken" && progress.taken.has(e.from));

  const result: Availability = { available: [], blocked: [] };
  for (const id of graph.nodes) {
    if (progress.taken.has(id) || progress.passed.has(id)) continue;
    const missing = (graph.incoming.get(id) ?? [])
      .filter((e) => !satisfied(e))
      .map((e) => ({ id: e.from, requirement: e.type }));
    if (missing.length === 0) result.available.push(id);
    else result.blocked.push({ id, missing });
  }
  return result;
}
