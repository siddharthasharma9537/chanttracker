'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Play, Users, Clock, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { clsx } from 'clsx'

const NAV = [
  { href: '/practice', label: 'Practice', icon: Play },
  { href: '/projects', label: 'Projects', icon: Users },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const name =
    (user?.user_metadata?.display_name as string) || user?.email?.split('@')[0] || ''
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="frosted-bar sticky top-0 z-30 border-b border-white/15">
        <div className="flex items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sacred-500 to-amber-500 text-lg font-bold text-white">
              ☮
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-white sm:block">
              ChantTracker
            </span>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/10"
            title={name}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
              {initials}
            </span>
          </button>
        </div>
      </header>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-16 space-y-1 p-4">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors',
                    active
                      ? 'bg-white/15 font-semibold text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-4 lg:px-8 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="frosted-bar fixed inset-x-0 bottom-0 z-30 border-t border-white/15 lg:hidden">
        <div className="grid grid-cols-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex flex-col items-center py-2.5 text-xs',
                  active ? 'text-sacred-500' : 'text-white/60'
                )}
              >
                <Icon className="mb-0.5 h-5 w-5" />
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
