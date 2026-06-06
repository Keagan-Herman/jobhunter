import React from 'react'

type NotificationType = 'success' | 'error' | 'info'

interface NotificationProps {
  message: string
  type: NotificationType
  onClose?: () => void
}

export function Notification({ message, type, onClose }: NotificationProps) {
  const styles: Record<NotificationType, { bg: string, border: string, text: string, accent: string }> = {
    success: {
      bg: 'bg-[#2b6777]/5',
      border: 'border-[#2b6777]/20',
      text: 'text-[#2b6777]',
      accent: 'bg-[#2b6777]'
    },
    error: {
      bg: 'bg-[#bc243c]/5',
      border: 'border-[#bc243c]/20',
      text: 'text-[#bc243c]',
      accent: 'bg-[#bc243c]'
    },
    info: {
      bg: 'bg-[#c5a059]/5',
      border: 'border-[#c5a059]/20',
      text: 'text-[#c5a059]',
      accent: 'bg-[#c5a059]'
    }
  }

  const currentStyle = styles[type]

  return (
    <div className={`${currentStyle.bg} border ${currentStyle.border} rounded-sm p-4 flex justify-between items-center animate-in slide-in-from-top-2 duration-500 shadow-sm tactile-pop overflow-hidden relative`}>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-1.5 h-1.5 ${currentStyle.accent} rotate-45`} />
        <span className={`${currentStyle.text} text-[10px] font-mono font-bold uppercase tracking-[2px]`}>
          {message}
        </span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${currentStyle.text} text-[10px] font-mono uppercase font-bold hover:opacity-70 transition-opacity p-2 relative z-10`}
        >
          Dismiss
        </button>
      )}
      <div className={`absolute top-0 right-0 p-4 opacity-5 font-syne font-black text-4xl select-none pointer-events-none ${currentStyle.text}`}>
        {type.toUpperCase()}
      </div>
    </div>
  )
}
