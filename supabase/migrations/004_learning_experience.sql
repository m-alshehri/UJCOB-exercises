-- Additive learning features. Prior attempts and lab records are preserved.
alter table public.questions add column if not exists option_explanations jsonb not null default '{}';
alter table public.questions add column if not exists question_kind text not null default 'recall';
alter table public.questions add column if not exists content_key text;
create unique index if not exists questions_content_key_idx on public.questions(content_key) where content_key is not null;

create table if not exists public.lab_drafts (
 user_id uuid not null references auth.users(id) on delete cascade,
 lab_type text not null, exercise_key text not null,
 code text not null check(octet_length(code)<=100000),
 revision integer not null default 1, updated_at timestamptz not null default now(),
 primary key(user_id,lab_type,exercise_key),
 foreign key(lab_type,exercise_key) references public.lab_exercises(lab_type,exercise_key)
);
alter table public.lab_drafts enable row level security;
drop policy if exists "Read own drafts" on public.lab_drafts;
create policy "Read own drafts" on public.lab_drafts for select using(user_id=auth.uid());
create or replace function public.save_lab_draft(p_lab text,p_exercise text,p_code text,p_revision integer)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.lab_drafts;
begin
 if auth.uid() is null or p_revision is null or p_code is null or octet_length(p_code)>100000 then raise exception 'Invalid draft'; end if;
 insert into public.lab_drafts(user_id,lab_type,exercise_key,code) values(auth.uid(),p_lab,p_exercise,p_code)
 on conflict(user_id,lab_type,exercise_key) do update set code=excluded.code,revision=lab_drafts.revision+1,updated_at=now() where lab_drafts.revision=p_revision
 returning * into d;
 if d.user_id is null then raise exception 'Draft changed on another device. Load the cloud version before saving again.'; end if;
 return jsonb_build_object('revision',d.revision,'updated_at',d.updated_at);
end $$;
revoke all on function public.save_lab_draft(text,text,text,integer) from public;
grant execute on function public.save_lab_draft(text,text,text,integer) to authenticated;

create table if not exists public.study_groups (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null check(length(name) between 1 and 120),
 join_code text not null unique default replace(gen_random_uuid()::text,'-',''),
 created_at timestamptz not null default now()
);
create table if not exists public.group_members (
 group_id uuid not null references public.study_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 joined_at timestamptz not null default now(), primary key(group_id,user_id)
);
create table if not exists public.study_assignments (
 id uuid primary key default gen_random_uuid(), group_id uuid not null references public.study_groups(id) on delete cascade,
 title text not null check(length(title) between 1 and 160), course_id uuid not null references public.courses(id),
 kind text not null check(kind in ('practice','lab')), lab_type text, exercise_keys text[] not null default '{}',
 due_at timestamptz, created_at timestamptz not null default now(),
 check((kind='practice' and lab_type is null and cardinality(exercise_keys)=0) or (kind='lab' and lab_type is not null and cardinality(exercise_keys) between 1 and 95))
);
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.study_assignments enable row level security;
-- All classroom access goes through the authenticated API; service credentials never reach the browser.
create table if not exists public.health_events (
 id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('progress_save','quiz_save','draft_save','engine_timeout','engine_load','tutor_error','page_error')),
 page text not null check(length(page)<=60), created_at timestamptz not null default now()
);
create index if not exists health_events_time_idx on public.health_events(created_at desc);
create index if not exists health_events_user_time_idx on public.health_events(user_id,created_at desc);
alter table public.health_events enable row level security;
create or replace function public.record_health_event(p_kind text,p_page text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then return false; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if (select count(*) from public.health_events where user_id=auth.uid() and created_at>now()-interval '1 minute')>=10 then return false; end if;
 insert into public.health_events(user_id,kind,page) values(auth.uid(),p_kind,left(p_page,60));
 delete from public.health_events where created_at<now()-interval '7 days';
 return true;
end $$;
revoke all on function public.record_health_event(text,text) from public;
grant execute on function public.record_health_event(text,text) to authenticated;
notify pgrst, 'reload schema';
insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values
('python-lab','project-sales-dashboard','BCIS 313','Project: sales dashboard',30),
('python-lab','project-inventory-planner','BCIS 313','Project: inventory planner',31),
('python-lab','project-customer-invoice','BCIS 313','Project: customer invoice',32)
on conflict(lab_type,exercise_key) do nothing;
