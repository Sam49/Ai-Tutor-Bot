-- Supabase Schema (All-in-One)
-- Paste this entire script into Supabase SQL Editor and run once.
-- Safe to re-run (idempotent) and designed for production with RLS + triggers.

-- 0) Extensions
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- 1) Shared helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- 2) Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                  -- FK to auth.users(id)
  email citext,                  -- app expects this column
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure expected columns exist (for older installs)
alter table public.profiles
  add column if not exists user_id uuid,
  add column if not exists email citext,
  add column if not exists name text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Backfill user_id if legacy schema used id as the auth user id
update public.profiles
set user_id = id
where user_id is null and id is not null;

-- FK to auth.users(id) (if missing)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_user_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- One profile per user
create unique index if not exists profiles_user_id_unique_idx on public.profiles(user_id);
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_updated_at_idx on public.profiles(updated_at);

-- updated_at trigger
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_own') then
    drop policy "profiles_select_own" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_insert_own') then
    drop policy "profiles_insert_own" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own') then
    drop policy "profiles_update_own" on public.profiles;
  end if;
end$$;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) Chat: chat_sessions, messages
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_idx on public.chat_sessions(user_id);
create index if not exists chat_sessions_updated_at_idx on public.chat_sessions(updated_at);

drop trigger if exists chat_sessions_set_updated_at on public.chat_sessions;
create trigger chat_sessions_set_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.set_updated_at();

alter table public.chat_sessions enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='chat_sessions' and policyname='chat_sessions_select_own') then
    drop policy "chat_sessions_select_own" on public.chat_sessions;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='chat_sessions' and policyname='chat_sessions_crud_own') then
    drop policy "chat_sessions_crud_own" on public.chat_sessions;
  end if;
end$$;

create policy "chat_sessions_select_own"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "chat_sessions_crud_own"
  on public.chat_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_session_id_idx on public.messages(session_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

alter table public.messages enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_select_own') then
    drop policy "messages_select_own" on public.messages;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_crud_own') then
    drop policy "messages_crud_own" on public.messages;
  end if;
end$$;

-- Users can only access messages tied to their own sessions
create policy "messages_select_own"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_sessions cs
      where cs.id = messages.session_id and cs.user_id = auth.uid()
    )
  );

create policy "messages_crud_own"
  on public.messages for all
  using (
    exists (
      select 1 from public.chat_sessions cs
      where cs.id = messages.session_id and cs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chat_sessions cs
      where cs.id = messages.session_id and cs.user_id = auth.uid()
    )
  );

-- 4) Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists subjects_updated_at_idx on public.subjects(updated_at);

drop trigger if exists subjects_set_updated_at on public.subjects;
create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute procedure public.set_updated_at();

alter table public.subjects enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='subjects' and policyname='subjects_select_own') then
    drop policy "subjects_select_own" on public.subjects;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='subjects' and policyname='subjects_crud_own') then
    drop policy "subjects_crud_own" on public.subjects;
  end if;
end$$;

create policy "subjects_select_own"
  on public.subjects for select
  using (auth.uid() = user_id);

create policy "subjects_crud_own"
  on public.subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5) Study Sessions
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer generated always as (
    case when ended_at is not null then greatest(0, floor(extract(epoch from (ended_at - started_at)) / 60)::int) else null end
  ) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_sessions_user_id_idx on public.study_sessions(user_id);
create index if not exists study_sessions_subject_id_idx on public.study_sessions(subject_id);
create index if not exists study_sessions_started_at_idx on public.study_sessions(started_at);

drop trigger if exists study_sessions_set_updated_at on public.study_sessions;
create trigger study_sessions_set_updated_at
  before update on public.study_sessions
  for each row execute procedure public.set_updated_at();

alter table public.study_sessions enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='study_sessions' and policyname='study_sessions_select_own') then
    drop policy "study_sessions_select_own" on public.study_sessions;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='study_sessions' and policyname='study_sessions_crud_own') then
    drop policy "study_sessions_crud_own" on public.study_sessions;
  end if;
end$$;

