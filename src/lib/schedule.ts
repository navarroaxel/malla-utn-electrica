import type { ModuleTimes, Plan, ScheduleEntry } from "@/data/schema";

/** The cycle the department wants to show; timetables from other years are only references. */
export const SCHEDULE_TARGET_YEAR = 2026;

export function scheduleFor(
  plan: Pick<Plan, "schedule">,
  subjectId: string,
): ScheduleEntry[] {
  return (plan.schedule?.entries ?? []).filter(
    (e) => e.subjectId === subjectId,
  );
}

/** Groups modules into runs of consecutive numbers: [5,1,3,4] → [[1],[3,4,5]]. */
export function moduleRuns(modules: readonly number[]): number[][] {
  const sorted = [...new Set(modules)].sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const m of sorted) {
    const last = runs.at(-1);
    if (last && last.at(-1) === m - 1) last.push(m);
    else runs.push([m]);
  }
  return runs;
}

/** [3,4,5] → "3–5", [0,1,2,3] → "0–3", [1,3] → "1, 3", [2] → "2". Order-insensitive. */
export function formatModules(modules: readonly number[]): string {
  return moduleRuns(modules)
    .map((run) => (run.length > 1 ? `${run[0]}–${run.at(-1)}` : String(run[0])))
    .join(", ");
}

export interface SlotRun {
  modules: string;
  /** Clock times, only when they can be derived without guessing. */
  from?: string;
  to?: string;
}

/**
 * Each run of consecutive modules of a slot, with its clock time when known. Times are skipped
 * when the entry spans two shifts (the sheet does not say which day belongs to which) and for
 * evening classes on Saturday, a combination the source sheet contains but does not explain.
 */
export function slotRuns(
  entry: Pick<ScheduleEntry, "shifts">,
  slot: ScheduleEntry["slots"][number],
  times: ModuleTimes | undefined,
): SlotRun[] {
  const shift = entry.shifts.length === 1 ? entry.shifts[0] : null;
  const usable =
    times && shift && !(shift === "evening" && slot.day === "saturday");
  return moduleRuns(slot.modules).map((run) => {
    const label = formatModules(run);
    if (!usable) return { modules: label };
    const spans = run.map((m) => times.shifts[shift][m]);
    const first = spans[0];
    const last = spans.at(-1);
    if (!first || !last || spans.some((span) => span === null))
      return { modules: label };
    return { modules: label, from: first[0], to: last[1] };
  });
}
