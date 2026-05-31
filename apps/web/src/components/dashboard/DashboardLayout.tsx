'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, User } from 'lucide-react'
import { useState } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-temple-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-temple-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-temple-500 to-dawn-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">☮</span>
              </div>
              <h1 className="text-2xl font-bold text-temple-900 hidden sm:block">
                ChantTracker
              </h1>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-temple-50 transition-colors"
              >
                <div className="w-8 h-8 bg-temple-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-temple-900" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-600">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer Navigation */}
      <nav className="bg-white border-t border-temple-100 sticky bottom-0 sm:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <NavLink href="/dashboard" label="Home" active />
          <NavLink href="/chant" label="Chant" />
          <NavLink href="/history" label="History" />
          <NavLink href="/settings" label="Settings" />
        </div>
      </nav>
    </div>
  )
}

interface NavLinkProps {
  href: string
  label: string
  active?: boolean
}

function NavLink({ href, label, active }: NavLinkProps) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className={`py-2 px-1 text-xs font-medium rounded transition-colors ${
        active
          ? 'text-temple-600 bg-temple-50'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}
