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
  const animationDelay = index < 10 ? `${index * 50}ms` : '0ms'

  return (
    <div
      className={`p-8 border-b border-[#e2e2d9] cursor-pointer transition-all duration-500 ease-out hover:bg-[#f8f8f4] group relative overflow-hidden
        ${isSelected ? 'bg-[#f0f0eb] border-l-4 border-l-[#c5a059]' : 'border-l-4 border-l-transparent'}
        animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards`}
      style={{ animationDelay, opacity: 0 }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex-1 mr-6">
          <div className="font-syne font-bold text-[20px] text-[#1a1a1a] mb-2 group-hover:text-[#c5a059] transition-all duration-500 leading-tight tracking-tight line-clamp-2 uppercase">
            {job.title}
          </div>
          <div className="text-[10px] text-[#888] font-mono tracking-[2px] flex flex-wrap items-center gap-2 uppercase font-bold">
            <span className="text-[#4a4a4a] group-hover:text-[#1a1a1a] transition-colors line-clamp-1">{job.company}</span>
            <span className="w-1.5 h-1.5 bg-[#e2e2d9] shrink-0" />
            <span className="line-clamp-1">{job.location || 'Remote'}</span>
          </div>
        </div>
        <div className="shrink-0 transition-transform duration-700 group-hover:scale-105">
          <RadialScore score={job.score || 0} size={60} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6 relative z-10">
        {(job.stack || []).slice(0, 4).map(s => (
          <span key={s} className="text-[9px] px-3 py-1.5 bg-[#f0f0eb] text-[#4a4a4a] font-mono font-bold tracking-tight uppercase border border-[#d1d1ca] transition-all duration-500 hover:border-[#c5a059] hover:bg-white cursor-default">
            {s}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mt-auto pt-6 border-t border-[#e2e2d9]/50 relative z-10">
        <div className="flex gap-4 items-center">
            {job.seniority && (
              <span className="text-[9px] text-[#888] font-mono font-bold uppercase tracking-[2px]">
                {job.seniority}
              </span>
            )}
            {job.work_style && job.work_style !== 'unspecified' && (
              <span className="text-[9px] text-[#888] font-mono font-bold uppercase tracking-[2px]">
                {job.work_style}
              </span>
            )}
        </div>
        <div className="shrink-0">
          <StatusBadge status={job.status || 'pending'} />
        </div>
      </div>
    </div>
  )
}

export const JobCard = React.memo(JobCardComponent)
