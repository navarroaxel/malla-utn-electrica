@AGENTS.md

# Project conventions (project name: `malla-utn-electrica`)

See `PLAN.md` for the full plan and phases. Work one phase at a time and stop for review after each.

- Code, identifiers, comments, commit messages and tests: **English**.
- **UI is bilingual: Spanish (es-AR, voseo) and English.** The URL never contains the locale (`/`, `/materias/[id]`): the language is chosen on the client (saved choice → browser language → Spanish) and toggled with the language switcher. All UI strings live in `src/i18n/es.ts` and `src/i18n/en.ts` (same keys, enforced by a test); no hardcoded copy in components. Use `useI18n()` in client components. Data text is `Localized` (`es` official, `en` optional, falls back to Spanish via `localize()`); never invent official translations.
- TypeScript `strict: true`. No `any`.
- Pure logic in `src/lib/` (no React imports), fully unit-tested. Components stay thin.
- Never invent academic data. Anything not transcribed from an official source (`docs/sources/`) is marked `status: "draft"` and rendered with a visible "borrador" badge.
- Small, reviewable commits per phase. Run `pnpm lint && pnpm typecheck && pnpm test` before finishing each phase.
- Package manager: pnpm. Static export (`output: "export"`), so no server-only Next.js features.
- Commands: see `README.md`. `pnpm export:review` / `pnpm import:review` use `tsx`; their logic lives in `src/lib/review/` (tested), the scripts only do I/O.
- e2e tests that use the keyboard or controlled inputs must wait for hydration after `goto` (`waitForLoadState("networkidle")`), otherwise the first keypress or click is lost.
- The URL (`src/lib/url-state.ts`, `useUrlState`) is the source of truth for selection, lens, view and embed; keep it free of the language.
- Subject pages (`src/app/materias/[id]`) get a _slice_ of the plan (`src/lib/plan-slice.ts`), never the whole plan, and share `SubjectDetail` with the map's panel. A page's `openGraph` replaces the layout's, so repeat the image there.
- The static HTML cannot know the URL or screen width: anything that depends on them must not move layout on hydration (see `useHydrated` in `CurriculumApp`). Client code must never import `src/lib/layout/layout.ts` (it pulls ELK); use `geometry.ts`.
- Plan 2023 official data comes from `docs/sources/1873.pdf` through `python3 scripts/extract-programs.py docs/sources/1873.pdf out.json --apply` (then `pnpm format`); it cross-checks hours, block totals and competency counts and exits non-zero on a mismatch. The official matrix gives no competency _level_, so `level` is optional and means "contributes"; never invent one. The document disagrees with itself in two places (Sistemas de Representación hours, Inglés II level): the study plan table wins and the subject's `sources` say so.
