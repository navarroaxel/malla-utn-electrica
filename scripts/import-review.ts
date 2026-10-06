/**
 * Merges a corrected review.csv back into src/data/plans/plan-2023.json.
 * Usage: pnpm import:review review.csv [--dry-run]
 * Nothing is written unless the whole sheet is valid and the resulting plan still validates.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { format, resolveConfig } from "prettier";
import { assemblePlan } from "../src/data/load";
import type { Subject } from "../src/data/schema";
import { parseCsv } from "../src/lib/review/csv";
import { applyReview } from "../src/lib/review/review";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
if (!file) {
  console.error("Usage: pnpm import:review review.csv [--dry-run]");
  process.exit(2);
}

const read = (path: string) => JSON.parse(readFileSync(resolve(path), "utf8"));
const planPath = "src/data/plans/plan-2023.json";
const raw = read(planPath) as { subjects: Subject[] };
const competencies = read("src/data/competencies.json") as { id: string }[];
const activities = read("src/data/reserved-activities.json") as {
  id: string;
}[];

const { rows } = parseCsv(readFileSync(resolve(file), "utf8"));
const result = applyReview(raw.subjects, rows, {
  competencyIds: new Set(competencies.map((c) => c.id)),
  activityIds: new Set(activities.map((a) => a.id)),
});

if (result.errors.length > 0) {
  console.error(
    `${result.errors.length} problem(s) in ${file}; nothing was written:`,
  );
  for (const error of result.errors) console.error(`  - ${error}`);
  process.exit(1);
}

const updated = { ...raw, subjects: result.subjects };
assemblePlan(updated, competencies, activities); // throws if the merged plan is invalid

async function main() {
  if (result.changed.length === 0) {
    console.log("No changes.");
  } else if (dryRun) {
    console.log(
      `Would update ${result.changed.length} subject(s): ${result.changed.join(", ")}`,
    );
  } else {
    const target = resolve(planPath);
    const options = (await resolveConfig(target)) ?? {};
    const text = await format(JSON.stringify(updated, null, 2), {
      ...options,
      filepath: target,
    });
    writeFileSync(target, text);
    console.log(
      `Updated ${result.changed.length} subject(s): ${result.changed.join(", ")}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
