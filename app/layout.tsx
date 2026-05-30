import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'

export const metadata: Metadata = {
  title: {
    default: 'F&B Smart Ledger',
    template: '%s | F&B Smart Ledger',
  },
  description: 'Smart ledger for Malaysian F&B business owners. Track sales, invoices, expenses and generate P&L reports.',
  keywords: ['F&B', 'restaurant', 'cafe', 'ledger', 'accounting', 'Malaysia', 'invoice scanner'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
