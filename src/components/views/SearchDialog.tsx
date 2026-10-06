"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { Plan } from "@/data/schema";
import { localize } from "@/i18n";
import { useI18n } from "@/i18n/provider";
import { searchSubjects } from "@/lib/search";

interface Props {
  open: boolean;
  plan: Plan;
  onPick: (id: string) => void;
  onClose: () => void;
}

/** Search by name or number. Mounted only while open so each use starts clean. */
export function SearchDialog(props: Props) {
  return props.open ? <Dialog {...props} /> : null;
}

function Dialog({ plan, onPick, onClose }: Props) {
  const { locale, dict } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(
    () => searchSubjects(plan.subjects, query, locale),
    [plan, query, locale],
  );
  const current = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      // A search field would otherwise spend its first Escape clearing the text.
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(current - 1, 0));
    } else if (event.key === "Enter" && results[current]) {
      event.preventDefault();
      onPick(results[current].id);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={dict.search.title}
      className="m-auto mt-[12vh] w-[min(34rem,92vw)] border border-[var(--ink)] bg-white p-0 shadow-xl backdrop:bg-black/30"
    >
      <div className="flex items-center gap-2 border-b border-[var(--ink)] p-3">
        <input
          autoFocus
          type="search"
          role="combobox"
          aria-expanded
          aria-controls="search-results"
          aria-activedescendant={
            results[current]
              ? `search-option-${results[current].id}`
              : undefined
          }
          aria-label={dict.search.title}
          placeholder={dict.search.placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 border border-[var(--ink)] px-3 py-2 text-base"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.search.close}
          className="border border-[var(--ink)] px-3 py-2 hover:bg-zinc-100"
        >
          ×
        </button>
      </div>
      <p className="px-3 pt-2 text-xs text-[var(--ink-soft)]" role="status">
        {results.length === 0
          ? dict.search.none
          : dict.search.results(results.length)}
      </p>
      <ul
        id="search-results"
        role="listbox"
        className="max-h-[50vh] overflow-y-auto p-2"
      >
        {results.map((subject, i) => (
          <li
            key={subject.id}
            id={`search-option-${subject.id}`}
            role="option"
            aria-selected={i === current}
            onMouseEnter={() => setActive(i)}
            onClick={() => onPick(subject.id)}
            className={`flex cursor-pointer items-baseline gap-3 px-3 py-2 ${i === current ? "bg-[#e8eef5]" : ""}`}
          >
            <span className="w-7 shrink-0 font-mono text-xs">
              {subject.number}
            </span>
            <span>{localize(subject.name, locale)}</span>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
