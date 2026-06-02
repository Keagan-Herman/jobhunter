import { Job } from '@/types'

export function TrackingTab({
  job,
  contact_name,
  setContactName,
  contact_email,
  setContactEmail,
  interview_date,
  setInterviewDate,
  follow_up_date,
  setFollowUpDate,
  offer_amount,
  setOfferAmount,
  currency,
  notes,
  setNotes,
  handleSave,
  saving,
  saved,
  onInterviewOutcome
}: {
  job: Job
  contact_name: string
  setContactName: (val: string) => void
  contact_email: string
  setContactEmail: (val: string) => void
  interview_date: string
  setInterviewDate: (val: string) => void
  follow_up_date: string
  setFollowUpDate: (val: string) => void
  offer_amount: string
  setOfferAmount: (val: string) => void
  currency: string
  notes: string
  setNotes: (val: string) => void
  handleSave: () => void
  saving: boolean
  saved: boolean
  onInterviewOutcome: (outcome: string) => void
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards pb-8">
      <div className="space-y-6">
        <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-3">
          Direct Contact
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] text-[#555] font-mono uppercase ml-1 font-black tracking-[2px]">Contact Name</label>
            <input value={contact_name} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
              className="w-full bg-glass border border-white/5 rounded-xl p-4 text-white/90 text-[14px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 transition-all font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-[#555] font-mono uppercase ml-1 font-black tracking-[2px]">Contact Email</label>
            <input value={contact_email} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com"
              className="w-full bg-glass border border-white/5 rounded-xl p-4 text-white/90 text-[14px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 transition-all font-medium" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-3">
          Milestones
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] text-[#555] font-mono uppercase ml-1 font-black tracking-[2px]">Interview Date</label>
            <input type="datetime-local" value={interview_date} onChange={e => setInterviewDate(e.target.value)}
              className="w-full bg-glass border border-white/5 rounded-xl p-4 text-white/90 text-[14px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 color-scheme-dark transition-all font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] text-[#555] font-mono uppercase ml-1 font-black tracking-[2px]">Follow Up Date</label>
            <input type="datetime-local" value={follow_up_date} onChange={e => setFollowUpDate(e.target.value)}
              className="w-full bg-glass border border-white/5 rounded-xl p-4 text-white/90 text-[14px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 color-scheme-dark transition-all font-medium" />
          </div>
        </div>
      </div>

      {job.status === 'interviewing' && (
        <div className="space-y-6">
          <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-3">
            Final Results
            <div className="h-px flex-1 bg-white/[0.03]" />
          </h4>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] text-[#555] font-mono uppercase ml-1 font-black tracking-[2px]">Offer Amount ({currency})</label>
              <input type="number" value={offer_amount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. 120000"
                className="w-full bg-glass border border-white/5 rounded-xl p-5 text-white/95 text-[18px] font-syne font-black outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 shadow-xl transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'offer', label: 'Offer!', color: 'text-[#00ff87]', bg: 'bg-[#00ff87]/5', border: 'border-[#00ff87]/20', icon: '🏆' },
                { value: 'rejected_after_interview', label: 'Rejected', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/5', border: 'border-[#ff6b6b]/20', icon: '💔' },
                { value: 'withdrew', label: 'Withdrew', color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a]/5', border: 'border-[#ffd60a]/20', icon: '🏳️' },
              ].map(opt => (
                <button key={opt.value} onClick={() => onInterviewOutcome(opt.value)}
                  className={`p-4 rounded-2xl cursor-pointer text-[12px] font-black ${opt.bg} border ${opt.border} ${opt.color} font-syne tracking-tight transition-all duration-500 hover:brightness-125 active:scale-[0.99] flex flex-col items-center gap-1 group`}
                >
                    <span className="text-xl grayscale group-hover:grayscale-0 transition-all duration-500">{opt.icon}</span>
                    {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-3">
          Field Notes
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Interview highlights, cultural red flags, questions to ask..."
          rows={6}
          className="w-full bg-glass border border-white/5 rounded-[2rem] p-6 text-white/80 text-[14px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 resize-none transition-all leading-relaxed font-medium"
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-5 rounded-2xl font-mono text-[11px] font-black tracking-[4px] uppercase transition-all duration-500 shadow-xl active:scale-[0.98] border border-transparent relative group overflow-hidden
          ${saved ? 'bg-[#00ff8710] border-[#00ff8740] text-[#00ff87]' : 'bg-[#00ff87] text-[#0a0a1a] hover:brightness-110'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
        {saving ? 'Syncing...' : saved ? '✓ Saved' : 'Update Tracking'}
      </button>
    </div>
  )
}
