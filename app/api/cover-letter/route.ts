import { createClient } from '@/lib/supabase/server'
import { mockUser, isDev } from '@/lib/auth-mock'
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { getUserProfile } from '@/lib/profile'

async function getUserPreferences(supabase: any, userId: string): Promise<{
  tone: string, length: string, context: string
}> {
  const { data } = await supabase
    .from('profiles')
    .select('cover_letter_tone, cover_letter_length, career_context')
    .eq('id', userId)
    .single()

  return {
    tone: data?.cover_letter_tone || 'professional',
    length: data?.cover_letter_length || 'short',
    context: data?.career_context || 'experienced'
  }
}

async function getSuccessfulPatterns(supabase: any, userId: string): Promise<string> {
  const { data: patterns } = await supabase
    .from('cover_letter_patterns')
    .select('pattern, job_title, company')
    .eq('user_id', userId)
    .eq('outcome', 'interviewed')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!patterns?.length) return ''

  return `
PATTERNS FROM YOUR SUCCESSFUL COVER LETTERS (that led to interviews):
${patterns.map((p: any) => `- ${p.pattern} (worked for ${p.job_title} at ${p.company})`).join('\n')}

Incorporate these patterns naturally into this cover letter.
  `.trim()
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    let user;
    if (isDev) {
        user = mockUser
    } else {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        user = authUser
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
    const { profileText: profile } = await getUserProfile(supabase, user.id)

    const preferences = await getUserPreferences(supabase, user.id)

    const patterns = await getSuccessfulPatterns(supabase, user.id)

    const toneGuide = {
      professional: 'formal, confident and polished — like a senior professional',
      conversational: 'warm, friendly and natural — like talking to a person not a recruiter',
      creative: 'bold, distinctive and memorable — break conventions slightly'
    }

    const lengthGuide = {
      short: 'maximum 3 paragraphs, under 200 words, punchy and direct',
      detailed: '4-5 paragraphs, up to 350 words, thorough but not padded'
    }

    const contextGuide = {
      first_job: 'This is their first job — emphasise potential, education, and eagerness to learn over experience',
      career_change: 'They are changing careers — emphasise transferable skills and motivation for the change',
      experienced: 'They are an experienced hire — lead with impact and specific achievements'
    }

    const prompt = `
Write a cover letter for this job application.

CANDIDATE PROFILE:
${profile}

${patterns}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Stack: ${(job.stack || []).join(', ')}
Description: ${job.description}

STYLE REQUIREMENTS:
- Tone: ${toneGuide[preferences.tone as keyof typeof toneGuide]}
- Length: ${lengthGuide[preferences.length as keyof typeof lengthGuide]}
- Career context: ${contextGuide[preferences.context as keyof typeof contextGuide]}

STRICT RULES:
- Do NOT use clichés like "I am passionate", "team player", "hard worker"
- Do NOT open with "I am writing to express my interest"
- Reference specific skills that match this exact job
- End with a clear direct call to action
- No subject line, no "Dear Hiring Manager" — just the body paragraphs
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