create policy "study_sessions_select_own"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "study_sessions_crud_own"
  on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6) Quizzes
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quizzes_user_id_idx on public.quizzes(user_id);
create index if not exists quizzes_subject_id_idx on public.quizzes(subject_id);
create index if not exists quizzes_updated_at_idx on public.quizzes(updated_at);

drop trigger if exists quizzes_set_updated_at on public.quizzes;
create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute procedure public.set_updated_at();

alter table public.quizzes enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='quizzes' and policyname='quizzes_select_own') then
    drop policy "quizzes_select_own" on public.quizzes;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='quizzes' and policyname='quizzes_crud_own') then
    drop policy "quizzes_crud_own" on public.quizzes;
  end if;
end$$;

create policy "quizzes_select_own"
  on public.quizzes for select
  using (auth.uid() = user_id);

create policy "quizzes_crud_own"
  on public.quizzes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  choices jsonb,      -- optional multiple choice options
  answer text,        -- optional correct answer (if storing)
  created_at timestamptz not null default now()
);

create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);

alter table public.quiz_questions enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='quiz_questions' and policyname='quiz_questions_select_own') then
    drop policy "quiz_questions_select_own" on public.quiz_questions;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='quiz_questions' and policyname='quiz_questions_crud_own') then
    drop policy "quiz_questions_crud_own" on public.quiz_questions;
  end if;
end$$;

create policy "quiz_questions_select_own"
  on public.quiz_questions for select
  using (
    exists (select 1 from public.quizzes q where q.id = quiz_questions.quiz_id and q.user_id = auth.uid())
  );

create policy "quiz_questions_crud_own"
  on public.quiz_questions for all
  using (
    exists (select 1 from public.quizzes q where q.id = quiz_questions.quiz_id and q.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.quizzes q where q.id = quiz_questions.quiz_id and q.user_id = auth.uid())
  );

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(5,2),
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_quiz_id_idx on public.quiz_attempts(quiz_id);
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);

alter table public.quiz_attempts enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='quiz_attempts' and policyname='quiz_attempts_select_own') then
    drop policy "quiz_attempts_select_own" on public.quiz_attempts;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='quiz_attempts' and policyname='quiz_attempts_crud_own') then
    drop policy "quiz_attempts_crud_own" on public.quiz_attempts;
  end if;
end$$;

create policy "quiz_attempts_select_own"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

create policy "quiz_attempts_crud_own"
  on public.quiz_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer text,
  correct boolean,
  created_at timestamptz not null default now()
);

create index if not exists quiz_answers_attempt_id_idx on public.quiz_answers(attempt_id);

alter table public.quiz_answers enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='quiz_answers' and policyname='quiz_answers_select_own') then
    drop policy "quiz_answers_select_own" on public.quiz_answers;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='quiz_answers' and policyname='quiz_answers_crud_own') then
    drop policy "quiz_answers_crud_own" on public.quiz_answers;
  end if;
end$$;

create policy "quiz_answers_select_own"
  on public.quiz_answers for select
  using (
    exists (select 1 from public.quiz_attempts a where a.id = quiz_answers.attempt_id and a.user_id = auth.uid())
  );

create policy "quiz_answers_crud_own"
  on public.quiz_answers for all
  using (
    exists (select 1 from public.quiz_attempts a where a.id = quiz_answers.attempt_id and a.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.quiz_attempts a where a.id = quiz_answers.attempt_id and a.user_id = auth.uid())
  );

-- 7) User Settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text check (theme in ('light','dark')) default 'light',
  preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_settings_updated_at_idx on public.user_settings(updated_at);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute procedure public.set_updated_at();

alter table public.user_settings enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='user_settings' and policyname='user_settings_select_own') then
    drop policy "user_settings_select_own" on public.user_settings;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='user_settings' and policyname='user_settings_crud_own') then
    drop policy "user_settings_crud_own" on public.user_settings;
  end if;
end$$;

create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings_crud_own"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8) Optional: refresh PostgREST schema cache (helps avoid "schema cache" errors after DDL)
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then
  -- ignore if role lacks permission
  null;
end$$;
