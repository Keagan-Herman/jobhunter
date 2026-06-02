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
    onGenerateCoverLetter('') // Signal start to parent if needed

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
        onGenerateCoverLetter(accumulated) // Update parent with final content
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
      <div className="absolute inset-0 bg-[#080812]/80 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-glass border-premium flex flex-col w-full max-w-5xl h-full max-h-[90vh] relative z-10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] animate-in zoom-in duration-500">
        {/* Header */}
        <div className="p-6 md:p-10 pb-6 md:pb-8 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#00ff87] via-[#00ff87]/30 to-transparent opacity-40" />
          <div className="absolute -right-32 -top-32 w-96 h-96 bg-[#00ff87]/10 rounded-full blur-[120px]" />

          <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
            <div className="flex-1 pr-4 md:pr-12">
              <h3 className="font-syne font-black text-[24px] md:text-[32px] text-white mb-2 md:mb-3 leading-[1.1] tracking-tighter drop-shadow-2xl selection:bg-[#00ff8720]">{job.title}</h3>
              <div className="text-[9px] md:text-[10px] font-mono font-black text-[#555] tracking-[2px] md:tracking-[3px] uppercase flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="text-[#aaa] hover:text-white transition-colors duration-300">{job.company}</span>
                  <span className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
                  <span className="text-[#888]">{job.location || 'Remote'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {job.url && (
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-mono text-[9px] font-black uppercase transition-all duration-500 border shadow-xl active:scale-95 ${
                    linkCopied ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-[#12122a] border-premium text-[#666] hover:text-white hover:border-white/20 hover:scale-105'
                  }`}
                >
                  <span>{linkCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              )}
              <button onClick={onClose} className="text-[#444] hover:text-white transition-all duration-500 text-xl md:text-2xl font-mono hover:rotate-90 hover:scale-110 p-2 md:p-2.5 leading-none bg-white/[0.02] rounded-xl border border-transparent hover:border-white/10 active:scale-90">✕</button>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 flex-wrap relative z-10">
              {(job.salary_min || job.salary_max) && (
                <div className="text-[12px] md:text-[13px] font-black text-[#00ff87] font-mono bg-[#00ff87]/5 border border-[#00ff87]/10 px-5 md:px-6 py-2 md:py-2.5 rounded-xl shadow-xl tracking-tighter hover:bg-[#00ff87]/10 transition-colors duration-500">
                  {currency}{job.salary_min?.toLocaleString()} – {currency}{job.salary_max?.toLocaleString()}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {(job.stack || []).slice(0, 5).map(s => (
                  <span key={s} className="text-[8px] md:text-[9px] px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-[#12122a] text-[#7b61ff] font-mono font-black border border-[#7b61ff]/10 uppercase tracking-wider shadow-lg transition-all duration-500 hover:border-[#7b61ff]/40">{s}</span>
                ))}
              </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 md:px-10 border-b border-premium bg-white/[0.02] backdrop-blur-3xl z-20 relative overflow-x-auto scrollbar-hide">
          {(['overview', 'letter', 'tracking'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 md:px-8 py-4 md:py-5 font-mono text-[9px] md:text-[10px] font-black tracking-[2px] md:tracking-[3px] uppercase transition-all duration-500 relative shrink-0
                ${activeTab === tab ? 'text-[#00ff87]' : 'text-[#444] hover:text-[#888]'}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-3 md:left-4 right-3 md:right-4 h-[3px] bg-[#00ff87] shadow-[0_-5px_20px_rgba(0,255,135,0.6)] rounded-t-full animate-in slide-in-from-bottom-2" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#080812]/40 scrollbar-hide">
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
        <div className="p-6 md:p-8 border-t border-premium flex flex-col sm:flex-row justify-center gap-4 md:gap-6 shrink-0 bg-[#0d0d20]/90 backdrop-blur-2xl z-20">
          {job.status === 'pending' && (
            <>
              <button onClick={() => onStatusUpdate(job.id, 'applied')}
                className="w-full sm:w-auto px-10 md:px-14 py-3 md:py-4 relative bg-[#00ff87] text-[#0a0a1a] rounded-xl md:rounded-2xl font-black font-mono text-[10px] md:text-[11px] tracking-[2px] uppercase hover:brightness-110 shadow-[0_15px_30px_rgba(0,255,135,0.2)] transition-all duration-500 hover:-translate-y-1 active:translate-y-0 group overflow-hidden"
              >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  Mark Applied
              </button>
              <button onClick={() => onStatusUpdate(job.id, 'skipped')}
                className="w-full sm:w-auto px-10 md:px-14 py-3 md:py-4 bg-white/[0.02] border border-premium text-[#555] rounded-xl md:rounded-2xl font-mono text-[10px] md:text-[11px] font-black uppercase hover:border-white/10 hover:text-[#999] transition-all duration-500 active:scale-[0.98]"
              >Skip Job</button>
            </>
          )}

          {job.status === 'applied' && (
            <button onClick={() => onStatusUpdate(job.id, 'interviewing')}
              className="w-full sm:w-auto px-10 md:px-14 py-3 md:py-4 bg-[#00d4ff] text-[#0a0a1a] rounded-xl md:rounded-2xl font-black font-mono text-[10px] md:text-[11px] tracking-[2px] uppercase hover:brightness-110 shadow-[0_15px_30px_rgba(0,212,255,0.2)] transition-all duration-500 hover:-translate-y-1 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                Got Interview!
            </button>
          )}

          {job.status === 'skipped' && (
            <button onClick={() => onStatusUpdate(job.id, 'pending')}
              className="w-full sm:w-auto px-10 md:px-14 py-3 md:py-4 bg-[#ffd60a]/[0.02] border border-[#ffd60a]/20 text-[#ffd60a] rounded-xl md:rounded-2xl font-black font-mono text-[10px] md:text-[11px] tracking-[2px] uppercase hover:bg-[#ffd60a]/[0.06] transition-all duration-500 shadow-xl active:scale-[0.98]"
            >Undo Skip</button>
          )}

          {job.status === 'interviewing' && (
             <div className="w-full sm:w-auto px-10 md:px-14 py-3 md:py-4 text-center rounded-xl md:rounded-2xl bg-[#00d4ff]/[0.03] border border-[#00d4ff]/20">
                <span className="text-[10px] font-mono font-black text-[#00d4ff] uppercase tracking-[4px] animate-pulse">In Interview Phase</span>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
