import { Job } from '@/types'

export function OverviewTab({
  job,
  userSkills
}: {
  job: Job
  userSkills: string[]
}) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards">
      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
          Metric Alignment
          <div className="h-px flex-1 bg-[#e2e2d9]" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Level', value: job.seniority || 'Professional', color: 'text-[#1a1a1a]', icon: 'S' },
            { label: 'Environment', value: job.work_style || 'Remote', color: 'text-[#2b6777]', icon: 'W' },
            { label: 'Compatibility', value: `${job.stack_overlap || 0}%`, color: 'text-[#c5a059]', icon: 'C' }
          ].map(item => (
            <div key={item.label} className="p-8 bg-white border border-[#e2e2d9] transition-all duration-500 hover:border-[#c5a059] tactile-pop relative group">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-[#e2e2d9] group-hover:text-[#c5a059] transition-colors">{item.icon}</div>
              <div className="text-[10px] font-mono text-[#888] uppercase tracking-[3px] mb-4 font-bold">{item.label}</div>
              <div className={"text-[24px] font-syne font-bold uppercase tracking-tight " + item.color}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
              Matched Competencies
              <div className="h-px flex-1 bg-[#e2e2d9]" />
            </h4>
            <div className="flex flex-wrap gap-2 p-6 bg-white border border-[#e2e2d9] shadow-sm tactile-inset min-h-[100px]">
              {job.stack?.filter(s => userSkills.some(us => us.toLowerCase() === s.toLowerCase())).map((skill, idx) => (
                <div key={`${skill}-${idx}`} className="text-[10px] px-3 py-1.5 font-mono font-bold uppercase tracking-wider border bg-[#2b6777]/5 border-[#2b6777] text-[#2b6777] flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#2b6777]" />
                  {skill}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
              Skill Gaps
              <div className="h-px flex-1 bg-[#e2e2d9]" />
            </h4>
            <div className="flex flex-wrap gap-2 p-6 bg-white border border-[#e2e2d9] shadow-sm min-h-[100px]">
              {job.stack?.filter(s => !userSkills.some(us => us.toLowerCase() === s.toLowerCase())).map((skill, idx) => (
                <div key={`${skill}-${idx}`} className="text-[10px] px-3 py-1.5 font-mono font-bold uppercase tracking-wider border bg-[#f0f0eb] border-[#d1d1ca] text-[#888]">
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Fit */}
      {job.culture_fit && (
        <div className="space-y-6">
          <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
            Cultural Resonance
            <div className="h-px flex-1 bg-[#e2e2d9]" />
          </h4>
          <div className="p-10 bg-white border border-[#e2e2d9] shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-syne font-black text-6xl select-none text-[#c5a059]">FIT</div>
            <p className="text-[16px] leading-[1.7] text-[#4a4a4a] font-sans font-medium relative z-10 italic">
              &quot;{job.culture_fit}&quot;
            </p>
          </div>
        </div>
      )}

      {/* Analysis Report */}
      {job.score_reason && (
        <div className="p-12 bg-[#f0f0eb] border border-[#e2e2d9] border-l-[12px] border-l-[#c5a059] space-y-8 relative overflow-hidden tactile-pop group">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] font-syne font-black text-9xl select-none pointer-events-none text-[#1a1a1a] group-hover:scale-110 transition-transform duration-1000">
            {job.score}%
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
            <h4 className="text-[11px] font-mono font-bold text-[#1a1a1a] tracking-[5px] uppercase flex items-center gap-3">
              <div className="w-2 h-2 bg-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.5)]" />
              Evaluation Summary
            </h4>
            {job.score && (
              <div className="text-[12px] font-mono font-bold bg-[#1a1a1a] text-[#f8f8f4] px-6 py-3 uppercase tracking-[3px] shadow-lg">
                Match Index: {job.score}%
              </div>
            )}
          </div>

          <div className="relative z-10">
             <div className="absolute -left-6 top-0 text-4xl text-[#c5a059] opacity-20 font-serif leading-none">"</div>
             <p className="text-[26px] md:text-[32px] text-[#1a1a1a] leading-[1.1] font-syne font-bold italic tracking-tight">
               {job.score_reason}
             </p>
          </div>

          <div className="pt-8 flex items-center gap-6 relative z-10">
              <div className="h-px w-16 bg-[#c5a059]/40" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-[#888] uppercase tracking-[4px]">Verified AI Analysis</span>
                <div className="w-1.5 h-1.5 bg-[#e2e2d9] rounded-full" />
                <span className="text-[9px] font-mono text-[#ccc] uppercase tracking-[2px]">Engine v4.2</span>
              </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
          Specification
          <div className="h-px flex-1 bg-[#e2e2d9]" />
        </h4>
        <div className="bg-white border border-[#e2e2d9] p-10 shadow-sm">
          <p className="text-[15px] leading-[1.8] text-[#4a4a4a] whitespace-pre-wrap font-sans font-medium">{job.description}</p>
        </div>
      </div>

      {job.interview_prep && (
        <div className="space-y-6 pb-12">
          <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
            Interview Strategy
            <div className="h-px flex-1 bg-[#e2e2d9]" />
          </h4>
          <div className="p-10 bg-[#f8f8f4] border border-[#e2e2d9] shadow-sm">
            <div className="text-[15px] text-[#4a4a4a] leading-[1.8] whitespace-pre-wrap font-sans font-medium">
              {job.interview_prep.split('\n').map((line, i) => (
                <div key={i} className="mb-4 last:mb-0 flex gap-4">
                    <div className="mt-2 w-1.5 h-1.5 bg-[#bc243c]" />
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
