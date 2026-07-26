# Mission USA AI

**Tagline:** Your AI-powered performance and graduate-admissions operating system.

## Status

| Layer | Status |
| --- | --- |
| Next.js 16 + TypeScript + Tailwind 4 | Done |
| Command Center UI | Done |
| Supabase clients + `proxy.ts` auth refresh | Done |
| Auth (email/password, magic link, reset) | Done |
| Onboarding (prefilled editable profile) | Done |
| Phase 1 SQL + RLS | Done (apply in Supabase) |
| Goals / Tasks / Today / Focus / Sleep | Done |
| Execution score domain + Vitest | Done |
| Professor CRM / Email Studio | Phase 2 |

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

## Security notes

- RLS on every user-owned table  
- Session refresh via Next.js 16 `src/proxy.ts` + `@supabase/ssr` (`getAll` / `setAll` only)  
- Server Actions validate input with Zod  
- Secrets stay in env — never committed  
