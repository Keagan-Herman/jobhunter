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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards pb-8">
      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
          Point of Contact
          <div className="h-px flex-1 bg-[#e2e2d9]" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] text-[#4a4a4a] font-mono uppercase font-bold tracking-[2px]">Contact Name</label>
            <input value={contact_name} onChange={e => setContactName(e.target.value)} placeholder="Full name"
              className="w-full bg-white border border-[#e2e2d9] p-4 text-[#1a1a1a] text-[14px] outline-none focus:border-[#c5a059] transition-all font-medium" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] text-[#4a4a4a] font-mono uppercase font-bold tracking-[2px]">Contact Email</label>
            <input value={contact_email} onChange={e => setContactEmail(e.target.value)} placeholder="email@example.com"
              className="w-full bg-white border border-[#e2e2d9] p-4 text-[#1a1a1a] text-[14px] outline-none focus:border-[#c5a059] transition-all font-medium" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
          Timeline
          <div className="h-px flex-1 bg-[#e2e2d9]" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] text-[#4a4a4a] font-mono uppercase font-bold tracking-[2px]">Interview Schedule</label>
            <input type="datetime-local" value={interview_date} onChange={e => setInterviewDate(e.target.value)}
              className="w-full bg-white border border-[#e2e2d9] p-4 text-[#1a1a1a] text-[14px] outline-none focus:border-[#c5a059] transition-all font-medium" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] text-[#4a4a4a] font-mono uppercase font-bold tracking-[2px]">Follow Up</label>
            <input type="datetime-local" value={follow_up_date} onChange={e => setFollowUpDate(e.target.value)}
              className="w-full bg-white border border-[#e2e2d9] p-4 text-[#1a1a1a] text-[14px] outline-none focus:border-[#c5a059] transition-all font-medium" />
          </div>
        </div>
      </div>

      {job.status === 'interviewing' && (
        <div className="space-y-6">
          <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
            Final Outcome
            <div className="h-px flex-1 bg-[#e2e2d9]" />
          </h4>
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] text-[#4a4a4a] font-mono uppercase font-bold tracking-[2px]">Offer Amount ({currency})</label>
              <input type="number" value={offer_amount} onChange={e => setOfferAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-white border border-[#e2e2d9] p-6 text-[#1a1a1a] text-[22px] font-syne font-bold outline-none focus:border-[#c5a059] shadow-sm transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: 'offer', label: 'Offer Received', color: 'text-[#2b6777]', bg: 'bg-[#2b6777]/5', border: 'border-[#2b6777]/20' },
                { value: 'rejected_after_interview', label: 'Rejected', color: 'text-[#bc243c]', bg: 'bg-[#bc243c]/5', border: 'border-[#bc243c]/20' },
                { value: 'withdrew', label: 'Withdrawn', color: 'text-[#888]', bg: 'bg-[#f0f0eb]', border: 'border-[#d1d1ca]' },
              ].map(opt => (
                <button key={opt.value} onClick={() => onInterviewOutcome(opt.value)}
                  className={`p-5 rounded-sm cursor-pointer text-[11px] font-bold ${opt.bg} border ${opt.border} ${opt.color} font-syne tracking-tight transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] flex flex-col items-center gap-1 uppercase`}
                >
                    {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
          Strategic Notes
          <div className="h-px flex-1 bg-[#e2e2d9]" />
        </h4>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Professional insights and observations..."
          rows={6}
          className="w-full bg-white border border-[#e2e2d9] p-8 text-[#4a4a4a] text-[15px] outline-none focus:border-[#c5a059] resize-none transition-all leading-relaxed font-medium"
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`w-full py-5 rounded-sm font-mono text-[11px] font-bold tracking-[3px] uppercase transition-all duration-300 shadow-md active:scale-[0.98] border border-transparent relative overflow-hidden
          ${saved ? 'bg-[#2b6777]/5 border-[#2b6777] text-[#2b6777]' : 'bg-[#1a1a1a] text-white hover:bg-[#c5a059]'}`}
      >
        {saving ? 'Syncing' : saved ? 'Record Updated' : 'Update Tracking'}
      </button>
    </div>
  )
}
