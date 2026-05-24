'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importError, setImportError] = useState('')
  const [importStep, setImportStep] = useState('')

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
    setImportStep('Reading PDF...')

    const formData = new FormData()
    formData.append('cv', file)

    const timers: NodeJS.Timeout[] = []

    try {
      // Simulate steps for better UX
      timers.push(setTimeout(() => setImportStep('Analyzing with AI...'), 2000))
      timers.push(setTimeout(() => setImportStep('Extracting skills & experience...'), 4500))

      const res = await fetch('/api/parse-cv', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setImportStep('Finalizing profile...')
        const p = data.profile
        if (p.full_name) setFullName(p.full_name)
        if (p.job_title) setJobTitle(p.job_title)
        if (p.company) setCompany(p.company)
        if (p.education) setEducation(p.education)
        if (p.skills?.length) setSkills(p.skills.join(', '))
        if (p.experience) setExperience(p.experience)
        if (p.projects) setProjects(p.projects)
        if (p.search_terms?.length) setSearchTerms(p.search_terms.join(', '))

        // Clear simulation timers before final transition
        timers.forEach(clearTimeout)
        setTimeout(() => {
          setStep(2)
          setImporting(false)
          setImportStep('')
        }, 800)
      } else {
        setImportError(data.error || 'Failed to parse CV')
        timers.forEach(clearTimeout)
        setImporting(false)
      }
    } catch {
      setImportError('Failed to import CV')
      timers.forEach(clearTimeout)
      setImporting(false)
    }
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

  const inputClasses = "w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl px-4 py-3.5 text-[#e0e0f0] text-[14px] outline-none focus:border-[#00ff87] transition-all font-sans hover:border-[#2a2a4a]"
  const labelClasses = "block text-[10px] text-[#555] tracking-[2px] uppercase font-mono mb-2 font-bold"

  return (
    <div className="min-h-screen bg-[#080812] font-sans text-[#e0e0f0] px-6 py-12 flex flex-col items-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#00ff8705] rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-[#7b61ff05] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[600px] relative z-10">

        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="font-syne text-[32px] font-extrabold text-white tracking-tight">
            Job<span className="text-[#00ff87]">Hunter</span>
          </h1>
          <div className="text-[11px] font-mono text-[#444] uppercase tracking-[4px] mt-2 font-bold">AI Career Copilot</div>
        </div>

        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {['Welcome', 'Your Profile', 'Preferences'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold font-mono transition-all duration-500
                  ${step > i + 1 ? 'bg-[#00ff87] text-[#0a0a1a] shadow-[0_0_15px_#00ff8740]' : step === i + 1 ? 'border-2 border-[#00ff87] text-[#00ff87] shadow-[0_0_15px_#00ff8720]' : 'bg-[#0d0d20] border-2 border-[#1e1e38] text-[#333]'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${step === i + 1 ? 'text-[#00ff87]' : 'text-[#333]'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-[#1e1e38] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#00ff87] rounded-full transition-all duration-700 ease-in-out shadow-[0_0_10px_#00ff8780]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="bg-[#0d0d20]/80 backdrop-blur-xl border border-[#1e1e38] rounded-3xl p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
            <h2 className="font-syne text-[26px] font-extrabold text-white mb-3 leading-tight tracking-tight">
              Ready to land your next role? 👋
            </h2>
            <p className="text-[#666] text-[14px] leading-relaxed mb-10">
              JobHunter uses advanced AI to curate the best opportunities for you, score your fit instantly, and generate high-impact cover letters.
            </p>

            {/* CV Import */}
            <div className={`bg-[#0a0a1a] border-2 border-dashed rounded-2xl p-8 text-center mb-6 group transition-all duration-300
              ${importing ? 'border-[#00ff8740] bg-[#00ff8705]' : 'border-[#2a2a4a] hover:border-[#00ff8730] hover:bg-[#00ff8702]'}`}>

              {importing ? (
                <div className="flex flex-col items-center animate-in fade-in duration-300">
                  <div className="w-12 h-12 rounded-full border-3 border-[#00ff8710] border-t-[#00ff87] animate-spin mb-4" />
                  <div className="text-sm font-bold text-[#00ff87] font-mono uppercase tracking-[2px] mb-1 animate-pulse">
                    {importStep}
                  </div>
                  <div className="text-[11px] text-[#444] font-mono">This usually takes about 10-15 seconds</div>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-4 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-100 group-hover:scale-110">📄</div>
                  <div className="text-[16px] font-bold text-[#e0e0f0] mb-1 font-syne">
                    Import your CV
                  </div>
                  <div className="text-[12px] text-[#555] mb-6">
                    We&apos;ll auto-fill your profile to save you time.
                  </div>
                  <label className="inline-block bg-[#00ff8710] border border-[#00ff8730] text-[#00ff87] px-8 py-3 rounded-xl font-mono text-[11px] font-bold tracking-[2px] uppercase cursor-pointer transition-all hover:bg-[#00ff8720] hover:shadow-[0_0_20px_#00ff8715]">
                    ⚡ Upload PDF
                    <input type="file" accept=".pdf" onChange={handleImportCV} disabled={importing} className="hidden" />
                  </label>
                </>
              )}

              {importError && (
                <div className="text-[#ff6b6b] text-[11px] mt-4 font-mono font-bold bg-[#ff6b6b05] py-2 px-4 rounded-lg border border-[#ff6b6b10]">
                  {importError}
                </div>
              )}
            </div>

            <div className="text-center text-[#222] text-[10px] mb-6 font-mono font-bold uppercase tracking-[4px]">
              — or continue manually —
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-transparent border border-[#1e1e38] text-[#444] py-4 rounded-xl font-mono text-[11px] font-bold tracking-[2px] uppercase cursor-pointer hover:border-[#333] hover:text-[#777] transition-all"
            >
              Start from scratch &rarr;
            </button>
          </div>
        )}

        {/* Step 2 — Profile */}
        {step === 2 && (
          <div className="bg-[#0d0d20]/80 backdrop-blur-xl border border-[#1e1e38] rounded-3xl p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
            <h2 className="font-syne text-[26px] font-extrabold text-white mb-2 tracking-tight">
              Your Professional Profile
            </h2>
            <p className="text-[#666] text-[14px] mb-8 leading-relaxed">
              Our AI uses this context to score jobs and write high-conversion cover letters.
            </p>

            <div className="space-y-6 mb-10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Full Name</label>
                  <input className={inputClasses} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <label className={labelClasses}>Current Role</label>
                  <input className={inputClasses} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Senior Developer" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Company</label>
                  <input className={inputClasses} value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc" />
                </div>
                <div>
                  <label className={labelClasses}>Education</label>
                  <input className={inputClasses} value={education} onChange={e => setEducation(e.target.value)} placeholder="BSc Comp Sci" />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Skills & Technologies</label>
                <div className="text-[10px] text-[#444] mb-2 italic font-mono uppercase">Separated by commas</div>
                <input className={inputClasses} value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js, AWS" />
              </div>
              <div>
                <label className={labelClasses}>Experience Highlights</label>
                <textarea
                  className={`${inputClasses} resize-none leading-relaxed`}
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="Key achievements and responsibilities..."
                  rows={4}
                />
              </div>
              <div>
                <label className={labelClasses}>Notable Projects</label>
                <textarea
                  className={`${inputClasses} resize-none leading-relaxed`}
                  value={projects}
                  onChange={e => setProjects(e.target.value)}
                  placeholder="Personal or open-source projects..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-transparent border border-[#1e1e38] text-[#444] py-4 rounded-2xl font-mono text-[11px] font-bold uppercase hover:border-[#333] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!fullName || !skills}
                className={`flex-[2] bg-[#00ff87] text-[#0a0a1a] py-4 rounded-2xl font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all
                  ${!fullName || !skills ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 shadow-lg shadow-[#00ff8720] hover:-translate-y-0.5 active:translate-y-0'}`}
              >
                Next &rarr; Preferences
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Preferences */}
        {step === 3 && (
          <div className="bg-[#0d0d20]/80 backdrop-blur-xl border border-[#1e1e38] rounded-3xl p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
            <h2 className="font-syne text-[26px] font-extrabold text-white mb-2 tracking-tight">
              Search Preferences
            </h2>
            <p className="text-[#666] text-[14px] mb-8 leading-relaxed">
              Help us narrow down the perfect opportunities for you.
            </p>

            <div className="space-y-6 mb-10">
              <div>
                <label className={labelClasses}>Job Search Terms</label>
                <div className="text-[10px] text-[#444] mb-2 italic font-mono uppercase">
                  Comma separated keywords
                </div>
                <input
                  className={inputClasses}
                  value={searchTerms}
                  onChange={e => setSearchTerms(e.target.value)}
                  placeholder="frontend engineer, fullstack developer"
                />
              </div>

              <div>
                <label className={labelClasses}>Target Country</label>
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#333]">▼</div>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Minimum Annual Salary</label>
                <div className="text-[10px] text-[#444] mb-2 italic font-mono uppercase">
                  Local currency &mdash; blank for any
                </div>
                <input
                  className={inputClasses}
                  type="number"
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                  placeholder="e.g. 50000"
                />
              </div>

              <div className="pt-4 p-5 rounded-2xl bg-[#0a0a1a] border border-[#1e1e38]">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="space-y-1">
                    <div className="text-[14px] font-bold text-[#e0e0f0] group-hover:text-white transition-colors">Remote Only</div>
                    <div className="text-[11px] text-[#444] font-mono">Only show fully remote positions</div>
                  </div>
                  <div
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={`w-12 h-6.5 rounded-full relative transition-all duration-300 ease-in-out
                      ${remoteOnly ? 'bg-[#00ff87]' : 'bg-[#1e1e38]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.75 transition-all duration-300 shadow-sm
                      ${remoteOnly ? 'left-[23px]' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-transparent border border-[#1e1e38] text-[#444] py-4 rounded-2xl font-mono text-[11px] font-bold uppercase hover:border-[#333] transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !searchTerms}
                className={`flex-[2] bg-[#00ff87] text-[#0a0a1a] py-4 rounded-2xl font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all
                  ${saving || !searchTerms ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 shadow-lg shadow-[#00ff8730] hover:-translate-y-0.5 active:translate-y-0'}`}
              >
                {saving ? 'Preparing Dashboard...' : '🚀 Launch JobHunter'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
