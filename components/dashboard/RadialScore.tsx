export function RadialScore({ score, size = 48 }: { score: number, size?: number }) {
  const radius = (size / 2) - 4
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColors = (s: number) => {
    if (s >= 85) return { primary: '#00ff87', secondary: '#00d4ff', glow: 'rgba(0, 255, 135, 0.4)' }
    if (s >= 70) return { primary: '#ffd60a', secondary: '#ff9500', glow: 'rgba(255, 214, 10, 0.4)' }
    return { primary: '#ff6b6b', secondary: '#ff0000', glow: 'rgba(255, 107, 107, 0.4)' }
  }

  const colors = getColors(score)
  const gradientId = `scoreGradient-${score}`

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      {/* Glow Effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-0 transition-opacity duration-700 group-hover:opacity-40"
        style={{ backgroundColor: colors.primary }}
      />

      {/* Background Ring Glow */}
      <div
        className="absolute inset-[15%] rounded-full blur-md opacity-20"
        style={{ backgroundColor: colors.primary }}
      />

      <svg width={size} height={size} className="-rotate-90 relative z-10 overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={score >= 85 ? "url(#glow)" : ""}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-[12px] font-mono font-bold text-white tracking-tighter leading-none">
          {score}
        </span>
        {size > 50 && (
          <span className="text-[6px] font-mono font-bold text-[#555] uppercase tracking-tighter mt-0.5">
            Fit
          </span>
        )}
      </div>
    </div>
  )
}
