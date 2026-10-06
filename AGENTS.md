<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions (project name: `malla-utn-electrica`)

See `PLAN.md` for the full plan and phases. Work one phase at a time and stop for review after each.

- Code, identifiers, comments, commit messages and tests: **English**.
- **UI is bilingual: Spanish (es-AR, voseo) and English.** The URL never contains the locale (`/`, `/materias/[id]`): the language is chosen on the client (saved choice → browser language → Spanish) and toggled with the language switcher. All UI strings live in `src/i18n/es.ts` and `src/i18n/en.ts` (same keys, enforced by a test); no hardcoded copy in components. Use `useI18n()` in client components. Data text is `Localized` (`es` official, `en` optional, falls back to Spanish via `localize()`); never invent official translations.
- TypeScript `strict: true`. No `any`.
- Pure logic in `src/lib/` (no React imports), fully unit-tested. Components stay thin.
- Never invent academic data. Anything not transcribed from an official source (`docs/sources/`) is marked `status: "draft"` and rendered with a visible "borrador" badge.
- Small, reviewable commits per phase. Run `npm run lint && npm run typecheck && npm test` before finishing each phase.
- Package manager: npm (not pnpm). Static export (`output: "export"`), so no server-only Next.js features.
- Commands: see `README.md`. `npm run export:review` / `npm run import:review` use `tsx`; their logic lives in `src/lib/review/` (tested), the scripts only do I/O.
- e2e tests that use the keyboard or controlled inputs must wait for hydration after `goto` (`waitForLoadState("networkidle")`), otherwise the first keypress or click is lost.
- The URL (`src/lib/url-state.ts`, `useUrlState`) is the source of truth for selection, lens, view and embed; keep it free of the language.
- Subject pages (`src/app/materias/[id]`) get a _slice_ of the plan (`src/lib/plan-slice.ts`), never the whole plan, and share `SubjectDetail` with the map's panel. A page's `openGraph` replaces the layout's, so repeat the image there.
- The static HTML cannot know the URL or screen width: anything that depends on them must not move layout on hydration (see `useHydrated` in `CurriculumApp`). Client code must never import `src/lib/layout/layout.ts` (it pulls ELK); use `geometry.ts`.
- Plan 2023 official data comes from `docs/sources/1873.pdf` through `python3 scripts/extract-programs.py docs/sources/1873.pdf out.json --apply` (then `npm run format`); it cross-checks hours, block totals and competency counts and exits non-zero on a mismatch. The official matrix gives no competency _level_, so `level` is optional and means "contributes"; never invent one. The document disagrees with itself in two places (Sistemas de Representación hours, Inglés II level): the study plan table wins and the subject's `sources` say so.

## Single tests

- Unit (vitest, `tests/**/*.test.ts`, node env, `@` → `src`): `npx vitest run tests/url-state.test.ts` or `npx vitest run -t "name"`.
- e2e (Playwright, `e2e/*.spec.ts`): `npm run test:e2e -- e2e/smoke.spec.ts`. It runs the build and serves `out/` on port 3100 (reuses a server already running there, so rebuild if you changed code).

## Architecture

- **Data → validated plan**: `src/data/*.json` are parsed by the zod schemas in `src/data/schema.ts` and assembled by `src/data/load.ts` (`assemblePlan`), which also runs `assertValidPlan` from `src/lib/graph`. Types come from the schemas. Bad data fails `next build`.
- **`src/lib/`** is framework-free logic: `graph/` (prerequisite graph, transitive reduction, availability, chains, competency coverage, focus), `layout/` (ELK ordering in `layout.ts`; `geometry.ts` is the client-safe part), `progress/`, `review/` (CSV round-trip for professors), `url-state.ts`, `plan-slice.ts`, `search.ts`, `seo.ts`. Tests mirror these under `tests/`.
- **UI**: `src/app/page.tsx` renders `CurriculumApp` (client), which wires `useUrlState`, `useProgress` and `useI18n` to `components/graph` (React Flow canvas), `components/views` (list view, lens selector, search, progress) and `components/panel` (`SubjectDetail`, shared with `src/app/materias/[id]`). `useEmbedResize` posts height messages to the parent frame when `embed=1`.
- **i18n**: `src/i18n/{es,en}.ts` + `provider.tsx`; locale is client-side only, never in the URL.
- **Scripts** (`scripts/`): `export-review.ts` / `import-review.ts` / `og-image.ts` (tsx, I/O only), and Python extractors (`extract-programs.py`, `extract-schedule.py`) that regenerate official data from `docs/sources/`.
- **CI**: `.github/workflows/ci.yml` (checks) and `deploy.yml` (static export deploy).
