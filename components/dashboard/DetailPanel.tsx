import { useState } from 'react'
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

  return (
    <div className="bg-glass border-l border-white/5 flex flex-col h-[calc(100vh-140px)] sticky top-6 animate-in fade-in slide-in-from-right-8 duration-1000 shadow-[20px_0_100px_rgba(0,0,0,0.9)] overflow-hidden rounded-l-[4rem]">
      {/* Header */}
      <div className="p-12 pb-10 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-[#00ff87] to-transparent opacity-50" />
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-[#00ff87]/5 rounded-full blur-[100px]" />

        <div className="flex justify-between items-start mb-10 relative z-10">
          <div className="flex-1 pr-12">
            <h3 className="font-syne font-black text-[32px] text-white mb-4 leading-tight tracking-tight drop-shadow-2xl">{job.title}</h3>
            <div className="text-[11px] font-mono font-black text-[#666] tracking-[4px] uppercase flex items-center gap-3">
                <span className="text-[#aaa]">{job.company}</span>
                <span className="w-2 h-2 rounded-full bg-white/10" />
                <span className="text-[#888]">{job.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {job.url && (
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-[10px] font-black uppercase transition-all border ${
                  linkCopied ? 'bg-[#00ff87]/10 border-[#00ff87]/30 text-[#00ff87]' : 'bg-white/5 border-white/5 text-[#555] hover:text-white hover:border-white/10'
                }`}
              >
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
            )}
            <button onClick={onClose} className="text-[#444] hover:text-white transition-all text-2xl font-mono hover:rotate-90 p-2 leading-none">✕</button>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap relative z-10">
            {(job.salary_min || job.salary_max) && (
              <div className="text-[14px] font-black text-[#00ff87] font-mono bg-[#00ff87]/5 border border-[#00ff87]/10 px-6 py-2.5 rounded-2xl shadow-xl tracking-tighter">
                {currency}{job.salary_min?.toLocaleString()} – {currency}{job.salary_max?.toLocaleString()}
              </div>
            )}
            <div className="flex gap-2.5 flex-wrap">
              {(job.stack || []).slice(0, 5).map(s => (
                <span key={s} className="text-[9px] px-4 py-2 rounded-xl bg-white/[0.04] text-[#7b61ff] font-mono font-black border border-white/5 uppercase tracking-tight shadow-md transition-colors hover:border-[#7b61ff]/30">{s}</span>
              ))}
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-12 border-b border-white/5 bg-white/[0.02] backdrop-blur-3xl z-20 relative">
        {(['overview', 'letter', 'tracking'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-10 py-7 font-mono text-[10px] font-black tracking-[5px] uppercase transition-all relative
              ${activeTab === tab ? 'text-[#00ff87]' : 'text-[#555] hover:text-[#999]'}`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-8 right-8 h-[3px] bg-[#00ff87] shadow-[0_0_25px_rgba(0,255,135,0.6)] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-12 bg-[#080812]/40 scrollbar-hide">
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-forwards">
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
      <div className="p-12 border-t border-white/5 flex gap-6 shrink-0 bg-[#0d0d20]/80 backdrop-blur-xl z-20">
        {job.status === 'pending' && (
          <>
            <button onClick={() => onStatusUpdate(job.id, 'applied')}
              className="flex-1 relative bg-[#00ff87] text-[#0a0a1a] py-5 rounded-[2rem] font-black font-mono text-[11px] tracking-[3px] uppercase hover:brightness-110 shadow-[0_20px_40px_rgba(0,255,135,0.2)] transition-all hover:-translate-y-1 active:translate-y-0 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                Mark Applied
            </button>
            <button onClick={() => onStatusUpdate(job.id, 'skipped')}
              className="px-12 bg-white/[0.04] border border-white/5 text-[#666] py-5 rounded-[2rem] font-mono text-[11px] font-black uppercase hover:border-white/15 hover:text-[#aaa] transition-all active:scale-[0.98] shadow-xl"
            >Skip Job</button>
          </>
        )}

        {job.status === 'applied' && (
          <button onClick={() => onStatusUpdate(job.id, 'interviewing')}
            className="flex-1 bg-[#00d4ff] text-[#0a0a1a] py-5 rounded-[2rem] font-black font-mono text-[11px] tracking-[3px] uppercase hover:brightness-110 shadow-[0_20px_40px_rgba(0,212,255,0.2)] transition-all hover:-translate-y-1 group relative overflow-hidden"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              Got Interview!
          </button>
        )}

        {job.status === 'skipped' && (
          <button onClick={() => onStatusUpdate(job.id, 'pending')}
            className="flex-1 bg-[#ffd60a]/[0.03] border border-[#ffd60a]/20 text-[#ffd60a] py-5 rounded-[2rem] font-black font-mono text-[11px] tracking-[3px] uppercase hover:bg-[#ffd60a]/[0.08] transition-all shadow-xl"
          >Undo Skip</button>
        )}

        {job.status === 'interviewing' && (
           <div className="flex-1 text-center py-6 px-10 rounded-[2rem] bg-[#00d4ff]/[0.04] border border-[#00d4ff]/10 shadow-[inset_0_0_20px_rgba(0,212,255,0.05)]">
              <span className="text-[11px] font-mono font-black text-[#00d4ff] uppercase tracking-[6px] animate-pulse">In Interview Phase</span>
           </div>
        )}
      </div>
    </div>
  )
}
