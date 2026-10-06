import type { Plan, Subject } from "@/data/schema";

interface SubjectSpec {
  id: string;
  level?: number;
  number?: number;
  taken?: string[];
  passed?: string[];
  competencies?: {
    id: string;
    level: "introduces" | "develops" | "consolidates";
  }[];
  activities?: string[];
}

export function subject(spec: SubjectSpec, index = 0): Subject {
  return {
    id: spec.id,
    number: spec.number ?? index + 1,
    name: { es: spec.id },
    level: spec.level ?? 1,
    term: null,
    hoursPerWeek: null,
    totalHours: null,
    block: null,
    isIntegrative: false,
    isElective: false,
    prerequisites: { taken: spec.taken ?? [], passed: spec.passed ?? [] },
    profile: {
      summary: { es: "" },
      competencies: spec.competencies ?? [],
      reservedActivities: spec.activities ?? [],
      status: "draft",
    },
    sources: [],
  };
}

export function plan(specs: SubjectSpec[]): Plan {
  return {
    id: "test",
    name: "Test",
    ordinance: "test",
    faculty: "UTN FRBA",
    subjects: specs.map(subject),
    supplementaryRequirements: [],
    competencies: [
      {
        id: "cg-01",
        kind: "generic",
        group: "technological",
        name: { es: "c" },
        source: "test",
      },
    ],
    reservedActivities: [
      { id: "ar-01", kind: "reserved", text: { es: "a" }, source: "test" },
    ],
  };
}
