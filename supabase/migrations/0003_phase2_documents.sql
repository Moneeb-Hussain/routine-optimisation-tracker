-- Mission USA AI — Phase 2b Document Vault
-- Run after 0002_phase2_admissions.sql

create extension if not exists "pgcrypto";

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_type text not null default 'other'
    check (document_type in (
      'cv', 'email_template', 'transcript', 'degree', 'ielts',
      'sop', 'personal_statement', 'research_statement', 'project_description',
      'certificate', 'publication', 'recommendation_letter',
      'university_requirement', 'interview_material', 'course_material',
      'notes', 'other'
    )),
  title text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  file_size_bytes integer,
  tags text[] not null default '{}',
  notes text not null default '',
  active_version integer not null default 1,
  embedding_status text not null default 'pending'
    check (embedding_status in ('pending', 'ready', 'failed', 'skipped')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_type_idx on public.documents (user_id, document_type);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  version integer not null,
  file_name text not null,
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  file_size_bytes integer,
  extracted_text text not null default '',
  change_log text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (document_id, version)
);

create index if not exists document_versions_doc_idx
  on public.document_versions (document_id, version desc);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  version_id uuid not null references public.document_versions (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_estimate integer,
  created_at timestamptz not null default timezone('utc', now()),
  unique (version_id, chunk_index)
);

create index if not exists document_chunks_doc_idx on public.document_chunks (document_id);

-- Optional AI brief cache for professors
create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null,
  request_type text not null default '',
  model text not null default '',
  prompt_version text not null default 'v1',
  output jsonb not null default '{}'::jsonb,
  referenced_entities jsonb not null default '[]'::jsonb,
  user_feedback text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_runs_user_feature_idx
  on public.ai_runs (user_id, feature, created_at desc);

do $$
declare
  t text;
begin
  foreach t in array array[
    'documents',
    'document_versions',
    'document_chunks',
    'ai_runs'
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

alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_chunks enable row level security;
alter table public.ai_runs enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'documents',
    'document_versions',
    'document_chunks',
    'ai_runs'
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

-- Private storage bucket for user documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_storage_select_own" on storage.objects;
create policy "documents_storage_select_own"
on storage.objects for select
using (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "documents_storage_insert_own" on storage.objects;
create policy "documents_storage_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "documents_storage_update_own" on storage.objects;
create policy "documents_storage_update_own"
on storage.objects for update
using (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "documents_storage_delete_own" on storage.objects;
create policy "documents_storage_delete_own"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);
