-- Patch: Align `public.profiles` with app expectations
-- - Adds user_id (FK to auth.users), email, name, avatar_url, timestamps
-- - Backfills user_id from id if needed
-- - Replaces RLS policies to scope by user_id
-- - Updates signup trigger to insert into profiles(user_id, ...)

-- 0) Extensions (safe to re-run)
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- 1) Ensure table exists
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Ensure required columns exist
alter table public.profiles
  add column if not exists user_id uuid,
  add column if not exists email citext,
  add column if not exists name text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 3) Backfill user_id from legacy schema where id was the auth.users id
update public.profiles
set user_id = id
where user_id is null
  and id is not null;

-- 4) Add FK + unique constraint for user_id → auth.users(id)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_user_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

create unique index if not exists profiles_user_id_unique_idx on public.profiles(user_id);

-- 5) Make user_id NOT NULL now that we backfilled
alter table public.profiles
  alter column user_id set not null;

-- 6) Indexes for common lookups
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_updated_at_idx on public.profiles(updated_at);

-- 7) Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- 8) Enable RLS and (re)create policies using user_id
alter table public.profiles enable row level security;

-- Drop old policies by name if they exist (from prior setup)
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

-- 9) Auto-create profile on signup (insert using user_id/email/name/avatar_url)
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
