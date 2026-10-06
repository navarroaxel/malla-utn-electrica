import ELK from "elkjs/lib/elk.bundled.js";
import type { Plan } from "@/data/schema";
import type { Edge } from "@/lib/graph";
import {
  COLUMN_GAP,
  ELECTIVE_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  ROW_GAP,
  columnX,
  type Layout,
} from "./geometry";

// Server-side only: re-exported so existing imports keep working in tests and scripts.
export * from "./geometry";

/**
 * Deterministic layout: one column per level (fixed x), vertical order chosen by ELK to
 * minimise edge crossings. Only edges that go to a later level take part in the ELK run;
 * same-level edges are drawn between nodes of one column afterwards.
 */
export async function computeLayout(
  plan: Pick<Plan, "subjects">,
  edges: readonly Edge[],
): Promise<Layout> {
  const levelOf = new Map(plan.subjects.map((s) => [s.id, s.level]));
  const crossLevel = edges.filter(
    (e) => (levelOf.get(e.from) ?? 0) < (levelOf.get(e.to) ?? 0),
  );

  const elk = new ELK();
  const result = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.partitioning.activate": "true",
      "elk.randomSeed": "1",
      "elk.layered.spacing.nodeNodeBetweenLayers": String(COLUMN_GAP),
      "elk.spacing.nodeNode": String(ROW_GAP),
    },
    children: plan.subjects.map((s) => ({
      id: s.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      layoutOptions: { "elk.partitioning.partition": String(s.level) },
    })),
    edges: crossLevel.map((e) => ({
      id: `${e.from}>${e.to}`,
      sources: [e.from],
      targets: [e.to],
    })),
  });

  const elkY = new Map((result.children ?? []).map((c) => [c.id, c.y ?? 0]));
  const numberOf = new Map(plan.subjects.map((s) => [s.id, s.number]));

  // Keep ELK's order inside each column, but stack columns densely and centre them
  // vertically: ELK's own spacing leaves the map too tall to read at a glance.
  const levels = [...new Set(plan.subjects.map((s) => s.level))].sort(
    (a, b) => a - b,
  );
  const sortColumn = (ids: string[]) =>
    ids.sort(
      (a, b) =>
        (elkY.get(a) ?? 0) - (elkY.get(b) ?? 0) ||
        (numberOf.get(a) ?? 0) - (numberOf.get(b) ?? 0),
    );
  const idsOf = (level: number, elective: boolean) =>
    sortColumn(
      plan.subjects
        .filter((s) => s.level === level && s.isElective === elective)
        .map((s) => s.id),
    );
  const columns = levels.map((level) => idsOf(level, false));
  const electives = levels.map((level) => idsOf(level, true));
  const height = (count: number) =>
    count === 0 ? 0 : count * NODE_HEIGHT + (count - 1) * ROW_GAP;
  const tallest = Math.max(...columns.map((c) => height(c.length)));

  const layout: Layout = {};
  columns.forEach((column, i) => {
    const offset = (tallest - height(column.length)) / 2;
    column.forEach((id, row) => {
      layout[id] = {
        x: columnX(levels[i]),
        y: Math.round(offset + row * (NODE_HEIGHT + ROW_GAP)),
      };
    });
  });
  // Electives sit right under the last core subject of their level's column.
  electives.forEach((column, i) => {
    const top =
      (tallest - height(columns[i].length)) / 2 +
      height(columns[i].length) +
      ELECTIVE_GAP;
    column.forEach((id, row) => {
      layout[id] = {
        x: columnX(levels[i]),
        y: Math.round(top + row * (NODE_HEIGHT + ROW_GAP)),
      };
    });
  });
  return layout;
}
