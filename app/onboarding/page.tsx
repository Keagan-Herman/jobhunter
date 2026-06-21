'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importError, setImportError] = useState('')
  const [importStep, setImportStep] = useState('')
  const [saveError, setSaveError] = useState('')

  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [education, setEducation] = useState('')
  const [skills, setSkills] = useState('')
  const [experience, setExperience] = useState('')
  const [projects, setProjects] = useState('')

  const [searchTerms, setSearchTerms] = useState('')
  const [country, setCountry] = useState('za')
  const [salaryMin, setSalaryMin] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (data.profile && data.profile.full_name && data.profile.full_name !== 'Local User') {
          router.push('/dashboard')
        }
      } catch {
        console.error('Check failed')
      }
    }
    check()
  }, [router])

  const handleImportCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError('')
    setImportStep('Reading source...')

    const formData = new FormData()
    formData.append('cv', file)

    const timers: NodeJS.Timeout[] = []
    const clearTimers = () => timers.forEach(clearTimeout)

    try {
      timers.push(setTimeout(() => setImportStep('Analyzing content...'), 2000))
      timers.push(setTimeout(() => setImportStep('Extracting data...'), 4500))

      const res = await fetch('/api/parse-cv', { method: 'POST', body: formData })
      let data: {
        success?: boolean
        error?: string
        profile?: { full_name?: string; job_title?: string; company?: string; education?: string; skills?: string[]; experience?: string; projects?: string; search_terms?: string[] }
      }
      try {
        data = await res.json()
      } catch {
        throw new Error('Upload failed — please try again.')
      }

      if (data.success && data.profile) {
        setImportStep('Finalizing configuration...')
        const p = data.profile
        if (p.full_name) setFullName(p.full_name)
        if (p.job_title) setJobTitle(p.job_title)
        if (p.company) setCompany(p.company)
        if (p.education) setEducation(p.education)
        if (p.skills?.length) setSkills(p.skills.join(', '))
        if (p.experience) setExperience(p.experience)
        if (p.projects) setProjects(p.projects)
        if (p.search_terms?.length) setSearchTerms(p.search_terms.join(', '))
        clearTimers()
        setImporting(false)
        setStep(2)
      } else {
        setImportError(data.error || 'Import failed — please try again or enter details manually.')
        clearTimers()
        setImporting(false)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error — please check your connection and try again.'
      setImportError(msg)
      clearTimers()
      setImporting(false)
    }
    if (e.target) e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')

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
          country,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          remote_only: remoteOnly,
        })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'Failed to save — please try again.')
      }
      router.push('/dashboard?firstTime=true')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save — please try again.'
      setSaveError(msg)
      console.error('Save failed', err)
    } finally {
      setSaving(false)
    }
  }

  const progress = (step / 3) * 100

  const inputClasses = "w-full bg-white border border-[#e2e2d9] rounded-sm px-4 py-3 text-[#1a1a1a] text-[14px] outline-none focus:border-[#c5a059] transition-all font-sans"
  const labelClasses = "block text-[10px] text-[#888] tracking-[2px] uppercase font-mono mb-2 font-bold"

  return (
    <div className="min-h-screen bg-[#f8f8f4] font-sans text-[#1a1a1a] px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 grid-overlay opacity-30 pointer-events-none" />

      <div className="w-full max-w-[650px] relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="font-syne text-[28px] sm:text-[32px] font-bold text-[#1a1a1a] tracking-tight uppercase">
            Job<span className="text-[#c5a059] italic">Hunter</span>
          </h1>
          <div className="text-[10px] font-mono text-[#888] uppercase tracking-[4px] mt-2 font-bold">Professional Configuration</div>
        </div>

        {/* Step progress */}
        <div className="mb-10 sm:mb-16">
          <div className="flex justify-between mb-5 sm:mb-6">
            {['Welcome', 'Profile', 'Criteria'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-2 sm:gap-3">
                <div className={"w-9 h-9 sm:w-10 sm:h-10 rounded-sm flex items-center justify-center text-[11px] sm:text-[12px] font-bold font-mono transition-all duration-500 " + (step > i + 1 ? 'bg-[#c5a059] text-white' : step === i + 1 ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e2e2d9] text-[#888]')}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={"text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest " + (step === i + 1 ? 'text-[#1a1a1a]' : 'text-[#888]')}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-[2px] bg-[#e2e2d9] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#c5a059] transition-all duration-700 ease-in-out" style={{ width: progress + "%" }} />
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="bg-white border border-[#e2e2d9] p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm tactile-pop">
            <h2 className="font-syne text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] mb-4 tracking-tight uppercase leading-tight">
              Begin your search
            </h2>
            <p className="text-[#666] text-[14px] sm:text-[15px] leading-[1.6] mb-8 sm:mb-12">
              Populate your professional profile automatically from your CV, or enter your details manually.
            </p>

            <div className={"bg-[#f8f8f4] border border-[#e2e2d9] p-6 sm:p-10 text-center mb-6 sm:mb-8 transition-all duration-300 " + (importing ? 'border-[#c5a059]' : 'hover:border-[#c5a059]/50')}>
              {importing ? (
                <div className="flex flex-col items-center py-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-[#e2e2d9] border-t-[#c5a059] animate-spin mb-5 sm:mb-6" />
                  <div className="text-[11px] font-bold text-[#c5a059] font-mono uppercase tracking-[3px] animate-pulse">
                    {importStep}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[16px] sm:text-[18px] font-bold text-[#1a1a1a] mb-2 font-syne uppercase tracking-tight">
                    Import CV Data
                  </div>
                  <div className="text-[13px] text-[#888] mb-6 sm:mb-8">
                    Automatically populate your professional criteria from a PDF.
                  </div>
                  <label className="inline-block bg-[#1a1a1a] text-white px-8 sm:px-10 py-4 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase cursor-pointer transition-all hover:bg-[#c5a059] shadow-md">
                    Upload CV / Resume
                    <input type="file" accept=".pdf" onChange={handleImportCV} disabled={importing} className="hidden" />
                  </label>
                </>
              )}

              {importError && (
                <div className="text-[#bc243c] text-[13px] mt-5 sm:mt-6 font-mono bg-[#bc243c]/10 py-4 px-4 sm:px-5 border border-[#bc243c]/30 text-left leading-[1.5]">
                  {importError}
                </div>
              )}
            </div>

            <div className="text-center text-[#e2e2d9] text-[10px] mb-6 sm:mb-8 font-mono font-bold uppercase tracking-[6px]">
              OR
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-white border border-[#e2e2d9] text-[#4a4a4a] py-4 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#f8f8f4] transition-all"
            >
              Enter Manually
            </button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <div className="bg-white border border-[#e2e2d9] p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm tactile-pop">
            <h2 className="font-syne text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] mb-2 tracking-tight uppercase leading-tight">
              Your Profile
            </h2>
            <p className="text-[#666] text-[14px] sm:text-[15px] mb-8 sm:mb-10 leading-[1.6]">
              This information is used for job matching and document generation.
            </p>

            <div className="space-y-5 sm:space-y-6 mb-8 sm:mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-1">
                  <label className={labelClasses}>Full Name <span className="text-[#c5a059]">*</span></label>
                  <input className={inputClasses} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Primary Role</label>
                  <input className={inputClasses} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Accountant, Nurse, Engineer" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-1">
                  <label className={labelClasses}>Education</label>
                  <input className={inputClasses} value={education} onChange={e => setEducation(e.target.value)} placeholder="e.g. BCom Accounting, Wits" />
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Current / Last Company</label>
                  <input className={inputClasses} value={company} onChange={e => setCompany(e.target.value)} placeholder="Organization Name" />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Skills & Competencies <span className="text-[#c5a059]">*</span></label>
                <div className="text-[9px] text-[#aaa] mb-1 font-mono uppercase">Comma separated</div>
                <input className={inputClasses} value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. Project Management, Python, Nursing, Excel" />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Professional Experience</label>
                <textarea
                  className={inputClasses + " resize-none leading-[1.6] h-28 sm:h-32"}
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="Brief summary of your work history and achievements..."
                />
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white border border-[#e2e2d9] text-[#4a4a4a] py-4 rounded-sm font-mono text-[11px] font-bold uppercase hover:bg-[#f8f8f4] transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!fullName || !skills}
                className={"flex-[2] bg-[#1a1a1a] text-white py-4 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all " + (!fullName || !skills ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#c5a059] shadow-md')}>
                Continue
              </button>
            </div>
            {(!fullName || !skills) && (
              <p className="text-center text-[10px] text-[#aaa] font-mono mt-3">
                Full Name and Skills are required to continue
              </p>
            )}
          </div>
        )}

        {/* Step 3: Criteria */}
        {step === 3 && (
          <div className="bg-white border border-[#e2e2d9] p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm tactile-pop">
            <h2 className="font-syne text-[22px] sm:text-[28px] font-bold text-[#1a1a1a] mb-2 tracking-tight uppercase leading-tight">
              Search Criteria
            </h2>
            <p className="text-[#666] text-[14px] sm:text-[15px] mb-8 sm:mb-10 leading-[1.6]">
              Parameters used to filter and score job listings.
            </p>

            <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
              <div className="space-y-1">
                <label className={labelClasses}>Target Job Titles / Keywords <span className="text-[#c5a059]">*</span></label>
                <input
                  className={inputClasses}
                  value={searchTerms}
                  onChange={e => setSearchTerms(e.target.value)}
                  placeholder="e.g. Accountant, Sales Manager, Nurse"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-1">
                  <label className={labelClasses}>Region</label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className={inputClasses + " cursor-pointer"}
                  >
                    <option value="za">South Africa</option>
                    <option value="gb">United Kingdom</option>
                    <option value="us">United States</option>
                    <option value="de">Germany</option>
                    <option value="nl">Netherlands</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Min Salary (Annual)</label>
                  <input
                    className={inputClasses}
                    type="number"
                    value={salaryMin}
                    onChange={e => setSalaryMin(e.target.value)}
                    placeholder="Leave blank to skip"
                  />
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-[#f8f8f4] border border-[#e2e2d9]">
                <label className="flex items-center justify-between cursor-pointer gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="text-[13px] sm:text-[14px] font-bold text-[#1a1a1a] uppercase tracking-tight">Remote Only</div>
                    <div className="text-[11px] text-[#888] font-mono">Prioritize remote-only listings</div>
                  </div>
                  <div
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={"flex-shrink-0 w-12 h-6 rounded-sm relative transition-all duration-300 " + (remoteOnly ? 'bg-[#c5a059]' : 'bg-[#e2e2d9]')}>
                    <div className={"w-5 h-5 bg-white absolute top-0.5 transition-all duration-300 shadow-sm " + (remoteOnly ? 'left-[26px]' : 'left-0.5')} />
                  </div>
                </label>
              </div>
            </div>

            {saveError && (
              <div className="text-[#bc243c] text-[13px] mb-5 sm:mb-6 font-mono bg-[#bc243c]/10 py-4 px-4 sm:px-5 border border-[#bc243c]/30 leading-[1.5]">
                {saveError}
              </div>
            )}

            <div className="flex gap-4 sm:gap-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white border border-[#e2e2d9] text-[#4a4a4a] py-4 rounded-sm font-mono text-[11px] font-bold uppercase hover:bg-[#f8f8f4] transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !searchTerms}
                className={"flex-[2] bg-[#1a1a1a] text-white py-4 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all " + (saving || !searchTerms ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#c5a059] shadow-md')}>
                {saving ? 'Saving...' : 'Launch Platform'}
              </button>
            </div>
            {!searchTerms && !saving && (
              <p className="text-center text-[10px] text-[#aaa] font-mono mt-3">
                Enter at least one job title or keyword to continue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
