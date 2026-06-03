'use client'

import { Header } from './Header'
import { Navigation } from './Navigation'
import { Breadcrumbs } from './Breadcrumbs'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden pt-0">
        {/* Desktop Sidebar - occupies space but invisible on mobile */}
        <div className="hidden lg:block w-64 flex-shrink-0" />

        {/* Content - with fade-in animation on page load */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 animate-fadeIn">
          {children}
        </main>
      </div>

      {/* Navigation (both desktop sidebar and mobile bottom nav) */}
      <Navigation />
    </div>
  )
}
