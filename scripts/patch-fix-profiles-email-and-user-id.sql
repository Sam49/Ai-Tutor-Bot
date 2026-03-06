-- Patch: Align `public.profiles` with the app and add the missing "email" column.
-- Paste into Supabase SQL Editor and run once. Safe to re-run.

-- 0) Extensions (safe to re-run)
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- 1) Ensure table exists minimally (won't overwrite existing shape)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Add expected columns if missing
alter table public.profiles
  add column if not exists user_id uuid,
  add column if not exists email citext,
  add column if not exists name text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 3) Backfill user_id from legacy schema where id was used as auth.users(id)
update public.profiles
set user_id = id
where user_id is null
  and id is not null;

-- 4) Add FK constraint for user_id -> auth.users(id) if not present
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_user_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end$$;

-- 5) Uniqueness on user_id (one profile per user)
create unique index if not exists profiles_user_id_unique_idx on public.profiles(user_id);

-- 6) Make user_id NOT NULL now that it’s backfilled
do $$
begin
  -- Only set NOT NULL if there are no nulls left
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='profiles'
               and column_name='user_id' and is_nullable='YES') then
    if not exists (select 1 from public.profiles where user_id is null) then
      alter table public.profiles
        alter column user_id set not null;
    end if;
  end if;
end$$;

-- 7) Helpful indexes
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_updated_at_idx on public.profiles(updated_at);

-- 8) updated_at trigger function (shared)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 9) updated_at trigger for profiles
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- 10) Enable RLS and set policies scoped by user_id
alter table public.profiles enable row level security;

-- Drop old policies by name if they exist to avoid duplicates
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

-- 11) Signup trigger to auto-create profile rows with email/name/avatar
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

-- Ensure the auth.users trigger exists and points at our handler
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 12) Optional: Ask PostgREST to reload its schema cache (avoids "schema cache" errors)
-- (Supabase exposes PostgREST; notifying pgrst reloads the cached metadata)
-- Comment out if your role lacks permissions; otherwise it’s helpful after DDL changes.
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then
  -- ignore if not permitted
  null;
end$$;
