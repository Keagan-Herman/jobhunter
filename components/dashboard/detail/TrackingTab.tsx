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
}
