import React from 'react'

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-[#f0f0eb] text-[#4a4a4a] border-[#d1d1ca]',
    applied: 'bg-[#2b6777]/5 text-[#2b6777] border-[#2b6777]/20',
    interviewing: 'bg-[#bc243c]/5 text-[#bc243c] border-[#bc243c]/20',
    skipped: 'bg-transparent text-[#666] border-[#e2e2d9]',
    rejected: 'bg-[#1a1a1a] text-white border-transparent'
  }

  return (
    <span className={`text-[9px] px-3 py-1 border font-mono font-bold uppercase tracking-widest ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}
