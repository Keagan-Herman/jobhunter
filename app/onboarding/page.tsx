'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { mockUser, isDev } from '@/lib/auth-mock'

const inputStyle = {
  width: '100%', background: '#0a0a1a',
  border: '1px solid #1e1e38', borderRadius: '8px',
  padding: '12px 14px', color: '#e0e0f0', fontSize: '13px',
  fontFamily: "'DM Sans', sans-serif", outline: 'none',
  transition: 'border-color 0.2s'
}

const labelStyle = {
  display: 'block', fontSize: '11px', color: '#555',
  letterSpacing: '1.5px', textTransform: 'uppercase' as const,
  fontFamily: "'DM Mono', monospace", marginBottom: '6px'
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importError, setImportError] = useState('')

  // Step 2 fields
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [education, setEducation] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [projects, setProjects] = useState('')

  // Step 3 fields
  const [searchTerms, setSearchTerms] = useState('')
  const [country, setCountry] = useState('za')
  const [salaryMin, setSalaryMin] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      let user;
      if (isDev) {
        user = mockUser
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) { router.push('/login'); return }
        user = authUser
      }

      // If profile already exists skip onboarding
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (data) router.push('/dashboard')
    }
    check()
  }, [])

  const handleImportCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError('')

    const formData = new FormData()
    formData.append('cv', file)

    try {
      const res = await fetch('/api/parse-cv', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        const p = data.profile
        if (p.full_name) setFullName(p.full_name)
        if (p.job_title) setJobTitle(p.job_title)
        if (p.company) setCompany(p.company)
        if (p.education) setEducation(p.education)
        if (p.skills?.length) setSkills(p.skills.join(', '))
        if (p.experience) setExperience(p.experience)
        if (p.projects) setProjects(p.projects)
        if (p.search_terms?.length) setSearchTerms(p.search_terms.join(', '))
        setStep(2)
      } else {
        setImportError(data.error || 'Failed to parse CV')
      }
    } catch {
      setImportError('Failed to import CV')
    }
    setImporting(false)
    e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    let user;
    if (isDev) {
        user = mockUser
    } else {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return
        user = authUser
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      job_title: jobTitle,
      company,
      education,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      experience,
      projects,
      search_terms: searchTerms.split(',').map(s => s.trim()).filter(Boolean),
      country,
      salary_min: salaryMin ? parseInt(salaryMin) : null,
      remote_only: remoteOnly,
      updated_at: new Date().toISOString()
    })

    setSaving(false)
    router.push('/dashboard?firstTime=true')
  }

  const progress = (step / 3) * 100

  return (
    <div style={{
      minHeight: '100vh', background: '#080812',
      fontFamily: "'DM Sans', sans-serif", color: '#e0e0f0',
      padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;700&family=Syne:wght@800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, textarea:focus { border-color: #00ff87 !important; outline: none; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '28px',
            fontWeight: '800', color: '#fff'
          }}>
            Job<span style={{ color: '#00ff87' }}>Hunter</span>
          </h1>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            {['Welcome', 'Your Profile', 'Preferences'].map((label, i) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: step > i + 1 ? '#00ff87' : step === i + 1 ? 'transparent' : '#0d0d20',
                  border: step === i + 1 ? '2px solid #00ff87' : step > i + 1 ? 'none' : '2px solid #1e1e38',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '700', color: step > i + 1 ? '#0a0a1a' : step === i + 1 ? '#00ff87' : '#333',
                  fontFamily: "'DM Mono', monospace", transition: 'all 0.3s'
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '10px', color: step === i + 1 ? '#00ff87' : '#333', fontFamily: "'DM Mono', monospace' " }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: '2px', background: '#1e1e38', borderRadius: '2px', marginTop: '4px' }}>
            <div style={{
              height: '100%', background: '#00ff87', borderRadius: '2px',
              width: `${progress}%`, transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="fade-in" style={{
            background: '#0d0d20', border: '1px solid #1e1e38',
            borderRadius: '14px', padding: '32px'
          }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
              Welcome! Let's get you set up 👋
            </h2>
            <p style={{ color: '#555', fontSize: '13px', lineHeight: 1.7, marginBottom: '28px' }}>
              JobHunter automatically finds and scores jobs based on your profile, then generates tailored cover letters. Takes about 2 minutes to set up.
            </p>

            {/* CV Import */}
            <div style={{
              background: '#0a0a1a', border: '1px dashed #2a2a4a',
              borderRadius: '10px', padding: '24px', textAlign: 'center', marginBottom: '16px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#e0e0f0', marginBottom: '4px' }}>
                Import your CV
              </div>
              <div style={{ fontSize: '12px', color: '#444', marginBottom: '16px' }}>
                We'll auto-fill your profile from your CV
              </div>
              <label style={{
                display: 'inline-block', border: '1px solid #00ff87',
                color: '#00ff87', padding: '10px 24px', borderRadius: '8px',
                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                fontWeight: '700', letterSpacing: '1px',
                cursor: importing ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase' as const,
                opacity: importing ? 0.6 : 1
              }}>
                {importing ? 'Importing...' : '⚡ Upload PDF'}
                <input type="file" accept=".pdf" onChange={handleImportCV} disabled={importing} style={{ display: 'none' }} />
              </label>
              {importError && (
                <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px', fontFamily: "'DM Mono', monospace" }}>
                  {importError}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', color: '#333', fontSize: '12px', marginBottom: '16px', fontFamily: "'DM Mono', monospace" }}>
              — or —
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid #2a2a4a', color: '#666',
                padding: '12px', borderRadius: '8px',
                fontFamily: "'DM Mono', monospace", fontSize: '11px',
                fontWeight: '700', letterSpacing: '1px',
                cursor: 'pointer', textTransform: 'uppercase' as const
              }}
            >
              Fill in manually →
            </button>
          </div>
        )}

        {/* Step 2 — Profile */}
        {step === 2 && (
          <div className="fade-in" style={{
            background: '#0d0d20', border: '1px solid #1e1e38',
            borderRadius: '14px', padding: '32px'
          }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              Your Profile
            </h2>
            <p style={{ color: '#555', fontSize: '13px', marginBottom: '24px' }}>
              This is used to score jobs and write cover letters.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Current Job Title</label>
              <input style={inputStyle} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Software Engineer at Acme Corp" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Company</label>
              <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Education</label>
              <input style={inputStyle} value={education} onChange={e => setEducation(e.target.value)} placeholder="BSc Computer Science, University of Cape Town" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Skills</label>
              <div style={{ fontSize: '11px', color: '#444', marginBottom: '6px', fontStyle: 'italic' }}>Comma separated</div>
              <input style={inputStyle} value={skills} onChange={e => setSkills(e.target.value)} placeholder="TypeScript, React, Python, SQL" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Experience Summary</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' } as any}
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="Brief summary of your work experience..."
                rows={3}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Notable Projects</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' } as any}
                value={projects}
                onChange={e => setProjects(e.target.value)}
                placeholder="Projects you've built or contributed to..."
                rows={2}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid #1e1e38',
                  color: '#444', padding: '12px', borderRadius: '8px',
                  fontFamily: "'DM Mono', monospace", fontSize: '11px', cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!fullName || !skills}
                style={{
                  flex: 2, background: '#00ff87', border: 'none',
                  color: '#0a0a1a', padding: '12px', borderRadius: '8px',
                  fontFamily: "'DM Mono', monospace", fontSize: '11px',
                  fontWeight: '700', letterSpacing: '1px',
                  cursor: !fullName || !skills ? 'not-allowed' : 'pointer',
                  opacity: !fullName || !skills ? 0.5 : 1,
                  textTransform: 'uppercase' as const
                }}
              >
                Next → Preferences
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Preferences */}
        {step === 3 && (
          <div className="fade-in" style={{
            background: '#0d0d20', border: '1px solid #1e1e38',
            borderRadius: '14px', padding: '32px'
          }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              Job Preferences
            </h2>
            <p style={{ color: '#555', fontSize: '13px', marginBottom: '24px' }}>
              Tell us what you're looking for.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Search Keywords</label>
              <div style={{ fontSize: '11px', color: '#444', marginBottom: '6px', fontStyle: 'italic' }}>
                Comma separated — what to search for
              </div>
              <input
                style={inputStyle}
                value={searchTerms}
                onChange={e => setSearchTerms(e.target.value)}
                placeholder="software engineer, full stack developer, react developer"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Country</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                style={{
                  ...inputStyle, cursor: 'pointer',
                  appearance: 'none' as any
                }}
              >
                <option value="za">🇿🇦 South Africa</option>
                <option value="gb">🇬🇧 United Kingdom</option>
                <option value="us">🇺🇸 United States</option>
                <option value="au">🇦🇺 Australia</option>
                <option value="ca">🇨🇦 Canada</option>
                <option value="de">🇩🇪 Germany</option>
                <option value="nl">🇳🇱 Netherlands</option>
                <option value="sg">🇸🇬 Singapore</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Minimum Salary</label>
              <div style={{ fontSize: '11px', color: '#444', marginBottom: '6px', fontStyle: 'italic' }}>
                In your local currency — leave blank to see all
              </div>
              <input
                style={inputStyle}
                type="number"
                value={salaryMin}
                onChange={e => setSalaryMin(e.target.value)}
                placeholder="e.g. 25000"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <div
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    background: remoteOnly ? '#00ff87' : '#1e1e38',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#fff', position: 'absolute',
                    top: '3px', transition: 'left 0.2s',
                    left: remoteOnly ? '23px' : '3px'
                  }} />
                </div>
                <span style={{ fontSize: '13px', color: '#aaa' }}>Remote only</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1, background: 'transparent', border: '1px solid #1e1e38',
                  color: '#444', padding: '12px', borderRadius: '8px',
                  fontFamily: "'DM Mono', monospace", fontSize: '11px', cursor: 'pointer'
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !searchTerms}
                style={{
                  flex: 2, background: '#00ff87', border: 'none',
                  color: '#0a0a1a', padding: '12px', borderRadius: '8px',
                  fontFamily: "'DM Mono', monospace", fontSize: '11px',
                  fontWeight: '700', letterSpacing: '1px',
                  cursor: saving || !searchTerms ? 'not-allowed' : 'pointer',
                  opacity: saving || !searchTerms ? 0.5 : 1,
                  textTransform: 'uppercase' as const
                }}
              >
                {saving ? 'Setting up...' : '🚀 Launch JobHunter'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}