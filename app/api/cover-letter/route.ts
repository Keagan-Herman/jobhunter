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

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = await request.json()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    // Fetch the job
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Fetch user profile
    const profile = await getUserProfile(supabase, user.id)

    const prompt = `
Write a sharp, confident cover letter for this job application.

CANDIDATE PROFILE:
${profile}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Stack: ${(job.stack || []).join(', ')}
Description: ${job.description}

STRICT RULES:
- 3 paragraphs maximum
- Do NOT use clichés like "I am passionate", "team player", "hard worker"
- Do NOT use filler phrases like "I am writing to express my interest"
- Open with a strong, specific statement about why this role fits
- Reference specific skills and experience that match this exact job
- Sound like a confident mid-level developer who knows their worth
- End with a clear, direct call to action
- Keep it under 250 words
- No subject line, no "Dear Hiring Manager" opener — just the body paragraphs
`

    const content = await generateContent(prompt)

    // Check if a cover letter already exists for this job
    const { data: existing } = await supabase
      .from('cover_letters')
      .select('id, version')
      .eq('job_id', jobId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = existing ? existing.version + 1 : 1

    // Save to DB
    const { data: coverLetter, error: saveError } = await supabase
      .from('cover_letters')
      .insert({
        job_id: jobId,
        content,
        version: nextVersion,
        user_id: user.id
      })
      .select()
      .single()

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      coverLetter: {
        id: coverLetter.id,
        content,
        version: nextVersion
      }
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}