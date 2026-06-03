import { Job } from '@/types'

export function LetterTab({
  job,
  coverLetter,
  generating,
  handleGenerate,
  handleCopy,
  copied,
  onCoverLetterOutcome,
  onUpdateContent,
  saving,
  saved
}: {
  job: Job
  coverLetter: string
  generating: boolean
  handleGenerate: () => void
  handleCopy: () => void
  copied: boolean
  onCoverLetterOutcome: (outcome: string) => void
  onUpdateContent: (content: string) => void
  saving?: boolean
  saved?: boolean
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards">
      {!coverLetter && !generating && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 bg-white border-2 border-dashed border-[#e2e2d9] mx-4 tactile-pop">
          <div className="w-20 h-20 bg-[#1a1a1a] flex items-center justify-center text-4xl font-syne font-bold text-[#c5a059]">JH</div>
          <div className="space-y-3 px-8">
            <h4 className="font-syne font-bold text-2xl text-[#1a1a1a] tracking-tight uppercase">Professional Pitch</h4>
            <p className="text-[13px] text-[#888] max-w-[300px] leading-relaxed mx-auto font-medium font-sans">Generate a tailored cover letter structured for maximum impact.</p>
          </div>
          <button onClick={handleGenerate}
            className="bg-[#1a1a1a] text-[#f8f8f4] px-12 py-4 rounded-sm font-bold font-mono text-[11px] tracking-[2px] uppercase hover:bg-[#c5a059] transition-all shadow-md active:scale-95"
          >
              Generate Document
          </button>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-10 animate-in fade-in duration-700">
          <div className="relative">
            <div className="w-24 h-24 border-[3px] border-[#e2e2d9] border-t-[#c5a059] animate-spin duration-[1s]" />
          </div>
          <div className="space-y-4">
            <h4 className="font-syne font-bold text-2xl text-[#1a1a1a] tracking-tight uppercase">
              Drafting Analysis
            </h4>
            <p className="text-[10px] text-[#888] font-mono uppercase tracking-[4px] font-bold">Matching skills and aligning objectives</p>
          </div>
        </div>
      )}

      {coverLetter && !generating && (
        <div className="space-y-10">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase">Draft Content</h4>
            <div className="flex gap-4">
              <button onClick={handleCopy}
                className={`px-6 py-3 rounded-sm font-mono text-[10px] font-bold uppercase transition-all duration-300 border tactile-pop active:scale-95
                  ${copied ? 'bg-[#2b6777]/5 border-[#2b6777] text-[#2b6777]' : 'bg-white border-[#e2e2d9] text-[#4a4a4a] hover:bg-[#f8f8f4]'}`}
              >{copied ? 'Copied' : 'Copy Text'}</button>
              <button onClick={handleGenerate}
                className="px-6 py-3 rounded-sm bg-[#1a1a1a] text-white font-mono text-[10px] font-bold uppercase hover:bg-[#c5a059] transition-all duration-300 shadow-md active:scale-95"
              >Regenerate</button>
            </div>
          </div>

          <div className="relative group/editor">
            <div className="p-16 bg-white border border-[#e2e2d9] shadow-sm relative group selection:bg-[#c5a05920] selection:text-[#1a1a1a]">
              <textarea
                value={coverLetter}
                onChange={(e) => onUpdateContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[17px] leading-[1.8] text-[#1a1a1a] font-serif tracking-normal resize-none h-[550px] relative z-10 scrollbar-hide custom-cursor-gold"
                spellCheck="false"
                placeholder="Professional summary content..."
              />
            </div>

            {saving && (
              <div className="absolute top-4 right-8 flex items-center gap-2 bg-[#f8f8f4] px-4 py-2 border border-[#e2e2d9]">
                <div className="w-1.5 h-1.5 bg-[#c5a059] animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-[#c5a059] uppercase tracking-widest">Saving</span>
              </div>
            )}
            {saved && !saving && (
              <div className="absolute top-4 right-8 flex items-center gap-2 bg-[#2b6777]/5 px-4 py-2 border border-[#2b6777]/20">
                <span className="text-[9px] font-mono font-bold text-[#2b6777] uppercase tracking-widest">Saved</span>
              </div>
            )}
          </div>

          {job.status === 'interviewing' && job.cover_letter_id && (
            <div className="p-10 bg-[#f0f0eb] border border-[#e2e2d9] space-y-8 tactile-pop relative overflow-hidden">
              <h4 className="text-[10px] text-[#888] tracking-[4px] uppercase font-mono text-center font-bold relative z-10">Outcome Tracking</h4>
              <div className="flex gap-4 relative z-10">
                {[
                  { value: 'interviewed', label: 'Positive', color: 'text-[#2b6777]', bg: 'bg-[#2b6777]/5', border: 'border-[#2b6777]/20' },
                  { value: 'rejected', label: 'Negative', color: 'text-[#bc243c]', bg: 'bg-[#bc243c]/5', border: 'border-[#bc243c]/20' },
                  { value: 'no_response', label: 'Neutral', color: 'text-[#888]', bg: 'bg-white', border: 'border-[#e2e2d9]' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => onCoverLetterOutcome(opt.value)}
                    className={`flex-1 py-4 rounded-sm cursor-pointer text-[10px] font-bold ${opt.bg} border ${opt.border} ${opt.color} font-mono transition-all text-center hover:scale-[1.02] uppercase tracking-widest active:scale-95`}
                  >{opt.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
