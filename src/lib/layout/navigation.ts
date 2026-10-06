import type { Edge } from "@/lib/graph";
import type { Layout } from "./geometry";

export type Direction = "prerequisite" | "dependent" | "previous" | "next";

/**
 * Where keyboard navigation goes from `id`: along an edge (to the nearest prerequisite or
 * dependent, vertically) or up/down inside the same column. `null` when there is nowhere to go.
 */
export function navigate(
  edges: readonly Edge[],
  layout: Layout,
  id: string,
  direction: Direction,
): string | null {
  const here = layout[id];
  if (!here) return null;

  if (direction === "prerequisite" || direction === "dependent") {
    const candidates = edges
      .filter((e) =>
        direction === "prerequisite" ? e.to === id : e.from === id,
      )
      .map((e) => (direction === "prerequisite" ? e.from : e.to))
      .filter((other) => layout[other]);
    return nearest(candidates, layout, here.y);
  }

  const column = Object.keys(layout)
    .filter((other) => layout[other].x === here.x)
    .sort((a, b) => layout[a].y - layout[b].y || a.localeCompare(b));
  const index = column.indexOf(id);
  return column[direction === "previous" ? index - 1 : index + 1] ?? null;
}

function nearest(ids: string[], layout: Layout, y: number): string | null {
  let best: string | null = null;
  for (const id of [...ids].sort()) {
    if (
      best === null ||
      Math.abs(layout[id].y - y) < Math.abs(layout[best].y - y)
    )
      best = id;
  }
  return best;
}
