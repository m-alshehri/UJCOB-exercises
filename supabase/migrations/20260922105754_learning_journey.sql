-- Extend projects and assignments without changing existing submissions.
create table if not exists public.learning_projects (
 exercise_key text primary key, course_code text not null, lab_type text not null, title text not null,
 foreign key(lab_type,exercise_key) references public.lab_exercises(lab_type,exercise_key)
);
alter table public.learning_projects enable row level security;
revoke all on public.learning_projects from anon,authenticated;
grant select on public.learning_projects to anon,authenticated;
drop policy if exists "Read project catalog" on public.learning_projects;
create policy "Read project catalog" on public.learning_projects for select using(true);

insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values('python-lab','project-sales-dashboard','BCIS 313','Sales dashboard',1000) on conflict(lab_type,exercise_key) do nothing;
insert into public.learning_projects values('project-sales-dashboard','BCIS 313','python-lab','Sales dashboard') on conflict(exercise_key) do nothing;
insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values('python-lab','project-inventory-planner','BCIS 313','Inventory planner',1001) on conflict(lab_type,exercise_key) do nothing;
insert into public.learning_projects values('project-inventory-planner','BCIS 313','python-lab','Inventory planner') on conflict(exercise_key) do nothing;
insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values('python-lab','project-customer-invoice','BCIS 313','Customer invoice',1002) on conflict(lab_type,exercise_key) do nothing;
insert into public.learning_projects values('project-customer-invoice','BCIS 313','python-lab','Customer invoice') on conflict(exercise_key) do nothing;
insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values('sql-lab','project-sales-sql','BCIS 311','SQL sales report',1003) on conflict(lab_type,exercise_key) do nothing;
insert into public.learning_projects values('project-sales-sql','BCIS 311','sql-lab','SQL sales report') on conflict(exercise_key) do nothing;
insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values('web-lab','project-storefront','BCIS 317','Accessible storefront',1004) on conflict(lab_type,exercise_key) do nothing;
insert into public.learning_projects values('project-storefront','BCIS 317','web-lab','Accessible storefront') on conflict(exercise_key) do nothing;
insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values('erp-lab','project-order-process','BCIS 324','Order-to-cash process',1005) on conflict(lab_type,exercise_key) do nothing;
insert into public.learning_projects values('project-order-process','BCIS 324','erp-lab','Order-to-cash process') on conflict(exercise_key) do nothing;
insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values('bi-lab','project-kpi-scorecard','BCIS 411','Business KPI scorecard',1006) on conflict(lab_type,exercise_key) do nothing;
insert into public.learning_projects values('project-kpi-scorecard','BCIS 411','bi-lab','Business KPI scorecard') on conflict(exercise_key) do nothing;
insert into public.lab_exercises(lab_type,exercise_key,course_code,title,legacy_index) values('analytics-lab','project-campaign-analysis','BCIS 421','Campaign performance analysis',1007) on conflict(lab_type,exercise_key) do nothing;
insert into public.learning_projects values('project-campaign-analysis','BCIS 421','analytics-lab','Campaign performance analysis') on conflict(exercise_key) do nothing;

alter table public.project_submissions drop constraint if exists project_submissions_lab_type_check;
alter table public.study_assignments drop constraint if exists study_assignments_kind_check;
alter table public.study_assignments drop constraint if exists study_assignments_check;
alter table public.study_assignments add constraint study_assignments_kind_check check(kind in ('practice','lab','project'));
alter table public.study_assignments add constraint study_assignments_check check(
 (kind='practice' and lab_type is null and cardinality(exercise_keys)=0) or
 (kind='lab' and lab_type is not null and cardinality(exercise_keys) between 1 and 95) or
 (kind='project' and lab_type is not null and cardinality(exercise_keys)=1));
