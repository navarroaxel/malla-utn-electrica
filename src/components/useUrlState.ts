"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseUrlState, withUrlState, type UrlState } from "@/lib/url-state";

const EVENT = "malla:urlchange";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(EVENT, callback);
  };
}

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

/** The shareable state (`?s=…&lens=…&embed=1`), kept in the query string without reloading. */
export function useUrlState(): [UrlState, (patch: Partial<UrlState>) => void] {
  const search = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const state = useMemo(() => parseUrlState(search), [search]);
  const update = useCallback((patch: Partial<UrlState>) => {
    const next = withUrlState(window.location.search, patch);
    if (next === window.location.search) return;
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${next}${window.location.hash}`,
    );
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [state, update];
}
