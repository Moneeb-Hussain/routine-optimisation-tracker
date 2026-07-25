# Database — Mission USA AI

Phase 1 tables (to be migrated next):

- `profiles`, `user_preferences`, `notification_preferences`, `ai_preferences`
- `goals`, `goal_milestones`
- `daily_plans`, `tasks`, `task_dependencies`, `task_tags`
- `focus_sessions`, `daily_reviews`, `performance_scores`
- `sleep_logs`

Every user-owned row includes `user_id`. RLS: select/insert/update/delete own rows only.

Later phases add universities, professors, outreach, documents, interview prep, reminders, and AI run logs.

Full field-level design follows the product master prompt. Migrations will live under `supabase/migrations/`.
