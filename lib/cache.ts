import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const scoreCache = {
  async get(userId: string, externalId: string) {
    const data = await db.query.jobs.findFirst({
      where: and(
        eq(jobs.external_id, externalId),
        eq(jobs.user_id, userId),
        eq(jobs.score_is_fallback, false)
      ),
      columns: {
        score: true,
        score_reason: true,
        stack: true,
        score_is_fallback: true
      }
    });

    if (data && data.score !== null && data.score_reason !== null && data.stack !== null) {
        return {
            score: data.score,
            reason: data.score_reason,
            stack: data.stack,
            score_is_fallback: !!data.score_is_fallback
        }
    }
    return null
  },

  async set() {
    // In our case, the score is already being saved to the jobs table during the scan loop.
  }
}
