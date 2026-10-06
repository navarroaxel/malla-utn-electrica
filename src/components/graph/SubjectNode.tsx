"use client";

import { memo, type KeyboardEvent } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Subject } from "@/data/schema";
import type { Contribution } from "@/lib/graph/coverage";
import { LEVEL_GLYPH } from "@/lib/profile";
import type { DisplayStatus } from "@/lib/progress/view";
import type { Direction } from "@/lib/layout/navigation";

export type NodeState = "idle" | "focus" | "related" | "dim";

export type SubjectNodeData = {
  subject: Subject;
  label: string;
  ariaLabel: string;
  integrativeTitle: string;
  state: NodeState;
  /** Competency lens: contribution level, "none" when it does not contribute, null when off. */
  lens: Contribution | "none" | null;
  lensTitle: string;
  /** "Mi progreso": how the student stands with this subject, null when the feature is off. */
  progress: DisplayStatus | null;
  progressTag: string;
  /** Tooltip for blocked subjects: what is still missing. */
  progressTitle: string;
  onSelect: (id: string) => void;
  onNavigate: (id: string, direction: Direction | "escape") => void;
  onFocusNode: (id: string) => void;
};
export type SubjectFlowNode = Node<SubjectNodeData, "subject">;

const KEY_DIRECTION: Record<string, Direction | "escape"> = {
  ArrowLeft: "prerequisite",
  ArrowRight: "dependent",
  ArrowUp: "previous",
  ArrowDown: "next",
  Escape: "escape",
};

const STATE_CLASS: Record<NodeState, string> = {
  idle: "",
  related: "border-2",
  focus: "border-2 shadow-[0_0_0_3px_var(--energy)]",
  dim: "opacity-30",
};

const LENS_FILL: Record<Contribution, string> = {
  contributes: "#cfdff0",
  introduces: "#e8eef5",
  develops: "#b9cbe0",
  consolidates: "#7f9fc4",
};

const PROGRESS_FILL: Partial<Record<DisplayStatus, string>> = {
  passed: "#e3f1e3",
  taken: "#fbefd2",
};

const hiddenHandle = { opacity: 0, pointerEvents: "none" } as const;

function SubjectNodeView({ data }: NodeProps<SubjectFlowNode>) {
  const { subject, state, lens } = data;
  const lensLevel = lens && lens !== "none" ? lens : null;
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const direction = KEY_DIRECTION[event.key];
    if (!direction) return;
    event.preventDefault();
    data.onNavigate(subject.id, direction);
  };

  return (
    <>
      <Handle
        type="target"
        id="in"
        position={Position.Left}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        type="target"
        id="in-side"
        position={Position.Right}
        isConnectable={false}
        style={hiddenHandle}
      />
      <Handle
        type="source"
        id="out"
        position={Position.Right}
        isConnectable={false}
        style={hiddenHandle}
      />
      <button
        id={`subject-${subject.id}`}
        type="button"
        aria-label={data.ariaLabel}
        aria-pressed={state === "focus"}
        title={data.progressTitle || undefined}
        data-block={subject.block ?? "unknown"}
        onClick={() => data.onSelect(subject.id)}
        onKeyDown={onKeyDown}
        onFocus={() => data.onFocusNode(subject.id)}
        className={`relative flex h-16 w-[210px] items-center gap-2 border border-[var(--ink)] bg-white pr-3 pl-0 text-left text-[13px] leading-tight transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--energy)] ${
          subject.isIntegrative
            ? "rounded-full outline outline-1 outline-offset-[3px] outline-[var(--ink)]"
            : "rounded-none"
        } ${STATE_CLASS[state]} ${
          data.progress === "blocked"
            ? `border-dashed ${state === "dim" ? "" : "opacity-60"}`
            : ""
        }`}
        style={
          lensLevel
            ? { backgroundColor: LENS_FILL[lensLevel] }
            : data.progress && PROGRESS_FILL[data.progress]
              ? { backgroundColor: PROGRESS_FILL[data.progress] }
              : undefined
        }
      >
        <span
          aria-hidden
          className="ml-0 flex h-full w-9 shrink-0 items-center justify-center border-r border-[var(--ink)] font-mono text-xs font-semibold text-white"
          style={{
            background: `var(--block-${subject.block ?? "unknown"})`,
            borderRadius: subject.isIntegrative ? "9999px 0 0 9999px" : 0,
          }}
        >
          {subject.number}
        </span>
        {data.progressTag && (
          <span
            aria-hidden
            className="absolute -top-2.5 right-3 border border-[var(--ink)] bg-white px-1 font-mono text-[10px] leading-4 uppercase"
          >
            {data.progressTag}
          </span>
        )}
        <span className="line-clamp-3 min-w-0 flex-1">{data.label}</span>
        {lensLevel && (
          <span
            aria-hidden
            title={data.lensTitle}
            className="text-base leading-none"
          >
            {LEVEL_GLYPH[lensLevel]}
          </span>
        )}
        {subject.isIntegrative && (
          <span
            aria-hidden
            title={data.integrativeTitle}
            className="text-base leading-none"
          >
            ◎
          </span>
        )}
      </button>
    </>
  );
}

export const SubjectNode = memo(SubjectNodeView);

export type LevelLabelNode = Node<{ label: string }, "levelLabel">;

export const LevelLabel = memo(function LevelLabelView({
  data,
}: NodeProps<LevelLabelNode>) {
  return (
    <div className="w-[210px] border-b-2 border-[var(--ink)] pb-1 font-mono text-xs tracking-widest text-[var(--ink-soft)] uppercase">
      {data.label}
    </div>
  );
});
