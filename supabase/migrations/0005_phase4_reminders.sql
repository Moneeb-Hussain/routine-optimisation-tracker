-- Mission USA AI — Phase 4 reminders
-- Run after 0004_phase3_prep_coach.sql

create extension if not exists "pgcrypto";

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  reminder_type text not null default 'general'
    check (reminder_type in (
      'general', 'follow_up', 'deadline', 'sleep', 'interview', 'deep_work', 'application'
    )),
  due_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'dismissed', 'snoozed')),
  channel text not null default 'in_app'
    check (channel in ('in_app', 'email', 'both')),
  related_entity_type text not null default '',
  related_entity_id uuid,
  snoozed_until timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists reminders_user_due_idx
  on public.reminders (user_id, status, due_at);

drop trigger if exists set_updated_at on public.reminders;
create trigger set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

alter table public.reminders enable row level security;

drop policy if exists reminders_select_own on public.reminders;
create policy reminders_select_own on public.reminders
  for select using (auth.uid() = user_id);

drop policy if exists reminders_insert_own on public.reminders;
create policy reminders_insert_own on public.reminders
  for insert with check (auth.uid() = user_id);

drop policy if exists reminders_update_own on public.reminders;
create policy reminders_update_own on public.reminders
  for update using (auth.uid() = user_id);

drop policy if exists reminders_delete_own on public.reminders;
create policy reminders_delete_own on public.reminders
  for delete using (auth.uid() = user_id);
