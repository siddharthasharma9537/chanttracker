'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { User, LogOut } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { displayName, initials, email } = useUserProfile()
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
    <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 lg:pl-72" style={{ zIndex: 'auto' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-3 sm:py-4 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Branding */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
            <div className="w-10 h-10 bg-gradient-to-br from-sacred-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">☮</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white hidden sm:block tracking-tight">
              ChantTracker
            </h1>
          </div>

          {/* User Menu */}
          <div className="relative z-50">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                {initials}
              </div>
              <span className="text-sm font-medium text-white/90 hidden sm:block truncate max-w-[120px]">
                {displayName}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="fixed w-56 rounded-lg shadow-2xl border border-white/20 py-2"
                style={{
                  backgroundColor: '#1a1f2c',
                  backdropFilter: 'blur(10px)',
                  top: '72px',
                  right: '24px',
                  zIndex: 9999,
                  pointerEvents: 'auto'
                }}
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Account</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-white/50 truncate mt-1">
                    {email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    router.push('/settings')
                    setIsMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 transition-colors border-t border-white/10"
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
