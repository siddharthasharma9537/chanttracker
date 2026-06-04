'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { User, LogOut } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { displayName, initials, email } = useUserProfile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Portals require the DOM to be available (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate dropdown position from the button's actual location
  const openMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
    setIsMenuOpen(true)
  }

  // Close on click outside (checks both the trigger button and the portaled menu)
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const dropdown = (
    <div
      ref={dropdownRef}
      role="menu"
      className="fixed w-56 rounded-lg shadow-2xl border border-white/20 py-2"
      style={{
        backgroundColor: '#1a1f2c',
        top: `${menuPosition.top}px`,
        right: `${menuPosition.right}px`,
        zIndex: 9999,
      }}
    >
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Account</p>
        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
        <p className="text-xs text-white/50 truncate mt-1">{email}</p>
      </div>
      <button
        onClick={() => {
          router.push('/settings')
          setIsMenuOpen(false)
        }}
        className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
        role="menuitem"
      >
        <User className="w-4 h-4" />
        Settings
      </button>
      <button
        onClick={handleSignOut}
        className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 transition-colors border-t border-white/10"
        role="menuitem"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  )

  return (
    <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 lg:pl-72">
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
          <button
            ref={buttonRef}
            onClick={() => (isMenuOpen ? setIsMenuOpen(false) : openMenu())}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="User menu"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="text-sm font-medium text-white/90 hidden sm:block truncate max-w-[120px]">
              {displayName}
            </span>
          </button>
        </div>
      </div>

      {/* Dropdown rendered via portal to escape the header's stacking context */}
      {mounted && isMenuOpen && createPortal(dropdown, document.body)}
    </header>
  )
}
