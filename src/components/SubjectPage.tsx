"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  SubjectDetail,
  type DetailNavigation,
} from "@/components/panel/SubjectDetail";
import type { Plan } from "@/data/schema";
import { localize } from "@/i18n";
import { useDocumentTitle, useI18n } from "@/i18n/provider";
import { buildGraph } from "@/lib/graph";
import { subjectPath } from "@/lib/site";

const linkClass =
  "underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline-2 focus-visible:outline-[var(--energy)]";

/** A subject on a page of its own: indexable, shareable, and linked to its neighbours. */
export function SubjectPage({
  plan,
  subjectId,
}: {
  plan: Plan;
  subjectId: string;
}) {
  const { locale, dict } = useI18n();
  const graph = useMemo(() => buildGraph(plan), [plan]);
  const subject = plan.subjects.find((s) => s.id === subjectId);
  useDocumentTitle(
    subject
      ? `${localize(subject.name, locale)} · ${dict.app.title}`
      : dict.app.title,
  );
  if (!subject) return null;

  const navigation: DetailNavigation = {
    subjectLink: (id, content) => (
      <Link href={subjectPath(id)} className={linkClass}>
        {content}
      </Link>
    ),
    competencyLink: (id, content) => (
      <Link href={`/?lens=${id}`} className={linkClass}>
        {content}
      </Link>
    ),
  };

  return (
    <>
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-[var(--ink)] px-4 py-2">
        <Link href="/" className="text-base font-semibold tracking-tight">
          {dict.app.title}
        </Link>
        <Link href={`/?s=${subject.id}`} className={`text-sm ${linkClass}`}>
          ← {dict.page.back}
        </Link>
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <SubjectDetail
          plan={plan}
          graph={graph}
          subject={subject}
          headingLevel={1}
          navigation={navigation}
        />
      </main>
    </>
  );
}
