import { db } from '@/lib/db';
import { coverLetters, coverLetterPatterns, jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { ensureLocalUser } from '@/lib/db/user';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const userId = await ensureLocalUser();

    const { coverLetterId, jobId, outcome } = await request.json()

    await db.update(coverLetters)
      .set({ outcome })
      .where(eq(coverLetters.id, coverLetterId));

    if (outcome === 'interviewed') {
      const coverLetter = await db.query.coverLetters.findFirst({
        where: eq(coverLetters.id, coverLetterId),
        columns: {
          content: true
        }
      });

      const job = await db.query.jobs.findFirst({
        where: eq(jobs.id, jobId),
        columns: {
          title: true,
          company: true
        }
      });

      if (coverLetter?.content) {
        const prompt = `
Analyze this successful cover letter that led to an interview and extract 2-3 specific patterns that made it effective.

COVER LETTER:
${coverLetter.content}

Return ONLY valid JSON:
{
  "patterns": [
    "pattern 1 description",
    "pattern 2 description"
  ]
}
`
        const text = await generateContent(prompt)
        const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
        const { patterns } = JSON.parse(clean)

        for (const pattern of patterns) {
          await db.insert(coverLetterPatterns).values({
            id: uuidv4(),
            user_id: userId,
            pattern,
            outcome: 'interviewed',
            job_title: job?.title,
            company: job?.company
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
