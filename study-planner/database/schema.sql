-- Study Planner database schema for Supabase PostgreSQL.
-- Run the whole file in Supabase Dashboard -> SQL Editor -> New query.

create extension if not exists pgcrypto;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint subjects_name_length check (char_length(trim(name)) between 1 and 80),
  constraint subjects_name_unique unique (name)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  subject_id uuid references public.subjects(id) on delete set null,
  due_date date,
  estimated_minutes integer not null default 30,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(trim(title)) between 1 and 160),
  constraint tasks_notes_length check (notes is null or char_length(notes) <= 2000),
  constraint tasks_estimated_minutes_range check (estimated_minutes between 5 and 720)
);

create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists tasks_completed_idx on public.tasks(completed);
create index if not exists tasks_subject_id_idx on public.tasks(subject_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- This MVP uses a server-side Supabase key from backend/.env.
-- Do not expose that key in the browser or commit it to GitHub.
-- RLS is enabled with no browser policies because all database requests are
-- made through the trusted backend. If you later add Supabase Auth, redesign
-- these policies and add per-user ownership before allowing client access.
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;

-- Service-role key bypasses RLS; keep it server-only and protect this API.
