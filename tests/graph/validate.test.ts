import { describe, expect, it } from "vitest";
import { assertValidPlan, validatePlan } from "@/lib/graph";
import { loadPlan2023 } from "@/data/load";
import { plan } from "./helpers";

const codes = (p: Parameters<typeof validatePlan>[0]) =>
  validatePlan(p).map((e) => e.code);

describe("validatePlan", () => {
  it("accepts a consistent plan", () => {
    expect(
      codes(plan([{ id: "a" }, { id: "b", level: 2, taken: ["a"] }])),
    ).toEqual([]);
  });

  it("accepts the Plan 2023 seed", () => {
    expect(validatePlan(loadPlan2023())).toEqual([]);
  });

  it("flags unknown prerequisite ids", () => {
    expect(codes(plan([{ id: "a", taken: ["nope"] }]))).toEqual([
      "unknown-prerequisite",
    ]);
  });

  it("flags self-references", () => {
    expect(codes(plan([{ id: "a", passed: ["a"] }]))).toEqual([
      "self-reference",
    ]);
  });

  it("flags prerequisites from a higher level", () => {
    expect(
      codes(
        plan([
          { id: "a", level: 1, taken: ["b"] },
          { id: "b", level: 2 },
        ]),
      ),
    ).toEqual(["level-inversion"]);
  });

  it("flags cycles and shows the path", () => {
    const errors = validatePlan(
      plan([
        { id: "a", taken: ["c"] },
        { id: "b", taken: ["a"] },
        { id: "c", taken: ["b"] },
      ]),
    );
    expect(errors.map((e) => e.code)).toEqual(["cycle"]);
    expect(errors[0].message).toContain("a -> c -> b -> a");
  });

  it("flags duplicate numbers and ids", () => {
    expect(
      codes(
        plan([
          { id: "a", number: 1 },
          { id: "b", number: 1 },
        ]),
      ),
    ).toEqual(["duplicate-number"]);
    expect(
      codes(
        plan([
          { id: "a", number: 1 },
          { id: "a", number: 2 },
        ]),
      ),
    ).toEqual(["duplicate-id"]);
  });

  it("flags unknown competency and activity ids", () => {
    const p = plan([
      {
        id: "a",
        competencies: [
          { id: "cg-01", level: "introduces" },
          { id: "cg-99", level: "develops" },
        ],
        activities: ["ar-01", "ar-99"],
      },
    ]);
    expect(codes(p)).toEqual(["unknown-competency", "unknown-activity"]);
  });

  it("assertValidPlan throws one readable message", () => {
    expect(() => assertValidPlan(plan([{ id: "a", taken: ["nope"] }]))).toThrow(
      /\[unknown-prerequisite\].*nope/,
    );
  });
});
