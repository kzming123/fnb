import { createClient } from '@/lib/supabase/client'

export interface BusinessOnboardingData {
  id:                   string
  businessName:         string
  businessType:         string
  phone:                string | null
  address:              string | null
  onboardingCompleted:  boolean
}

/** Used by the onboarding page (server-side) — see app/onboarding/page.tsx */
export type BusinessRow = {
  id:                   string
  business_name:        string
  business_type:        string
  phone:                string | null
  address:              string | null
  onboarding_completed: boolean
}

/**
 * Save the business profile and mark onboarding as done.
 * Called from the OnboardingFlow client component.
 */
export async function completeOnboarding(
  businessId: string,
  payload: {
    businessName: string
    businessType: string
    phone:        string | null
    address:      string | null
  },
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('businesses')
    .update({
      business_name:        payload.businessName,
      business_type:        payload.businessType,
      phone:                payload.phone || null,
      address:              payload.address || null,
      onboarding_completed: true,
    })
    .eq('id', businessId)
  if (error) throw new Error(error.message)
}
