import { describe, expect, it } from "vitest";
import { loadPlan2023 } from "@/data/load";
import { buildGraph, transitiveReduction } from "@/lib/graph";
import {
  COLUMN_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  columnX,
  computeLayout,
} from "@/lib/layout/layout";
import { navigate } from "@/lib/layout/navigation";

const plan = loadPlan2023();
const edges = transitiveReduction(buildGraph(plan));

describe("computeLayout", () => {
  it("is deterministic", async () => {
    expect(await computeLayout(plan, edges)).toEqual(
      await computeLayout(plan, edges),
    );
  });

  it("places every subject in the column of its level", async () => {
    const layout = await computeLayout(plan, edges);
    expect(Object.keys(layout)).toHaveLength(plan.subjects.length);
    for (const s of plan.subjects)
      expect(layout[s.id].x).toBe(columnX(s.level));
    expect(columnX(2) - columnX(1)).toBe(NODE_WIDTH + COLUMN_GAP);
  });

  it("never overlaps nodes and starts at y = 0", async () => {
    const layout = await computeLayout(plan, edges);
    const ys = Object.values(layout).map((p) => p.y);
    expect(Math.min(...ys)).toBe(0);
    for (const s of plan.subjects) {
      for (const o of plan.subjects) {
        if (s.id >= o.id || s.level !== o.level) continue;
        expect(
          Math.abs(layout[s.id].y - layout[o.id].y),
        ).toBeGreaterThanOrEqual(NODE_HEIGHT);
      }
    }
  });
});

describe("navigate", () => {
  it("reaches every subject from the first one using only arrow moves", async () => {
    const layout = await computeLayout(plan, edges);
    const all = edges;
    const seen = new Set<string>();
    const queue = [plan.subjects[0].id];
    while (queue.length > 0) {
      const id = queue.pop() as string;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const dir of [
        "prerequisite",
        "dependent",
        "previous",
        "next",
      ] as const) {
        const next = navigate(all, layout, id, dir);
        if (next) queue.push(next);
      }
    }
    expect(seen.size).toBe(plan.subjects.length);
  });

  it("goes up and down inside a column and stops at the ends", async () => {
    const layout = await computeLayout(plan, edges);
    const column = plan.subjects
      .filter((s) => s.level === 3)
      .map((s) => s.id)
      .sort((a, b) => layout[a].y - layout[b].y);
    expect(navigate(edges, layout, column[0], "previous")).toBeNull();
    expect(navigate(edges, layout, column[0], "next")).toBe(column[1]);
    expect(navigate(edges, layout, column.at(-1)!, "next")).toBeNull();
  });

  it("follows edges to prerequisites and dependents", async () => {
    const layout = await computeLayout(plan, edges);
    expect(navigate(edges, layout, "fisica-2", "prerequisite")).toMatch(
      /^(analisis-matematico-1|fisica-1)$/,
    );
    expect(
      navigate(edges, layout, "analisis-matematico-1", "prerequisite"),
    ).toBeNull();
    expect(navigate(edges, layout, "proyecto-final", "dependent")).toBeNull();
  });
});
