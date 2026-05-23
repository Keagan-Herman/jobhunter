export function RadialScore({ score, size = 48 }: { score: number, size?: number }) {
  const radius = (size / 2) - 4
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 85) return '#00ff87'
    if (s >= 70) return '#ffd60a'
    return '#ff6b6b'
  }

  const color = getColor(score)

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      {/* Glow Effect */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-20 transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: color }}
      />

      <svg width={size} height={size} className="-rotate-90 relative z-10">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <span className="text-[11px] font-mono font-bold text-white tracking-tighter">
          {score}
        </span>
      </div>
    </div>
  )
}
