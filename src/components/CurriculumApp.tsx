"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { CurriculumCanvas } from "@/components/graph/CurriculumCanvas";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SubjectPanel } from "@/components/panel/SubjectPanel";
import { useEmbedResize } from "@/components/useEmbedResize";
import { useProgress } from "@/components/useProgress";
import { useUrlState } from "@/components/useUrlState";
import { LensSelector } from "@/components/views/LensSelector";
import { ListView } from "@/components/views/ListView";
import { ProgressBar } from "@/components/views/ProgressBar";
import { SearchDialog } from "@/components/views/SearchDialog";
import { SubjectLinks } from "@/components/SubjectLinks";
import type { Plan } from "@/data/schema";
import { localize } from "@/i18n";
import { useDocumentTitle, useI18n } from "@/i18n/provider";
import {
  buildGraph,
  competencyCoverage,
  transitiveReduction,
} from "@/lib/graph";
import type { Layout } from "@/lib/layout/geometry";
import { shortCode, type Lens } from "@/lib/profile";
import { setStatus, type Status } from "@/lib/progress/progress";
import { buildProgressView, countAvailable } from "@/lib/progress/view";

interface Props {
  plan: Plan;
  /** Computed at build time by the server page. */
  layout: Layout;
}

const NARROW = "(max-width: 767px)";

