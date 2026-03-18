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

async function scoreJob(title: string, description: string, stack: string[], profile: string): Promise<{ score: number, reason: string }> {
  try {
    const prompt = `
You are a job matching engine. Score how well this job fits the candidate profile.

CANDIDATE:
${profile}

JOB:
Title: ${title}
Stack: ${stack.join(', ')}
Description: ${description?.slice(0, 500)}

Respond ONLY with valid JSON, no markdown, no explanation:
{"score": <0-100>, "reason": "<one sentence why>"}
`
    const text = await generateContent(prompt)
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (err: any) {
    console.log('GROQ ERROR:', err.message?.slice(0, 80))
    return { score: 75, reason: 'Scoring unavailable — saved for manual review' }
  }
}

function extractStack(description: string): string[] {
  const keywords = [
    'TypeScript', 'JavaScript', 'React', 'Next.js', 'Vue', 'Angular',
    'C#', 'MVC', '.NET', 'Flutter', 'Kotlin', 'Swift', 'Dart',
    'Python', 'Java', 'Go', 'Rust', 'Node.js', 'Express',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Firebase',
    'Blazor', 'HTML', 'CSS', 'Tailwind', 'Docker', 'AWS', 'Azure',
    'IoT', 'Power BI', 'GraphQL', 'REST', 'API'
  ]
  return keywords.filter(k => description?.toLowerCase().includes(k.toLowerCase()))
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check once at the top
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch user profile once
    const profile = await getUserProfile(supabase, user.id)

    const { data: profileData } = await supabase
  .from('profiles')
  .select('search_terms')
  .eq('id', user.id)
  .single()

const searchTerms = profileData?.search_terms?.length
  ? profileData.search_terms
  : ['typescript developer', 'C# developer', 'flutter developer', 'full stack developer']
    const allResults: any[] = []

    for (const term of searchTerms) {
      const url = new URL('https://api.adzuna.com/v1/api/jobs/za/search/1')
      url.searchParams.set('app_id', process.env.ADZUNA_APP_ID!)
      url.searchParams.set('app_key', process.env.ADZUNA_API_KEY!)
      url.searchParams.set('results_per_page', '10')
      url.searchParams.set('what', term)
      url.searchParams.set('where', 'south africa')
      url.searchParams.set('content-type', 'application/json')

      const res = await fetch(url.toString())
      const data = await res.json()
      if (data.results) allResults.push(...data.results)
    }

    // Deduplicate by Adzuna ID
    const seen = new Set()
    const results = allResults.filter(job => {
      if (seen.has(job.id)) return false
      seen.add(job.id)
      return true
    })

    if (!results.length) {
      return NextResponse.json({ error: 'No results from Adzuna' }, { status: 500 })
    }

    let newJobs = 0
    let skipped = 0
    let scored = 0

    for (const job of results) {
      const externalId = String(job.id)
      const company = job.company?.display_name || 'Unknown'
      const description = job.description || ''

      // Check duplicate per user — same job shouldn't appear twice for same user
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('external_id', externalId)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        skipped++
        continue
      }

      const stack = extractStack(description)
      const { score, reason } = await scoreJob(job.title, description, stack, profile)

      await supabase.from('jobs').insert({
        user_id: user.id,
        external_id: externalId,
        title: job.title,
        company,
        location: job.location?.display_name || 'Unknown',
        description: description.slice(0, 1000),
        salary_min: job.salary_min || null,
        salary_max: job.salary_max || null,
        url: job.redirect_url,
        stack,
        score,
        score_reason: reason,
        status: 'pending'
      })

      console.log(`SAVED: ${job.title} at ${company} — score: ${score}`)
      newJobs++
      scored++
    }

    await supabase.from('scan_logs').insert({
      jobs_found: results.length,
      jobs_new: newJobs,
      jobs_scored: scored,
      status: 'success'
    })

    return NextResponse.json({
      success: true,
      found: results.length,
      saved: newJobs,
      skipped,
      scored
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
        }
