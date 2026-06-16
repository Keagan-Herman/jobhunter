# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # Run ESLint
npm test           # Run all tests (Jest)
```

Run a single test file:
```bash
npx jest tests/lib/retry.test.ts
```

## Architecture

**JobHunter** is a Next.js 16 App Router application — a local-first, single-user AI job search tool.

### Routing & Middleware

- `proxy.ts` acts as Next.js middleware (replaces `middleware.ts`) — keep its matcher patterns in sync with actual routes. Do not add auth logic here without care.

### Database

- SQLite via `better-sqlite3` + Drizzle ORM. The DB file lives at `data/jobhunter.sqlite`.
- Schema defined in `lib/db/schema.ts`. The database is auto-initialized via `initDb()` in `lib/db/index.ts` using raw `CREATE TABLE IF NOT EXISTS` SQL — schema changes require manual `ALTER TABLE` or deleting the `.sqlite` file.
- Single user hardcoded as `local-user` (`lib/db/user.ts`).
- **Naming**: DB columns and API payloads use `snake_case`; React state and TypeScript variables use `camelCase`.

### AI Integration

- All AI calls go through `lib/groq.ts` (Groq SDK, LLaMA 3.3 70B).
- API routes enforce "JSON-only, no markdown" in prompts, then sanitize with `.replace(/```json|```/g, '')` before `JSON.parse`.
- `lib/retry.ts` (exponential backoff), `lib/timeout.ts` (~10–15s cap), `lib/cache.ts` (checks `jobs` table before API call).

## Fragile Areas

- **`lib/db/index.ts` `initDb()`**: Raw SQL schema bootstrap — any new table must be added here manually.
- **`lib/profile.ts`**: Keyword regex for seniority/work style detection — sensitive to wording changes.
- **Tests**: TESTING.md references mocking Supabase (pre-migration). Mock the Drizzle client (`lib/db/index.ts`) instead.
