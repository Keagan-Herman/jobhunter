import { Job } from '@/types'

export function OverviewTab({
  job,
  userSkills
}: {
  job: Job
  userSkills: string[]
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards">
      <div className="space-y-4">
        <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-2">
          Alignment Matrix
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Seniority', value: job.seniority || 'Mid', color: 'text-[#00ff87]', glow: 'shadow-[0_0_20px_rgba(0,255,135,0.1)]', icon: '👤' },
            { label: 'Work Style', value: job.work_style || 'Remote', color: 'text-[#00d4ff]', glow: 'shadow-[0_0_20px_rgba(0,212,255,0.1)]', icon: '🏠' },
            { label: 'Stack Match', value: `${job.stack_overlap || 0}%`, color: 'text-[#ffd60a]', glow: 'shadow-[0_0_20px_rgba(255,214,10,0.1)]', icon: '⚡' }
          ].map(item => (
            <div key={item.label} className={"p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 transition-all duration-700 hover:-translate-y-2 group/matrix relative overflow-hidden hover:border-white/10 hover:bg-white/[0.04] " + item.glow}>
              <div className="absolute -right-2 -top-2 text-4xl opacity-[0.03] group-hover/matrix:opacity-10 group-hover/matrix:scale-125 transition-all duration-700 group-hover/matrix:rotate-12">{item.icon}</div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-[3px] mb-3 font-black group-hover:text-[#888] transition-colors">{item.label}</div>
              <div className={"text-[18px] md:text-[22px] font-syne font-black uppercase tracking-tight " + item.color}>{item.value}</div>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-white/10 group-hover/matrix:w-full transition-all duration-1000" />
            </div>
          ))}
        </div>

        <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-2">
          Skill Alignment
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="flex flex-wrap gap-2.5 p-6 md:p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 shadow-2xl group/skills relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover/skills:opacity-100 transition-opacity duration-1000" />
          {job.stack?.map((skill, idx) => {
            const isMatch = userSkills.some(s => s.toLowerCase() === skill.toLowerCase())
            return (
              <div key={`${skill}-${idx}`} className={`group/skill relative text-[9px] px-4 py-2.5 rounded-xl font-mono font-black uppercase tracking-wider border transition-all duration-500 flex items-center gap-2 ${
                isMatch
                  ? 'bg-[#00ff87]/[0.05] border-[#00ff87]/20 text-[#00ff87] shadow-[0_0_20px_rgba(0,255,135,0.05)] hover:bg-[#00ff87]/[0.1] hover:border-[#00ff87]/40 hover:scale-105 active:scale-95'
                  : 'bg-white/[0.02] border-white/5 text-[#555] hover:border-white/10 hover:text-[#888] hover:bg-white/[0.04]'
              }`}>
                {isMatch ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-40"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff87]"></span>
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/5" />
                )}
                {skill}
              </div>
            )
          })}
          {(!job.stack || job.stack.length === 0) && (
            <span className="text-[10px] text-[#444] font-mono italic px-2">No specific stack identified</span>
          )}
        </div>
      </div>

      {/* AI Fit Analysis */}
      {job.score_reason && (
        <div className="p-8 md:p-12 rounded-[3rem] bg-glass border-premium space-y-6 relative overflow-hidden shadow-2xl group/ai transition-all duration-700 hover:border-[#00ff87]/30">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#00ff87] via-[#00d4ff] to-[#7b61ff] opacity-40" />
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#00ff87]/5 rounded-full blur-[100px] group-hover/ai:bg-[#00ff87]/10 transition-colors duration-1000" />

          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <h4 className="text-[10px] font-mono font-black text-[#00ff87] tracking-[5px] uppercase flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ff87] shadow-[0_0_10px_#00ff87]"></span>
              </span>
              Intelligence Report
            </h4>
            {job.score && (
              <div className="text-[11px] font-mono font-black bg-[#00ff87]/10 text-[#00ff87] px-4 py-1.5 rounded-full border border-[#00ff87]/30 shadow-[0_0_20px_rgba(0,255,135,0.1)] uppercase tracking-widest">
                {job.score}% Alignment
              </div>
            )}
          </div>

          <p className="text-[18px] md:text-[22px] text-white leading-[1.4] font-syne font-extrabold italic relative z-10 tracking-tight drop-shadow-2xl">
            &quot;{job.score_reason}&quot;
          </p>

          <div className="pt-4 flex items-center gap-3 relative z-10">
              <div className="h-px w-8 bg-[#00ff87]/30" />
              <span className="text-[8px] font-mono font-black text-[#555] uppercase tracking-[3px]">Verified Match</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-3">
          Full Description
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="relative group/desc">
          <div className="bg-glass border-premium p-6 md:p-8 rounded-3xl shadow-2xl group-hover/desc:border-white/10 transition-all duration-700">
            <p className="text-[13px] md:text-[15px] leading-[1.8] text-white/70 whitespace-pre-wrap font-sans font-medium selection:bg-[#00ff8720] selection:text-[#00ff87]">{job.description}</p>
          </div>
          {job.url && (
            <div className="mt-6 flex justify-center">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-[#555] font-mono font-black no-underline hover:bg-[#00ff87] hover:text-[#0a0a1a] hover:border-[#00ff87] transition-all duration-500 group/link uppercase tracking-[2px] shadow-2xl active:scale-95">
                Open Listing <span className="group-hover/link:translate-x-1 transition-transform duration-500">↗</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {job.culture_fit && (
        <div className="space-y-4">
          <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-3">
            Culture Pulse
            <div className="h-px flex-1 bg-white/[0.03]" />
          </h4>
          <div className="p-5 md:p-8 rounded-3xl bg-glass border-premium hover:border-[#7b61ff]/30 transition-all duration-700 shadow-2xl relative overflow-hidden group/culture">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7b61ff]/[0.03] to-transparent opacity-0 group-hover/culture:opacity-100 transition-opacity duration-700" />
            <p className="text-[14px] md:text-[16px] text-white/90 leading-relaxed italic relative z-10 font-syne font-bold tracking-tight">&quot;{job.culture_fit}&quot;</p>
          </div>
        </div>
      )}

      {job.interview_prep && (
        <div className="space-y-4 pb-8">
          <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-3">
            Winning Strategy
            <div className="h-px flex-1 bg-white/[0.03]" />
          </h4>
          <div className="p-5 md:p-8 rounded-3xl bg-glass border-premium hover:border-[#00d4ff]/30 transition-all duration-700 shadow-2xl relative overflow-hidden group/prep">
            <div className="text-[13px] md:text-[15px] text-white/80 leading-[1.8] whitespace-pre-wrap font-sans font-medium relative z-10">
              {job.interview_prep.split('\n').map((line, i) => (
                <div key={i} className="mb-3 last:mb-0 flex gap-3 group/line">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_10px_#00d4ff] shrink-0" />
                    <span className="flex-1 group-hover/line:text-white transition-colors duration-300">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
