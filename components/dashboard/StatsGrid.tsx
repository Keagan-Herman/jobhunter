export function StatsGrid({ stats }: { stats: { pending: number, applied: number, interviewing: number, total: number } }) {
  const items = [
    { label: 'Total Jobs', value: stats.total, color: 'text-white', glow: 'bg-white/5' },
    { label: 'Pending', value: stats.pending, color: 'text-[#ffd60a]', glow: 'bg-[#ffd60a]/5' },
    { label: 'Applied', value: stats.applied, color: 'text-[#00ff87]', glow: 'bg-[#00ff87]/5' },
    { label: 'Interviews', value: stats.interviewing, color: 'text-[#00d4ff]', glow: 'bg-[#00d4ff]/5' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {items.map(s => (
        <div
          key={s.label}
          className="bg-glass border-premium rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
        >
          {/* Background Glow */}
          <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${s.glow}`} />

          <div className="relative z-10">
            <div className="text-[10px] text-[#555] tracking-[2px] uppercase font-mono font-bold mb-2 group-hover:text-[#888] transition-colors">{s.label}</div>
            <div className={`text-3xl font-extrabold ${s.color} font-syne tracking-tight`}>
              {s.value.toLocaleString()}
            </div>
          </div>

          {/* Subtle accent line */}
          <div className={`absolute bottom-0 left-4 right-4 h-[1px] opacity-20 ${s.color.replace('text-', 'bg-')}`} />
        </div>
      ))}
    </div>
  )
}
