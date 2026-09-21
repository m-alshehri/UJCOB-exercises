alter table public.attempts add column if not exists purpose text not null default 'practice' check(purpose in ('practice','diagnostic','review','path'));
create or replace function public.tag_practice_attempt(p_attempt uuid,p_purpose text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or p_purpose not in ('diagnostic','review','path') then raise exception 'Invalid purpose'; end if;
 update public.attempts set purpose=p_purpose where id=p_attempt and user_id=auth.uid() and completed_at is null and mode='practice';
 if not found then raise exception 'Attempt unavailable'; end if;
end $$;
revoke all on function public.tag_practice_attempt(uuid,text) from public,anon;
grant execute on function public.tag_practice_attempt(uuid,text) to authenticated;

create table if not exists public.content_drafts(
 id uuid primary key default gen_random_uuid(), question_id uuid references public.questions(id),
 payload jsonb not null, revision integer not null default 1, status text not null default 'draft' check(status in ('draft','published')),
 author_id uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
create table if not exists public.content_versions(
 id uuid primary key default gen_random_uuid(), draft_id uuid not null references public.content_drafts(id),
 revision integer not null, action text not null, payload jsonb not null, actor_id uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(draft_id,revision,action)
);
alter table public.content_drafts enable row level security;
alter table public.content_versions enable row level security;
create index if not exists content_drafts_question_idx on public.content_drafts(question_id);
create index if not exists content_versions_draft_idx on public.content_versions(draft_id,created_at desc);
-- Service-only transactional draft/publish operation. The API verifies the instructor allowlist.
create or replace function public.manage_question_draft(p_id uuid,p_revision integer,p_payload jsonb,p_actor uuid,p_publish boolean,p_question uuid default null) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare d public.content_drafts; cid uuid; tid uuid; qid uuid;
begin
 if p_id is null or p_actor is null then raise exception 'Invalid draft'; end if;
 perform pg_advisory_xact_lock(hashtext(p_id::text));
 select * into d from public.content_drafts where id=p_id for update;
 if found then
  if d.revision<>p_revision then raise exception 'Draft changed. Reload before saving.'; end if;
  update public.content_drafts set payload=p_payload, revision=revision+1, status='draft',author_id=p_actor,updated_at=now() where id=p_id returning * into d;
 else
  if p_revision<>0 then raise exception 'Draft unavailable'; end if;
  insert into public.content_drafts(id,question_id,payload,author_id) values(p_id,p_question,p_payload,p_actor) returning * into d;
 end if;
 insert into public.content_versions(draft_id,revision,action,payload,actor_id) values(d.id,d.revision,'saved',d.payload,p_actor);
 if p_publish then
  select id into cid from public.courses where code=p_payload->>'course';
  if cid is null then raise exception 'Unknown course'; end if;
  insert into public.topics(course_id,name) values(cid,p_payload->>'topic') on conflict(course_id,name) do nothing;
  select id into tid from public.topics where course_id=cid and name=p_payload->>'topic';
  -- Publishing creates a new version ID; previous answers keep their original question and explanation.
  if d.question_id is not null then
   perform 1 from public.questions where id=d.question_id and is_active for update;
   if not found then raise exception 'Question was revised elsewhere. Start from the current version.'; end if;
   update public.questions set is_active=false where id=d.question_id;
  end if;
  insert into public.questions(course_id,topic_id,question,correct_answer,wrong_answers,explanation,option_explanations,question_kind,is_active)
  values(cid,tid,p_payload->>'question',p_payload->>'correct',p_payload->'wrong',p_payload->>'explanation',p_payload->'rationales',p_payload->>'kind',true) returning id into qid;
  update public.content_drafts set question_id=qid,status='published' where id=d.id returning * into d;
  insert into public.content_versions(draft_id,revision,action,payload,actor_id) values(d.id,d.revision,'published',d.payload,p_actor);
 end if;
 return to_jsonb(d);
end $$;
revoke all on function public.manage_question_draft(uuid,integer,jsonb,uuid,boolean,uuid) from public,anon,authenticated;
grant execute on function public.manage_question_draft(uuid,integer,jsonb,uuid,boolean,uuid) to service_role;

create table if not exists public.question_reports(
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id),user_id uuid not null references auth.users(id),
 reason text not null check(reason in ('unclear','incorrect','other')),note text not null default '' check(length(note)<=1000),resolved boolean not null default false,created_at timestamptz not null default now(),unique(question_id,user_id)
);
alter table public.question_reports enable row level security;
create index if not exists question_reports_user_idx on public.question_reports(user_id);
-- Report writes are validated and rate-limited in the API; readers only see their own reports.
drop policy if exists "Read own reports" on public.question_reports;
create policy "Read own reports" on public.question_reports for select to authenticated using(user_id=(select auth.uid()));
grant select on public.question_reports to authenticated;

create table if not exists public.project_submissions(
 id uuid primary key, user_id uuid not null references auth.users(id), group_id uuid references public.study_groups(id),
 exercise_key text not null, code text not null check(octet_length(code)<=100000), reflection text not null default '' check(length(reflection)<=2000),
 version integer not null, created_at timestamptz not null default now(),lab_type text not null default 'python-lab' check(lab_type='python-lab'),
 foreign key(lab_type,exercise_key) references public.lab_exercises(lab_type,exercise_key)
);
create index if not exists project_submissions_user_idx on public.project_submissions(user_id,exercise_key,created_at desc);
create index if not exists project_submissions_group_idx on public.project_submissions(group_id,created_at desc);
alter table public.project_submissions enable row level security;
drop policy if exists "Read own submissions" on public.project_submissions;
create policy "Read own submissions" on public.project_submissions for select to authenticated using(user_id=(select auth.uid()));
grant select on public.project_submissions to authenticated;
create table if not exists public.project_feedback(
 id uuid primary key default gen_random_uuid(),submission_id uuid not null references public.project_submissions(id),instructor_id uuid not null references auth.users(id),
 feedback text not null check(length(feedback) between 1 and 4000),correctness integer not null check(correctness between 0 and 4),clarity integer not null check(clarity between 0 and 4),testing integer not null check(testing between 0 and 4),created_at timestamptz not null default now()
);
create index if not exists project_feedback_submission_idx on public.project_feedback(submission_id,created_at desc);
alter table public.project_feedback enable row level security;
drop policy if exists "Read own feedback" on public.project_feedback;
create policy "Read own feedback" on public.project_feedback for select to authenticated using(exists(select 1 from public.project_submissions s where s.id=submission_id and s.user_id=(select auth.uid())));
grant select on public.project_feedback to authenticated;
create or replace function public.submit_learning_project(p_id uuid,p_user uuid,p_group uuid,p_exercise text,p_code text,p_reflection text) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare s public.project_submissions; n integer;
begin
 if p_exercise not in ('project-sales-dashboard','project-inventory-planner','project-customer-invoice') then raise exception 'Unknown project'; end if;
 if p_group is not null and not exists(select 1 from public.group_members where group_id=p_group and user_id=p_user) then raise exception 'Join the group before submitting'; end if;
 perform pg_advisory_xact_lock(hashtext(p_user::text||p_exercise));
 select * into s from public.project_submissions where id=p_id;
 if found then
  if s.user_id<>p_user or s.exercise_key<>p_exercise or s.group_id is distinct from p_group or s.code<>p_code or s.reflection<>p_reflection then raise exception 'Submission conflict'; end if;
  return to_jsonb(s);
 end if;
 select coalesce(max(version),0)+1 into n from public.project_submissions where user_id=p_user and exercise_key=p_exercise;
 insert into public.project_submissions(id,user_id,group_id,exercise_key,code,reflection,version) values(p_id,p_user,p_group,p_exercise,p_code,p_reflection,n) returning * into s;
 return to_jsonb(s);
end $$;
revoke all on function public.submit_learning_project(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.submit_learning_project(uuid,uuid,uuid,text,text,text) to service_role;
notify pgrst,'reload schema';
-- Archived content remains visible to students whose saved attempt used that version.
drop policy if exists "Read attempted question versions" on public.questions;
create policy "Read attempted question versions" on public.questions for select to authenticated using(exists(select 1 from public.attempts a where a.user_id=(select auth.uid()) and questions.id=any(a.question_ids)));
