export type Profile = {
    id: string
    full_name: string | null
    job_title: string | null
    company: string | null
    education: string | null
    skills: string[] | null
    experience: string | null
    projects: string | null
    country: string | null
    remote_only: boolean | null
    salary_min: number | null
    search_terms: string[] | null
    cover_letter_tone: string | null
    cover_letter_length: string | null
    career_context: string | null
    last_scan_at: string | null
}

export type Job = {
    id: string
    user_id: string
    external_id: string
    title: string
    company: string
    location: string | null
    description: string | null
    salary_min: number | null
    salary_max: number | null
    url: string | null
    stack: string[] | null
    score: number | null
    score_reason: string | null
    score_is_fallback: boolean
    status: 'pending' | 'applied' | 'skipped' | 'interviewing'
    source: string | null
    seniority: string | null
    work_style: string | null
    stack_overlap: number | null
    notes: string | null
    interview_date: string | null
    contact_name: string | null
    contact_email: string | null
    offer_amount: number | null
    follow_up_date: string | null
    cover_letter?: string
    cover_letter_id?: string
}
