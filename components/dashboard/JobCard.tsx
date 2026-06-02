import React from 'react'
import { StatusBadge } from './Badges'
import { RadialScore } from './RadialScore'
import { Job } from '@/types'

function JobCardComponent({
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
      className={`p-6 border-b border-white/5 cursor-pointer transition-all duration-500 ease-out hover:bg-white/[0.04] group relative overflow-hidden
        ${isSelected ? 'bg-white/[0.06] before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1.5 before:bg-[#00ff87] before:rounded-r-full before:shadow-[0_0_20px_#00ff87]' : ''}
        hover:border-white/10 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards`}
      style={{ animationDelay, opacity: 0 }}
      onClick={onClick}
    >
      {/* Hover Light Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00ff87]/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex-1 mr-4 overflow-hidden">
          <div className="font-syne font-extrabold text-[20px] text-white/95 mb-1.5 group-hover:text-white transition-all duration-500 leading-tight tracking-tight group-hover:translate-x-1 truncate">
            {job.title}
          </div>
          <div className="text-[10px] text-[#666] font-mono tracking-[2.5px] flex items-center gap-2 uppercase font-black">
            <span className="text-[#999] group-hover:text-[#aaa] transition-colors truncate max-w-[120px]">{job.company}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />
            <span className="truncate max-w-[150px] text-[#777]">{job.location || 'Remote'}</span>
          </div>
        </div>
        <div className="shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-[0_0_15px_rgba(0,255,135,0.2)]">
          <RadialScore score={job.score || 0} size={54} />
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap mb-6 relative z-10">
        {(job.stack || []).slice(0, 4).map(s => (
          <span key={s} className="text-[9px] px-3 py-1.5 rounded-xl bg-[#7b61ff]/5 text-[#7b61ff] font-mono font-black tracking-tight uppercase border border-[#7b61ff]/10 transition-all duration-500 hover:scale-110 hover:bg-[#7b61ff]/15 hover:border-[#7b61ff]/40 hover:shadow-[0_0_15px_rgba(123,97,255,0.2)] cursor-default">
            {s}
          </span>
        ))}
        {(job.stack || []).length > 4 && (
          <span className="text-[9px] px-3 py-1.5 text-[#444] font-mono font-black bg-white/5 rounded-xl border border-white/5 hover:text-[#777] transition-colors cursor-default">
            +{(job.stack || []).length - 4}
          </span>
        )}
      </div>

      <div className="flex gap-3 flex-wrap items-center relative z-10">
        {job.seniority && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#00ff87]/[0.03] border border-[#00ff87]/10 transition-all duration-300 group-hover:border-[#00ff87]/30 group-hover:bg-[#00ff87]/[0.06]">
             <span className="text-[9px] text-[#00ff87] font-mono font-black uppercase tracking-[2px]">
               {job.seniority}
             </span>
          </div>
        )}
        {job.work_style && job.work_style !== 'unspecified' && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#00d4ff]/[0.03] border border-[#00d4ff]/10 transition-all duration-300 group-hover:border-[#00d4ff]/30 group-hover:bg-[#00d4ff]/[0.06]">
            <span className="text-[9px] text-[#00d4ff] font-mono font-black uppercase tracking-[2px]">
              {job.work_style}
            </span>
          </div>
        )}
        {job.stack_overlap !== null && job.stack_overlap !== undefined && job.stack_overlap > 0 && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#ffd60a]/[0.03] border border-[#ffd60a]/10 transition-all duration-300 group-hover:border-[#ffd60a]/30 group-hover:bg-[#ffd60a]/[0.06]">
            <span className="text-[10px] text-[#ffd60a] font-mono font-black uppercase tracking-[2px]">
              {job.stack_overlap}% Match
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-7 pt-5 border-t border-white/[0.03] relative z-10">
        {job.score_reason && (
          <div className="text-[11px] text-[#444] font-medium italic flex-1 mr-4 line-clamp-1 group-hover:text-[#888] transition-all duration-500 group-hover:translate-x-1">
            &quot;{job.score_reason}&quot;
          </div>
        )}
        <div className="shrink-0 transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-x-1">
          <StatusBadge status={job.status || 'pending'} />
        </div>
      </div>
    </div>
  )
}

export const JobCard = React.memo(JobCardComponent)
