'use client'

import { useEffect, useState } from 'react'
import { Check, FileText } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const STEP_DURATIONS = [700, 1100, 1000] // ms per step
type StepState = 'pending' | 'active' | 'done'

interface Step {
  key: 'invoice_scan_step_1' | 'invoice_scan_step_2' | 'invoice_scan_step_3'
  durationMs: number
}

const STEPS: Step[] = [
  { key: 'invoice_scan_step_1', durationMs: STEP_DURATIONS[0] },
  { key: 'invoice_scan_step_2', durationMs: STEP_DURATIONS[1] },
  { key: 'invoice_scan_step_3', durationMs: STEP_DURATIONS[2] },
]

function StepRow({ label, state, index }: { label: string; state: StepState; index: number }) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300',
      state === 'active' ? 'bg-indigo-50' : '',
    )}>
      {/* Step indicator */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center">
        {state === 'done' && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
            <Check size={12} className="text-emerald-600" strokeWidth={3} />
          </span>
        )}
        {state === 'active' && (
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
            <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-40" />
            <span className="text-[10px] font-bold text-white">{index + 1}</span>
          </span>
        )}
        {state === 'pending' && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-200">
            <span className="text-[10px] font-medium text-gray-300">{index + 1}</span>
          </span>
        )}
      </div>

      <span className={cn(
        'flex-1 text-sm font-medium transition-colors',
        state === 'done'    && 'text-emerald-700',
        state === 'active'  && 'text-indigo-700 font-semibold',
        state === 'pending' && 'text-gray-400',
      )}>
        {label}
      </span>

      {state === 'active' && (
        <span className="flex gap-0.5 items-center">
          {[0, 1, 2].map(i => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </span>
      )}
    </div>
  )
}

export function ScanningState() {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [scanLine, setScanLine] = useState(0) // 0–100 scan line position

  useEffect(() => {
    let elapsed = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => setCurrentStep(i + 1), elapsed))
      elapsed += step.durationMs
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  // Scan line animation
  useEffect(() => {
    let frame: number
    let start: number | null = null
    const duration = 2000

    function animate(ts: number) {
      if (!start) start = ts
      const pct = ((ts - start) % duration) / duration
      setScanLine(Math.round(pct * 100))
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  const stepState = (idx: number): StepState => {
    if (idx + 1 < currentStep) return 'done'
    if (idx + 1 === currentStep) return 'active'
    return 'pending'
  }

  return (
    <div className="flex flex-col items-center gap-7 rounded-2xl bg-white px-6 py-10 ring-1 ring-indigo-100 shadow-card">

      {/* ── Document with scanning line ─────────────────────────────────────── */}
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 -m-3 rounded-2xl bg-indigo-500/5 blur-xl" />

        {/* Document card */}
        <div className="relative w-40 h-52 rounded-xl bg-gray-50 ring-1 ring-gray-200 shadow-md overflow-hidden">
          {/* Document content shimmer lines */}
          <div className="p-4 space-y-2.5 mt-2">
            <div className="h-2.5 w-24 rounded-full bg-gray-200" />
            <div className="h-2 w-32 rounded-full bg-gray-100" />
            <div className="mt-3 h-px bg-gray-200" />
            <div className="space-y-1.5 pt-1">
              {[28, 24, 30, 20, 26].map((w, i) => (
                <div key={i} className="h-1.5 rounded-full bg-gray-100" style={{ width: `${w * 1.1}px` }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between">
              <div className="h-2 w-12 rounded-full bg-gray-100" />
              <div className="h-2 w-14 rounded-full bg-indigo-100" />
            </div>
          </div>

          {/* Scanning line */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-90 transition-none"
            style={{ top: `${scanLine}%` }}
          />
          {/* Scan glow */}
          <div
            className="absolute left-0 right-0 h-6 bg-gradient-to-b from-indigo-500/0 via-indigo-500/8 to-indigo-500/0 pointer-events-none"
            style={{ top: `calc(${scanLine}% - 12px)` }}
          />

          {/* Document icon */}
          <div className="absolute top-3 right-3">
            <FileText size={14} className="text-gray-300" />
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-300/50">
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        </div>
      </div>

      {/* ── Headline ────────────────────────────────────────────────────────── */}
      <div className="text-center">
        <p className="text-base font-bold text-gray-800">{t('invoice_scanning')}</p>
        <p className="mt-1 text-xs text-gray-400 max-w-[260px] mx-auto leading-relaxed">
          {t('invoice_mock_note')}
        </p>
      </div>

      {/* ── Progress steps ───────────────────────────────────────────────────── */}
      <div className="w-full max-w-xs space-y-1.5">
        {STEPS.map((step, i) => (
          <StepRow key={step.key} label={t(step.key)} state={stepState(i)} index={i} />
        ))}
      </div>
    </div>
  )
}
