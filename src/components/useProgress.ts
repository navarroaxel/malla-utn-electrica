"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Plan } from "@/data/schema";
import {
  parseProgress,
  readStored,
  serializeProgress,
  writeStored,
  type ProgressState,
} from "@/lib/progress/progress";

const listeners = new Set<() => void>();
/** Keeps the choice in memory when localStorage is unavailable (private windows…). */
const memory = new Map<string, string>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/** The student's progress, persisted in localStorage and shared across tabs. */
export function useProgress(
  plan: Plan,
): [ProgressState, (next: ProgressState) => void] {
  const key = `malla.progress.${plan.id}`;
  const validIds = useMemo(
    () => new Set(plan.subjects.map((s) => s.id)),
    [plan],
  );

  const raw = useSyncExternalStore(
    subscribe,
    () => memory.get(key) ?? readStored(key) ?? "",
    () => "",
  );
  const state = useMemo(
    () => parseProgress(raw || null, validIds),
    [raw, validIds],
  );

  const update = useCallback(
    (next: ProgressState) => {
      const json = serializeProgress(next);
      memory.set(key, json);
      writeStored(key, json);
      listeners.forEach((listener) => listener());
    },
    [key],
  );
  return [state, update];
}
