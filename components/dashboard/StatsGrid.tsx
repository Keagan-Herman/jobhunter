export function StatsGrid({ stats }: { stats: { pending: number, applied: number, interviewing: number, total: number } }) {
  const items = [
    { label: 'Total Jobs', value: stats.total, color: 'text-white', glow: 'bg-white/10', accent: 'bg-white/20' },
    { label: 'Pending Scan', value: stats.pending, color: 'text-[#ffd60a]', glow: 'bg-[#ffd60a]/10', accent: 'bg-[#ffd60a]/20' },
    { label: 'Applications', value: stats.applied, color: 'text-[#00ff87]', glow: 'bg-[#00ff87]/10', accent: 'bg-[#00ff87]/20' },
    { label: 'Interviews', value: stats.interviewing, color: 'text-[#00d4ff]', glow: 'bg-[#00d4ff]/10', accent: 'bg-[#00d4ff]/20' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
      {items.map(s => (
        <div
          key={s.label}
          className="bg-glass border-premium rounded-[2rem] p-7 relative overflow-hidden group hover:border-white/20 transition-all duration-500 hover:-translate-y-2 shadow-2xl"
        >
          {/* Background Glow */}
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:opacity-50 group-hover:scale-150 ${s.glow}`} />

          <div className="relative z-10">
            <div className="text-[10px] text-[#666] tracking-[3px] uppercase font-mono font-black mb-3 group-hover:text-[#999] transition-colors">{s.label}</div>
            <div className={`text-4xl font-black ${s.color} font-syne tracking-tighter drop-shadow-sm`}>
              {s.value.toLocaleString()}
            </div>
          </div>

          {/* Premium accent line */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-0 transition-all duration-700 group-hover:opacity-100 ${s.accent} blur-[1px]`} />
          <div className={`absolute bottom-0 left-1/4 right-1/4 h-[2px] opacity-0 transition-all duration-500 group-hover:opacity-100 ${s.accent.replace('20', '50')} group-hover:w-full group-hover:left-0`} />

          {/* Subtle Inner Border */}
          <div className="absolute inset-0 border border-white/[0.02] rounded-[2rem] pointer-events-none" />
        </div>
      ))}
    </div>
  )
}
