# Supabase Setup Guide

You have two ways to apply the DB schema: paste a single script in the SQL Editor (fastest), or manage migrations with the Supabase CLI (best for teams/CI).

## Option A — One-and-done in SQL Editor (Recommended for quick start)

1) Open your Supabase project → SQL Editor.
2) Paste the full contents of `scripts/supabase-schema.sql`.
3) Click "Run". The script is idempotent and safe to run multiple times.
4) If you previously created a different `public.profiles` shape (e.g., missing `email` or `user_id`), paste and run `scripts/patch-2025-08-29-fix-profiles.sql` next.

This creates:
- `public.profiles` (with `user_id`, `email`, RLS policies, and a SECURITY DEFINER trigger to auto-create a profile on signup),
- Subjects, Study Sessions, Progress,
- Quizzes (+ questions, attempts, answers),
- Chat (`chat_sessions`, `messages`),
- `user_settings`,
- Helpful indexes and `updated_at` triggers.

## Option B — Supabase CLI (Migrations)

If you prefer versioned migrations and CI:

- Install the CLI and initialize:
  - `supabase init`
  - `supabase login`
  - `supabase link --project-ref <project-id>`
- Create migrations and push:
  - `supabase migration new init_schema`
  - Put the SQL from `scripts/supabase-schema.sql` into the migration file.
  - `supabase db push`

See: Managing environments and migrations in the Supabase docs.

## Seeding and Linting (Optional but useful)

- Seeding: Place seed statements in `supabase/seed.sql`. They run after migrations on `supabase start` and `supabase db reset`. Great for local development data.
- Linting: Run `supabase db lint` to check for SQL issues before pushing.

## Custom Schemas (Optional hardening)

If you move tables to a custom schema (e.g., `api`):
- Create the schema and add grants/default privileges.
- Add the schema to "Exposed schemas" in Supabase API settings.

## After DB setup

- Set these env vars in your app/deployment:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Rebuild/redeploy your app.
