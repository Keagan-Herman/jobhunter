import { db, initDb } from '@/lib/db';
import { jobs, profiles, scanLogs } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { generateContent } from '@/lib/groq'
import { NextResponse } from 'next/server'
import { scoreCache } from '@/lib/cache'
import { withTimeout } from '@/lib/timeout'
import { LOCAL_USER_ID, ensureLocalUser } from '@/lib/db/user';
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
import { v4 as uuidv4 } from 'uuid';

initDb();

interface ScoreResult {
  score: number
  reason: string
  stack: string[]
  score_is_fallback: boolean
  culture_fit?: string
  interview_prep?: string
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
): Promise<ScoreResult> {
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
You are a world-class technical recruiter and career coach. Your task is to analyze a job listing against a candidate's profile with extreme precision.

CANDIDATE CONTEXT:
${profile}

${feedbackContext}

${learnedSignals}

JOB METADATA:
Title: ${title}
Detected Seniority: ${seniority}
Detected Work Style: ${workStyle}
Detected Stack: ${stack.join(', ')}
Calculated Stack Overlap: ${stackOverlap}%
Salary Context: ${jobSalaryMin ? `R${jobSalaryMin.toLocaleString()}` : 'Not specified'}
Full Description (excerpt): ${description?.slice(0, 2000)}

SCORING CALIBRATION:
- 95-100: "Dream Job" - Matches all skills, preferences, and seniority perfectly.
- 85-94: "Strong Fit" - Excellent stack match, right seniority, maybe minor preference gap.
- 70-84: "Good Fit" - Solid match, but requires some learning or minor compromise.
- 50-69: "Fair Fit" - Transferable skills present, but significant gaps in stack or seniority.
- < 50: "Poor Fit" - Mismatched seniority, field, or core technology.

CORE OBJECTIVES:
1. Be brutally honest. If the stack overlap is low (${stackOverlap}%), the score MUST reflect that.
2. Use "PAST BEHAVIOUR" and "LEARNED SIGNALS" to calibrate the score up or down.
3. Culture Fit: Analyze the *vibe* of the description (e.g., startup-grind, corporate-stability, engineering-excellence).
4. Interview Prep: Provide exactly 2 highly specific, technical, and high-leverage bullet points. No generic advice.

OUTPUT FORMAT (Strict JSON, no markdown, no prose):
{
  "score": number,
  "reason": "One punchy, sophisticated sentence explaining the score.",
  "stack": ["refined", "tech", "stack", "list"],
  "culture_fit": "A deep 1-2 sentence insight into company culture and fit.",
  "interview_prep": "Point 1\\nPoint 2"
}
`
    const text = await generateContent(prompt)
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return {
        score: result.score,
        reason: result.reason,
        stack: result.stack || stack,
        culture_fit: result.culture_fit,
        interview_prep: result.interview_prep,
        score_is_fallback: false
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.log('GROQ ERROR:', message.slice(0, 80))
    return {
      score: 50,
      reason: 'Scoring unavailable — saved for manual review',
      stack: stack,
      score_is_fallback: true
    }
  }
}

interface AdzunaJob {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  description: string
  salary_min: number | null
  salary_max: number | null
  redirect_url: string
  source?: string
}

interface AdzunaResponse {
  results: AdzunaJob[]
}

// ✅ Fetch Adzuna for a single term
async function fetchAdzunaJobs(
  term: string,
  country: string,
  remoteOnly: boolean,
  salaryMin: number | null
): Promise<AdzunaJob[]> {
  try {
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`)
    url.searchParams.set('app_id', process.env.ADZUNA_APP_ID!)
    url.searchParams.set('app_key', process.env.ADZUNA_API_KEY!)
    url.searchParams.set('results_per_page', '10')
    url.searchParams.set('what', remoteOnly ? `${term} remote` : term)
    url.searchParams.set('content-type', 'application/json')
    if (salaryMin) url.searchParams.set('salary_min', String(salaryMin))

    const res = await withTimeout(fetch(url.toString()), 10000, `Adzuna: ${term}`)
    const data = (await res.json()) as AdzunaResponse
    return data.results || []
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.log(`[ADZUNA] Failed for "${term}": ${message}`)
    return []
  }
}

interface JSearchJob {
  job_id: string
  job_title: string
  employer_name: string
  job_city?: string
  job_country?: string
  job_description: string
  job_min_salary: number | null
  job_max_salary: number | null
  job_apply_link: string
}

interface JSearchResponse {
  data: JSearchJob[]
}

// ✅ Fetch JSearch for a single term
async function fetchJSearchTerm(
  term: string,
  country: string,
  remoteOnly: boolean
): Promise<AdzunaJob[]> {
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
    const data = (await res.json()) as JSearchResponse
    return (data.data || []).map((job: JSearchJob) => ({
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.log(`[JSEARCH] Failed for "${term}": ${message}`)
    return []
  }
}

export async function GET() {
  try {
    const userId = await ensureLocalUser();

    // ✅ Fetch profile once — get both AI text and preferences
    const { profileText, profileData } = await getUserProfile(userId)

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
      getUserFeedbackContext(userId),
      getLearnedSignals(userId),
      // ✅ All Adzuna + JSearch terms run in parallel
      ...searchTerms.map(term => fetchAdzunaJobs(term, country, remoteOnly, salaryMin)),
      ...searchTerms.slice(0, 2).map(term => fetchJSearchTerm(term, country, remoteOnly))
    ]) as [string, string, ...AdzunaJob[][]]

    // ✅ Merge all results and deduplicate by ID
    const allResults = jobResults.flat() as AdzunaJob[]
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
    const existingJobs = await db.query.jobs.findMany({
      where: and(
        inArray(jobs.external_id, externalIds),
        eq(jobs.user_id, userId)
      ),
      columns: {
        external_id: true
      }
    });

    const existingSet = new Set(existingJobs?.map(j => j.external_id) || [])
    const resultsToScore = uniqueResults.filter(j => !existingSet.has(String(j.id)))

    let newJobs = 0
    let scored = 0

    for (const job of resultsToScore) {
      const externalId = String(job.id)
      const company = job.company?.display_name || 'Unknown'
      const description = job.description || ''

      const stack = extractStack(description)

      // ✅ Check cache before hitting AI
      let scoreResult: ScoreResult | null = await scoreCache.get(userId, externalId)

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

      const { score, reason, score_is_fallback, stack: aiStack, culture_fit, interview_prep } = scoreResult

      await db.insert(jobs).values({
        id: uuidv4(),
        user_id: userId,
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
        culture_fit,
        interview_prep,
        status: 'pending',
        source: job.source || 'adzuna',
        seniority: detectSeniority(job.title),
        work_style: detectWorkStyle(description),
        stack_overlap: calculateStackOverlap(stack, userSkills)
      })

      newJobs++
      scored++
    }

    // Update last_scan_at
    await db.update(profiles)
      .set({ last_scan_at: new Date().toISOString() })
      .where(eq(profiles.id, userId));

    // ✅ Scan log counts all sources
    await db.insert(scanLogs).values({
      id: uuidv4(),
      jobs_found: uniqueResults.length,
      jobs_new: newJobs,
      jobs_scored: scored,
      status: 'success'
    });

    return NextResponse.json({
      success: true,
      found: uniqueResults.length,
      saved: newJobs,
      skipped: uniqueResults.length - resultsToScore.length,
      scored
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
