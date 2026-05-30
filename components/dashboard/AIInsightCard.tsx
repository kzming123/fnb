'use client'

import Link from 'next/link'
import { Sparkles, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react'
import { aiInsight } from '@/lib/mock-data/dashboard'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Language } from '@/types'

// ─── Highlight chip ───────────────────────────────────────────────────────────

function HighlightChip({
  label, value, status,
}: {
  label: string; value: string; status: 'good' | 'warning' | 'neutral'
}) {
  const styles = {
    good:    { bg: 'bg-emerald-500/15 border-emerald-400/30', text: 'text-emerald-100', icon: <CheckCircle2 size={10} /> },
    warning: { bg: 'bg-amber-500/20   border-amber-400/30',   text: 'text-amber-100',   icon: <AlertTriangle size={10} /> },
    neutral: { bg: 'bg-white/10       border-white/20',        text: 'text-indigo-100',  icon: <Info size={10} /> },
  }[status]

  return (
    <div className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${styles.bg} ${styles.text}`}>
      {styles.icon}
      <span className="opacity-80">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

// ─── AI Insight Card ─────────────────────────────────────────────────────────

interface AIInsightCardProps {
  /** When false (real account), shows a "log data to unlock insights" placeholder */
  isDemo?: boolean
}

export function AIInsightCard({ isDemo = false }: AIInsightCardProps) {
  const { lang, t, isZh } = useLanguage()

  const insightText = aiInsight.text[lang as Language] ?? aiInsight.text.en
  const generatedTime = new Date(aiInsight.generatedAt).toLocaleTimeString(
    lang === 'zh-CN' ? 'zh-CN' : 'en-MY',
    { hour: '2-digit', minute: '2-digit' }
  )

  // Real users with no data see a placeholder instead of fake demo insights
  if (!isDemo) {
    return (
      <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl ring-1 ring-indigo-200/50 shadow-card min-h-[240px]"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #6d28d9 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        </div>
        <div className="relative flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Sparkles size={18} className="text-white" />
          </div>
          <p className="text-sm font-semibold text-white">
            {isZh ? 'AI 商业洞察' : 'AI Business Insight'}
          </p>
          <p className="text-[13px] text-indigo-200 leading-relaxed max-w-[220px]">
            {isZh
              ? '记录至少 7 天的销售及开销数据后，AI 将为您生成专属分析。'
              : 'Log 7+ days of sales and expenses to unlock your personalised AI insight.'}
          </p>
          <Link
            href="/daily-sales"
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
          >
            {isZh ? '开始记录营业额' : 'Log Daily Sales'}
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl ring-1 ring-indigo-200/50 shadow-card"
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #6d28d9 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute right-1/4 top-1/2 h-20 w-20 rounded-full bg-purple-400/10" />
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">{t('dashboard_ai_insight_title')}</p>
              <p className="mt-0.5 text-[10px] text-indigo-200 leading-none">{t('dashboard_ai_powered')}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
            {generatedTime}
          </span>
        </div>

        {/* Insight text */}
        <p className="text-[13px] leading-relaxed text-indigo-50">
          {insightText}
        </p>

        {/* Highlight chips */}
        <div className="flex flex-wrap gap-1.5">
          {aiInsight.highlights.map((h, i) => (
            <HighlightChip
              key={i}
              label={lang === 'zh-CN' ? h.labelZh : h.labelEn}
              value={h.value}
              status={h.status}
            />
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative border-t border-white/10 px-5 py-3">
        <Link
          href="/pnl-report"
          className="flex items-center justify-between text-xs font-medium text-indigo-200 hover:text-white transition-colors"
        >
          <span>{t('dashboard_view_report')}</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
