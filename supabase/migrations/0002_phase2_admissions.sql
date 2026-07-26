-- Mission USA AI — Phase 2 admissions intelligence
-- Run in Supabase SQL Editor after 0001_phase1_foundation.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Universities
-- ---------------------------------------------------------------------------

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  state_or_province text not null default '',
  country text not null default 'United States',
  institution_type text not null default 'public'
    check (institution_type in ('public', 'private', 'other')),
  department text not null default '',
  program text not null default '',
  program_url text not null default '',
  application_url text not null default '',
  deadline date,
  minimum_gpa numeric(3,2),
  english_requirement text not null default '',
  funding_notes text not null default '',
  application_fee numeric(10,2),
  notes text not null default '',
  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),
  application_status text not null default 'researching'
    check (application_status in (
      'researching', 'shortlisted', 'preparing', 'submitted',
      'interview', 'accepted', 'rejected', 'withdrawn'
    )),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists universities_user_id_idx on public.universities (user_id);

-- ---------------------------------------------------------------------------
-- Professors
-- ---------------------------------------------------------------------------

create table if not exists public.professors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  university_id uuid references public.universities (id) on delete set null,
  full_name text not null,
  academic_rank text not null default '',
  department text not null default '',
  email text not null default '',
  faculty_profile_url text not null default '',
  lab_name text not null default '',
  lab_url text not null default '',
  google_scholar_url text not null default '',
  research_interests text[] not null default '{}',
  current_projects text not null default '',
  relevant_papers text not null default '',
  recruitment_status text not null default 'unknown'
    check (recruitment_status in (
      'unknown', 'open', 'maybe', 'not_recruiting', 'closed'
    )),
  funding_evidence text not null default '',
  last_verified_at date,
  source_urls text[] not null default '{}',
  personal_notes text not null default '',
  fit_score numeric(5,2),
  fit_category text not null default 'insufficient_evidence'
    check (fit_category in (
      'exceptional', 'strong', 'promising', 'borderline', 'weak', 'insufficient_evidence'
    )),
  generic_fit_warning boolean not null default false,
  contact_priority text not null default 'medium'
    check (contact_priority in ('critical', 'high', 'medium', 'low')),
  recommended_email_angle text not null default '',
  risks text not null default '',
  ai_analysis text not null default '',
  manual_rating smallint check (manual_rating between 1 and 5),
  outreach_stage text not null default 'Discovered',
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists professors_user_id_idx on public.professors (user_id);
create index if not exists professors_university_id_idx on public.professors (university_id);
create index if not exists professors_stage_idx on public.professors (user_id, outreach_stage);
create index if not exists professors_fit_score_idx on public.professors (user_id, fit_score desc nulls last);

create table if not exists public.professor_fit_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  professor_id uuid not null references public.professors (id) on delete cascade,
  research_fit numeric(5,2) not null default 0,
  funding_activity numeric(5,2) not null default 0,
  competitiveness numeric(5,2) not null default 0,
  response_probability numeric(5,2) not null default 0,
  evidence_quality numeric(5,2) not null default 0,
  total_score numeric(5,2) not null default 0,
  fit_category text not null,
  generic_flags jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  summary text not null default '',
  recommended_action text not null default '',
  sources jsonb not null default '[]'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists professor_fit_analyses_prof_idx
  on public.professor_fit_analyses (professor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Outreach + follow-ups
-- ---------------------------------------------------------------------------

create table if not exists public.outreach_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  professor_id uuid not null references public.professors (id) on delete cascade,
  university_id uuid references public.universities (id) on delete set null,
  stage text not null default 'Discovered',
  subject text not null default '',
  body_plain text not null default '',
  sent_at timestamptz,
  follow_up_due_on date,
  response_received_at timestamptz,
  response_summary text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists outreach_records_user_idx on public.outreach_records (user_id);
create index if not exists outreach_records_followup_idx
  on public.outreach_records (user_id, follow_up_due_on)
  where follow_up_due_on is not null;

create table if not exists public.outreach_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  professor_id uuid not null references public.professors (id) on delete cascade,
  outreach_record_id uuid references public.outreach_records (id) on delete set null,
  due_on date not null,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'snoozed', 'cancelled')),
  notes text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists outreach_followups_due_idx
  on public.outreach_followups (user_id, due_on, status);

-- ---------------------------------------------------------------------------
-- Email templates + drafts
-- ---------------------------------------------------------------------------

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  subject_options text[] not null default '{}',
  body_plain text not null,
  version integer not null default 1,
  is_primary boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_templates_user_idx on public.email_templates (user_id);

create table if not exists public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  professor_id uuid not null references public.professors (id) on delete cascade,
  template_id uuid references public.email_templates (id) on delete set null,
  subject text not null default '',
  body_plain text not null default '',
  status text not null default 'draft'
    check (status in (
      'draft', 'ready_for_review', 'approved', 'sent', 'archived'
    )),
  quality_notes text not null default '',
  factual_claims jsonb not null default '[]'::jsonb,
  approved_at timestamptz,
  sent_at timestamptz,
  follow_up_due_on date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_drafts_user_idx on public.email_drafts (user_id);
create index if not exists email_drafts_professor_idx on public.email_drafts (professor_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'universities',
    'professors',
    'professor_fit_analyses',
    'outreach_records',
    'outreach_followups',
    'email_templates',
    'email_drafts'
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
-- RLS
-- ---------------------------------------------------------------------------

alter table public.universities enable row level security;
alter table public.professors enable row level security;
alter table public.professor_fit_analyses enable row level security;
alter table public.outreach_records enable row level security;
alter table public.outreach_followups enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_drafts enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'universities',
    'professors',
    'professor_fit_analyses',
    'outreach_records',
    'outreach_followups',
    'email_templates',
    'email_drafts'
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
