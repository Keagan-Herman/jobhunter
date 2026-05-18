import { useState } from 'react'
import { Job } from '@/types'

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
  onGenerateCoverLetter: () => void
  onStatusUpdate: (id: string, status: Job['status']) => void
  onInterviewOutcome: (outcome: string) => void
  onSaveTracking: (data: {
    notes: string;
    interviewDate: string;
    contactName: string;
    contactEmail: string;
    offerAmount: number;
    followUpDate: string;
  }) => Promise<void>
  generating: boolean
  onCoverLetterOutcome: (outcome: string) => void
}) {
  const [coverLetter] = useState(job.cover_letter || '')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Tracking form state
  const [notes, setNotes] = useState(job.notes || '')
  const [interviewDate, setInterviewDate] = useState(job.interview_date ? job.interview_date.slice(0, 16) : '')
  const [contactName, setContactName] = useState(job.contact_name || '')
  const [contactEmail, setContactEmail] = useState(job.contact_email || '')
  const [offerAmount, setOfferAmount] = useState(job.offer_amount ? String(job.offer_amount) : '')
  const [followUpDate, setFollowUpDate] = useState(job.follow_up_date ? job.follow_up_date.slice(0, 16) : '')

  const currencyMap: Record<string, string> = {
    za: 'R', gb: '£', us: '$', au: '$', ca: '$', de: '€', nl: '€'
  }
  const currency = currencyMap[country] || 'R'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    await onSaveTracking({
        notes, interviewDate, contactName, contactEmail, offerAmount: parseFloat(offerAmount), followUpDate
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-[#0d0d20] border border-[#1a1a32] rounded-xl overflow-hidden flex flex-col max-h-[85vh] fixed inset-0 z-[100] md:relative md:inset-auto md:z-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Mobile Back Button */}
      <div className="md:hidden p-3 border-b border-[#1a1a32] flex items-center">
        <button onClick={onClose} className="text-[#00ff87] text-sm font-mono flex items-center gap-2">
            ← Back to jobs
        </button>
      </div>

      {/* Job Header */}
      <div className="p-4 border-b border-[#1a1a32] shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-base text-white mb-1">{job.title}</h3>
            <div className="text-sm text-[#555] mb-1.5">{job.company} · {job.location}</div>
            {(job.salary_min || job.salary_max) && (
              <div className="text-sm text-[#00ff87] font-mono">
                {currency}{job.salary_min?.toLocaleString()} – {currency}{job.salary_max?.toLocaleString()}
              </div>
            )}
          </div>
          <button onClick={onClose} className="hidden md:block text-[#333] hover:text-white transition-colors text-2xl leading-none px-2">×</button>
        </div>
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {(job.stack || []).map(s => (
            <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-[#1a1a3a] text-[#7b61ff] font-mono">{s}</span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="p-3.5 px-4 border-b border-[#1a1a32] shrink-0">
        <p className="text-xs text-[#666] leading-relaxed line-clamp-3">{job.description}</p>
        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#00ff87] font-mono no-underline inline-block mt-2 hover:underline">
            View full listing →
          </a>
        )}
      </div>

      {/* Cover Letter Area */}
      <div className="flex-1 overflow-auto p-4">
        {!coverLetter && !generating && (
          <div className="text-center py-5">
            <div className="text-2xl mb-1.5">✍️</div>
            <div className="font-mono text-[11px] text-[#333]">Generate a tailored cover letter</div>
          </div>
        )}
        {generating && (
          <div className="text-center py-5">
            <div className="inline-block w-4 h-4 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin"></div>
            <div className="font-mono text-[11px] text-[#444] mt-2">Generating...</div>
          </div>
        )}
        {coverLetter && !generating && (
          <div className="space-y-4 max-w-[65ch]">
            {coverLetter.split('\n\n').map((para, i) => (
                <p key={i} className="text-[13px] leading-relaxed text-[#bbb]">{para}</p>
            ))}
          </div>
        )}
      </div>

      {/* Cover Letter Outcome (for interviewing) */}
      {job.status === 'interviewing' && job.cover_letter_id && (
        <div className="p-3 px-4 border-t border-[#1a1a32] shrink-0 bg-[#0a0a1a]/50">
          <div className="text-[10px] text-[#444] tracking-[2px] uppercase font-mono mb-2.5">Cover Letter Outcome</div>
          <div className="flex gap-2">
            {[
              { value: 'interviewed', label: '🎯 Got Interview', color: 'text-[#00ff87]', bg: 'bg-[#00ff8718]', border: 'border-[#00ff8740]' },
              { value: 'rejected', label: '✗ Rejected', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b18]', border: 'border-[#ff6b6b40]' },
              { value: 'no_response', label: '👻 No Response', color: 'text-[#555]', bg: 'bg-[#55518]', border: 'border-[#55540]' },
            ].map(opt => (
              <button key={opt.value} onClick={() => onCoverLetterOutcome(opt.value)}
                className={`flex-1 py-2 rounded-lg cursor-pointer text-[10px] ${opt.bg} border ${opt.border} ${opt.color} font-mono transition-all text-center hover:brightness-110`}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Tracking (for applied/interviewing) */}
      {['applied', 'interviewing'].includes(job.status) && (
        <div className="p-3.5 px-4 border-t border-[#1a1a32] shrink-0 bg-[#0a0a1a]/50">
          <div className="text-[10px] text-[#444] tracking-[2px] uppercase font-mono mb-3">Application Tracking</div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="text-[10px] text-[#444] font-mono mb-1">Contact Name</div>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
                className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-md p-2 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87]" />
            </div>
            <div>
              <div className="text-[10px] text-[#444] font-mono mb-1">Contact Email</div>
              <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com"
                className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-md p-2 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="text-[10px] text-[#444] font-mono mb-1">Interview Date</div>
              <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-md p-2 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87] color-scheme-dark" />
            </div>
            <div>
              <div className="text-[10px] text-[#444] font-mono mb-1">Follow Up Date</div>
              <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-md p-2 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87] color-scheme-dark" />
            </div>
          </div>

          {job.status === 'interviewing' && (
            <div className="mb-3 space-y-3">
              <div>
                <div className="text-[10px] text-[#444] font-mono mb-1">Offer Amount ({currency})</div>
                <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder="e.g. 35000"
                  className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-md p-2 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87]" />
              </div>
              <div>
                <div className="text-[10px] text-[#444] tracking-[2px] uppercase font-mono mb-2">Interview Result</div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'offer', label: '🎉 Got an Offer!', color: 'text-[#00ff87]', bg: 'bg-[#00ff8718]', border: 'border-[#00ff8740]' },
                    { value: 'rejected_after_interview', label: '✗ Rejected After Interview', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b18]', border: 'border-[#ff6b6b40]' },
                    { value: 'withdrew', label: '🚪 Withdrew', color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a18]', border: 'border-[#ffd60a40]' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => onInterviewOutcome(opt.value)}
                      className={`w-full p-2.5 rounded-lg cursor-pointer text-xs font-semibold ${opt.bg} border ${opt.border} ${opt.color} font-mono tracking-tight transition-all text-left hover:brightness-110`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mb-2.5">
            <div className="text-[10px] text-[#444] font-mono mb-1">Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Interview notes, recruiter feedback..."
              rows={2}
              className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-md p-2 text-[#e0e0f0] text-xs outline-none focus:border-[#00ff87] resize-none"
            />
          </div>

          <button onClick={handleSave} disabled={saving}
            className={`w-full py-2 rounded-lg font-mono text-[11px] font-bold tracking-widest uppercase transition-all duration-300
              ${saved ? 'bg-[#0d2e1f] border border-[#00ff8740] text-[#00ff87]' : 'bg-[#12122a] border border-[#2a2a4a] text-[#666] hover:border-[#3a3a5a]'}`}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Tracking Info'}
          </button>
        </div>
      )}

      {/* Actions (Footer) */}
      <div className="p-3.5 px-4 border-t border-[#1a1a32] flex gap-2 shrink-0 flex-wrap bg-[#080812]">
        {!coverLetter && (
          <button onClick={onGenerateCoverLetter} disabled={generating}
            className="flex-1 bg-[#00ff87] border-none text-[#0a0a1a] py-2.5 rounded-lg font-bold font-mono text-[11px] tracking-widest uppercase cursor-pointer hover:brightness-110 disabled:opacity-60 transition-all"
          >⚡ Generate Cover Letter</button>
        )}

        {coverLetter && (
          <>
            <button onClick={handleCopy}
              className={`py-2.5 px-4 rounded-lg font-mono text-[11px] transition-all
                ${copied ? 'bg-[#00ff8718] border border-[#00ff8740] text-[#00ff87]' : 'bg-[#12122a] border border-[#2a2a4a] text-[#666]'}`}
            >{copied ? '✓ Copied' : '⎘ Copy'}</button>
            <button onClick={onGenerateCoverLetter} disabled={generating}
              className="bg-[#12122a] border border-[#2a2a4a] text-[#666] py-2.5 px-4 rounded-lg font-mono text-[11px] hover:border-[#3a3a5a] transition-all"
            >↺ Regenerate</button>
          </>
        )}

        {job.status === 'pending' && (
          <>
            <button onClick={() => onStatusUpdate(job.id, 'applied')}
              className="flex-1 bg-[#00ff87] border-none text-[#0a0a1a] py-2.5 rounded-lg font-bold font-mono text-[11px] tracking-widest uppercase hover:brightness-110 transition-all"
            >✓ Mark Applied</button>
            <button onClick={() => onStatusUpdate(job.id, 'skipped')}
              className="bg-[#12122a] border border-[#2a2a4a] text-[#555] py-2.5 px-4 rounded-lg font-mono text-[11px] hover:border-[#3a3a5a] transition-all"
            >Skip</button>
          </>
        )}

        {job.status === 'applied' && (
          <button onClick={() => onStatusUpdate(job.id, 'interviewing')}
            className="flex-1 bg-[#00d4ff] border-none text-[#0a0a1a] py-2.5 rounded-lg font-bold font-mono text-[11px] tracking-widest uppercase hover:brightness-110 transition-all"
          >🎯 Got Interview!</button>
        )}

        {job.status === 'skipped' && (
          <button onClick={() => onStatusUpdate(job.id, 'pending')}
            className="flex-1 bg-[#ffd60a18] border border-[#ffd60a40] text-[#ffd60a] py-2.5 rounded-lg font-bold font-mono text-[11px] tracking-widest uppercase hover:brightness-110 transition-all"
          >↩ Undo Skip</button>
        )}
      </div>
    </div>
  )
}
