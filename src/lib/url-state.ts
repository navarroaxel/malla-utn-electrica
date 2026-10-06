export interface UrlState {
  /** Selected subject id (`s`). */
  subject: string | null;
  /** Competency shown through the lens (`lens`). */
  lens: string | null;
  /** Forced view (`view`); null = automatic by screen width. */
  view: "graph" | "list" | null;
  /** Embedded in another site (`embed=1`): hides the page chrome. */
  embed: boolean;
  /** Draw every prerequisite instead of the reduced set (`all=1`). */
  showAll: boolean;
  /** Progress code carried by a shared link (`p`). */
  progressCode: string | null;
}

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const view = params.get("view");
  return {
    subject: params.get("s") || null,
    lens: params.get("lens") || null,
    view: view === "graph" || view === "list" ? view : null,
    embed: params.get("embed") === "1",
    showAll: params.get("all") === "1",
    progressCode: params.get("p") || null,
  };
}

const KEYS: Record<keyof UrlState, string> = {
  subject: "s",
  lens: "lens",
  view: "view",
  embed: "embed",
  showAll: "all",
  progressCode: "p",
};

/** Applies `patch` to a query string, leaving unrelated parameters untouched. Returns "" or "?…". */
export function withUrlState(search: string, patch: Partial<UrlState>): string {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(patch) as [
    keyof UrlState,
    UrlState[keyof UrlState],
  ][]) {
    const name = KEYS[key];
    if (value === null || value === false || value === undefined)
      params.delete(name);
    else params.set(name, value === true ? "1" : String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}
