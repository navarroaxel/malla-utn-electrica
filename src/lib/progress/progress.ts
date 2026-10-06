export type Status = "none" | "taken" | "passed";

/** What the student has done, by subject id. "passed" implies the course was taken. */
export type ProgressState = Readonly<Record<string, "taken" | "passed">>;

export const emptyProgress: ProgressState = {};

export function statusOf(state: ProgressState, id: string): Status {
  return state[id] ?? "none";
}

export function setStatus(
  state: ProgressState,
  id: string,
  status: Status,
): ProgressState {
  const { [id]: _removed, ...rest } = state;
  void _removed;
  return status === "none" ? rest : { ...rest, [id]: status };
}

/** The sets `availableSubjects` expects: every passed subject also counts as taken. */
export function toSets(state: ProgressState): {
  taken: Set<string>;
  passed: Set<string>;
} {
  const taken = new Set<string>();
  const passed = new Set<string>();
  for (const [id, status] of Object.entries(state)) {
    taken.add(id);
    if (status === "passed") passed.add(id);
  }
  return { taken, passed };
}

export function countStatuses(state: ProgressState): {
  taken: number;
  passed: number;
} {
  const values = Object.values(state);
  return {
    taken: values.filter((s) => s === "taken").length,
    passed: values.filter((s) => s === "passed").length,
  };
}

export function serializeProgress(state: ProgressState): string {
  return JSON.stringify(state);
}

/** Tolerant: anything malformed or pointing to unknown subjects is dropped. */
export function parseProgress(
  json: string | null,
  validIds: ReadonlySet<string>,
): ProgressState {
  if (!json) return emptyProgress;
  try {
    const raw: unknown = JSON.parse(json);
    if (typeof raw !== "object" || raw === null || Array.isArray(raw))
      return emptyProgress;
    const result: Record<string, "taken" | "passed"> = {};
    for (const [id, status] of Object.entries(raw)) {
      if (validIds.has(id) && (status === "taken" || status === "passed"))
        result[id] = status;
    }
    return result;
  } catch {
    return emptyProgress;
  }
}

const VERSION = "1";
const CODE_OF: Record<Status, number> = { none: 0, taken: 1, passed: 2 };
const STATUS_OF: Status[] = ["none", "taken", "passed"];

/**
 * Short shareable code: a version character followed by base64url of 2 bits per subject,
 * in the order of `orderedIds` (the plan's subject numbers, ascending).
 */
export function encodeProgress(
  state: ProgressState,
  orderedIds: readonly string[],
): string {
  const bytes = new Uint8Array(Math.ceil((orderedIds.length * 2) / 8));
  orderedIds.forEach((id, i) => {
    bytes[i >> 2] |= CODE_OF[statusOf(state, id)] << ((i & 3) * 2);
  });
  const base64 = btoa(String.fromCharCode(...bytes));
  return (
    VERSION + base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  );
}

/** `null` when the code is not valid for this list of subjects. */
export function decodeProgress(
  code: string,
  orderedIds: readonly string[],
): ProgressState | null {
  const trimmed = code.trim();
  if (
    !trimmed.startsWith(VERSION) ||
    !/^[A-Za-z0-9_-]*$/.test(trimmed.slice(1))
  )
    return null;
  let binary: string;
  try {
    const base64 = trimmed.slice(1).replace(/-/g, "+").replace(/_/g, "/");
    binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  } catch {
    return null;
  }
  if (binary.length !== Math.ceil((orderedIds.length * 2) / 8)) return null;
  const result: Record<string, "taken" | "passed"> = {};
  for (let i = 0; i < orderedIds.length; i++) {
    const status = STATUS_OF[(binary.charCodeAt(i >> 2) >> ((i & 3) * 2)) & 3];
    if (status === undefined) return null;
    if (status !== "none") result[orderedIds[i]] = status;
  }
  return result;
}

/** Storage access that never throws (private windows, blocked site data…). */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The progress just won't persist.
  }
}
