-- Incremental, non-destructive upgrade. Existing history remains personal practice.
alter table public.attempts add column if not exists question_ids uuid[] not null default '{}';
create index if not exists attempts_user_completed_idx on public.attempts(user_id,completed_at desc);
create index if not exists attempt_answers_attempt_idx on public.attempt_answers(attempt_id);

-- Registered names are synchronized from Supabase Auth; users retain ownership RLS.
create or replace function public.sync_student_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'student_name',new.raw_user_meta_data->>'full_name','Student'),200))
 on conflict(id) do update set display_name=excluded.display_name;
 return new;
end $$;
drop trigger if exists tamareen_profile_sync on auth.users;
create trigger tamareen_profile_sync after insert or update of raw_user_meta_data on auth.users for each row execute function public.sync_student_profile();
insert into public.profiles(id,display_name)
select id,left(coalesce(raw_user_meta_data->>'student_name',raw_user_meta_data->>'full_name','Student'),200) from auth.users
on conflict(id) do nothing;

-- Only these ownership-checked functions can write quiz results.
drop policy if exists "Users can insert own attempts" on public.attempts;
drop policy if exists "Users can update own attempts" on public.attempts;
drop policy if exists "Users can insert own answers" on public.attempt_answers;

create or replace function public.start_practice_attempt(p_id uuid,p_course uuid,p_questions uuid[],p_mode text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.attempts; n integer;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_mode not in ('practice','exam') or cardinality(p_questions) not between 1 and 10 then raise exception 'Invalid attempt'; end if;
 select count(distinct id) into n from public.questions where id=any(p_questions) and course_id=p_course and is_active;
 if n<>cardinality(p_questions) then raise exception 'Invalid question selection'; end if;
 insert into public.attempts(id,user_id,course_id,total_questions,mode,question_ids)
 values(p_id,auth.uid(),p_course,n,p_mode,p_questions) on conflict(id) do nothing;
 select * into a from public.attempts where id=p_id;
 if a.user_id<>auth.uid() or a.course_id<>p_course or a.question_ids<>p_questions or a.mode<>p_mode then raise exception 'Attempt conflict'; end if;
 return jsonb_build_object('id',a.id,'started_at',a.started_at);
end $$;

create or replace function public.submit_practice_answer(p_attempt uuid,p_question uuid,p_answer text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.attempts; q public.questions; answer public.attempt_answers; n integer;
begin
 select * into a from public.attempts where id=p_attempt for update;
 if auth.uid() is null or a.id is null or a.user_id<>auth.uid() then raise exception 'Attempt not found'; end if;
 if not(p_question=any(a.question_ids)) then raise exception 'Question is not in this attempt'; end if;
 select * into answer from public.attempt_answers where attempt_id=p_attempt and question_id=p_question;
 if answer.id is null then
  if a.completed_at is not null then raise exception 'Attempt already completed'; end if;
  if a.mode='exam' and now()>a.started_at+interval '10 minutes' then raise exception 'Time is up. Finish this attempt.'; end if;
  select * into q from public.questions where id=p_question and course_id=a.course_id;
  if p_answer is null or not(p_answer=q.correct_answer or q.wrong_answers @> jsonb_build_array(p_answer)) then raise exception 'Invalid answer'; end if;
  insert into public.attempt_answers(attempt_id,question_id,selected_answer,is_correct) values(p_attempt,p_question,p_answer,p_answer=q.correct_answer) returning * into answer;
 elsif answer.selected_answer<>p_answer then raise exception 'An answer has already been submitted';
 end if;
 select count(*) into n from public.attempt_answers where attempt_id=p_attempt and is_correct;
 return jsonb_build_object('is_correct',case when a.mode='practice' then answer.is_correct else null end,'correct_answers',case when a.mode='practice' then n else null end);
end $$;

create or replace function public.finish_practice_attempt(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.attempts; n integer;
begin
 select * into a from public.attempts where id=p_attempt for update;
 if auth.uid() is null or a.id is null or a.user_id<>auth.uid() then raise exception 'Attempt not found'; end if;
 if a.completed_at is null then
  select count(*) into n from public.attempt_answers where attempt_id=p_attempt and is_correct;
  update public.attempts set correct_answers=n,score_percent=round(100.0*n/greatest(total_questions,1),2),completed_at=now(),duration_seconds=greatest(0,extract(epoch from now()-started_at)::integer) where id=p_attempt returning * into a;
 end if;
 return jsonb_build_object('correct_answers',a.correct_answers,'score_percent',a.score_percent,'total_questions',a.total_questions);
end $$;

create table if not exists public.tutor_usage(
 user_id uuid not null references auth.users(id) on delete cascade,
 bucket text not null,
 period timestamptz not null,
 requests integer not null default 1,
 primary key(user_id,bucket,period)
);
alter table public.tutor_usage enable row level security;
create or replace function public.consume_tutor_quota() returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare accepted integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.tutor_usage(user_id,bucket,period) values(auth.uid(),'minute',date_trunc('minute',now()))
 on conflict(user_id,bucket,period) do update set requests=tutor_usage.requests+1 where tutor_usage.requests<6 returning requests into accepted;
 if accepted is null then return false; end if;
 accepted=null;
 insert into public.tutor_usage(user_id,bucket,period) values(auth.uid(),'day',date_trunc('day',now()))
 on conflict(user_id,bucket,period) do update set requests=tutor_usage.requests+1 where tutor_usage.requests<60 returning requests into accepted;
 return accepted is not null;
end $$;
revoke all on function public.start_practice_attempt(uuid,uuid,uuid[],text) from public;
revoke all on function public.submit_practice_answer(uuid,uuid,text) from public;
revoke all on function public.finish_practice_attempt(uuid) from public;
revoke all on function public.consume_tutor_quota() from public;
grant execute on function public.start_practice_attempt(uuid,uuid,uuid[],text) to authenticated;
grant execute on function public.submit_practice_answer(uuid,uuid,text) to authenticated;
grant execute on function public.finish_practice_attempt(uuid) to authenticated;
grant execute on function public.consume_tutor_quota() to authenticated;
