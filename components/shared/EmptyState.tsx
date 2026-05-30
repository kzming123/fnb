'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmptyStateAction {
  label:   string
  onClick?: () => void
  href?:   string
  variant?: 'primary' | 'outline'
}

export interface EmptyStateProps {
  icon?:        React.ReactNode
  title:        string
  description?: string
  action?:      EmptyStateAction
  secondAction?: EmptyStateAction
  /** 'page' = full-height section card, 'card' = fills its container, 'inline' = compact row */
  variant?: 'page' | 'card' | 'inline'
  className?: string
}

// ─── Action button / link ─────────────────────────────────────────────────────

function ActionButton({ action }: { action: EmptyStateAction }) {
  const base = 'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400'
  const cls  = action.variant === 'outline'
    ? cn(base, 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50')
    : cn(base, 'bg-indigo-600 text-white hover:bg-indigo-700')

  if (action.href) {
    return <Link href={action.href} className={cls}>{action.label}</Link>
  }
  return (
    <button type="button" onClick={action.onClick} className={cls}>
      {action.label}
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondAction,
  variant = 'card',
  className,
}: EmptyStateProps) {

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3 px-4 py-3 text-sm text-gray-400', className)}>
        {icon && <span className="shrink-0 opacity-50">{icon}</span>}
        <span>{title}</span>
        {action && (
          <ActionButton action={{ ...action, variant: action.variant ?? 'outline' }} />
        )}
      </div>
    )
  }

  const paddingCls = variant === 'page' ? 'py-20' : 'py-14'

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 rounded-2xl bg-white ring-1 ring-gray-100 shadow-card text-center px-6',
      paddingCls,
      className,
    )}>
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
          {icon}
        </div>
      )}

      <div className="max-w-xs">
        <p className="text-sm font-semibold text-gray-700 leading-snug">{title}</p>
        {description && (
          <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">{description}</p>
        )}
      </div>

      {(action || secondAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {action      && <ActionButton action={action} />}
          {secondAction && <ActionButton action={{ ...secondAction, variant: secondAction.variant ?? 'outline' }} />}
        </div>
      )}
    </div>
  )
}
