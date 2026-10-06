import { describe, expect, it } from "vitest";
import { availableSubjects, buildGraph } from "@/lib/graph";
import { plan } from "./helpers";

const g = buildGraph(
  plan([
    { id: "a" },
    { id: "b" },
    { id: "c", taken: ["a"], passed: ["b"] },
    { id: "d", passed: ["a"] },
  ]),
);
const progress = (taken: string[], passed: string[]) => ({
  taken: new Set(taken),
  passed: new Set(passed),
});

describe("availableSubjects", () => {
  it("offers only root subjects to a new student", () => {
    const r = availableSubjects(g, progress([], []));
    expect(r.available).toEqual(["a", "b"]);
    expect(r.blocked).toEqual([
      {
        id: "c",
        missing: [
          { id: "a", requirement: "taken" },
          { id: "b", requirement: "passed" },
        ],
      },
      { id: "d", missing: [{ id: "a", requirement: "passed" }] },
    ]);
  });

  it("lets a taken-only prerequisite unlock 'taken' edges but not 'passed' ones", () => {
    const r = availableSubjects(g, progress(["a", "b"], []));
    expect(r.available).toEqual([]);
    expect(r.blocked.map((b) => b.id)).toEqual(["c", "d"]);
    expect(r.blocked[0].missing).toEqual([{ id: "b", requirement: "passed" }]);
  });

  it("treats passed as taken and hides finished subjects", () => {
    const r = availableSubjects(g, progress(["b"], ["a"]));
    expect(r.available).toEqual(["d"]);
    expect(r.blocked).toEqual([
      { id: "c", missing: [{ id: "b", requirement: "passed" }] },
    ]);
  });

  it("unlocks everything once prerequisites are passed", () => {
    expect(availableSubjects(g, progress([], ["a", "b"])).available).toEqual([
      "c",
      "d",
    ]);
  });
});
