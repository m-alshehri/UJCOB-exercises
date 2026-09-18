-- tamareen / Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  unique(course_id, name)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  question text not null,
  correct_answer text not null,
  wrong_answers jsonb not null default '[]'::jsonb,
  explanation text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  source text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists questions_course_idx on public.questions(course_id);
create index if not exists questions_topic_idx on public.questions(topic_id);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  url text,
  resource_type text not null default 'reference',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  course_id uuid not null references public.courses(id) on delete cascade,
  total_questions int not null default 20,
  correct_answers int not null default 0,
  score_percent numeric(5,2) not null default 0,
  duration_seconds int,
  mode text not null default 'practice' check (mode in ('practice','exam')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists attempts_user_idx on public.attempts(user_id);
create index if not exists attempts_course_idx on public.attempts(course_id);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_answer text,
  is_correct boolean not null default false,
  answered_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

create index if not exists attempt_answers_question_idx on public.attempt_answers(question_id);

insert into public.courses (code,name) values
('BCIS 313','Programming for Business'),
('BCIS 324','Enterprise Resource Planning (ERP) Systems'),
('BCIS 317','Web, Design, Development & Management'),
('BCIS 411','Business Intelligence System'),
('BCIS 421','Business Data Analytics'),
('BCIS 311','Database Management System')
on conflict (code) do update set name=excluded.name;

alter table public.courses enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.resources enable row level security;
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

drop policy if exists "Public can read courses" on public.courses;
create policy "Public can read courses" on public.courses for select using (true);

drop policy if exists "Public can read active questions" on public.questions;
create policy "Public can read active questions" on public.questions for select using (is_active = true);

drop policy if exists "Public can read topics" on public.topics;
create policy "Public can read topics" on public.topics for select using (true);

drop policy if exists "Public can read resources" on public.resources;
create policy "Public can read resources" on public.resources for select using (true);

drop policy if exists "Users can read own attempts" on public.attempts;
create policy "Users can read own attempts" on public.attempts for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own attempts" on public.attempts;
create policy "Users can insert own attempts" on public.attempts for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own attempts" on public.attempts;
create policy "Users can update own attempts" on public.attempts for update using (auth.uid() = user_id);

drop policy if exists "Users can read own answers" on public.attempt_answers;
create policy "Users can read own answers" on public.attempt_answers for select using (
  exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid())
);

drop policy if exists "Users can insert own answers" on public.attempt_answers;
create policy "Users can insert own answers" on public.attempt_answers for insert with check (
  exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid())
);
