import { describe, expect, it } from "vitest";
import { assemblePlan, loadPlan2023 } from "@/data/load";
import plan2023 from "@/data/plans/plan-2023.json";
import competencies from "@/data/competencies.json";
import reservedActivities from "@/data/reserved-activities.json";

describe("loadPlan2023", () => {
  it("loads the 41 subjects of Ord. 1874 across five levels", () => {
    const plan = loadPlan2023();
    expect(plan.subjects.map((s) => s.number)).toEqual(
      Array.from({ length: 41 }, (_, i) => i + 1),
    );
    const perLevel = [1, 2, 3, 4, 5].map(
      (l) => plan.subjects.filter((s) => s.level === l).length,
    );
    expect(perLevel).toEqual([8, 9, 9, 9, 6]);
  });

  it("marks every seeded profile as draft", () => {
    expect(
      loadPlan2023().subjects.every((s) => s.profile.status === "draft"),
    ).toBe(true);
  });
});

describe("assemblePlan", () => {
  it("reports the path and reason of invalid data", () => {
    const bad = structuredClone(plan2023);
    bad.subjects[0].level = 9;
    expect(() => assemblePlan(bad, competencies, reservedActivities)).toThrow(
      /subjects[\s\S]*level/,
    );
  });

  it("rejects non-kebab-case ids", () => {
    const bad = structuredClone(plan2023);
    bad.subjects[0].id = "Not A Slug";
    expect(() => assemblePlan(bad, competencies, reservedActivities)).toThrow(
      /kebab-case/,
    );
  });
});

describe("assemblePlan graph validation", () => {
  it("fails on an unknown prerequisite", () => {
    const bad = structuredClone(plan2023);
    bad.subjects[0].prerequisites.taken = ["does-not-exist"];
    expect(() => assemblePlan(bad, competencies, reservedActivities)).toThrow(
      /unknown-prerequisite/,
    );
  });
});

// Regression fixture: Ord. 1874, Anexo I, as "number: cursadas / aprobadas".
const ORDINANCE_1874: Record<number, [number[], number[]]> = {
  9: [[1, 5], []],
  10: [[1, 2], []],
  11: [[1, 2, 5], []],
  12: [[1, 2, 5], []],
  13: [[1, 5], []],
  14: [[1, 5, 7], []],
  16: [[1, 2], []],
  17: [[1, 2, 5, 8], []],
  18: [
    [6, 9],
    [1, 5],
  ],
  19: [
    [10, 11],
    [1, 2, 5],
  ],
  20: [
    [9, 16],
    [1, 2, 5],
  ],
  21: [
    [9, 16],
    [1, 2, 5],
  ],
  22: [
    [9, 11, 16, 17],
    [1, 5],
  ],
  23: [
    [9, 11, 16],
    [1, 2, 5],
  ],
  24: [
    [9, 16],
    [1, 2, 5],
  ],
  25: [
    [16, 17],
    [1, 2],
  ],
  26: [
    [9, 11, 16, 17],
    [1, 5],
  ],
  27: [[], [15]],
  28: [[], [3]],
  29: [[11], [1, 5]],
  30: [
    [18, 19, 20, 22, 23],
    [6, 9, 10, 11, 15, 16],
  ],
  31: [
    [6, 11, 18, 20],
    [1, 2, 5, 9, 16],
  ],
  32: [
    [18, 22, 23],
    [6, 9, 11, 14, 15, 16],
  ],
  33: [
    [23, 25],
    [11, 16],
  ],
  34: [
    [12, 13, 24],
    [9, 16],
  ],
  35: [[], [3]],
  36: [
    [23, 29],
    [11, 26],
  ],
  37: [
    [21, 30, 34],
    [12, 13, 18, 22, 23, 24],
  ],
  38: [
    [30, 33],
    [18, 22, 23, 26],
  ],
  39: [
    [29, 30, 33],
    [11, 18, 22, 23, 25, 26],
  ],
  40: [[28, 35], [26]],
  41: [
    [28, 30, 32, 33],
    [18, 19, 22, 23, 25, 26, 27],
  ],
};

