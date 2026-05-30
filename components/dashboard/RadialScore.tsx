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
  const gradientId = `scoreGradient-${score}-${size}`

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      {/* Premium Outer Glow - Layered */}
      <div
        className="absolute inset-[-10%] rounded-full blur-2xl opacity-0 transition-all duration-1000 group-hover:opacity-20 group-hover:scale-150 pointer-events-none"
        style={{ backgroundColor: colors.primary }}
      />
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-0 transition-all duration-700 group-hover:opacity-40 pointer-events-none"
        style={{ backgroundColor: colors.secondary }}
      />

      {/* Inner Glow Core */}
      <div
        className="absolute inset-[25%] rounded-full blur-lg opacity-20 transition-opacity duration-500 group-hover:opacity-60 pointer-events-none"
        style={{ backgroundColor: colors.primary }}
      />

      <svg width={size} height={size} className="-rotate-90 relative z-10 overflow-visible drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <filter id={`glow-${score}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shadow Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="black"
          strokeWidth="6"
          className="opacity-20"
        />

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="4"
        />

        {/* Progress circle - Glow layer */}
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
          filter={`url(#glow-${score})`}
          className="transition-all duration-1000 ease-out opacity-40 group-hover:opacity-70"
        />

        {/* Progress circle - Sharp layer */}
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
          className="transition-all duration-1000 ease-out"
        />

        {/* Ultra-sharp inner definition stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="white"
          strokeWidth="0.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out opacity-30"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-[13px] font-mono font-black text-white tracking-tighter leading-none drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
          {score}
        </span>
        {size > 50 && (
          <span className="text-[7px] font-mono font-bold text-[#555] uppercase tracking-widest mt-0.5 group-hover:text-[#888] transition-colors">
            FIT
          </span>
        )}
      </div>
    </div>
  )
}
