'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, ArrowLeft, Check, Store, Utensils, Coffee, Cake, Truck, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { completeOnboarding } from '@/lib/supabase/queries/business'
import type { TranslationKey } from '@/lib/i18n/translations'

// ─── Constants ────────────────────────────────────────────────────────────────

const BIZ_TYPES: Array<{ value: string; labelKey: TranslationKey; icon: React.ElementType }> = [
  { value: 'restaurant',    labelKey: 'settings_type_restaurant',    icon: Utensils },
  { value: 'cafe',          labelKey: 'settings_type_cafe',          icon: Coffee },
  { value: 'bakery',        labelKey: 'settings_type_bakery',        icon: Cake },
  { value: 'cloud_kitchen', labelKey: 'settings_type_cloud_kitchen', icon: Store },
  { value: 'food_stall',    labelKey: 'settings_type_food_stall',    icon: ChefHat },
  { value: 'catering',      labelKey: 'settings_type_catering',      icon: Truck },
]

const CHANNELS: Array<{ value: string; labelKey: TranslationKey; emoji: string }> = [
  { value: 'dine_in',   labelKey: 'onboarding_ch_dine_in',   emoji: '🍽️' },
  { value: 'takeaway',  labelKey: 'onboarding_ch_takeaway',  emoji: '📦' },
  { value: 'grab',      labelKey: 'onboarding_ch_grab',      emoji: '🟢' },
  { value: 'foodpanda', labelKey: 'onboarding_ch_foodpanda', emoji: '🐼' },
  { value: 'catering',  labelKey: 'onboarding_ch_catering',  emoji: '🎉' },
]

const COGS_CATS: Array<{ emoji: string; labelKey: TranslationKey }> = [
  { emoji: '🥩', labelKey: 'cat_meat' },
  { emoji: '🦐', labelKey: 'cat_seafood' },
  { emoji: '🥬', labelKey: 'cat_vegetables' },
  { emoji: '🌾', labelKey: 'cat_dry_goods' },
  { emoji: '🧃', labelKey: 'cat_beverages' },
  { emoji: '📦', labelKey: 'cat_packaging' },
  { emoji: '🧂', labelKey: 'exp_cat_sauce' },
]

const OPEX_CATS: Array<{ emoji: string; labelKey: TranslationKey }> = [
  { emoji: '🏪', labelKey: 'expenses_cat_rent' },
  { emoji: '👥', labelKey: 'expenses_cat_salaries' },
  { emoji: '💡', labelKey: 'expenses_cat_utilities' },
  { emoji: '📣', labelKey: 'expenses_cat_marketing' },
]

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-7">
      {[1, 2, 3].map(n => (
        <div
          key={n}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-all duration-300',
            n <= step ? 'bg-indigo-600' : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  )
}

// ─── Chip toggle ──────────────────────────────────────────────────────────────

function Chip({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
        selected
          ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/40'
      )}
    >
      {selected && <Check size={13} className="shrink-0 text-indigo-600" />}
      {children}
    </button>
  )
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{children}</label>
}

const inputCls = 'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow placeholder:text-gray-300'

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  businessId:    string
  initialName:   string
  initialType:   string
  initialPhone:  string
  initialAddress:string
}

