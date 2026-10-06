import { z } from "zod";

/** Text in Spanish (official) with an optional English translation. */
export const Localized = z.object({
  es: z.string(),
  en: z.string().optional(),
});
export type Localized = z.infer<typeof Localized>;

export const CompetencyLevel = z.enum([
  "introduces",
  "develops",
  "consolidates",
]);
export type CompetencyLevel = z.infer<typeof CompetencyLevel>;

export const Competency = z.object({
  id: z.string(), // e.g. "cg-01"
  kind: z.enum(["generic", "specific"]),
  group: z.enum(["technological", "social-political-attitudinal", "specific"]),
  name: Localized, // es as in the official text
  description: Localized.optional(),
  /** Specific competencies belong to one of the degree's scopes (AR reserved activity or AL). */
  reservedActivityId: z.string().optional(),
  source: z.string(), // citation, e.g. "CONFEDI 2018"
});
export type Competency = z.infer<typeof Competency>;

/** A scope of the degree: an AR (reserved professional activity, RM 1254/2018) or an AL (other scope). */
export const ReservedActivity = z.object({
  id: z.string(), // e.g. "ar-01", "al-03"
  kind: z.enum(["reserved", "other"]),
  text: Localized,
  source: z.string(),
});
export type ReservedActivity = z.infer<typeof ReservedActivity>;

export const Subject = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be a kebab-case slug"),
  number: z.number().int(), // official number in the ordinance
  name: Localized, // es = official name; en only once a translation is provided
  level: z.number().int().min(1).max(6),
  // `null` = not yet transcribed from the official plan (never guessed).
  term: z.enum(["annual", "first", "second", "either"]).nullable(),
  hoursPerWeek: z.number().positive().nullable(), // class hours (horas cátedra) per week
  totalHours: z.number().positive().nullable(), // clock hours (horas reloj) per year
  block: z
    .enum([
      "basic-sciences",
      "basic-technologies",
      "applied-technologies",
      "complementary",
    ])
    .nullable(),
  isIntegrative: z.boolean(),
  isElective: z.boolean(),
  prerequisites: z.object({
    taken: z.array(z.string()), // course "cursada/regularizada" required
    passed: z.array(z.string()), // final "aprobada" required
  }),
  /** Objectives and minimum contents of the "programa sintético" (Spanish, as in the ordinance). */
  syllabus: z
    .object({ objectives: z.array(z.string()), contents: z.array(z.string()) })
    .optional(),
  specialRule: Localized.optional(), // free-text conditions, as in the ordinance
  profile: z.object({
    summary: Localized, // 1–2 sentences, plain language; es "" while still empty
    // `level` is absent when the source only says the subject contributes (the official matrix
    // of Ord. 1873 gives no level; the department sets it in each subject's planning).
    competencies: z.array(
      z.object({ id: z.string(), level: CompetencyLevel.optional() }),
    ),
    reservedActivities: z.array(z.string()),
    status: z.enum(["draft", "reviewed"]),
    reviewedBy: z.string().optional(),
  }),
  sources: z.array(z.string()),
});
export type Subject = z.infer<typeof Subject>;

export const Weekday = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);
export type Weekday = z.infer<typeof Weekday>;

/** One division (comisión) of a subject. Modules are the department grid's slots 0–6. */
export const ScheduleEntry = z.object({
  subjectId: z.string(),
  division: z.string(), // e.g. "Q1091"
  shifts: z.array(z.enum(["morning", "afternoon", "evening"])),
  modality: z.enum(["annual", "semester"]).nullable(),
  slots: z.array(
    z.object({
      day: Weekday,
      modules: z.array(z.number().int().min(0).max(6)).min(1),
    }),
  ),
  sheetCode: z.string().nullable(), // code printed on the source sheet
  sheetName: z.string(), // name as printed on the source sheet
});
export type ScheduleEntry = z.infer<typeof ScheduleEntry>;

const ModuleSpan = z.tuple([z.string(), z.string()]).nullable(); // [start, end]; null = no such module

/** Clock time of each module 0–6, per shift (the two 15-minute breaks sit between modules 2 and 3). */
export const ModuleTimes = z.object({
  source: z.string(),
  shifts: z.object({
    morning: z.array(ModuleSpan).length(7),
    afternoon: z.array(ModuleSpan).length(7),
    evening: z.array(ModuleSpan).length(7),
  }),
});
export type ModuleTimes = z.infer<typeof ModuleTimes>;

export const Schedule = z.object({
  reference: z.object({
    year: z.number().int(), // cycle the timetable was published for
    term: z.string(), // e.g. "1C/annual"
    plan: z.string(), // plan the sheet belongs to, e.g. "Plan 95A"
    confirmedFor: z.number().int().nullable(), // year the data was confirmed for, if ever
    venue: z.string(), // where classes are held, e.g. "Campus"
    source: z.string(),
  }),
  moduleTimes: ModuleTimes.optional(),
  entries: z.array(ScheduleEntry),
});
export type Schedule = z.infer<typeof Schedule>;

/** Conditions from the ordinance that are not tied to a numbered subject. */
export const SupplementaryRequirement = z.object({
  id: z.string(),
  name: Localized,
  text: Localized,
  source: z.string(),
});
export type SupplementaryRequirement = z.infer<typeof SupplementaryRequirement>;

export const Plan = z.object({
  id: z.string(),
  name: z.string(),
  ordinance: z.string(),
  faculty: z.literal("UTN FRBA"),
  subjects: z.array(Subject),
  supplementaryRequirements: z.array(SupplementaryRequirement).default([]),
  schedule: Schedule.optional(),
  competencies: z.array(Competency),
  reservedActivities: z.array(ReservedActivity),
});
export type Plan = z.infer<typeof Plan>;

/** Shape of a plan file on disk: competencies and activities are shared across plans. */
export const PlanFile = Plan.omit({
  competencies: true,
  reservedActivities: true,
});
export type PlanFile = z.infer<typeof PlanFile>;
export const CompetenciesFile = z.array(Competency);
export const ReservedActivitiesFile = z.array(ReservedActivity);