alter table public.project_submissions add column if not exists assignment_id uuid references public.study_assignments(id);
create index if not exists project_submissions_assignment_idx on public.project_submissions(assignment_id,user_id,created_at desc);
alter table public.project_feedback add column if not exists outcome text not null default 'reviewed' check(outcome in ('reviewed','needs_revision','completed'));
create table if not exists public.assignment_drafts (
 user_id uuid not null references auth.users(id) on delete cascade,
 assignment_id uuid not null references public.study_assignments(id) on delete cascade,
 code text not null default '' check(octet_length(code)<=100000), reflection text not null default '' check(length(reflection)<=2000),
 revision integer not null default 1, updated_at timestamptz not null default now(), primary key(user_id,assignment_id)
);
alter table public.assignment_drafts enable row level security;
revoke all on public.assignment_drafts from anon,authenticated;
grant select on public.assignment_drafts to authenticated;
drop policy if exists "Read own assignment drafts" on public.assignment_drafts;
create policy "Read own assignment drafts" on public.assignment_drafts for select to authenticated using(user_id=(select auth.uid()));
create index if not exists assignment_drafts_assignment_idx on public.assignment_drafts(assignment_id);
create table if not exists public.notification_reads (
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null check(length(event_key) between 1 and 100), read_at timestamptz not null default now(), primary key(user_id,event_key)
);
alter table public.notification_reads enable row level security;
revoke all on public.notification_reads from anon,authenticated;
grant select,insert on public.notification_reads to authenticated;
drop policy if exists "Read own notification receipts" on public.notification_reads;
create policy "Read own notification receipts" on public.notification_reads for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "Insert own notification receipts" on public.notification_reads;
create policy "Insert own notification receipts" on public.notification_reads for insert to authenticated with check(user_id=(select auth.uid()));

create or replace function public.save_assignment_draft(p_user uuid,p_assignment uuid,p_code text,p_reflection text,p_revision integer) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare d public.assignment_drafts;
begin
 if not exists(select 1 from public.study_assignments a join public.group_members m on m.group_id=a.group_id where a.id=p_assignment and a.kind='project' and m.user_id=p_user) then raise exception 'Assignment unavailable'; end if;
 perform pg_advisory_xact_lock(hashtext(p_user::text||p_assignment::text));
 select * into d from public.assignment_drafts where user_id=p_user and assignment_id=p_assignment for update;
 if found then
  if d.revision<>p_revision then raise exception 'Draft changed on another device. Reload before saving.';end if;
  update public.assignment_drafts set code=p_code,reflection=p_reflection,revision=revision+1,updated_at=now() where user_id=p_user and assignment_id=p_assignment returning * into d;
 else
  if p_revision<>0 then raise exception 'Draft unavailable';end if;
  insert into public.assignment_drafts(user_id,assignment_id,code,reflection) values(p_user,p_assignment,p_code,p_reflection) returning * into d;
 end if;
 return to_jsonb(d);
end $$;
revoke all on function public.save_assignment_draft(uuid,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.save_assignment_draft(uuid,uuid,text,text,integer) to service_role;

drop function if exists public.submit_learning_project(uuid,uuid,uuid,text,text,text);
create or replace function public.submit_learning_project(p_id uuid,p_user uuid,p_group uuid,p_exercise text,p_code text,p_reflection text,p_assignment uuid default null) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare s public.project_submissions; p public.learning_projects; n integer;
begin
 select * into p from public.learning_projects where exercise_key=p_exercise;
 if not found then raise exception 'Unknown project'; end if;
 if p_code is null or length(trim(p_code))=0 or p_reflection is null then raise exception 'Provide work and reflection';end if;
 if p_group is not null and not exists(select 1 from public.group_members where group_id=p_group and user_id=p_user) then raise exception 'Join the group before submitting'; end if;
 if p_assignment is not null and not exists(select 1 from public.study_assignments a where a.id=p_assignment and a.group_id=p_group and a.kind='project' and a.exercise_keys=array[p_exercise]) then raise exception 'Assignment does not match project and group';end if;
 perform pg_advisory_xact_lock(hashtext(p_user::text||p_exercise));
 select * into s from public.project_submissions where id=p_id;
 if found then
  if s.user_id<>p_user or s.exercise_key<>p_exercise or s.group_id is distinct from p_group or s.assignment_id is distinct from p_assignment or s.code<>p_code or s.reflection<>p_reflection then raise exception 'Submission conflict'; end if;
  return to_jsonb(s);
 end if;
 select coalesce(max(version),0)+1 into n from public.project_submissions where user_id=p_user and exercise_key=p_exercise;
 insert into public.project_submissions(id,user_id,group_id,exercise_key,code,reflection,version,lab_type,assignment_id) values(p_id,p_user,p_group,p_exercise,p_code,p_reflection,n,p.lab_type,p_assignment) returning * into s;
 return to_jsonb(s);
end $$;
revoke all on function public.submit_learning_project(uuid,uuid,uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.submit_learning_project(uuid,uuid,uuid,text,text,text,uuid) to service_role;
grant all on public.learning_projects,public.assignment_drafts,public.notification_reads to service_role;
notify pgrst,'reload schema';