describe("Plan 2023 prerequisites", () => {
  const plan = loadPlan2023();
  const idOf = (n: number) => plan.subjects.find((s) => s.number === n)!.id;

  it("matches the ordinance table", () => {
    for (const subject of plan.subjects) {
      const [taken, passed] = ORDINANCE_1874[subject.number] ?? [[], []];
      expect(subject.prerequisites, `subject ${subject.number}`).toEqual({
        taken: taken.map(idOf),
        passed: passed.map(idOf),
      });
    }
  });

  it("records the special conditions", () => {
    expect(plan.subjects.find((s) => s.number === 41)?.specialRule?.es).toMatch(
      /aprobar todas las asignaturas previas/,
    );
    expect(plan.subjects.find((s) => s.number === 26)?.specialRule?.es).toMatch(
      /Máquinas Eléctricas I/,
    );
    expect(plan.supplementaryRequirements.map((r) => r.id)).toEqual(["pps"]);
  });

  it("cites a source for every subject", () => {
    expect(plan.subjects.every((s) => s.sources.length > 0)).toBe(true);
  });
});

describe("graduate profile reference data (Ord. C.S. 1873)", () => {
  const plan = loadPlan2023();

  it("has the 10 generic competencies and the 18 official specific ones", () => {
    const generic = plan.competencies.filter((c) => c.kind === "generic");
    const specific = plan.competencies.filter((c) => c.kind === "specific");
    expect(generic.map((c) => c.id)).toEqual(
      Array.from(
        { length: 10 },
        (_, i) => `cg-${String(i + 1).padStart(2, "0")}`,
      ),
    );
    expect(generic.filter((c) => c.group === "technological")).toHaveLength(5);
    expect(specific.map((c) => c.id)).toEqual([
      "ce-1.1",
      "ce-1.2",
      "ce-1.3",
      "ce-2.1",
      "ce-2.2",
      "ce-3.1",
      "ce-3.2",
      "ce-4.1",
      "ce-4.2",
      "ce-5.1",
      "ce-5.2",
      "ce-5.3",
      "ce-6.1",
      "ce-6.2",
      "ce-7.1",
      "ce-8.1",
      "ce-9.1",
      "ce-10.1",
    ]);
  });

  it("has the 4 reserved activities and the 6 other scopes", () => {
    expect(plan.reservedActivities.map((a) => [a.id, a.kind])).toEqual([
      ["ar-01", "reserved"],
      ["ar-02", "reserved"],
      ["ar-03", "reserved"],
      ["ar-04", "reserved"],
      ["al-01", "other"],
      ["al-02", "other"],
      ["al-03", "other"],
      ["al-04", "other"],
      ["al-05", "other"],
      ["al-06", "other"],
    ]);
  });

  it("links every specific competency to its scope, by the table of §5.2", () => {
    const scope = Object.fromEntries(
      plan.competencies
        .filter((c) => c.kind === "specific")
        .map((c) => [c.id, c.reservedActivityId]),
    );
    expect(scope).toMatchObject({
      "ce-1.1": "ar-01",
      "ce-1.3": "ar-01",
      "ce-2.2": "ar-02",
      "ce-3.1": "ar-03",
      "ce-4.2": "ar-04",
      "ce-5.3": "al-01",
      "ce-6.1": "al-02",
      "ce-7.1": "al-03",
      "ce-8.1": "al-04",
      "ce-9.1": "al-05",
      "ce-10.1": "al-06",
    });
  });

  it("cites a source for every competency and scope", () => {
    expect(
      [...plan.competencies, ...plan.reservedActivities].every(
        (x) => x.source.length > 0,
      ),
    ).toBe(true);
  });

  it("rejects a competency pointing to an unknown scope", () => {
    const bad = structuredClone(competencies);
    bad[bad.length - 1].reservedActivityId = "ar-99";
    expect(() => assemblePlan(plan2023, bad, reservedActivities)).toThrow(
      /ar-99/,
    );
  });
});

