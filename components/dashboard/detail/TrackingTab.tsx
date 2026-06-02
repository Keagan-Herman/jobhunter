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
    <div className="space-y-14 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards pb-10">
      <div className="space-y-12">
        <h4 className="text-[10px] font-mono font-black text-[#444] tracking-[5px] uppercase flex items-center gap-4">
          Direct Contact
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-2 font-black tracking-[3px]">Contact Name</label>
            <input value={contact_name} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
              className="w-full bg-glass border border-white/5 rounded-2xl p-6 text-white/90 text-[15px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 transition-all duration-500 hover:border-white/10 shadow-2xl font-medium" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-2 font-black tracking-[3px]">Contact Email</label>
            <input value={contact_email} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com"
              className="w-full bg-glass border border-white/5 rounded-2xl p-6 text-white/90 text-[15px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 transition-all duration-500 hover:border-white/10 shadow-2xl font-medium" />
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <h4 className="text-[10px] font-mono font-black text-[#444] tracking-[5px] uppercase flex items-center gap-4">
          Milestones
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-2 font-black tracking-[3px]">Interview Date</label>
            <input type="datetime-local" value={interview_date} onChange={e => setInterviewDate(e.target.value)}
              className="w-full bg-glass border border-white/5 rounded-2xl p-6 text-white/90 text-[15px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 color-scheme-dark transition-all duration-500 hover:border-white/10 shadow-2xl font-medium" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] text-[#555] font-mono uppercase ml-2 font-black tracking-[3px]">Follow Up Date</label>
            <input type="datetime-local" value={follow_up_date} onChange={e => setFollowUpDate(e.target.value)}
              className="w-full bg-glass border border-white/5 rounded-2xl p-6 text-white/90 text-[15px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 color-scheme-dark transition-all duration-500 hover:border-white/10 shadow-2xl font-medium" />
          </div>
        </div>
      </div>

      {job.status === 'interviewing' && (
        <div className="space-y-12">
          <h4 className="text-[10px] font-mono font-black text-[#444] tracking-[5px] uppercase flex items-center gap-4">
            Final Results
            <div className="h-px flex-1 bg-white/[0.03]" />
          </h4>
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] text-[#555] font-mono uppercase ml-2 font-black tracking-[3px]">Offer Amount ({currency})</label>
              <input type="number" value={offer_amount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. 120000"
                className="w-full bg-glass border border-white/5 rounded-2xl p-7 text-white/95 text-[22px] font-syne font-black outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 transition-all duration-500 hover:border-white/10 shadow-2xl" />
            </div>
            <div className="grid grid-cols-1 gap-6">
              {[
                { value: 'offer', label: 'Accepted Offer!', color: 'text-[#00ff87]', bg: 'bg-[#00ff87]/5', border: 'border-[#00ff87]/20', icon: '🏆' },
                { value: 'rejected_after_interview', label: 'Rejected (Post-Interview)', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/5', border: 'border-[#ff6b6b]/20', icon: '💔' },
                { value: 'withdrew', label: 'Withdrew Application', color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a]/5', border: 'border-[#ffd60a]/20', icon: '🏳️' },
              ].map(opt => (
                <button key={opt.value} onClick={() => onInterviewOutcome(opt.value)}
                  className={`w-full p-10 rounded-[3rem] cursor-pointer text-[17px] font-black ${opt.bg} border ${opt.border} ${opt.color} font-syne tracking-tight transition-all duration-500 text-left hover:brightness-125 hover:translate-x-3 active:scale-[0.99] shadow-2xl flex items-center justify-between group`}
                >
                    <span className="flex items-center gap-5">
                      <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500">{opt.icon}</span>
                      {opt.label}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 duration-500 text-2xl">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-12">
        <h4 className="text-[10px] font-mono font-black text-[#444] tracking-[5px] uppercase flex items-center gap-4">
          Field Notes
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Interview highlights, cultural red flags, questions to ask..."
          rows={8}
          className="w-full bg-glass border border-white/5 rounded-[3rem] p-10 text-white/80 text-[16px] outline-none focus:border-[#00ff87]/40 focus:ring-2 focus:ring-[#00ff87]/20 resize-none transition-all duration-500 hover:border-white/10 leading-[2] shadow-2xl font-medium"
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-7 rounded-[2.5rem] font-mono text-[12px] font-black tracking-[6px] uppercase transition-all duration-700 shadow-[0_30px_60px_rgba(0,0,0,0.6)] active:scale-[0.98] border border-transparent overflow-hidden relative group
          ${saved ? 'bg-[#00ff8710] border-[#00ff8740] text-[#00ff87]' : 'bg-[#00ff87] text-[#0a0a1a] hover:brightness-110 hover:-translate-y-1'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
        {saving ? 'Syncing Profile...' : saved ? '✓ Successfully Saved' : 'Update Tracking Data'}
      </button>
    </div>
  )
}