/** False in the static HTML and during hydration, true afterwards. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useNarrowScreen(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const query = window.matchMedia(NARROW);
      query.addEventListener("change", callback);
      return () => query.removeEventListener("change", callback);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

const toolbarButton =
  "border border-[var(--ink)] px-3 py-1 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-[var(--energy)]";

export function CurriculumApp({ plan, layout }: Props) {
  const { locale, dict } = useI18n();
  useDocumentTitle(dict.app.title);
  const [url, updateUrl] = useUrlState();
  const [progressOn, setProgressOn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [progressState, setProgressState] = useProgress(plan);
  const narrow = useNarrowScreen();
  const hydrated = useHydrated();
  const root = useRef<HTMLDivElement>(null);
  useEmbedResize(url.embed, root);

  // The URL is the source of truth for what is selected; unknown ids are ignored.
  const selectedId = plan.subjects.some((s) => s.id === url.subject)
    ? url.subject
    : null;
  const lensId = plan.competencies.some((c) => c.id === url.lens)
    ? url.lens
    : null;
  const view = url.view ?? (narrow ? "list" : "graph");
  const showProgress = progressOn || url.progressCode !== null;

  const graph = useMemo(() => buildGraph(plan), [plan]);
  const edges = useMemo(
    () => (url.showAll ? graph.edges : transitiveReduction(graph)),
    [graph, url.showAll],
  );
  const progress = useMemo(
    () => (showProgress ? buildProgressView(graph, progressState) : null),
    [showProgress, graph, progressState],
  );
  const lens = useMemo<Lens | null>(() => {
    const competency = plan.competencies.find((c) => c.id === lensId);
    if (!competency) return null;
    return {
      id: competency.id,
      code: shortCode(competency.id),
      name: localize(competency.name, locale),
      coverage: new Map(
        competencyCoverage(plan, competency.id).map((e) => [
          e.subjectId,
          e.level,
        ]),
      ),
    };
  }, [plan, lensId, locale]);
  const subject = plan.subjects.find((s) => s.id === selectedId) ?? null;

  const select = (id: string | null) => updateUrl({ subject: id });
  const setLens = (id: string | null) => updateUrl({ lens: id });
  const setSubjectStatus = (id: string, status: Status) =>
    setProgressState(setStatus(progressState, id, status));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "/" && !typing && !searchOpen) {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "Escape" && !searchOpen) {
        updateUrl({ subject: null });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, updateUrl]);

  const pick = (id: string) => {
    setSearchOpen(false);
    updateUrl({ subject: id });
    // Wait for the dialog to close and the view to render before moving focus there.
    window.requestAnimationFrame(() =>
      document
        .getElementById(
          view === "list" ? `list-subject-${id}` : `subject-${id}`,
        )
        ?.focus(),
    );
  };

  return (
    <div
      ref={root}
      className={url.embed ? "flex flex-col" : "flex h-dvh flex-col"}
    >
      {!url.embed && (
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--ink)] px-4 py-2">
          <h1 className="text-base font-semibold tracking-tight md:text-lg">
            {dict.app.title}
          </h1>
          <button
            type="button"
            className={toolbarButton}
            title={dict.toolbar.searchTitle}
            onClick={() => setSearchOpen(true)}
          >
            {dict.toolbar.search}{" "}
            <kbd className="ml-1 font-mono text-xs text-[var(--ink-soft)]">
              /
            </kbd>
          </button>
          <div role="group" aria-label={dict.toolbar.view} className="flex">
            {(["graph", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => updateUrl({ view: v })}
                className={`${toolbarButton} ${v === "list" ? "-ml-px" : ""} ${view === v ? "bg-[var(--ink)] text-white hover:bg-[var(--ink)]" : ""}`}
              >
                {v === "graph" ? dict.toolbar.viewGraph : dict.toolbar.viewList}
              </button>
            ))}
          </div>
          <LensSelector plan={plan} value={lensId} onChange={setLens} />
          {/* Only meaningful on the map. The static HTML shows it where the map is the default
              (wide screens), so the toolbar does not reflow when the app takes over. */}
          <label
            className={`items-center gap-2 text-sm ${
              !hydrated
                ? "hidden md:flex"
                : view === "graph"
                  ? "flex"
                  : // In the list the control is not used, but on wide screens it keeps its
                    // space (invisible) so the toolbar does not reflow after hydration.
                    "hidden md:invisible md:flex"
            }`}
          >
            <input
              type="checkbox"
              checked={url.showAll}
              onChange={(e) => updateUrl({ showAll: e.target.checked })}
              className="size-4 accent-[var(--ink)]"
            />
            {dict.canvas.showAll}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showProgress}
              onChange={(e) => {
                setProgressOn(e.target.checked);
                if (!e.target.checked) updateUrl({ progressCode: null });
              }}
              className="size-4 accent-[var(--ink)]"
            />
            {dict.toolbar.progress}
          </label>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </header>
      )}
      <main
        className={url.embed ? "flex flex-col" : "flex min-h-0 flex-1 flex-col"}
      >
        {progress && (
          <ProgressBar
            plan={plan}
            state={progressState}
            available={countAvailable(graph, progress)}
            onReplace={setProgressState}
            incomingCode={url.progressCode}
            onDismissIncoming={() => {
              // The shared link opened the progress view; keep it open once the link is handled.
              setProgressOn(true);
              updateUrl({ progressCode: null });
            }}
          />
        )}
        <div
          className={`flex flex-col md:flex-row ${url.embed ? (view === "graph" ? "h-[720px]" : "min-h-[480px]") : "min-h-0 flex-1"}`}
        >
          {!hydrated ? (
            // The static HTML cannot know the screen width or the URL. It carries the list
            // (visible on narrow screens, and real content for search engines) and an empty
            // slot where the map goes on wide ones, so nothing moves when the app takes over.
            <>
              <div className="contents md:hidden">
                <ListView
                  plan={plan}
                  selectedId={null}
                  onSelect={select}
                  lens={null}
                  progress={null}
                  onSetStatus={setSubjectStatus}
                />
              </div>
              <div aria-hidden className="hidden min-h-0 flex-1 md:block" />
            </>
          ) : view === "graph" ? (
            <CurriculumCanvas
              plan={plan}
              graph={graph}
              edges={edges}
              layout={layout}
              selectedId={selectedId}
              onSelect={select}
              lens={lens}
              progress={progress}
            />
          ) : (
            <ListView
              plan={plan}
              selectedId={selectedId}
              onSelect={select}
              lens={lens}
              progress={progress}
              onSetStatus={setSubjectStatus}
            />
          )}
          <SubjectPanel
            plan={plan}
            graph={graph}
            subject={subject}
            onSelect={select}
            onClose={() => select(null)}
            lensId={lensId}
            onPickCompetency={setLens}
            progress={progress}
            onSetStatus={setSubjectStatus}
          />
        </div>
      </main>
      <SubjectLinks plan={plan} />
      <SearchDialog
        open={searchOpen}
        plan={plan}
        onPick={pick}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
