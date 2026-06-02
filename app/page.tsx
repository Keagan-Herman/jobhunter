'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SplashPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-[#080812]" />
  }

  return (
    <div className="min-h-screen bg-[#080812] text-[#e0e0f0] font-sans relative overflow-hidden flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#00ff87]/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#7b61ff]/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center space-y-12">
        <div className="space-y-4 animate-in fade-in zoom-in duration-1000">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#0d0d20] border border-[#1e1e38] mb-4 md:mb-6">
             <span className="text-[10px] text-[#00ff87] font-mono font-bold tracking-[3px] uppercase">Personal Edition</span>
          </div>
          <h1 className="font-syne text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-white leading-none">
            Job<span className="text-[#00ff87] text-glow-green">Hunter</span>
          </h1>
          <p className="font-mono text-[10px] md:text-sm text-[#444] tracking-[2px] sm:tracking-[4px] md:tracking-[6px] uppercase font-bold">
            Autonomous AI Career Strategist
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {[
            { title: 'Intelligent Scan', desc: 'LLM-powered job discovery across multiple global sources.' },
            { title: 'Match Analysis', desc: 'Brutally honest fit scoring based on your unique technical profile.' },
            { title: 'Ghostwriter', desc: 'Elite cover letters that replicate your highest-performing patterns.' }
          ].map((feature, i) => (
            <div key={i} className="group p-8 rounded-[2rem] bg-[#0d0d20]/50 border border-[#1e1e38] hover:border-[#00ff8740] transition-all duration-500 hover:bg-[#0d0d20]">
              <h3 className="font-syne text-lg font-bold text-white mb-3 group-hover:text-[#00ff87] transition-colors">{feature.title}</h3>
              <p className="text-xs text-[#555] leading-relaxed font-sans">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <button
            onClick={() => router.push('/onboarding')}
            className="group relative px-8 md:px-12 py-4 md:py-5 bg-[#00ff87] text-[#0a0a1a] rounded-2xl font-mono text-xs md:text-sm font-black tracking-[4px] uppercase overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,255,135,0.25)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
            Initialize System
          </button>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[#333] font-mono text-[10px] tracking-[2px] uppercase">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87]" />
                SQLite Backend
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87]" />
                LLaMA 3.3 Powered
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff87]" />
                Private Data
             </div>
          </div>
        </div>
      </div>

      <footer className="py-8 md:absolute md:bottom-8 left-0 right-0 text-center animate-in fade-in duration-1000 delay-700">
         <p className="text-[10px] font-mono text-[#222] tracking-widest uppercase px-6">
            Designed for elite software engineers
         </p>
      </footer>
    </div>
  )
}
