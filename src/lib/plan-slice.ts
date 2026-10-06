import type { Plan } from "@/data/schema";
import { buildGraph } from "@/lib/graph";

/**
 * The part of the plan a subject's own page needs: the subject, its direct prerequisites and
 * dependents (for the links), its competencies and reserved activities, and its timetable.
 * Keeps each static page small instead of embedding the whole plan 41 times.
 */
export function sliceForSubject(plan: Plan, id: string): Plan | null {
  const subject = plan.subjects.find((s) => s.id === id);
  if (!subject) return null;
  const graph = buildGraph(plan);
  const keep = new Set([
    id,
    ...(graph.incoming.get(id) ?? []).map((e) => e.from),
    ...(graph.outgoing.get(id) ?? []).map((e) => e.to),
  ]);
  const competencyIds = new Set(subject.profile.competencies.map((c) => c.id));
  const activityIds = new Set(subject.profile.reservedActivities);
  return {
    ...plan,
    // Only the page's own subject needs its syllabus; neighbours are just links.
    subjects: plan.subjects
      .filter((s) => keep.has(s.id))
      .map((s) => (s.id === id ? s : { ...s, syllabus: undefined })),
    competencies: plan.competencies.filter((c) => competencyIds.has(c.id)),
    reservedActivities: plan.reservedActivities.filter((a) =>
      activityIds.has(a.id),
    ),
    supplementaryRequirements: [],
    schedule: plan.schedule && {
      ...plan.schedule,
      entries: plan.schedule.entries.filter((e) => e.subjectId === id),
    },
  };
}
