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
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      job_title: jobTitle,
      company,
      education,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      experience,
      projects,
      updated_at: new Date().toISOString()
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
            <div style={{ fontSize: '11px', color: '#444', marginBottom: '6px', fontStyle: 'italic' }}>Comma separated — used to match and score jobs</div>
            <input style={inputStyle} value={skills} onChange={e => setSkills(e.target.value)} placeholder="TypeScript, JavaScript, C#, Flutter, Kotlin, React, PostgreSQL" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Experience</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' } as any}
              value={experience}
              onChange={e => setExperience(e.target.value)}
              placeholder="2 years building web and mobile apps. Lead developer on Nevada LMS and Webroute systems..."
              rows={4}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Projects</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' } as any}
              value={projects}
              onChange={e => setProjects(e.target.value)}
              placeholder="Fleet tracking app for trucks, Fitness tracking mobile app"
              rows={3}
            />
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
