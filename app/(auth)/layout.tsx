import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in — F&B Smart Ledger',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-12">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-indigo-50 opacity-60 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
