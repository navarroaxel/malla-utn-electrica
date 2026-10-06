"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge as FlowEdge,
} from "@xyflow/react";
import type { Plan } from "@/data/schema";
import { localize } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { focusSets, type Graph } from "@/lib/graph";
import { LEVEL_GLYPH, type Lens } from "@/lib/profile";
import { displayStatus, type ProgressView } from "@/lib/progress/view";
import type { Edge } from "@/lib/graph";
import {
  COLUMN_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  columnX,
  type Layout,
} from "@/lib/layout/geometry";
import { navigate, type Direction } from "@/lib/layout/navigation";
import { PrereqEdge, type PrereqFlowEdge } from "./PrereqEdge";
import {
  LevelLabel,
  SubjectNode,
  type LevelLabelNode,
  type NodeState,
  type SubjectFlowNode,
} from "./SubjectNode";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
const LEVEL_LABEL_Y = -44;

const nodeTypes = { subject: SubjectNode, levelLabel: LevelLabel };
const edgeTypes = { prereq: PrereqEdge };

interface Props {
  plan: Plan;
  graph: Graph;
  /** Edges to draw (reduced by default, all when the toggle is on). */
  edges: readonly Edge[];
  layout: Layout;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  lens: Lens | null;
  /** "Mi progreso" view, null when the feature is off. */
  progress: ProgressView | null;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Canvas({
  plan,
  graph,
  edges,
  layout,
  selectedId,
  onSelect,
  lens,
  progress,
}: Props) {
  const { locale, dict } = useI18n();
  const flow = useReactFlow();
  const wrapper = useRef<HTMLDivElement>(null);

  const names = useMemo(
    () => new Map(plan.subjects.map((s) => [s.id, localize(s.name, locale)])),
    [plan, locale],
  );

  const focus = useMemo(
    () => (selectedId ? focusSets(graph, selectedId) : null),
    [graph, selectedId],
  );

  // Keep the focused node on screen when moving with the keyboard.
  const ensureVisible = useCallback(
    (id: string) => {
      const pos = layout[id];
      const box = wrapper.current?.getBoundingClientRect();
      if (!pos || !box) return;
      const { x, y, zoom } = flow.getViewport();
      const left = pos.x * zoom + x;
      const top = pos.y * zoom + y;
      const margin = 24;
      const inside =
        left >= margin &&
        top >= margin &&
        left + NODE_WIDTH * zoom <= box.width - margin &&
        top + NODE_HEIGHT * zoom <= box.height - margin;
      if (!inside) {
        void flow.setCenter(pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2, {
          zoom,
          duration: prefersReducedMotion() ? 0 : 200,
        });
      }
    },
    [flow, layout],
  );

  const onNavigate = useCallback(
    (id: string, direction: Direction | "escape") => {
      if (direction === "escape") {
        onSelect(null);
        return;
      }
      const target = navigate(edges, layout, id, direction);
      if (target) document.getElementById(`subject-${target}`)?.focus();
    },
    [edges, layout, onSelect],
  );

  const nodes = useMemo<(SubjectFlowNode | LevelLabelNode)[]>(() => {
    const subjectNodes: SubjectFlowNode[] = plan.subjects.map((subject) => {
      // With an active lens, dimming follows the lens (so a selected subject does not
      // hide the other contributors); otherwise it follows the focus.
      const lensDims = lens !== null && lens.coverage.size > 0;
      let state: NodeState = "idle";
      if (focus && subject.id === focus.id) state = "focus";
      else if (lensDims && !lens.coverage.has(subject.id)) state = "dim";
      else if (!lensDims && focus && !focus.isRelated(subject.id))
        state = "dim";
      else if (focus && focus.isRelated(subject.id)) state = "related";
      const lensLevel = lens ? (lens.coverage.get(subject.id) ?? "none") : null;
      const prerequisites = (ids: string[]) =>
        ids.map((id) => names.get(id) ?? id);
      const status = progress ? displayStatus(progress, subject.id) : null;
      const missing = progress?.blocked.get(subject.id) ?? [];
      const missingTitle =
        status === "blocked"
          ? dict.progress.missingTitle(
              missing.map((m) =>
                dict.progress.missingItem(
                  names.get(m.id) ?? m.id,
                  m.requirement,
                ),
              ),
            )
          : "";
      return {
        id: subject.id,
        type: "subject",
        position: layout[subject.id],
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        draggable: false,
        selectable: false,
        focusable: false,
        data: {
          subject,
          label: names.get(subject.id) ?? subject.id,
          ariaLabel: [
            dict.canvas.nodeAria(
              // "1 Análisis Matemático I": the visible text must be part of the accessible name.
              `${subject.number} ${names.get(subject.id) ?? subject.id}`,
              subject.level,
              prerequisites(subject.prerequisites.taken),
              prerequisites(subject.prerequisites.passed),
            ),
            status ? dict.progress.state[status] : "",
            missingTitle,
          ]
            .filter(Boolean)
            .join(". "),
          integrativeTitle: dict.canvas.legendIntegrative,
          electiveTag: dict.canvas.electiveTag,
          state,
          lens: lensLevel,
          lensTitle:
            lensLevel && lensLevel !== "none"
              ? dict.profile.levels[lensLevel]
              : "",
          progress: status,
          progressTag:
            status === "passed" || status === "taken"
              ? dict.progress.state[status]
              : "",
          progressTitle: missingTitle,
          onSelect,
          onNavigate,
          onFocusNode: ensureVisible,
        },
      };
    });
    const levels = [...new Set(plan.subjects.map((s) => s.level))].sort(
      (a, b) => a - b,
    );
    const labels: LevelLabelNode[] = levels.map((level) => ({
      id: `level-${level}`,
      type: "levelLabel",
      position: { x: columnX(level), y: LEVEL_LABEL_Y },
      draggable: false,
      selectable: false,
      focusable: false,
      data: { label: dict.canvas.level(ROMAN[level - 1] ?? String(level)) },
    }));
    return [...labels, ...subjectNodes];
  }, [
    plan,
    layout,
    names,
    focus,
    lens,
    progress,
    dict,
    onSelect,
    onNavigate,
    ensureVisible,
  ]);

  const flowEdges = useMemo<PrereqFlowEdge[]>(() => {
    const levelOf = new Map(plan.subjects.map((s) => [s.id, s.level]));
    // Each subject gets its own lane in the gutter before its column; every conductor
    // into the same subject shares that lane, like a bus bar.
    const lanes = new Map<string, number>();
    for (const level of new Set(levelOf.values())) {
      const column = plan.subjects
        .filter((s) => s.level === level)
        .sort((a, b) => layout[a.id].y - layout[b.id].y);
      column.forEach((s, i) => {
        lanes.set(
          s.id,
          columnX(level) -
            COLUMN_GAP +
            ((i + 1) * COLUMN_GAP) / (column.length + 1),
        );
      });
    }
    const result = edges.map((e): PrereqFlowEdge => {
      const state = !focus ? "idle" : focus.isLit(e) ? "lit" : "dim";
      const sameLevel = levelOf.get(e.from) === levelOf.get(e.to);
      return {
        id: `${e.from}>${e.to}`,
        type: "prereq",
        source: e.from,
        target: e.to,
        sourceHandle: "out",
        targetHandle: sameLevel ? "in-side" : "in",
        focusable: false,
        selectable: false,
        data: {
          type: e.type,
          state,
          laneX: sameLevel ? undefined : lanes.get(e.to),
        },
      };
    });
    // Lit conductors come last in the DOM, so they sit above the idle ones but still
    // below the nodes (an explicit zIndex would draw them across the subject names).
    return result.sort(
      (a, b) =>
        Number(a.data?.state === "lit") - Number(b.data?.state === "lit"),
    );
  }, [plan, edges, focus, layout]);

  return (
    <div
      ref={wrapper}
      className="relative min-h-0 flex-1"
      role="region"
      aria-label={dict.canvas.ariaLabel}
    >
      <ReactFlow<SubjectFlowNode | LevelLabelNode, FlowEdge>
        nodes={nodes}
        edges={flowEdges as FlowEdge[]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          // Leave room under the map for the legend, so it never covers a subject.
          padding: {
            top: "64px", // clear of the lens label, which sits in the top-right corner
            right: "24px",
            left: "24px",
            bottom: "280px",
          },
        }}
        minZoom={0.25}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        disableKeyboardA11y
        onPaneClick={() => onSelect(null)}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={30}
          color="var(--grid)"
          lineWidth={0.5}
        />
        <Controls showInteractive={false} />
        {lens && (
          // One line in the free strip above the map (nothing is ever laid out there), so it neither
          // covers subjects nor moves the page when a shared link opens with a lens.
          <Panel
            position="top-right"
            role="status"
            aria-label={dict.lens.legend}
            className="max-w-[22rem] border border-[var(--ink)] bg-white p-2 text-xs"
          >
            <details>
              <summary className="cursor-pointer">
                <span className="font-mono tracking-widest uppercase">
                  {dict.lens.legend}
                </span>{" "}
                <strong>{lens.code}</strong>
                {[...new Set(lens.coverage.values())].length > 0 && (
                  <span className="ml-2 inline-flex flex-wrap gap-x-3">
                    {(
                      [
                        "contributes",
                        "introduces",
                        "develops",
                        "consolidates",
                      ] as const
                    )
                      .filter((level) =>
                        [...lens.coverage.values()].includes(level),
                      )
                      .map((level) => (
                        <span key={level}>
                          <span aria-hidden>{LEVEL_GLYPH[level]}</span>{" "}
                          {dict.profile.levels[level]}
                        </span>
                      ))}
                  </span>
                )}
              </summary>
              <p className="mt-2 text-sm font-semibold">{lens.name}</p>
            </details>
            {lens.coverage.size === 0 && (
              <p className="mt-1">{dict.lens.empty}</p>
            )}
          </Panel>
        )}
        <Panel
          position="bottom-left"
          className="max-w-[24rem] border border-[var(--ink)] bg-white p-3 text-xs"
        >
          <details open>
            <summary className="mb-2 cursor-pointer font-mono tracking-widest uppercase">
              {dict.canvas.legendTitle}
            </summary>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <svg width="32" height="6" aria-hidden>
                  <line
                    x1="0"
                    y1="3"
                    x2="32"
                    y2="3"
                    stroke="var(--ink)"
                    strokeWidth="1.5"
                  />
                </svg>
                {dict.canvas.legendPassed}
              </li>
              <li className="flex items-center gap-2">
                <svg width="32" height="6" aria-hidden>
                  <line
                    x1="0"
                    y1="3"
                    x2="32"
                    y2="3"
                    stroke="var(--ink)"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                </svg>
                {dict.canvas.legendTaken}
              </li>
              <li className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-3.5 w-8 rounded-full border border-[var(--ink)]"
                />
                {dict.canvas.legendIntegrative}
              </li>
              <li className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block border border-[var(--ink)] px-1 font-mono text-[10px] leading-4 uppercase"
                >
                  {dict.canvas.electiveTag}
                </span>
                {dict.canvas.legendElective}
              </li>
              <li>
                <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                  {(
                    [
                      "basic-sciences",
                      "basic-technologies",
                      "applied-technologies",
                      "complementary",
                    ] as const
                  ).map((block) => (
                    <li key={block} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block size-3.5 shrink-0 border border-[var(--ink)]"
                        style={{ background: `var(--block-${block})` }}
                      />
                      {dict.panel.blocks[block]}
                    </li>
                  ))}
                </ul>
              </li>
              {progress && (
                <>
                  <li className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-3.5 w-8 border border-[var(--ink)] bg-[#e3f1e3]"
                    />
                    {dict.progress.legendPassed}
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-3.5 w-8 border border-[var(--ink)] bg-[#fbefd2]"
                    />
                    {dict.progress.legendTaken}
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-3.5 w-8 border border-dashed border-[var(--ink)] opacity-60"
                    />
                    {dict.progress.legendBlocked}
                  </li>
                </>
              )}
            </ul>
          </details>
        </Panel>
      </ReactFlow>
      <p className="sr-only">{dict.canvas.hint}</p>
    </div>
  );
}

export function CurriculumCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
