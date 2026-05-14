export function StatsGrid({ stats }: { stats: { pending: number, applied: number, interviewing: number, total: number } }) {
  const items = [
    { label: 'Total Jobs', value: stats.total, color: 'text-[#e0e0f0]' },
    { label: 'Pending', value: stats.pending, color: 'text-[#ffd60a]' },
    { label: 'Applied', value: stats.applied, color: 'text-[#00ff87]' },
    { label: 'Interviews', value: stats.interviewing, color: 'text-[#00d4ff]' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
      {items.map(s => (
        <div key={s.label} className="bg-[#0d0d20] border border-[#1a1a32] rounded-xl p-3.5 transition-colors hover:border-[#2a2a4a]">
          <div className="text-[10px] text-[#444] tracking-[1.5px] uppercase font-mono mb-1.5">{s.label}</div>
          <div className={`text-2xl font-bold ${s.color} font-syne`}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}
