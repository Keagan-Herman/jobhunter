import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080812] text-[#e0e0f0] font-sans selection:bg-[#00ff8720] selection:text-[#00ff87] overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]"
           style={{ backgroundImage: 'linear-gradient(#00ff8710 1px, transparent 1px), linear-gradient(90deg, #00ff8710 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="fixed -top-[20rem] -right-[20rem] w-[60rem] h-[60rem] rounded-full bg-radial-gradient from-[#00ff8708] to-transparent z-0 pointer-events-none blur-[100px]" />
      <div className="fixed -bottom-[30rem] -left-[20rem] w-[70rem] h-[70rem] rounded-full bg-radial-gradient from-[#7b61ff05] to-transparent z-0 pointer-events-none blur-[120px]" />

      {/* Navigation */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-syne text-2xl font-extrabold tracking-tight text-white flex items-center gap-1">
            Job<span className="text-[#00ff87] text-glow-green">Hunter</span>
          </h1>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/login" className="text-[11px] font-mono font-bold uppercase tracking-[2px] text-[#888] hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/login" className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-[2px] hover:bg-white/10 transition-all active:scale-95">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-[#0d0d20] border border-[#1e1e38] rounded-full px-4 py-1.5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff87]"></span>
          </span>
          <span className="text-[10px] text-[#00ff87] font-mono font-bold tracking-widest uppercase">Now Powered by LLaMA 3.3 70B</span>
        </div>

        <h2 className="font-syne text-6xl md:text-8xl font-black tracking-tight text-white mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
          Land your dream role <br />
          <span className="text-[#00ff87] text-glow-green">with AI precision.</span>
        </h2>

        <p className="max-w-2xl text-lg md:text-xl text-[#888] leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          The ultimate command center for modern software engineers.
          Automated job matching, high-impact cover letters, and professional interview tracking.
        </p>

        <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <Link href="/login" className="group relative bg-[#00ff87] text-[#0a0a1a] px-10 py-5 rounded-2xl font-black font-mono text-[13px] tracking-[3px] uppercase hover:brightness-110 transition-all shadow-[0_20px_50px_rgba(0,255,135,0.3)] hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            Start Hunting Free
          </Link>
          <a href="#features" className="bg-glass border-premium px-10 py-5 rounded-2xl font-black font-mono text-[13px] tracking-[3px] uppercase hover:bg-white/5 transition-all flex items-center gap-3">
            How it works
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-glass border-premium rounded-[2.5rem] p-10 group hover:border-white/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#00ff8710] border border-[#00ff8720] flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="font-syne font-bold text-2xl text-white mb-4">Precision Matching</h3>
            <p className="text-[#666] leading-relaxed">Our AI analyzes thousands of job descriptions daily to find the perfect stack and seniority alignment for your profile.</p>
          </div>
          <div className="bg-glass border-premium rounded-[2.5rem] p-10 group hover:border-white/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#7b61ff10] border border-[#7b61ff20] flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">✍️</div>
            <h3 className="font-syne font-bold text-2xl text-white mb-4">Ghostwriter AI</h3>
            <p className="text-[#666] leading-relaxed">Generate bespoke, punchy cover letters that bypass the "standard recruiter" feel and speak directly to engineering values.</p>
          </div>
          <div className="bg-glass border-premium rounded-[2.5rem] p-10 group hover:border-white/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#00d4ff10] border border-[#00d4ff20] flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="font-syne font-bold text-2xl text-white mb-4">Command Center</h3>
            <p className="text-[#666] leading-relaxed">Keep track of every interview, offer, and follow-up in a high-fidelity dashboard designed for peak efficiency.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5 text-center">
        <div className="font-syne font-bold text-white mb-4 italic">Built for engineers, by engineers.</div>
        <div className="text-[10px] font-mono text-[#444] uppercase tracking-[4px]">JobHunter © 2025 • All Rights Reserved</div>
      </footer>
    </div>
  )
}
