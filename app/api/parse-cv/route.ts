import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/gemini'
import { withTimeout } from '@/lib/timeout'
import { NextResponse } from 'next/server'

function cleanPdfText(text: string): string {
    return text
        .replace(/\x00/g, '')           // null bytes
        .replace(/\r\n/g, '\n')         // normalize line endings
        .replace(/\n{3,}/g, '\n\n')     // collapse excessive blank lines
        .replace(/[ \t]{2,}/g, ' ')     // collapse excessive spaces
        .trim()
}

function coerceToArray(value: any): string[] {
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean)
    return []
}

export async function POST(request: Request) {
    try {
        // ✅ Auth check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('cv') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // File type check
        if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
            return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
        }

        // File size check — 5MB max
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large — max 5MB' }, { status: 400 })
        }

        // ✅ Use lib/pdf-parse.js directly to avoid Vercel serverless crash
        const pdf = (await import('pdf-parse/lib/pdf-parse.js' as string)).default as (buffer: Buffer) => Promise<{ text: string, numpages: number }>
        const buffer = Buffer.from(await file.arrayBuffer())

        let pdfData
        try {
            pdfData = await withTimeout(pdf(buffer), 15000, 'PDF parsing')
        } catch (err: any) {
            return NextResponse.json({
                error: 'Failed to read PDF — make sure the file is not corrupted or password protected'
            }, { status: 400 })
        }

        // ✅ Clean extracted text
        const text = cleanPdfText((pdfData as { text: string }).text).slice(0, 3000)
        // Empty text check for scanned PDFs
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

        const clean = result.replace(/```json|```/g, '').trim()

        let parsed
        try {
            parsed = JSON.parse(clean)
        } catch {
            return NextResponse.json({ error: 'AI failed to parse CV — please try again' }, { status: 500 })
        }

        // ✅ Coerce fields to correct types so profile save never crashes
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

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}