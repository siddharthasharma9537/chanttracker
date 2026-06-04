'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Play, Clock, Settings, Briefcase, Plus, LogOut } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { clsx } from 'clsx'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const personalNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/chant', label: 'Chant', icon: Play },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const hostNavItems: NavItem[] = [
  { href: '/delegation/projects', label: 'Projects', icon: Briefcase },
  { href: '/delegation/new', label: 'Create', icon: Plus },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const assignedPriestNavItems: NavItem[] = [
  { href: '/delegation/assigned?tab=chant', label: 'Chant', icon: Play },
  { href: '/delegation/assigned?tab=history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const clientNavItems: NavItem[] = [
  { href: '/view', label: 'Projects', icon: Briefcase },
  { href: '/settings', label: 'Settings', icon: Settings },
]

type ModeType = 'personal' | 'host' | 'assigned' | 'client'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { displayName, initials } = useUserProfile()

  // Determine current mode based on pathname
  const getCurrentMode = (): ModeType => {
    if (pathname.startsWith('/delegation/assigned')) {
      return 'assigned'
    } else if (pathname.startsWith('/delegation')) {
      return 'host'
    } else if (pathname.startsWith('/view')) {
      return 'client'
    }
    return 'personal'
  }

  const currentMode = getCurrentMode()

  // Select nav items based on current mode
  const navItems = {
    personal: personalNavItems,
    host: hostNavItems,
    assigned: assignedPriestNavItems,
    client: clientNavItems,
  }[currentMode]

  const modeLabels = {
    personal: 'Personal',
    host: 'Host',
    assigned: 'Assigned Priest',
    client: 'Client',
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleSwitchMode = () => {
    const modeSequence: ModeType[] = ['personal', 'host', 'assigned', 'client']
    const currentIndex = modeSequence.indexOf(currentMode)
    const nextIndex = (currentIndex + 1) % modeSequence.length
    const nextMode = modeSequence[nextIndex]

    const routes = {
      personal: '/dashboard',
      host: '/delegation/projects',
      assigned: '/delegation/assigned',
      client: '/view',
    }

    router.push(routes[nextMode])
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 w-64 h-screen bg-white/10 backdrop-blur-xl border-r border-white/20 flex-col z-40 pt-28">
        <nav className="flex-1 px-4 py-6">
          {/* Section Indicator */}
          <div className="mb-6 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              {modeLabels[currentMode]}
            </p>
          </div>

          {/* Navigation Items */}
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <button
                    onClick={() => router.push(item.href)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      active
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Switch Mode Button */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={handleSwitchMode}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
              title={`Switch mode`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 rotate-180" />
              <span>Switch Mode</span>
            </button>
          </div>
        </nav>

        {/* User Card at Bottom */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Go to Settings"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs text-white/60 uppercase tracking-wider">Account</p>
              <p className="text-sm font-medium text-white truncate">
                {displayName}
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-xl border-t border-white/15 z-40 pb-safe">
        <ul className="grid gap-0" style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <button
                  onClick={() => router.push(item.href)}
                  className={clsx(
                    'w-full flex flex-col items-center justify-center py-3 px-1 transition-colors',
                    active
                      ? 'text-sacred-500'
                      : 'text-white/60 hover:text-sacred-400'
                  )}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <Icon
                    className={clsx(
                      'w-6 h-6 mb-1',
                      active ? 'fill-current' : ''
                    )}
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
          {/* Mobile Switch Mode Button */}
          <li>
            <button
              onClick={handleSwitchMode}
              className="w-full flex flex-col items-center justify-center py-3 px-1 transition-colors text-white/60 hover:text-sacred-400"
              aria-label="Switch mode"
              title="Switch mode"
            >
              <LogOut className="w-6 h-6 mb-1 rotate-180" />
              <span className="text-xs font-medium">Switch</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
