/**
 * Writes review.csv: one row per subject with its graduate-profile draft, for professors to
 * correct in a spreadsheet. Usage: npm run export:review [out.csv] [--semicolon]
 * (--semicolon helps Excel in es-AR, which expects ";" as the separator).
 */
import { writeFileSync } from "node:fs";
import { loadPlan2023 } from "../src/data/load";
import { toCsv } from "../src/lib/review/csv";
import { exportReview } from "../src/lib/review/review";

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith("--")) ?? "review.csv";
const delimiter = args.includes("--semicolon") ? ";" : ",";

const plan = loadPlan2023();
// The BOM makes Excel open the file as UTF-8 (accents and ñ).
writeFileSync(out, "﻿" + toCsv(exportReview(plan.subjects), delimiter));
console.log(`${plan.subjects.length} subjects -> ${out}`);
