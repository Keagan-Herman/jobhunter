import { db } from '@/lib/db';
import { jobs, profiles, coverLetters, coverLetterPatterns } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { streamContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { getUserProfile } from '@/lib/profile'
import { ensureLocalUser } from '@/lib/db/user';
import { v4 as uuidv4 } from 'uuid';

async function getUserPreferences(userId: string): Promise<{
  tone: string, length: string, context: string
}> {
  const data = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: {
      cover_letter_tone: true,
      cover_letter_length: true,
      career_context: true
    }
  });

  return {
    tone: data?.cover_letter_tone || 'professional',
    length: data?.cover_letter_length || 'short',
    context: data?.career_context || 'experienced'
  }
}

async function getSuccessfulPatterns(userId: string): Promise<string> {
  const patterns = await db.query.coverLetterPatterns.findMany({
    where: and(
        eq(coverLetterPatterns.user_id, userId),
        eq(coverLetterPatterns.outcome, 'interviewed')
    ),
    orderBy: [desc(coverLetterPatterns.created_at)],
    limit: 5
  });

  if (!patterns?.length) return ''

  return `
PATTERNS FROM YOUR SUCCESSFUL COVER LETTERS (that led to interviews):
${patterns.map((p) => `- ${p.pattern} (worked for ${p.job_title} at ${p.company})`).join('\n')}

Incorporate these patterns naturally into this cover letter.
  `.trim()
}

export async function POST(request: Request) {
  try {
    const userId = await ensureLocalUser();

    const { jobId } = await request.json()
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId)
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { profileText: profile } = await getUserProfile(userId)
    const preferences = await getUserPreferences(userId)
    const patterns = await getSuccessfulPatterns(userId)

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
You are a elite ghostwriter for top-tier software engineers. Your goal is to write a cover letter that sounds authentic, high-impact, and irresistibly relevant.

CANDIDATE DATA:
${profile}

SUCCESSFUL PATTERNS TO REPLICATE:
${patterns}

TARGET JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Key Stack: ${(job.stack || []).join(', ')}
Description: ${job.description}

WRITING PARAMETERS:
- Tone: ${toneGuide[preferences.tone as keyof typeof toneGuide]}
- Length: ${lengthGuide[preferences.length as keyof typeof lengthGuide]}
- Career context: ${contextGuide[preferences.context as keyof typeof contextGuide]}

MISSION-CRITICAL RULES:
1. NO CLICHÉS: Absolute ban on "passionate", "motivated", "dynamic", "team player", "highly skilled", "looking for a challenge".
2. NO WEAK OPENINGS: Do not start with "I am writing to...", "My name is...", or "I was excited to see...". Start with a punchy value proposition or a specific observation about the company's product/engineering.
3. SHOW, DON'T TELL: Instead of saying you're good at React, reference a specific challenge you've solved that matches the job's requirements.
4. BE CONCISE: Respect the reader's time. Every sentence must earn its place.
5. CALL TO ACTION: End with a confident, direct next step.
6. FORMAT: No headers, no "Dear X", no "Sincerely". Just the core narrative paragraphs.
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

          const existing = await db.query.coverLetters.findFirst({
            where: eq(coverLetters.job_id, jobId),
            orderBy: [desc(coverLetters.version)],
            columns: {
                id: true,
                version: true
            }
          });

          const nextVersion = existing?.version ? existing.version + 1 : 1

          await db.insert(coverLetters).values({
              id: uuidv4(),
              job_id: jobId,
              content: fullContent,
              version: nextVersion,
              user_id: userId
          });

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
    return NextResponse.json({ error: message, success: false }, { status: 500 })
  }
}
