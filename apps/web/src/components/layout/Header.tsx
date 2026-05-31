'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { User, LogOut } from 'lucide-react'

export function Header() {
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

  const getInitials = (email?: string) => {
    if (!email) return 'U'
    const parts = email.split('@')[0].split('.')
    return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Branding */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sacred-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">☮</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white hidden sm:block">
              ChantTracker
            </h1>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                {getInitials(user?.email)}
              </div>
              <span className="text-sm font-medium text-white/90 hidden sm:block">
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl rounded-lg shadow-lg border border-white/20 py-2 z-50">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-xs text-white/60">Signed in as</p>
                  <p className="text-sm font-medium text-white truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
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
  )
}
