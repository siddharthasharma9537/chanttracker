'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { MainLayout } from '@/components/layout/MainLayout'
import { AssignedPriestChantPage } from '@/components/delegation/AssignedPriestChantPage'
import { AssignedPriestProjectHistory } from '@/components/delegation/AssignedPriestProjectHistory'
import { AlertCircle } from 'lucide-react'

interface AssignmentData {
  projectId: string
  priestId: string
  projectName: string
}

type TabType = 'chant' | 'history'

export default function AssignedPriestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [assignmentCode, setAssignmentCode] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentData | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('chant')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  if (!user) {
    return null
  }

  const handleBackToHome = () => {
    setSelectedAssignment(null)
    setAssignmentCode('')
    setError('')
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!assignmentCode.trim()) {
      setError('Please enter an assignment code')
      return
    }

    if (!user?.email) {
      setError('Unable to verify your email. Please sign in again.')
      return
    }

    setIsSubmitting(true)

    try {
      // Look up the assignment code
      const { data, error: queryError } = await supabase
        .from('priest_assignments')
        .select('project_id, priest_email')
        .eq('assignment_code', assignmentCode.toUpperCase().trim())
        .single() as { data: { project_id: string; priest_email: string } | null; error: any }

      if (queryError || !data) {
        setError('Invalid assignment code. Please check and try again.')
        setIsSubmitting(false)
        return
      }

      // Verify the logged-in user's email matches the assignment
      if (data.priest_email.toLowerCase() !== user.email.toLowerCase()) {
        setError('This assignment code is not for your email address.')
        setIsSubmitting(false)
        return
      }

      // Fetch project name
      const { data: projectData, error: projectError } = await (supabase
        .from('delegation_projects') as any)
        .select('name')
        .eq('id', data.project_id)
        .single()

      if (projectError || !projectData) {
        setError('Could not fetch project details.')
        setIsSubmitting(false)
        return
      }

      // Claim the assignment by updating priest_id
      const { error: claimError } = await (supabase
        .from('priest_assignments') as any)
        .update({ priest_id: user.id })
        .eq('assignment_code', assignmentCode.toUpperCase().trim())
        .single()

      if (claimError) {
        setError('Failed to claim assignment. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Successfully claimed the assignment
      setSelectedAssignment({
        projectId: data.project_id,
        priestId: user.id,
        projectName: projectData.name,
      })
      setActiveTab('chant')
    } catch (err: any) {
      setError(err.message || 'Failed to validate assignment code')
      setIsSubmitting(false)
    }
  }

  if (selectedAssignment) {
    return (
      <MainLayout>
        {/* Tabs */}
        <div className="flex gap-4 px-4 sm:px-6 pt-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('chant')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'chant'
                ? 'text-white border-b-2 border-sacred-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Chant
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-white border-b-2 border-sacred-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            History
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {activeTab === 'chant' ? (
            <AssignedPriestChantPage
              projectId={selectedAssignment.projectId}
              priestId={selectedAssignment.priestId}
              projectName={selectedAssignment.projectName}
              onNavigateToHistory={() => setActiveTab('history')}
            />
          ) : (
            <AssignedPriestProjectHistory
              projectId={selectedAssignment.projectId}
              priestId={selectedAssignment.priestId}
            />
          )}
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Assigned Priest</h1>
          <p className="text-white/70">Enter your assignment code to view your assigned tasks</p>
        </div>

        {/* Assignment Code Input Form */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
          <form onSubmit={handleCodeSubmit}>
            <div className="mb-6">
              <label htmlFor="assignmentCode" className="block text-sm font-semibold text-white mb-3">
                Assignment Code
              </label>
              <input
                id="assignmentCode"
                type="text"
                value={assignmentCode}
                onChange={(e) => {
                  setAssignmentCode(e.target.value)
                  setError('')
                }}
                placeholder="Paste your 6-character code here"
                maxLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-temple-500 focus:ring-2 focus:ring-temple-500/20 transition-all uppercase text-center text-2xl tracking-widest font-mono"
                disabled={isSubmitting}
                autoComplete="off"
              />
              <p className="mt-2 text-xs text-white/50">
                Your host priest will provide you with a unique 6-character code
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!assignmentCode.trim() || isSubmitting}
              className="w-full px-6 py-3 bg-temple-500 hover:bg-temple-600 disabled:bg-white/20 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? 'Verifying...' : 'Access Project'}
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-white/60 hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
