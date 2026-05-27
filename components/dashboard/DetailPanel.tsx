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

  const renderOverview = () => (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
      <div className="space-y-5">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-2">
          Skill Alignment
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="flex flex-wrap gap-2.5 p-7 rounded-[2rem] bg-[#0d0d20]/50 border border-white/[0.05] shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
          {job.stack?.map((skill, idx) => {
            const isMatch = userSkills.some(s => s.toLowerCase() === skill.toLowerCase())
            return (
              <div key={`${skill}-${idx}`} className={`group/skill relative text-[11px] px-4 py-2 rounded-xl font-mono font-bold uppercase tracking-tight border transition-all duration-300 ${
                isMatch
                  ? 'bg-[#00ff87]/[0.08] border-[#00ff87]/30 text-[#00ff87] shadow-[0_0_20px_rgba(0,255,135,0.05)] hover:bg-[#00ff87]/[0.12] hover:border-[#00ff87]/50'
                  : 'bg-white/[0.02] border-white/5 text-[#555] hover:border-white/10 hover:text-[#777]'
              }`}>
                {skill}
                {isMatch && <span className="ml-2 text-[10px] opacity-70">✓</span>}
              </div>
            )
          })}
          {(!job.stack || job.stack.length === 0) && (
            <span className="text-[11px] text-[#444] font-mono italic px-2">No specific stack identified in listing</span>
          )}
        </div>
      </div>

      {/* AI Fit Analysis - Promoted to top */}
      {job.score_reason && (
        <div className="p-8 rounded-[2.5rem] bg-[#00ff87]/[0.03] border border-[#00ff87]/15 space-y-4 relative overflow-hidden shadow-[inset_0_0_40px_rgba(0,255,135,0.02)] group/ai transition-all duration-500 hover:border-[#00ff87]/30">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#00ff87] via-[#00d4ff] to-transparent opacity-40" />
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#00ff87]/10 rounded-full blur-[80px] opacity-0 group-hover/ai:opacity-100 transition-opacity duration-1000" />

          <div className="flex items-center justify-between relative z-10">
            <h4 className="text-[10px] font-mono font-black text-[#00ff87] tracking-[4px] uppercase flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff87]"></span>
              </span>
              AI Match Analysis
            </h4>
            {job.score && (
              <div className="text-[10px] font-mono font-black bg-[#00ff87]/10 text-[#00ff87] px-2.5 py-1 rounded-lg border border-[#00ff87]/20">
                {job.score}% FIT
              </div>
            )}
          </div>

          <p className="text-[17px] text-white/95 leading-relaxed font-syne font-bold italic relative z-10 tracking-tight">
            &quot;{job.score_reason}&quot;
          </p>
        </div>
      )}

      <div className="space-y-5">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-2">
          Role Details
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="grid grid-cols-2 gap-5">
          <div className="p-7 rounded-[2rem] bg-[#0d0d20]/50 border border-white/[0.05] group hover:border-white/10 transition-all duration-500 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center font-mono text-2xl font-black">S</div>
            </div>
            <div className="text-[10px] font-mono text-[#555] uppercase tracking-[3px] mb-2.5 font-black">Seniority</div>
            <div className="text-[20px] font-extrabold text-white capitalize font-syne tracking-tight group-hover:text-[#00ff87] transition-colors">{job.seniority || 'Mid Level'}</div>
          </div>
          <div className="p-7 rounded-[2rem] bg-[#0d0d20]/50 border border-white/[0.05] group hover:border-white/10 transition-all duration-500 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center font-mono text-2xl font-black">W</div>
            </div>
            <div className="text-[10px] font-mono text-[#555] uppercase tracking-[3px] mb-2.5 font-black">Work Style</div>
            <div className="text-[20px] font-extrabold text-white capitalize font-syne tracking-tight group-hover:text-[#00d4ff] transition-colors">{job.work_style || 'Not specified'}</div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-2">
          Full Description
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="relative group/desc">
          <p className="text-[15px] leading-[1.8] text-white/70 whitespace-pre-wrap font-sans bg-[#0d0d20]/50 p-8 rounded-[2.5rem] border border-white/[0.05] group-hover/desc:border-white/10 transition-all duration-500">{job.description}</p>
          {job.url && (
            <div className="mt-6">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] text-[#999] font-mono font-black no-underline hover:bg-[#00ff87] hover:text-[#0a0a1a] hover:border-[#00ff87] transition-all group/link uppercase tracking-widest shadow-xl">
                Open Original Listing <span className="group-hover/link:translate-x-1 transition-transform">↗</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {job.culture_fit && (
        <div className="space-y-5">
          <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-2">
            Culture Pulse
            <div className="h-px flex-1 bg-white/[0.03]" />
          </h4>
          <div className="p-8 rounded-[2.5rem] bg-[#7b61ff]/[0.02] border border-[#7b61ff]/10 hover:border-[#7b61ff]/30 transition-all duration-500 shadow-2xl relative overflow-hidden group/culture">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7b61ff]/[0.05] to-transparent opacity-0 group-hover/culture:opacity-100 transition-opacity duration-700" />
            <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
               <span className="text-3xl">✨</span>
            </div>
            <p className="text-[16px] text-white/80 leading-relaxed italic relative z-10 font-syne font-medium">&quot;{job.culture_fit}&quot;</p>
          </div>
        </div>
      )}

      {job.interview_prep && (
        <div className="space-y-5 pb-8">
          <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-2">
            Winning Strategy
            <div className="h-px flex-1 bg-white/[0.03]" />
          </h4>
          <div className="p-8 rounded-[2.5rem] bg-[#00d4ff]/[0.02] border border-[#00d4ff]/10 hover:border-[#00d4ff]/30 transition-all duration-500 shadow-2xl relative overflow-hidden group/prep">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#00d4ff]/[0.05] to-transparent opacity-0 group-hover/prep:opacity-100 transition-opacity duration-700" />
            <div className="text-[15px] text-white/80 leading-[1.8] whitespace-pre-wrap font-sans relative z-10">
              {job.interview_prep.split('\n').map((line, i) => (
                <div key={i} className="mb-5 last:mb-0 flex gap-4 group/line">
                    <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_10px_#00d4ff] transition-transform group-hover/line:scale-150" />
                    <span className="flex-1">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderLetter = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
      {!coverLetter && !generating && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/5 mx-4">
          <div className="w-24 h-24 rounded-[2.5rem] bg-[#1a1a3a]/30 border border-[#2a2a4a] flex items-center justify-center text-5xl shadow-2xl group/btn transition-transform hover:scale-110 duration-500 italic font-syne font-black text-[#00ff87]">JH</div>
          <div className="space-y-3 px-10">
            <h4 className="font-syne font-black text-3xl text-white tracking-tight">Tailored Cover Letter</h4>
            <p className="text-[15px] text-[#666] max-w-[340px] leading-relaxed mx-auto font-medium">Let AI craft a perfect pitch based on your profile and this specific job description.</p>
          </div>
          <button onClick={handleGenerate}
            className="group relative bg-[#00ff87] text-[#0a0a1a] px-12 py-5 rounded-[2rem] font-black font-mono text-[11px] tracking-[3px] uppercase hover:brightness-110 transition-all shadow-[0_20px_40px_rgba(0,255,135,0.2)] active:scale-95 overflow-hidden"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              ⚡ Generate Now
          </button>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#00ff8710] border-t-[#00ff87] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse font-syne font-black text-[#00ff87]">JH</div>
          </div>
          <div className="space-y-4">
            <h4 className="font-syne font-black text-3xl text-[#00ff87] animate-pulse tracking-tight">Crafting your story...</h4>
            <p className="text-[11px] text-[#555] font-mono uppercase tracking-[4px] font-black">Analyzing nuances & matching impact</p>
          </div>
        </div>
      )}

      {coverLetter && !generating && (
        <div className="space-y-10">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase">AI-Generated Pitch</h4>
            <div className="flex gap-4">
              <button onClick={handleCopy}
                className={`px-6 py-3 rounded-2xl font-mono text-[10px] font-black uppercase transition-all flex items-center gap-2 shadow-lg
                  ${copied ? 'bg-[#00ff8715] border border-[#00ff8740] text-[#00ff87]' : 'bg-[#12122a] border border-white/5 text-[#777] hover:text-white hover:border-white/10'}`}
              >{copied ? 'Copied' : 'Copy Pitch'}</button>
              <button onClick={handleGenerate}
                className="px-6 py-3 rounded-2xl bg-[#12122a] border border-white/5 text-[#777] font-mono text-[10px] font-black uppercase hover:text-white hover:border-white/10 transition-all shadow-lg"
              >Regenerate</button>
            </div>
          </div>

          <div className="p-12 md:p-16 rounded-[3rem] bg-[#0d0d20]/40 backdrop-blur-md border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <div className="space-y-8 max-w-[65ch] mx-auto relative z-10">
              {coverLetter.split('\n\n').map((para, i) => (
                  <p key={i} className="text-[16px] leading-[2] text-white/75 font-sans font-medium">{para}</p>
              ))}
            </div>
          </div>

          {job.status === 'interviewing' && job.cover_letter_id && (
            <div className="p-10 rounded-[3rem] bg-white/[0.01] border border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-[#00ff87]/[0.02] to-transparent pointer-events-none" />
              <h4 className="text-[10px] text-[#555] tracking-[5px] uppercase font-mono text-center font-black relative z-10">Performance Feedback</h4>
              <div className="flex gap-5 relative z-10">
                {[
                  { value: 'interviewed', label: 'Interviewed', color: 'text-[#00ff87]', bg: 'bg-[#00ff87]/5', border: 'border-[#00ff87]/10' },
                  { value: 'rejected', label: 'Rejected', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/5', border: 'border-[#ff6b6b]/10' },
                  { value: 'no_response', label: 'Ghosted', color: 'text-[#555]', bg: 'bg-white/5', border: 'border-white/5' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => onCoverLetterOutcome(opt.value)}
                    className={`flex-1 py-5 rounded-[1.5rem] cursor-pointer text-[11px] font-black ${opt.bg} border ${opt.border} ${opt.color} font-mono transition-all text-center hover:brightness-125 hover:scale-[1.03] uppercase tracking-widest shadow-xl active:scale-95`}
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
    <div className="space-y-14 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards pb-10">
      <div className="space-y-10">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase">Direct Contact</h4>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-black tracking-[3px]">Contact Name</label>
            <input value={contact_name} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
              className="w-full bg-[#0d0d20] border border-white/5 rounded-2xl p-5 text-white/90 text-sm outline-none focus:border-[#00ff87]/40 transition-all hover:border-white/10 shadow-2xl font-medium" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-black tracking-[3px]">Contact Email</label>
            <input value={contact_email} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com"
              className="w-full bg-[#0d0d20] border border-white/5 rounded-2xl p-5 text-white/90 text-sm outline-none focus:border-[#00ff87]/40 transition-all hover:border-white/10 shadow-2xl font-medium" />
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase">Milestones</h4>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-black tracking-[3px]">Interview Date</label>
            <input type="datetime-local" value={interview_date} onChange={e => setInterviewDate(e.target.value)}
              className="w-full bg-[#0d0d20] border border-white/5 rounded-2xl p-5 text-white/90 text-sm outline-none focus:border-[#00ff87]/40 color-scheme-dark transition-all hover:border-white/10 shadow-2xl font-medium" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-black tracking-[3px]">Follow Up Date</label>
            <input type="datetime-local" value={follow_up_date} onChange={e => setFollowUpDate(e.target.value)}
              className="w-full bg-[#0d0d20] border border-white/5 rounded-2xl p-5 text-white/90 text-sm outline-none focus:border-[#00ff87]/40 color-scheme-dark transition-all hover:border-white/10 shadow-2xl font-medium" />
          </div>
        </div>
      </div>

      {job.status === 'interviewing' && (
        <div className="space-y-10">
          <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase">Final Results</h4>
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] text-[#555] font-mono uppercase ml-1 font-black tracking-[3px]">Offer Amount ({currency})</label>
              <input type="number" value={offer_amount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. 120000"
                className="w-full bg-[#0d0d20] border border-white/5 rounded-2xl p-5 text-white/90 text-[18px] font-syne font-black outline-none focus:border-[#00ff87]/40 transition-all hover:border-white/10 shadow-2xl" />
            </div>
            <div className="grid grid-cols-1 gap-5">
              {[
                { value: 'offer', label: 'Accepted Offer!', color: 'text-[#00ff87]', bg: 'bg-[#00ff87]/5', border: 'border-[#00ff87]/10' },
                { value: 'rejected_after_interview', label: 'Rejected (Post-Interview)', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/5', border: 'border-[#ff6b6b]/10' },
                { value: 'withdrew', label: 'Withdrew Application', color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a]/5', border: 'border-[#ffd60a]/10' },
              ].map(opt => (
                <button key={opt.value} onClick={() => onInterviewOutcome(opt.value)}
                  className={`w-full p-8 rounded-[2rem] cursor-pointer text-[15px] font-black ${opt.bg} border ${opt.border} ${opt.color} font-syne tracking-tight transition-all text-left hover:brightness-125 hover:translate-x-2 active:scale-[0.99] shadow-2xl flex items-center justify-between group`}
                >
                    {opt.label}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-10">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase">Field Notes</h4>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Interview highlights, cultural red flags, questions to ask..."
          rows={7}
          className="w-full bg-[#0d0d20] border border-white/5 rounded-[2rem] p-8 text-white/80 text-[15px] outline-none focus:border-[#00ff87]/40 resize-none transition-all hover:border-white/10 leading-[1.8] shadow-2xl font-medium"
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-6 rounded-[2rem] font-mono text-[11px] font-black tracking-[5px] uppercase transition-all duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-[0.98]
          ${saved ? 'bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87]' : 'bg-[#00ff87] text-[#0a0a1a] hover:brightness-110'}`}
      >
        {saving ? 'Syncing...' : saved ? 'Successfully Saved' : 'Update Tracking Data'}
      </button>
    </div>
  )

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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'letter' && renderLetter()}
        {activeTab === 'tracking' && renderTracking()}
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
