# Tamareen

Personal learning practice for six UJ College of Business courses. Plain HTML/CSS/JavaScript, Supabase Auth/PostgreSQL, local Python/SQLite workers, and Vercel API handlers. Scores and lab completions are **personal practice**, not verified assessment results. Quiz grades are calculated in PostgreSQL, but practice answers and local lab checks remain inspectable by learners.

## Local development

Use Node 22+ and pnpm 10+.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

The local server listens on http://127.0.0.1:4173. Set `CHROME_PATH` only when intentionally using an existing Chrome executable for Playwright. API handlers require the environment variables in `.env.example`; supply them through your shell or hosting configuration (the dev server does not automatically load `.env`). Never put server secrets in browser configuration.

## Database setup / upgrade

Run **`supabase/setup.sql`** in the target project's Supabase SQL Editor as one transaction. It installs the versioned migrations and seeds content. Repeating setup preserves question IDs, existing answers and existing progress. It does not delete duplicate historical questions or student activity. Existing numeric lab keys are mapped to stable IDs; legacy duplicates remain readable without being counted twice.

**Coordinate migration with release:** the new UI requires the new RPCs. Migration removes direct quiz-write policies, so an old open page cannot continue saving through the old endpoints afterward. Apply the migration during the release window, promote the verified deployment, and have active learners refresh. Do not run the base migration alone. Rollback must restore both the previous app and its write policies; use your normal database backup/restore procedure if a full rollback is necessary.

- `supabase/migrations/001_base.sql`: original tables and ownership policies.
- `002_reliable_practice.sql`: profile synchronization, server-calculated quiz results, idempotency, exam deadline, persistent tutor quota.
- `003_lab_catalog.sql`: stable lab identifiers and validation.
- `schema.sql`: complete schema without question seeding.
- `seed_questions.sql`: repeatable question/topic seed.

The database tests use an isolated PostgreSQL-compatible PGlite instance, with two users and actual RLS policies. They do not connect to production.

## Hosting and authentication

Connect this repository to the existing Vercel project. `vercel.json` declares the static build output, course-route rewrites, and response headers. Vercel deploys the root `api/` handlers. Set:

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (or legacy `SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`, `INSTRUCTOR_EMAILS` for instructor analytics
- `OPENAI_API_KEY`, optional `OPENAI_MODEL` for tutoring

Set Supabase Auth's Site URL and allowed redirect URLs for the production domain and the specific preview domains being tested. Required destinations include `/login.html` (confirmation and recovery) and `/dashboard.html`. Do not allow arbitrary third-party redirect origins. The login page accepts only same-origin return paths. Password reset uses an emailed recovery link. Profile names are synchronized by an Auth database trigger.

Tutor requests require a valid student session and an owned practice question. The persistent limit is six requests per minute and 60 per day per account; missing quota infrastructure fails closed. Vercel or OpenAI project-level spend limits remain an operational setting.

## Code layout

- `js/shared.js`: single Supabase client, session checks, safe output, pagination, request/error helpers.
- `js/shell.js`: shared header/footer, navigation, account state, keyboard access.
- `js/progress.js`: checked completion writes with explicit retry states.
- `js/lab-content.js`: exercise definitions with **permanent IDs** and legacy mappings.
- `js/catalog.js`: course links and completion totals derived from those definitions.
- `js/*-lab.js`, `js/index.js`, `js/dashboard.js`: page controllers.
- `workers/`: bounded Python/SQLite execution outside the UI thread.
- `lib/server.js`, `api/`: server authentication, pagination, tutor and instructor analytics.
- `styles/`: readable page styling and shared interface rules.

Preserve exercise IDs and `legacyIndex` values when editing or reordering exercises. After changing content, run `node scripts/generate-database.cjs` and review the generated migration/seed diff. The generated catalogue derives its totals from content. Question topics are seeded from the source concept names; existing manually tagged topics are preserved.

Course and topic dashboard statistics cover all completed attempts; the displayed history lists the latest 30. Adaptive practice intentionally uses the latest 30 practice attempts for that course. Lab completion is self-reported after browser checks. Python/SQL drafts are stored locally per account and exercise; they do not sync between devices. An unfinished quiz is not resumed by Continue Learning.

## Verification

GitHub Actions runs unit/database tests, the static build/syntax checks, and Playwright browser regressions. Browser tests intercept all Supabase traffic with isolated fixtures. They cover routing/auth, duplicate quiz submission, rendered Web Lab checks, save failure, Python execution, SQL HTML injection, and dashboard empty states.

`TAMAREEN_TEST_FIXTURE=1 PORT=4174 pnpm dev` enables the local manual-test fixture. It is never copied into the production output and cannot be enabled by a production URL parameter.
