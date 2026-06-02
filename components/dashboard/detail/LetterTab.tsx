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
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-[4px] border-[#00ff8710] border-t-[#00ff87] animate-spin duration-[1.5s]" />
            <div className="absolute inset-0 w-24 h-24 rounded-full border-[4px] border-transparent border-b-[#00d4ff] animate-spin-reverse duration-[2s]" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-syne font-black text-[#00ff87]">JH</div>
          </div>
          <div className="space-y-4">
            <h4 className="font-syne font-black text-3xl text-white tracking-tighter">
              Crafting <span className="text-[#00ff87] animate-pulse">your story</span>...
            </h4>
            <p className="text-[10px] text-[#555] font-mono uppercase tracking-[4px] font-black">Analyzing nuances & matching impact</p>
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
            <div className="p-10 md:p-14 rounded-[3rem] bg-glass border-premium shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group selection:bg-[#00ff8720] selection:text-[#00ff87]">
              <textarea
                value={coverLetter}
                onChange={(e) => onUpdateContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[16px] md:text-[17px] leading-[1.8] text-white/80 font-serif italic tracking-tight resize-none h-[450px] relative z-10 scrollbar-hide"
                spellCheck="false"
              />
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
