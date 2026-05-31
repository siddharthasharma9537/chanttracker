'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Play, Clock, Settings } from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/chant', label: 'Chant', icon: Play },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 w-64 h-screen bg-white border-r border-temple-100 flex-col z-30 pt-20">
        <nav className="flex-1 px-4 py-6">
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
                        ? 'bg-temple-100 text-temple-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
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
        </nav>

        {/* User Card at Bottom */}
        <div className="border-t border-temple-100 p-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-temple-50">
            <div className="w-10 h-10 bg-temple-200 rounded-full flex items-center justify-center text-xs font-semibold text-temple-900 flex-shrink-0">
              U
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600">Account</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                user@example.com
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-temple-100 z-40 pb-safe">
        <ul className="grid grid-cols-4 gap-0">
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
                      ? 'text-temple-600'
                      : 'text-gray-500 hover:text-gray-700'
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
        </ul>
      </nav>
    </>
  )
}
