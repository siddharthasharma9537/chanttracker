'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Zap } from 'lucide-react'

export default function ClientViewPage() {
  const router = useRouter()
  const [projectCode, setProjectCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = projectCode.trim().toUpperCase()

    if (!code) {
      setError('Please enter a project code')
      return
    }

    if (code.length !== 8) {
      setError('Project code should be 8 characters')
      return
    }

    setError('')
    // Navigate to track progress with the code
    router.push(`/view/${code}`)
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header Section */}
        <div className="mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            Track Project Progress
          </h1>
          <p className="text-lg sm:text-xl text-white/70 font-light max-w-2xl">
            Enter your project code to view real-time updates on all grahas
          </p>
        </div>

        {/* Main Card */}
        <div className="glassmorphic rounded-2xl p-8 sm:p-12 mb-8">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white/70" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Enter Project Code</h2>
            <p className="text-white/70 mt-2 max-w-lg mx-auto">
              Your host priest will share an 8-character code that grants you access to view the project progress
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-white/90 mb-3">
                Project Code
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  placeholder="e.g., ABC12345"
                  value={projectCode}
                  onChange={(e) => {
                    setProjectCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  maxLength={8}
                  className="w-full px-4 py-3 text-center text-lg font-mono bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-sacred-400/50 focus:ring-2 focus:ring-sacred-500/20 transition text-white placeholder-white/40"
                />
                <div className="absolute right-4 top-3 text-white/50 text-sm">
                  {projectCode.length}/8
                </div>
              </div>

              {error && (
                <p className="text-red-400/90 text-sm mt-2 font-medium">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-sacred-500/20 border border-sacred-400/50 text-white font-semibold hover:bg-sacred-500/30 hover:border-sacred-400/70 transition-all duration-300 hover:shadow-lg hover:shadow-sacred-500/20 active:scale-95"
            >
              View Progress
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">How it works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/70 text-sm">
                  ✓ Enter the project code shared by your host priest
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/70 text-sm">
                  ✓ View real-time progress of all grahas
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/70 text-sm">
                  ✓ See completion percentages and targets
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/70 text-sm">
                  ✓ Track priest assignments per graha
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-white/50 text-sm">
          <p>🙏 Access projects shared with you to track spiritual progress</p>
        </div>
      </div>
    </MainLayout>
  )
}
