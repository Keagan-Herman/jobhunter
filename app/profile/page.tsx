'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [education, setEducation] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [projects, setProjects] = useState('')
  const [searchTerms, setSearchTerms] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [coverLetterTone, setCoverLetterTone] = useState('professional')
const [coverLetterLength, setCoverLetterLength] = useState('short')
const [careerContext, setCareerContext] = useState('experienced')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name || '')
        setJobTitle(data.job_title || '')
        setCompany(data.company || '')
        setEducation(data.education || '')
        setSkills((data.skills || []).join(', '))
        setExperience(data.experience || '')
        setProjects(data.projects || '')
        setSearchTerms((data.search_terms || []).join(', '))
        setEmailNotifications(data.email_notifications ?? true)
        setCoverLetterTone(data.cover_letter_tone || 'professional')
setCoverLetterLength(data.cover_letter_length || 'short')
setCareerContext(data.career_context || 'experienced')
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImportCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportError('')

    const formData = new FormData()
    formData.append('cv', file)

    try {
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        body: formData
      })
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
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      job_title: jobTitle,
      company,
      education,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      experience,
      projects,
      updated_at: new Date().toISOString(),
      email_notifications: emailNotifications,
      cover_letter_tone: coverLetterTone,
cover_letter_length: coverLetterLength,
career_context: careerContext,
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#080812',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#333', fontFamily: "'DM Mono', monospace", fontSize: '13px'
    }}>Loading...</div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#080812',
      fontFamily: "'DM Sans', sans-serif", color: '#e0e0f0',
      padding: '24px 16px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;700&family=Syne:wght@800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea:focus, input:focus { border-color: #00ff87 !important; outline: none; }
      `}</style>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontSize: '28px',
              fontWeight: '800', color: '#fff'
            }}>
              Your <span style={{ color: '#00ff87' }}>Profile</span>
            </h1>
            <p style={{ color: '#444', fontSize: '12px', fontFamily: "'DM Mono', monospace", marginTop: '4px' }}>
              Used to score jobs and generate cover letters
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'transparent', border: '1px solid #1e1e38',
              color: '#444', padding: '8px 14px', borderRadius: '8px',
              fontFamily: "'DM Mono', monospace", fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ← Dashboard
          </button>
        </div>
        {/* CV Import */}
        <div style={{
          background: '#0a0a1a', border: '1px dashed #2a2a4a',
          borderRadius: '10px', padding: '20px', textAlign: 'center',
          marginBottom: '28px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            Import your CV to auto-fill your profile
          </div>
          <label style={{
            display: 'inline-block',
            background: importing ? '#0d0d20' : 'transparent',
            border: '1px solid #00ff87',
            color: '#00ff87', padding: '8px 20px',
            borderRadius: '8px', fontFamily: "'DM Mono', monospace",
            fontSize: '11px', fontWeight: '700', letterSpacing: '1px',
            cursor: importing ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase' as const
          }}>
            {importing ? 'Importing...' : '⚡ Import CV (PDF)'}
            <input
              type="file"
              accept=".pdf"
              onChange={handleImportCV}
              disabled={importing}
              style={{ display: 'none' }}
            />
          </label>
          {importError && (
            <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px', fontFamily: "'DM Mono', monospace" }}>
              {importError}
            </div>
          )}
          <div style={{ fontSize: '11px', color: '#333', marginTop: '8px', fontFamily: "'DM Mono', monospace" }}>
            PDF only · review before saving
          </div>
        </div>

        {/* Form */}
        <div style={{
          background: '#0d0d20', border: '1px solid #1e1e38',
          borderRadius: '14px', padding: '28px'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Keagan Herman" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Current Job Title</label>
            <input style={inputStyle} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Software Engineer at IOSYSTEMS" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Company</label>
            <input style={inputStyle} value={company} onChange={e => setCompany(e.target.value)} placeholder="IOSYSTEMS" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Education</label>
            <input style={inputStyle} value={education} onChange={e => setEducation(e.target.value)} placeholder="Diploma in IT & Software Development, IIE Varsity College" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Skills</label>
            <div style={{ fontSize: '11px', color: '#444', marginBottom: '6px', fontStyle: 'italic' }}>Comma separated &mdash; used to match and score jobs</div>
            <input style={inputStyle} value={skills} onChange={e => setSkills(e.target.value)} placeholder="TypeScript, JavaScript, C#, Flutter, Kotlin, React, PostgreSQL" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Experience</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' } as React.CSSProperties}
              value={experience}
              onChange={e => setExperience(e.target.value)}
              placeholder="2 years building web and mobile apps. Lead developer on Nevada LMS and Webroute systems..."
              rows={4}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Projects</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' } as React.CSSProperties}
              value={projects}
              onChange={e => setProjects(e.target.value)}
              placeholder="Fleet tracking app for trucks, Fitness tracking mobile app"
              rows={3}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Job Search Keywords</label>
            <div style={{ fontSize: '11px', color: '#444', marginBottom: '6px', fontStyle: 'italic' }}>
              Comma separated &mdash; used to search for jobs e.g. &quot;typescript developer, C# developer, flutter developer&quot;
            </div>
            <input
              style={inputStyle}
              value={searchTerms}
              onChange={e => setSearchTerms(e.target.value)}
              placeholder="typescript developer, C# developer, flutter developer"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <div
                onClick={() => setEmailNotifications(!emailNotifications)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: emailNotifications ? '#00ff87' : '#1e1e38',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#fff', position: 'absolute', top: '3px',
                  transition: 'left 0.2s',
                  left: emailNotifications ? '23px' : '3px'
                }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#aaa' }}>Email notifications</div>
                <div style={{ fontSize: '11px', color: '#444', fontFamily: "'DM Mono', monospace" }}>
                  Daily digest of new matching jobs
                </div>
              </div>
            </label>
          </div>
          {/* Cover Letter Preferences */}
<div style={{ marginBottom: '24px' }}>
  <div style={{
    fontSize: '11px', color: '#555', letterSpacing: '1.5px',
    textTransform: 'uppercase' as const, fontFamily: "'DM Mono', monospace",
    marginBottom: '14px'
  }}>
    Cover Letter Style
  </div>

  {/* Tone */}
  <div style={{ marginBottom: '12px' }}>
    <div style={{ fontSize: '11px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '8px' }}>Tone</div>
    <div style={{ display: 'flex', gap: '8px' }}>
      {[
        { value: 'professional', label: '💼 Professional' },
        { value: 'conversational', label: '😊 Conversational' },
        { value: 'creative', label: '🎨 Creative' },
      ].map(opt => (
        <button
          key={opt.value}
          onClick={() => setCoverLetterTone(opt.value)}
          style={{
            flex: 1, padding: '9px 6px', borderRadius: '8px', cursor: 'pointer',
            background: coverLetterTone === opt.value ? '#00ff8718' : '#0a0a1a',
            border: `1px solid ${coverLetterTone === opt.value ? '#00ff87' : '#1e1e38'}`,
            color: coverLetterTone === opt.value ? '#00ff87' : '#555',
            fontSize: '11px', fontFamily: "'DM Mono', monospace",
            transition: 'all 0.2s', textAlign: 'center' as const
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>

  {/* Length */}
  <div style={{ marginBottom: '12px' }}>
    <div style={{ fontSize: '11px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '8px' }}>Length</div>
    <div style={{ display: 'flex', gap: '8px' }}>
      {[
        { value: 'short', label: '⚡ Short & Punchy' },
        { value: 'detailed', label: '📝 Detailed' },
      ].map(opt => (
        <button
          key={opt.value}
          onClick={() => setCoverLetterLength(opt.value)}
          style={{
            flex: 1, padding: '9px', borderRadius: '8px', cursor: 'pointer',
            background: coverLetterLength === opt.value ? '#00ff8718' : '#0a0a1a',
            border: `1px solid ${coverLetterLength === opt.value ? '#00ff87' : '#1e1e38'}`,
            color: coverLetterLength === opt.value ? '#00ff87' : '#555',
            fontSize: '11px', fontFamily: "'DM Mono', monospace",
            transition: 'all 0.2s', textAlign: 'center' as const
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>

  {/* Career context */}
  <div>
    <div style={{ fontSize: '11px', color: '#444', fontFamily: "'DM Mono', monospace", marginBottom: '8px' }}>Career Stage</div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
      {[
        { value: 'first_job', label: '🌱 First Job' },
        { value: 'career_change', label: '🔄 Career Change' },
        { value: 'experienced', label: '🚀 Experienced' },
      ].map(opt => (
        <button
          key={opt.value}
          onClick={() => setCareerContext(opt.value)}
          style={{
            flex: 1, padding: '9px 6px', borderRadius: '8px', cursor: 'pointer',
            background: careerContext === opt.value ? '#00ff8718' : '#0a0a1a',
            border: `1px solid ${careerContext === opt.value ? '#00ff87' : '#1e1e38'}`,
            color: careerContext === opt.value ? '#00ff87' : '#555',
            fontSize: '11px', fontFamily: "'DM Mono', monospace",
            transition: 'all 0.2s', textAlign: 'center' as const
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
</div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              background: saved ? '#0d2e1f' : '#00ff87',
              border: saved ? '1px solid #00ff8740' : 'none',
              color: saved ? '#00ff87' : '#0a0a1a',
              padding: '13px', borderRadius: '8px',
              fontWeight: '700', fontFamily: "'DM Mono', monospace",
              fontSize: '12px', letterSpacing: '1px',
              textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1, transition: 'all 0.3s ease'
            }}
          >
            {saving ? 'Saving...' : saved ? '✓ Profile Saved!' : 'Save Profile'}
          </button>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '16px', fontSize: '12px',
          color: '#333', fontFamily: "'DM Mono', monospace"
        }}>
          Your profile is private — only you can see it
        </p>
      </div>
    </div>
  )
}
