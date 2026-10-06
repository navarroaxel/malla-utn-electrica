"use client";

import Link from "next/link";
import type { Plan, Subject } from "@/data/schema";
import { useI18n } from "@/i18n/provider";
import type { Graph } from "@/lib/graph";
import type { Status } from "@/lib/progress/progress";
import type { ProgressView } from "@/lib/progress/view";
import { subjectPath } from "@/lib/site";
import { SubjectDetail, type DetailNavigation } from "./SubjectDetail";

interface Props {
  plan: Plan;
  graph: Graph;
  subject: Subject | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  lensId: string | null;
  onPickCompetency: (id: string | null) => void;
  /** "Mi progreso": null when the feature is off. */
  progress: ProgressView | null;
  onSetStatus: (id: string, status: Status) => void;
}

const linkClass =
  "text-left underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline-2 focus-visible:outline-[var(--energy)]";

/** The map's side panel (bottom sheet on small screens). */
export function SubjectPanel({
  plan,
  graph,
  subject,
  onSelect,
  onClose,
  lensId,
  onPickCompetency,
  progress,
  onSetStatus,
}: Props) {
  const { dict } = useI18n();

  const navigation: DetailNavigation = {
    subjectLink: (id, content) => (
      <button type="button" onClick={() => onSelect(id)} className={linkClass}>
        {content}
      </button>
    ),
    competencyLink: (id, content) => (
      <button
        type="button"
        aria-pressed={lensId === id}
        onClick={() => onPickCompetency(lensId === id ? null : id)}
        title={dict.profile.showInMap}
        className={linkClass}
      >
        {content}
      </button>
    ),
  };

  return (
    <aside
      aria-label={dict.panel.title}
      aria-live="polite"
      className={`${subject ? "" : "hidden md:block"} fixed inset-x-0 bottom-0 z-10 max-h-[55vh] overflow-y-auto border-t border-[var(--ink)] bg-white p-4 md:static md:max-h-none md:w-96 md:shrink-0 md:border-t-0 md:border-l`}
    >
      {subject ? (
        <>
          <SubjectDetail
            plan={plan}
            graph={graph}
            subject={subject}
            headingLevel={2}
            navigation={navigation}
            onClose={onClose}
            progress={progress}
            onSetStatus={onSetStatus}
          />
          <p className="mt-5 text-sm">
            <Link href={subjectPath(subject.id)} className={linkClass}>
              {dict.page.openPage} →
            </Link>
          </p>
        </>
      ) : (
        <p className="text-[var(--ink-soft)]">{dict.panel.empty}</p>
      )}
    </aside>
  );
}
