import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { getUserProfile, getUserFeedbackContext } from '@/lib/profile'
import { ensureLocalUser } from '@/lib/db/user';

export async function POST() {
  try {
    const userId = await ensureLocalUser();

    const jobsToRescore = await db.query.jobs.findMany({
      where: and(
        eq(jobs.user_id, userId),
        eq(jobs.score_is_fallback, true),
        eq(jobs.status, 'pending')
      ),
      limit: 10
    });

    if (!jobsToRescore?.length) {
      return NextResponse.json({ message: 'No jobs need rescoring', rescored: 0 })
    }

    const { profileText: profile } = await getUserProfile(userId)
    const feedbackContext = await getUserFeedbackContext(userId)
    let rescoredCount = 0

    for (const job of jobsToRescore) {
      try {
        const prompt = `
You are a job matching engine. Score how well this job fits the candidate.

CANDIDATE:
${profile}

${feedbackContext}

JOB:
Title: ${job.title}
Stack: ${(job.stack || []).join(', ')}
Description: ${job.description?.slice(0, 1500)}

Respond ONLY with valid JSON, no markdown:
{"score": <0-100>, "reason": "<one sentence why>"}
`
        const text = await generateContent(prompt)
        const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
        const { score, reason } = JSON.parse(clean)

        await db.update(jobs)
          .set({ score, score_reason: reason, score_is_fallback: false })
          .where(eq(jobs.id, job.id));

        rescoredCount++
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.log(`RESCORE FAILED: ${job.title} — ${message.slice(0, 50)}`)
      }
    }

    return NextResponse.json({
      success: true,
      rescored: rescoredCount,
      remaining: jobsToRescore.length - rescoredCount
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
