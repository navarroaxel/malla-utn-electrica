import { describe, expect, it } from "vitest";
import { buildGraph, transitiveReduction } from "@/lib/graph";
import { plan } from "./helpers";

const pairs = (p: Parameters<typeof plan>[0]) =>
  transitiveReduction(buildGraph(plan(p))).map((e) => `${e.from}>${e.to}`);

describe("transitiveReduction", () => {
  it("removes edges implied by a longer path", () => {
    expect(
      pairs([
        { id: "a" },
        { id: "b", taken: ["a"] },
        { id: "c", taken: ["a", "b"] },
      ]),
    ).toEqual(["a>b", "b>c"]);
  });

  it("keeps a passed edge when the path only guarantees taken", () => {
    // enrolling in b needs a only "taken"; c needs a "passed" → not redundant
    expect(
      pairs([
        { id: "a" },
        { id: "b", taken: ["a"] },
        { id: "c", taken: ["b"], passed: ["a"] },
      ]),
    ).toEqual(["a>b", "b>c", "a>c"]);
  });

  it("drops a taken edge when the path guarantees passed", () => {
    expect(
      pairs([
        { id: "a" },
        { id: "b", passed: ["a"] },
        { id: "c", taken: ["a", "b"] },
      ]),
    ).toEqual(["a>b", "b>c"]);
  });

  it("leaves diamonds intact", () => {
    expect(
      pairs([
        { id: "a" },
        { id: "b", taken: ["a"] },
        { id: "c", taken: ["a"] },
        { id: "d", taken: ["b", "c"] },
      ]),
    ).toEqual(["a>b", "a>c", "b>d", "c>d"]);
  });
});
