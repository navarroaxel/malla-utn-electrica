import { describe, expect, it } from "vitest";
import { buildGraph } from "@/lib/graph";
import { plan } from "./helpers";

describe("buildGraph", () => {
  it("creates typed edges and adjacency lists", () => {
    const g = buildGraph(
      plan([
        { id: "a" },
        { id: "b", taken: ["a"] },
        { id: "c", taken: ["a"], passed: ["b"] },
      ]),
    );
    expect(g.edges).toEqual([
      { from: "a", to: "b", type: "taken" },
      { from: "a", to: "c", type: "taken" },
      { from: "b", to: "c", type: "passed" },
    ]);
    expect(g.incoming.get("c")).toHaveLength(2);
    expect(g.outgoing.get("a")).toHaveLength(2);
  });

  it("keeps the stronger type when an id is listed as taken and passed", () => {
    const g = buildGraph(
      plan([{ id: "a" }, { id: "b", taken: ["a"], passed: ["a"] }]),
    );
    expect(g.edges).toEqual([{ from: "a", to: "b", type: "passed" }]);
  });

  it("drops unknown ids and self-references instead of crashing", () => {
    const g = buildGraph(plan([{ id: "a", taken: ["a", "zzz"] }]));
    expect(g.edges).toEqual([]);
  });
});
