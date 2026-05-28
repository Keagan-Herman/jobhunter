import { db } from '@/lib/db';
import { jobs, jobFeedback, learnedSignals } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid';
import { ensureLocalUser } from '@/lib/db/user';

export async function POST(request: Request) {
  try {
    const userId = await ensureLocalUser();

    const { jobId, action, reason } = await request.json()

    // Save feedback
    await db.insert(jobFeedback).values({
      id: uuidv4(),
      user_id: userId,
      job_id: jobId,
      action,
      reason: reason || null
    })

    // Update job status
    const status = action === 'skipped' ? 'skipped' :
                   action === 'pending' ? 'pending' : 'applied'

    await db.update(jobs)
      .set({
        status,
        score_reason: (action === 'skipped' && reason) ? `Skipped: ${reason}` : undefined
      })
      .where(eq(jobs.id, jobId));

    // Extract signals if skipped
    if (action === 'skipped' && reason) {
        const job = await db.query.jobs.findFirst({
            where: eq(jobs.id, jobId)
        });

        if (job) {
            // Add to learned_signals with negative outcome
            const signalType = reason.toLowerCase().includes('stack') ? 'stack' :
                               reason.toLowerCase().includes('senior') ? 'seniority' :
                               reason.toLowerCase().includes('salary') ? 'salary' : 'preference'

            await db.insert(learnedSignals).values({
                id: uuidv4(),
                user_id: userId,
                signal_type: signalType,
                signal_value: reason,
                weight: 0.5,
                outcome: 'negative'
            })
        }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const userId = await ensureLocalUser();

    // Get last 20 feedback entries to build AI context
    const feedback = await db.query.jobFeedback.findMany({
      where: eq(jobFeedback.user_id, userId),
      orderBy: [desc(jobFeedback.created_at)],
      limit: 20,
      with: {
        job: {
            columns: {
                title: true,
                company: true,
                stack: true,
                score: true
            }
        }
      }
    });

    // Map to match the expected structure of the frontend/previous API
    const formattedFeedback = feedback.map(f => ({
        ...f,
        jobs: f.job
    }));

    return NextResponse.json({ feedback: formattedFeedback })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
