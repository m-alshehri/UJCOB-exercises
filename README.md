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

## Learning experience (2026-09-21)

Apply `supabase/learning_upgrade.sql` once to an existing installation before deploying these features. It is transactional and repeatable; `supabase/setup.sql` also includes the upgrade for fresh installs. No old attempt is deleted. The catalogue contains 636 questions (36 authored application/debugging/code questions plus 600 foundation questions) and 98 lab tasks including three Python capstones. `content/applied-questions.json` is the editable source; run `node scripts/learning-content.js` to regenerate the applied-question browser fallback and SQL. Existing content keys are immutable; corrections to already-published questions require a deliberate migration so historical answers retain meaning.

- Quiz URLs contain an owned attempt ID. Reloading resumes the first unanswered question, preserves submitted answers, and uses the original server exam start time. Expired exams finish rather than receiving another ten minutes. Unsubmitted option selections are not synchronized. Old attempts without `question_ids` remain in history but cannot resume.
- Recommendations use the latest response per distinct question. At least three distinct questions are needed to assess a topic; answers have a 30-day half-life. Under 70% weighted accuracy suggests focus; evidence older than 30 days requests review. These are transparent practice heuristics, not validated educational diagnoses.
- `/review.html` shows questions ever answered incorrectly, earlier wrong answers and option explanations. A later correct response postpones the next review seven days. Archived questions remain readable but cannot start another attempt.
- Python, SQL and Web editors save account-scoped drafts after a pause and on explicit Save. Optimistic revisions reject stale-device overwrites. Loading a cloud version explicitly replaces local editor content; unsaved local text remains recoverable in local storage while available. Drafts are capped at 100 KB. Clearing browser storage before a successful cloud save can lose local edits.
- `/projects.html` links three executable capstones. Tests are inspectable personal-practice checks. Progressive hints and visible test contracts replace automatic solution dumps in coding labs.
- `/classrooms.html` allows students to join with a random group code. `INSTRUCTOR_EMAILS` remains the server-side instructor allowlist. Only an owner may assign to their group or see its members' progress. Joining explicitly shares practice history with that instructor. A quiz assignment requires a completed practice attempt after assignment creation; lab assignments count selected exercises, including earlier completions. Due dates flag incomplete work as overdue and do not lock practice or create official grades. Group codes are shared manually; no invitations are sent.
- Browser fault reports contain a predefined category and sanitized page path, never submitted code, tutor conversation, query strings or credentials. The database retains seven days and limits ingestion to ten events per user per minute. The instructor Site health panel refreshes while open; five matching reports in the last hour raise an on-screen alert. API invocations produce structured Vercel runtime logs. This is in-app alerting, not email/push delivery or an independent uptime service; offline failures cannot be reported until connectivity returns (reports are not queued).

Accessibility additions include keyboard focus outlines, skip navigation, code input labels, visible chart-data alternatives, reduced-motion styles, and mobile layouts. The browser suite checks new pages, resume timing, review links, cloud draft loading, classroom forms and narrow-screen overflow.

## Guided learning and instructor content

- **Learning paths** (`pathways.html`) order each course's original 25 concepts into 4–5 stages. A step is ready after at least three distinct questions within 30 days and 70% accuracy. All steps stay available; the first incomplete stage is recommended. This is practice evidence, not certification.
- **Diagnostic** samples two different concepts per stage (8–10 questions), saves its purpose on the attempt, withholds immediate feedback and tutor help, and returns to the evolving path recommendation. Diagnostics resume with the same question list and purpose.
- **Spaced review** now includes every practiced question, including questions never answered incorrectly. Correct answers on separate UTC dates grow intervals through 1, 3, 7, 14 and 30 days. Same-day repeats do not grow the interval; a wrong answer makes the question due immediately. Archived versions remain readable but are not offered for new practice.
- **Lab tutor** sends the selected exercise, up to 6,000 characters of code and 2,000 characters of visible test output only when the student presses Ask for guidance. Server-owned exercise context and existing paid-API quotas apply. Three levels prompt an approach, identify a misconception, then suggest a small correction. The model is instructed not to supply complete solutions; AI guidance is not guaranteed correct. Normal practice works without the tutor.
- **Content studio** (`content-studio.html`) is restricted by the existing server-side `INSTRUCTOR_EMAILS` allowlist. It supports draft saving, safe text preview, publication, and immutable revision history. A publication archives the old question and inserts a new version; old attempts retain the original content. Revision checks reject concurrent overwrites. Fresh quiz starts fetch active questions rather than using stale cached versions. Every option needs an explanation before publishing.
- **Project submissions** (`submissions.html`) store immutable versions, code and student reflections. Students may keep a personal copy or explicitly share with a group they joined. Only the authorized owner of that group can give feedback. Three rubric dimensions (correctness, clarity, testing) use 0–4 scores for formative feedback, not official grades. A submission UUID makes retries idempotent; old versions and feedback remain accessible. Code is stored as text and never executed by the submission API.
- **Question quality** (`question-quality.html`) shows the latest completed answer per student and question, option choices, and student reports. Fewer than five learners is marked insufficient evidence. Instructors can resolve reports and revise questions; low accuracy alone is not a quality verdict.
- **Arabic/English UI** uses a persistent language toggle, browser-language default, translated navigation/forms/status labels and RTL layouts. Code editors, code samples and execution output remain LTR. Course content, original question wording and authored student/instructor text retain their source language.

Apply `supabase/migrations/20260921213225_guided_learning.sql` once to an existing database before deploying this release. The full `supabase/setup.sql` and repeatable `supabase/learning_upgrade.sql` include it. New administrative tables have RLS enabled; content and submission mutations use service-only invoker RPCs behind authenticated API authorization. Never expose the service-role key in the browser.
