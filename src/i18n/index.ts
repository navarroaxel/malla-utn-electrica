import { en } from "./en";
import { es, type Dictionary } from "./es";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Data text: Spanish is the official source; `en` is optional until translated. */
export interface Localized {
  es: string;
  en?: string;
}

/** Text in `locale`, falling back to Spanish when no translation exists. */
export function localize(text: Localized, locale: Locale): string {
  return locale === "en" && text.en ? text.en : text.es;
}

export type { Dictionary };

export const LOCALE_STORAGE_KEY = "malla.locale";

/** Saved choice first, then the browser's preferred languages, then the default. */
export function detectLocale(
  stored: string | null,
  browserLanguages: readonly string[],
): Locale {
  if (stored !== null && hasLocale(stored)) return stored;
  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split("-")[0];
    if (hasLocale(base)) return base;
  }
  return defaultLocale;
}
