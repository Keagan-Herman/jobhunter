import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

async function updateLearnedSignals(
  supabase: SupabaseClient,
  userId: string,
  job: { stack: string[] | null, seniority: string | null, work_style: string | null },
  outcome: 'positive' | 'negative'
) {
  const signals = [
    // Stack signals
    ...(job.stack || []).map((s: string) => ({ type: 'stack', value: s })),
    // Seniority signal
    ...(job.seniority ? [{ type: 'seniority', value: job.seniority }] : []),
    // Work style signal
    ...(job.work_style && job.work_style !== 'unspecified'
      ? [{ type: 'work_style', value: job.work_style }]
      : []),
  ]

  for (const signal of signals) {
    // Check if signal already exists
    const { data: existing } = await supabase
      .from('learned_signals')
      .select('id, weight')
      .eq('user_id', userId)
      .eq('signal_type', signal.type)
      .eq('signal_value', signal.value)
      .eq('outcome', outcome)
      .single()

    if (existing) {
      // Increase weight
      await supabase
        .from('learned_signals')
        .update({
          weight: existing.weight + 0.5,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Create new signal
      await supabase.from('learned_signals').insert({
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobId, outcome, feedback, interviewRound } = await request.json()

    // Fetch job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // Save interview outcome
    await supabase.from('interview_outcomes').insert({
      user_id: user.id,
      job_id: jobId,
      outcome,
      interview_round: interviewRound || 1,
      feedback: feedback || null
    })

    // Update job status based on outcome
    const statusMap: Record<string, string> = {
      offer: 'interviewing',
      rejected_after_interview: 'skipped',
      withdrew: 'skipped',
      ghosted: 'skipped'
    }

    await supabase
      .from('jobs')
      .update({ status: statusMap[outcome] || 'interviewing' })
      .eq('id', jobId)

    // Update learned signals
    const isPositive = outcome === 'offer'
    await updateLearnedSignals(
      supabase,
      user.id,
      job,
      isPositive ? 'positive' : 'negative'
    )

    // If offer — analyze what made this job a good fit
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
        const clean = text.replace(/```json|```/g, '').trim()
        const { factors } = JSON.parse(clean)
        console.log('SUCCESS FACTORS:', factors)
      } catch {
        // Non-critical, just log
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}