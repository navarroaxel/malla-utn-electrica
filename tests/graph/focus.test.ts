import { describe, expect, it } from "vitest";
import { buildGraph, focusSets } from "@/lib/graph";
import { plan } from "./helpers";

// a → b → c → d, plus x → c and an unrelated z
const g = buildGraph(
  plan([
    { id: "a" },
    { id: "b", taken: ["a"] },
    { id: "x" },
    { id: "c", taken: ["b", "x"] },
    { id: "d", passed: ["c"] },
    { id: "z" },
  ]),
);

describe("focusSets", () => {
  const f = focusSets(g, "c");

  it("relates the subject, its ancestors and its descendants only", () => {
    expect(["a", "b", "x", "c", "d"].every(f.isRelated)).toBe(true);
    expect(f.isRelated("z")).toBe(false);
  });

  it("lights the edges upstream and downstream of the subject", () => {
    expect(g.edges.filter(f.isLit).map((e) => `${e.from}>${e.to}`)).toEqual([
      "a>b",
      "b>c",
      "x>c",
      "c>d",
    ]);
  });

  it("does not light edges of sibling branches", () => {
    const fb = focusSets(g, "b");
    expect(g.edges.filter(fb.isLit).map((e) => `${e.from}>${e.to}`)).toEqual([
      "a>b",
      "b>c",
      "c>d",
    ]);
  });
});
