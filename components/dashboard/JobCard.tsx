import { ScoreBadge, StatusBadge } from './Badges'
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
      className={`p-3.5 px-4 border-b border-[#0f0f22] cursor-pointer transition-all duration-150 ease-in-out hover:bg-[#111128]
        ${isSelected ? 'bg-[#111128] border-l-3 border-l-[#00ff87]' : 'border-l-3 border-l-transparent'}
        animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards`}
      style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex-1 mr-2.5">
          <div className="font-semibold text-sm text-[#e0e0f0] mb-0.5">{job.title}</div>
          <div className="text-xs text-[#555]">{job.company} · {job.location || 'Unknown'}</div>
        </div>
        <ScoreBadge score={job.score || 0} />
      </div>

      <div className="flex gap-1.5 flex-wrap mt-2">
        {(job.stack || []).slice(0, 3).map(s => (
          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a3a] text-[#7b61ff] font-mono">
            {s}
          </span>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap mt-1.5">
        {job.seniority && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a2a1a] text-[#00ff87] font-mono">
            {job.seniority}
          </span>
        )}
        {job.work_style && job.work_style !== 'unspecified' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a2a] text-[#00d4ff] font-mono">
            {job.work_style}
          </span>
        )}
        {job.stack_overlap !== null && job.stack_overlap !== undefined && job.stack_overlap > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a1a1a] text-[#ffd60a] font-mono">
            {job.stack_overlap}% match
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mt-2">
        {job.score_reason && (
          <div className="text-[11px] text-[#444] italic flex-1 mr-2 line-clamp-1">
            {job.score_reason}
          </div>
        )}
        <StatusBadge status={job.status || 'pending'} />
      </div>
    </div>
  )
}
