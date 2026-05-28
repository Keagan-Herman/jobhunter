import { generateContent } from '@/lib/groq'
import { withTimeout } from '@/lib/timeout'
import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import { ensureLocalUser } from '@/lib/db/user';

function cleanPdfText(text: string): string {
  return text
    .replace(/\x00/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function coerceToArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string').filter(Boolean)
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

export async function POST(request: Request) {
  try {
    await ensureLocalUser();
    return await handleParseCV(request)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Error in POST /api/parse-cv:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function handleParseCV(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('cv') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 5MB' }, { status: 400 })
    }

    let text: string
    try {
      const buffer = await file.arrayBuffer()
      const { text: extracted } = await withTimeout(
        extractText(new Uint8Array(buffer), { mergePages: true }),
        15000,
        'PDF parsing'
      )
      text = cleanPdfText(extracted).slice(0, 5000)
    } catch {
      return NextResponse.json({
        error: 'Failed to read PDF — make sure the file is not corrupted or password protected'
      }, { status: 400 })
    }

    if (!text.trim()) {
      return NextResponse.json({
        error: 'Could not extract text from this PDF. Make sure it is not a scanned image.'
      }, { status: 400 })
    }

    const prompt = `
Extract information from this CV and return ONLY valid JSON with no markdown or explanation.

CV TEXT:
${text}

Return exactly this structure:
{
  "full_name": "extracted full name",
  "job_title": "current or most recent job title and company e.g. Software Engineer at IOSYSTEMS",
  "company": "current or most recent company name",
  "education": "highest qualification and institution",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "2-3 sentence summary of work experience",
  "projects": "notable projects mentioned",
  "search_terms": ["search term 1", "search term 2", "search term 3", "search term 4"]
}

For search_terms, generate exactly 4 relevant job search keywords based on their skills e.g. "typescript developer", "C# developer", "full stack engineer", "mobile developer".
If any field is not found, use an empty string or empty array.
`

    let result: string
    try {
      result = await withTimeout(generateContent(prompt), 15000, 'AI CV parsing')
    } catch {
      return NextResponse.json({ error: 'AI timed out — please try again' }, { status: 500 })
    }

    const clean = result.replace(/\`\`\`json|\`\`\`/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'AI failed to parse CV — please try again' }, { status: 500 })
    }

    const safeProfile = {
      full_name: String(parsed.full_name || ''),
      job_title: String(parsed.job_title || ''),
      company: String(parsed.company || ''),
      education: String(parsed.education || ''),
      skills: coerceToArray(parsed.skills),
      experience: String(parsed.experience || ''),
      projects: String(parsed.projects || ''),
      search_terms: coerceToArray(parsed.search_terms),
    }

    return NextResponse.json({ success: true, profile: safeProfile })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
