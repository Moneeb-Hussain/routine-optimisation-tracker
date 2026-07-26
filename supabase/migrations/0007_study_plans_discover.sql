-- Mission USA AI — Study plan source docs + AI Discover
-- Run after 0006_embeddings_reminders_email.sql

create extension if not exists "pgcrypto";

-- Link study plans to uploaded documents
alter table public.learning_plans
  add column if not exists source_document_id uuid
    references public.documents (id) on delete set null;

alter table public.learning_plans
  alter column daily_minutes set default 60;

-- Discovery runs (profile + web search)
create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'completed'
    check (status in ('pending', 'completed', 'failed')),
  query_summary text not null default '',
  raw_ai jsonb not null default '{}'::jsonb,
  error_message text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists discovery_runs_user_idx
  on public.discovery_runs (user_id, created_at desc);

create table if not exists public.discovery_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  run_id uuid not null references public.discovery_runs (id) on delete cascade,
  kind text not null check (kind in ('university', 'professor')),
  country text not null default 'US'
    check (country in ('US', 'CA', 'Other')),
  name text not null,
  university_name text not null default '',
  department_or_lab text not null default '',
  why_fit text not null default '',
  evidence_urls jsonb not null default '[]'::jsonb,
  confidence text not null default 'medium'
    check (confidence in ('high', 'medium', 'low')),
  status text not null default 'suggested'
    check (status in ('suggested', 'imported', 'dismissed')),
  linked_university_id uuid references public.universities (id) on delete set null,
  linked_professor_id uuid references public.professors (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists discovery_recommendations_run_idx
  on public.discovery_recommendations (run_id, kind, status);

create index if not exists discovery_recommendations_user_idx
  on public.discovery_recommendations (user_id, status);

do $$
declare
  t text;
begin
  foreach t in array array['discovery_runs', 'discovery_recommendations']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at
       before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end;
$$;

alter table public.discovery_runs enable row level security;
alter table public.discovery_recommendations enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['discovery_runs', 'discovery_recommendations']
  loop
    execute format('drop policy if exists %I on public.%I', tbl || '_select_own', tbl);
    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      tbl || '_select_own', tbl
    );
    execute format('drop policy if exists %I on public.%I', tbl || '_insert_own', tbl);
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      tbl || '_insert_own', tbl
    );
    execute format('drop policy if exists %I on public.%I', tbl || '_update_own', tbl);
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tbl || '_update_own', tbl
    );
    execute format('drop policy if exists %I on public.%I', tbl || '_delete_own', tbl);
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      tbl || '_delete_own', tbl
    );
  end loop;
end;
$$;
