'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importError, setImportError] = useState('')
  const [importStep, setImportStep] = useState('')

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
      const data = await res.json()
      if (data.success) {
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
        setStep(2)
      } else {
        setImportError(data.error || 'Import failed')
        clearTimers()
        setImporting(false)
      }
    } catch {
      setImportError('Import failed')
      clearTimers()
      setImporting(false)
    }
    if (e.target) e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)

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

        if (!res.ok) throw new Error('Failed to save configuration')
        router.push('/dashboard?firstTime=true')
    } catch (err) {
        console.error('Save failed', err)
    } finally {
        setSaving(false)
    }
  }

  const progress = (step / 3) * 100

  const inputClasses = "w-full bg-white border border-[#e2e2d9] rounded-sm px-4 py-3 text-[#1a1a1a] text-[14px] outline-none focus:border-[#c5a059] transition-all font-sans"
  const labelClasses = "block text-[10px] text-[#888] tracking-[2px] uppercase font-mono mb-2 font-bold"

  return (
    <div className="min-h-screen bg-[#f8f8f4] font-sans text-[#1a1a1a] px-6 py-12 flex flex-col items-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 grid-overlay opacity-30 pointer-events-none" />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#c5a05905] rounded-full blur-[100px] pointer-events-none animate-organic" />

      <div className="w-full max-w-[650px] relative z-10">
        <div className="text-center mb-16">
          <h1 className="font-syne text-[32px] font-bold text-[#1a1a1a] tracking-tight uppercase">
            Job<span className="text-[#c5a059] italic">Hunter</span>
          </h1>
          <div className="text-[10px] font-mono text-[#888] uppercase tracking-[4px] mt-2 font-bold">Professional Configuration</div>
        </div>

        <div className="mb-16">
          <div className="flex justify-between mb-6">
            {['Welcome', 'Profile', 'Criteria'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <div className={"w-10 h-10 rounded-sm flex items-center justify-center text-[12px] font-bold font-mono transition-all duration-500 " + (step > i + 1 ? 'bg-[#c5a059] text-white' : step === i + 1 ? 'bg-[#1a1a1a] text-white' : 'bg-white border border-[#e2e2d9] text-[#888]')}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={"text-[9px] font-mono font-bold uppercase tracking-widest " + (step === i + 1 ? 'text-[#1a1a1a]' : 'text-[#888]')}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-[2px] bg-[#e2e2d9] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#c5a059] transition-all duration-700 ease-in-out" style={{ width: progress + "%" }} />
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white border border-[#e2e2d9] p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm tactile-pop">
            <h2 className="font-syne text-[28px] font-bold text-[#1a1a1a] mb-4 tracking-tight uppercase leading-tight">
              Begin your search
            </h2>
            <p className="text-[#666] text-[15px] leading-[1.6] mb-12">
              Our analysis platform optimizes your job discovery process by aligning your professional profile with global market listings.
            </p>

            <div className={"bg-[#f8f8f4] border border-[#e2e2d9] p-10 text-center mb-8 transition-all duration-300 " + (importing ? 'border-[#c5a059]' : 'hover:border-[#c5a059]/50')}>
              {importing ? (
                <div className="flex flex-col items-center py-4">
                  <div className="w-12 h-12 border-2 border-[#e2e2d9] border-t-[#c5a059] animate-spin mb-6" />
                  <div className="text-[11px] font-bold text-[#c5a059] font-mono uppercase tracking-[3px] animate-pulse">
                    {importStep}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[18px] font-bold text-[#1a1a1a] mb-2 font-syne uppercase tracking-tight">
                    Import CV Data
                  </div>
                  <div className="text-[13px] text-[#888] mb-8">
                    Automatically populate your professional criteria.
                  </div>
                  <label className="inline-block bg-[#1a1a1a] text-white px-10 py-4 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase cursor-pointer transition-all hover:bg-[#c5a059] shadow-md">
                    Upload Document
                    <input type="file" accept=".pdf" onChange={handleImportCV} disabled={importing} className="hidden" />
                  </label>
                </>
              )}

              {importError && (
                <div className="text-[#bc243c] text-[10px] mt-6 font-mono font-bold uppercase tracking-wider bg-[#bc243c]/5 py-3 px-4 border border-[#bc243c]/10">
                  {importError}
                </div>
              )}
            </div>

            <div className="text-center text-[#e2e2d9] text-[10px] mb-8 font-mono font-bold uppercase tracking-[6px]">
              OR
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-white border border-[#e2e2d9] text-[#4a4a4a] py-4 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase hover:bg-[#f8f8f4] transition-all"
            >
              Manual Configuration
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white border border-[#e2e2d9] p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm tactile-pop">
            <h2 className="font-syne text-[28px] font-bold text-[#1a1a1a] mb-2 tracking-tight uppercase leading-tight">
              Professional Data
            </h2>
            <p className="text-[#666] text-[15px] mb-10 leading-[1.6]">
              Detailed criteria used for automated matching and document generation.
            </p>

            <div className="space-y-6 mb-12">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className={labelClasses}>Full Name</label>
                  <input className={inputClasses} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Primary Role</label>
                  <input className={inputClasses} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Software Engineer" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className={labelClasses}>Education</label>
                  <input className={inputClasses} value={education} onChange={e => setEducation(e.target.value)} placeholder="University Degree" />
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Current Company</label>
                  <input className={inputClasses} value={company} onChange={e => setCompany(e.target.value)} placeholder="Organization Name" />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Core Competencies</label>
                <div className="text-[9px] text-[#aaa] mb-1 font-mono uppercase">Comma separated values</div>
                <input className={inputClasses} value={skills} onChange={e => setSkills(e.target.value)} placeholder="Language, Framework, Tool" />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Professional Experience</label>
                <textarea
                  className={inputClasses + " resize-none leading-[1.6] h-32"}
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="Summary of responsibilities and achievements..."
                />
              </div>
            </div>

            <div className="flex gap-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white border border-[#e2e2d9] text-[#4a4a4a] py-4 rounded-sm font-mono text-[11px] font-bold uppercase hover:bg-[#f8f8f4] transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!fullName || !skills}
                className={"flex-[2] bg-[#1a1a1a] text-white py-4 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all " + (!fullName || !skills ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#c5a059] shadow-md')}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white border border-[#e2e2d9] p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm tactile-pop">
            <h2 className="font-syne text-[28px] font-bold text-[#1a1a1a] mb-2 tracking-tight uppercase leading-tight">
              Analysis Criteria
            </h2>
            <p className="text-[#666] text-[15px] mb-10 leading-[1.6]">
              Parameters used to filter and score market opportunities.
            </p>

            <div className="space-y-8 mb-12">
              <div className="space-y-1">
                <label className={labelClasses}>Target Search Terms</label>
                <input
                  className={inputClasses}
                  value={searchTerms}
                  onChange={e => setSearchTerms(e.target.value)}
                  placeholder="Engineer, Developer, Manager"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
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
                  <label className={labelClasses}>Min Salary</label>
                  <input
                    className={inputClasses}
                    type="number"
                    value={salaryMin}
                    onChange={e => setSalaryMin(e.target.value)}
                    placeholder="Annual Amount"
                  />
                </div>
              </div>

              <div className="p-6 bg-[#f8f8f4] border border-[#e2e2d9]">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="space-y-1">
                    <div className="text-[14px] font-bold text-[#1a1a1a] uppercase tracking-tight">Remote Specific</div>
                    <div className="text-[11px] text-[#888] font-mono">Prioritize remote-only listings</div>
                  </div>
                  <div
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={"w-12 h-6.5 rounded-sm relative transition-all duration-300 " + (remoteOnly ? 'bg-[#c5a059]' : 'bg-[#e2e2d9]')}>
                    <div className={"w-5 h-5 bg-white absolute top-0.75 transition-all duration-300 shadow-sm " + (remoteOnly ? 'left-[23px]' : 'left-1')} />
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-white border border-[#e2e2d9] text-[#4a4a4a] py-4 rounded-sm font-mono text-[11px] font-bold uppercase hover:bg-[#f8f8f4] transition-all"
              >
                Previous
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !searchTerms}
                className={"flex-[2] bg-[#1a1a1a] text-white py-4 rounded-sm font-mono text-[11px] font-bold tracking-[2px] uppercase transition-all " + (saving || !searchTerms ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#c5a059] shadow-md')}>
                {saving ? 'Finalizing...' : 'Launch Platform'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
