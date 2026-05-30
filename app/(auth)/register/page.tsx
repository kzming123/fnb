import type { Metadata } from 'next'
import { ChefHat } from 'lucide-react'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: 'Register' }

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
          <ChefHat size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">F&amp;B Smart Ledger</h1>
      </div>

      {/* Card — subtitle, form, and login link are inside RegisterForm */}
      <div className="rounded-2xl bg-white p-6 shadow-card border border-gray-100">
        <RegisterForm />
      </div>
    </div>
  )
}
