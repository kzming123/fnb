import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'Know Your F&B Profit Without Messy Paperwork',
  description:
    'AI-powered smart ledger & profit dashboard for Malaysian F&B. Scan supplier invoices, track daily sales, monitor food cost, and generate monthly P&L reports. English / 简体中文.',
  openGraph: {
    title: 'F&B Smart Ledger — Know Your F&B Profit Without Messy Paperwork',
    description:
      'Scan supplier invoices, track daily sales, monitor food cost, and generate monthly P&L reports — all in one simple dashboard.',
    type: 'website',
  },
}

// Public marketing landing page. `/` is not auth-gated (see middleware),
// so visitors land here first; CTAs route into demo mode (/dashboard) or /login.
export default function HomePage() {
  return <LandingPage />
}
