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
      className={`p-5 px-6 border-b border-[#1a1a32]/50 cursor-pointer transition-all duration-300 ease-out hover:bg-[#111128] group relative
        ${isSelected ? 'bg-[#111128] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#00ff87] before:rounded-r-full before:shadow-[0_0_15px_#00ff87]' : ''}
        animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-forwards`}
      style={{ animationDelay: `${index * 40}ms`, opacity: 0 }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-4">
          <div className="font-syne font-bold text-[17px] text-[#e0e0f0] mb-1 group-hover:text-white transition-colors leading-tight">
            {job.title}
          </div>
          <div className="text-[11px] text-[#666] font-mono tracking-widest flex items-center gap-2 uppercase font-semibold">
            <span className="text-[#999]">{job.company}</span>
            <span className="w-1 h-1 rounded-full bg-[#1e1e38]" />
            <span>{job.location || 'Unknown'}</span>
          </div>
        </div>
        <RadialScore score={job.score || 0} />
      </div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {(job.stack || []).slice(0, 5).map(s => (
          <span key={s} className="text-[9px] px-2 py-0.5 rounded-md bg-[#1a1a3a]/50 text-[#7b61ff] font-mono font-bold tracking-tight uppercase border border-[#2a2a4a]/50 transition-colors group-hover:border-[#7b61ff30]">
            {s}
          </span>
        ))}
        {(job.stack || []).length > 5 && (
          <span className="text-[9px] px-2 py-0.5 text-[#444] font-mono font-bold">
            +{(job.stack || []).length - 5} MORE
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {job.seniority && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00ff8708] border border-[#00ff8715]">
             <span className="text-[9px] text-[#00ff87] font-mono font-bold uppercase tracking-wider">
               {job.seniority}
             </span>
          </div>
        )}
        {job.work_style && job.work_style !== 'unspecified' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00d4ff08] border border-[#00d4ff15]">
            <span className="text-[9px] text-[#00d4ff] font-mono font-bold uppercase tracking-wider">
              {job.work_style}
            </span>
          </div>
        )}
        {job.stack_overlap !== null && job.stack_overlap !== undefined && job.stack_overlap > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffd60a08] border border-[#ffd60a15]">
            <span className="text-[9px] text-[#ffd60a] font-mono font-bold uppercase tracking-wider">
              {job.stack_overlap}% MATCH
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-5 pt-4 border-t border-[#1a1a32]/30">
        {job.score_reason && (
          <div className="text-[11px] text-[#555] font-medium italic flex-1 mr-4 line-clamp-1 group-hover:text-[#888] transition-colors">
            &quot;{job.score_reason}&quot;
          </div>
        )}
        <StatusBadge status={job.status || 'pending'} />
      </div>
    </div>
  )
}
