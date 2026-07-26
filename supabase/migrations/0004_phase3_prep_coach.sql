-- Mission USA AI — Phase 3 preparation + coaching
-- Run after 0003_phase2_documents.sql

create extension if not exists "pgcrypto";

-- Interview / preparation tracks
create table if not exists public.preparation_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  track_type text not null default 'graduate_admissions'
    check (track_type in (
      'graduate_admissions', 'professor_meeting', 'research_assistant',
      'technical', 'software_engineering', 'robotics', 'computer_vision',
      'ai_ml', 'behavioral', 'visa', 'other'
    )),
  description text not null default '',
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),
  target_date date,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists preparation_tracks_user_idx on public.preparation_tracks (user_id);

create table if not exists public.preparation_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.preparation_tracks (id) on delete cascade,
  title text not null,
  description text not null default '',
  day_number integer,
  module_label text not null default '',
  estimated_minutes integer,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'skipped')),
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  confidence_score smallint check (confidence_score between 1 and 5),
  weak_area boolean not null default false,
  notes text not null default '',
  sort_order integer not null default 0,
  last_reviewed_at timestamptz,
  next_review_at date,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists preparation_items_track_idx on public.preparation_items (track_id, sort_order);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid references public.preparation_tracks (id) on delete set null,
  question text not null,
  category text not null default 'general',
  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),
  expected_answer text not null default '',
  favorite boolean not null default false,
  needs_revision boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists question_bank_user_idx on public.question_bank (user_id);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.question_bank (id) on delete cascade,
  user_answer text not null default '',
  score smallint check (score between 0 and 100),
  confidence smallint check (confidence between 1 and 5),
  ai_feedback text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists question_attempts_q_idx on public.question_attempts (question_id, created_at desc);

-- Learning plans (lightweight)
create table if not exists public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  area text not null default 'general',
  goal text not null default '',
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),
  daily_minutes integer not null default 45,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.learning_plans (id) on delete cascade,
  title text not null,
  description text not null default '',
  day_number integer,
  estimated_minutes integer,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done', 'skipped')),
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists learning_items_plan_idx on public.learning_items (plan_id, sort_order);

-- Morning briefs (cached per day)
create table if not exists public.morning_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  brief_date date not null,
  primary_goal text not null default '',
  top_tasks jsonb not null default '[]'::jsonb,
  important_deadline text not null default '',
  follow_up_due text not null default '',
  deep_work_block text not null default '',
  interview_or_learning_action text not null default '',
  sleep_aware_workload text not null default '',
  avoid_today text not null default '',
  motivation text not null default '',
  source text not null default 'rule'
    check (source in ('rule', 'ai', 'hybrid')),
  raw_ai jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, brief_date)
);

-- Weekly reviews
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  completion_percent integer,
  must_do_rate integer,
  deep_work_hours numeric(6,2),
  sleep_average numeric(4,2),
  outreach_summary text not null default '',
  interview_summary text not null default '',
  best_day text not null default '',
  weakest_day text not null default '',
  common_blocker text not null default '',
  top_achievement text not null default '',
  next_week_priorities text not null default '',
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, week_start)
);

-- Coach conversation turns (lightweight)
create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  data_used jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists coach_messages_user_idx
  on public.coach_messages (user_id, created_at desc);

do $$
declare
  t text;
begin
  foreach t in array array[
    'preparation_tracks',
    'preparation_items',
    'question_bank',
    'question_attempts',
    'learning_plans',
    'learning_items',
    'morning_briefs',
    'weekly_reviews',
    'coach_messages'
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

alter table public.preparation_tracks enable row level security;
alter table public.preparation_items enable row level security;
alter table public.question_bank enable row level security;
alter table public.question_attempts enable row level security;
alter table public.learning_plans enable row level security;
alter table public.learning_items enable row level security;
alter table public.morning_briefs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.coach_messages enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'preparation_tracks',
    'preparation_items',
    'question_bank',
    'question_attempts',
    'learning_plans',
    'learning_items',
    'morning_briefs',
    'weekly_reviews',
    'coach_messages'
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
