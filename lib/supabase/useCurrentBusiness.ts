'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_BUSINESS_NAME } from '@/lib/mock-data/demo'
import { type UserRole } from '@/lib/auth/permissions'

export const DEMO_COOKIE = 'fbsl_demo'

export function isDemoCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith(`${DEMO_COOKIE}=1`))
}

export function setDemoCookie() {
  document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=7200; SameSite=Lax`
}

export function clearDemoCookie() {
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export interface CurrentBusiness {
  businessId:   string
  businessName: string
  userId:       string
  /** User's app-level role. Defaults to 'owner' when unknown/loading. */
  userRole:     UserRole
  loading:      boolean
  error:        string | null
}

export function useCurrentBusiness(): CurrentBusiness {
  const [state, setState] = useState<CurrentBusiness>({
    businessId:   '',
    businessName: '',
    userId:       '',
    userRole:     'owner',
    loading:      true,
    error:        null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Demo mode: bypass Supabase entirely and return Kopitiam demo identity
      if (isDemoCookie()) {
        if (!cancelled) {
          setState({
            businessId:   '',
            businessName: DEMO_BUSINESS_NAME,
            userId:       '',
            userRole:     'owner',   // demo always shows full owner experience
            loading:      false,
            error:        null,
          })
        }
        return
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          if (!cancelled) setState({ businessId: '', businessName: '', userId: '', userRole: 'owner', loading: false, error: 'Not authenticated' })
          return
        }

        // Fetch business + role in parallel
        const [bizRes, profileRes] = await Promise.all([
          supabase
            .from('businesses')
            .select('id, business_name')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .single(),
          supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle(),
        ])

        const userRole: UserRole = (profileRes.data?.role as UserRole | undefined) ?? 'owner'

        if (!cancelled) {
          if (bizRes.error || !bizRes.data) {
            setState({ businessId: '', businessName: '', userId: user.id, userRole, loading: false, error: 'No business found' })
          } else {
            setState({ businessId: bizRes.data.id, businessName: bizRes.data.business_name as string, userId: user.id, userRole, loading: false, error: null })
          }
        }
      } catch (e) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: String(e) }))
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return state
}
