import { db } from '@/lib/db';
import { jobs, interviewOutcomes, learnedSignals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { ensureLocalUser } from '@/lib/db/user';
import { v4 as uuidv4 } from 'uuid';

async function updateLearnedSignals(
  userId: string,
  job: { stack: string[] | null, seniority: string | null, work_style: string | null },
  outcome: 'positive' | 'negative'
) {
  const signals = [
    ...(job.stack || []).map((s: string) => ({ type: 'stack', value: s })),
    ...(job.seniority ? [{ type: 'seniority', value: job.seniority }] : []),
    ...(job.work_style && job.work_style !== 'unspecified'
      ? [{ type: 'work_style', value: job.work_style }]
      : []),
  ]

  for (const signal of signals) {
    const existing = await db.query.learnedSignals.findFirst({
      where: and(
        eq(learnedSignals.user_id, userId),
        eq(learnedSignals.signal_type, signal.type),
        eq(learnedSignals.signal_value, signal.value),
        eq(learnedSignals.outcome, outcome)
      )
    });

    if (existing) {
      await db.update(learnedSignals)
        .set({
          weight: (existing.weight || 0) + 0.5,
          updated_at: new Date().toISOString()
        })
        .where(eq(learnedSignals.id, existing.id));
    } else {
      await db.insert(learnedSignals).values({
        id: uuidv4(),
        user_id: userId,
        signal_type: signal.type,
        signal_value: signal.value,
        weight: 1.0,
        outcome
      })
    }
  }
}

export async function POST(request: Request) {
  try {
    const userId = await ensureLocalUser();

    const { jobId, outcome, feedback, interviewRound } = await request.json()

    const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId)
    });

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    await db.insert(interviewOutcomes).values({
      id: uuidv4(),
      user_id: userId,
      job_id: jobId,
      outcome,
      interview_round: interviewRound || 1,
      feedback: feedback || null
    })

    const statusMap: Record<string, string> = {
      offer: 'interviewing',
      rejected_after_interview: 'skipped',
      withdrew: 'skipped',
      ghosted: 'skipped'
    }

    await db.update(jobs)
      .set({ status: statusMap[outcome] || 'interviewing' })
      .where(eq(jobs.id, jobId));

    const isPositive = outcome === 'offer'
    await updateLearnedSignals(
      userId,
      job,
      isPositive ? 'positive' : 'negative'
    )

    if (outcome === 'offer') {
      const prompt = `
Analyze this job that resulted in an offer and identify 2-3 key factors that made it a strong fit.

JOB:
Title: ${job.title}
Company: ${job.company}
Stack: ${(job.stack || []).join(', ')}
Seniority: ${job.seniority}
Work Style: ${job.work_style}
Description: ${job.description?.slice(0, 400)}

Return ONLY valid JSON:
{
  "factors": [
    "factor 1",
    "factor 2"
  ]
}
`
      try {
        const text = await generateContent(prompt)
        const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
        const { factors } = JSON.parse(clean)
        console.log('Offer factors:', factors)
      } catch {}
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
