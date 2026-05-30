import { Job } from '@/types'

export function OverviewTab({
  job,
  userSkills
}: {
  job: Job
  userSkills: string[]
}) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
      <div className="space-y-5">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-2">
          Alignment Matrix
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Seniority', value: job.seniority || 'Mid', color: 'text-[#00ff87]', bg: 'bg-[#00ff87]/5' },
            { label: 'Work Style', value: job.work_style || 'Remote', color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/5' },
            { label: 'Stack Match', value: `${job.stack_overlap || 0}%`, color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a]/5' }
          ].map(item => (
            <div key={item.label} className={"p-5 rounded-2xl border border-white/5 " + item.bg}>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-[2px] mb-2 font-bold">{item.label}</div>
              <div className={"text-[15px] font-syne font-black uppercase tracking-tight " + item.color}>{item.value}</div>
            </div>
          ))}
        </div>

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
}
