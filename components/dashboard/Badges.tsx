export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'text-[#00ff87]' : score >= 70 ? 'text-[#ffd60a]' : 'text-[#ff6b6b]'
  const bgColor = score >= 85 ? 'bg-[#00ff8718]' : score >= 70 ? 'bg-[#ffd60a18]' : 'bg-[#ff6b6b18]'
  const borderColor = score >= 85 ? 'border-[#00ff8740]' : score >= 70 ? 'border-[#ffd60a40]' : 'border-[#ff6b6b40]'
  const dotColor = score >= 85 ? 'bg-[#00ff87]' : score >= 70 ? 'bg-[#ffd60a]' : 'bg-[#ff6b6b]'

  return (
    <div className={`inline-flex items-center gap-1.5 ${bgColor} border ${borderColor} rounded-md px-2.5 py-0.5 text-xs font-bold ${color} font-mono`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} inline-block`} />
      {score}%
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string, label: string }> = {
    pending: { color: 'text-[#ffd60a]', label: 'PENDING' },
    applied: { color: 'text-[#00ff87]', label: 'APPLIED' },
    skipped: { color: 'text-[#444]', label: 'SKIPPED' },
    interviewing: { color: 'text-[#00d4ff]', label: 'INTERVIEW' },
  }
  const { color, label } = map[status] || map.pending
  return (
    <span className={`text-[10px] font-bold tracking-[1.5px] ${color} font-mono`}>
      {label}
    </span>
  )
}
