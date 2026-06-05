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
      className={`p-10 border-b border-[#e2e2d9] cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white group relative overflow-hidden
        ${isSelected ? 'bg-[#f0f0eb] border-l-4 border-l-[#c5a059]' : 'bg-[#fbfbfa] border-l-4 border-l-transparent'}
        animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards shadow-[inset_0_0_0_1px_transparent] hover:shadow-xl hover:z-10`}
      style={{ animationDelay, opacity: 0 }}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] font-syne font-black text-6xl select-none group-hover:opacity-[0.07] transition-opacity duration-700">
        {job.company.substring(0, 2).toUpperCase()}
      </div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex-1 mr-8">
          <div className="font-syne font-bold text-[22px] text-[#1a1a1a] mb-3 group-hover:text-[#c5a059] transition-all duration-700 leading-[1.1] tracking-tight line-clamp-2 uppercase">
            {job.title}
          </div>
          <div className="text-[11px] text-[#888] font-mono tracking-[3px] flex flex-wrap items-center gap-3 uppercase font-bold">
            <span className="text-[#4a4a4a] group-hover:text-[#1a1a1a] transition-colors line-clamp-1">{job.company}</span>
            <div className="w-1 h-1 bg-[#c5a059] rotate-45 shrink-0" />
            <span className="line-clamp-1">{job.location || 'Remote'}</span>
          </div>
        </div>
        <div className="shrink-0 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3">
          <RadialScore score={job.score || 0} size={64} />
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap mb-8 relative z-10">
        {(job.stack || []).slice(0, 5).map(s => (
          <span key={s} className="text-[10px] px-4 py-2 bg-white text-[#4a4a4a] font-mono font-bold tracking-tight uppercase border border-[#e2e2d9] transition-all duration-500 group-hover:border-[#c5a059] group-hover:bg-[#f8f8f4] cursor-default tactile-pop">
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
