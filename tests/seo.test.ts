import { describe, expect, it } from "vitest";
import { loadPlan2023 } from "@/data/load";
import { sliceForSubject } from "@/lib/plan-slice";
import { jsonLdScript, subjectJsonLd, subjectMetadata } from "@/lib/seo";
import { absoluteUrl, subjectPath } from "@/lib/site";

const plan = loadPlan2023();
const subject = (id: string) => plan.subjects.find((s) => s.id === id)!;

describe("subjectMetadata", () => {
  it("uses the profile summary when there is one", () => {
    const m = subjectMetadata(subject("control-automatico"));
    expect(m.title).toBe(
      "Control Automático · Ingeniería en Energía Eléctrica · UTN FRBA",
    );
    expect(m.description).toMatch(
      /^Cómo se modelan y se controlan sistemas físicos/,
    );
  });

  it("states only what the plan says when there is no summary", () => {
    const m = subjectMetadata(subject("quimica-general"));
    expect(m.description).toContain("materia 6 de nivel 1");
    expect(m.description).toContain("Plan 2023");
  });

  it("keeps descriptions within 160 characters, cut at a word", () => {
    for (const s of plan.subjects) {
      const { description } = subjectMetadata(s);
      expect(description.length, s.id).toBeLessThanOrEqual(160);
      expect(description, s.id).not.toMatch(/\s…$/);
    }
  });
});

describe("structured data", () => {
  it("describes a Course with only known facts", () => {
    const ld = subjectJsonLd(
      subject("electrotecnia-1"),
      "https://x.test/materias/electrotecnia-1/",
    );
    expect(ld).toMatchObject({
      "@type": "Course",
      name: "Electrotecnia I",
      courseCode: "11",
      inLanguage: "es-AR",
    });
  });

  it("cannot close its own script tag", () => {
    expect(jsonLdScript({ name: "</script><b>" })).not.toContain("</script>");
    expect(JSON.parse(jsonLdScript({ a: "x<y" }))).toEqual({ a: "x<y" });
  });
});

describe("site urls", () => {
  it("builds absolute subject URLs under the site origin and base path", () => {
    expect(subjectPath("fisica-1")).toBe("/materias/fisica-1/");
    expect(absoluteUrl(subjectPath("fisica-1"))).toMatch(
      /^https?:\/\/[^/]+(\/.*)?\/materias\/fisica-1\/$/,
    );
  });
});

describe("sliceForSubject", () => {
  const slice = sliceForSubject(plan, "electrotecnia-2")!;

  it("keeps the subject, its prerequisites and what it unlocks", () => {
    const ids = slice.subjects.map((s) => s.id);
    expect(ids).toContain("electrotecnia-2");
    for (const id of [
      "fisica-2",
      "electrotecnia-1",
      "analisis-matematico-2",
      "control-automatico",
    ]) {
      expect(ids, id).toContain(id);
    }
    expect(ids).not.toContain("quimica-general");
  });

  it("is much smaller than the whole plan", () => {
    expect(JSON.stringify(slice).length).toBeLessThan(
      JSON.stringify(plan).length / 3,
    );
  });

  it("carries the subject's competencies, activities and timetable only", () => {
    const control = sliceForSubject(plan, "control-automatico")!;
    expect(control.competencies.map((c) => c.id)).toEqual([
      "cg-01",
      "cg-02",
      "cg-04",
      "ce-1.1",
      "ce-1.2",
      "ce-1.3",
      "ce-5.1",
      "ce-5.2",
      "ce-5.3",
    ]);
    expect(control.reservedActivities.map((a) => a.id)).toEqual([
      "ar-01",
      "al-01",
    ]);
    expect(
      control.schedule?.entries.every(
        (e) => e.subjectId === "control-automatico",
      ),
    ).toBe(true);
    expect(control.schedule?.moduleTimes).toBeDefined();
  });

  it("keeps the syllabus of the page's own subject only", () => {
    const own = slice.subjects.find((s) => s.id === "electrotecnia-2")!;
    expect(own.syllabus?.objectives.length).toBeGreaterThan(0);
    expect(
      slice.subjects
        .filter((s) => s.id !== "electrotecnia-2")
        .every((s) => s.syllabus === undefined),
    ).toBe(true);
  });

  it("returns null for an unknown subject", () => {
    expect(sliceForSubject(plan, "nope")).toBeNull();
  });
});
