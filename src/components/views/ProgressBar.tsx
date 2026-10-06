"use client";

import { useState } from "react";
import type { Plan } from "@/data/schema";
import { useI18n } from "@/i18n/provider";
import {
  countStatuses,
  decodeProgress,
  encodeProgress,
  type ProgressState,
} from "@/lib/progress/progress";

interface Props {
  plan: Plan;
  state: ProgressState;
  available: number;
  onReplace: (state: ProgressState) => void;
  /** Code carried by a shared link (`?p=`), offered for import. */
  incomingCode: string | null;
  onDismissIncoming: () => void;
}

const button =
  "border border-[var(--ink)] bg-white px-2 py-1 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-[var(--energy)]";

/** Summary of "Mi progreso" plus the short code to share or restore it. */
export function ProgressBar({
  plan,
  state,
  available,
  onReplace,
  incomingCode,
  onDismissIncoming,
}: Props) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState(false);

  // The code depends on the plan's subject order (by official number), never on screen order.
  const orderedIds = [...plan.subjects]
    .sort((a, b) => a.number - b.number)
    .map((s) => s.id);
  const code = encodeProgress(state, orderedIds);
  const counts = countStatuses(state);
  const incoming = incomingCode
    ? decodeProgress(incomingCode, orderedIds)
    : null;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the code is visible in the field to copy by hand.
    }
  };

  const apply = () => {
    const decoded = decodeProgress(importText, orderedIds);
    setImportError(decoded === null);
    if (decoded) {
      onReplace(decoded);
      setImportText("");
    }
  };

  return (
    <section
      aria-label={dict.progress.summaryRegion}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--ink)] bg-[#f3f4ee] px-4 py-2 text-sm"
    >
      <p className="font-medium">
        {dict.progress.summary(counts.passed, counts.taken, available)}
      </p>

      {incoming && (
        <p className="flex flex-wrap items-center gap-2 border border-dashed border-[var(--ink)] px-2 py-1">
          {dict.progress.incoming}
          <button
            type="button"
            className={button}
            onClick={() => {
              onReplace(incoming);
              onDismissIncoming();
            }}
          >
            {dict.progress.incomingApply}
          </button>
          <button type="button" className={button} onClick={onDismissIncoming}>
            {dict.progress.incomingIgnore}
          </button>
        </p>
      )}

      <label className="flex items-center gap-2">
        <span>{dict.progress.code}</span>
        <input
          readOnly
          value={code}
          onFocus={(e) => e.currentTarget.select()}
          className="w-36 border border-[var(--ink)] bg-white px-2 py-1 font-mono text-xs"
        />
      </label>
      <button type="button" className={button} onClick={() => void copy(code)}>
        {copied ? dict.progress.copied : dict.progress.copyCode}
      </button>
      <button
        type="button"
        className={button}
        onClick={() =>
          void copy(
            `${window.location.origin}${window.location.pathname}?p=${code}`,
          )
        }
      >
        {dict.progress.copyLink}
      </button>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <label className="flex items-center gap-2">
          <span>{dict.progress.importLabel}</span>
          <input
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportError(false);
            }}
            aria-invalid={importError}
            className="w-36 border border-[var(--ink)] bg-white px-2 py-1 font-mono text-xs"
          />
        </label>
        <button
          type="submit"
          className={button}
          disabled={importText.trim() === ""}
        >
          {dict.progress.importApply}
        </button>
        {importError && (
          <span role="alert" className="text-[#a4532f]">
            {dict.progress.importInvalid}
          </span>
        )}
      </form>

      <button
        type="button"
        className={`${button} ml-auto`}
        onClick={() => {
          if (window.confirm(dict.progress.clearConfirm)) onReplace({});
        }}
      >
        {dict.progress.clear}
      </button>
    </section>
  );
}
