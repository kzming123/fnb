'use client'

import { AlertTriangle, RefreshCw, WifiOff, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorVariant = 'page' | 'card' | 'inline'

export interface ErrorStateProps {
  title?:     string
  message:    string
  onRetry?:   () => void
  retryLabel?: string
  variant?:   ErrorVariant
  /** Swap the default alert icon for a different one */
  icon?:      'alert' | 'wifi' | 'building'
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'card',
  icon = 'alert',
  className,
}: ErrorStateProps) {
  const Icon = icon === 'wifi' ? WifiOff : icon === 'building' ? Building2 : AlertTriangle

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100', className)}>
        <Icon size={15} className="shrink-0 text-red-500" />
        <span className="flex-1 leading-snug">{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 transition-colors shrink-0"
          >
            <RefreshCw size={11} />
            {retryLabel}
          </button>
        )}
      </div>
    )
  }

  const paddingCls = variant === 'page' ? 'py-20' : 'py-12'

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 rounded-2xl bg-white ring-1 ring-red-100 shadow-card text-center px-6',
      paddingCls,
      className,
    )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <Icon size={24} className="text-red-400" />
      </div>

      <div className="max-w-xs">
        {title && (
          <p className="text-sm font-bold text-red-800 mb-1">{title}</p>
        )}
        <p className="text-xs text-red-600 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <RefreshCw size={14} />
          {retryLabel}
        </button>
      )}
    </div>
  )
}
