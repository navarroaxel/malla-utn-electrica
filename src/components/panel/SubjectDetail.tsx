"use client";

import type { ReactNode } from "react";
import type { Plan, Subject } from "@/data/schema";
import { localize } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import type { Graph } from "@/lib/graph";
import { LEVEL_GLYPH, contributionOf, shortCode } from "@/lib/profile";
import { statusOf, type Status } from "@/lib/progress/progress";
import type { ProgressView } from "@/lib/progress/view";
import { SCHEDULE_TARGET_YEAR, scheduleFor, slotRuns } from "@/lib/schedule";

/** How the detail points to other subjects and competencies: buttons in the map, links on a page. */
export interface DetailNavigation {
  subjectLink: (id: string, content: ReactNode) => ReactNode;
  competencyLink: (id: string, content: ReactNode) => ReactNode;
}

interface Props {
  plan: Plan;
  graph: Graph;
  subject: Subject;
  /** 1 on a page of its own, 2 inside the map's side panel. */
  headingLevel: 1 | 2;
  navigation: DetailNavigation;
  onClose?: () => void;
  /** "Mi progreso": omitted or null when the feature is off. */
  progress?: ProgressView | null;
  onSetStatus?: (id: string, status: Status) => void;
}

/** Everything known about one subject. Shared by the map's panel and the static subject pages. */
export function SubjectDetail({
  plan,
  graph,
  subject,
  headingLevel,
  navigation,
  onClose,
  progress = null,
  onSetStatus = () => {},
}: Props) {
  const { locale, dict } = useI18n();
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const Section = headingLevel === 1 ? "h2" : "h3";
  const Sub = headingLevel === 1 ? "h3" : "h4";
  const byId = new Map(plan.subjects.map((s) => [s.id, s]));
  const competencyById = new Map(plan.competencies.map((c) => [c.id, c]));
  const activityById = new Map(plan.reservedActivities.map((a) => [a.id, a]));
  const nameOf = (id: string) => {
    const s = byId.get(id);
    return s ? localize(s.name, locale) : id;
  };

  const link = (id: string) =>
    navigation.subjectLink(
      id,
      <>
        <span className="font-mono text-xs">{byId.get(id)?.number}</span>{" "}
        {nameOf(id)}
      </>,
    );

  const list = (ids: string[]) =>
    ids.length === 0 ? (
      <p className="text-[var(--ink-soft)]">{dict.panel.none}</p>
    ) : (
      <ul className="space-y-1">
        {ids.map((id) => (
          <li key={id}>{link(id)}</li>
        ))}
      </ul>
    );

  const noData = (
    <span className="text-[var(--ink-soft)]">{dict.panel.noData}</span>
  );
  const entries = scheduleFor(plan, subject.id);
  const unlocks = graph.outgoing.get(subject.id) ?? [];

  return (
    <div className="space-y-5 text-sm">
      <header className="flex items-start justify-between gap-3">
        <Heading className="text-lg leading-snug font-semibold">
          {nameOf(subject.id)}
        </Heading>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.panel.close}
            className="border border-[var(--ink)] px-2 leading-7 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-[var(--energy)]"
          >
            ×
          </button>
        )}
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-[var(--ink-soft)]">{dict.panel.number}</dt>
        <dd className="font-mono">{subject.number}</dd>
        <dt className="text-[var(--ink-soft)]">{dict.panel.level}</dt>
        <dd>{subject.level}</dd>
        <dt className="text-[var(--ink-soft)]">{dict.panel.term}</dt>
        <dd>{subject.term ? dict.panel.terms[subject.term] : noData}</dd>
        <dt className="text-[var(--ink-soft)]">{dict.panel.hours}</dt>
        <dd>{subject.hoursPerWeek ?? noData}</dd>
        <dt className="text-[var(--ink-soft)]">{dict.panel.totalHours}</dt>
        <dd>
          {subject.totalHours
            ? dict.panel.clockHours(subject.totalHours)
            : noData}
        </dd>
        <dt className="text-[var(--ink-soft)]">{dict.panel.block}</dt>
        <dd>{subject.block ? dict.panel.blocks[subject.block] : noData}</dd>
      </dl>
      {subject.isIntegrative && (
        <p className="inline-block rounded-full border border-[var(--ink)] px-3 py-0.5">
          ◎ {dict.panel.integrative}
        </p>
      )}

      {progress && (
        <section aria-labelledby="progress-heading">
          <Section
            id="progress-heading"
            className="mb-2 font-mono text-xs tracking-widest uppercase"
          >
            {dict.progress.region}
          </Section>
          <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
            <legend className="sr-only">{dict.progress.statusLabel}</legend>
            {(["none", "taken", "passed"] as const).map((status) => (
              <label key={status} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={`status-${subject.id}`}
                  checked={statusOf(progress.state, subject.id) === status}
                  onChange={() => onSetStatus(subject.id, status)}
                  className="size-4 accent-[var(--ink)]"
                />
                {dict.progress.status[status]}
              </label>
            ))}
          </fieldset>
          {(progress.blocked.get(subject.id) ?? []).length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-[var(--ink-soft)]">
                {dict.progress.state.blocked} · {dict.progress.missing}
              </p>
              <ul className="space-y-1">
                {(progress.blocked.get(subject.id) ?? []).map((m) => (
                  <li key={m.id}>
                    {link(m.id)}{" "}
                    <span className="text-[var(--ink-soft)]">
                      ({dict.progress.status[m.requirement]})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="profile-heading">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Section
            id="profile-heading"
            className="font-mono text-xs tracking-widest uppercase"
          >
            {dict.profile.title}
          </Section>
          {subject.profile.status === "draft" ? (
            <span
              title={dict.profile.draftHint}
              className="border border-dashed border-[var(--ink)] px-2 py-0.5 text-xs"
            >
              {dict.profile.draft}
            </span>
          ) : (
            <span className="border border-[var(--ink)] px-2 py-0.5 text-xs">
              {subject.profile.reviewedBy
                ? dict.profile.reviewedBy(subject.profile.reviewedBy)
                : dict.profile.reviewed}
            </span>
          )}
        </div>
        <p
          className={
            localize(subject.profile.summary, locale)
              ? ""
              : "text-[var(--ink-soft)]"
          }
        >
          {localize(subject.profile.summary, locale) || dict.profile.noSummary}
        </p>

        <Sub className="mt-3 mb-1 text-[var(--ink-soft)]">
          {dict.profile.competencies}
        </Sub>
        {subject.profile.competencies.length === 0 ? (
          <p className="text-[var(--ink-soft)]">
            {dict.profile.noCompetencies}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {subject.profile.competencies.map(({ id, level }) => {
              const competency = competencyById.get(id);
              const contribution = contributionOf(level);
              return (
                <li key={id} className="flex items-start gap-2">
                  <span aria-hidden className="leading-snug">
                    {LEVEL_GLYPH[contribution]}
                  </span>
                  {navigation.competencyLink(
                    id,
                    <>
                      <span className="font-mono text-xs">{shortCode(id)}</span>{" "}
                      {competency ? localize(competency.name, locale) : id}
                    </>,
                  )}
                  <span className="shrink-0 text-xs text-[var(--ink-soft)]">
                    {dict.profile.levels[contribution]}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <Sub className="mt-3 mb-1 text-[var(--ink-soft)]">
          {dict.profile.activities}
        </Sub>
        {subject.profile.reservedActivities.length === 0 ? (
          <p className="text-[var(--ink-soft)]">{dict.profile.noActivities}</p>
        ) : (
          <ul className="space-y-1.5">
            {subject.profile.reservedActivities.map((id) => {
              const activity = activityById.get(id);
              return (
                <li key={id}>
                  <span className="font-mono text-xs">{shortCode(id)}</span>{" "}
                  {activity ? localize(activity.text, locale) : id}
                </li>
              );
            })}
          </ul>
        )}
        {subject.profile.reservedActivities.length > 0 && (
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            {dict.profile.scopeLegend}
          </p>
        )}
      </section>

      <section>
        <Section className="mb-2 font-mono text-xs tracking-widest uppercase">
          {dict.panel.prerequisites}
        </Section>
        <p className="mb-1 text-[var(--ink-soft)]">{dict.panel.taken}</p>
        {list(subject.prerequisites.taken)}
        <p className="mt-3 mb-1 text-[var(--ink-soft)]">{dict.panel.passed}</p>
        {list(subject.prerequisites.passed)}
      </section>

      {subject.specialRule && (
        <section>
          <Section className="mb-2 font-mono text-xs tracking-widest uppercase">
            {dict.panel.specialRule}
          </Section>
          <p>{localize(subject.specialRule, locale)}</p>
        </section>
      )}

      <section>
        <Section className="mb-2 font-mono text-xs tracking-widest uppercase">
          {dict.panel.unlocks}
        </Section>
        {unlocks.length === 0 ? (
          <p className="text-[var(--ink-soft)]">{dict.panel.unlocksNone}</p>
        ) : (
          <ul className="space-y-1">
            {unlocks.map((e) => (
              <li key={e.to}>
                {link(e.to)}{" "}
                <span className="text-[var(--ink-soft)]">
                  (
                  {e.type === "passed"
                    ? dict.panel.unlocksPassed
                    : dict.panel.unlocksTaken}
                  )
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {subject.syllabus && (
        <section className="space-y-2">
          {(
            [
              ["objectives", subject.syllabus.objectives],
              ["contents", subject.syllabus.contents],
            ] as const
          ).map(([key, items]) => (
            <details key={key} open={headingLevel === 1} className="group">
              <summary className="cursor-pointer font-mono text-xs tracking-widest uppercase">
                {dict.panel[key]}
              </summary>
              {/* The ordinance's own words, in Spanish whatever the interface language. */}
              <ul lang="es" className="mt-2 list-disc space-y-1 pl-5">
                {items.map((item, i) => (
                  <li key={`${key}-${i}`}>{item}</li>
                ))}
              </ul>
            </details>
          ))}
          <p className="text-xs text-[var(--ink-soft)]">
            {dict.panel.syllabusNote}
          </p>
        </section>
      )}

      <section aria-labelledby="schedule-heading">
        <Section
          id="schedule-heading"
          className="mb-2 font-mono text-xs tracking-widest uppercase"
        >
          {dict.schedule.title}
        </Section>
        {entries.length === 0 ? (
          <p className="text-[var(--ink-soft)]">{dict.schedule.none}</p>
        ) : (
          <>
            <p className="mb-2 border border-dashed border-[var(--ink)] px-2 py-1 text-xs">
              {plan.schedule?.reference.confirmedFor
                ? dict.schedule.confirmed(plan.schedule.reference.confirmedFor)
                : dict.schedule.reference(
                    plan.schedule?.reference.year ?? 0,
                    plan.schedule?.reference.plan ?? "",
                    SCHEDULE_TARGET_YEAR,
                  )}
            </p>
            {plan.schedule?.reference.venue && (
              <p className="mb-2">
                {dict.schedule.venue(plan.schedule.reference.venue)}
              </p>
            )}
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.division}>
                  <p>
                    <span className="font-mono text-xs">
                      {dict.schedule.division} {entry.division}
                    </span>
                    {" · "}
                    {entry.shifts
                      .map((s) => dict.schedule.shifts[s])
                      .join(" / ")}
                    {entry.modality &&
                      ` · ${dict.schedule.modality[entry.modality]}`}
                  </p>
                  <ul className="ml-3">
                    {entry.slots.map((slot) => (
                      <li key={slot.day}>
                        {dict.schedule.days[slot.day]}:{" "}
                        {slotRuns(entry, slot, plan.schedule?.moduleTimes)
                          .map((run) =>
                            run.from && run.to
                              ? `${dict.schedule.time(run.from, run.to)} (${dict.schedule.modules(run.modules)})`
                              : dict.schedule.modules(run.modules),
                          )
                          .join("; ")}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              {dict.schedule.timesNote} {dict.schedule.moduleNote}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
