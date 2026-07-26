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

## Email reminders + cron

1. Set in `.env.local` / Vercel:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (verified domain in Resend)
   - `CRON_SECRET` (long random string)
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)

2. Create an in-app reminder with channel **Email** or **Both**, due soon.

3. Hit cron (local test):
```bash
curl -X POST http://localhost:3000/api/cron/reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

4. On Vercel, `vercel.json` schedules `/api/cron/reminders` every 15 minutes. Also set `CRON_SECRET` and authorize Vercel Cron with the same Bearer header (or use Vercel’s `CRON_SECRET` pattern — this app expects `Authorization: Bearer $CRON_SECRET`).

## Embeddings (semantic coach search)

1. Run migration `0006_embeddings_reminders_email.sql`
2. Set `OPENAI_API_KEY` and optionally `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`
3. Upload/re-save a document or click **Re-embed for coach** on the document page
4. Ask the coach something about your CV — retrieval mode should show `embedding`


## E2E

```bash
npx playwright install chromium   # needs a supported OS/browser
npm run test:e2e
```

On older macOS, Playwright Chromium may fail to install — unit tests (`npm test`) still cover domain logic.
