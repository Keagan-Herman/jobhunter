import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const sqlite = new Database(path.join(dataDir, 'jobhunter.sqlite'));
export const db = drizzle(sqlite, { schema });

// Auto-initialize tables (simplified for personal use)
export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT,
      full_name TEXT,
      job_title TEXT,
      company TEXT,
      education TEXT,
      skills TEXT,
      experience TEXT,
      projects TEXT,
      country TEXT DEFAULT 'za',
      remote_only INTEGER DEFAULT 0,
      salary_min INTEGER,
      search_terms TEXT,
      cover_letter_tone TEXT DEFAULT 'professional',
      cover_letter_length TEXT DEFAULT 'short',
      career_context TEXT DEFAULT 'experienced',
      email_notifications INTEGER DEFAULT 1,
      last_notified_at TEXT,
      last_scan_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      description TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      url TEXT,
      stack TEXT,
      score INTEGER,
      score_reason TEXT,
      score_is_fallback INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      source TEXT,
      seniority TEXT,
      work_style TEXT,
      stack_overlap INTEGER,
      notes TEXT,
      interview_date TEXT,
      contact_name TEXT,
      contact_email TEXT,
      offer_amount REAL,
      follow_up_date TEXT,
      culture_fit TEXT,
      interview_prep TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, external_id)
    );

    CREATE TABLE IF NOT EXISTS job_feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cover_letters (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      outcome TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cover_letter_patterns (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      pattern TEXT NOT NULL,
      outcome TEXT NOT NULL,
      job_title TEXT,
      company TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learned_signals (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      signal_type TEXT NOT NULL,
      signal_value TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      outcome TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scan_logs (
      id TEXT PRIMARY KEY,
      jobs_found INTEGER,
      jobs_new INTEGER,
      jobs_scored INTEGER,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interview_outcomes (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
      job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
      outcome TEXT NOT NULL,
      interview_round INTEGER DEFAULT 1,
      feedback TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
