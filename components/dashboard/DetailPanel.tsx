import { useState, useRef } from 'react'
import { Job } from '@/types'
import { OverviewTab } from './detail/OverviewTab'
import { LetterTab } from './detail/LetterTab'
import { TrackingTab } from './detail/TrackingTab'

type Tab = 'overview' | 'letter' | 'tracking'

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
  userSkills = []
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
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [coverLetter, setCoverLetter] = useState(job.cover_letter || '')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [letterSaving, setLetterSaving] = useState(false)
  const [letterSaved, setLetterSaved] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Tracking form state
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

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-[#f8f8f4] border border-[#e2e2d9] flex flex-col w-full max-w-6xl h-full max-h-[90vh] relative z-10 shadow-2xl overflow-hidden rounded-sm animate-in slide-in-from-bottom-4 duration-500 tactile-pop">
        {/* Header */}
        <div className="p-10 pb-8 shrink-0 relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-full h-1 bg-klimt-gold opacity-30" />

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex-1 pr-12">
              <h3 className="font-syne font-bold text-[28px] md:text-[36px] text-[#1a1a1a] mb-3 leading-[1.1] tracking-tight uppercase">{job.title}</h3>
              <div className="text-[10px] font-mono font-bold text-[#888] tracking-[3px] uppercase flex flex-wrap items-center gap-3">
                  <span className="text-[#4a4a4a]">{job.company}</span>
                  <span className="w-1.5 h-1.5 bg-[#e2e2d9]" />
                  <span>{job.location || 'Remote'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {job.url && (
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-sm font-mono text-[10px] font-bold uppercase transition-all duration-300 border tactile-pop ${
                    linkCopied ? 'bg-[#2b6777]/5 border-[#2b6777] text-[#2b6777]' : 'bg-white border-[#e2e2d9] text-[#4a4a4a] hover:bg-[#f8f8f4]'
                  }`}
                >
                  <span>{linkCopied ? 'Copied' : 'Copy Link'}</span>
                </button>
              )}
              <button onClick={onClose} className="text-[#888] hover:text-[#1a1a1a] transition-all duration-300 text-2xl font-mono p-2 bg-[#f0f0eb] rounded-sm border border-[#d1d1ca] hover:border-[#1a1a1a]">✕</button>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap relative z-10">
              {(job.salary_min || job.salary_max) && (
                <div className="text-[14px] font-bold text-[#2b6777] font-mono bg-[#2b6777]/5 border border-[#2b6777]/20 px-6 py-2.5 rounded-sm tracking-tight">
                  {currency}{job.salary_min?.toLocaleString()} – {currency}{job.salary_max?.toLocaleString()}
                </div>
              )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-10 border-b border-[#e2e2d9] bg-[#f0f0eb] z-20 relative overflow-x-auto scrollbar-hide">
          {(['overview', 'letter', 'tracking'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-5 font-mono text-[10px] font-bold tracking-[3px] uppercase transition-all duration-300 relative shrink-0
                ${activeTab === tab ? 'text-[#1a1a1a]' : 'text-[#888] hover:text-[#444]'}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#c5a059]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#f8f8f4] scrollbar-hide">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
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
        <div className="p-8 border-t border-[#e2e2d9] flex flex-col sm:flex-row justify-center gap-6 shrink-0 bg-white z-20">
          {job.status === 'pending' && (
            <>
              <button onClick={() => onStatusUpdate(job.id, 'applied')}
                className="w-full sm:w-auto px-14 py-4 relative bg-[#1a1a1a] text-[#f8f8f4] rounded-sm font-bold font-mono text-[11px] tracking-[2px] uppercase hover:bg-[#c5a059] shadow-lg transition-all duration-300"
              >
                  Mark Applied
              </button>
              <button onClick={() => onStatusUpdate(job.id, 'skipped')}
                className="w-full sm:w-auto px-14 py-4 bg-[#f0f0eb] border border-[#d1d1ca] text-[#4a4a4a] rounded-sm font-mono text-[11px] font-bold uppercase hover:bg-[#e2e2d9] transition-all duration-300"
              >Skip Analysis</button>
            </>
          )}

          {job.status === 'applied' && (
            <button onClick={() => onStatusUpdate(job.id, 'interviewing')}
              className="w-full sm:w-auto px-14 py-4 bg-[#2b6777] text-white rounded-sm font-bold font-mono text-[11px] tracking-[2px] uppercase hover:bg-[#c5a059] shadow-lg transition-all duration-300"
            >
                Proceed to Interview
            </button>
          )}

          {job.status === 'skipped' && (
            <button onClick={() => onStatusUpdate(job.id, 'pending')}
              className="w-full sm:w-auto px-14 py-4 bg-[#f0f0eb] border border-[#c5a059]/30 text-[#1a1a1a] rounded-sm font-bold font-mono text-[11px] tracking-[2px] uppercase hover:bg-[#c5a059]/10 transition-all duration-300"
            >Restore Analysis</button>
          )}

          {job.status === 'interviewing' && (
             <div className="w-full sm:w-auto px-14 py-4 text-center rounded-sm bg-[#bc243c]/5 border border-[#bc243c]/20">
                <span className="text-[11px] font-mono font-bold text-[#bc243c] uppercase tracking-[4px]">Interview Phase Active</span>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
