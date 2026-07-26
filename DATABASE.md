# Database — Mission USA AI

## Migrations

Apply in order in the Supabase SQL Editor:

1. `supabase/migrations/0001_phase1_foundation.sql`
2. `supabase/migrations/0002_phase2_admissions.sql`
3. `supabase/migrations/0003_phase2_documents.sql` ← Document Vault + AI runs + storage bucket
4. `supabase/migrations/0004_phase3_prep_coach.sql` ← Interview prep, learning, morning briefs, coach
5. `supabase/migrations/0005_phase4_reminders.sql` ← In-app reminders
6. `supabase/migrations/0006_embeddings_reminders_email.sql` ← pgvector embeddings + email logs

### Auth setup reminder

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

## Phase 1 tables

| Table | Purpose |
| --- | --- |
| `profiles` | Academic profile, interests, project, achievements |
| `user_preferences` | Sleep/deep-work targets, theme |
| `goals` / `goal_milestones` | Goal tree |
| `daily_plans` | Today’s primary goal + energy |
| `tasks` | Task management |
| `focus_sessions` | Deep-work timer records |
| `sleep_logs` | Sleep & energy |

## Phase 2 tables

| Table | Purpose |
| --- | --- |
| `universities` | Programs, deadlines, funding notes |
| `professors` | CRM + outreach stage + fit fields |
| `professor_fit_analyses` | Fit score history + generic flags |
| `outreach_records` | Sent outreach log |
| `outreach_followups` | Follow-up queue |
| `email_templates` | Master email templates |
| `email_drafts` | Professor-specific drafts (manual send only) |
| `documents` / `document_versions` / `document_chunks` | Private vault |
| `ai_runs` | Validated AI outputs (briefs, etc.) |

## Phase 3 tables

| Table | Purpose |
| --- | --- |
| `preparation_tracks` / `preparation_items` | Interview prep tracks + drills |
| `question_bank` / `question_attempts` | Practice questions |
| `learning_plans` / `learning_items` | Lightweight skill plans |
| `morning_briefs` | Cached daily morning brief |
| `weekly_reviews` | Weekly retrospectives |
| `coach_messages` | Coach conversation turns |

## Phase 4 tables

| Table | Purpose |
| --- | --- |
| `reminders` | In-app (and email) reminders |
| `reminder_email_logs` | Email send audit |
| `document_chunks.embedding` | pgvector (1536) for semantic search |

## Security

- Every user-owned table has RLS enabled.
- Policies: select/insert/update/delete **own rows only** via `auth.uid()`.
- Storage bucket `documents` is private; object paths are scoped to `{user_id}/...`.
