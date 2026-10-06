import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectPage } from "@/components/SubjectPage";
import { loadPlan2023 } from "@/data/load";
import { sliceForSubject } from "@/lib/plan-slice";
import { jsonLdScript, subjectJsonLd, subjectMetadata } from "@/lib/seo";
import { OG_IMAGE, absoluteUrl, subjectPath } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadPlan2023().subjects.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/materias/[id]">): Promise<Metadata> {
  const { id } = await params;
  const subject = loadPlan2023().subjects.find((s) => s.id === id);
  if (!subject) return {};
  const { title, description } = subjectMetadata(subject);
  return {
    title,
    description,
    alternates: { canonical: subjectPath(id) },
    openGraph: {
      title,
      description,
      type: "article",
      url: subjectPath(id),
      // A page's openGraph replaces the layout's, so the image has to be repeated.
      images: [{ ...OG_IMAGE, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Page({ params }: PageProps<"/materias/[id]">) {
  const { id } = await params;
  const plan = loadPlan2023();
  const slice = sliceForSubject(plan, id);
  const subject = plan.subjects.find((s) => s.id === id);
  if (!slice || !subject) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            subjectJsonLd(subject, absoluteUrl(subjectPath(id))),
          ),
        }}
      />
      <SubjectPage plan={slice} subjectId={id} />
    </>
  );
}
