/** Short label for a competency/activity id: "cg-03" → "CG 3", "ce-1.1" → "CE 1.1", "ar-02" → "AR 2". */
export function shortCode(id: string): string {
  const [prefix, rest = ""] = id.split("-");
  const number = rest.includes(".") ? rest : String(Number(rest));
  return `${prefix.toUpperCase()} ${number}`;
}

import type { CompetencyLevel } from "@/data/schema";
import type { Contribution } from "@/lib/graph/coverage";

/** What the competency lens needs: which subjects contribute, and how much. */
export interface Lens {
  id: string;
  /** Short code, e.g. "CE 9.1". */
  code: string;
  /** Full name of the competency (can be a long sentence). */
  name: string;
  coverage: ReadonlyMap<string, Contribution>;
}

export const LEVEL_GLYPH: Record<Contribution, string> = {
  contributes: "◆",
  introduces: "◔",
  develops: "◑",
  consolidates: "●",
};

export const contributionOf = (
  level: CompetencyLevel | undefined,
): Contribution => level ?? "contributes";
