export function StatsGrid({ stats }: { stats: { pending: number, applied: number, interviewing: number, total: number } }) {
  const items = [
    { label: 'Total Listings', value: stats.total, color: 'text-[#1a1a1a]', border: 'border-[#e2e2d9]' },
    { label: 'Pending Review', value: stats.pending, color: 'text-[#8a6e30]', border: 'border-[#c5a059]/20' },
    { label: 'Applications', value: stats.applied, color: 'text-[#2b6777]', border: 'border-[#2b6777]/20' },
    { label: 'Interviews', value: stats.interviewing, color: 'text-[#bc243c]', border: 'border-[#bc243c]/20' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
      {items.map(s => (
        <div
          key={s.label}
          className={`bg-white border-b-4 ${s.border} p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 tactile-pop`}
        >
          <div className="relative z-10">
            <div className="text-xs text-[#666] font-medium mb-4 group-hover:text-[#4a4a4a] transition-colors">{s.label}</div>
            <div className={`text-4xl md:text-5xl font-bold ${s.color} font-mono tracking-tighter`}>
              {s.value.toLocaleString()}
            </div>
          </div>

          {/* Klimt Decorative Dot */}
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#e2e2d9] rounded-full" />
        </div>
      ))}
    </div>
  )
}
