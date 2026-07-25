# Mission USA AI

**Tagline:** Your AI-powered performance and graduate-admissions operating system.

Private command center for daily execution, professor outreach, interview prep, sleep-aware planning, and the journey to funded graduate study in the United States.

## Status

**Step 1 complete:** Next.js foundation + premium Command Center UI (demo data).

| Layer | Status |
| --- | --- |
| Next.js 16 + TypeScript + Tailwind 4 | Done |
| App shell (sidebar, mobile nav, header) | Done |
| Command Center dashboard + charts | Done (fixtures) |
| Auth / Supabase / RLS | Next |
| Goals, tasks, sleep persistence | Next |
| Professor CRM / Email Studio | Phase 2 |

## Design notes

Visual language is inspired by the polished hospital-ops dashboard (KPI cards, progress rings, Recharts, calm cards) adapted for Mission USA:

- Dark navy sidebar
- Cool light workspace (not cream)
- Ocean teal brand (not purple)
- Fraunces for display headings, Geist for UI text

Demo numbers on the Command Center are **fixtures** so the UI can be reviewed before database wiring.

## Local development

Requires **Node 20+** (Node 22 recommended).

```bash
# if you use nvm
nvm use 22

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/dashboard`.

Copy `.env.example` to `.env.local` when you are ready for Supabase / OpenAI (not required for the UI preview).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint

## Product docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system shape
- [DATABASE.md](./DATABASE.md) — planned schema (Phase 1+)
- [AI-SYSTEM.md](./AI-SYSTEM.md) — AI principles and tool design
- [ROADMAP.md](./ROADMAP.md) — phased delivery

## Security

Never put `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, or `CRON_SECRET` in client code or commit them to git.
