'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Globe, CreditCard, User, Users, Shield, LogOut,
  Save, Check, BrainCircuit, Receipt, ChevronRight, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useCurrentBusiness } from '@/lib/supabase/useCurrentBusiness'
import { can } from '@/lib/auth/permissions'
import type { TranslationKey } from '@/lib/i18n/translations'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon, title, badge, children,
}: {
  icon: React.ReactNode
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-50 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        <h3 className="flex-1 text-sm font-bold text-gray-800">{title}</h3>
        {badge && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Field label ──────────────────────────────────────────────────────────────

function FieldLabel({ k, t }: { k: TranslationKey; t: (k: TranslationKey) => string }) {
  return (
    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
      {t(k)}
    </label>
  )
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  label, value, action,
}: {
  label: string; value: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{value}</p>
      </div>
      {action}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ProfileForm = {
  businessName: string
  businessType: string
  ownerName:    string
  email:        string
  phone:        string
  address:      string
}

export default function SettingsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { businessId, userId, userRole, loading: bizLoading } = useCurrentBusiness()
  const canAccessSettings = can(userRole, 'access_settings')

  const [profile, setProfile] = useState<ProfileForm>({
    businessName: '', businessType: 'restaurant',
    ownerName: '', email: '', phone: '', address: '',
  })
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [saveError,      setSaveError]      = useState('')
  // When true, bypass ALL loading states and render the page immediately.
  //
  // WHY THIS EXISTS (intentional safety net, not a band-aid for a logic bug):
  // useCurrentBusiness() resolves loading=false in every branch, so the only way
  // the page can spin forever is if supabase.auth.getUser() never settles — which
  // can happen on serverless/edge when the auth network call stalls (observed on
  // Vercel). Rather than trap the owner on a blank spinner, we force-render after
  // 4 s. The real data still populates later via the load() effect once (or if)
  // the queries resolve, so nothing is lost — worst case the fields briefly show
  // empty and then fill in. Do not remove without a verified fix for the stall.
  const [hardTimedOut,   setHardTimedOut]   = useState(false)

  // ── Hard timeout — never spin forever ────────────────────────────────────
  // Fires after 4 s regardless of bizLoading or profileLoading state.
  useEffect(() => {
    const timer = setTimeout(() => {
      setHardTimedOut(true)
      setProfileLoading(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  // ── Load real data from Supabase ──────────────────────────────────────────
  useEffect(() => {
    if (bizLoading) return
    // No business/user — stop spinner immediately so the page renders
    if (!businessId || !userId) {
      setProfileLoading(false)
      return
    }

    async function load() {
      try {
        const supabase = createClient()
        const [bizRes, profileRes] = await Promise.all([
          supabase
            .from('businesses')
            .select('business_name, business_type, phone, address')
            .eq('id', businessId)
            .single(),
          supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .single(),
        ])
        setProfile({
          businessName: (bizRes.data?.business_name as string) ?? '',
          businessType: (bizRes.data?.business_type as string) ?? 'restaurant',
          ownerName:    (profileRes.data?.full_name as string) ?? '',
          email:        (profileRes.data?.email as string) ?? '',
          phone:        (bizRes.data?.phone as string) ?? '',
          address:      (bizRes.data?.address as string) ?? '',
        })
      } catch {
        // Data load failed — page still renders with empty fields
      } finally {
        setProfileLoading(false)
      }
    }

    load()
  }, [businessId, userId, bizLoading])

  // ── Save profile to Supabase ──────────────────────────────────────────────
  async function handleSave() {
    if (!businessId || !userId) return
    setSaving(true)
    setSaveError('')
    try {
      const supabase = createClient()
      const [bizUpdate, profileUpdate] = await Promise.all([
        supabase.from('businesses').update({
          business_name: profile.businessName.trim() || undefined,
          business_type: profile.businessType,
          phone:         profile.phone.trim()   || null,
          address:       profile.address.trim() || null,
        }).eq('id', businessId),
        supabase.from('profiles').update({
          full_name: profile.ownerName.trim() || null,
        }).eq('id', userId),
      ])
      if (bizUpdate.error) throw new Error(bizUpdate.error.message)
      if (profileUpdate.error) throw new Error(profileUpdate.error.message)

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function setField(k: keyof ProfileForm, v: string) {
    setProfile(prev => ({ ...prev, [k]: v }))
    setSaved(false)
  }

  const inputCls  = 'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow placeholder:text-gray-300'
  const selectCls = `${inputCls} text-gray-700`

  const businessTypes = [
    { value: 'restaurant',    labelKey: 'settings_type_restaurant'    as TranslationKey },
    { value: 'cafe',          labelKey: 'settings_type_cafe'          as TranslationKey },
    { value: 'bakery',        labelKey: 'settings_type_bakery'        as TranslationKey },
    { value: 'cloud_kitchen', labelKey: 'settings_type_cloud_kitchen' as TranslationKey },
    { value: 'food_stall',    labelKey: 'settings_type_food_stall'    as TranslationKey },
    { value: 'catering',      labelKey: 'settings_type_catering'      as TranslationKey },
    { value: 'other',         labelKey: 'settings_type_other'         as TranslationKey },
  ]

  if (!hardTimedOut && (bizLoading || profileLoading)) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">{t('loading')}</span>
      </div>
    )
  }

  if (businessId && !canAccessSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Shield size={36} className="text-gray-300" />
        <p className="text-base font-semibold text-gray-700">{t('access_denied_title')}</p>
        <p className="text-sm text-gray-400 max-w-xs">{t('access_denied_sub')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">

      <div>
        <h2 className="text-lg font-bold text-gray-900">{t('settings_title')}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{t('settings_business_profile')}</p>
      </div>

      {/* ── 1. Business Profile ────────────────────────────────────────── */}
      <Section icon={<Building2 size={15} />} title={t('settings_business_profile')}>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel k="settings_business_name" t={t} />
            <input type="text" value={profile.businessName}
              onChange={e => setField('businessName', e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="settings_business_type" t={t} />
              <select value={profile.businessType}
                onChange={e => setField('businessType', e.target.value)}
                className={selectCls}
              >
                {businessTypes.map(bt => (
                  <option key={bt.value} value={bt.value}>{t(bt.labelKey)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="settings_currency" t={t} />
              <div className={cn(inputCls, 'flex items-center gap-2 bg-gray-50 cursor-default text-gray-500')}>
                <span>🇲🇾</span>
                <span className="font-medium">MYR — Malaysian Ringgit</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="settings_owner_name" t={t} />
              <input type="text" value={profile.ownerName}
                onChange={e => setField('ownerName', e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel k="settings_email" t={t} />
              <input type="email" value={profile.email}
                readOnly
                className={cn(inputCls, 'bg-gray-50 cursor-default text-gray-500')}
                title="Email cannot be changed here"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel k="settings_phone" t={t} />
            <input type="tel" value={profile.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="+60 12-345 6789"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel k="settings_address" t={t} />
            <textarea
              value={profile.address}
              onChange={e => setField('address', e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-300"
            />
          </div>

          {saveError && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 px-3 py-2">{saveError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving || bizLoading}
              className={cn('gap-1.5 transition-all', saved && 'bg-emerald-600 hover:bg-emerald-700')}>
              {saving
                ? <><Loader2 size={13} className="animate-spin" />{t('settings_saving')}</>
                : saved
                ? <><Check size={14} />{t('saved')}</>
                : <><Save size={14} />{t('save')}</>}
            </Button>
            {saved && (
              <p className="text-xs text-emerald-600 font-medium">{t('success')}</p>
            )}
          </div>
        </div>
      </Section>

      {/* ── 2. Language ────────────────────────────────────────────────── */}
      <Section icon={<Globe size={15} />} title={t('settings_language')}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">{t('settings_display_language')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('settings_language_hint')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </Section>

      {/* ── 3. Currency ───────────────────────────────────────────────── */}
      <Section icon={<CreditCard size={15} />} title={t('settings_currency')}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">{t('settings_currency')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('settings_currency_hint')}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700">
            <span>🇲🇾</span> MYR
          </div>
        </div>
      </Section>

      {/* ── 4. Tax Settings (placeholder) ─────────────────────────────── */}
      <Section icon={<Receipt size={15} />} title={t('settings_tax_title')} badge={t('settings_coming_soon')}>
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-4 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">{t('settings_tax_note')}</p>
          <div className="space-y-2">
            {[
              { label: 'SST Rate', value: '6%' },
              { label: 'Tax Registration No.', value: 'W10-1809-32000019' },
              { label: 'Filing Frequency', value: 'Bi-monthly' },
            ].map(item => (
              <div key={item.label}
                className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 opacity-50 cursor-not-allowed">
                <span className="text-xs font-medium text-gray-500">{item.label}</span>
                <span className="text-xs text-gray-400">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 5. AI & OCR Settings (placeholder) ────────────────────────── */}
      <Section icon={<BrainCircuit size={15} />} title={t('settings_ai_title')} badge={t('settings_coming_soon')}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-indigo-700">{t('settings_mock_mode')}</p>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">{t('settings_ai_note')}</p>

          <div className="space-y-2 opacity-50 cursor-not-allowed">
            {[
              { label: 'OCR Provider',                 value: 'Mock (no API key)' },
              { label: 'AI Model',                     value: 'Claude Haiku (fast)' },
              { label: 'Auto-categorize line items',   value: 'Enabled' },
              { label: 'Confidence threshold',         value: '70%' },
            ].map(row => (
              <div key={row.label}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="text-xs font-medium text-gray-500">{row.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">{row.value}</span>
                  <ChevronRight size={12} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 6. Team & Staff Management (Phase 4 placeholder) ─────────── */}
      <Section icon={<Users size={15} />} title={t('settings_team_title')} badge={t('settings_team_phase4')}>
        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
            <p className="text-xs font-semibold text-indigo-700">{t('settings_team_single_owner')}</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{t('settings_team_note')}</p>
          <div className="space-y-2 opacity-40 cursor-not-allowed select-none">
            {[
              { label: 'Invite team member',   value: 'Coming soon' },
              { label: 'Assign roles',         value: 'Coming soon' },
              { label: 'Manage permissions',   value: 'Coming soon' },
            ].map(row => (
              <div key={row.label}
                className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/60 px-3 py-2.5">
                <span className="text-xs font-medium text-gray-500">{row.label}</span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-400">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 7. Account ────────────────────────────────────────────────── */}
      <Section icon={<User size={15} />} title={t('settings_account')}>
        <div className="divide-y divide-gray-50">
          <InfoRow
            label={t('settings_email')}
            value={profile.email}
          />
          <InfoRow
            label={t('settings_change_password')}
            value={t('settings_last_changed')}
            action={
              <Button variant="outline" size="sm" disabled>
                {t('settings_coming_soon')}
              </Button>
            }
          />
        </div>
      </Section>

      {/* ── 7. Danger Zone ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-red-100 bg-red-50/40 overflow-hidden ring-1 ring-red-100">
        <div className="flex items-center gap-3 border-b border-red-100 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Shield size={15} />
          </div>
          <h3 className="text-sm font-bold text-gray-800">{t('settings_danger_zone')}</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">{t('settings_logout')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings_logout_subtitle')}</p>
            </div>
            <Button variant="destructive" size="sm" className="gap-1.5 shrink-0" onClick={handleLogout}>
              <LogOut size={14} />{t('settings_logout')}
            </Button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        F&amp;B Smart Ledger v0.1.0 · &copy; 2026
      </p>
    </div>
  )
}
