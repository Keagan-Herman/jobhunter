import { useState } from 'react'

export function SkipModal({
  onClose,
  onSkip
}: {
  onClose: () => void
  onSkip: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const commonReasons = ['Wrong stack', 'Too senior', 'Too junior', 'Bad company', 'Wrong location', 'Low salary', 'Not interested']

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0d0d20] border border-[#1e1e38] rounded-2xl p-7 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="font-syne text-xl font-extrabold text-white mb-1.5">Why are you skipping?</h3>
        <p className="text-xs text-[#444] font-mono mb-6">This helps the AI score future jobs better</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {commonReasons.map(r => (
            <button key={r} onClick={() => setReason(r)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer text-[11px] font-mono transition-all
                ${reason === r ? 'bg-[#00ff8718] border border-[#00ff87] text-[#00ff87]' : 'bg-[#0a0a1a] border border-[#1e1e38] text-[#555] hover:border-[#3a3a5a]'}`}
            >{r}</button>
          ))}
        </div>

        <input value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Or type your own reason..."
          className="w-full bg-[#0a0a1a] border border-[#1e1e38] rounded-xl p-3 text-[#e0e0f0] text-sm outline-none mb-6 focus:border-[#00ff87] transition-all" />

        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 bg-transparent border border-[#1e1e38] text-[#444] py-2.5 rounded-xl font-mono text-[11px] hover:bg-[#1a1a3a] transition-all"
          >Cancel</button>

          <button onClick={() => onSkip(reason)}
            className="flex-[2] bg-[#ff6b6b18] border border-[#ff6b6b40] text-[#ff6b6b] py-2.5 rounded-xl font-mono text-[11px] font-bold tracking-widest uppercase hover:brightness-110 transition-all"
          >Skip Job</button>
        </div>
      </div>
    </div>
  )
}
