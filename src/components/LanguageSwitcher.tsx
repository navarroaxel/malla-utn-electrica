"use client";

import { locales } from "@/i18n";
import { useI18n } from "@/i18n/provider";

/** Toggles between the supported locales without changing the URL. */
export function LanguageSwitcher() {
  const { locale, dict, setLocale } = useI18n();
  const other = locales.find((l) => l !== locale) ?? locale;
  return (
    <button
      type="button"
      lang={other}
      aria-label={`${dict.language[other]} (${dict.language.switchTo})`}
      onClick={() => setLocale(other)}
      className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
    >
      {dict.language[other]}
    </button>
  );
}
