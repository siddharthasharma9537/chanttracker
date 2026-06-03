'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/cards/Card'
import { Button } from '@/components/buttons/Button'
import { Input } from '@/components/forms/Input'
import { Eye, AlertCircle } from 'lucide-react'

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
        <div className="max-w-2xl mx-auto mb-8">
          {/* Header Icon */}
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-sacred-500/20 rounded-2xl">
              <Eye className="w-8 h-8 text-sacred-400" />
            </div>
          </div>

          {/* Form Card */}
          <Card variant="featured" className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
              Access Project
            </h2>
            <p className="text-white/70 text-center mb-8 max-w-lg mx-auto">
              Enter the 8-character project code to view real-time progress updates
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Code Input */}
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-white mb-3">
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
                    className="w-full px-4 py-4 text-center text-2xl font-mono bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-sacred-400 focus:ring-2 focus:ring-sacred-500/20 transition text-white placeholder-white/40 tracking-widest font-bold"
                    required
                  />
                  <div className="absolute right-4 top-4 text-white/50 text-sm font-medium">
                    {projectCode.length}/8
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-full"
              >
                View Project Progress
              </Button>
            </form>
          </Card>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card variant="standard">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
                  <Eye className="w-4 h-4 text-white/70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">Real-time Updates</p>
                  <p className="text-xs text-white/60">View live progress of all mantras</p>
                </div>
              </div>
            </Card>
            <Card variant="standard">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
                  <Eye className="w-4 h-4 text-white/70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">Priest Tracking</p>
                  <p className="text-xs text-white/60">See assigned priests per graha</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
