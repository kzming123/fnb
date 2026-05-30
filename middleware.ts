import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Always refresh the session — do not add logic between createServerClient and getUser.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect all app routes — allow demo cookie to bypass auth
  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/daily-sales') ||
    pathname.startsWith('/invoice-scanner') ||
    pathname.startsWith('/expenses') ||
    pathname.startsWith('/suppliers') ||
    pathname.startsWith('/pnl-report') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding')

  const isDemoMode = request.cookies.get('fbsl_demo')?.value === '1'

  if (isAppRoute && !user && !isDemoMode) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Demo visitors cannot access settings or onboarding (no real account)
  if ((pathname.startsWith('/settings') || pathname.startsWith('/onboarding')) && !user && isDemoMode) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
