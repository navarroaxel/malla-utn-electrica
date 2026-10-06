"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  LOCALE_STORAGE_KEY,
  defaultLocale,
  detectLocale,
  getDictionary,
  type Dictionary,
  type Locale,
} from "./index";

interface I18n {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18n | null>(null);
const listeners = new Set<() => void>();

function readStored(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

const getSnapshot = (): Locale =>
  detectLocale(readStored(), navigator.languages);
const getServerSnapshot = (): Locale => defaultLocale;

/**
 * The locale is not part of the URL: the static HTML is rendered in the default locale
 * and switches on the client to the saved choice or the browser language.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the choice just won't persist.
    }
    listeners.forEach((l) => l());
  }, []);

  const value = useMemo<I18n>(
    () => ({ locale, dict: getDictionary(locale), setLocale }),
    [locale, setLocale],
  );

  useEffect(() => {
    document.documentElement.lang = locale === "es" ? "es-AR" : "en";
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Sets the tab title (and keeps it in the current language, since pages pass a localized string). */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
