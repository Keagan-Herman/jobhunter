import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { coverLetterId, jobId, outcome } = await request.json()

    // Update cover letter outcome
    await supabase
      .from('cover_letters')
      .update({ outcome })
      .eq('id', coverLetterId)

    // If interview — extract patterns from this cover letter
    if (outcome === 'interviewed') {
      const { data: coverLetter } = await supabase
        .from('cover_letters')
        .select('content')
        .eq('id', coverLetterId)
        .single()

      const { data: job } = await supabase
        .from('jobs')
        .select('title, company')
        .eq('id', jobId)
        .single()

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
        const clean = text.replace(/```json|```/g, '').trim()
        const { patterns } = JSON.parse(clean)

        // Save each pattern
        for (const pattern of patterns) {
          await supabase.from('cover_letter_patterns').insert({
            user_id: user.id,
            pattern,
            outcome: 'interviewed',
            job_title: job?.title,
            company: job?.company
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}