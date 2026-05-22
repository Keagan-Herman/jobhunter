import { createClient } from '@/lib/supabase/server'
import { streamContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { getUserProfile } from '@/lib/profile'
import { SupabaseClient } from '@supabase/supabase-js'

async function getUserPreferences(supabase: SupabaseClient, userId: string): Promise<{
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

async function getSuccessfulPatterns(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data: patterns } = await supabase
    .from('cover_letter_patterns')
    .select('pattern, job_title, company')
    .eq('user_id', userId)
    .eq('outcome', 'interviewed')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!patterns?.length) return ''

  interface Pattern {
    pattern: string
    job_title: string
    company: string
  }

  const patternItems = patterns as unknown as Pattern[]

  return `
PATTERNS FROM YOUR SUCCESSFUL COVER LETTERS (that led to interviews):
${patternItems.map((p) => `- ${p.pattern} (worked for ${p.job_title} at ${p.company})`).join('\n')}

Incorporate these patterns naturally into this cover letter.
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

    const encoder = new TextEncoder()
    const stream = streamContent(prompt)

    const readableStream = new ReadableStream({
      async start(controller) {
        let fullContent = ''
        try {
          for await (const chunk of stream) {
            fullContent += chunk
            controller.enqueue(encoder.encode(chunk))
          }

          // Once finished, save to DB in background
          const existingRes = await supabase
            .from('cover_letters')
            .select('id, version')
            .eq('job_id', jobId)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()

          const existing = existingRes?.data

          const nextVersion = (existing as { version: number } | null)?.version ? (existing as { version: number }).version + 1 : 1

          await supabase
            .from('cover_letters')
            .insert({
              job_id: jobId,
              content: fullContent,
              version: nextVersion,
              user_id: user.id
            })

          controller.close()
        } catch (err: unknown) {
          controller.error(err)
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
