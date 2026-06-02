'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { Users, User } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth/signin')
    }
  }, [authLoading, isSignedIn, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-orange-500" />
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  const handlePersonalClick = () => {
    router.push('/dashboard')
  }

  const handleHostClick = () => {
    router.push('/delegation/projects')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
              ChantTracker
            </h1>
            <p className="text-lg sm:text-xl text-white/70 font-light max-w-2xl mx-auto">
              Choose your path: Track your own chanting or manage delegation projects
            </p>
          </div>

          {/* Two Button Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Personal Button */}
            <button
              onClick={handlePersonalClick}
              className="group relative h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-sacred-500/20 active:scale-95"
            >
              {/* Background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-800 opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Glassmorphic overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/20" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center px-6 text-center space-y-4">
                <div className="p-4 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors">
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Personal
                  </h2>
                  <div className="text-white/80 text-sm sm:text-base leading-relaxed space-y-1">
                    <div>Track your own chanting</div>
                    <div>Personal goals & streaks</div>
                    <div>Individual progress</div>
                  </div>
                </div>
              </div>

              {/* Hover highlight effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            </button>

            {/* Host Button */}
            <button
              onClick={handleHostClick}
              className="group relative h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-sacred-500/20 active:scale-95"
            >
              {/* Background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-sacred-500 via-orange-600 to-slate-800 opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Glassmorphic overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/20" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center px-6 text-center space-y-4">
                <div className="p-4 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Host
                  </h2>
                  <div className="text-white/80 text-sm sm:text-base leading-relaxed space-y-1">
                    <div>Manage delegated projects</div>
                    <div>Assign priests & track progress</div>
                    <div>Multi-priest collaboration</div>
                  </div>
                </div>
              </div>

              {/* Hover highlight effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            </button>
          </div>

          {/* Optional: Quick Info */}
          <div className="mt-12 sm:mt-16 text-center text-white/50 text-sm">
            <p>You can switch between Personal and Host modes anytime</p>
          </div>
        </div>
      </main>
    </div>
  )
}
