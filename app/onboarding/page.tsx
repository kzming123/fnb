import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import type { BusinessRow } from '@/lib/supabase/queries/business'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: biz } = await supabase
    .from('businesses')
    .select('id, business_name, business_type, phone, address, onboarding_completed')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle() as { data: BusinessRow | null }

  // No business row = something went wrong at registration; send to login
  if (!biz) redirect('/login')

  // Already completed → go directly to the app
  if (biz.onboarding_completed) redirect('/dashboard')

  return (
    <OnboardingFlow
      businessId={biz.id}
      initialName={biz.business_name}
      initialType={biz.business_type}
      initialPhone={biz.phone ?? ''}
      initialAddress={biz.address ?? ''}
    />
  )
}
