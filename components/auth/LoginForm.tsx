'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { setDemoCookie } from '@/lib/supabase/useCurrentBusiness'

export function LoginForm() {
  const router = useRouter()
  const { t, isZh } = useLanguage()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(
        authError.message.toLowerCase().includes('invalid')
          ? t('auth_invalid_credentials')
          : t('error')
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{t('auth_sign_in')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('auth_login_subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label={t('auth_email')}
        type="email"
        placeholder="owner@restaurant.my"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label={t('auth_password')}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="pointer-events-auto text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />
      </div>

      <Button type="submit" className="mt-1 w-full" disabled={loading} size="lg">
        {loading ? t('auth_signing_in') : t('auth_sign_in')}
      </Button>

      {/* ── Demo mode entry ─────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[11px] text-gray-400 font-medium shrink-0">
          {isZh ? '或' : 'or'}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={() => {
          setDemoCookie()
          window.location.href = '/dashboard'
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
      >
        <FlaskConical size={15} />
        {isZh ? '体验演示（无需注册）' : 'Try Demo — no sign-up needed'}
      </button>

      <p className="text-center text-xs text-gray-500">
        {t('auth_no_account')}{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
          {t('auth_register_link')}
        </Link>
      </p>
    </form>
  )
}
