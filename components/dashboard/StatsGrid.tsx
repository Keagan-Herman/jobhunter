export function StatsGrid({ stats }: { stats: { pending: number, applied: number, interviewing: number, total: number } }) {
  const items = [
    { label: 'Total Jobs', value: stats.total, color: 'text-white', glow: 'bg-white/10', accent: 'bg-white/20', icon: '💎' },
    { label: 'Pending Scan', value: stats.pending, color: 'text-[#ffd60a]', glow: 'bg-[#ffd60a]/10', accent: 'bg-[#ffd60a]/20', icon: '🔍' },
    { label: 'Applications', value: stats.applied, color: 'text-[#00ff87]', glow: 'bg-[#00ff87]/10', accent: 'bg-[#00ff87]/20', icon: '✉️' },
    { label: 'Interviews', value: stats.interviewing, color: 'text-[#00d4ff]', glow: 'bg-[#00d4ff]/10', accent: 'bg-[#00d4ff]/20', icon: '🤝' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
      {items.map(s => (
        <div
          key={s.label}
          className="bg-glass border-premium rounded-[2.5rem] p-7 relative overflow-hidden group hover:border-white/20 transition-all duration-700 hover:-translate-y-2 hover:scale-[1.02] shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-default"
        >
          {/* Background Glow */}
          <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-10 transition-all duration-1000 group-hover:opacity-40 group-hover:scale-150 ${s.glow}`} />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] text-[#555] tracking-[3px] uppercase font-mono font-black group-hover:text-[#888] transition-colors">{s.label}</div>
                <div className="text-xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-110">{s.icon}</div>
            </div>
            <div className={`text-5xl font-black ${s.color} font-syne tracking-tighter drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 origin-left`}>
              {s.value.toLocaleString()}
            </div>
          </div>

          {/* Premium accent line */}
          <div className={`absolute bottom-0 left-0 right-0 h-1.5 opacity-0 transition-all duration-700 group-hover:opacity-100 blur-[2px] ${s.accent}`} />
          <div className={`absolute bottom-0 left-0 right-0 h-[2px] opacity-0 transition-all duration-500 group-hover:opacity-100 ${s.accent}`} />

          {/* Subtle Inner Border */}
          <div className="absolute inset-0 border border-white/[0.02] rounded-[2.5rem] pointer-events-none" />
        </div>
      ))}
    </div>
  )
}
