import {
  availableSubjects,
  type Graph,
  type MissingRequirement,
} from "@/lib/graph";
import { toSets, type ProgressState } from "./progress";

/** Everything the map and the list need to show a student's progress. */
export interface ProgressView {
  state: ProgressState;
  /** Subjects the student cannot enroll in yet, with what is missing. */
  blocked: ReadonlyMap<string, readonly MissingRequirement[]>;
}

export type DisplayStatus = "passed" | "taken" | "available" | "blocked";

export function buildProgressView(
  graph: Graph,
  state: ProgressState,
): ProgressView {
  const { blocked } = availableSubjects(graph, toSets(state));
  return { state, blocked: new Map(blocked.map((b) => [b.id, b.missing])) };
}

export function displayStatus(view: ProgressView, id: string): DisplayStatus {
  const status = view.state[id];
  if (status) return status;
  return view.blocked.has(id) ? "blocked" : "available";
}

export function countAvailable(graph: Graph, view: ProgressView): number {
  return graph.nodes.filter((id) => displayStatus(view, id) === "available")
    .length;
}
