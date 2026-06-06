export function StatsGrid({ stats }: { stats: { pending: number, applied: number, interviewing: number, total: number } }) {
  const items = [
    {
      label: 'Total Listings',
      value: stats.total,
      color: 'text-[#1a1a1a]',
      border: 'border-[#e2e2d9]',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <rect x="3" y="3" width="18" height="18" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      )
    },
    {
      label: 'Pending Review',
      value: stats.pending,
      color: 'text-[#c5a059]',
      border: 'border-[#c5a059]/20',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="11" />
          <line x1="11" y1="11" x2="13" y2="13" />
        </svg>
      )
    },
    {
      label: 'Applications',
      value: stats.applied,
      color: 'text-[#2b6777]',
      border: 'border-[#2b6777]/20',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    },
    {
      label: 'Interviews',
      value: stats.interviewing,
      color: 'text-[#bc243c]',
      border: 'border-[#bc243c]/20',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
      {items.map(s => (
        <div
          key={s.label}
          className={`bg-white border-b-4 ${s.border} p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 shadow-sm tactile-pop`}
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[10px] text-[#888] tracking-[3px] uppercase font-mono font-bold group-hover:text-[#4a4a4a] transition-colors">{s.label}</div>
              <div className="text-[#e2e2d9] group-hover:text-[#c5a059] transition-colors duration-500">
                {s.icon}
              </div>
            </div>
            <div className={`text-4xl md:text-5xl font-bold ${s.color} font-syne tracking-tighter`}>
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
