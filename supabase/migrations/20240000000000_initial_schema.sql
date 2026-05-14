-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    job_title TEXT,
    company TEXT,
    education TEXT,
    skills TEXT[],
    experience TEXT,
    projects TEXT,
    country TEXT DEFAULT 'za',
    remote_only BOOLEAN DEFAULT FALSE,
    salary_min INTEGER,
    search_terms TEXT[],
    cover_letter_tone TEXT DEFAULT 'professional',
    cover_letter_length TEXT DEFAULT 'short',
    career_context TEXT DEFAULT 'experienced',
    last_scan_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    description TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    url TEXT,
    stack TEXT[],
    score INTEGER,
    score_reason TEXT,
    score_is_fallback BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending', -- pending, applied, skipped, interviewing
    source TEXT,
    seniority TEXT,
    work_style TEXT,
    stack_overlap INTEGER,
    notes TEXT,
    interview_date TIMESTAMPTZ,
    contact_name TEXT,
    contact_email TEXT,
    offer_amount NUMERIC,
    follow_up_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, external_id)
);

-- Job feedback for AI learning
CREATE TABLE job_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- applied, skipped
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cover letters
CREATE TABLE cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    outcome TEXT, -- interviewed, rejected, no_response
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Successful cover letter patterns
CREATE TABLE cover_letter_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    outcome TEXT NOT NULL,
    job_title TEXT,
    company TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned signals for scoring calibration
CREATE TABLE learned_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL, -- stack, seniority, work_style
    signal_value TEXT NOT NULL,
    weight NUMERIC DEFAULT 1.0,
    outcome TEXT NOT NULL, -- positive, negative
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan logs
CREATE TABLE scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jobs_found INTEGER,
    jobs_new INTEGER,
    jobs_scored INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview outcomes
CREATE TABLE interview_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    outcome TEXT NOT NULL, -- offer, rejected_after_interview, withdrew, ghosted
    interview_round INTEGER DEFAULT 1,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- View for jobs with their latest cover letter
CREATE VIEW jobs_with_cover AS
SELECT
    j.*,
    cl.content as cover_letter,
    cl.id as cover_letter_id
FROM jobs j
LEFT JOIN LATERAL (
    SELECT id, content
    FROM cover_letters
    WHERE job_id = j.id
    ORDER BY version DESC
    LIMIT 1
) cl ON TRUE;
