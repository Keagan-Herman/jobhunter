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
  const isNew = job.created_at ? (new Date().getTime() - new Date(job.created_at).getTime()) < 24 * 60 * 60 * 1000 : false
  const matchStrength = job.score ? (job.score >= 85 ? 'EXCEPTIONAL' : job.score >= 70 ? 'STRONG' : job.score >= 50 ? 'COMPATIBLE' : 'POTENTIAL') : 'PENDING'
  const matchColor = job.score ? (job.score >= 85 ? 'text-[#2b6777]' : job.score >= 70 ? 'text-[#8a6e30]' : job.score >= 50 ? 'text-[#4a4a4a]' : 'text-[#bc243c]') : 'text-[#666]'

  return (
    <button
      type="button"
      className={`w-full text-left p-10 border-b border-[#e2e2d9] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white group relative overflow-hidden
        ${isSelected ? 'bg-[#f5f0e8] ring-1 ring-inset ring-[#c5a059]/40' : 'bg-[#fbfbfa]'}
        animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards hover:shadow-xl hover:z-10
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c5a059]/60`}
      style={{ animationDelay, opacity: 0 }}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] font-syne font-black text-6xl select-none group-hover:opacity-[0.07] transition-opacity duration-700" aria-hidden="true">
        {job.company.substring(0, 2).toUpperCase()}
      </div>

      {isNew && (
        <div className="absolute top-0 left-0 px-4 py-1.5 bg-[#1a1a1a] text-[#c5a059] font-mono text-[9px] font-bold tracking-[2px] z-20" aria-label="New listing">
          NEW LISTING
        </div>
      )}

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex-1 mr-8">
          <div className="font-syne font-bold text-[22px] text-[#1a1a1a] mb-3 group-hover:text-[#c5a059] transition-all duration-700 leading-[1.1] tracking-tight line-clamp-2 uppercase">
            {job.title}
          </div>
          <div className="text-[11px] font-mono tracking-[3px] flex flex-wrap items-center gap-3 uppercase font-bold">
            <span className="text-[#4a4a4a] group-hover:text-[#1a1a1a] transition-colors line-clamp-1">{job.company}</span>
            <div className="w-1 h-1 bg-[#c5a059] rotate-45 shrink-0" aria-hidden="true" />
            <span className="text-[#666] line-clamp-1">{job.location || 'Remote'}</span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-2 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3" aria-hidden="true">
          <RadialScore score={job.score || 0} size={64} />
          <span className={`text-[9px] font-mono font-bold tracking-[2px] ${matchColor}`}>
            {matchStrength}
          </span>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap mb-8 relative z-10" aria-label={`Tech stack: ${(job.stack || []).slice(0, 5).join(', ')}`}>
        {(job.stack || []).slice(0, 5).map(s => (
          <span key={s} className="text-[10px] px-4 py-2 bg-white text-[#4a4a4a] font-mono font-bold tracking-tight uppercase border border-[#e2e2d9] transition-all duration-500 group-hover:border-[#c5a059] group-hover:bg-[#f8f8f4] cursor-default">
            {s}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mt-auto pt-6 border-t border-[#e2e2d9]/50 relative z-10">
        <div className="flex gap-4 items-center">
          {job.seniority && (
            <span className="text-[9px] text-[#666] font-mono font-bold uppercase tracking-[2px]">
              {job.seniority}
            </span>
          )}
          {job.work_style && job.work_style !== 'unspecified' && (
            <span className="text-[9px] text-[#666] font-mono font-bold uppercase tracking-[2px]">
              {job.work_style}
            </span>
          )}
        </div>
        <div className="shrink-0">
          <StatusBadge status={job.status || 'pending'} />
        </div>
      </div>
    </button>
  )
}

export const JobCard = React.memo(JobCardComponent)
