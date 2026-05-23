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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
      <div className="space-y-4">
        <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Job Description</h4>
        <p className="text-[14px] leading-[1.7] text-[#bbb] whitespace-pre-wrap font-sans">{job.description}</p>
        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1a3a]/50 border border-[#2a2a4a] text-[11px] text-[#00ff87] font-mono font-bold no-underline hover:bg-[#252550] hover:border-[#00ff8740] transition-all group/link">
            View full listing on {job.source || 'Original Site'} <span className="group-hover/link:translate-x-1 transition-transform">→</span>
          </a>
        )}
      </div>

      {job.score_reason && (
        <div className="p-5 rounded-2xl bg-[#00ff8705] border border-[#00ff8710] space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff87]/30" />
          <h4 className="text-[10px] font-mono font-bold text-[#00ff87] tracking-[3px] uppercase">AI Fit Analysis</h4>
          <p className="text-[14px] text-[#00ff87] leading-relaxed font-medium italic">&quot;{job.score_reason}&quot;</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#0d0d20] border border-[#1e1e38] group hover:border-[#333] transition-colors">
          <div className="text-[10px] font-mono text-[#555] uppercase tracking-wider mb-2 font-bold">Seniority</div>
          <div className="text-[15px] font-bold text-white capitalize font-syne">{job.seniority || 'Mid'}</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0d0d20] border border-[#1e1e38] group hover:border-[#333] transition-colors">
          <div className="text-[10px] font-mono text-[#555] uppercase tracking-wider mb-2 font-bold">Work Style</div>
          <div className="text-[15px] font-bold text-white capitalize font-syne">{job.work_style || 'Not specified'}</div>
        </div>
      </div>

      {job.culture_fit && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Culture Fit</h4>
          <div className="p-5 rounded-2xl bg-[#0d0d20] border border-[#1e1e38] hover:border-[#333] transition-colors">
            <p className="text-[14px] text-[#bbb] leading-relaxed italic">&quot;{job.culture_fit}&quot;</p>
          </div>
        </div>
      )}

      {job.interview_prep && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Interview Prep Strategy</h4>
          <div className="p-5 rounded-2xl bg-[#0d0d20] border border-[#1e1e38] hover:border-[#333] transition-colors">
            <div className="text-[14px] text-[#bbb] leading-relaxed whitespace-pre-wrap font-sans">
              {job.interview_prep.split('\n').map((line, i) => (
                <div key={i} className="mb-2 last:mb-0">{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderLetter = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
      {!coverLetter && !generating && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-[#1a1a3a]/30 border border-[#2a2a4a] flex items-center justify-center text-4xl shadow-2xl">✍️</div>
          <div className="space-y-2">
            <h4 className="font-syne font-bold text-xl text-white">Tailored Cover Letter</h4>
            <p className="text-[13px] text-[#666] max-w-[280px] leading-relaxed">Let AI craft a perfect pitch based on your profile and this job description.</p>
          </div>
          <button onClick={handleGenerate}
            className="bg-[#00ff87] text-[#0a0a1a] px-8 py-3.5 rounded-2xl font-bold font-mono text-[11px] tracking-[2px] uppercase hover:brightness-110 transition-all shadow-[0_0_20px_#00ff8720]"
          >⚡ Generate Now</button>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-[#00ff8710] border-t-[#00ff87] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
          </div>
          <div className="space-y-2">
            <h4 className="font-syne font-bold text-xl text-[#00ff87] animate-pulse">Crafting your story...</h4>
            <p className="text-[11px] text-[#555] font-mono uppercase tracking-widest font-bold">Analyzing job nuances & matching your impact</p>
          </div>
        </div>
      )}

      {coverLetter && !generating && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">AI-Generated Pitch</h4>
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className={`px-4 py-2 rounded-xl font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-2
                  ${copied ? 'bg-[#00ff8718] border border-[#00ff8740] text-[#00ff87]' : 'bg-[#12122a] border border-[#2a2a4a] text-[#777] hover:text-white hover:border-[#444]'}`}
              >{copied ? '✓ Copied' : '⎘ Copy'}</button>
              <button onClick={handleGenerate}
                className="px-4 py-2 rounded-xl bg-[#12122a] border border-[#2a2a4a] text-[#777] font-mono text-[10px] font-bold uppercase hover:text-white hover:border-[#444] transition-all"
              >↺ Regenerate</button>
            </div>
          </div>

          <div className="p-8 md:p-12 rounded-[2rem] bg-[#0d0d20] border border-[#1a1a32] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ff8720] to-transparent" />
            <div className="space-y-6 max-w-[65ch] mx-auto">
              {coverLetter.split('\n\n').map((para, i) => (
                  <p key={i} className="text-[15px] leading-[1.8] text-[#bbb] font-sans">{para}</p>
              ))}
            </div>
          </div>

          {job.status === 'interviewing' && job.cover_letter_id && (
            <div className="p-6 rounded-3xl bg-[#00ff8705] border border-[#00ff8710] space-y-6">
              <h4 className="text-[10px] text-[#555] tracking-[3px] uppercase font-mono text-center font-bold">Performance Feedback</h4>
              <div className="flex gap-3">
                {[
                  { value: 'interviewed', label: '🎯 Interview', color: 'text-[#00ff87]', bg: 'bg-[#00ff8708]', border: 'border-[#00ff8720]' },
                  { value: 'rejected', label: '✗ Rejected', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b08]', border: 'border-[#ff6b6b20]' },
                  { value: 'no_response', label: '👻 Ghosted', color: 'text-[#555]', bg: 'bg-[#55508]', border: 'border-[#55520]' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => onCoverLetterOutcome(opt.value)}
                    className={`flex-1 py-3.5 rounded-2xl cursor-pointer text-[10px] font-bold ${opt.bg} border ${opt.border} ${opt.color} font-mono transition-all text-center hover:brightness-110 hover:border-current/30 uppercase tracking-wider`}
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Contact Details</h4>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[10px] text-[#666] font-mono uppercase ml-1 font-bold tracking-wider">Contact Name</label>
            <input value={contact_name} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
              className="w-full bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-4 text-[#e0e0f0] text-sm outline-none focus:border-[#00ff87] transition-all hover:border-[#333]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[#666] font-mono uppercase ml-1 font-bold tracking-wider">Contact Email</label>
            <input value={contact_email} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com"
              className="w-full bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-4 text-[#e0e0f0] text-sm outline-none focus:border-[#00ff87] transition-all hover:border-[#333]" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Timeline</h4>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-[10px] text-[#666] font-mono uppercase ml-1 font-bold tracking-wider">Interview Date</label>
            <input type="datetime-local" value={interview_date} onChange={e => setInterviewDate(e.target.value)}
              className="w-full bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-4 text-[#e0e0f0] text-sm outline-none focus:border-[#00ff87] color-scheme-dark transition-all hover:border-[#333]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-[#666] font-mono uppercase ml-1 font-bold tracking-wider">Follow Up Date</label>
            <input type="datetime-local" value={follow_up_date} onChange={e => setFollowUpDate(e.target.value)}
              className="w-full bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-4 text-[#e0e0f0] text-sm outline-none focus:border-[#00ff87] color-scheme-dark transition-all hover:border-[#333]" />
          </div>
        </div>
      </div>

      {job.status === 'interviewing' && (
        <div className="space-y-6">
          <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Offer & Outcome</h4>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] text-[#666] font-mono uppercase ml-1 font-bold tracking-wider">Offer Amount ({currency})</label>
              <input type="number" value={offer_amount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. 35000"
                className="w-full bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-4 text-[#e0e0f0] text-sm outline-none focus:border-[#00ff87] transition-all hover:border-[#333]" />
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'offer', label: '🎉 Got an Offer!', color: 'text-[#00ff87]', bg: 'bg-[#00ff8708]', border: 'border-[#00ff8720]' },
                { value: 'rejected_after_interview', label: '✗ Rejected After Interview', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b08]', border: 'border-[#ff6b6b20]' },
                { value: 'withdrew', label: '🚪 Withdrew', color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a08]', border: 'border-[#ffd60a20]' },
              ].map(opt => (
                <button key={opt.value} onClick={() => onInterviewOutcome(opt.value)}
                  className={`w-full p-5 rounded-2xl cursor-pointer text-[13px] font-bold ${opt.bg} border ${opt.border} ${opt.color} font-syne tracking-tight transition-all text-left hover:brightness-110 hover:translate-x-1 active:translate-y-px active:translate-x-0`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Notes & Insights</h4>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Interview notes, recruiter feedback, culture impressions..."
          rows={5}
          className="w-full bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-5 text-[#e0e0f0] text-[14px] outline-none focus:border-[#00ff87] resize-none transition-all hover:border-[#333] leading-relaxed"
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-4.5 rounded-2xl font-mono text-[11px] font-bold tracking-[3px] uppercase transition-all duration-500 shadow-lg
          ${saved ? 'bg-[#00ff8710] border border-[#00ff8740] text-[#00ff87] shadow-[#00ff8705]' : 'bg-[#12122a] border border-[#2a2a4a] text-[#777] hover:text-white hover:border-[#444] shadow-black/20'}`}
      >
        {saving ? 'Syncing...' : saved ? '✓ Tracking Info Updated' : 'Update Tracking Info'}
      </button>
    </div>
  )

  return (
    <div className="bg-[#0d0d20] border-l border-[#1a1a32] flex flex-col h-[calc(100vh-140px)] sticky top-6 animate-in fade-in slide-in-from-right-8 duration-700 shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-l-[2rem]">
      {/* Header */}
      <div className="p-8 pb-6 shrink-0 bg-[#0d0d20] relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00ff87] to-transparent opacity-50" />
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h3 className="font-syne font-extrabold text-2xl text-white mb-2 leading-tight tracking-tight">{job.title}</h3>
            <div className="text-[11px] font-mono font-bold text-[#555] tracking-[2px] uppercase flex items-center gap-2">
                <span className="text-[#888]">{job.company}</span>
                <span className="w-1 h-1 rounded-full bg-[#2a2a4a]" />
                <span>{job.location}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#333] hover:text-white transition-all text-4xl leading-none -mt-4 hover:rotate-90">×</button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
            {(job.salary_min || job.salary_max) && (
              <div className="text-[12px] font-bold text-[#00ff87] font-mono bg-[#00ff8708] border border-[#00ff8715] px-4 py-1.5 rounded-xl">
                {currency}{job.salary_min?.toLocaleString()} – {currency}{job.salary_max?.toLocaleString()}
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              {(job.stack || []).slice(0, 4).map(s => (
                <span key={s} className="text-[9px] px-2.5 py-1 rounded-lg bg-[#1a1a3a] text-[#7b61ff] font-mono font-bold border border-[#2a2a4a] uppercase tracking-tighter">{s}</span>
              ))}
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-8 border-b border-[#1a1a32] bg-[#0d0d20]/80 backdrop-blur-xl z-20">
        {(['overview', 'letter', 'tracking'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-5 font-mono text-[10px] font-bold tracking-[3px] uppercase transition-all relative
              ${activeTab === tab ? 'text-[#00ff87]' : 'text-[#444] hover:text-[#888]'}`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#00ff87] shadow-[0_0_15px_#00ff87]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#080812]/40 scrollbar-hide">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'letter' && renderLetter()}
        {activeTab === 'tracking' && renderTracking()}
      </div>

      {/* Actions Footer */}
      <div className="p-8 border-t border-[#1a1a32] flex gap-4 shrink-0 bg-[#0d0d20] z-20">
        {job.status === 'pending' && (
          <>
            <button onClick={() => onStatusUpdate(job.id, 'applied')}
              className="flex-1 bg-[#00ff87] text-[#0a0a1a] py-4 rounded-2xl font-bold font-mono text-[11px] tracking-[2px] uppercase hover:brightness-110 shadow-[0_10px_20px_#00ff8715] transition-all hover:-translate-y-0.5 active:translate-y-0"
            >✓ Mark Applied</button>
            <button onClick={() => onStatusUpdate(job.id, 'skipped')}
              className="px-8 bg-[#12122a] border border-[#2a2a4a] text-[#666] py-4 rounded-2xl font-mono text-[11px] font-bold uppercase hover:border-[#3a3a5a] hover:text-[#888] transition-all"
            >Skip</button>
          </>
        )}

        {job.status === 'applied' && (
          <button onClick={() => onStatusUpdate(job.id, 'interviewing')}
            className="flex-1 bg-[#00d4ff] text-[#0a0a1a] py-4 rounded-2xl font-bold font-mono text-[11px] tracking-[2px] uppercase hover:brightness-110 shadow-[0_10px_20px_#00d4ff15] transition-all hover:-translate-y-0.5"
          >🎯 Got Interview!</button>
        )}

        {job.status === 'skipped' && (
          <button onClick={() => onStatusUpdate(job.id, 'pending')}
            className="flex-1 bg-[#ffd60a08] border border-[#ffd60a20] text-[#ffd60a] py-4 rounded-2xl font-bold font-mono text-[11px] tracking-[2px] uppercase hover:bg-[#ffd60a15] transition-all"
          >↩ Undo Skip</button>
        )}

        {job.status === 'interviewing' && (
           <div className="flex-1 text-center py-3.5 px-6 rounded-2xl bg-[#00d4ff08] border border-[#00d4ff15]">
              <span className="text-[10px] font-mono font-bold text-[#00d4ff] uppercase tracking-[3px]">Interviewing Phase</span>
           </div>
        )}
      </div>
    </div>
  )
}
