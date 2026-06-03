'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface Breadcrumb {
  label: string
  href: string
  isActive: boolean
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const router = useRouter()

  // Don't show breadcrumbs on home page or auth pages
  if (pathname === '/' || pathname.startsWith('/auth')) {
    return null
  }

  const generateBreadcrumbs = (): Breadcrumb[] => {
    const segments = pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        // Decode URI component and format label
        const decoded = decodeURIComponent(segment)
        const label = decoded
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
        return label
      })

    // Map special paths to friendly names
    const breadcrumbMap: { [key: string]: string } = {
      'Dashboard': 'Dashboard',
      'Chant': 'Chant',
      'History': 'History',
      'Settings': 'Settings',
      'Delegation': 'Delegation',
      'Projects': 'Projects',
      'New': 'Create Project',
      '[Id]': 'Project Details',
    }

    const crumbs: Breadcrumb[] = [
      { label: 'Home', href: '/', isActive: false },
    ]

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const label = breadcrumbMap[segment] || segment

      crumbs.push({
        label,
        href: currentPath,
        isActive: index === segments.length - 1,
      })
    })

    return crumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav
      className="sticky top-16 z-40 bg-white/5 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-10 py-3 lg:pl-72"
      aria-label="Breadcrumb"
    >
        <ol className="flex items-center gap-3 text-sm pl-2 sm:pl-0">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-2">
            {index === 0 ? (
              <button
                onClick={() => router.push(crumb.href)}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
              </button>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 text-white/40" />
                <button
                  onClick={() => router.push(crumb.href)}
                  className={`transition-colors ${
                    crumb.isActive
                      ? 'text-white font-medium'
                      : 'text-white/70 hover:text-white'
                  }`}
                  aria-current={crumb.isActive ? 'page' : undefined}
                >
                  {crumb.label}
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
