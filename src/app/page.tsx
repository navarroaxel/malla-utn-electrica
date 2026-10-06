import { CurriculumApp } from "@/components/CurriculumApp";
import { loadPlan2023 } from "@/data/load";
import { buildGraph, transitiveReduction } from "@/lib/graph";
import { computeLayout } from "@/lib/layout/layout";

export default async function Page() {
  // Validates the plan data at build time; invalid data fails `next build`.
  const plan = loadPlan2023();
  // The layout is computed once, at build time, from the default (reduced) edges.
  const layout = await computeLayout(
    plan,
    transitiveReduction(buildGraph(plan)),
  );
  return <CurriculumApp plan={plan} layout={layout} />;
}
