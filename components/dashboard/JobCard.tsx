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
  return (
    <div
      className={`p-4 px-5 border-b border-[#0f0f22] cursor-pointer transition-all duration-200 ease-in-out hover:bg-[#111128] group
        ${isSelected ? 'bg-[#111128] border-l-4 border-l-[#00ff87]' : 'border-l-4 border-l-transparent'}
        animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards`}
      style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex-1 mr-4">
          <div className="font-syne font-bold text-base text-[#e0e0f0] mb-1 group-hover:text-white transition-colors">
            {job.title}
          </div>
          <div className="text-[11px] text-[#555] font-mono tracking-wider flex items-center gap-2">
            <span className="text-[#888]">{job.company}</span>
            <span className="w-1 h-1 rounded-full bg-[#1e1e38]" />
            <span>{job.location || 'Unknown'}</span>
          </div>
        </div>
        <RadialScore score={job.score || 0} />
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        {(job.stack || []).slice(0, 4).map(s => (
          <span key={s} className="text-[9px] px-2 py-0.5 rounded-md bg-[#1a1a3a] text-[#7b61ff] font-mono font-semibold tracking-tighter uppercase border border-[#2a2a4a]">
            {s}
          </span>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {job.seniority && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1a2a1a] border border-[#00ff8720]">
             <span className="text-[9px] text-[#00ff87] font-mono font-bold uppercase tracking-widest">
               {job.seniority}
             </span>
          </div>
        )}
        {job.work_style && job.work_style !== 'unspecified' && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1a1a2a] border border-[#00d4ff20]">
            <span className="text-[9px] text-[#00d4ff] font-mono font-bold uppercase tracking-widest">
              {job.work_style}
            </span>
          </div>
        )}
        {job.stack_overlap !== null && job.stack_overlap !== undefined && job.stack_overlap > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2a1a1a] border border-[#ffd60a20]">
            <span className="text-[9px] text-[#ffd60a] font-mono font-bold uppercase tracking-widest">
              {job.stack_overlap}% MATCH
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#0f0f22]/50">
        {job.score_reason && (
          <div className="text-[10px] text-[#444] font-medium italic flex-1 mr-4 line-clamp-1 group-hover:text-[#666] transition-colors">
            &quot;{job.score_reason}&quot;
          </div>
        )}
        <StatusBadge status={job.status || 'pending'} />
      </div>
    </div>
  )
}
