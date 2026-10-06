# malla-utn-electrica

Interactive prerequisite map ("correlatividades") of **Ingeniería en Energía Eléctrica, UTN FRBA (Plan 2023)**,
with what each subject contributes to the graduate profile. Static site (Next.js `output: "export"`), bilingual
(Spanish / English), designed to be embedded in the department's website.

## Commands

```bash
pnpm dev               # development server
pnpm build             # static site in out/
pnpm lint && pnpm typecheck && pnpm test   # run before finishing any change (typecheck generates Next's route types first)
pnpm test:e2e          # Playwright (builds and serves out/; first time: pnpm exec playwright install chromium)
pnpm export:review     # writes review.csv for professors (add --semicolon for Excel in es-AR)
pnpm import:review review.csv [--dry-run]   # merges their corrections into src/data/plans/plan-2023.json
```

## Data

Everything academic lives in `src/data/` and is validated with zod at build time; invalid data fails `next build`.
Official sources are in `docs/sources/` (see its README for what each file is and what is still missing).
Nothing is invented: anything not transcribed from an official document is marked `draft` and shown with a
"Borrador" badge.

| File                                            | What                                                                                                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plans/plan-2023.json`                          | 41 subjects: levels and prerequisites (Ord. C.S. 1874); hours, block, specific competencies and syllabus (Ord. C.S. 1873, via `scripts/extract-programs.py --apply`); drafted summaries and generic-competency levels only for subjects whose professor's program was provided |
| `competencies.json`, `reserved-activities.json` | 10 generic competencies (CONFEDI), 18 specific ones, 4 reserved activities (AR) and 6 other scopes (AL), from Ord. C.S. 1873                                                                                                                                                   |
| `schedule.json`, `module-times.json`            | **2022 reference timetable** (Plan 95A) and the UTN class-hour table. Regenerate with `scripts/extract-schedule.py`                                                                                                                                                            |

### Review workflow for professors

1. `pnpm export:review --semicolon` → `review.csv` (one row per subject: summary, competencies as
   `cg-01:develops; cg-04:introduces`, reserved activities, `status`, `reviewed_by`).
2. Professors correct it in a spreadsheet. A profile marked `reviewed` needs `reviewed_by`.
3. `pnpm import:review review.csv --dry-run`, then without `--dry-run`. Nothing is written unless the whole
   sheet is valid and the plan still validates.

## URL state

The language is **not** in the path (it follows the saved choice, then the browser language, then Spanish).
Everything else is shareable through the query string:

| Parameter                  | Meaning                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `s=electrotecnia-1`        | selected subject (opens its detail)                                                 |
| `lens=cg-02`               | competency shown through the lens                                                   |
| `view=graph` / `view=list` | force a view (default: list on screens under 768 px)                                |
| `all=1`                    | draw every prerequisite instead of the reduced set                                  |
| `embed=1`                  | hide the page chrome (see below)                                                    |
| `p=<code>`                 | progress carried by a shared link; the student chooses whether to replace their own |

"Mi progreso" is stored in the browser (`localStorage`) and can be copied as a short code (about 15
characters) or as a link.

## Embedding

```html
<iframe
  id="malla"
  src="https://YOUR-HOST/?embed=1"
  title="Malla curricular"
  style="width:100%; height:720px; border:0"
  loading="lazy"
></iframe>
<script>
  // The map tells the page how tall its content is, so the frame can fit it.
  window.addEventListener("message", function (event) {
    if (event.origin !== "https://YOUR-HOST") return; // only trust the map's own origin
    var data = event.data;
    if (
      !data ||
      data.source !== "malla-utn-electrica" ||
      data.type !== "resize"
    )
      return;
    document.getElementById("malla").style.height = data.height + "px";
  });
</script>
```

Add `&lens=cg-01`, `&view=list`, `&s=…` to open it on something specific.

## Pages, SEO and publishing

Besides the map (`/`), every subject has its own static page at `/materias/<id>/`, with the profile,
prerequisites, what it unlocks and the timetable in the HTML itself (no JavaScript needed), plus title,
description, canonical URL, Open Graph / Twitter tags and schema.org `Course` data. `sitemap.xml` and
`robots.txt` are generated at build time. The home page also carries the list of subjects in its HTML.

Build-time settings (environment variables):

| Variable                | Use                                                                          |
| ----------------------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`  | origin of the published site (absolute URLs in metadata, sitemap and robots) |
| `NEXT_PUBLIC_BASE_PATH` | sub-path when it is not at the root, e.g. `/malla-utn-electrica`             |

`pnpm og:image` rebuilds `public/og.png` (the social preview) from the running site; run it after the
plan changes noticeably. `.github/workflows/` has the CI and a GitHub Pages deploy (enable it once in
_Settings → Pages → Source: GitHub Actions_); any static host can serve `out/` as is.

Measured with Lighthouse on the built site: accessibility, best practices and SEO at 100 on the map and on
subject pages; performance 98–100 on desktop and on the subject pages, 85 on the home page on a throttled phone.

## Notes

- This is a modified Next.js: read `node_modules/next/dist/docs/` before using an API (see `AGENTS.md`).
- Conventions (English code, bilingual UI, pure logic in `src/lib/`) are in `CLAUDE.md`; the plan is in `PLAN.md`.
