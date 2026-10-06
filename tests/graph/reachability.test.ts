import { describe, expect, it } from "vitest";
import { ancestors, buildGraph, descendants } from "@/lib/graph";
import { plan } from "./helpers";

// a -(taken)-> b -(passed)-> c -(taken)-> d      a -(passed)-> e -(taken)-> d
const g = buildGraph(
  plan([
    { id: "a" },
    { id: "b", taken: ["a"] },
    { id: "c", passed: ["b"] },
    { id: "e", passed: ["a"] },
    { id: "d", taken: ["c", "e"] },
  ]),
);

describe("ancestors", () => {
  it("returns the transitive prerequisites with the strongest requirement", () => {
    expect(Object.fromEntries(ancestors(g, "d"))).toEqual({
      c: "taken",
      e: "taken",
      b: "passed",
      a: "passed", // a→e is "passed" and e leads to d
    });
  });

  it("is empty for a root subject", () => {
    expect(ancestors(g, "a").size).toBe(0);
  });
});

describe("descendants", () => {
  it("returns everything unlocked with the strongest requirement", () => {
    expect(Object.fromEntries(descendants(g, "a"))).toEqual({
      b: "taken",
      c: "taken",
      e: "passed",
      d: "passed", // via e
    });
  });

  it("is empty for a leaf subject", () => {
    expect(descendants(g, "d").size).toBe(0);
  });

  it("terminates on cyclic data", () => {
    const cyclic = buildGraph(
      plan([
        { id: "a", taken: ["b"] },
        { id: "b", taken: ["a"] },
      ]),
    );
    expect([...descendants(cyclic, "a").keys()]).toEqual(["b"]);
  });
});
