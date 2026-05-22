import { useState } from 'react'
import { Job } from '@/types'

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
  onCoverLetterOutcome
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
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [coverLetter, setCoverLetter] = useState(job.cover_letter || '')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-4">
        <h4 className="text-[10px] font-mono font-bold text-[#444] tracking-[2px] uppercase">Job Description</h4>
        <p className="text-[13px] leading-relaxed text-[#bbb] whitespace-pre-wrap">{job.description}</p>
        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a3a] border border-[#2a2a4a] text-[11px] text-[#00ff87] font-mono no-underline hover:bg-[#252550] transition-colors">
            View full listing on {job.source || 'Original Site'} →
          </a>
        )}
      </div>

      {job.score_reason && (
        <div className="p-4 rounded-xl bg-[#00ff8708] border border-[#00ff8715] space-y-2">
          <h4 className="text-[10px] font-mono font-bold text-[#00ff87] tracking-[2px] uppercase">AI Analysis</h4>
          <p className="text-[13px] text-[#00ff87] leading-relaxed italic">&quot;{job.score_reason}&quot;</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-[#0a0a1a] border border-[#1e1e38]">
          <div className="text-[10px] font-mono text-[#444] uppercase mb-1">Seniority</div>
          <div className="text-sm font-semibold text-white capitalize">{job.seniority || 'Mid'}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#0a0a1a] border border-[#1e1e38]">
          <div className="text-[10px] font-mono text-[#444] uppercase mb-1">Work Style</div>
          <div className="text-sm font-semibold text-white capitalize">{job.work_style || 'Not specified'}</div>
        </div>
      </div>

      {job.culture_fit && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-mono font-bold text-[#444] tracking-[2px] uppercase">Culture Fit Analysis</h4>
          <div className="p-4 rounded-xl bg-[#0a0a1a] border border-[#1e1e38]">
            <p className="text-[13px] text-[#bbb] leading-relaxed italic">&quot;{job.culture_fit}&quot;</p>
          </div>
        </div>
      )}

      {job.interview_prep && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-mono font-bold text-[#444] tracking-[2px] uppercase">Interview Prep Tips</h4>
          <div className="p-4 rounded-xl bg-[#0a0a1a] border border-[#1e1e38]">
            <p className="text-[13px] text-[#bbb] leading-relaxed whitespace-pre-wrap">{job.interview_prep}</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderLetter = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {!coverLetter && !generating && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#1a1a3a] flex items-center justify-center text-3xl">✍️</div>
          <div className="space-y-1">
            <h4 className="font-syne font-bold text-white">No Cover Letter</h4>
            <p className="text-xs text-[#555] max-w-[200px]">Generate a tailored letter using AI based on your profile.</p>
          </div>
          <button onClick={handleGenerate}
            className="bg-[#00ff87] text-[#0a0a1a] px-6 py-2.5 rounded-xl font-bold font-mono text-[11px] tracking-widest uppercase hover:brightness-110 transition-all"
          >⚡ Generate Now</button>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#00ff8710] border-t-[#00ff87] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
          </div>
          <div className="space-y-1">
            <h4 className="font-syne font-bold text-[#00ff87] animate-pulse">Generating...</h4>
            <p className="text-[11px] text-[#444] font-mono">Analyzing job requirements & matching your skills</p>
          </div>
        </div>
      )}

      {coverLetter && !generating && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono font-bold text-[#444] tracking-[2px] uppercase">AI-Generated Letter</h4>
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase transition-all
                  ${copied ? 'bg-[#00ff8718] border border-[#00ff8740] text-[#00ff87]' : 'bg-[#12122a] border border-[#2a2a4a] text-[#666] hover:text-white'}`}
              >{copied ? '✓ Copied' : '⎘ Copy'}</button>
              <button onClick={handleGenerate}
                className="px-3 py-1.5 rounded-lg bg-[#12122a] border border-[#2a2a4a] text-[#666] font-mono text-[10px] font-bold uppercase hover:text-white transition-all"
              >↺ Regenerate</button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0a0a1a] border border-[#1a1a32] shadow-inner">
            <div className="space-y-4 max-w-[65ch] mx-auto">
              {coverLetter.split('\n\n').map((para, i) => (
                  <p key={i} className="text-[13px] leading-relaxed text-[#bbb]">{para}</p>
              ))}
            </div>
          </div>

          {job.status === 'interviewing' && job.cover_letter_id && (
            <div className="p-5 rounded-2xl bg-[#00ff8705] border border-[#00ff8710] space-y-4">
              <h4 className="text-[10px] text-[#444] tracking-[2px] uppercase font-mono text-center">How did this letter perform?</h4>
              <div className="flex gap-3">
                {[
                  { value: 'interviewed', label: '🎯 Interview', color: 'text-[#00ff87]', bg: 'bg-[#00ff8718]', border: 'border-[#00ff8740]' },
                  { value: 'rejected', label: '✗ Rejected', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b18]', border: 'border-[#ff6b6b40]' },
                  { value: 'no_response', label: '👻 Ghosted', color: 'text-[#555]', bg: 'bg-[#55518]', border: 'border-[#55540]' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => onCoverLetterOutcome(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl cursor-pointer text-[10px] font-bold ${opt.bg} border ${opt.border} ${opt.color} font-mono transition-all text-center hover:brightness-110`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderTracking = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#444] tracking-[2px] uppercase">Contact Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#444] font-mono uppercase ml-1">Contact Name</label>
            <input value={contact_name} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
              className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl p-3 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87] transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#444] font-mono uppercase ml-1">Contact Email</label>
            <input value={contact_email} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com"
              className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl p-3 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87] transition-colors" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#444] tracking-[2px] uppercase">Timeline</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#444] font-mono uppercase ml-1">Interview Date</label>
            <input type="datetime-local" value={interview_date} onChange={e => setInterviewDate(e.target.value)}
              className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl p-3 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87] color-scheme-dark transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#444] font-mono uppercase ml-1">Follow Up Date</label>
            <input type="datetime-local" value={follow_up_date} onChange={e => setFollowUpDate(e.target.value)}
              className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl p-3 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87] color-scheme-dark transition-colors" />
          </div>
        </div>
      </div>

      {job.status === 'interviewing' && (
        <div className="space-y-6">
          <h4 className="text-[10px] font-mono font-bold text-[#444] tracking-[2px] uppercase">Offer & Outcome</h4>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] font-mono uppercase ml-1">Offer Amount ({currency})</label>
              <input type="number" value={offer_amount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. 35000"
                className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl p-3 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87] transition-colors" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'offer', label: '🎉 Got an Offer!', color: 'text-[#00ff87]', bg: 'bg-[#00ff8710]', border: 'border-[#00ff8730]' },
                { value: 'rejected_after_interview', label: '✗ Rejected After Interview', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b10]', border: 'border-[#ff6b6b30]' },
                { value: 'withdrew', label: '🚪 Withdrew', color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a10]', border: 'border-[#ffd60a30]' },
              ].map(opt => (
                <button key={opt.value} onClick={() => onInterviewOutcome(opt.value)}
                  className={`w-full p-4 rounded-xl cursor-pointer text-xs font-bold ${opt.bg} border ${opt.border} ${opt.color} font-mono tracking-tight transition-all text-left hover:brightness-110 active:translate-y-px`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#444] tracking-[2px] uppercase">Notes</h4>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Interview notes, recruiter feedback, culture impressions..."
          rows={4}
          className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl p-4 text-[#e0e0f0] text-[13px] outline-none focus:border-[#00ff87] resize-none transition-colors"
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-4 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase transition-all duration-500
          ${saved ? 'bg-[#00ff8720] border border-[#00ff8740] text-[#00ff87]' : 'bg-[#12122a] border border-[#2a2a4a] text-[#666] hover:text-white hover:border-[#444]'}`}
      >
        {saving ? 'Saving...' : saved ? '✓ Tracking Info Saved' : 'Update Tracking Info'}
      </button>
    </div>
  )

  return (
    <div className="bg-[#0d0d20] border border-[#1a1a32] rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-200px)] sticky top-6 animate-in fade-in slide-in-from-right-4 duration-500 shadow-2xl">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-[#1a1a32] shrink-0 bg-[#0d0d20]">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-syne font-extrabold text-xl text-white mb-1">{job.title}</h3>
            <div className="text-sm font-mono text-[#555]">{job.company} · {job.location}</div>
          </div>
          <button onClick={onClose} className="text-[#333] hover:text-white transition-colors text-3xl leading-none -mt-2">×</button>
        </div>

        {(job.salary_min || job.salary_max) && (
          <div className="mb-4 text-sm font-bold text-[#00ff87] font-mono bg-[#00ff8708] border border-[#00ff8715] inline-block px-3 py-1 rounded-lg">
            {currency}{job.salary_min?.toLocaleString()} – {currency}{job.salary_max?.toLocaleString()}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {(job.stack || []).map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-[#1a1a3a] text-[#7b61ff] font-mono font-bold border border-[#2a2a4a]">{s}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 border-b border-[#1a1a32] bg-[#0d0d20]/50 backdrop-blur-md">
        {(['overview', 'letter', 'tracking'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-4 font-mono text-[10px] font-bold tracking-[2px] uppercase transition-all relative
              ${activeTab === tab ? 'text-[#00ff87]' : 'text-[#444] hover:text-[#888]'}`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff87] shadow-[0_0_10px_#00ff87]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#080812]/50">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'letter' && renderLetter()}
        {activeTab === 'tracking' && renderTracking()}
      </div>

      {/* Actions Footer */}
      <div className="p-6 border-t border-[#1a1a32] flex gap-3 shrink-0 bg-[#0d0d20]">
        {job.status === 'pending' && (
          <>
            <button onClick={() => onStatusUpdate(job.id, 'applied')}
              className="flex-1 bg-[#00ff87] text-[#0a0a1a] py-3 rounded-xl font-bold font-mono text-[11px] tracking-widest uppercase hover:brightness-110 shadow-lg shadow-[#00ff8720] transition-all"
            >✓ Mark Applied</button>
            <button onClick={() => onStatusUpdate(job.id, 'skipped')}
              className="px-6 bg-[#12122a] border border-[#2a2a4a] text-[#555] py-3 rounded-xl font-mono text-[11px] font-bold uppercase hover:border-[#3a3a5a] transition-all"
            >Skip</button>
          </>
        )}

        {job.status === 'applied' && (
          <button onClick={() => onStatusUpdate(job.id, 'interviewing')}
            className="flex-1 bg-[#00d4ff] text-[#0a0a1a] py-3 rounded-xl font-bold font-mono text-[11px] tracking-widest uppercase hover:brightness-110 shadow-lg shadow-[#00d4ff20] transition-all"
          >🎯 Got Interview!</button>
        )}

        {job.status === 'skipped' && (
          <button onClick={() => onStatusUpdate(job.id, 'pending')}
            className="flex-1 bg-[#ffd60a10] border border-[#ffd60a30] text-[#ffd60a] py-3 rounded-xl font-bold font-mono text-[11px] tracking-widest uppercase hover:bg-[#ffd60a20] transition-all"
          >↩ Undo Skip</button>
        )}

        {job.status === 'interviewing' && (
           <div className="flex-1 text-center py-2 px-4 rounded-xl bg-[#00d4ff10] border border-[#00d4ff20]">
              <span className="text-[10px] font-mono font-bold text-[#00d4ff] uppercase tracking-[2px]">Interviewing Phase</span>
           </div>
        )}
      </div>
    </div>
  )
}
