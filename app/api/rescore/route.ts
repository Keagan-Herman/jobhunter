import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/gemini'
import { NextResponse } from 'next/server'

async function getUserProfile(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!data) return 'Software developer with full stack experience'

  return `
Name: ${data.full_name || ''}
Current Role: ${data.job_title || ''}
Company: ${data.company || ''}
Education: ${data.education || ''}
Skills: ${(data.skills || []).join(', ')}
Experience: ${data.experience || ''}
Projects: ${data.projects || ''}
  `.trim()
}

async function getUserFeedbackContext(supabase: any, userId: string): Promise<string> {
  const { data: feedback } = await supabase
    .from('job_feedback')
    .select(`
      action,
      reason,
      jobs (
        title,
        company,
        stack
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!feedback?.length) return ''

  const skipped = feedback
    .filter((f: any) => f.action === 'skipped' && f.jobs)
    .map((f: any) => `- Skipped "${f.jobs.title}" at ${f.jobs.company}${f.reason ? ` because: ${f.reason}` : ''}`)
    .join('\n')

  const applied = feedback
    .filter((f: any) => f.action === 'applied' && f.jobs)
    .map((f: any) => `- Applied to "${f.jobs.title}" at ${f.jobs.company}${f.reason ? ` — liked: ${f.reason}` : ''}`)
    .join('\n')

  return `
PAST BEHAVIOUR (use this to calibrate your score):
Jobs they applied to:
${applied || 'None yet'}

Jobs they skipped:
${skipped || 'None yet'}
  `.trim()
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find all jobs with broken scores
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, description, stack')
      .eq('user_id', user.id)
      .eq('score_reason', 'Scoring unavailable — saved for manual review')
      .eq('status', 'pending')
      .limit(10) // do 10 at a time to avoid rate limits

    if (!jobs?.length) {
      return NextResponse.json({ message: 'No jobs need rescoring', rescored: 0 })
    }

    const profile = await getUserProfile(supabase, user.id)
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
Description: ${job.description?.slice(0, 500)}

Respond ONLY with valid JSON, no markdown:
{"score": <0-100>, "reason": "<one sentence why>"}
`
        const text = await generateContent(prompt)
        const clean = text.replace(/```json|```/g, '').trim()
        const { score, reason } = JSON.parse(clean)

        await supabase
          .from('jobs')
          .update({ score, score_reason: reason })
          .eq('id', job.id)

        console.log(`RESCORED: ${job.title} — ${score}`)
        rescored++
      } catch (err: any) {
        console.log(`RESCORE FAILED: ${job.title} — ${err.message?.slice(0, 50)}`)
      }
    }

    return NextResponse.json({
      success: true,
      rescored,
      remaining: jobs.length - rescored
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}