import { describe, expect, it } from "vitest";
import { loadPlan2023 } from "@/data/load";
import { formatModules, scheduleFor, slotRuns } from "@/lib/schedule";
import { validatePlan } from "@/lib/graph";

describe("formatModules", () => {
  it("collapses consecutive modules", () => {
    expect(formatModules([3, 4, 5])).toBe("3–5");
    expect(formatModules([0, 1, 2, 3, 4, 5])).toBe("0–5");
    expect(formatModules([2])).toBe("2");
  });
  it("keeps gaps and ignores order and duplicates", () => {
    expect(formatModules([5, 1, 3, 4, 1])).toBe("1, 3–5");
  });
});

describe("reference schedule", () => {
  const plan = loadPlan2023();

  it("is a 2022 reference that has not been confirmed for any year", () => {
    expect(plan.schedule?.reference).toMatchObject({
      year: 2022,
      plan: "Plan 95A",
      confirmedFor: null,
    });
  });

  it("only references subjects of the plan", () => {
    expect(
      validatePlan(plan).filter((e) => e.code === "unknown-schedule-subject"),
    ).toEqual([]);
  });

  // Regression: rows checked against the rendered PDF.
  it.each([
    [
      "control-automatico",
      "Q4051",
      [{ day: "monday", modules: [1, 2, 3, 4, 5] }],
    ],
    [
      "electrotecnia-1",
      "Q2051",
      [{ day: "thursday", modules: [0, 1, 2, 3, 4, 5] }],
    ],
    ["teoria-de-los-campos", "Q3051", [{ day: "monday", modules: [3, 4, 5] }]],
    [
      "maquinas-electricas-2",
      "Q4051",
      [
        { day: "wednesday", modules: [3, 4] },
        { day: "saturday", modules: [1, 2, 3, 4] },
      ],
    ],
    [
      "integracion-electrica-1",
      "Q1094",
      [{ day: "monday", modules: [0, 1, 2] }],
    ],
  ])("%s %s", (subjectId, division, slots) => {
    const entry = scheduleFor(plan, subjectId).find(
      (e) => e.division === division,
    );
    expect(entry?.slots).toEqual(slots);
  });

  it("keeps several divisions per subject and flags the semester one", () => {
    expect(
      scheduleFor(plan, "integracion-electrica-1")
        .map((e) => e.division)
        .sort(),
    ).toEqual(["Q1091", "Q1092", "Q1093", "Q1094"]);
    expect(scheduleFor(plan, "ingenieria-y-sociedad")[0].modality).toBe(
      "semester",
    );
    expect(scheduleFor(plan, "sistemas-de-potencia")[0].shifts).toEqual([
      "morning",
    ]);
  });

  it("has no schedule for subjects the sheet does not cover", () => {
    expect(scheduleFor(plan, "fisica-1")).toEqual([]);
  });
});

describe("slotRuns", () => {
  const plan = loadPlan2023();
  const times = plan.schedule?.moduleTimes;
  const runs = (subjectId: string, division: string, day: string) => {
    const entry = scheduleFor(plan, subjectId).find(
      (e) => e.division === division,
    )!;
    const slot = entry.slots.find((s) => s.day === day)!;
    return slotRuns(entry, slot, times);
  };

  it("converts evening modules into clock times, across the break", () => {
    expect(runs("control-automatico", "Q4051", "monday")).toEqual([
      { modules: "1–5", from: "19:00", to: "23:00" },
    ]);
    expect(runs("integracion-electrica-1", "Q1094", "monday")).toEqual([
      { modules: "0–2", from: "18:15", to: "20:30" },
    ]);
  });

  it("uses the shift of the entry", () => {
    expect(runs("termodinamica", "Q3051", "saturday")).toEqual([
      { modules: "0–2", from: "13:30", to: "15:45" },
    ]);
    expect(runs("sistemas-de-representacion", "Q1091", "saturday")).toEqual([
      { modules: "3–5", from: "10:15", to: "12:30" },
    ]);
  });

  it("does not guess when the sheet is ambiguous", () => {
    // Two shifts (evening + morning) and no way to tell which day is which.
    expect(runs("maquinas-electricas-2", "Q4051", "wednesday")).toEqual([
      { modules: "3–4" },
    ]);
    // Evening shift with Saturday classes.
    expect(runs("sistemas-de-representacion", "Q1093", "saturday")).toEqual([
      { modules: "0–3" },
    ]);
    expect(runs("sistemas-de-representacion", "Q1093", "thursday")).toEqual([
      { modules: "1–3", from: "19:00", to: "21:30" },
    ]);
  });

  it("returns modules only when no time table is available", () => {
    const entry = scheduleFor(plan, "control-automatico")[0];
    expect(slotRuns(entry, entry.slots[0], undefined)).toEqual([
      { modules: "1–5" },
    ]);
  });

  it("knows the venue of the reference timetable", () => {
    expect(plan.schedule?.reference.venue).toBe("Campus");
  });
});
