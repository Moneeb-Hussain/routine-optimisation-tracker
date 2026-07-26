# Deploy — Mission USA AI (Vercel)

## One-shot deploy

1. Push this repo to GitHub.
2. Open [vercel.com/new](https://vercel.com/new) → Import the repo.
3. Framework: **Next.js** (set by `vercel.json`).
4. Add env vars (Production + Preview):

| Name | Required | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://YOUR_PROJECT.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `OPENAI_API_KEY` | For AI / embeddings | OpenAI key |
| `OPENAI_MODEL` | No | `gpt-4.1-mini` |
| `OPENAI_EMBEDDING_MODEL` | For semantic coach | `text-embedding-3-small` |
| `SUPABASE_SERVICE_ROLE_KEY` | For email cron | Supabase **service_role** (server only) |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | `Mission USA AI <noreply@your-verified-domain.com>` |
| `CRON_SECRET` | For email cron | Long random string |

5. Deploy.
6. Supabase Auth → URL Configuration:
   - Site URL: your Vercel URL
   - Redirect: `https://YOUR_PROJECT.vercel.app/auth/callback`

## Database (before first login)

Run in Supabase SQL Editor, in order:

1. `0001_phase1_foundation.sql`
2. `0002_phase2_admissions.sql`
3. `0003_phase2_documents.sql`
4. `0004_phase3_prep_coach.sql`
5. `0005_phase4_reminders.sql`
6. `0006_embeddings_reminders_email.sql`
7. `0007_study_plans_discover.sql` ← Study Plans + AI Discover

## What `vercel.json` does

- Framework: Next.js
- Region: `iad1`
- Cron: `/api/cron/reminders` daily at 04:00 UTC (Hobby-compatible; change to `*/15 * * * *` on Pro)

## Embeddings

1. Migration `0006` applied  
2. `OPENAI_API_KEY` + `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`  
3. Upload a doc or open it → **Re-embed for coach**  
4. `/coach` shows retrieval mode `embedding`

## Email reminders + cron

1. Set `RESEND_*`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`  
2. Create a reminder with channel **Email** or **Both**  
3. Local test:

```bash
curl -X POST http://localhost:3000/api/cron/reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Build locally

```bash
nvm use 22
npm ci
npm run build
npm start
```
