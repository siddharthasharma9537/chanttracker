'use client'

import { Header } from './Header'
import { Navigation } from './Navigation'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden pt-0">
        {/* Desktop Sidebar - occupies space but invisible on mobile */}
        <div className="hidden lg:block w-64 flex-shrink-0" />

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Navigation (both desktop sidebar and mobile bottom nav) */}
      <Navigation />
    </div>
  )
}
