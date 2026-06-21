import { useState, useRef, useEffect } from 'react'
import { Job } from '@/types'
import { OverviewTab } from './detail/OverviewTab'
import { LetterTab } from './detail/LetterTab'
import { TrackingTab } from './detail/TrackingTab'

type Tab = 'overview' | 'letter' | 'tracking'

function SalarySpectrum({ min, max, currency }: { min: number; max: number; currency: string }) {
  const mid = (max + min) / 2
  const spread = max - min
  const spreadPercent = Math.min(60, Math.max(20, (spread / mid) * 100))
  const leftOffset = (100 - spreadPercent) / 2

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[11px] font-sans font-medium text-[#666]">Entry Spectrum</span>
          <span className="text-[16px] font-bold text-[#1a1a1a]">{currency}{min.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] font-sans font-medium text-[#666]">Cap Projection</span>
          <span className="text-[16px] font-bold text-[#1a1a1a]">{currency}{max.toLocaleString()}</span>
        </div>
      </div>
      <div className="h-2 bg-[#f0f0eb] rounded-full overflow-hidden relative border border-[#e2e2d9]">
        <div className="absolute inset-y-0 left-0 bg-[#c5a059]/10 w-full" />
        <div
          className="absolute inset-y-0 bg-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.5)] transition-all duration-1000"
          style={{ left: `${leftOffset}%`, width: `${spreadPercent}%` }}
        />
      </div>
    </div>
  )
}

export function DetailPanel({
  job,
  onClose,
  country = 'za',
  onGenerateCoverLetter,
  onStatusUpdate,
  onInterviewOutcome,
  onSaveTracking,
  generating,
  onCoverLetterOutcome,
  userSkills = [],
  mode = 'overlay'
}: {
  job: Job
  onClose: () => void
  country?: string
  onGenerateCoverLetter: (content: string) => void
  onStatusUpdate: (id: string, status: Job['status']) => void
  onInterviewOutcome: (outcome: string) => void
  onSaveTracking: (data: {
    notes: string;
    interview_date: string;
    contact_name: string;
    contact_email: string;
    offer_amount: number;
    follow_up_date: string;
  }) => Promise<void>
  generating: boolean
  onCoverLetterOutcome: (outcome: string) => void
  userSkills?: string[]
  mode?: 'overlay' | 'sidebar' | 'sheet'
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [coverLetter, setCoverLetter] = useState(job.cover_letter || '')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [letterSaving, setLetterSaving] = useState(false)
  const [letterSaved, setLetterSaved] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const [notes, setNotes] = useState(job.notes || '')
  const [interview_date, setInterviewDate] = useState(job.interview_date ? job.interview_date.slice(0, 16) : '')
  const [contact_name, setContactName] = useState(job.contact_name || '')
  const [contact_email, setContactEmail] = useState(job.contact_email || '')
  const [offer_amount, setOfferAmount] = useState(job.offer_amount ? String(job.offer_amount) : '')
  const [follow_up_date, setFollowUpDate] = useState(job.follow_up_date ? job.follow_up_date.slice(0, 16) : '')

  const currencyMap: Record<string, string> = {
    za: 'R', gb: '£', us: '$', au: '$', ca: '$', de: '€', nl: '€'
  }
  const currency = currencyMap[country] || 'R'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = async () => {
    if (!job.url) return
    await navigator.clipboard.writeText(job.url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleGenerate = async () => {
    setCoverLetter('')
    onGenerateCoverLetter('')

    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id })
      })

      if (!response.ok) throw new Error('Failed to start streaming')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk
          setCoverLetter(accumulated)
        }
        onGenerateCoverLetter(accumulated)
      }
    } catch (err) {
      console.error('Streaming error:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await onSaveTracking({
        notes,
        interview_date,
        contact_name,
        contact_email,
        offer_amount: parseFloat(offer_amount) || 0,
        follow_up_date
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const panelRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleUpdateCoverLetter = (newContent: string) => {
    setCoverLetter(newContent)
    setLetterSaving(true)
    setLetterSaved(false)

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/cover-letter/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id, content: newContent })
        })
        if (res.ok) {
          setLetterSaved(true)
          setTimeout(() => setLetterSaved(false), 3000)
        }
      } catch (err) {
        console.error('Failed to save cover letter', err)
      } finally {
        setLetterSaving(false)
      }
    }, 1000)
  }

  // Shared panel content — closes over all state and handlers
  const panelContent = (
    <>
      {/* Header */}
      <div className="p-8 pb-6 shrink-0 relative overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-1 bg-klimt-gold opacity-30" />

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex-1 pr-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-1 bg-[#1a1a1a] text-[#f8f8f4] text-[9px] font-mono font-bold uppercase tracking-[3px]">Listing Verified</div>
              {job.source && <div className="text-[9px] font-mono font-bold text-[#666] uppercase tracking-[3px]">Source: {job.source}</div>}
            </div>
            <h3 id="detail-panel-title" className="font-syne font-bold text-[26px] lg:text-[32px] text-[#1a1a1a] mb-3 leading-[1.05] tracking-tight">{job.title}</h3>
            <div className="text-[14px] font-sans font-medium text-[#4a4a4a] flex flex-wrap items-center gap-3">
                <span className="hover:text-[#c5a059] transition-colors cursor-default">{job.company}</span>
                <div className="w-1.5 h-1.5 bg-[#c5a059] rotate-45" />
                <span className="text-[#666]">{job.location || 'Remote'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {job.url && (
              <button
                onClick={handleCopyLink}
                className={`hidden sm:block px-4 py-2.5 rounded-sm font-mono text-[10px] font-bold uppercase transition-all duration-300 border ${
                  linkCopied ? 'bg-[#2b6777] border-[#2b6777] text-white' : 'bg-white border-[#e2e2d9] text-[#4a4a4a] hover:border-[#1a1a1a] hover:bg-[#f8f8f4]'
                } active:scale-95`}
              >
                {linkCopied ? 'Copied' : 'Copy Link'}
              </button>
            )}
            <button aria-label="Close" onClick={onClose} className="text-[#666] hover:text-[#1a1a1a] transition-all duration-200 text-lg font-mono p-2.5 bg-[#f8f8f4] hover:bg-white rounded-sm border border-[#e2e2d9] hover:border-[#1a1a1a] active:scale-90">✕</button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 flex-wrap relative z-10">
            {job.salary_min && job.salary_max ? (
              <SalarySpectrum min={job.salary_min} max={job.salary_max} currency={currency} />
            ) : (job.salary_min || job.salary_max) && (
              <div className="text-[14px] font-bold text-[#2b6777] font-mono bg-[#2b6777]/5 border border-[#2b6777]/20 px-6 py-2.5 rounded-sm tracking-tight flex items-center gap-3">
                <div className="w-2 h-2 bg-[#2b6777] animate-pulse" />
                {currency}{(job.salary_min || job.salary_max || 0).toLocaleString()} <span className="text-[10px] text-[#666] uppercase tracking-widest ml-2">Base Est.</span>
              </div>
            )}

            <div className="flex gap-3">
               <div className="px-4 py-2 bg-[#f0f0eb] border border-[#d1d1ca] text-[10px] font-mono font-bold uppercase tracking-widest text-[#4a4a4a] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#c5a059]" />
                  {job.seniority || 'Professional'}
               </div>
               <div className="px-4 py-2 bg-[#f0f0eb] border border-[#d1d1ca] text-[10px] font-mono font-bold uppercase tracking-widest text-[#4a4a4a] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#2b6777]" />
                  {job.work_style || 'Remote'}
               </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Job details sections" className="flex px-8 border-b border-[#e2e2d9] bg-[#f0f0eb] z-20 relative overflow-x-auto scrollbar-hide">
        {(['overview', 'letter', 'tracking'] as const).map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 font-sans text-[12px] font-medium tracking-[0.5px] uppercase transition-all duration-300 relative shrink-0
              ${activeTab === tab ? 'text-[#1a1a1a]' : 'text-[#666] hover:text-[#444]'}`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#c5a059]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto p-8 bg-[#f8f8f4] scrollbar-hide"
      >
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'overview' && <OverviewTab job={job} userSkills={userSkills} />}
        {activeTab === 'letter' && (
          <LetterTab
            job={job}
            coverLetter={coverLetter}
            generating={generating}
            handleGenerate={handleGenerate}
            handleCopy={handleCopy}
            copied={copied}
            onCoverLetterOutcome={onCoverLetterOutcome}
            onUpdateContent={handleUpdateCoverLetter}
            saving={letterSaving}
            saved={letterSaved}
          />
        )}
        {activeTab === 'tracking' && (
          <TrackingTab
            job={job}
            contact_name={contact_name}
            setContactName={setContactName}
            contact_email={contact_email}
            setContactEmail={setContactEmail}
            interview_date={interview_date}
            setInterviewDate={setInterviewDate}
            follow_up_date={follow_up_date}
            setFollowUpDate={setFollowUpDate}
            offer_amount={offer_amount}
            setOfferAmount={setOfferAmount}
            currency={currency}
            notes={notes}
            setNotes={setNotes}
            handleSave={handleSave}
            saving={saving}
            saved={saved}
            onInterviewOutcome={onInterviewOutcome}
          />
        )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="px-8 py-5 border-t border-[#e2e2d9] flex flex-col sm:flex-row justify-center gap-4 shrink-0 bg-white z-20">
        {job.status === 'pending' && (
          <>
            <button onClick={() => onStatusUpdate(job.id, 'applied')}
              className="w-full sm:w-auto px-10 py-3.5 relative bg-[#1a1a1a] text-[#f8f8f4] rounded-sm font-bold font-mono text-[11px] tracking-[2px] uppercase hover:bg-[#c5a059] shadow-lg transition-all duration-300"
            >
                Mark Applied
            </button>
            <button onClick={() => onStatusUpdate(job.id, 'skipped')}
              className="w-full sm:w-auto px-10 py-3.5 bg-[#f0f0eb] border border-[#d1d1ca] text-[#4a4a4a] rounded-sm font-mono text-[11px] font-bold uppercase hover:bg-[#e2e2d9] transition-all duration-300"
            >Skip Analysis</button>
          </>
        )}

        {job.status === 'applied' && (
          <button onClick={() => onStatusUpdate(job.id, 'interviewing')}
            className="w-full sm:w-auto px-10 py-3.5 bg-[#2b6777] text-white rounded-sm font-bold font-mono text-[11px] tracking-[2px] uppercase hover:bg-[#c5a059] shadow-lg transition-all duration-300"
          >
              Proceed to Interview
          </button>
        )}

        {job.status === 'skipped' && (
          <button onClick={() => onStatusUpdate(job.id, 'pending')}
            className="w-full sm:w-auto px-10 py-3.5 bg-[#f0f0eb] border border-[#c5a059]/30 text-[#1a1a1a] rounded-sm font-bold font-mono text-[11px] tracking-[2px] uppercase hover:bg-[#c5a059]/10 transition-all duration-300"
          >Restore Analysis</button>
        )}

        {job.status === 'interviewing' && (
           <div className="w-full sm:w-auto px-10 py-3.5 text-center rounded-sm bg-[#bc243c]/5 border border-[#bc243c]/20">
              <span className="text-[11px] font-mono font-bold text-[#bc243c] uppercase tracking-[4px]">Interview Phase Active</span>
           </div>
        )}
      </div>
    </>
  )

  // Sidebar mode: fills a flex column in the page layout, no backdrop
  if (mode === 'sidebar') {
    return (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-panel-title"
        className="bg-[#f8f8f4] flex flex-col h-full overflow-hidden"
      >
        {panelContent}
      </div>
    )
  }

  // Sheet mode: slides up from bottom on mobile
  if (mode === 'sheet') {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-[#1a1a1a]/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="fixed inset-x-0 bottom-0 z-50 h-[88vh] animate-in slide-in-from-bottom-4 duration-400">
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-panel-title"
            className="bg-[#f8f8f4] flex flex-col h-full overflow-hidden rounded-t-sm shadow-2xl"
          >
            <div className="shrink-0 flex justify-center pt-3 pb-1" aria-hidden="true">
              <div className="w-10 h-1 bg-[#d1d1ca] rounded-full" />
            </div>
            {panelContent}
          </div>
        </div>
      </>
    )
  }

  // Overlay mode (default): centered modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-panel-title"
        className="bg-[#f8f8f4] flex flex-col w-full max-w-6xl h-full max-h-[90vh] relative z-10 shadow-2xl overflow-hidden rounded-sm animate-in slide-in-from-bottom-4 duration-500"
      >
        {panelContent}
      </div>
    </div>
  )
}
