import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { getUserProfile, getUserFeedbackContext } from '@/lib/profile'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find all jobs with broken scores
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, description, stack')
      .eq('user_id', user.id)
      .eq('score_is_fallback', true)
      .eq('status', 'pending')
      .limit(10) // do 10 at a time to avoid rate limits

    if (!jobs?.length) {
      return NextResponse.json({ message: 'No jobs need rescoring', rescored: 0 })
    }

    const { profileText: profile } = await getUserProfile(supabase, user.id)
    const feedbackContext = await getUserFeedbackContext(supabase, user.id)
    let rescored = 0

    for (const job of jobs) {
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
        const clean = text.replace(/```json|```/g, '').trim()
        const { score, reason } = JSON.parse(clean)

        await supabase
          .from('jobs')
          .update({ score, score_reason: reason, score_is_fallback: false })
          .eq('id', job.id)

        console.log(`RESCORED: ${job.title} — ${score}`)
        rescored++
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.log(`RESCORE FAILED: ${job.title} — ${message.slice(0, 50)}`)
      }
    }

    return NextResponse.json({
      success: true,
      rescored,
      remaining: jobs.length - rescored
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
