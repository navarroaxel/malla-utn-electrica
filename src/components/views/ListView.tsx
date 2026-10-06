"use client";

import type { Plan, Subject } from "@/data/schema";
import { localize } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { LEVEL_GLYPH, type Lens } from "@/lib/profile";
import { statusOf, type Status } from "@/lib/progress/progress";
import { displayStatus, type ProgressView } from "@/lib/progress/view";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

interface Props {
  plan: Plan;
  selectedId: string | null;
  onSelect: (id: string) => void;
  lens: Lens | null;
  progress: ProgressView | null;
  onSetStatus: (id: string, status: Status) => void;
}

/** The same information as the map, as plain tables grouped by level (no graph needed). */
export function ListView({
  plan,
  selectedId,
  onSelect,
  lens,
  progress,
  onSetStatus,
}: Props) {
  const { locale, dict } = useI18n();
  const byId = new Map(plan.subjects.map((s) => [s.id, s]));
  const levels = [...new Set(plan.subjects.map((s) => s.level))].sort(
    (a, b) => a - b,
  );

  const prerequisites = (ids: string[]) =>
    ids.length === 0
      ? dict.list.none
      : ids
          .map((id) => byId.get(id))
          .filter((s): s is Subject => s !== undefined)
          .map((s) => (
            <div key={s.id}>
              {s.number} {localize(s.name, locale)}
            </div>
          ));

  return (
    <div
      className="min-w-0 flex-1 overflow-auto p-4"
      role="region"
      aria-label={dict.list.label}
    >
      {levels.map((level) => (
        <table
          key={level}
          className="mb-8 w-full table-fixed border-collapse text-sm"
        >
          <caption className="border-b-2 border-[var(--ink)] pb-1 text-left font-mono text-xs tracking-widest uppercase">
            {dict.list.caption(ROMAN[level - 1] ?? String(level))}
          </caption>
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="hidden w-60 lg:table-column" />
            <col className="hidden w-60 lg:table-column" />
            {lens && <col className="w-40" />}
            {progress && <col className="w-44" />}
          </colgroup>
          <thead className="text-left text-[var(--ink-soft)]">
            <tr>
              <th scope="col" className="w-12 py-2 pr-2 font-normal">
                {dict.list.number}
              </th>
              <th scope="col" className="py-2 pr-2 font-normal">
                {dict.list.subject}
              </th>
              <th
                scope="col"
                className="hidden py-2 pr-2 font-normal lg:table-cell"
              >
                {dict.list.taken}
              </th>
              <th
                scope="col"
                className="hidden py-2 pr-2 font-normal lg:table-cell"
              >
                {dict.list.passed}
              </th>
              {lens && (
                <th scope="col" className="py-2 pr-2 font-normal">
                  {dict.list.lens(lens.code)}
                </th>
              )}
              {progress && (
                <th scope="col" className="py-2 font-normal">
                  {dict.list.status}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {plan.subjects
              .filter((s) => s.level === level)
              .sort((a, b) => a.number - b.number)
              .map((subject) => {
                const contribution = lens?.coverage.get(subject.id);
                return (
                  <tr
                    key={subject.id}
                    aria-current={
                      subject.id === selectedId ? "true" : undefined
                    }
                    onClick={() => onSelect(subject.id)}
                    className={`cursor-pointer border-t border-[var(--grid)] align-top hover:bg-[#f1f4f8] ${subject.id === selectedId ? "bg-[#e8eef5]" : ""}`}
                  >
                    <td className="py-2 pr-2 font-mono text-xs">
                      {subject.number}
                    </td>
                    <th scope="row" className="py-2 pr-2 text-left font-normal">
                      <button
                        id={`list-subject-${subject.id}`}
                        type="button"
                        onClick={() => onSelect(subject.id)}
                        className="text-left underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline-2 focus-visible:outline-[var(--energy)]"
                      >
                        {localize(subject.name, locale)}
                      </button>
                      {subject.isIntegrative && <span aria-hidden> ◎</span>}
                    </th>
                    <td className="hidden py-2 pr-2 lg:table-cell">
                      {prerequisites(subject.prerequisites.taken)}
                    </td>
                    <td className="hidden py-2 pr-2 lg:table-cell">
                      {prerequisites(subject.prerequisites.passed)}
                    </td>
                    {lens && (
                      <td className="py-2 pr-2">
                        {contribution
                          ? `${LEVEL_GLYPH[contribution]} ${dict.profile.levels[contribution]}`
                          : dict.list.none}
                      </td>
                    )}
                    {progress && (
                      <td
                        className="cursor-default py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label
                          className="sr-only"
                          htmlFor={`status-${subject.id}`}
                        >
                          {dict.progress.statusLabel}:{" "}
                          {localize(subject.name, locale)}
                        </label>
                        <select
                          id={`status-${subject.id}`}
                          value={statusOf(progress.state, subject.id)}
                          onChange={(e) =>
                            onSetStatus(subject.id, e.target.value as Status)
                          }
                          className="border border-[var(--ink)] bg-white px-1 py-0.5"
                        >
                          {(["none", "taken", "passed"] as const).map(
                            (status) => (
                              <option key={status} value={status}>
                                {dict.progress.status[status]}
                              </option>
                            ),
                          )}
                        </select>
                        {displayStatus(progress, subject.id) === "blocked" && (
                          <span className="ml-2 text-xs text-[var(--ink-soft)]">
                            {dict.progress.state.blocked}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      ))}
    </div>
  );
}
