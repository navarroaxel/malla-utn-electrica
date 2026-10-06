import { describe, expect, it } from "vitest";
import { loadPlan2023 } from "@/data/load";
import { buildGraph } from "@/lib/graph";
import {
  buildProgressView,
  countAvailable,
  displayStatus,
} from "@/lib/progress/view";

const plan = loadPlan2023();
const graph = buildGraph(plan);

describe("progress view", () => {
  it("offers only subjects without prerequisites to a new student", () => {
    const view = buildProgressView(graph, {});
    // The 8 first-year subjects plus Inglés I, which has no prerequisites in Ord. 1874, plus the
    // draft elective, whose prerequisites are still empty.
    expect(countAvailable(graph, view)).toBe(10);
    expect(displayStatus(view, "ingles-1")).toBe("available");
    expect(displayStatus(view, "analisis-matematico-1")).toBe("available");
    expect(displayStatus(view, "fisica-2")).toBe("blocked");
  });

  it("unlocks Física II once Análisis I and Física I are taken", () => {
    const view = buildProgressView(graph, {
      "analisis-matematico-1": "taken",
      "fisica-1": "taken",
    });
    expect(displayStatus(view, "fisica-2")).toBe("available");
    expect(displayStatus(view, "analisis-matematico-1")).toBe("taken");
  });

  it("keeps a subject blocked while a 'passed' requirement is only taken", () => {
    // Tecnologías y Ensayos needs 1 and 5 passed (and 6, 9 taken).
    const view = buildProgressView(graph, {
      "analisis-matematico-1": "taken",
      "fisica-1": "taken",
      "quimica-general": "taken",
      "fisica-2": "taken",
    });
    expect(
      displayStatus(view, "tecnologias-y-ensayos-de-materiales-electricos"),
    ).toBe("blocked");
    const missing = view.blocked.get(
      "tecnologias-y-ensayos-de-materiales-electricos",
    )!;
    expect(missing).toEqual(
      expect.arrayContaining([
        { id: "analisis-matematico-1", requirement: "passed" },
        { id: "fisica-1", requirement: "passed" },
      ]),
    );
    const unlocked = buildProgressView(graph, {
      "analisis-matematico-1": "passed",
      "fisica-1": "passed",
      "quimica-general": "taken",
      "fisica-2": "taken",
    });
    expect(
      displayStatus(unlocked, "tecnologias-y-ensayos-de-materiales-electricos"),
    ).toBe("available");
  });

  it("marks passed subjects as passed", () => {
    expect(
      displayStatus(
        buildProgressView(graph, { "fisica-1": "passed" }),
        "fisica-1",
      ),
    ).toBe("passed");
  });
});
