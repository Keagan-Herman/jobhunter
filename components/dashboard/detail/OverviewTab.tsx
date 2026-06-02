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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Seniority', value: job.seniority || 'Mid', color: 'text-[#00ff87]', bg: 'bg-[#00ff87]/5', icon: '👤' },
            { label: 'Work Style', value: job.work_style || 'Remote', color: 'text-[#00d4ff]', bg: 'bg-[#00d4ff]/5', icon: '🏠' },
            { label: 'Stack Match', value: `${job.stack_overlap || 0}%`, color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a]/5', icon: '⚡' }
          ].map(item => (
            <div key={item.label} className={"p-4 md:p-5 rounded-2xl bg-glass border-premium shadow-xl transition-all duration-500 hover:-translate-y-1 group/matrix relative overflow-hidden hover:border-white/20 " + item.bg}>
              <div className="absolute top-2 right-4 text-[9px] opacity-20 group-hover/matrix:opacity-100 transition-opacity duration-500">{item.icon}</div>
              <div className="text-[8px] font-mono text-[#555] uppercase tracking-[2px] mb-2 font-black">{item.label}</div>
              <div className={"text-[14px] md:text-[16px] font-syne font-black uppercase tracking-tight " + item.color}>{item.value}</div>
            </div>
          ))}
        </div>

        <h4 className="text-[9px] font-mono font-black text-[#444] tracking-[3px] uppercase flex items-center gap-2">
          Skill Alignment
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="flex flex-wrap gap-2 p-5 md:p-6 rounded-3xl bg-glass border-premium shadow-2xl">
          {job.stack?.map((skill, idx) => {
            const isMatch = userSkills.some(s => s.toLowerCase() === skill.toLowerCase())
            return (
              <div key={`${skill}-${idx}`} className={`group/skill relative text-[9px] px-3.5 py-2 rounded-lg font-mono font-black uppercase tracking-wider border transition-all duration-500 ${
                isMatch
                  ? 'bg-[#00ff87]/[0.03] border-[#00ff87]/30 text-[#00ff87] shadow-[0_0_20px_rgba(0,255,135,0.05)] hover:bg-[#00ff87]/[0.08] hover:border-[#00ff87]/50 hover:scale-105'
                  : 'bg-white/[0.01] border-white/5 text-[#444] hover:border-white/10 hover:text-[#666]'
              }`}>
                {skill}
                {isMatch && (
                  <span className="ml-2 inline-flex relative h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-40"></span>
                    <span className="text-[9px] relative">✓</span>
                  </span>
                )}
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
        <div className="p-5 md:p-8 rounded-3xl bg-glass border-premium space-y-4 relative overflow-hidden shadow-2xl group/ai transition-all duration-700 hover:border-[#00ff87]/30">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#00ff87] via-[#00d4ff] to-transparent opacity-60" />

          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <h4 className="text-[9px] font-mono font-black text-[#00ff87] tracking-[4px] uppercase flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff87]"></span>
              </span>
              AI Match Analysis
            </h4>
            {job.score && (
              <div className="text-[10px] font-mono font-black bg-[#00ff87]/5 text-[#00ff87] px-2.5 py-1 rounded-lg border border-[#00ff87]/20 shadow-[0_0_15px_rgba(0,255,135,0.1)]">
                {job.score}% FIT
              </div>
            )}
          </div>

          <p className="text-[16px] md:text-[18px] text-white leading-relaxed font-syne font-bold italic relative z-10 tracking-tight drop-shadow-sm">
            &quot;{job.score_reason}&quot;
          </p>
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
