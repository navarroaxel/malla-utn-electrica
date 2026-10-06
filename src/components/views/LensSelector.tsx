"use client";

import type { Plan } from "@/data/schema";
import { localize } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { shortCode } from "@/lib/profile";

interface Props {
  plan: Plan;
  value: string | null;
  onChange: (id: string | null) => void;
}

const GROUPS = [
  "technological",
  "social-political-attitudinal",
  "specific",
] as const;

/** Picks the competency shown through the map's lens. */
export function LensSelector({ plan, value, onChange }: Props) {
  const { locale, dict } = useI18n();
  return (
    <label className="flex min-w-0 items-center gap-2 text-sm">
      <span className="shrink-0">{dict.lens.label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="max-w-[16rem] min-w-0 truncate border border-[var(--ink)] bg-white px-2 py-1"
      >
        <option value="">{dict.lens.none}</option>
        {GROUPS.map((group) => (
          <optgroup key={group} label={dict.lens.groups[group]}>
            {plan.competencies
              .filter((c) => c.group === group)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {shortCode(c.id)} · {localize(c.name, locale)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
