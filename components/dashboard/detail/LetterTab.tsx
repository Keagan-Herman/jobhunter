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
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-12">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-[6px] border-[#00ff8710] border-t-[#00ff87] animate-spin duration-[1.5s]" />
            <div className="absolute inset-0 w-32 h-32 rounded-full border-[6px] border-transparent border-b-[#00d4ff] animate-spin-reverse duration-[2s]" />
            <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse font-syne font-black text-[#00ff87] drop-shadow-[0_0_15px_rgba(0,255,135,0.5)]">JH</div>
          </div>
          <div className="space-y-6">
            <h4 className="font-syne font-black text-4xl text-white tracking-tighter">
              Crafting <span className="text-[#00ff87] animate-pulse">your story</span>...
            </h4>
            <p className="text-[11px] text-[#555] font-mono uppercase tracking-[6px] font-black animate-in fade-in slide-in-from-bottom-2 duration-1000">Analyzing nuances & matching impact</p>
          </div>
        </div>
      )}

      {coverLetter && !generating && (
        <div className="space-y-12">
          <div className="flex items-center justify-between px-4">
            <h4 className="text-[10px] font-mono font-black text-[#444] tracking-[5px] uppercase">AI-Generated Pitch</h4>
            <div className="flex gap-5">
              <button onClick={handleCopy}
                className={`px-8 py-4 rounded-2xl font-mono text-[10px] font-black uppercase transition-all duration-500 flex items-center gap-3 shadow-2xl active:scale-95
                  ${copied ? 'bg-[#00ff87]/10 border border-[#00ff87]/40 text-[#00ff87] scale-105' : 'bg-[#12122a] border-premium text-[#777] hover:text-white hover:border-white/20'}`}
              >{copied ? 'Copied to Clipboard' : 'Copy Pitch'}</button>
              <button onClick={handleGenerate}
                className="px-8 py-4 rounded-2xl bg-[#12122a] border-premium text-[#777] font-mono text-[10px] font-black uppercase hover:text-white hover:border-white/20 transition-all duration-500 shadow-2xl active:scale-95"
              >Regenerate</button>
            </div>
          </div>

          <div className="relative group/editor">
            <div className="p-16 md:p-20 rounded-[4rem] bg-glass border-premium shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group selection:bg-[#00ff8720] selection:text-[#00ff87]">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

              <textarea
                value={coverLetter}
                onChange={(e) => onUpdateContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[19px] leading-[2.1] text-white/80 font-serif italic tracking-tight resize-none h-[600px] relative z-10 scrollbar-hide"
                spellCheck="false"
              />
            </div>

            {saving && (
              <div className="absolute top-6 right-10 flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 animate-in fade-in duration-300">
                <div className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse" />
                <span className="text-[9px] font-mono font-black text-[#00ff87] uppercase tracking-widest">Saving...</span>
              </div>
            )}
            {saved && !saving && (
              <div className="absolute top-6 right-10 flex items-center gap-2 bg-[#00ff87]/10 backdrop-blur-md px-4 py-2 rounded-full border border-[#00ff87]/20 animate-in fade-in zoom-in duration-500">
                <span className="text-[9px] font-mono font-black text-[#00ff87] uppercase tracking-widest">✓ Draft Saved</span>
              </div>
            )}
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
}
