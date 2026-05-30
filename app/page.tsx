import { redirect } from 'next/navigation'

// Root redirects to dashboard (no auth yet — swap this for auth check later)
export default function RootPage() {
  redirect('/dashboard')
}
