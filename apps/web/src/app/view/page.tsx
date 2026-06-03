'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'

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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-8 sm:py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl sm:text-4xl font-bold">Track Project Progress</h1>
            <p className="text-orange-100 mt-2">Enter your project code to view real-time progress</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 border border-orange-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Enter Project Code</h2>
              <p className="text-gray-600 mt-2">Share your project code to track progress in real-time</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 text-center text-lg font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                  />
                  <div className="absolute right-4 top-3 text-gray-500 text-sm">
                    {projectCode.length}/8
                  </div>
                </div>

                {error && (
                  <p className="text-red-600 text-sm mt-2 font-medium">{error}</p>
                )}

                <p className="text-gray-600 text-sm mt-3">
                  💡 Your host priest will share this code with you to track the project progress.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition transform hover:scale-105 active:scale-95"
              >
                View Progress
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How it works</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>✓ Enter the 8-character project code shared by your host priest</li>
                <li>✓ View real-time progress of all grahas (mantras)</li>
                <li>✓ See completion percentages and daily targets</li>
                <li>✓ Track which priests are assigned to each graha</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 py-8 mt-12">
          <div className="max-w-4xl mx-auto px-4 text-center text-gray-600">
            <p>🙏 ChantTracker • Track your spiritual progress in real-time</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