// Regression fixture: [hours per week, clock hours, block, specific competencies] per subject, from
// the study plan (§7), the block table (§6.2.2) and the programas sintéticos (§8) of Ord. 1873.
// The competency lists were checked against the matrix of §6.4 (pages 30-31) by eye.
const ORDINANCE_1873: Record<number, [number | null, number, string, string]> =
  {
    1: [5, 120, "basic-sciences", ""],
    2: [5, 120, "basic-sciences", ""],
    3: [2, 48, "complementary", ""],
    4: [3, 72, "basic-sciences", "1.1, 1.2, 1.3"],
    5: [5, 120, "basic-sciences", ""],
    6: [5, 120, "basic-sciences", ""],
    7: [3, 72, "basic-technologies", "1.3, 2.2"],
    8: [2, 48, "basic-sciences", "1.1, 9.1"],
    9: [5, 120, "basic-sciences", ""],
    10: [3, 72, "basic-sciences", ""],
    11: [6, 144, "basic-technologies", "1.1, 1.2, 1.3, 4.1"],
    12: [4, 96, "basic-technologies", "1.1, 1.2"],
    13: [2, 48, "basic-technologies", "1.1, 1.2, 1.3"],
    14: [3, 72, "basic-technologies", "1.3, 4.1"],
    15: [2, 48, "complementary", ""],
    16: [5, 120, "basic-sciences", ""],
    17: [2, 48, "basic-sciences", "1.1, 1.2, 1.3, 7.1, 9.1"],
    18: [3, 72, "basic-technologies", "1.2, 1.3, 3.1, 3.2, 5.1, 5.2, 5.3"],
    19: [
      6,
      144,
      "basic-technologies",
      "1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 6.1, 6.2",
    ],
    20: [3, 72, "applied-technologies", "1.1, 1.2, 1.3"],
    21: [2, 48, "basic-sciences", "1.1, 1.2"],
    22: [6, 144, "basic-technologies", "1.1, 1.2, 1.3"],
    23: [4, 96, "basic-technologies", "1.1, 1.2, 5.1, 5.2, 5.3"],
    24: [3, 72, "basic-technologies", "1.1, 1.2, 1.3"],
    25: [3, 72, "basic-technologies", "1.1, 1.2, 1.3, 9.1"],
    26: [null, 50, "complementary", "1.1, 1.2, 1.3"],
    27: [2, 48, "complementary", ""],
    28: [3, 72, "complementary", ""],
    29: [4, 96, "basic-technologies", "1.1, 1.2, 5.1, 5.2, 5.3"],
    30: [6, 144, "applied-technologies", "1.1, 1.2, 1.3"],
    31: [2, 48, "complementary", "1.1, 1.2, 1.3, 4.1, 4.2"],
    32: [
      6,
      144,
      "applied-technologies",
      "1.1, 1.2, 1.3, 2.1, 3.1, 3.2, 4.2, 7.1, 8.1, 10.1",
    ],
    33: [5, 120, "applied-technologies", "1.1, 1.2, 1.3, 5.1, 5.2, 5.3"],
    34: [3, 72, "applied-technologies", "1.2, 2.2"],
    35: [2, 48, "complementary", ""],
    36: [3, 72, "applied-technologies", "1.1, 1.2, 1.3, 5.1, 5.2, 5.3"],
    37: [
      6,
      144,
      "applied-technologies",
      "1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 7.1, 8.1, 9.1, 10.1",
    ],
    38: [
      4,
      96,
      "applied-technologies",
      "1.1, 1.2, 1.3, 2.1, 6.2, 7.1, 8.1, 9.1, 10.1",
    ],
    39: [
      4,
      96,
      "applied-technologies",
      "1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 6.1, 6.2, 9.1",
    ],
    40: [2, 48, "complementary", "2.1, 2.2, 3.2, 4.2, 6.1, 6.2, 7.1, 10.1"],
    41: [3, 72, "applied-technologies", "1.1, 1.2, 1.3, 4.1, 4.2, 10.1"],
  };

