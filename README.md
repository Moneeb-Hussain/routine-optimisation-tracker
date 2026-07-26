# Mission USA AI

**Tagline:** Your AI-powered performance and graduate-admissions operating system.

## Status

| Layer | Status |
| --- | --- |
| Phase 1 foundation (auth, goals, tasks, sleep, focus) | Done |
| Phase 2 universities + Professor CRM + Email Studio | Done |
| Document Vault + CV intelligence | Done (apply migration 0003) |
| AI professor briefs (OpenAI) | Done (needs OPENAI_API_KEY) |
| Morning Brief + Coach + Interview Prep + Learning | Done (apply migration **0004**) |
| Analytics + Journey + Reminders | Done (apply migration **0005** for reminders) |
| Email cron / Resend / security pass | Later |

## Apply latest migration

In Supabase SQL Editor, run **in order** if not already applied:

1. `supabase/migrations/0001_phase1_foundation.sql`
2. `supabase/migrations/0002_phase2_admissions.sql`
3. `supabase/migrations/0003_phase2_documents.sql`
4. `supabase/migrations/0004_phase3_prep_coach.sql`
5. `supabase/migrations/0005_phase4_reminders.sql` ← **reminders**

See [DEPLOY.md](./DEPLOY.md) for hosting.

### Morning checklist (use tomorrow)

```bash
nvm use 22
npm run dev
```

1. Sign in → `/today` — Morning Brief appears automatically  
2. Set primary goal + mark must-dos  
3. `/interview-prep` — create a track → mark one Done → practice a question  
4. `/coach` — ask “What should I do in the next 90 minutes?”  
5. `/dashboard` — live score + brief  
6. `/analytics` — generate weekly review  
7. `/journey` — check stage progress  
8. `/reminders` — set a follow-up nudge  
9. Evening: save review at bottom of `/today`  
10. Optional: `/sleep` log last night so tomorrow’s brief is sleep-aware  

OpenAI is optional — rule-based brief + coach work without it. With `OPENAI_API_KEY`, refresh brief / ask coach for richer answers. PDF/DOCX uploads auto-extract when the file has text.

### Documents (Phase 2b)

After `0003`:

1. `/documents` — upload CV (txt/md/pdf/docx)
2. Open the document — paste text only if extract was empty (scanned PDF)
3. `/professors/[id]` — Generate AI research brief


## Requirements

- **Node 20+** (Node 22 recommended via `nvm use 22`)
- A Supabase project (for live auth + data)

## Setup

### 1. Install

```bash
nvm use 22
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill at least:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in client code. Keep it server-only when you need admin jobs later.

Without these keys, the app still runs in **UI preview mode** (demo dashboard fixtures). Auth forms will explain that setup is required.

### 3. Database

In the Supabase SQL Editor, run:

`supabase/migrations/0001_phase1_foundation.sql`

Add Auth redirect URL: `http://localhost:3000/auth/callback`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Suggested first path

1. `/signup` → create account  
2. `/onboarding` → confirm Moneeb profile (editable)  
3. `/today` → set primary goal  
4. `/tasks` → add must-do tasks for today  
5. `/focus` → run a session  
6. `/sleep` → log last night  
7. `/dashboard` → see live score + must-dos  

## Scripts

- `npm run dev` — development server  
- `npm run build` — production build  
- `npm run lint` — ESLint  
- `npm test` — Vitest unit tests  

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [AI-SYSTEM.md](./AI-SYSTEM.md)
- [ROADMAP.md](./ROADMAP.md)
- [DEPLOY.md](./DEPLOY.md)

## Security notes

- RLS on every user-owned table  
- Session refresh via Next.js 16 `src/proxy.ts` + `@supabase/ssr` (`getAll` / `setAll` only)  
- Server Actions validate input with Zod  
- Secrets stay in env — never committed  
