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
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 bg-white/[0.01] rounded-[2.5rem] border border-dashed border-white/5 mx-4">
          <div className="w-20 h-20 rounded-[2rem] bg-[#1a1a3a]/30 border border-[#2a2a4a] flex items-center justify-center text-4xl shadow-2xl italic font-syne font-black text-[#00ff87]">JH</div>
          <div className="space-y-2 px-8">
            <h4 className="font-syne font-black text-2xl text-white tracking-tight">Tailored Cover Letter</h4>
            <p className="text-[13px] text-[#555] max-w-[300px] leading-relaxed mx-auto font-medium">Let AI craft a perfect pitch based on your profile and this specific job.</p>
          </div>
          <button onClick={handleGenerate}
            className="group relative bg-[#00ff87] text-[#0a0a1a] px-10 py-4 rounded-xl font-black font-mono text-[10px] tracking-[2px] uppercase hover:brightness-110 transition-all shadow-[0_15px_30px_rgba(0,255,135,0.2)] active:scale-95 overflow-hidden"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
              ⚡ Generate Now
          </button>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-10 animate-in fade-in duration-700">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-[4px] border-[#00ff8710] border-t-[#00ff87] animate-spin duration-[1.5s] shadow-[0_0_40px_rgba(0,255,135,0.1)]" />
            <div className="absolute inset-0 w-28 h-28 rounded-full border-[4px] border-transparent border-b-[#00d4ff] animate-spin-reverse duration-[2s]" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 bg-white/[0.03] rounded-2xl backdrop-blur-md border border-white/10 flex items-center justify-center font-syne font-black text-[#00ff87] text-xl animate-pulse">JH</div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-syne font-black text-3xl text-white tracking-tighter">
              Crafting <span className="text-[#00ff87] animate-pulse">your story</span>...
            </h4>
            <div className="flex flex-col gap-2">
                <p className="text-[10px] text-[#555] font-mono uppercase tracking-[4px] font-black">Analyzing nuances & matching impact</p>
                <div className="flex justify-center gap-1">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-[#00ff87] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}

      {coverLetter && !generating && (
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[4px] uppercase">AI-Generated Pitch</h4>
            <div className="flex gap-3">
              <button onClick={handleCopy}
                className={`px-6 py-3 rounded-xl font-mono text-[9px] font-black uppercase transition-all duration-500 flex items-center gap-2 shadow-xl active:scale-95
                  ${copied ? 'bg-[#00ff87]/10 border border-[#00ff87]/40 text-[#00ff87] scale-105' : 'bg-[#12122a] border-premium text-[#666] hover:text-white hover:border-white/20'}`}
              >{copied ? 'Copied!' : 'Copy Pitch'}</button>
              <button onClick={handleGenerate}
                className="px-6 py-3 rounded-xl bg-[#12122a] border-premium text-[#666] font-mono text-[9px] font-black uppercase hover:text-white hover:border-white/20 transition-all duration-500 shadow-xl active:scale-95"
              >Regenerate</button>
            </div>
          </div>

          <div className="relative group/editor">
            <div className="p-10 md:p-16 rounded-[3.5rem] bg-[#0d0d20]/60 border-premium shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative overflow-hidden group selection:bg-[#00ff8720] selection:text-[#00ff87] backdrop-blur-2xl">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#0d0d20]/40 to-transparent pointer-events-none z-20" />
              <textarea
                value={coverLetter}
                onChange={(e) => onUpdateContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[17px] md:text-[19px] leading-[1.9] text-white/85 font-serif italic tracking-normal resize-none h-[500px] relative z-10 scrollbar-hide custom-cursor-green"
                spellCheck="false"
                placeholder="Draft your story here..."
              />
              <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0d0d20]/40 to-transparent pointer-events-none z-20" />
            </div>

            {saving && (
              <div className="absolute top-4 right-8 flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                <span className="text-[8px] font-mono font-black text-[#00ff87] uppercase tracking-widest">Saving...</span>
              </div>
            )}
            {saved && !saving && (
              <div className="absolute top-4 right-8 flex items-center gap-2 bg-[#00ff87]/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#00ff87]/20">
                <span className="text-[8px] font-mono font-black text-[#00ff87] uppercase tracking-widest">✓ Draft Saved</span>
              </div>
            )}
          </div>

          {job.status === 'interviewing' && job.cover_letter_id && (
            <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
              <h4 className="text-[9px] text-[#555] tracking-[4px] uppercase font-mono text-center font-black relative z-10">Performance Feedback</h4>
              <div className="flex gap-3 relative z-10">
                {[
                  { value: 'interviewed', label: 'Interviewed', color: 'text-[#00ff87]', bg: 'bg-[#00ff87]/5', border: 'border-[#00ff87]/10' },
                  { value: 'rejected', label: 'Rejected', color: 'text-[#ff6b6b]', bg: 'bg-[#ff6b6b]/5', border: 'border-[#ff6b6b]/10' },
                  { value: 'no_response', label: 'Ghosted', color: 'text-[#555]', bg: 'bg-white/5', border: 'border-white/5' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => onCoverLetterOutcome(opt.value)}
                    className={`flex-1 py-4 rounded-xl cursor-pointer text-[10px] font-black ${opt.bg} border ${opt.border} ${opt.color} font-mono transition-all text-center hover:brightness-125 uppercase tracking-widest active:scale-95`}
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
