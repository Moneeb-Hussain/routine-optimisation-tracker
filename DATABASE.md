# Database — Mission USA AI

## Phase 1 migration

File: `supabase/migrations/0001_phase1_foundation.sql`

### How to apply

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Paste and run the migration file.
4. Confirm Auth → Providers include Email.
5. Add redirect URL: `http://localhost:3000/auth/callback` (and production URL later).

### Tables

| Table | Purpose |
| --- | --- |
| `profiles` | Academic profile, interests, project, achievements |
| `user_preferences` | Sleep/deep-work targets, theme |
| `notification_preferences` | Reminder prefs (Phase 4) |
| `ai_preferences` | Coach prefs (Phase 3) |
| `goals` / `goal_milestones` | Goal tree |
| `daily_plans` | Today’s primary goal + energy |
| `tasks` | Task management |
| `focus_sessions` | Deep-work timer records |
| `sleep_logs` | Sleep & energy |
| `daily_reviews` / `performance_scores` | Ready for evening review |

### Security

- Every user-owned table has RLS enabled.
- Policies: select/insert/update/(delete) **own rows only** via `auth.uid()`.
- `handle_new_user` trigger creates profile + preference rows on signup (`security definer`).

### Notes

- Prefer validated text fields over brittle enums where the product may evolve.
- `updated_at` triggers run on all Phase 1 tables.
