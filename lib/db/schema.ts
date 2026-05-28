import { relations } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  email: text('email'),
  full_name: text('full_name'),
  job_title: text('job_title'),
  company: text('company'),
  education: text('education'),
  skills: text('skills', { mode: 'json' }).$type<string[]>(),
  experience: text('experience'),
  projects: text('projects'),
  country: text('country').default('za'),
  remote_only: integer('remote_only', { mode: 'boolean' }).default(false),
  salary_min: integer('salary_min'),
  search_terms: text('search_terms', { mode: 'json' }).$type<string[]>(),
  cover_letter_tone: text('cover_letter_tone').default('professional'),
  cover_letter_length: text('cover_letter_length').default('short'),
  career_context: text('career_context').default('experienced'),
  email_notifications: integer('email_notifications', { mode: 'boolean' }).default(true),
  last_notified_at: text('last_notified_at'),
  last_scan_at: text('last_scan_at'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  external_id: text('external_id').notNull(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location'),
  description: text('description'),
  salary_min: integer('salary_min'),
  salary_max: integer('salary_max'),
  url: text('url'),
  stack: text('stack', { mode: 'json' }).$type<string[]>(),
  score: integer('score'),
  score_reason: text('score_reason'),
  score_is_fallback: integer('score_is_fallback', { mode: 'boolean' }).default(false),
  status: text('status').default('pending'), // pending, applied, skipped, interviewing
  source: text('source'),
  seniority: text('seniority'),
  work_style: text('work_style'),
  stack_overlap: integer('stack_overlap'),
  notes: text('notes'),
  interview_date: text('interview_date'),
  contact_name: text('contact_name'),
  contact_email: text('contact_email'),
  offer_amount: real('offer_amount'),
  follow_up_date: text('follow_up_date'),
  culture_fit: text('culture_fit'),
  interview_prep: text('interview_prep'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const jobFeedback = sqliteTable('job_feedback', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  job_id: text('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // applied, skipped
  reason: text('reason'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const coverLetters = sqliteTable('cover_letters', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  job_id: text('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  version: integer('version').default(1),
  outcome: text('outcome'), // interviewed, rejected, no_response
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const coverLetterPatterns = sqliteTable('cover_letter_patterns', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  pattern: text('pattern').notNull(),
  outcome: text('outcome').notNull(),
  job_title: text('job_title'),
  company: text('company'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const learnedSignals = sqliteTable('learned_signals', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  signal_type: text('signal_type').notNull(), // stack, seniority, work_style
  signal_value: text('signal_value').notNull(),
  weight: real('weight').default(1.0),
  outcome: text('outcome').notNull(), // positive, negative
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const scanLogs = sqliteTable('scan_logs', {
  id: text('id').primaryKey(),
  jobs_found: integer('jobs_found'),
  jobs_new: integer('jobs_new'),
  jobs_scored: integer('jobs_scored'),
  status: text('status'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const interviewOutcomes = sqliteTable('interview_outcomes', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  job_id: text('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  outcome: text('outcome').notNull(), // offer, rejected_after_interview, withdrew, ghosted
  interview_round: integer('interview_round').default(1),
  feedback: text('feedback'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const jobFeedbackRelations = relations(jobFeedback, ({ one }) => ({
  job: one(jobs, {
    fields: [jobFeedback.job_id],
    references: [jobs.id],
  }),
}));

export const jobRelations = relations(jobs, ({ many }) => ({
  coverLetters: many(coverLetters),
}));

export const coverLetterRelations = relations(coverLetters, ({ one }) => ({
  job: one(jobs, {
    fields: [coverLetters.job_id],
    references: [jobs.id],
  }),
}));