describe("Plan 2023 data from Ord. C.S. 1873", () => {
  const plan = loadPlan2023();
  const bySubject = (n: number) => plan.subjects.find((s) => s.number === n)!;

  it("matches hours, block and specific competencies for all 41 subjects", () => {
    for (const subject of plan.subjects) {
      const [weekly, total, block, ces] = ORDINANCE_1873[subject.number];
      expect(subject.hoursPerWeek, `hours/week of ${subject.number}`).toBe(
        weekly,
      );
      expect(subject.totalHours, `total hours of ${subject.number}`).toBe(
        total,
      );
      expect(subject.block, `block of ${subject.number}`).toBe(block);
      const official = subject.profile.competencies
        .filter((c) => c.id.startsWith("ce-"))
        .map((c) => c.id.slice(3));
      expect(official, `competencies of ${subject.number}`).toEqual(
        ces ? ces.split(", ") : [],
      );
    }
  });

  it("adds up to the totals printed in the ordinance", () => {
    const sum = (
      f: (s: (typeof plan.subjects)[number]) => number | null,
      level: number,
    ) =>
      plan.subjects
        .filter((s) => s.level === level)
        .reduce((acc, s) => acc + (f(s) ?? 0), 0);
    // §7 level totals (level III has no weekly hours for the Taller; level V excludes the electives).
    expect([1, 2, 3, 4].map((l) => sum((s) => s.hoursPerWeek, l))).toEqual([
      30, 32, 30, 33,
    ]);
    expect([1, 2, 3, 4].map((l) => sum((s) => s.totalHours, l))).toEqual([
      720, 768, 770, 792,
    ]);
    const block = (b: string) =>
      plan.subjects
        .filter((s) => s.block === b)
        .reduce((a, s) => a + (s.totalHours ?? 0), 0);
    // §6.2.2 "Total Bloque".
    expect([
      block("basic-sciences"),
      block("basic-technologies"),
      block("applied-technologies"),
      block("complementary"),
    ]).toEqual([1008, 1128, 1032, 410]);
  });

  it("flags only the three integrative subjects (marked (Int) in §7)", () => {
    expect(
      plan.subjects.filter((s) => s.isIntegrative).map((s) => s.number),
    ).toEqual([7, 14, 41]);
  });

  it("derives the scopes of a subject from its specific competencies, reserved activities first", () => {
    expect(bySubject(33).profile.reservedActivities).toEqual([
      "ar-01",
      "al-01",
    ]); // CE1.x, CE5.x
    expect(bySubject(41).profile.reservedActivities).toEqual([
      "ar-01",
      "ar-04",
      "al-06",
    ]); // CE1.x, CE4.x, CE10.1
    expect(bySubject(11).profile.reservedActivities).toEqual([
      "ar-01",
      "ar-04",
    ]);
    expect(bySubject(1).profile.reservedActivities).toEqual([]);
  });

  it("carries the syllabus of every subject", () => {
    for (const s of plan.subjects) {
      expect(
        s.syllabus?.objectives.length,
        `objectives of ${s.number}`,
      ).toBeGreaterThan(0);
      expect(
        s.syllabus?.contents.length,
        `contents of ${s.number}`,
      ).toBeGreaterThan(0);
      expect(
        s.sources.some((x) => x.includes("1873.pdf")),
        `source of ${s.number}`,
      ).toBe(true);
    }
    expect(bySubject(11).syllabus?.contents).toContain("Transformador.");
  });

  it("does not leak the end of the document into the last syllabus", () => {
    const last = bySubject(41).syllabus!.contents.join(" ");
    expect(last).not.toMatch(
      /EVALUACI[ÓO]N Y ACTUALIZACI|Firmado digitalmente/,
    );
  });

  it("records where the ordinance disagrees with itself, and which figure was used", () => {
    expect(bySubject(4).hoursPerWeek).toBe(3);
    expect(bySubject(4).sources.join(" ")).toMatch(/2 h\/week and 48 h/);
    expect(bySubject(27).level).toBe(4);
    expect(bySubject(27).sources.join(" ")).toMatch(/nivel 3/);
  });

  it("leaves the term empty: regional faculties decide it (§7), not the ordinance", () => {
    expect(plan.subjects.every((s) => s.term === null)).toBe(true);
  });
});

describe("drafted summaries", () => {
  const withSummary = loadPlan2023().subjects.filter(
    (s) => s.profile.summary.es !== "",
  );

  it("exist for the subjects whose professor's program was provided", () => {
    expect(withSummary.map((s) => s.number)).toEqual([7, 8, 9, 11, 20, 33]);
  });

  it("stay drafts, in both languages, citing that program", () => {
    for (const s of withSummary) {
      expect(s.profile.status).toBe("draft");
      expect(s.profile.summary.en?.length ?? 0).toBeGreaterThan(0);
      expect(
        s.sources.some((src) => /programa/i.test(src) && !src.includes("1873")),
      ).toBe(true);
    }
  });

  it("keep their drafted generic competencies, with levels, next to the official ones", () => {
    const control = withSummary.find((s) => s.number === 33)!;
    expect(control.profile.competencies.slice(0, 3)).toEqual([
      { id: "cg-01", level: "develops" },
      { id: "cg-02", level: "develops" },
      { id: "cg-04", level: "develops" },
    ]);
    expect(
      control.profile.competencies
        .slice(3)
        .every((c) => c.id.startsWith("ce-") && c.level === undefined),
    ).toBe(true);
  });
});
