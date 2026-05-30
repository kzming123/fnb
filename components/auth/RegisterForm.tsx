'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_EXPENSE_CATEGORIES } from '@/lib/supabase/default-categories'

type FormState = {
  fullName:        string
  businessName:    string
  businessType:    string
  email:           string
  password:        string
  confirmPassword: string
}

export function RegisterForm() {
  const router = useRouter()
  const { t } = useLanguage()

  const [form, setForm] = useState<FormState>({
    fullName: '', businessName: '', businessType: 'restaurant',
    email: '', password: '', confirmPassword: '',
  })
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [checkEmail, setCheckEmail] = useState(false)

  function setField(k: keyof FormState, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError(t('auth_passwords_mismatch'))
      return
    }
    if (form.password.length < 8) {
      setError(t('auth_password_too_short'))
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options:  {
        // Store businessName + businessType in metadata so the /auth/callback
        // route can use them when email confirmation is required.
        data: {
          full_name:     form.fullName,
          business_name: form.businessName,
          business_type: form.businessType,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Immediate-session path (email confirmation disabled in Supabase project)
    if (data.user && data.session) {
      const userId     = data.user.id
      const businessId = crypto.randomUUID()

      // Create business profile
      const { error: bizError } = await supabase.from('businesses').insert({
        id:                 businessId,
        user_id:            userId,
        business_name:      form.businessName,
        business_type:      form.businessType,
        currency:           'MYR',
        preferred_language: 'en',
      })

      if (bizError) {
        setError(bizError.message)
        setLoading(false)
        return
      }

      // Seed all 16 default expense categories for the new business
      const { error: catError } = await supabase.from('expense_categories').insert(
        DEFAULT_EXPENSE_CATEGORIES.map(c => ({
          business_id: businessId,
          user_id:     userId,
          name:        c.name,
          type:        c.type,
        }))
      )
      if (catError) {
        // Non-fatal: categories can be re-seeded; don't block registration
        console.error('Failed to seed expense categories:', catError.message)
      }

      router.push('/dashboard')
      router.refresh()
      return
    }

    // Email-confirmation path — user needs to click the link in their inbox
    // The /auth/callback route handles business + category creation on confirmation
    if (!data.session) {
      setCheckEmail(true)
      setLoading(false)
    }
  }

  // ── Check-email state ────────────────────────────────────────────────────────

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
          <Mail size={26} className="text-indigo-600" />
        </div>
        <h3 className="text-base font-bold text-gray-800">{t('auth_check_email_title')}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{t('auth_check_email_sub')}</p>
      </div>
    )
  }

  // ── Registration form ────────────────────────────────────────────────────────

  const businessTypes = [
    { value: 'restaurant',    label: t('settings_type_restaurant') },
    { value: 'cafe',          label: t('settings_type_cafe') },
    { value: 'bakery',        label: t('settings_type_bakery') },
    { value: 'cloud_kitchen', label: t('settings_type_cloud_kitchen') },
    { value: 'food_stall',    label: t('settings_type_food_stall') },
    { value: 'catering',      label: t('settings_type_catering') },
    { value: 'other',         label: t('settings_type_other') },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{t('auth_sign_up')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('auth_register_subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label={t('settings_owner_name')}
        type="text"
        placeholder="Ahmad bin Abdullah"
        value={form.fullName}
        onChange={e => setField('fullName', e.target.value)}
        required
      />

      <Input
        label={t('auth_business_name')}
        type="text"
        placeholder="Restaurant ABC"
        value={form.businessName}
        onChange={e => setField('businessName', e.target.value)}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          {t('settings_business_type')} <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={form.businessType}
          onChange={e => setField('businessType', e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {businessTypes.map(bt => (
            <option key={bt.value} value={bt.value}>{bt.label}</option>
          ))}
        </select>
      </div>

      <Input
        label={t('auth_email')}
        type="email"
        placeholder="owner@restaurant.my"
        value={form.email}
        onChange={e => setField('email', e.target.value)}
        required
        autoComplete="email"
      />

      <Input
        label={t('auth_password')}
        type="password"
        placeholder="Min. 8 characters"
        value={form.password}
        onChange={e => setField('password', e.target.value)}
        required
        autoComplete="new-password"
      />

      <Input
        label={t('auth_confirm_password')}
        type="password"
        placeholder="Repeat password"
        value={form.confirmPassword}
        onChange={e => setField('confirmPassword', e.target.value)}
        required
        autoComplete="new-password"
        error={
          form.confirmPassword && form.password !== form.confirmPassword
            ? t('auth_passwords_mismatch')
            : undefined
        }
      />

      <Button type="submit" className="mt-1 w-full" disabled={loading} size="lg">
        {loading ? t('saving') : t('auth_sign_up')}
      </Button>

      <p className="text-center text-[11px] text-gray-400">{t('auth_terms')}</p>

      <p className="text-center text-xs text-gray-500">
        {t('auth_have_account')}{' '}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          {t('auth_login_link')}
        </Link>
      </p>
    </form>
  )
}
