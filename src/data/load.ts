import { z } from "zod";
import {
  CompetenciesFile,
  Plan,
  PlanFile,
  ReservedActivitiesFile,
  Schedule,
} from "./schema";
import { assertValidPlan } from "@/lib/graph";
import plan2023 from "./plans/plan-2023.json";
import competencies from "./competencies.json";
import reservedActivities from "./reserved-activities.json";
import schedule from "./schedule.json";
import moduleTimes from "./module-times.json";

function parseOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid data in ${label}:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

/** Assembles and validates a plan. Throws a readable error on invalid data. */
export function assemblePlan(
  planData: unknown,
  competencyData: unknown,
  activityData: unknown,
  scheduleData?: unknown,
): Plan {
  const file = parseOrThrow(PlanFile, planData, "plan file");
  const plan = parseOrThrow(
    Plan,
    {
      ...file,
      schedule:
        scheduleData === undefined
          ? file.schedule
          : parseOrThrow(Schedule, scheduleData, "schedule.json"),
      competencies: parseOrThrow(
        CompetenciesFile,
        competencyData,
        "competencies.json",
      ),
      reservedActivities: parseOrThrow(
        ReservedActivitiesFile,
        activityData,
        "reserved-activities.json",
      ),
    },
    `plan ${file.id}`,
  );
  assertValidPlan(plan);
  return plan;
}

/** Loads Plan 2023 (schema + graph consistency checks). Imported by server components so a bad file fails `next build`. */
export function loadPlan2023(): Plan {
  return assemblePlan(plan2023, competencies, reservedActivities, {
    ...schedule,
    moduleTimes,
  });
}
