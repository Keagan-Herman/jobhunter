import { createClient } from '@/lib/supabase/server'
import { mockUser, isDev } from '@/lib/auth-mock'
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { scoreCache } from '@/lib/cache'
import { withTimeout } from '@/lib/timeout'
import {
  getUserProfile,
  getUserFeedbackContext,
  getLearnedSignals,
  detectSeniority,
  detectWorkStyle,
  calculateStackOverlap,
  extractStack,
  getCountryName
} from '@/lib/profile'

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
): Promise<{ score: number, reason: string, stack: string[], score_is_fallback: boolean }> {
  try {
    const seniority = detectSeniority(title)
    const workStyle = detectWorkStyle(description)
    const stackOverlap = calculateStackOverlap(stack, userSkills)

    // Pre-filter obvious mismatches before hitting AI
    if (remoteOnly && workStyle === 'on-site') {
      return { score: 20, reason: 'On-site only — conflicts with remote preference', stack, score_is_fallback: false }
    }
    if (salaryMin && jobSalaryMin && jobSalaryMin < salaryMin * 0.8) {
      return { score: 25, reason: 'Salary below minimum preference', stack, score_is_fallback: false }
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
Stack (detected): ${stack.join(', ')}
Stack Overlap with Candidate: ${stackOverlap}%
Salary: ${jobSalaryMin ? `R${jobSalaryMin.toLocaleString()}` : 'Not specified'}
Description: ${description?.slice(0, 1500)}

SCORING GUIDE:
- 90-100: Perfect match — strong stack overlap, right seniority, matches preferences
- 75-89: Good match — most requirements met, minor gaps
- 60-74: Decent match — transferable skills, some gaps
- 40-59: Weak match — significant skill or preference gaps
- Below 40: Poor match — wrong field, seniority, or preferences

Consider stack overlap (${stackOverlap}%) heavily in your score.
Use past behaviour to calibrate further.

Respond ONLY with valid JSON, no markdown:
{"score": <0-100>, "reason": "<one punchy sentence explaining the score>", "stack": ["extracted", "tech", "stack"]}
`
    const text = await generateContent(prompt)
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return {
        score: result.score,
        reason: result.reason,
        stack: result.stack || stack,
        score_is_fallback: false
    }
  } catch (err: any) {
    console.log('GROQ ERROR:', err.message?.slice(0, 80))
    return { score: 50, reason: 'Scoring unavailable — saved for manual review', stack: stack, score_is_fallback: true }
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

    let user;
    if (isDev) {
        user = mockUser
    } else {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        user = authUser
    }

    // ✅ Fetch profile once — get both AI text and preferences
    const { profileText, profileData } = await getUserProfile(supabase, user.id)

    // Rate limiting check
    const lastScanAt = profileData?.last_scan_at
    if (lastScanAt) {
      const lastScan = new Date(lastScanAt)
      const now = new Date()
      const diffMs = now.getTime() - lastScan.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 30) {
        return NextResponse.json({ error: `Please wait ${30 - diffMins} minutes before scanning again.` }, { status: 429 })
      }
    }

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

    // Batch check existence
    const externalIds = uniqueResults.map(j => String(j.id))
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('external_id')
      .in('external_id', externalIds)
      .eq('user_id', user.id)

    const existingSet = new Set(existingJobs?.map(j => j.external_id) || [])
    const resultsToScore = uniqueResults.filter(j => !existingSet.has(String(j.id)))

    let newJobs = 0
    let scored = 0
    const jobsToInsert: any[] = []

    for (const job of resultsToScore) {
      const externalId = String(job.id)
      const company = job.company?.display_name || 'Unknown'
      const description = job.description || ''

      const stack = extractStack(description)

      // ✅ Check cache before hitting AI
      const cacheKey = `${externalId}_${user.id}`
      let scoreResult = await scoreCache.get(supabase, cacheKey)

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
      }

      const { score, reason, score_is_fallback, stack: aiStack } = scoreResult

      jobsToInsert.push({
        user_id: user.id,
        external_id: externalId,
        title: job.title,
        company,
        location: job.location?.display_name || 'Unknown',
        description: description.slice(0, 1500),
        salary_min: job.salary_min || null,
        salary_max: job.salary_max || null,
        url: job.redirect_url,
        stack: aiStack || stack,
        score,
        score_reason: reason,
        score_is_fallback: score_is_fallback || false,
        status: 'pending',
        source: (job as any).source || 'adzuna',
        seniority: detectSeniority(job.title),
        work_style: detectWorkStyle(description),
        stack_overlap: calculateStackOverlap(stack, userSkills)
      })

      newJobs++
      scored++
    }

    if (jobsToInsert.length > 0) {
        await supabase.from('jobs').insert(jobsToInsert)
    }

    // Update last_scan_at
    await supabase.from('profiles').update({ last_scan_at: new Date().toISOString() }).eq('id', user.id)

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
      skipped: uniqueResults.length - resultsToScore.length,
      scored
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
