import { useEffect, useState } from 'react'
import { onToast } from '../lib/toast'

interface ToastItem {
  id: string
  message: string
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    return onToast((message) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, message }])
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id))
      }, 3400)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((item) => (
        <p key={item.id} className="toast">
          {item.message}
        </p>
      ))}
    </div>
  )
}
