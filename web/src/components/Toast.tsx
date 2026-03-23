import { useEffect } from 'react'

export function Toast({
  message,
  onClose,
  ms = 1600,
}: {
  message: string | null
  onClose: () => void
  ms?: number
}) {
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(onClose, ms)
    return () => window.clearTimeout(t)
  }, [message, ms, onClose])

  if (!message) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 18,
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.82)',
        color: '#fff',
        padding: '10px 12px',
        borderRadius: 12,
        fontSize: 13,
        maxWidth: 320,
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      {message}
    </div>
  )
}
