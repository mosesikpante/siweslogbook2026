import { useState, useEffect, useCallback } from 'react'

// ─── TOAST STYLES (injected once) ───────────────────────────
const toastStyles = `
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    min-width: 260px;
    max-width: 380px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    pointer-events: all;
    animation: toastIn 0.25s ease;
    border: 1px solid transparent;
  }
  .toast.removing {
    animation: toastOut 0.2s ease forwards;
  }
  .toast.success {
    background: #f0fdf4;
    color: #15803d;
    border-color: #bbf7d0;
  }
  .toast.error {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
  }
  .toast.info {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }
  .toast.warning {
    background: #fffbeb;
    color: #92400e;
    border-color: #fde68a;
  }
  .toast-icon { font-size: 16px; flex-shrink: 0; }
  .toast-message { flex: 1; line-height: 1.4; }
  .toast-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: currentColor;
    opacity: 0.5;
    padding: 0 2px;
    line-height: 1;
    flex-shrink: 0;
  }
  .toast-close:hover { opacity: 1; }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(20px) scale(0.95); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateX(0) scale(1); }
    to   { opacity: 0; transform: translateX(20px) scale(0.95); }
  }
`

const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }
const listeners = []
export function showToast(message, type = 'success', duration = 3500) {
  listeners.forEach(fn => fn({ message, type, duration, id: Date.now() + Math.random() }))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, { ...toast, removing: false }])

    // Start fade-out animation before removing
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => t.id === toast.id ? { ...t, removing: true } : t)
      )
    }, toast.duration)

    // Remove from DOM after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
    }, toast.duration + 220)
  }, [])

  useEffect(() => {
    listeners.push(addToast)
    return () => {
      const i = listeners.indexOf(addToast)
      if (i > -1) listeners.splice(i, 1)
    }
  }, [addToast])

  const dismiss = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
  }

  if (!toasts.length) return (
    <style>{toastStyles}</style>
  )

  return (
    <>
      <style>{toastStyles}</style>
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type} ${toast.removing ? 'removing' : ''}`}>
            <span className="toast-icon">{ICONS[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => dismiss(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </>
  )
}