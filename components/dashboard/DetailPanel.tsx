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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
      <div className="space-y-4">
        <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Job Description</h4>
        <p className="text-[14px] leading-[1.8] text-white/70 whitespace-pre-wrap font-sans">{job.description}</p>
        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] text-[#00ff87] font-mono font-bold no-underline hover:bg-white/[0.08] hover:border-[#00ff8740] transition-all group/link shadow-xl">
            View full listing on {job.source || 'Original Site'} <span className="group-hover/link:translate-x-1 transition-transform">→</span>
          </a>
        )}
      </div>

      {job.score_reason && (
        <div className="p-6 rounded-[2rem] bg-[#00ff8705] border border-[#00ff8715] space-y-3 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,255,135,0.02)]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00ff87]/30" />
          <h4 className="text-[10px] font-mono font-bold text-[#00ff87] tracking-[3px] uppercase">AI Fit Analysis</h4>
          <p className="text-[15px] text-[#00ff87] leading-relaxed font-medium italic">&quot;{job.score_reason}&quot;</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-colors shadow-lg">
          <div className="text-[10px] font-mono text-[#555] uppercase tracking-[2px] mb-2 font-bold">Seniority</div>
          <div className="text-[16px] font-bold text-white capitalize font-syne">{job.seniority || 'Mid'}</div>
        </div>
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-colors shadow-lg">
          <div className="text-[10px] font-mono text-[#555] uppercase tracking-[2px] mb-2 font-bold">Work Style</div>
          <div className="text-[16px] font-bold text-white capitalize font-syne">{job.work_style || 'Not specified'}</div>
        </div>
      </div>

      {job.culture_fit && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Culture Fit</h4>
          <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors shadow-lg">
            <p className="text-[14px] text-white/60 leading-relaxed italic">&quot;{job.culture_fit}&quot;</p>
          </div>
        </div>
      )}

      {job.interview_prep && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Interview Prep Strategy</h4>
          <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors shadow-lg">
            <div className="text-[14px] text-white/60 leading-relaxed whitespace-pre-wrap font-sans">
              {job.interview_prep.split('\n').map((line, i) => (
                <div key={i} className="mb-3 last:mb-0">{line}</div>
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
          <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center text-5xl shadow-2xl relative group">
            <div className="absolute inset-0 rounded-[2rem] bg-[#00ff8710] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">✍️</span>
          </div>
          <div className="space-y-2">
            <h4 className="font-syne font-bold text-2xl text-white tracking-tight">Tailored Cover Letter</h4>
            <p className="text-[14px] text-[#666] max-w-[300px] leading-relaxed">Let AI craft a perfect pitch based on your profile and this job description.</p>
          </div>
          <button onClick={handleGenerate}
            className="bg-[#00ff87] text-[#0a0a1a] px-10 py-4 rounded-2xl font-bold font-mono text-[11px] tracking-[2px] uppercase hover:brightness-110 transition-all shadow-[0_15px_30px_rgba(0,255,135,0.15)] active:scale-95"
          >⚡ Generate Now</button>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white/[0.02] border-t-[#00ff87] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
            <div className="absolute inset-0 rounded-full bg-[#00ff8720] blur-2xl animate-pulse" />
          </div>
          <div className="space-y-3">
            <h4 className="font-syne font-bold text-2xl text-[#00ff87] animate-pulse tracking-tight">Crafting your story...</h4>
            <p className="text-[10px] text-[#555] font-mono uppercase tracking-[3px] font-bold">Analyzing job nuances & matching impact</p>
          </div>
        </div>
      )}

      {coverLetter && !generating && (
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">AI-Generated Pitch</h4>
            <div className="flex gap-3">
              <button onClick={handleCopy}
                className={`px-5 py-2.5 rounded-xl font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-2 shadow-lg
                  ${copied ? 'bg-[#00ff8718] border border-[#00ff8740] text-[#00ff87]' : 'bg-white/[0.03] border border-white/5 text-[#777] hover:text-white hover:border-white/20'}`}
              >{copied ? '✓ Copied' : '⎘ Copy'}</button>
              <button onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[#777] font-mono text-[10px] font-bold uppercase hover:text-white hover:border-white/20 transition-all shadow-lg"
              >↺ Regenerate</button>
            </div>
          </div>

          <div className="p-10 md:p-14 rounded-[2.5rem] bg-white/[0.01] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="space-y-6 max-w-[65ch] mx-auto relative z-10">
              {coverLetter.split('\n\n').map((para, i) => (
                  <p key={i} className="text-[15px] leading-[1.9] text-white/70 font-sans">{para}</p>
              ))}
            </div>
          </div>

          {job.status === 'interviewing' && job.cover_letter_id && (
            <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-8 shadow-xl">
              <h4 className="text-[10px] text-[#555] tracking-[4px] uppercase font-mono text-center font-bold">Performance Feedback</h4>
              <div className="flex gap-4">
                {[
                  { value: 'interviewed', label: '🎯 Interview', color: 'text-[#00ff87]', bg: 'bg-[#00ff8708]', border: 'border-[#00ff8715]' },
                  { value: 'rejected', label: '✗ Rejected', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b08]', border: 'border-[#ff6b6b15]' },
                  { value: 'no_response', label: '👻 Ghosted', color: 'text-[#555]', bg: 'bg-white/[0.02]', border: 'border-white/5' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => onCoverLetterOutcome(opt.value)}
                    className={`flex-1 py-4 rounded-2xl cursor-pointer text-[10px] font-bold ${opt.bg} border ${opt.border} ${opt.color} font-mono transition-all text-center hover:brightness-125 hover:scale-[1.02] uppercase tracking-wider shadow-lg active:scale-95`}
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards">
      <div className="space-y-8">
        <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Contact Details</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-bold tracking-[2px]">Contact Name</label>
            <input value={contact_name} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
              className="w-full bg-white/[0.02] border border-white/5 rounded-[1.25rem] p-4 text-white/90 text-sm outline-none focus:border-[#00ff87]/50 transition-all hover:border-white/10 shadow-lg" />
          </div>
          <div className="space-y-2.5">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-bold tracking-[2px]">Contact Email</label>
            <input value={contact_email} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com"
              className="w-full bg-white/[0.02] border border-white/5 rounded-[1.25rem] p-4 text-white/90 text-sm outline-none focus:border-[#00ff87]/50 transition-all hover:border-white/10 shadow-lg" />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Timeline</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-bold tracking-[2px]">Interview Date</label>
            <input type="datetime-local" value={interview_date} onChange={e => setInterviewDate(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-[1.25rem] p-4 text-white/90 text-sm outline-none focus:border-[#00ff87]/50 color-scheme-dark transition-all hover:border-white/10 shadow-lg" />
          </div>
          <div className="space-y-2.5">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-bold tracking-[2px]">Follow Up Date</label>
            <input type="datetime-local" value={follow_up_date} onChange={e => setFollowUpDate(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-[1.25rem] p-4 text-white/90 text-sm outline-none focus:border-[#00ff87]/50 color-scheme-dark transition-all hover:border-white/10 shadow-lg" />
          </div>
        </div>
      </div>

      {job.status === 'interviewing' && (
        <div className="space-y-8">
          <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Offer & Outcome</h4>
          <div className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-bold tracking-[2px]">Offer Amount ({currency})</label>
              <input type="number" value={offer_amount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. 35000"
                className="w-full bg-white/[0.02] border border-white/5 rounded-[1.25rem] p-4 text-white/90 text-sm outline-none focus:border-[#00ff87]/50 transition-all hover:border-white/10 shadow-lg" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { value: 'offer', label: '🎉 Got an Offer!', color: 'text-[#00ff87]', bg: 'bg-[#00ff8708]', border: 'border-[#00ff8715]' },
                { value: 'rejected_after_interview', label: '✗ Rejected After Interview', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b08]', border: 'border-[#ff6b6b15]' },
                { value: 'withdrew', label: '🚪 Withdrew', color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a08]', border: 'border-[#ffd60a15]' },
              ].map(opt => (
                <button key={opt.value} onClick={() => onInterviewOutcome(opt.value)}
                  className={`w-full p-6 rounded-[1.5rem] cursor-pointer text-[14px] font-bold ${opt.bg} border ${opt.border} ${opt.color} font-syne tracking-tight transition-all text-left hover:brightness-125 hover:translate-x-1.5 active:scale-[0.98] shadow-lg`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <h4 className="text-[10px] font-mono font-bold text-[#555] tracking-[3px] uppercase">Notes & Insights</h4>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Interview notes, recruiter feedback, culture impressions..."
          rows={6}
          className="w-full bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-6 text-white/80 text-[14px] outline-none focus:border-[#00ff87]/50 resize-none transition-all hover:border-white/10 leading-relaxed shadow-lg"
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-5 rounded-[1.25rem] font-mono text-[11px] font-bold tracking-[4px] uppercase transition-all duration-700 shadow-2xl active:scale-[0.98]
          ${saved ? 'bg-[#00ff8710] border border-[#00ff8730] text-[#00ff87]' : 'bg-white/[0.03] border border-white/5 text-[#555] hover:text-white hover:border-white/20'}`}
      >
        {saving ? 'Syncing...' : saved ? '✓ Tracking Info Updated' : 'Update Tracking Info'}
      </button>
    </div>
  )

  return (
    <div className="bg-glass border-l border-white/5 flex flex-col h-[calc(100vh-140px)] sticky top-6 animate-in fade-in slide-in-from-right-8 duration-700 shadow-[20px_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-l-[3rem]">
      {/* Header */}
      <div className="p-10 pb-8 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#00ff87] to-transparent opacity-40" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#00ff87]/5 rounded-full blur-[80px]" />

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="flex-1">
            <h3 className="font-syne font-extrabold text-3xl text-white mb-3 leading-tight tracking-tight">{job.title}</h3>
            <div className="text-[11px] font-mono font-bold text-[#555] tracking-[3px] uppercase flex items-center gap-2">
                <span className="text-[#888]">{job.company}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span>{job.location}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#333] hover:text-white transition-all text-5xl leading-none -mt-6 hover:rotate-90 hover:scale-110">×</button>
        </div>

        <div className="flex items-center gap-4 flex-wrap relative z-10">
            {(job.salary_min || job.salary_max) && (
              <div className="text-[12px] font-bold text-[#00ff87] font-mono bg-[#00ff8705] border border-[#00ff8715] px-5 py-2 rounded-2xl shadow-lg">
                {currency}{job.salary_min?.toLocaleString()} – {currency}{job.salary_max?.toLocaleString()}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {(job.stack || []).slice(0, 4).map(s => (
                <span key={s} className="text-[9px] px-3 py-1.5 rounded-xl bg-white/[0.03] text-[#7b61ff] font-mono font-bold border border-white/5 uppercase tracking-tighter shadow-sm">{s}</span>
              ))}
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-10 border-b border-white/5 bg-white/[0.01] backdrop-blur-3xl z-20">
        {(['overview', 'letter', 'tracking'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-6 font-mono text-[10px] font-bold tracking-[4px] uppercase transition-all relative
              ${activeTab === tab ? 'text-[#00ff87]' : 'text-[#444] hover:text-[#888]'}`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#00ff87] shadow-[0_0_20px_#00ff87]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-10 bg-[#080812]/20 scrollbar-hide">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'letter' && renderLetter()}
        {activeTab === 'tracking' && renderTracking()}
      </div>

      {/* Actions Footer */}
      <div className="p-10 border-t border-white/5 flex gap-5 shrink-0 bg-white/[0.01] z-20">
        {job.status === 'pending' && (
          <>
            <button onClick={() => onStatusUpdate(job.id, 'applied')}
              className="flex-1 bg-[#00ff87] text-[#0a0a1a] py-5 rounded-[1.5rem] font-bold font-mono text-[11px] tracking-[3px] uppercase hover:brightness-110 shadow-[0_15px_30px_rgba(0,255,135,0.2)] transition-all hover:-translate-y-1 active:scale-[0.98]"
            >✓ Mark Applied</button>
            <button onClick={() => onStatusUpdate(job.id, 'skipped')}
              className="px-10 bg-white/[0.03] border border-white/5 text-[#555] py-5 rounded-[1.5rem] font-mono text-[11px] font-bold uppercase hover:border-white/10 hover:text-[#888] transition-all active:scale-[0.98]"
            >Skip</button>
          </>
        )}

        {job.status === 'applied' && (
          <button onClick={() => onStatusUpdate(job.id, 'interviewing')}
            className="flex-1 bg-[#00d4ff] text-[#0a0a1a] py-5 rounded-[1.5rem] font-bold font-mono text-[11px] tracking-[3px] uppercase hover:brightness-110 shadow-[0_15px_30px_rgba(0,212,255,0.2)] transition-all hover:-translate-y-1 active:scale-[0.98]"
          >🎯 Got Interview!</button>
        )}

        {job.status === 'skipped' && (
          <button onClick={() => onStatusUpdate(job.id, 'pending')}
            className="flex-1 bg-[#ffd60a]/5 border border-[#ffd60a]/10 text-[#ffd60a] py-5 rounded-[1.5rem] font-bold font-mono text-[11px] tracking-[3px] uppercase hover:bg-[#ffd60a]/10 transition-all active:scale-[0.98]"
          >↩ Undo Skip</button>
        )}

        {job.status === 'interviewing' && (
           <div className="flex-1 text-center py-5 px-8 rounded-[1.5rem] bg-[#00d4ff]/5 border border-[#00d4ff]/10 shadow-lg">
              <span className="text-[10px] font-mono font-bold text-[#00d4ff] uppercase tracking-[4px]">Interviewing Phase</span>
           </div>
        )}
      </div>
    </div>
  )
}
