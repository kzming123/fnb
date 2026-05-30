'use client'

import { useEffect, useCallback } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open:         boolean
  title:        string
  message:      string
  confirmLabel?: string
  cancelLabel?:  string
  /** Red destructive confirm button when true (default true) */
  destructive?:  boolean
  loading?:      boolean
  onConfirm:    () => void
  onCancel:     () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel  = 'Cancel',
  destructive  = true,
  loading      = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) onCancel()
  }, [onCancel, loading])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        'transition-opacity duration-200',
      )}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => !loading && onCancel()}
      />

      {/* Dialog card */}
      <div className={cn(
        'relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-100',
        'animate-in zoom-in-95 fade-in duration-200',
      )}>
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={cn(
            'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl',
            destructive ? 'bg-red-50' : 'bg-amber-50',
          )}>
            <AlertTriangle size={22} className={destructive ? 'text-red-500' : 'text-amber-500'} />
          </div>

          {/* Content */}
          <h2 id="confirm-title" className="text-center text-base font-bold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              size="sm"
              className={cn(
                'flex-1 h-10',
                destructive
                  ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400 shadow-sm'
                  : '',
              )}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {confirmLabel}
                </span>
              ) : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
