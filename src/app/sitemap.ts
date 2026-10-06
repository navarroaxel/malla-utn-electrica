import type { MetadataRoute } from "next";
import { loadPlan2023 } from "@/data/load";
import { absoluteUrl, subjectPath } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...loadPlan2023().subjects.map((s) => ({
      url: absoluteUrl(subjectPath(s.id)),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
