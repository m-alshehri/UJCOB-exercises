begin;
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


-- Auth profile policies for registered students
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);


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

-- Stable lab identifiers. Preserve old rows; UI also recognizes legacy keys.
create table if not exists public.lab_exercises(lab_type text not null,exercise_key text not null,course_code text not null,title text not null,legacy_index integer not null,primary key(lab_type,exercise_key));
alter table public.lab_exercises enable row level security;
drop policy if exists "Public lab catalogue" on public.lab_exercises;
create policy "Public lab catalogue" on public.lab_exercises for select using(true);
insert into public.lab_exercises values('python-lab','print-a-message','BCIS 313','Print a message',0) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','arithmetic-total','BCIS 313','Arithmetic total',1) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','calculate-vat','BCIS 313','Calculate VAT',2) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','convert-minutes','BCIS 313','Convert minutes',3) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','positive-or-negative','BCIS 313','Positive or negative',4) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','pass-or-fail','BCIS 313','Pass or fail',5) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','discount-rule','BCIS 313','Discount rule',6) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','largest-of-three','BCIS 313','Largest of three',7) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','count-1-to-5','BCIS 313','Count 1 to 5',8) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','sum-1-to-10','BCIS 313','Sum 1 to 10',9) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','even-numbers','BCIS 313','Even numbers',10) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','factorial','BCIS 313','Factorial',11) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','revenue','BCIS 313','Revenue',12) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','profit','BCIS 313','Profit',13) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','commission','BCIS 313','Commission',14) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','clean-customer-name','BCIS 313','Clean customer name',15) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','email-domain','BCIS 313','Email domain',16) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','count-words','BCIS 313','Count words',17) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','mask-account','BCIS 313','Mask account',18) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','average-sales','BCIS 313','Average sales',19) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','highest-sale','BCIS 313','Highest sale',20) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','above-target','BCIS 313','Above target',21) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','remove-duplicates','BCIS 313','Remove duplicates',22) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','order-total','BCIS 313','Order total',23) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','inventory-value','BCIS 313','Inventory value',24) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','top-seller','BCIS 313','Top seller',25) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','sales-summary','BCIS 313','Sales summary',26) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','frequency-table','BCIS 313','Frequency table',27) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','customer-spend','BCIS 313','Customer spend',28) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('python-lab','moving-average','BCIS 313','Moving average',29) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','all-customers','BCIS 311','All customers',0) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','customer-names','BCIS 311','Customer names',1) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','product-catalog','BCIS 311','Product catalog',2) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','jeddah-customers','BCIS 311','Jeddah customers',3) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','expensive-products','BCIS 311','Expensive products',4) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','price-range','BCIS 311','Price range',5) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','name-begins-with-s','BCIS 311','Name begins with S',6) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','count-customers','BCIS 311','Count customers',7) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','average-price','BCIS 311','Average price',8) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','maximum-price','BCIS 311','Maximum price',9) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','total-quantity-sold','BCIS 311','Total quantity sold',10) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','customers-per-city','BCIS 311','Customers per city',11) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','products-per-category','BCIS 311','Products per category',12) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','categories-above-average-100','BCIS 311','Categories above average 100',13) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','orders-and-customers','BCIS 311','Orders and customers',14) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','order-product-details','BCIS 311','Order product details',15) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','customer-order-dates','BCIS 311','Customer order dates',16) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','order-line-value','BCIS 311','Order line value',17) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','above-average-price','BCIS 311','Above average price',18) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','customers-with-orders','BCIS 311','Customers with orders',19) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','most-expensive-products','BCIS 311','Most expensive products',20) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','unique-cities','BCIS 311','Unique cities',21) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','unique-categories','BCIS 311','Unique categories',22) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','orders-per-customer','BCIS 311','Orders per customer',23) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','revenue-by-product','BCIS 311','Revenue by product',24) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','customers-without-orders','BCIS 311','Customers without orders',25) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','insert-customer','BCIS 311','Insert customer',26) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','update-price','BCIS 311','Update price',27) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','delete-customer','BCIS 311','Delete customer',28) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('sql-lab','customer-total-spend','BCIS 311','Customer total spend',29) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('web-lab','build-a-heading','BCIS 317','Build a heading',0) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('web-lab','style-a-button','BCIS 317','Style a button',1) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('web-lab','create-a-link','BCIS 317','Create a link',2) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('web-lab','javascript-interaction','BCIS 317','JavaScript interaction',3) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('web-lab','responsive-layout','BCIS 317','Responsive layout',4) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','order-to-cash-flow','BCIS 324','Order-to-Cash Flow',0) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','procure-to-pay-flow','BCIS 324','Procure-to-Pay Flow',1) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','shared-master-data','BCIS 324','Shared Master Data',2) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','transaction-impact','BCIS 324','Transaction Impact',3) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','fit-vs-customization','BCIS 324','Fit vs Customization',4) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','change-management','BCIS 324','Change Management',5) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','erp-vs-siloed-systems','BCIS 324','ERP vs Siloed Systems',6) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','module-connection','BCIS 324','Module Connection',7) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','process-bottleneck','BCIS 324','Process Bottleneck',8) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('erp-lab','go-live-readiness','BCIS 324','Go-Live Readiness',9) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','from-data-to-decision','BCIS 411','From Data to Decision',0) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','choose-a-kpi','BCIS 411','Choose a KPI',1) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','trend-visualization','BCIS 411','Trend Visualization',2) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','category-comparison','BCIS 411','Category Comparison',3) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','historical-analysis','BCIS 411','Historical Analysis',4) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','dimension-or-measure','BCIS 411','Dimension or Measure?',5) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','descriptive-analytics','BCIS 411','Descriptive Analytics',6) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','predictive-question','BCIS 411','Predictive Question',7) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','executive-dashboard','BCIS 411','Executive Dashboard',8) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('bi-lab','drill-down','BCIS 411','Drill-down',9) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','missing-values','BCIS 421','Missing Values',0) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','train-test-separation','BCIS 421','Train/Test Separation',1) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','central-tendency','BCIS 421','Central Tendency',2) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','correlation','BCIS 421','Correlation',3) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','classification-task','BCIS 421','Classification Task',4) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','regression-task','BCIS 421','Regression Task',5) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','confusion-matrix','BCIS 421','Confusion Matrix',6) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','overfitting','BCIS 421','Overfitting',7) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','optimization-decision','BCIS 421','Optimization Decision',8) on conflict(lab_type,exercise_key) do update set title=excluded.title;
insert into public.lab_exercises values('analytics-lab','business-understanding','BCIS 421','Business Understanding',9) on conflict(lab_type,exercise_key) do update set title=excluded.title;
update public.lab_progress p set exercise_key=e.exercise_key from public.lab_exercises e where p.lab_type=e.lab_type and p.exercise_key=e.legacy_index::text and not exists(select 1 from public.lab_progress other where other.user_id=p.user_id and other.course_id=p.course_id and other.lab_type=p.lab_type and other.exercise_key=e.exercise_key);
create or replace function public.validate_lab_exercise() returns trigger language plpgsql set search_path=public,pg_temp as $$ begin if not exists(select 1 from public.lab_exercises e join public.courses c on c.code=e.course_code where e.lab_type=new.lab_type and e.exercise_key=new.exercise_key and c.id=new.course_id) then raise exception 'Unknown lab exercise';end if;return new;end $$;
drop trigger if exists lab_exercise_valid on public.lab_progress;
create trigger lab_exercise_valid before insert or update on public.lab_progress for each row execute function public.validate_lab_exercise();

notify pgrst, 'reload schema';
commit;
