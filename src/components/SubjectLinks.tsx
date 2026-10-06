"use client";

import Link from "next/link";
import type { Plan } from "@/data/schema";
import { localize } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { subjectPath } from "@/lib/site";

/**
 * A plain list of links to every subject page. It is the way into those pages for search
 * engines and for anyone who does not use the map (it is read out by screen readers, and
 * hidden visually because the map and the list view already show the same subjects).
 */
export function SubjectLinks({ plan }: { plan: Plan }) {
  const { locale, dict } = useI18n();
  return (
    <nav aria-label={dict.page.subjectsNav} className="sr-only">
      <ul>
        {[...plan.subjects]
          .sort((a, b) => a.number - b.number)
          .map((s) => (
            <li key={s.id}>
              <Link href={subjectPath(s.id)}>{localize(s.name, locale)}</Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}
