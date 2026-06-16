'use client'
import { useState, useEffect, useRef } from 'react'

export function SkipModal({
  onClose,
  onSkip
}: {
  onClose: () => void
  onSkip: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const commonReasons = ['Wrong stack', 'Too senior', 'Too junior', 'Bad company', 'Wrong location', 'Low salary', 'Not interested']

  useEffect(() => {
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-[#1a1a1a]/60 flex items-center justify-center z-40 p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skip-modal-title"
        className="bg-white border border-[#e2e2d9] rounded-sm p-7 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <h3 id="skip-modal-title" className="font-sans text-xl font-bold text-[#1a1a1a] mb-1.5">Why are you skipping?</h3>
        <p className="text-xs text-[#666] font-mono mb-6">This helps the AI score future jobs better</p>

        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Common reasons">
          {commonReasons.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              className={`px-3 py-2 min-h-[36px] rounded-sm text-[11px] font-mono font-bold transition-all
                ${reason === r
                  ? 'bg-[#2b6777]/5 border border-[#2b6777] text-[#2b6777]'
                  : 'bg-white border border-[#e2e2d9] text-[#4a4a4a] hover:border-[#c5a059] hover:text-[#1a1a1a]'
                }`}
            >
              {r}
            </button>
          ))}
        </div>

        <label htmlFor="skip-reason" className="sr-only">Custom reason for skipping</label>
        <input
          id="skip-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Or type your own reason..."
          className="w-full bg-white border border-[#e2e2d9] p-3 text-[#1a1a1a] text-sm outline-none mb-6 focus:border-[#c5a059] transition-all placeholder:text-[#666]"
        />

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] bg-transparent border border-[#e2e2d9] text-[#4a4a4a] rounded-sm font-mono text-[11px] hover:bg-[#f0f0eb] hover:text-[#1a1a1a] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSkip(reason)}
            className="flex-[2] min-h-[44px] bg-[#bc243c]/5 border border-[#bc243c]/30 text-[#bc243c] rounded-sm font-mono text-[11px] font-bold tracking-widest uppercase hover:bg-[#bc243c]/10 transition-all"
          >
            Skip Job
          </button>
        </div>
      </div>
    </div>
  )
}
