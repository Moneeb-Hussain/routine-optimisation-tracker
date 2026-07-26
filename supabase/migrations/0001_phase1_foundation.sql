-- Mission USA AI — Phase 1 foundation
-- Run in Supabase SQL Editor or via supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles & preferences
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  degree text not null default '',
  university text not null default '',
  cgpa numeric(3,2),
  ielts_academic numeric(2,1),
  target_primary text not null default 'Funded MS or PhD opportunities in the United States',
  target_secondary text not null default 'Funded opportunities in Canada',
  target_intake text not null default '2027',
  timezone text not null default 'Asia/Karachi',
  research_interests jsonb not null default '[]'::jsonb,
  strongest_project jsonb not null default '{}'::jsonb,
  achievements jsonb not null default '[]'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text not null default 'system',
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  sleep_target_hours numeric(3,1) not null default 7.5,
  deep_work_target_minutes integer not null default 120,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  max_emails_per_day integer not null default 5,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  coach_tone text not null default 'firm_supportive',
  allow_web_research boolean not null default false,
  daily_ai_request_limit integer not null default 40,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Goals, plans, tasks, focus, sleep
-- ---------------------------------------------------------------------------

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.goals (id) on delete set null,
  title text not null,
  description text not null default '',
  horizon text not null default 'long_term'
    check (horizon in ('long_term', 'quarterly', 'monthly', 'weekly', 'daily')),
  category text not null default 'admissions',
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed', 'cancelled')),
  target_date date,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  success_criteria text not null default '',
  risks text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists goals_parent_id_idx on public.goals (parent_id);

create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists goal_milestones_goal_id_idx on public.goal_milestones (goal_id);

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_date date not null,
  primary_goal text not null default '',
  why_it_matters text not null default '',
  available_hours numeric(4,1),
  planned_start time,
  planned_end time,
  estimated_energy smallint check (estimated_energy between 1 and 5),
  important_deadline text not null default '',
  current_blocker text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, plan_date)
);

create index if not exists daily_plans_user_date_idx on public.daily_plans (user_id, plan_date desc);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  daily_plan_id uuid references public.daily_plans (id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'personal',
  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  is_must_do boolean not null default false,
  estimated_minutes integer,
  actual_minutes integer,
  due_date date,
  scheduled_date date,
  start_time time,
  end_time time,
  recurrence text,
  tags text[] not null default '{}',
  difficulty smallint check (difficulty between 1 and 5),
  energy_requirement smallint check (energy_requirement between 1 and 5),
  ai_generated boolean not null default false,
  completion_notes text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_scheduled_date_idx on public.tasks (user_id, scheduled_date);
create index if not exists tasks_status_idx on public.tasks (user_id, status);
create index if not exists tasks_must_do_idx on public.tasks (user_id, is_must_do) where is_must_do = true;

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  planned_minutes integer not null default 25,
  actual_minutes integer,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  paused_seconds integer not null default 0,
  interruption_count integer not null default 0,
  focus_quality smallint check (focus_quality between 1 and 5),
  completion_notes text not null default '',
  distraction_note text not null default '',
  status text not null default 'running'
    check (status in ('running', 'paused', 'completed', 'abandoned')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists focus_sessions_user_started_idx
  on public.focus_sessions (user_id, started_at desc);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  sleep_start timestamptz,
  wake_time timestamptz,
  duration_hours numeric(4,2),
  quality smallint check (quality between 1 and 5),
  awakenings integer not null default 0,
  energy_level smallint check (energy_level between 1 and 5),
  stress_level smallint check (stress_level between 1 and 5),
  caffeine_note text not null default '',
  exercised boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, log_date)
);

create index if not exists sleep_logs_user_date_idx on public.sleep_logs (user_id, log_date desc);

create table if not exists public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  review_date date not null,
  completed_summary text not null default '',
  incomplete_summary text not null default '',
  delay_cause text not null default '',
  focus_rating smallint check (focus_rating between 1 and 5),
  learned text not null default '',
  biggest_win text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, review_date)
);

create table if not exists public.performance_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  score_date date not null,
  total_score integer not null check (total_score between 0 and 100),
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, score_date)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'user_preferences',
    'notification_preferences',
    'ai_preferences',
    'goals',
    'goal_milestones',
    'daily_plans',
    'tasks',
    'focus_sessions',
    'sleep_logs',
    'daily_reviews',
    'performance_scores'
  ]
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

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), '')
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.ai_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.ai_preferences enable row level security;
alter table public.goals enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.daily_plans enable row level security;
alter table public.tasks enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.daily_reviews enable row level security;
alter table public.performance_scores enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- helper macro-style policies for user_id tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'user_preferences',
    'notification_preferences',
    'ai_preferences'
  ]
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
  end loop;

  foreach tbl in array array[
    'goals',
    'goal_milestones',
    'daily_plans',
    'tasks',
    'focus_sessions',
    'sleep_logs',
    'daily_reviews',
    'performance_scores'
  ]
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
