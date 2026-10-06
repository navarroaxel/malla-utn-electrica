import type { Subject } from "@/data/schema";
import type { Locale } from "@/i18n";
import { localize } from "@/i18n";

/** Lower-case, accent-insensitive form used for matching. */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Subjects matching `query` by name (in either language) or by number. Best matches first:
 * exact number, number prefix, name starts with, a word starts with, name contains. Empty
 * query returns every subject in plan order.
 */
export function searchSubjects(
  subjects: readonly Subject[],
  query: string,
  locale: Locale,
): Subject[] {
  const q = fold(query);
  if (q === "") return [...subjects].sort((a, b) => a.number - b.number);

  const scored: { subject: Subject; score: number }[] = [];
  for (const subject of subjects) {
    const names = [fold(localize(subject.name, locale)), fold(subject.name.es)];
    let score = Infinity;
    if (/^\d+$/.test(q)) {
      const number = String(subject.number);
      if (number === q) score = 0;
      else if (number.startsWith(q)) score = 1;
    }
    for (const name of names) {
      if (name.startsWith(q)) score = Math.min(score, 2);
      else if (name.split(/[^a-z0-9]+/).some((w) => w.startsWith(q)))
        score = Math.min(score, 3);
      else if (name.includes(q)) score = Math.min(score, 4);
    }
    if (score !== Infinity) scored.push({ subject, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.subject.number - b.subject.number)
    .map((s) => s.subject);
}
