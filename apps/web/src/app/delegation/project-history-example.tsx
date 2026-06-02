/**
 * Example: Integration of DelegationHistoryTab into a project detail page
 *
 * This file demonstrates how to integrate the History Tab component into
 * your project structure. Adapt this as needed for your routing/layout.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DelegationHistoryTab } from '@/components/delegation'
import { ArrowLeft } from 'lucide-react'

interface ProjectHistoryPageProps {
  projectId: string
  clientName: string
}

/**
 * Full-page example: Project history view with header and back button
 */
export function ProjectHistoryPage({ projectId, clientName }: ProjectHistoryPageProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-temple-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-temple-600 hover:text-temple-700 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Project
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{clientName}</h1>
          <p className="text-gray-600 mt-1">Session History & Analytics</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <DelegationHistoryTab
          projectId={projectId}
          clientName={clientName}
          onNavigateBack={() => router.back()}
        />
      </div>
    </div>
  )
}

/**
 * Embedded example: History tab as part of a tabbed interface
 */
export function ProjectDashboardWithTabs({
  projectId,
  clientName,
}: ProjectHistoryPageProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'assignments'>(
    'dashboard'
  )

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'dashboard'
              ? 'border-temple-500 text-temple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-temple-500 text-temple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'assignments'
              ? 'border-temple-500 text-temple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Assignments
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <div>{/* ProjectDashboard component */}</div>}

        {activeTab === 'history' && (
          <DelegationHistoryTab
            projectId={projectId}
            clientName={clientName}
          />
        )}

        {activeTab === 'assignments' && <div>{/* AssignmentsList component */}</div>}
      </div>
    </div>
  )
}

/**
 * Modal example: History view in a side panel (for desktop)
 */
export function ProjectDetailWithHistoryPanel({
  projectId,
  clientName,
}: ProjectHistoryPageProps) {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Project View */}
      <div className="lg:col-span-2">{/* ProjectDashboard component */}</div>

      {/* History Panel */}
      <div className="lg:col-span-1">
        {showHistory ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <DelegationHistoryTab
              projectId={projectId}
              clientName={clientName}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowHistory(true)}
            className="w-full px-4 py-3 bg-temple-500 hover:bg-temple-600 text-white rounded-lg font-medium transition-colors"
          >
            View History
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Route handler example: Using in Next.js App Router
 *
 * File: /apps/web/src/app/projects/[projectId]/history/page.tsx
 */
export async function ProjectHistoryPageRoute({
  params,
}: {
  params: { projectId: string }
}) {
  // In a real implementation, you'd fetch project details here
  // For now, using placeholder data
  const projectId = params.projectId
  const clientName = 'Rama Sharma' // Fetch from API in real implementation

  return <ProjectHistoryPage projectId={projectId} clientName={clientName} />
}

/**
 * Test data generator: For testing without real backend
 *
 * Use these mock functions to test the component with sample data
 */
export function generateMockHistory(count: number = 20) {
  const priests = ['Priest A', 'Priest B', 'Priest C']
  const grahas = ['Surya', 'Chandra', 'Mangal', 'Budha', 'Brihaspati']
  const types = ['assigned', 'volunteer'] as const

  return Array.from({ length: count }, (_, i) => ({
    session_date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    priest_name: priests[Math.floor(Math.random() * priests.length)],
    priest_id: `priest-${Math.floor(Math.random() * 3)}`,
    graha_name: grahas[Math.floor(Math.random() * grahas.length)],
    graha_id: `graha-${Math.floor(Math.random() * 5)}`,
    count: Math.floor(Math.random() * 1000) + 500,
    duration_secs: Math.floor(Math.random() * 3600) + 600,
    assignment_type: types[Math.floor(Math.random() * 2)],
    session_id: `session-${i}`,
  }))
}

/**
 * Storybook example: Component in isolation
 */
export function DelegationHistoryStory() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Delegation History Tab</h1>

        <DelegationHistoryTab
          projectId="e4a4c9c8-1234-5678-abcd-ef1234567890"
          clientName="Rama Sharma"
        />
      </div>
    </div>
  )
}
