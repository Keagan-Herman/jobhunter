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
            { label: 'Level', value: job.seniority || 'Professional', color: 'text-[#1a1a1a]', icon: 'S', description: 'Experience Calibration' },
            { label: 'Environment', value: job.work_style || 'Remote', color: 'text-[#2b6777]', icon: 'W', description: 'Spatial Alignment' },
            { label: 'Compatibility', value: `${job.stack_overlap || 0}%`, color: 'text-[#c5a059]', icon: 'C', description: 'Technical Overlap' }
          ].map(item => (
            <div key={item.label} className="p-8 bg-white border border-[#e2e2d9] transition-all duration-500 hover:border-[#c5a059] tactile-pop relative group overflow-hidden hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-[#e2e2d9] group-hover:bg-[#c5a059] transition-colors" />
              <div className="absolute top-4 right-4 text-[10px] font-mono text-[#e2e2d9] group-hover:text-[#c5a059] transition-colors">{item.icon}</div>
              <div className="text-[10px] font-mono text-[#888] uppercase tracking-[3px] mb-4 font-bold">{item.label}</div>
              <div className={"text-[26px] font-syne font-bold uppercase tracking-tight mb-2 " + item.color}>{item.value}</div>
              <div className="text-[9px] font-mono text-[#aaa] uppercase tracking-widest">{item.description}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-[10px] font-mono font-bold text-[#888] tracking-[4px] uppercase flex items-center gap-4">
              Matched Competencies
              <div className="h-px flex-1 bg-[#e2e2d9]" />
            </h4>
            <div className="flex flex-wrap gap-2.5 p-8 bg-white border border-[#e2e2d9] shadow-sm tactile-inset min-h-[120px]">
              {job.stack?.filter(s => userSkills.some(us => us.toLowerCase() === s.toLowerCase())).map((skill, idx) => (
                <div key={`${skill}-${idx}`} className="text-[10px] px-4 py-2 font-mono font-bold uppercase tracking-wider border bg-[#2b6777]/5 border-[#2b6777] text-[#2b6777] flex items-center gap-3 transition-all hover:bg-white">
                  <div className="w-1.5 h-1.5 bg-[#2b6777] rotate-45" />
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
            <div className="flex flex-wrap gap-2.5 p-8 bg-white border border-[#e2e2d9] shadow-sm min-h-[120px]">
              {job.stack?.filter(s => !userSkills.some(us => us.toLowerCase() === s.toLowerCase())).map((skill, idx) => (
                <div key={`${skill}-${idx}`} className="text-[10px] px-4 py-2 font-mono font-bold uppercase tracking-wider border bg-[#f0f0eb] border-[#d1d1ca] text-[#888] transition-all hover:bg-[#f8f8f4]">
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
        <div className="p-12 bg-[#f0f0eb] border-l-8 border-[#c5a059] space-y-8 relative overflow-hidden tactile-pop">
          <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
            <h4 className="text-[11px] font-mono font-bold text-[#1a1a1a] tracking-[5px] uppercase">
              Evaluation Summary
            </h4>
            {job.score && (
              <div className="text-[11px] font-mono font-bold bg-[#1a1a1a] text-[#f8f8f4] px-5 py-2 uppercase tracking-widest">
                {job.score}% Rank
              </div>
            )}
          </div>

          <p className="text-[24px] text-[#1a1a1a] leading-relaxed font-syne font-bold italic relative z-10 tracking-tight">
            &quot;{job.score_reason}&quot;
          </p>

          <div className="pt-6 flex items-center gap-4 relative z-10">
              <div className="h-px w-10 bg-[#c5a059]" />
              <span className="text-[9px] font-mono font-bold text-[#888] uppercase tracking-[4px]">System Verified</span>
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
