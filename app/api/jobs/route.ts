import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/gemini'
import { NextResponse } from 'next/server'
import { scoreCache } from '@/lib/cache'
import { withTimeout } from '@/lib/timeout'

async function getUserProfile(supabase: any, userId: string): Promise<{ profileText: string, profileData: any }> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!data) return {
    profileText: 'Software developer with full stack experience',
    profileData: {}
  }

  const profileText = `
Name: ${data.full_name || ''}
Current Role: ${data.job_title || ''}
Company: ${data.company || ''}
Education: ${data.education || ''}
Skills: ${(data.skills || []).join(', ')}
Experience: ${data.experience || ''}
Projects: ${data.projects || ''}
  `.trim()

  return { profileText, profileData: data }
}

async function getUserFeedbackContext(supabase: any, userId: string): Promise<string> {
  const { data: feedback } = await supabase
    .from('job_feedback')
    .select(`action, reason, jobs (title, company, stack)`)
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

async function getLearnedSignals(supabase: any, userId: string): Promise<string> {
  const { data: signals } = await supabase
    .from('learned_signals')
    .select('signal_type, signal_value, weight, outcome')
    .eq('user_id', userId)
    .order('weight', { ascending: false })
    .limit(20)

  if (!signals?.length) return ''

  const positive = signals
    .filter((s: any) => s.outcome === 'positive')
    .map((s: any) => `- ${s.signal_type}: "${s.signal_value}" (strength: ${s.weight.toFixed(1)})`)
    .join('\n')

  const negative = signals
    .filter((s: any) => s.outcome === 'negative')
    .map((s: any) => `- ${s.signal_type}: "${s.signal_value}" (strength: ${s.weight.toFixed(1)})`)
    .join('\n')

  return `
LEARNED SIGNALS FROM PAST INTERVIEWS:
Signals that led to positive outcomes (weight them higher):
${positive || 'None yet'}

Signals that led to negative outcomes (weight them lower):
${negative || 'None yet'}
  `.trim()
}

function detectSeniority(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('junior') || t.includes('graduate') || t.includes('entry')) return 'junior'
  if (t.includes('senior') || t.includes('lead') || t.includes('principal')) return 'senior'
  if (t.includes('head') || t.includes('director') || t.includes('vp')) return 'executive'
  return 'mid'
}

function detectWorkStyle(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('fully remote') || d.includes('100% remote') || d.includes('work from anywhere')) return 'fully remote'
  if (d.includes('hybrid')) return 'hybrid'
  if (d.includes('on-site') || d.includes('onsite') || d.includes('in office') || d.includes('in-office')) return 'on-site'
  return 'unspecified'
}

