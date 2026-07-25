# Architecture — Mission USA AI

## Purpose

Turn admissions goals, outreach, preparation, and daily energy into **specific next actions** — not generic motivation.

## Stack

- **App:** Next.js App Router, TypeScript (strict), Tailwind CSS, Lucide, Recharts
- **Data:** Supabase Auth + PostgreSQL + Storage + RLS (Phase 1+)
- **AI:** OpenAI Responses API + Zod structured outputs (Phase 2+)
- **Email:** Resend + React Email for reminders only (Phase 4) — never auto-send professor outreach
- **Deploy:** Vercel

## Layering

```text
UI (app/, components/)
  → Domain (lib/domain/) — scores, fit rules, sleep math
  → Services (lib/services/) — orchestration
  → Data access (lib/data/) — Supabase repositories
  → External (OpenAI, Resend, Storage)
```

UI must not embed scoring formulas. AI must not receive the entire database — retrieve only what a tool needs.

## Route groups (planned)

- Public: `/login`, `/signup`, `/onboarding`
- App shell: `/dashboard`, `/today`, `/goals`, `/tasks`, …
- Settings: `/settings/*`

## Current step

UI shell + Command Center fixtures. Persistence and auth land in the next implementation step.
