import { StatusBadge } from './Badges'
import { RadialScore } from './RadialScore'
import { Job } from '@/types'

export function JobCard({
  job,
  isSelected,
  onClick,
  index
}: {
  job: Job,
  isSelected: boolean,
  onClick: () => void,
  index: number
}) {
  // Only animate the first few items to avoid excessive delay in virtualized list
  const animationDelay = index < 10 ? `${index * 50}ms` : '0ms'

  return (
    <div
      className={`p-6 border-b border-white/5 cursor-pointer transition-all duration-300 ease-out hover:bg-white/[0.03] group relative
        ${isSelected ? 'bg-white/[0.04] before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:bg-[#00ff87] before:rounded-r-full before:shadow-[0_0_15px_#00ff87]' : ''}
        animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards`}
      style={{ animationDelay, opacity: 0 }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1 mr-4">
          <div className="font-syne font-bold text-[18px] text-white/90 mb-1.5 group-hover:text-white transition-colors leading-tight tracking-tight">
            {job.title}
          </div>
          <div className="text-[10px] text-[#555] font-mono tracking-[2px] flex items-center gap-2 uppercase font-bold">
            <span className="text-[#888]">{job.company}</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span className="truncate max-w-[150px]">{job.location || 'Remote'}</span>
          </div>
        </div>
        <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
          <RadialScore score={job.score || 0} size={52} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {(job.stack || []).slice(0, 4).map(s => (
          <span key={s} className="text-[9px] px-2.5 py-1 rounded-lg bg-[#7b61ff]/10 text-[#7b61ff] font-mono font-bold tracking-tight uppercase border border-[#7b61ff]/20 transition-all group-hover:border-[#7b61ff]/40">
            {s}
          </span>
        ))}
        {(job.stack || []).length > 4 && (
          <span className="text-[9px] px-2.5 py-1 text-[#444] font-mono font-bold bg-white/5 rounded-lg border border-white/5">
            +{(job.stack || []).length - 4}
          </span>
        )}
      </div>

      <div className="flex gap-2.5 flex-wrap items-center">
        {job.seniority && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ff87]/5 border border-[#00ff87]/10 transition-colors group-hover:border-[#00ff87]/20">
             <span className="text-[9px] text-[#00ff87] font-mono font-bold uppercase tracking-[1.5px]">
               {job.seniority}
             </span>
          </div>
        )}
        {job.work_style && job.work_style !== 'unspecified' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00d4ff]/5 border border-[#00d4ff]/10 transition-colors group-hover:border-[#00d4ff]/20">
            <span className="text-[9px] text-[#00d4ff] font-mono font-bold uppercase tracking-[1.5px]">
              {job.work_style}
            </span>
          </div>
        )}
        {job.stack_overlap !== null && job.stack_overlap !== undefined && job.stack_overlap > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ffd60a]/5 border border-[#ffd60a]/10 transition-colors group-hover:border-[#ffd60a]/20">
            <span className="text-[10px] text-[#ffd60a] font-mono font-bold uppercase tracking-[1.5px]">
              {job.stack_overlap}% Match
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 pt-5 border-t border-white/5">
        {job.score_reason && (
          <div className="text-[11px] text-[#555] font-medium italic flex-1 mr-4 line-clamp-1 group-hover:text-[#999] transition-colors leading-relaxed">
            &quot;{job.score_reason}&quot;
          </div>
        )}
        <div className="shrink-0 transform transition-transform group-hover:translate-x-1">
          <StatusBadge status={job.status || 'pending'} />
        </div>
      </div>
    </div>
  )
}
