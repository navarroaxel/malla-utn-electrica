# PLAN.md — Interactive Curriculum Graph (UTN FRBA · Ingeniería en Energía Eléctrica)

## 0. Goal

Build a Next.js + React app that renders the degree's curriculum as an interactive
prerequisite graph ("correlatividades") and shows, for every subject, **what it
contributes to the graduate profile** (competencies, reserved professional
activities, and a plain-language summary).

Primary users: prospective students, current students planning their next term,
and the department (as a showcase on its website, embedded via iframe).

### Conventions (put these in `CLAUDE.md` too)

- Code, identifiers, comments, commit messages and tests: **English**.
- **UI copy: Spanish (es-AR, voseo) and English**, no locale in the URL (see `CLAUDE.md`). Strings live in `src/i18n/es.ts` and `en.ts`; no hardcoded copy in components.
- TypeScript `strict: true`. No `any`.
- Pure logic in `src/lib/` (no React imports), fully unit-tested. Components stay thin.
- Never invent academic data. Anything not transcribed from an official source is marked `status: "draft"` and rendered with a visible "borrador" badge.
- Small, reviewable commits per phase. Run `pnpm lint && pnpm typecheck && pnpm test` before finishing each phase.

## 1. Stack

- Next.js (App Router) with `output: "export"` (static site → GitHub Pages / Vercel / iframe in WordPress).
- React, TypeScript, Tailwind CSS.
- `@xyflow/react` (React Flow) for rendering, `elkjs` for in-column ordering.
- `zod` for data validation (schema is the single source of truth for types).
- Vitest for unit tests, Playwright for one end-to-end smoke test.
- pnpm.

## 2. Data sources (Axel provides them in `docs/sources/`)

Claude Code must transcribe from these files, not from memory:

