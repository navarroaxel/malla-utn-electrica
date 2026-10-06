"use client";

import { memo } from "react";
import { getSmoothStepPath, type Edge, type EdgeProps } from "@xyflow/react";
import type { Requirement } from "@/lib/graph";

export type EdgeState = "idle" | "lit" | "dim";
export type PrereqFlowEdge = Edge<
  {
    type: Requirement;
    state: EdgeState;
    /** x of the vertical run, in flow coordinates; defaults to the midpoint. */
    laneX?: number;
  },
  "prereq"
>;

function PrereqEdgeView({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<PrereqFlowEdge>) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 6,
    offset: 22,
    centerX: data?.laneX,
  });
  const type = data?.type ?? "taken";
  const state = data?.state ?? "idle";
  return (
    <g>
      <path
        className="prereq-edge"
        data-type={type}
        data-state={state}
        d={path}
      />
      {state === "lit" && <path className="prereq-energize" d={path} />}
    </g>
  );
}

export const PrereqEdge = memo(PrereqEdgeView);
