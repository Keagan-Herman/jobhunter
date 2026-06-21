# JobHunter

A local-first, single-user AI job search tool. Finds relevant listings, scores them against your CV, tracks your applications, and drafts cover letters — all stored on your machine.

## Features

- **Job scanning** — fetches live listings from Adzuna and JSearch, scores each one (0-100) against your parsed CV, seniority, work style, and salary expectations
- **CV parsing** — extracts skills, experience, and projects from a PDF resume via `unpdf` + Groq
- **Cover letter generation** — context-aware drafts that reference the specific job and your background
- **Behavioral calibration** — scoring improves as you skip or apply to roles
- **Application tracking** — status, contacts, interview dates, follow-ups, notes per listing

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | SQLite + Drizzle ORM |
| AI | Groq SDK — LLaMA 3.3 70B |
| Styling | Tailwind CSS 4 |
| PDF | unpdf |
| Email | Resend |

## Setup

**Prerequisites:** Node.js 20+, API keys for Groq, Adzuna, and JSearch.

```bash
git clone https://github.com/your-username/jobhunter.git
cd jobhunter
npm install
```

Create `.env.local`:

```env
GROQ_API_KEY=
ADZUNA_APP_ID=
ADZUNA_API_KEY=
JSEARCH_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=
```

```bash
npm run dev
```

The SQLite database is created automatically at `data/jobhunter.sqlite` on first run.

## Development

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # ESLint
npm test         # Jest test suite
npx jest tests/lib/retry.test.ts  # single test file
```

## Privacy

All data — CV, job listings, application history, AI signals — stays in `data/`. The only external calls are the job APIs at scan time and Groq for AI processing.