function calculateStackOverlap(jobStack: string[], userSkills: string[]): number {
  if (!jobStack.length || !userSkills.length) return 0
  const userSkillsLower = userSkills.map(s => s.toLowerCase())
  const matches = jobStack.filter(s => userSkillsLower.includes(s.toLowerCase()))
  return Math.round((matches.length / jobStack.length) * 100)
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

function getCountryName(code: string): string {
  const map: Record<string, string> = {
    za: 'South Africa', gb: 'United Kingdom', us: 'United States',
    au: 'Australia', ca: 'Canada', de: 'Germany',
    nl: 'Netherlands', sg: 'Singapore'
  }
  return map[code] || 'South Africa'
}

async function scoreJob(
  title: string,
  description: string,
  stack: string[],
  profile: string,
  feedbackContext: string,
  learnedSignals: string,
  userSkills: string[],
  salaryMin: number | null,
  jobSalaryMin: number | null,
  remoteOnly: boolean
): Promise<{ score: number, reason: string }> {
  try {
    const seniority = detectSeniority(title)
    const workStyle = detectWorkStyle(description)
    const stackOverlap = calculateStackOverlap(stack, userSkills)

    // Pre-filter obvious mismatches before hitting AI
    if (remoteOnly && workStyle === 'on-site') {
      return { score: 20, reason: 'On-site only — conflicts with remote preference' }
    }
    if (salaryMin && jobSalaryMin && jobSalaryMin < salaryMin * 0.8) {
      return { score: 25, reason: 'Salary below minimum preference' }
    }

    const prompt = `
You are a senior recruiter scoring job fit. Be precise and calibrated.

CANDIDATE:
${profile}

${feedbackContext}

${learnedSignals}

JOB ANALYSIS:
Title: ${title}
Seniority Level: ${seniority}
Work Style: ${workStyle}
Stack: ${stack.join(', ')}
Stack Overlap with Candidate: ${stackOverlap}%
Salary: ${jobSalaryMin ? `R${jobSalaryMin.toLocaleString()}` : 'Not specified'}
Description: ${description?.slice(0, 600)}

SCORING GUIDE:
- 90-100: Perfect match — strong stack overlap, right seniority, matches preferences
- 75-89: Good match — most requirements met, minor gaps
- 60-74: Decent match — transferable skills, some gaps
- 40-59: Weak match — significant skill or preference gaps
- Below 40: Poor match — wrong field, seniority, or preferences

Consider stack overlap (${stackOverlap}%) heavily in your score.
Use past behaviour to calibrate further.

Respond ONLY with valid JSON, no markdown:
{"score": <0-100>, "reason": "<one punchy sentence explaining the score>"}
`
    const text = await generateContent(prompt)
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (err: any) {
    console.log('GROQ ERROR:', err.message?.slice(0, 80))
    return { score: 75, reason: 'Scoring unavailable — saved for manual review' }
  }
}

// ✅ Fetch Adzuna for a single term
async function fetchAdzunaJobs(
  term: string,
  country: string,
  remoteOnly: boolean,
  salaryMin: number | null
): Promise<any[]> {
  try {
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`)
    url.searchParams.set('app_id', process.env.ADZUNA_APP_ID!)
    url.searchParams.set('app_key', process.env.ADZUNA_API_KEY!)
    url.searchParams.set('results_per_page', '10')
    url.searchParams.set('what', remoteOnly ? `${term} remote` : term)
    url.searchParams.set('content-type', 'application/json')
    if (salaryMin) url.searchParams.set('salary_min', String(salaryMin))

    const res = await withTimeout(fetch(url.toString()), 10000, `Adzuna: ${term}`)
    const data = await res.json()
    return data.results || []
  } catch (err: any) {
    console.log(`[ADZUNA] Failed for "${term}": ${err.message}`)
    return []
  }
}

// ✅ Fetch JSearch for a single term
async function fetchJSearchTerm(
  term: string,
  country: string,
  remoteOnly: boolean
): Promise<any[]> {
  try {
    const query = remoteOnly ? `${term} remote` : term
    const url = new URL('https://jsearch.p.rapidapi.com/search')
    url.searchParams.set('query', `${query} in ${getCountryName(country)}`)
    url.searchParams.set('num_pages', '1')
    url.searchParams.set('page', '1')
    url.searchParams.set('results_per_page', '10')

    const res = await withTimeout(
      fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': process.env.JSEARCH_API_KEY!,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      }),
      10000,
      `JSearch: ${term}`
    )
    const data = await res.json()
    return (data.data || []).map((job: any) => ({
      id: `jsearch_${job.job_id}`,
      title: job.job_title,
      company: { display_name: job.employer_name },
      location: { display_name: `${job.job_city || ''} ${job.job_country || ''}`.trim() },
      description: job.job_description,
      salary_min: job.job_min_salary || null,
      salary_max: job.job_max_salary || null,
      redirect_url: job.job_apply_link,
      source: 'jsearch'
    }))
  } catch (err: any) {
    console.log(`[JSEARCH] Failed for "${term}": ${err.message}`)
    return []
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ✅ Fetch profile once — get both AI text and preferences
    const { profileText, profileData } = await getUserProfile(supabase, user.id)

    const searchTerms: string[] = profileData?.search_terms?.length
      ? profileData.search_terms
      : ['software developer']

    const country: string = profileData?.country || 'za'
    const userSkills: string[] = profileData?.skills || []
    const remoteOnly: boolean = profileData?.remote_only || false
    const salaryMin: number | null = profileData?.salary_min || null

    // ✅ Fetch feedback and signals in parallel with job fetching
    const [feedbackContext, learnedSignals, ...jobResults] = await Promise.all([
      getUserFeedbackContext(supabase, user.id),
      getLearnedSignals(supabase, user.id),
      // ✅ All Adzuna + JSearch terms run in parallel
      ...searchTerms.map(term => fetchAdzunaJobs(term, country, remoteOnly, salaryMin)),
      ...searchTerms.slice(0, 2).map(term => fetchJSearchTerm(term, country, remoteOnly))
    ])

    // ✅ Merge all results and deduplicate by ID
    const allResults = jobResults.flat()
    const seen = new Set<string>()
    const uniqueResults = allResults.filter(job => {
      const id = String(job.id)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    if (!uniqueResults.length) {
      return NextResponse.json({ error: 'No results from any source' }, { status: 500 })
    }

    let newJobs = 0
    let skipped = 0
    let scored = 0

    for (const job of uniqueResults) {
      const externalId = String(job.id)
      const company = job.company?.display_name || 'Unknown'
      const description = job.description || ''

      // Skip duplicates per user
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

      // ✅ Check cache before hitting AI
      const cacheKey = `${externalId}_${user.id}`
      let scoreResult = scoreCache.get(cacheKey)

      if (!scoreResult) {
        scoreResult = await scoreJob(
          job.title,
          description,
          stack,
          profileText,
          feedbackContext,
          learnedSignals,
          userSkills,
          salaryMin,
          job.salary_min || null,
          remoteOnly
        )
        scoreCache.set(cacheKey, scoreResult, 86400)
      } else {
        console.log(`[CACHE HIT] ${job.title}`)
      }

      const { score, reason } = scoreResult

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
        status: 'pending',
        source: (job as any).source || 'adzuna',
        seniority: detectSeniority(job.title),
        work_style: detectWorkStyle(description),
        stack_overlap: calculateStackOverlap(stack, userSkills)
      })

      console.log(`SAVED: ${job.title} at ${company} — score: ${score}`)
      newJobs++
      scored++
    }

    // ✅ Scan log counts all sources
    await supabase.from('scan_logs').insert({
      jobs_found: uniqueResults.length,
      jobs_new: newJobs,
      jobs_scored: scored,
      status: 'success'
    })

    return NextResponse.json({
      success: true,
      found: uniqueResults.length,
      saved: newJobs,
      skipped,
      scored
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}