import type { Subject } from "@/data/schema";

/** Columns of review.csv. The first three are read-only context; the rest can be edited. */
export const REVIEW_COLUMNS = [
  "id",
  "number",
  "name",
  "summary_es",
  "summary_en",
  "competencies",
  "reserved_activities",
  "status",
  "reviewed_by",
] as const;
const EDITABLE = REVIEW_COLUMNS.slice(3);

const LEVELS = ["introduces", "develops", "consolidates"] as const;

type Profile = Subject["profile"];

/** "cg-01:develops; ce-1.1": a competency without a level just says the subject contributes. */
export function formatCompetencies(list: Profile["competencies"]): string {
  return list.map((c) => (c.level ? `${c.id}:${c.level}` : c.id)).join("; ");
}

/** Header plus one row per subject, in plan order. */
export function exportReview(subjects: readonly Subject[]): string[][] {
  return [
    [...REVIEW_COLUMNS],
    ...subjects.map((s) => [
      s.id,
      String(s.number),
      s.name.es,
      s.profile.summary.es,
      s.profile.summary.en ?? "",
      formatCompetencies(s.profile.competencies),
      s.profile.reservedActivities.join("; "),
      s.profile.status,
      s.profile.reviewedBy ?? "",
    ]),
  ];
}

export interface ReviewContext {
  competencyIds: ReadonlySet<string>;
  activityIds: ReadonlySet<string>;
}

export interface ReviewResult {
  subjects: Subject[];
  /** Ids of subjects whose profile changed. */
  changed: string[];
  /** Everything wrong with the file; when not empty, nothing should be written. */
  errors: string[];
}

const split = (value: string) =>
  value
    .split(/[;,\n]/)
    .map((p) => p.trim())
    .filter(Boolean);

/**
 * Merges an edited review sheet into the subjects' profiles. Only the editable columns that are
 * present in the sheet are applied; `id` decides the subject, `number` and `name` are ignored.
 * Nothing is applied partially: check `errors` before using `subjects`.
 */
export function applyReview(
  subjects: readonly Subject[],
  rows: readonly (readonly string[])[],
  context: ReviewContext,
): ReviewResult {
  const errors: string[] = [];
  const [header = [], ...data] = rows;
  const column = new Map(
    header.map((name, i) => [name.trim().toLowerCase(), i]),
  );
  if (!column.has("id")) {
    return {
      subjects: [...subjects],
      changed: [],
      errors: ['The sheet has no "id" column.'],
    };
  }
  const present = EDITABLE.filter((name) => column.has(name));
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const updated = new Map<string, Profile>();

  data.forEach((row, index) => {
    const line = index + 2;
    const get = (name: string) => (row[column.get(name) ?? -1] ?? "").trim();
    const id = get("id");
    const subject = byId.get(id);
    if (!subject) {
      errors.push(`Line ${line}: unknown subject id "${id}".`);
      return;
    }
    if (seen.has(id)) {
      errors.push(`Line ${line}: subject "${id}" appears more than once.`);
      return;
    }
    seen.add(id);

    const profile: Profile = structuredClone(subject.profile);
    const where = `Line ${line} (${id})`;

    if (present.includes("summary_es")) profile.summary.es = get("summary_es");
    if (present.includes("summary_en")) {
      const en = get("summary_en");
      if (en) profile.summary.en = en;
      else delete profile.summary.en;
    }
    if (present.includes("competencies")) {
      profile.competencies = [];
      for (const part of split(get("competencies"))) {
        const [cid, level] = part.split(":").map((p) => p.trim());
        const known = LEVELS.includes(level as (typeof LEVELS)[number]);
        if (!context.competencyIds.has(cid ?? "")) {
          errors.push(`${where}: unknown competency "${cid}".`);
        } else if (part.includes(":") && !known) {
          errors.push(
            `${where}: level "${level ?? ""}" for ${cid} must be one of ${LEVELS.join(", ")} (or leave it out).`,
          );
        } else if (profile.competencies.some((c) => c.id === cid)) {
          errors.push(`${where}: competency "${cid}" is listed twice.`);
        } else {
          profile.competencies.push(
            known
              ? { id: cid, level: level as (typeof LEVELS)[number] }
              : { id: cid },
          );
        }
      }
    }
    if (present.includes("reserved_activities")) {
      profile.reservedActivities = [];
      for (const aid of split(get("reserved_activities"))) {
        if (!context.activityIds.has(aid))
          errors.push(`${where}: unknown reserved activity "${aid}".`);
        else if (!profile.reservedActivities.includes(aid))
          profile.reservedActivities.push(aid);
      }
    }
    if (present.includes("status")) {
      const status = get("status").toLowerCase();
      if (status === "draft" || status === "reviewed") profile.status = status;
      else if (status !== "")
        errors.push(`${where}: status "${status}" must be draft or reviewed.`);
    }
    if (present.includes("reviewed_by")) {
      const who = get("reviewed_by");
      if (who) profile.reviewedBy = who;
      else delete profile.reviewedBy;
    }
    if (profile.status === "reviewed" && !profile.reviewedBy) {
      errors.push(`${where}: a reviewed profile needs reviewed_by.`);
    }
    updated.set(id, profile);
  });

  const changed: string[] = [];
  const result = subjects.map((s) => {
    const profile = updated.get(s.id);
    if (!profile || JSON.stringify(profile) === JSON.stringify(s.profile))
      return s;
    changed.push(s.id);
    return { ...s, profile };
  });
  return { subjects: result, changed, errors };
}
