# Roadmap — Mission USA AI

## Phase 1 — Foundation

- [x] Next.js project + design system + Command Center UI
- [x] Supabase clients, proxy auth refresh, login/signup/magic/reset
- [x] Onboarding (prefilled editable profile) + goal-tree seed
- [x] Migrations + RLS
- [x] Goals, tasks, daily plans, focus sessions, sleep
- [x] Execution score domain module + unit tests
- [x] Playwright smoke suite (browser install may fail on older macOS)

## Phase 2 — Admissions intelligence

- [x] Universities CRUD
- [x] Professor CRM (kanban + table + stage updates)
- [x] Fit score calculator + generic-fit detector (+ tests)
- [x] Email templates + drafts + approve/mark-sent + follow-ups
- [x] Live Command Center pipeline / follow-ups
- [x] Document Vault + CV intelligence
- [x] AI-assisted professor briefs (OpenAI structured outputs)
- [x] PDF/DOCX automatic text extraction (mammoth + unpdf)
- [x] Keyword chunk retrieval for coach answers

## Phase 3 — Preparation and coaching

- [x] Migration 0004 (prep tracks, learning, morning briefs, coach messages)
- [x] Morning Brief (rule + optional AI polish) on Today + Command Center
- [x] Evening review → `daily_reviews`
- [x] Interview Prep tracks / items / question bank UI
- [x] Question attempt practice logging
- [x] Learning Plans lightweight UI
- [x] AI Coach with context retrieval (rule fallback + OpenAI when keyed)
- [x] Weekly review generate + notes (Analytics)

## Phase 4 — Automation and analytics

- [x] Analytics dashboard (live week charts + weekly review)
- [x] Journey to USA (goal-linked stages)
- [x] Reminders CRUD + notification prefs (migration 0005)
- [x] Embeddings + match_document_chunks (migration 0006)
- [x] Resend email + `/api/cron/reminders` (CRON_SECRET)
- [x] Study Plans from day-wise documents + tracking
- [x] CV → LLM interview questions
- [x] AI Discover (web_search universities + professors)
- [ ] Export packs

## Phase 5 — Production hardening

- [x] Deploy notes (`DEPLOY.md`)
- [ ] Rate limits / security review (deferred)
- [ ] a11y + performance pass
- [ ] Production monitoring
