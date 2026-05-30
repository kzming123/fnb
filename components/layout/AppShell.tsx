'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastProvider } from '@/contexts/ToastContext'
import { useCurrentBusiness } from '@/lib/supabase/useCurrentBusiness'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { businessName, userRole } = useCurrentBusiness()

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // Close sidebar on route change (resize to desktop collapses it naturally)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const displayName = businessName || 'My F&B Business'

  return (
    <ToastProvider>
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        businessName={displayName}
        userRole={userRole}
      />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          businessName={displayName}
        />

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>

        <footer className="border-t border-gray-100 bg-white px-6 py-3">
          <p className="text-center text-[11px] text-gray-400">
            F&B Smart Ledger · &copy; {new Date().getFullYear()} · Built for Malaysian F&B owners
          </p>
        </footer>
      </div>
    </div>
    </ToastProvider>
  )
}
