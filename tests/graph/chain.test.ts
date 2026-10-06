import { describe, expect, it } from "vitest";
import { buildGraph, competencyCoverage, longestChain } from "@/lib/graph";
import { plan } from "./helpers";

describe("longestChain", () => {
  it("finds the critical path", () => {
    const g = buildGraph(
      plan([
        { id: "a" },
        { id: "b", taken: ["a"] },
        { id: "c", taken: ["b"] },
        { id: "x", taken: ["a"] },
        { id: "d", taken: ["c", "x"] },
      ]),
    );
    expect(longestChain(g)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns a single subject when nothing is linked, and [] for an empty plan", () => {
    expect(longestChain(buildGraph(plan([{ id: "a" }, { id: "b" }])))).toEqual([
      "a",
    ]);
    expect(longestChain(buildGraph(plan([])))).toEqual([]);
  });

  it("throws on cycles", () => {
    const g = buildGraph(
      plan([
        { id: "a", taken: ["b"] },
        { id: "b", taken: ["a"] },
      ]),
    );
    expect(() => longestChain(g)).toThrow(/cycle/);
  });
});

describe("competencyCoverage", () => {
  it("lists contributing subjects with their level", () => {
    const p = plan([
      { id: "a", competencies: [{ id: "cg-01", level: "introduces" }] },
      { id: "b" },
      { id: "c", competencies: [{ id: "cg-01", level: "consolidates" }] },
    ]);
    expect(competencyCoverage(p, "cg-01")).toEqual([
      { subjectId: "a", level: "introduces" },
      { subjectId: "c", level: "consolidates" },
    ]);
    expect(competencyCoverage(p, "cg-02")).toEqual([]);
  });
});