1. **Plan de estudios Plan 2023** — UTN Ordenanza C.S. N° 1873 (subjects, levels, hours, blocks).
2. **Régimen de correlatividades Plan 2023** — Ordenanza C.S. N° 1874, Anexo I. Note the format: a single rule "para cursar y rendir" with two columns, *cursadas* and *aprobadas*. Also transcribe the special conditions at the end (Taller Interdisciplinario, Práctica Profesional Supervisada, Proyecto Final).
3. **FRBA-specific adaptations** — the regional faculty can set the level and annual/semester delivery of each subject, so FRBA's own published plan wins over other faculties' PDFs for `level` and `term`.
4. **Perfil del graduado / competencias** — the plan's graduate profile section, and CONFEDI's generic competencies (the 10 "competencias genéricas de egreso").
5. **Actividades reservadas** for Ingeniería Eléctrica (Ministerial resolution; also on the department's "Incumbencias" page).
6. (Optional, later) Plan 95 adecuado — Ord. 1026 + its equivalence table to Plan 2023, for students still on the old plan.

If a source is missing or ambiguous, stop and list exactly what is needed instead of guessing.

## 3. Data model (`src/data/schema.ts`)

```ts
import { z } from "zod";

export const CompetencyLevel = z.enum(["introduces", "develops", "consolidates"]);

export const Competency = z.object({
  id: z.string(),                 // e.g. "cg-01"
  kind: z.enum(["generic", "specific"]),
  group: z.enum(["technological", "social-political-attitudinal", "specific"]),
  name: z.string(),               // Spanish, as in the official text
  description: z.string().optional(),
  source: z.string(),             // citation, e.g. "CONFEDI 2018"
});

export const ReservedActivity = z.object({
  id: z.string(),                 // e.g. "ar-01"
  text: z.string(),
  source: z.string(),
});

export const Subject = z.object({
  id: z.string(),                 // stable kebab-case slug: "electrotecnia-1"
  number: z.number().int(),       // official number in the ordinance
  name: z.string(),
  level: z.number().int().min(1).max(6),
  term: z.enum(["annual", "first", "second", "either"]),
  hoursPerWeek: z.number().positive(),
  block: z.enum([
    "basic-sciences",
    "basic-technologies",
    "applied-technologies",
    "complementary",
  ]),
  isIntegrative: z.boolean(),     // "tronco integrador": Integración Eléctrica I, II, etc.
  isElective: z.boolean(),
  prerequisites: z.object({
    taken: z.array(z.string()),   // must have the course "cursada/regularizada"
    passed: z.array(z.string()),  // must have the final "aprobada"
  }),
  specialRule: z.string().optional(), // free-text conditions (e.g. Proyecto Final)
  profile: z.object({
    summary: z.string(),          // 1–2 sentences, plain language: "Qué te aporta"
    competencies: z.array(z.object({ id: z.string(), level: CompetencyLevel })),
    reservedActivities: z.array(z.string()), // ReservedActivity ids
    status: z.enum(["draft", "reviewed"]),
    reviewedBy: z.string().optional(),       // professor / department, once validated
  }),
  sources: z.array(z.string()),   // which documents each field was taken from
});

export const Plan = z.object({
  id: z.string(),                 // "plan-2023"
  name: z.string(),               // "Ingeniería en Energía Eléctrica — Plan 2023"
  ordinance: z.string(),          // "Ord. C.S. 1873 / 1874"
  faculty: z.literal("UTN FRBA"),
  subjects: z.array(Subject),
  competencies: z.array(Competency),
  reservedActivities: z.array(ReservedActivity),
});
export type Plan = z.infer<typeof Plan>;
```

Files:
- `src/data/plans/plan-2023.json`
- `src/data/competencies.json`, `src/data/reserved-activities.json` (shared across plans)
- `src/data/load.ts` — loads + validates with zod at build time and fails the build on error.

### Seed (to verify against Ord. 1874 — level I has no prerequisites)

Level I: Análisis Matemático I (1), Álgebra y Geometría Analítica (2), Ingeniería y Sociedad (3),
Sistemas de Representación (4), Física I (5), Química General (6), Integración Eléctrica I (7),
Fundamentos de Informática (8).

Level II examples ("cursadas" column): Física II (9) ← 1, 5 · Probabilidad y Estadística (10) ← 1, 2 ·
Electrotecnia I (11) ← 1, 2, 5 · Integración Eléctrica II (14) ← 1, 5, 7.

Use these as the first fixture for tests, then transcribe the full table.

### Generic competencies seed (verify wording against the CONFEDI document)

Technological: (1) identify, formulate and solve engineering problems; (2) conceive, design and
develop engineering projects; (3) manage, plan, execute and control projects; (4) use engineering
techniques and tools effectively; (5) contribute to technological developments and innovation.
Social, political and attitudinal: (6) work effectively in teams; (7) communicate effectively;
(8) act ethically, with professional responsibility and social commitment; (9) learn continuously
and autonomously; (10) act with an entrepreneurial attitude.

### About the profile content

The per-subject `profile` is the most valuable and the least available data. Claude Code may
**draft** `summary` and competency mappings from each subject's official objectives/syllabus
("programa analítico") if provided, always with `status: "draft"`. The department validates them
later. Build a simple review export (see Phase 7) so professors can correct drafts in a spreadsheet.

## 4. Graph logic (`src/lib/graph/`, pure functions, 100% unit-tested)

- `buildGraph(plan)` → adjacency lists, edges typed `"taken" | "passed"`.
- `validatePlan(plan)` → errors for: unknown ids, self-references, cycles, a prerequisite at a
  higher level than the subject, duplicate numbers, competency/activity ids that don't exist.
- `transitiveReduction(graph)` → edges to *display by default* (official tables often list
  redundant prerequisites; showing all of them makes the graph unreadable). Keep the full set
  for computations and behind a "Mostrar todas las correlativas" toggle.
- `ancestors(id)` / `descendants(id)` → transitive, with the strongest requirement per node
  (passed beats taken).
- `availableSubjects(progress)` → given `{ taken: Set, passed: Set }`, which subjects the
  student can enroll in now, and for each blocked subject the missing prerequisites.
- `longestChain(plan)` → the critical prerequisite path (minimum number of terms to graduate).
- `competencyCoverage(plan, competencyId)` → subjects contributing, with level, for the lens view.

## 5. UI

### Layout
- Main canvas: levels as columns (I → V/VI, left to right); within a column, ordering from
  `elkjs` to minimize crossings. Layout must be **deterministic** (same input → same positions)
  and computed at build time where possible.
- Right side panel (bottom sheet on mobile) with subject details.
- Top bar: search, plan selector (future Plan 95), lens selector, progress toggle.

### Visual direction
Ground it in the subject: draw the plan like a **single-line electrical diagram** (esquema unifilar)
on a clean white drawing sheet. Subjects are nodes, correlatividades are conductors.
Use drawing conventions to encode meaning instead of decoration: **solid line = must be passed,
dashed line = must be taken**. Block (basic sciences, technologies…) encoded by a restrained color
per block; integrative subjects get a distinct node shape. Avoid generic SaaS cards and gradients.
Make one thing memorable: the "energize" interaction below. Respect `prefers-reduced-motion`.

### Interactions
1. **Focus a subject** (click/Enter): highlight its prerequisite tree upstream and what it unlocks
   downstream; dim everything else. A short "energize" animation travels along the lines.
2. **Detail panel**: name, level, term, hours, block, prerequisites (split taken/passed), what it
   unlocks, and the **"Qué aporta a tu perfil"** section: summary, competency chips with level
   (Introduce / Desarrolla / Consolida), linked reserved activities, "borrador" badge if draft.
3. **Competency lens**: pick a competency → nodes shaded by contribution level. Answers "where in
   the degree do I learn to design projects?".
4. **Mi progreso**: mark subjects as cursada/aprobada; graph shows available, blocked (with
   missing prerequisites on hover) and done. Persist in `localStorage` (try/catch, safe on empty)
   and allow export/import as a short URL code.
5. **Search** (`/` or Ctrl+K) by name or number.
6. **Shareable state** in the URL: `?s=electrotecnia-1&lens=cg-02&embed=1`.
7. **List view**: accessible table grouped by level with the same data. Default on screens
   < 768px and toggleable everywhere. The graph is not the only way to access any information.

### Embed mode
`?embed=1` hides chrome so the department can drop it in WordPress with an `<iframe>`. Post the
content height to the parent with `postMessage` for auto-resizing (document the snippet in README).

### Accessibility
Keyboard navigation between nodes (arrow keys follow edges), visible focus, ARIA labels on nodes
("Electrotecnia I, nivel 2, requiere cursadas: …"), color never the only signal (line style and
icons too), contrast AA.

## 6. Project structure

```
src/
  app/                 # routes: "/" (graph), "/materias/[id]" (static page per subject, SEO)
  components/graph/    # CurriculumCanvas, SubjectNode, PrereqEdge
  components/panel/    # SubjectPanel, ProfileSection, CompetencyChip
  components/views/    # ListView, LensSelector, ProgressToggle, SearchDialog
  data/                # schema.ts, load.ts, plans/*.json, competencies.json, reserved-activities.json
  lib/graph/           # pure graph algorithms
  lib/progress/        # progress state, URL encode/decode
  i18n/es.ts           # all UI copy
tests/                 # vitest unit tests mirror src/lib
e2e/                   # one Playwright smoke test
docs/sources/          # official PDFs (provided by Axel)
```

The `/materias/[id]` static pages matter: each subject gets an indexable page with its profile
contribution, which fixes the department site's SEO problem for free.

## 7. Phases (do one at a time; stop for review after each)

**Phase 1 — Scaffold.** Next.js + TS strict + Tailwind + Vitest + Playwright + ESLint/Prettier,
static export, CLAUDE.md with the conventions above.
*Done when:* `pnpm build` produces `out/` and CI-style scripts pass.

**Phase 2 — Schema + seed data.** zod schema, loader, the level I–II fixture, competencies seed.
*Done when:* invalid data fails the build with a readable message.

**Phase 3 — Graph logic.** All functions from section 4 with tests (cycle, missing id, level
inversion, transitive reduction, availability with mixed taken/passed).
*Done when:* tests pass and `validatePlan` runs at build time.

**Phase 4 — Full transcription.** Transcribe all subjects and correlatividades from
`docs/sources/`, recording the source of each subject. Output a checklist of anything ambiguous.
*Done when:* full plan validates; ambiguity list delivered.

**Phase 5 — Canvas.** Deterministic layout, typed edges, focus mode, detail panel (without profile).
*Done when:* every subject is reachable by mouse and keyboard.

**Phase 6 — Graduate profile.** Profile section, competency lens, reserved activities, draft badges.
Draft profile content from syllabi if provided.
*Done when:* every subject has a profile entry (draft or reviewed).

**Phase 7 — Progress, search, list view, URL state, embed mode.** Plus a script
`pnpm export:review` that writes `review.csv` (subject, summary, competencies, status) for
professors, and `pnpm import:review` to merge their corrections back.

**Phase 8 — Polish and ship.** Static `/materias/[id]` pages with metadata/Open Graph, Lighthouse
≥ 90 on accessibility and performance, README with the iframe snippet, deploy.

## 8. Out of scope (for now)

Electives catalog details, schedules/commissions (SIGA data), Plan 95 equivalences
(prepare the schema for multiple plans, but don't build the UI yet).
