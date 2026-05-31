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
            <div key={item.label} className={"p-6 rounded-[2rem] bg-glass border-premium shadow-xl transition-all duration-500 hover:-translate-y-1 " + item.bg}>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-[3px] mb-3 font-black">{item.label}</div>
              <div className={"text-[18px] font-syne font-black uppercase tracking-tight " + item.color}>{item.value}</div>
            </div>
          ))}
        </div>

        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-2">
          Skill Alignment
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="flex flex-wrap gap-2.5 p-8 rounded-[2.5rem] bg-glass border-premium shadow-2xl">
          {job.stack?.map((skill, idx) => {
            const isMatch = userSkills.some(s => s.toLowerCase() === skill.toLowerCase())
            return (
              <div key={`${skill}-${idx}`} className={`group/skill relative text-[10px] px-4 py-2.5 rounded-xl font-mono font-black uppercase tracking-wider border transition-all duration-500 ${
                isMatch
                  ? 'bg-[#00ff87]/[0.03] border-[#00ff87]/30 text-[#00ff87] shadow-[0_0_20px_rgba(0,255,135,0.05)] hover:bg-[#00ff87]/[0.08] hover:border-[#00ff87]/50 hover:scale-105'
                  : 'bg-white/[0.01] border-white/5 text-[#444] hover:border-white/10 hover:text-[#666]'
              }`}>
                {skill}
                {isMatch && (
                  <span className="ml-2 inline-flex relative h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-40"></span>
                    <span className="text-[10px] relative">✓</span>
                  </span>
                )}
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
        <div className="p-10 rounded-[3rem] bg-glass border-premium space-y-6 relative overflow-hidden shadow-2xl group/ai transition-all duration-700 hover:border-[#00ff87]/30">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#00ff87] via-[#00d4ff] to-transparent opacity-60" />
          <div className="absolute -right-24 -top-24 w-80 h-80 bg-[#00ff87]/5 rounded-full blur-[100px] opacity-0 group-hover/ai:opacity-100 transition-opacity duration-1000" />

          <div className="flex items-center justify-between relative z-10">
            <h4 className="text-[10px] font-mono font-black text-[#00ff87] tracking-[5px] uppercase flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ff87]"></span>
              </span>
              AI Match Analysis
            </h4>
            {job.score && (
              <div className="text-[11px] font-mono font-black bg-[#00ff87]/5 text-[#00ff87] px-3 py-1 rounded-xl border border-[#00ff87]/20 shadow-[0_0_15px_rgba(0,255,135,0.1)]">
                {job.score}% FIT
              </div>
            )}
          </div>

          <p className="text-[20px] text-white leading-relaxed font-syne font-bold italic relative z-10 tracking-tight drop-shadow-sm">
            &quot;{job.score_reason}&quot;
          </p>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-3">
          Role Details
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-8 rounded-[2.5rem] bg-glass border-premium group hover:border-white/10 transition-all duration-500 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 rotate-12">
              <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center font-mono text-3xl font-black">S</div>
            </div>
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-[4px] mb-3 font-black">Seniority</div>
            <div className="text-[22px] font-black text-white capitalize font-syne tracking-tight group-hover:text-[#00ff87] transition-colors duration-500">{job.seniority || 'Mid Level'}</div>
          </div>
          <div className="p-8 rounded-[2.5rem] bg-glass border-premium group hover:border-white/10 transition-all duration-500 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 -rotate-12">
              <div className="w-16 h-16 border-4 border-white rounded-2xl flex items-center justify-center font-mono text-3xl font-black">W</div>
            </div>
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-[4px] mb-3 font-black">Work Style</div>
            <div className="text-[22px] font-black text-white capitalize font-syne tracking-tight group-hover:text-[#00d4ff] transition-colors duration-500">{job.work_style || 'Not specified'}</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-3">
          Full Description
          <div className="h-px flex-1 bg-white/[0.03]" />
        </h4>
        <div className="relative group/desc">
          <div className="bg-glass border-premium p-10 rounded-[3rem] shadow-2xl group-hover/desc:border-white/10 transition-all duration-700">
            <p className="text-[16px] leading-[2] text-white/70 whitespace-pre-wrap font-sans font-medium selection:bg-[#00ff8720] selection:text-[#00ff87]">{job.description}</p>
          </div>
          {job.url && (
            <div className="mt-8 flex justify-center">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-4 px-10 py-5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-[#666] font-mono font-black no-underline hover:bg-[#00ff87] hover:text-[#0a0a1a] hover:border-[#00ff87] transition-all duration-500 group/link uppercase tracking-[3px] shadow-2xl active:scale-95">
                Open Original Listing <span className="group-hover/link:translate-x-2 transition-transform duration-500">↗</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {job.culture_fit && (
        <div className="space-y-6">
          <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-3">
            Culture Pulse
            <div className="h-px flex-1 bg-white/[0.03]" />
          </h4>
          <div className="p-10 rounded-[3rem] bg-glass border-premium hover:border-[#7b61ff]/30 transition-all duration-700 shadow-2xl relative overflow-hidden group/culture">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7b61ff]/[0.03] to-transparent opacity-0 group-hover/culture:opacity-100 transition-opacity duration-700" />
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">
               <span className="text-4xl">✨</span>
            </div>
            <p className="text-[18px] text-white/90 leading-relaxed italic relative z-10 font-syne font-bold tracking-tight">&quot;{job.culture_fit}&quot;</p>
          </div>
        </div>
      )}

      {job.interview_prep && (
        <div className="space-y-6 pb-12">
          <h4 className="text-[10px] font-mono font-black text-[#555] tracking-[4px] uppercase flex items-center gap-3">
            Winning Strategy
            <div className="h-px flex-1 bg-white/[0.03]" />
          </h4>
          <div className="p-10 rounded-[3rem] bg-glass border-premium hover:border-[#00d4ff]/30 transition-all duration-700 shadow-2xl relative overflow-hidden group/prep">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#00d4ff]/[0.03] to-transparent opacity-0 group-hover/prep:opacity-100 transition-opacity duration-700" />
            <div className="text-[16px] text-white/80 leading-[2] whitespace-pre-wrap font-sans font-medium relative z-10">
              {job.interview_prep.split('\n').map((line, i) => (
                <div key={i} className="mb-6 last:mb-0 flex gap-5 group/line">
                    <div className="mt-3 w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_15px_#00d4ff] transition-all duration-500 group-hover/line:scale-150 group-hover/line:shadow-[0_0_25px_#00d4ff]" />
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
