-- tamareen lab progress migration
create table if not exists public.lab_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lab_type text not null,
  exercise_key text not null,
  exercise_title text,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id, lab_type, exercise_key)
);
create index if not exists lab_progress_user_course_idx on public.lab_progress(user_id,course_id);
alter table public.lab_progress enable row level security;
drop policy if exists "Users can read own lab progress" on public.lab_progress;
create policy "Users can read own lab progress" on public.lab_progress for select using (auth.uid()=user_id);
drop policy if exists "Users can insert own lab progress" on public.lab_progress;
create policy "Users can insert own lab progress" on public.lab_progress for insert with check (auth.uid()=user_id);
drop policy if exists "Users can update own lab progress" on public.lab_progress;
create policy "Users can update own lab progress" on public.lab_progress for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
