import React, { useEffect, useState } from 'react'

export type NotificationType = 'success' | 'error' | 'info'

interface NotificationProps {
  message: string
  type: NotificationType
  onClose: () => void
  duration?: number
}

export function Notification({ message, type, onClose, duration = 5000 }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 500) // Allow for fade-out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
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
    <div className={`fixed top-8 right-8 z-50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
      <div role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'} className={`flex items-center gap-4 px-6 py-4 rounded-sm border ${currentStyle.bg} ${currentStyle.border}`}>
        <div className={`w-2 h-2 ${currentStyle.accent} animate-pulse`} />
        <span className={`text-[10px] font-mono font-bold uppercase tracking-[2px] ${currentStyle.text}`}>
          {message}
        </span>
        <button
          aria-label="Dismiss notification"
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 500)
          }}
          className={`ml-4 text-[12px] font-mono hover:scale-110 transition-transform ${currentStyle.text}`}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