export function OnboardingFlow({ businessId, initialName, initialType, initialPhone, initialAddress }: Props) {
  const { t, isZh } = useLanguage()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Step 1 form
  const [name,    setName]    = useState(initialName)
  const [type,    setType]    = useState(initialType || 'restaurant')
  const [phone,   setPhone]   = useState(initialPhone)
  const [address, setAddress] = useState(initialAddress)
  const [nameErr, setNameErr] = useState('')

  // Step 2 channels (pre-select common ones)
  const [channels, setChannels] = useState<Set<string>>(new Set(['dine_in', 'takeaway']))

  // ── Step label ──────────────────────────────────────────────────────────────
  const stepLabel = step === 1 ? t('onboarding_step1_of3')
                  : step === 2 ? t('onboarding_step2_of3')
                  :              t('onboarding_step3_of3')

  // ── Step 1 validation + advance ────────────────────────────────────────────
  function handleStep1Next() {
    if (!name.trim()) { setNameErr(t('required')); return }
    setNameErr('')
    setStep(2)
  }

  // ── Final save ──────────────────────────────────────────────────────────────
  async function handleComplete() {
    setSaving(true)
    setSaveError('')
    try {
      await completeOnboarding(businessId, {
        businessName: name.trim(),
        businessType: type,
        phone:        phone.trim() || null,
        address:      address.trim() || null,
      })
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      setSaveError(String(e))
      setSaving(false)
    }
  }

  // ── Toggle channel ──────────────────────────────────────────────────────────
  function toggleChannel(v: string) {
    setChannels(prev => {
      const next = new Set(prev)
      next.has(v) ? next.delete(v) : next.add(v)
      return next
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* ── Welcome headline (shown only on step 1) ─────────────────────── */}
      {step === 1 && (
        <div className="mb-6 text-center">
          <p className="text-2xl font-bold text-gray-900">{t('onboarding_welcome')}</p>
          <p className="mt-1.5 text-sm text-gray-500">{t('onboarding_welcome_sub')}</p>
        </div>
      )}

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-lg p-6 sm:p-7">

        {/* Progress */}
        <ProgressBar step={step} />

        {/* Step label */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 mb-1">
          {stepLabel}
        </p>

        {/* ── STEP 1: Business Profile ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-gray-900">{t('onboarding_step1_title')}</p>
              <p className="mt-0.5 text-sm text-gray-500">{t('onboarding_step1_sub')}</p>
            </div>

            {/* Business name */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t('onboarding_biz_name')} *</FieldLabel>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameErr('') }}
                placeholder={isZh ? '例：槟城好味道咖啡' : 'e.g. Kopitiam Maju Jaya'}
                className={cn(inputCls, nameErr && 'border-red-400 focus:ring-red-400')}
              />
              {nameErr && <p className="text-[11px] text-red-500">{nameErr}</p>}
            </div>

            {/* Business type */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t('onboarding_biz_type')}</FieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BIZ_TYPES.map(bt => {
                  const Icon = bt.icon
                  const selected = type === bt.value
                  return (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => setType(bt.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all',
                        selected
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                      )}
                    >
                      <Icon size={18} className={selected ? 'text-indigo-600' : 'text-gray-400'} />
                      {t(bt.labelKey)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t('onboarding_phone')} <span className="normal-case font-normal text-gray-400">({t('optional')})</span></FieldLabel>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+60 12-345 6789"
                className={inputCls}
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t('onboarding_address')} <span className="normal-case font-normal text-gray-400">({t('optional')})</span></FieldLabel>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={isZh ? '例：Lot 5, Jalan SS2/24' : 'e.g. Lot 5, Jalan SS2/24'}
                className={inputCls}
              />
            </div>

            <Button onClick={handleStep1Next} className="w-full gap-2 mt-2" size="lg">
              {t('onboarding_next')}
              <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {/* ── STEP 2: Sales Channels ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-gray-900">{t('onboarding_step2_title')}</p>
              <p className="mt-0.5 text-sm text-gray-500">{t('onboarding_step2_sub')}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {CHANNELS.map(ch => (
                <Chip
                  key={ch.value}
                  selected={channels.has(ch.value)}
                  onClick={() => toggleChannel(ch.value)}
                >
                  <span>{ch.emoji}</span>
                  {t(ch.labelKey)}
                </Chip>
              ))}
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              {isZh
                ? '每个渠道的销售额将在「每日营业额」页面分开记录，方便追踪各渠道表现。'
                : 'Each channel\'s revenue is tracked separately in Daily Sales, giving you a clear breakdown.'}
            </p>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5 flex-1">
                <ArrowLeft size={15} />
                {t('onboarding_back')}
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2 flex-1">
                {t('onboarding_next')}
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Cost Tracking Preview + Complete ────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-gray-900">{t('onboarding_step3_title')}</p>
              <p className="mt-0.5 text-sm text-gray-500">{t('onboarding_step3_sub')}</p>
            </div>

            {/* COGS categories */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-2">
                {t('onboarding_cogs_label')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {COGS_CATS.map(c => (
                  <span key={c.labelKey} className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 border border-amber-100">
                    {c.emoji} {t(c.labelKey)}
                  </span>
                ))}
              </div>
            </div>

            {/* OpEx categories */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
                {t('onboarding_opex_label')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {OPEX_CATS.map(c => (
                  <span key={c.labelKey} className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 border border-indigo-100">
                    {c.emoji} {t(c.labelKey)}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-400">{t('onboarding_cat_note')}</p>

            {saveError && (
              <div className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600 ring-1 ring-red-100">
                {saveError}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={saving} className="gap-1.5 flex-1">
                <ArrowLeft size={15} />
                {t('onboarding_back')}
              </Button>
              <Button onClick={handleComplete} disabled={saving} className="gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200">
                {saving
                  ? <><Loader2 size={14} className="animate-spin" />{t('onboarding_saving')}</>
                  : <><Check size={14} />{t('onboarding_complete')}</>
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
