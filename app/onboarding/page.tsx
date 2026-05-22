'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // If profile already exists skip onboarding
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (data) router.push('/dashboard')
    }
    check()
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
    if (e.target) e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
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

  const inputClasses = "w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-lg px-3.5 py-3 text-[#e0e0f0] text-[13px] outline-none focus:border-[#00ff87] transition-colors font-sans"
  const labelClasses = "block text-[11px] color-[#555] tracking-[1.5px] uppercase font-mono mb-1.5"

  return (
    <div className="min-h-screen bg-[#080812] font-sans text-[#e0e0f0] px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-[560px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-syne text-[28px] font-extrabold text-white tracking-tight">
            Job<span className="text-[#00ff87]">Hunter</span>
          </h1>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {['Welcome', 'Your Profile', 'Preferences'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-300
                  ${step > i + 1 ? 'bg-[#00ff87] text-[#0a0a1a]' : step === i + 1 ? 'border-2 border-[#00ff87] text-[#00ff87]' : 'bg-[#0d0d20] border-2 border-[#1e1e38] text-[#333]'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-mono ${step === i + 1 ? 'text-[#00ff87]' : 'text-[#333]'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-0.5 bg-[#1e1e38] rounded-full mt-1">
            <div className="h-full bg-[#00ff87] rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
            <h2 className="font-syne text-[22px] font-extrabold text-white mb-2 leading-tight">
              Welcome! Let&apos;s get you set up 👋
            </h2>
            <p className="text-[#555] text-[13px] leading-relaxed mb-7">
              JobHunter automatically finds and scores jobs based on your profile, then generates tailored cover letters. Takes about 2 minutes to set up.
            </p>

            {/* CV Import */}
            <div className="bg-[#0a0a1a] border border-dashed border-[#2a2a4a] rounded-xl p-6 text-center mb-4 group hover:border-[#00ff8740] transition-colors">
              <div className="text-3xl mb-2">📄</div>
              <div className="text-sm font-semibold text-[#e0e0f0] mb-1">
                Import your CV
              </div>
              <div className="text-xs text-[#444] mb-4">
                We&apos;ll auto-fill your profile from your CV
              </div>
              <label className={`inline-block border border-[#00ff87] text-[#00ff87] px-6 py-2.5 rounded-lg font-mono text-[11px] font-bold tracking-wider uppercase cursor-pointer transition-all hover:bg-[#00ff8710]
                ${importing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {importing ? 'Importing...' : '⚡ Upload PDF'}
                <input type="file" accept=".pdf" onChange={handleImportCV} disabled={importing} className="hidden" />
              </label>
              {importError && (
                <div className="text-[#ff6b6b] text-[12px] mt-2 font-mono">
                  {importError}
                </div>
              )}
            </div>

            <div className="text-center text-[#333] text-[12px] mb-4 font-mono uppercase tracking-widest">
              — or —
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-transparent border border-[#2a2a4a] text-[#666] py-3 rounded-lg font-mono text-[11px] font-bold tracking-wider uppercase cursor-pointer hover:border-[#444] hover:text-[#888] transition-all"
            >
              Fill in manually &rarr;
            </button>
          </div>
        )}

        {/* Step 2 — Profile */}
        {step === 2 && (
          <div className="bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
            <h2 className="font-syne text-[22px] font-extrabold text-white mb-1">
              Your Profile
            </h2>
            <p className="text-[#555] text-[13px] mb-6">
              This is used to score jobs and write cover letters.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className={labelClasses}>Full Name</label>
                <input className={inputClasses} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" />
              </div>
              <div>
                <label className={labelClasses}>Current Job Title</label>
                <input className={inputClasses} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Software Engineer at Acme Corp" />
              </div>
              <div>
                <label className={labelClasses}>Company</label>
                <input className={inputClasses} value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div>
                <label className={labelClasses}>Education</label>
                <input className={inputClasses} value={education} onChange={e => setEducation(e.target.value)} placeholder="BSc Computer Science, University of Cape Town" />
              </div>
              <div>
                <label className={labelClasses}>Skills</label>
                <div className="text-[11px] text-[#444] mb-1.5 italic">Comma separated</div>
                <input className={inputClasses} value={skills} onChange={e => setSkills(e.target.value)} placeholder="TypeScript, React, Python, SQL" />
              </div>
              <div>
                <label className={labelClasses}>Experience Summary</label>
                <textarea
                  className={`${inputClasses} resize-none leading-relaxed`}
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="Brief summary of your work experience..."
                  rows={3}
                />
              </div>
              <div>
                <label className={labelClasses}>Notable Projects</label>
                <textarea
                  className={`${inputClasses} resize-none leading-relaxed`}
                  value={projects}
                  onChange={e => setProjects(e.target.value)}
                  placeholder="Projects you&apos;ve built or contributed to..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-transparent border border-[#1e1e38] text-[#444] py-3 rounded-lg font-mono text-[11px] font-bold uppercase hover:border-[#2a2a4a] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!fullName || !skills}
                className={`flex-[2] bg-[#00ff87] text-[#0a0a1a] py-3 rounded-lg font-mono text-[11px] font-bold tracking-wider uppercase transition-all
                  ${!fullName || !skills ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 shadow-lg shadow-[#00ff8720]'}`}
              >
                Next &rarr; Preferences
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Preferences */}
        {step === 3 && (
          <div className="bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
            <h2 className="font-syne text-[22px] font-extrabold text-white mb-1">
              Job Preferences
            </h2>
            <p className="text-[#555] text-[13px] mb-6">
              Tell us what you&apos;re looking for.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className={labelClasses}>Search Keywords</label>
                <div className="text-[11px] text-[#444] mb-1.5 italic">
                  Comma separated &mdash; what to search for
                </div>
                <input
                  className={inputClasses}
                  value={searchTerms}
                  onChange={e => setSearchTerms(e.target.value)}
                  placeholder="software engineer, full stack developer, react developer"
                />
              </div>

              <div>
                <label className={labelClasses}>Country</label>
                <div className="relative">
                    <select
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className={`${inputClasses} appearance-none cursor-pointer pr-10`}
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
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#444]">▼</div>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Minimum Salary</label>
                <div className="text-[11px] text-[#444] mb-1.5 italic">
                  In your local currency &mdash; leave blank to see all
                </div>
                <input
                  className={inputClasses}
                  type="number"
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out
                      ${remoteOnly ? 'bg-[#00ff87]' : 'bg-[#1e1e38]'}`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ease-in-out
                      ${remoteOnly ? 'left-[23px]' : 'left-0.75'}`} />
                  </div>
                  <span className="text-[13px] text-[#aaa] group-hover:text-[#ccc] transition-colors">Remote only</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-transparent border border-[#1e1e38] text-[#444] py-3 rounded-lg font-mono text-[11px] font-bold uppercase hover:border-[#2a2a4a] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !searchTerms}
                className={`flex-[2] bg-[#00ff87] text-[#0a0a1a] py-3 rounded-lg font-mono text-[11px] font-bold tracking-wider uppercase transition-all
                  ${saving || !searchTerms ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 shadow-lg shadow-[#00ff8720]'}`}
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
