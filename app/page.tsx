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
    return <div className="min-h-screen bg-[#f8f8f4]" />
  }

  return (
    <div className="min-h-screen bg-[#f8f8f4] text-[#1a1a1a] font-sans relative overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Swiss Grid & Klimt Organic Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 grid-overlay opacity-50" />

        {/* Klimt-inspired organic shapes */}
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#c5a059]/5 blur-[80px] animate-organic" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-[#2b6777]/5 blur-[100px] animate-organic" style={{ animationDelay: '3s' }} />

        {/* Decorative Klimt Blobs */}
        <div className="absolute top-[20%] right-[15%] w-12 h-12 bg-[#c5a059]/20 rounded-full animate-float mix-blend-multiply" />
        <div className="absolute bottom-[25%] left-[10%] w-8 h-8 bg-[#bc243c]/10 rounded-full animate-float" style={{ animationDelay: '5s' }} />
      </div>

      <div className="relative z-10 max-w-5xl w-full text-center space-y-16 md:space-y-24">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-block px-4 py-1 rounded-sm matte-surface border-[#d1d1ca] mb-4">
             <span className="text-[10px] text-[#4a4a4a] font-mono font-bold tracking-[3px] uppercase">Job Search & Application Platform</span>
          </div>

          <h1 className="font-syne text-5xl sm:text-7xl md:text-9xl font-bold tracking-tight text-[#1a1a1a] leading-none">
            Job<span className="text-[#c5a059] italic">Hunter</span>
          </h1>

          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-[#c5a059]" />
            <p className="font-mono text-[10px] md:text-xs text-[#4a4a4a] tracking-[4px] uppercase font-bold">
              Intelligent Career Management
            </p>
            <div className="h-px w-12 bg-[#c5a059]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          {[
            { title: 'Job Discovery', desc: 'Aggregate and filter listings from global sources with precision.' },
            { title: 'Match Analysis', desc: 'Objective scoring of roles based on your technical qualifications.' },
            { title: 'Application Assistance', desc: 'Generate professionally tailored documents for your job search.' }
          ].map((feature, i) => (
            <div key={i} className="group p-10 text-left tactile-pop bg-white/50 border border-[#e2e2d9] hover:border-[#c5a059]/30 transition-all duration-700">
              <div className="w-10 h-1 bg-[#c5a059]/20 mb-8 group-hover:w-full transition-all duration-700" />
              <h3 className="font-syne text-xl font-bold text-[#1a1a1a] mb-4">{feature.title}</h3>
              <p className="text-sm text-[#4a4a4a] leading-relaxed font-sans">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <button
            onClick={() => router.push('/onboarding')}
            className="group relative px-12 py-5 bg-[#1a1a1a] text-[#f8f8f4] rounded-sm font-mono text-xs font-bold tracking-[4px] uppercase overflow-hidden transition-all hover:bg-[#c5a059] active:scale-95 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer-light" />
            Get Started
          </button>

          <div className="flex flex-wrap items-center justify-center gap-8 text-[#4a4a4a] font-mono text-[10px] tracking-[2px] uppercase">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#c5a059]" />
                SQLite Local Storage
             </div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#bc243c]" />
                LLM-Powered Analysis
             </div>
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#2b6777]" />
                Privacy First
             </div>
          </div>
        </div>
      </div>

      <footer className="py-12 md:absolute md:bottom-8 left-0 right-0 text-center animate-in fade-in duration-1000 delay-700">
         <p className="text-[10px] font-mono text-[#888] tracking-widest uppercase px-6">
            Designed for professional software engineers
         </p>
      </footer>
    </div>
  )
}
