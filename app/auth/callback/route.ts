import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DEFAULT_EXPENSE_CATEGORIES } from '@/lib/supabase/default-categories'

// Handles Supabase email-confirmation redirect.
// Supabase redirects here after the user clicks the confirmation link.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  // Default to /onboarding for new users; existing users will be redirected
  // to /dashboard by the onboarding page (onboarding_completed = true).
  const next  = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const userId   = data.user.id
      const meta     = data.user.user_metadata

      // Only create a business if one doesn't already exist for this user
      const { count } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (count === 0) {
        // Prefer businessName stored in user_metadata during registration;
        // fall back to a name derived from the user's display name.
        const businessName = (meta?.business_name as string | undefined)
          ?? ((meta?.full_name as string | undefined)
              ? `${meta.full_name as string}'s Business`
              : 'My F&B Business')

        const businessType = (meta?.business_type as string | undefined) ?? 'restaurant'

        const businessId = crypto.randomUUID()

        const { error: bizError } = await supabase.from('businesses').insert({
          id:                 businessId,
          user_id:            userId,
          business_name:      businessName,
          business_type:      businessType,
          currency:           'MYR',
          preferred_language: 'en',
        })

        if (!bizError) {
          // Seed all 16 default expense categories for the new business
          await supabase.from('expense_categories').insert(
            DEFAULT_EXPENSE_CATEGORIES.map(c => ({
              business_id: businessId,
              user_id:     userId,
              name:        c.name,
              type:        c.type,
            }))
          )
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
