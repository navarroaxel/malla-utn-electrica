import type { Plan } from "@/data/schema";

export type PlanErrorCode =
  | "duplicate-id"
  | "duplicate-number"
  | "unknown-prerequisite"
  | "self-reference"
  | "level-inversion"
  | "cycle"
  | "unknown-competency"
  | "unknown-activity"
  | "unknown-schedule-subject";

export interface PlanError {
  code: PlanErrorCode;
  message: string;
  subjectId?: string;
}

export function validatePlan(plan: Plan): PlanError[] {
  const errors: PlanError[] = [];
  const push = (code: PlanErrorCode, message: string, subjectId?: string) =>
    errors.push({ code, message, subjectId });

  const byId = new Map<string, Plan["subjects"][number]>();
  const numbers = new Map<number, string>();
  for (const s of plan.subjects) {
    if (byId.has(s.id))
      push("duplicate-id", `Duplicate subject id "${s.id}"`, s.id);
    else byId.set(s.id, s);
    const owner = numbers.get(s.number);
    if (owner !== undefined) {
      push(
        "duplicate-number",
        `Subject number ${s.number} is used by "${owner}" and "${s.id}"`,
        s.id,
      );
    } else numbers.set(s.number, s.id);
  }

  const competencyIds = new Set(plan.competencies.map((c) => c.id));
  const activityIds = new Set(plan.reservedActivities.map((a) => a.id));
  for (const c of plan.competencies) {
    if (
      c.reservedActivityId !== undefined &&
      !activityIds.has(c.reservedActivityId)
    ) {
      push(
        "unknown-activity",
        `Competency "${c.id}" references unknown reserved activity "${c.reservedActivityId}"`,
      );
    }
  }
  for (const entry of plan.schedule?.entries ?? []) {
    if (!byId.has(entry.subjectId)) {
      push(
        "unknown-schedule-subject",
        `Schedule entry ${entry.division} references unknown subject "${entry.subjectId}"`,
      );
    }
  }
  const validEdges = new Map<string, string[]>();

  for (const s of plan.subjects) {
    const next: string[] = [];
    const prerequisites = [...s.prerequisites.taken, ...s.prerequisites.passed];
    for (const id of new Set(prerequisites)) {
      if (id === s.id) {
        push(
          "self-reference",
          `"${s.id}" lists itself as a prerequisite`,
          s.id,
        );
        continue;
      }
      const prerequisite = byId.get(id);
      if (!prerequisite) {
        push(
          "unknown-prerequisite",
          `"${s.id}" requires unknown subject "${id}"`,
          s.id,
        );
        continue;
      }
      if (prerequisite.level > s.level) {
        push(
          "level-inversion",
          `"${s.id}" (level ${s.level}) requires "${id}" from a higher level (${prerequisite.level})`,
          s.id,
        );
      }
      next.push(id);
    }
    validEdges.set(s.id, next);

    for (const c of s.profile.competencies) {
      if (!competencyIds.has(c.id)) {
        push(
          "unknown-competency",
          `"${s.id}" references unknown competency "${c.id}"`,
          s.id,
        );
      }
    }
    for (const id of s.profile.reservedActivities) {
      if (!activityIds.has(id)) {
        push(
          "unknown-activity",
          `"${s.id}" references unknown reserved activity "${id}"`,
          s.id,
        );
      }
    }
  }

  findCycles(validEdges).forEach((cycle) =>
    push("cycle", `Prerequisite cycle: ${cycle.join(" -> ")}`, cycle[0]),
  );
  return errors;
}

/** Depth-first search; reports one cycle per back edge, as a closed path of ids. */
function findCycles(
  prerequisites: ReadonlyMap<string, readonly string[]>,
): string[][] {
  const state = new Map<string, "visiting" | "done">();
  const cycles: string[][] = [];
  const path: string[] = [];

  const visit = (id: string) => {
    state.set(id, "visiting");
    path.push(id);
    for (const next of prerequisites.get(id) ?? []) {
      const s = state.get(next);
      if (s === "visiting")
        cycles.push([...path.slice(path.indexOf(next)), next]);
      else if (s === undefined) visit(next);
    }
    path.pop();
    state.set(id, "done");
  };
  for (const id of prerequisites.keys()) if (!state.has(id)) visit(id);
  return cycles;
}

/** Throws one error listing every problem. Used at build time. */
export function assertValidPlan(plan: Plan): void {
  const errors = validatePlan(plan);
  if (errors.length > 0) {
    throw new Error(
      `Plan "${plan.id}" is inconsistent:\n${errors.map((e) => `- [${e.code}] ${e.message}`).join("\n")}`,
    );
  }
}
