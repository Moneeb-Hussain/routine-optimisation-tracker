-- Mission USA AI — embeddings + reminder email tracking
-- Run after 0005_phase4_reminders.sql

create extension if not exists "vector";

-- Allow 'embedded' status after vectors are written
alter table public.documents drop constraint if exists documents_embedding_status_check;
alter table public.documents
  add constraint documents_embedding_status_check
  check (embedding_status in ('pending', 'ready', 'failed', 'skipped', 'embedded'));

-- 1536 dims = OpenAI text-embedding-3-small default
alter table public.document_chunks
  add column if not exists embedding vector(1536);

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

alter table public.reminders
  add column if not exists last_notified_at timestamptz;

create table if not exists public.reminder_email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reminder_id uuid not null references public.reminders (id) on delete cascade,
  to_email text not null,
  subject text not null default '',
  status text not null default 'sent'
    check (status in ('sent', 'failed', 'skipped')),
  error_message text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists reminder_email_logs_user_idx
  on public.reminder_email_logs (user_id, created_at desc);

alter table public.reminder_email_logs enable row level security;

drop policy if exists reminder_email_logs_select_own on public.reminder_email_logs;
create policy reminder_email_logs_select_own on public.reminder_email_logs
  for select using (auth.uid() = user_id);

-- Semantic search over a user's document chunks
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_user_id uuid,
  match_count integer default 4
)
returns table (
  id uuid,
  content text,
  document_id uuid,
  document_title text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    dc.id,
    dc.content,
    dc.document_id,
    coalesce(d.title, 'Document') as document_title,
    (1 - (dc.embedding <=> query_embedding))::double precision as similarity
  from public.document_chunks dc
  left join public.documents d on d.id = dc.document_id
  where dc.user_id = match_user_id
    and dc.embedding is not null
  order by dc.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_document_chunks(vector, uuid, integer) to authenticated;
grant execute on function public.match_document_chunks(vector, uuid, integer) to service_role;
