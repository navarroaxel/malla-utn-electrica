import { describe, expect, it } from "vitest";
import { loadPlan2023 } from "@/data/load";
import { parseCsv, toCsv } from "@/lib/review/csv";
import {
  applyReview,
  exportReview,
  type ReviewContext,
} from "@/lib/review/review";

describe("csv", () => {
  it("quotes only when needed and round-trips awkward cells", () => {
    const rows = [
      ["a", 'he said "hi"', "line1\nline2", "x;y, z"],
      ["", "ñandú", "", "ok"],
    ];
    for (const delimiter of [",", ";", "\t"] as const) {
      expect(parseCsv(toCsv(rows, delimiter)).rows).toEqual(rows);
    }
    expect(toCsv([["plain", "two words"]])).toBe("plain,two words\r\n");
  });

  it("detects the delimiter, ignores a BOM and accepts CRLF/LF", () => {
    expect(parseCsv("﻿id;name\r\n1;a\n2;b").rows).toEqual([
      ["id", "name"],
      ["1", "a"],
      ["2", "b"],
    ]);
    expect(parseCsv("id\tname\n1\ta").delimiter).toBe("\t");
  });

  it("skips blank lines", () => {
    expect(parseCsv("a,b\n\n1,2\n\n").rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("review sheet", () => {
  const plan = loadPlan2023();
  const context: ReviewContext = {
    competencyIds: new Set(plan.competencies.map((c) => c.id)),
    activityIds: new Set(plan.reservedActivities.map((a) => a.id)),
  };
  const sheet = () => exportReview(plan.subjects);
  const edit = (id: string, column: string, value: string) => {
    const rows = sheet().map((r) => [...r]);
    const col = rows[0].indexOf(column);
    rows.find((r) => r[0] === id)![col] = value;
    return rows;
  };

  it("exports one row per subject with the editable profile fields", () => {
    const rows = sheet();
    expect(rows[0]).toEqual([
      "id",
      "number",
      "name",
      "summary_es",
      "summary_en",
      "competencies",
      "reserved_activities",
      "status",
      "reviewed_by",
    ]);
    expect(rows).toHaveLength(43); // header + 42 subjects
    const control = rows.find((r) => r[0] === "control-automatico")!;
    expect(control[5]).toBe(
      "cg-01:develops; cg-02:develops; cg-04:develops; ce-1.1; ce-1.2; ce-1.3; ce-5.1; ce-5.2; ce-5.3",
    );
    expect(control[6]).toBe("ar-01; al-01");
    expect(control[7]).toBe("draft");
  });

  it("importing an untouched export changes nothing", () => {
    const result = applyReview(
      plan.subjects,
      parseCsv(toCsv(sheet())).rows,
      context,
    );
    expect(result.errors).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  it("applies corrections from a spreadsheet", () => {
    let rows = edit("estabilidad", "summary_es", "Resumen corregido.");
    rows = rows.map((r) =>
      r[0] === "estabilidad"
        ? r.map((c, i) =>
            i === 5
              ? "cg-01:introduces; cg-06:develops"
              : i === 7
                ? "reviewed"
                : i === 8
                  ? "Cátedra de Estabilidad"
                  : c,
          )
        : r,
    );
    const result = applyReview(plan.subjects, rows, context);
    expect(result.errors).toEqual([]);
    expect(result.changed).toEqual(["estabilidad"]);
    const profile = result.subjects.find(
      (s) => s.id === "estabilidad",
    )!.profile;
    expect(profile).toMatchObject({
      summary: { es: "Resumen corregido." },
      competencies: [
        { id: "cg-01", level: "introduces" },
        { id: "cg-06", level: "develops" },
      ],
      status: "reviewed",
      reviewedBy: "Cátedra de Estabilidad",
    });
  });

  it("clears an English summary and keeps other subjects untouched", () => {
    const result = applyReview(
      plan.subjects,
      edit("fisica-2", "summary_en", ""),
      context,
    );
    expect(result.changed).toEqual(["fisica-2"]);
    expect(
      result.subjects.find((s) => s.id === "fisica-2")!.profile.summary.en,
    ).toBeUndefined();
  });

  it("reports every problem and does not guess", () => {
    expect(
      applyReview(
        plan.subjects,
        edit("fisica-1", "competencies", "cg-99:develops"),
        context,
      ).errors[0],
    ).toMatch(/unknown competency "cg-99"/);
    expect(
      applyReview(
        plan.subjects,
        edit("fisica-1", "competencies", "cg-01:amazing"),
        context,
      ).errors[0],
    ).toMatch(/level "amazing"/);
    expect(
      applyReview(
        plan.subjects,
        edit("fisica-1", "competencies", "cg-01:develops; cg-01:introduces"),
        context,
      ).errors[0],
    ).toMatch(/listed twice/);
    expect(
      applyReview(
        plan.subjects,
        edit("fisica-1", "reserved_activities", "ar-77"),
        context,
      ).errors[0],
    ).toMatch(/unknown reserved activity/);
    expect(
      applyReview(plan.subjects, edit("fisica-1", "status", "done"), context)
        .errors[0],
    ).toMatch(/draft or reviewed/);
    expect(
      applyReview(
        plan.subjects,
        edit("fisica-1", "status", "reviewed"),
        context,
      ).errors[0],
    ).toMatch(/needs reviewed_by/);
    expect(
      applyReview(
        plan.subjects,
        [...sheet(), ["nope", "", "", "", "", "", "", "", ""]],
        context,
      ).errors[0],
    ).toMatch(/unknown subject id "nope"/);
    expect(
      applyReview(plan.subjects, [...sheet(), sheet()[1]], context).errors[0],
    ).toMatch(/more than once/);
    expect(
      applyReview(plan.subjects, [["name"], ["x"]], context).errors[0],
    ).toMatch(/no "id" column/);
  });

  it("only touches the columns present in the sheet", () => {
    const rows = [
      ["id", "summary_es"],
      ["control-automatico", "Solo cambia el resumen."],
    ];
    const result = applyReview(plan.subjects, rows, context);
    expect(result.errors).toEqual([]);
    const profile = result.subjects.find(
      (s) => s.id === "control-automatico",
    )!.profile;
    expect(profile.summary.es).toBe("Solo cambia el resumen.");
    expect(profile.competencies).toHaveLength(9);
    expect(profile.reservedActivities).toEqual(["ar-01", "al-01"]);
  });

  it("accepts a competency without a level and keeps it that way", () => {
    const rows = edit(
      "estabilidad",
      "competencies",
      "cg-01:introduces; ce-1.1; ce-1.2",
    );
    const result = applyReview(plan.subjects, rows, context);
    expect(result.errors).toEqual([]);
    expect(
      result.subjects.find((s) => s.id === "estabilidad")!.profile.competencies,
    ).toEqual([
      { id: "cg-01", level: "introduces" },
      { id: "ce-1.1" },
      { id: "ce-1.2" },
    ]);
  });

  it("still rejects a level that is written but not valid", () => {
    expect(
      applyReview(
        plan.subjects,
        edit("estabilidad", "competencies", "ce-1.1:"),
        context,
      ).errors[0],
    ).toMatch(/must be one of/);
  });
});
