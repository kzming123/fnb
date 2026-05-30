import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | F&B Smart Ledger',
  },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('fbsl_demo')?.value === '1'

  if (!isDemo) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Redirect to onboarding if the user has not completed it yet
    const { data: biz } = await supabase
      .from('businesses')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (biz && !biz.onboarding_completed) redirect('/onboarding')
  }

  return <AppShell>{children}</AppShell>
}
