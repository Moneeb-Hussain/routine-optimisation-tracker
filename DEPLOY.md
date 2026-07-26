# Deploy — Mission USA AI

## Runtime

- Node **20+** (22 recommended)
- Host: Vercel (App Router) or any Node host that runs `next start`
- Database/Auth/Storage: Supabase

## Environment

Set these in the host (never commit secrets):

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
OPENAI_API_KEY=sk-...          # optional — rule coach/brief still work
OPENAI_MODEL=gpt-4.1-mini      # optional
```

Supabase Auth redirect: `https://your-domain.com/auth/callback`

## Database migrations (SQL Editor, in order)

1. `0001_phase1_foundation.sql`
2. `0002_phase2_admissions.sql`
3. `0003_phase2_documents.sql`
4. `0004_phase3_prep_coach.sql`
5. `0005_phase4_reminders.sql`

## Build

```bash
nvm use 22
npm ci
npm run build
npm start
```

## Vercel notes

- Framework preset: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Output: default Next.js

## Email reminders

In-app reminders work after migration `0005`. Email delivery needs Resend (or similar) + a cron worker — not wired yet. Prefs for quiet hours / max emails are saved now.

## E2E

```bash
npx playwright install chromium   # needs a supported OS/browser
npm run test:e2e
```

On older macOS, Playwright Chromium may fail to install — unit tests (`npm test`) still cover domain logic.
