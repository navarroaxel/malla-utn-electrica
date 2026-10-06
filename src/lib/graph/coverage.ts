import type { CompetencyLevel, Plan } from "@/data/schema";

/** A level, or "contributes" when the source lists the subject without saying how much. */
export type Contribution = CompetencyLevel | "contributes";

export interface CoverageEntry {
  subjectId: string;
  level: Contribution;
}

/** Subjects contributing to a competency, with their contribution (plan order). */
export function competencyCoverage(
  plan: Pick<Plan, "subjects">,
  competencyId: string,
): CoverageEntry[] {
  return plan.subjects.flatMap((s) => {
    const match = s.profile.competencies.find((c) => c.id === competencyId);
    return match
      ? [{ subjectId: s.id, level: match.level ?? ("contributes" as const) }]
      : [];
  });
}
