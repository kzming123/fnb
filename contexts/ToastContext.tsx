'use client'

import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode,
} from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id:       string
  message:  string
  variant:  ToastVariant
  duration: number
}

interface ToastContextValue {
  toast:   (message: string, variant?: ToastVariant, duration?: number) => void
  success: (message: string) => void
  error:   (message: string) => void
  warning: (message: string) => void
  info:    (message: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── Single toast item ────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { bar: string; icon: string; bg: string; border: string }> = {
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-500', bg: 'bg-white',       border: 'border-emerald-100' },
  error:   { bar: 'bg-red-500',     icon: 'text-red-500',     bg: 'bg-white',       border: 'border-red-100' },
  warning: { bar: 'bg-amber-400',   icon: 'text-amber-500',   bg: 'bg-white',       border: 'border-amber-100' },
  info:    { bar: 'bg-indigo-500',  icon: 'text-indigo-500',  bg: 'bg-white',       border: 'border-indigo-100' },
}

const VARIANT_ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertCircle,
  info:    Info,
}

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const style = VARIANT_STYLES[t.variant]
  const Icon  = VARIANT_ICONS[t.variant]

  // Enter animation
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 16)
    return () => clearTimeout(id)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    const id = setTimeout(() => dismiss(), t.duration)
    return () => clearTimeout(id)
  }, [t.duration]) // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() {
    setLeaving(true)
    setTimeout(() => onDismiss(t.id), 250)
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex w-[340px] max-w-[calc(100vw-32px)] items-start gap-3 overflow-hidden',
        'rounded-xl border shadow-lg shadow-black/8 px-4 py-3',
        'transition-all duration-250 ease-out',
        style.bg, style.border,
        visible && !leaving ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
    >
      {/* Accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', style.bar)} />

      {/* Icon */}
      <Icon size={17} className={cn('mt-0.5 shrink-0', style.icon)} />

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-gray-800 leading-snug pr-1">{t.message}</p>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((
    message:  string,
    variant:  ToastVariant = 'info',
    duration: number = 4000,
  ) => {
    const id = String(++counterRef.current)
    setToasts(prev => {
      // Cap at 4 stacked toasts
      const capped = prev.length >= 4 ? prev.slice(-3) : prev
      return [...capped, { id, message, variant, duration }]
    })
  }, [])

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast])
  const error   = useCallback((msg: string) => toast(msg, 'error',   5000), [toast])
  const warning = useCallback((msg: string) => toast(msg, 'warning'), [toast])
  const info    = useCallback((msg: string) => toast(msg, 'info'),    [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* ── Toast viewport ───────────────────────────────────────────────── */}
      <div
        aria-label="Notifications"
        className="fixed bottom-5 right-4 z-[200] flex flex-col-reverse gap-2 pointer-events-none"
        style={{ isolation: 'isolate' }}
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
