# JobHunter Technical Documentation

This document provides a comprehensive technical overview of the JobHunter codebase. It is designed to assist AI coding agents in making informed technical decisions, proposing improvements, and understanding the core architecture of the application.

---

## 1. Architectural Overview

### 1.1 Local-First Philosophy
JobHunter is designed as a **standalone personal tool**. It migrated from a cloud-based Supabase architecture to a local-first **SQLite** setup.
- **Goal**: Privacy, zero-cost, and high performance for individual use.
- **Implementation**: Uses `better-sqlite3` and **Drizzle ORM**.
- **Data Persistence**: All data resides in `data/jobhunter.sqlite`.

### 1.2 Core Tech Stack
- **Framework**: Next.js 16.1.7 (App Router).
- **Database**: SQLite with Drizzle ORM.
- **AI Engine**: Groq SDK (LLaMA 3.3 70B Versatile).
- **Styling**: Tailwind CSS v4.
- **Fonts**: Syne (Headings), Geist Sans (Body), Geist Mono (Metadata/Labels).
- **PDF Processing**: `unpdf`.
- **Email**: Resend (configured for notifications).

---

## 2. Data Architecture

### 2.1 Schema (Drizzle)
The database schema is defined in `lib/db/schema.ts` and initialized via `initDb()` in `lib/db/index.ts`.
- **Key Tables**:
    - `profiles`: Stores user preferences, CV-extracted data, and search terms.
    - `jobs`: Stores fetched job listings, AI scores, and application tracking data.
    - `job_feedback`: Records 'applied' vs 'skipped' actions to calibrate AI.
    - `cover_letters`: Stores generated drafts and versions.
    - `learned_signals`: Stores AI-extracted preferences (stack, seniority) from past interactions.
    - `scan_logs`: Tracks performance of job scans.

### 2.2 Naming Conventions
- **Database/API**: Properties mapped to the database (especially in the `jobs` table) use **snake_case** (e.g., `interview_date`, `salary_min`, `score_is_fallback`).
- **Frontend/Logic**: Standard TypeScript variables and React state typically use **camelCase**.
- **User Identification**: The system defaults to a single `local-user` ID, defined in `lib/db/user.ts`.

---

## 3. AI Integration Strategy

### 3.1 Prompt Engineering Patterns
JobHunter uses high-impact personas to ensure quality output:
- **Job Scoring**: "World-class technical recruiter and career coach."
- **Cover Letters**: "Elite ghostwriter for top-tier software engineers."

### 3.2 Output Constraints
- **JSON-only**: Most AI routes (scoring, parsing) enforce a "Strict JSON, no markdown, no prose" rule.
- **Cleaning**: Logic in `api/` routes frequently uses regex (e.g., `.replace(/```json|```/g, '')`) to sanitize AI responses before parsing.

### 3.3 Reliability & Performance
- **Retries**: `lib/retry.ts` provides an `withRetry` wrapper with exponential backoff.
- **Timeouts**: `lib/timeout.ts` ensures API calls don't hang indefinitely (default 10-15s).
- **Caching**: `lib/cache.ts` implements a simple caching layer that checks the `jobs` table for existing scores before hitting the Groq API.

---

## 4. Frontend & UI Patterns

### 4.1 Tailwind v4 Implementation
The project leverages Tailwind 4's new engine. Key utility classes include:
- `bg-glass`: Backdrop blur with semi-transparent background.
- `border-premium`: Subtle border for high-contrast dark UI.
- `text-glow-gold`: branded gold glow effect.
- `animate-shimmer-light`: Custom shimmer animation for loading/button states.

### 4.2 Component Architecture
- **Modularity**: The `DetailPanel.tsx` is split into sub-tabs (`OverviewTab`, `LetterTab`, `TrackingTab`) located in `components/dashboard/detail/`.
- **List Virtualization**: `react-window` (v2.2.7) is used in the `DashboardPage` to handle large lists of jobs efficiently.
- **Micro-interactions**: Extensive use of `hover:scale-105`, `group-hover` transitions, and `animate-in` (Tailwind CSS Animate) for a "premium" feel.

---

## 5. Key Logic Flows

### 5.1 Job Scanning & Scoring
1. **Fetch**: Parallel calls to Adzuna and JSearch based on `search_terms` in the user profile.
2. **Deduplicate**: Deduplicates jobs based on `external_id`.
3. **Calibrate**: AI considers `PAST BEHAVIOUR` (skipped/applied) and `LEARNED SIGNALS` (interview outcomes) when scoring.
4. **Fallback**: If AI scoring fails, the system assigns a score of 50 and marks `score_is_fallback: true`.

### 5.2 CV Parsing
- Uses `unpdf` to extract text from PDF buffers.
- Text is cleaned and capped (5,000 chars) before being sent to AI.
- AI synthesizes skills and generates relevant `search_terms`.

---

## 6. Development & Maintenance

### 6.1 Fragile Areas
- **`proxy.ts`**: Replaces standard Next.js middleware. It handles routing matchers for dashboard and onboarding.
- **Database Initialization**: `initDb()` in `lib/db/index.ts` uses raw SQL `CREATE TABLE IF NOT EXISTS`. Schema changes require manual `ALTER TABLE` or database reset.
- **Profile Regex**: `lib/profile.ts` contains keyword-based detection for seniority and work style which is effective but sensitive to wording changes.

### 6.2 Testing
- **Framework**: Jest + React Testing Library.
- **Structure**: Tests are organized into `tests/lib/` for utilities and `tests/components/` for UI.
- **Mocks**: `lib/auth-mock.ts` provides a `mockUser` to bypass authentication in dev/test environments. Database mocking is handled by mocking the Drizzle `db` instance.
- **CI**: GitHub Actions workflow (`.github/workflows/ci.yml`) runs tests on push/PR.

---

## 7. Operational Notes
- **Deployment**: SQLite is **not** suitable for ephemeral filesystems like Vercel. For cloud deployment, a migration to Turso (managed SQLite) or Postgres is recommended.
- **Rate Limits**: The `api/jobs` route implements a 30-minute throttle based on the `last_scan_at` timestamp in the user profile.
