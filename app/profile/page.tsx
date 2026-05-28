'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()

        if (data.profile) {
          const profile = data.profile
          setFullName(profile.full_name || '')
          setJobTitle(profile.job_title || '')
          setCompany(profile.company || '')
          setEducation(profile.education || '')
          setSkills((profile.skills || []).join(', '))
          setExperience(profile.experience || '')
          setProjects(profile.projects || '')
          setSearchTerms((profile.search_terms || []).join(', '))
          setEmailNotifications(profile.email_notifications ?? true)
          setCoverLetterTone(profile.cover_letter_tone || 'professional')
          setCoverLetterLength(profile.cover_letter_length || 'short')
          setCareerContext(profile.career_context || 'experienced')
        }
      } catch (err) {
        console.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
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
    if (e.target) e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
        const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                job_title: jobTitle,
                company,
                education,
                skills: skills.split(',').map(s => s.trim()).filter(Boolean),
                experience,
                projects,
                search_terms: searchTerms.split(',').map(s => s.trim()).filter(Boolean),
                email_notifications: emailNotifications,
                cover_letter_tone: coverLetterTone,
                cover_letter_length: coverLetterLength,
                career_context: careerContext,
            })
        })

        if (!res.ok) throw new Error('Failed to save profile')

        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    } catch (err) {
        console.error('Save failed', err)
    } finally {
        setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-[#444] tracking-widest uppercase">Loading Profile...</span>
      </div>
    </div>
  )

  const inputClasses = "w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl px-4 py-3 text-[#e0e0f0] text-sm outline-none focus:border-[#00ff87] transition-all font-sans"
  const labelClasses = "block text-[11px] text-[#444] tracking-[2px] uppercase font-mono mb-2 ml-1"

  return (
    <div className="min-h-screen bg-[#080812] text-[#e0e0f0] px-4 py-12 md:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="font-syne text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Your <span className="text-[#00ff87]">Profile</span>
            </h1>
            <p className="font-mono text-[11px] text-[#444] tracking-wider uppercase">
              Used to score jobs and generate cover letters
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-fit flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#1e1e38] text-[#666] font-mono text-[11px] font-bold tracking-widest uppercase hover:bg-[#1a1a3a] hover:text-white transition-all"
          >
            Dashboard
          </button>
        </header>

        <section className="bg-[#0a0a1a] border border-dashed border-[#2a2a4a] rounded-2xl p-8 text-center group hover:border-[#00ff8740] transition-colors shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-2">Import your CV</h3>
          <p className="text-sm text-[#555] mb-6 max-w-xs mx-auto font-sans">
            Auto-fill your entire profile from your CV. We support PDF format.
          </p>
          <label className={"inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-[#00ff87] text-[#00ff87] font-mono text-[11px] font-bold tracking-widest uppercase cursor-pointer transition-all hover:bg-[#00ff8710] " + (importing ? 'opacity-60 cursor-not-allowed' : '')}>
            {importing ? (
              <><div className="w-3 h-3 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin" /> Processing...</>
            ) : 'Upload PDF'}
            <input type="file" accept=".pdf" onChange={handleImportCV} disabled={importing} className="hidden" />
          </label>
          {importError && (
            <div className="mt-4 text-[#ff6b6b] text-[11px] font-mono font-bold uppercase tracking-wider bg-[#ff6b6b10] py-2 px-4 rounded-lg inline-block">
              {importError}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-8">
            <div className="bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
              <h2 className="font-syne text-xl font-bold text-white mb-2">Core Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Full Name</label>
                  <input className={inputClasses} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Keagan Herman" />
                </div>
                <div>
                  <label className={labelClasses}>Current Job Title</label>
                  <input className={inputClasses} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Software Engineer" />
                </div>
                <div>
                  <label className={labelClasses}>Company</label>
                  <input className={inputClasses} value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc" />
                </div>
                <div>
                  <label className={labelClasses}>Education</label>
                  <input className={inputClasses} value={education} onChange={e => setEducation(e.target.value)} placeholder="University of Life" />
                </div>
                <div>
                  <label className={labelClasses}>Skills</label>
                  <div className="text-[10px] text-[#444] mb-2 font-mono italic">COMMA SEPARATED — USED FOR SCORING</div>
                  <input className={inputClasses} value={skills} onChange={e => setSkills(e.target.value)} placeholder="TypeScript, React, Node.js" />
                </div>
                <div>
                  <label className={labelClasses}>Experience Summary</label>
                  <textarea
                    className={inputClasses + " resize-none leading-relaxed h-32"}
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder="Briefly describe your career journey..."
                  />
                </div>
                <div>
                  <label className={labelClasses}>Notable Projects</label>
                  <textarea
                    className={inputClasses + " resize-none leading-relaxed h-24"}
                    value={projects}
                    onChange={e => setProjects(e.target.value)}
                    placeholder="Projects that showcase your best work..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 space-y-8">
            <div className="bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
              <h2 className="font-syne text-xl font-bold text-white">Job Search</h2>
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>Search Keywords</label>
                  <div className="text-[10px] text-[#444] mb-2 font-mono italic uppercase">COMMA SEPARATED</div>
                  <input
                    className={inputClasses}
                    value={searchTerms}
                    onChange={e => setSearchTerms(e.target.value)}
                    placeholder="frontend engineer, react developer"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-white group-hover:text-[#00ff87] transition-colors">Email Updates</div>
                      <div className="text-[11px] text-[#444] font-mono uppercase tracking-wider">Daily matching jobs</div>
                    </div>
                    <div
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={"w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out " + (emailNotifications ? 'bg-[#00ff87]' : 'bg-[#1e1e38]')}>
                      <div className={"w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all duration-300 ease-in-out " + (emailNotifications ? 'left-[23px]' : 'left-0.75')} />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
              <h2 className="font-syne text-xl font-bold text-white">Cover Letter Style</h2>
              <div className="space-y-3">
                <label className={labelClasses}>Tone</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'professional', label: 'Professional' },
                    { value: 'conversational', label: 'Conversational' },
                    { value: 'creative', label: 'Creative' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCoverLetterTone(opt.value)}
                      className={"px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-tight text-left transition-all border " + (coverLetterTone === opt.value ? 'bg-[#00ff8710] border-[#00ff87] text-[#00ff87]' : 'bg-[#0a0a1a] border-[#1e1e38] text-[#444] hover:border-[#333]')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className={labelClasses}>Length</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'short', label: 'Short' },
                    { value: 'detailed', label: 'Detailed' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCoverLetterLength(opt.value)}
                      className={"px-3 py-2.5 rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase transition-all border text-center " + (coverLetterLength === opt.value ? 'bg-[#00ff8710] border-[#00ff87] text-[#00ff87]' : 'bg-[#0a0a1a] border-[#1e1e38] text-[#444] hover:border-[#333]')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className={labelClasses}>Career Stage</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'first_job', label: 'First Job' },
                    { value: 'career_change', label: 'Career Change' },
                    { value: 'experienced', label: 'Experienced Professional' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCareerContext(opt.value)}
                      className={"px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-tight text-left transition-all border " + (careerContext === opt.value ? 'bg-[#00ff8710] border-[#00ff87] text-[#00ff87]' : 'bg-[#0a0a1a] border-[#1e1e38] text-[#444] hover:border-[#333]')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="sticky bottom-8 z-50 py-6 border-t border-[#1a1a32] bg-[#080812]/80 backdrop-blur-xl rounded-2xl shadow-[0_-10px_40px_-20px_#00ff8740] flex flex-col md:flex-row items-center justify-between gap-6 px-8">
          <div className="text-[11px] font-mono text-[#333] tracking-[2px] uppercase text-center md:text-left">
            Your data is private & secure
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={"w-full md:w-fit min-w-[240px] py-4 rounded-xl font-mono text-xs font-bold tracking-[3px] uppercase transition-all duration-500 shadow-2xl " + (saved ? 'bg-[#00ff8720] border border-[#00ff8740] text-[#00ff87]' : 'bg-[#00ff87] text-[#0a0a1a] hover:brightness-110 active:translate-y-px')}>
            {saving ? 'Processing...' : saved ? 'Profile Updated' : 'Save All Changes'}
          </button>
        </footer>
      </div>
    </div>
  )
}
