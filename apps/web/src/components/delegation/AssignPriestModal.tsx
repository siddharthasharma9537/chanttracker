'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { generateAssignmentCode, isValidEmail, isValidMobile } from '@/lib/assignmentCode'
import { X, Copy, Check, AlertCircle, Trash2 } from 'lucide-react'

interface AssignPriestModalProps {
  isOpen: boolean
  projectId: string
  onClose: () => void
  onSuccess?: () => void
}

interface AssignedPriest {
  id: string
  priest_email: string
  priest_mobile?: string
  assignment_code: string
  created_at?: string
}

export function AssignPriestModal({
  isOpen,
  projectId,
  onClose,
  onSuccess,
}: AssignPriestModalProps) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [assignmentCode, setAssignmentCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('manage')

  // Fetch existing priests assigned to this project
  const { data: assignedPriests = [], isLoading: priestsLoading } = useQuery({
    queryKey: ['priestAssignments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('priest_assignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as AssignedPriest[]
    },
    enabled: isOpen,
  })

  const generateCode = () => {
    setError('')

    if (!email.trim()) {
      setError('Please enter a valid email')
      return
    }

    if (!mobile.trim()) {
      setError('Please enter a valid mobile number')
      return
    }

    if (!isValidEmail(email)) {
      setError('Invalid email format')
      return
    }

    if (!isValidMobile(mobile)) {
      setError('Invalid mobile number (needs 10-15 digits)')
      return
    }

    const code = generateAssignmentCode(email, mobile)
    setAssignmentCode(code)
  }

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!assignmentCode) {
        throw new Error('Please generate a code first')
      }

      // Check if this assignment code already exists (from a previous assignment)
      const { data: existingAssignment, error: checkError } = await supabase
        .from('priest_assignments')
        .select('id')
        .eq('assignment_code', assignmentCode)
        .single()

      // If it exists, delete it first (it was probably deleted but code still exists)
      if (existingAssignment?.id) {
        const { error: deleteError } = await supabase
          .from('priest_assignments')
          .delete()
          .eq('id', existingAssignment.id)

        if (deleteError) throw deleteError
      }

      // Now insert the new assignment
      const { error: insertError } = await supabase
        .from('priest_assignments')
        .insert({
          project_id: projectId,
          priest_email: email.toLowerCase().trim(),
          priest_mobile: mobile.replace(/\D/g, ''),
          assignment_code: assignmentCode,
        } as any)

      if (insertError) throw insertError
    },
    onSuccess: () => {
      setEmail('')
      setMobile('')
      setAssignmentCode('')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['priestAssignments', projectId] })
      onSuccess?.()
      setActiveTab('manage')
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
        setError('Assignment code conflict. Please try a different email or mobile number.')
      } else {
        setError(err.message || 'Failed to assign priest')
      }
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (priestAssignmentId: string) => {
      const { error: deleteError } = await supabase
        .from('priest_assignments')
        .delete()
        .eq('id', priestAssignmentId)

      if (deleteError) throw deleteError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priestAssignments', projectId] })
      onSuccess?.()
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to remove priest')
    },
  })

  const handleCopyCode = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(assignmentCode).catch(() => {
        fallbackCopy(assignmentCode)
      })
    } else {
      fallbackCopy(assignmentCode)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
    document.body.removeChild(textarea)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Manage Priests</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 pt-4">
          <button
            onClick={() => {
              setActiveTab('manage')
              setError('')
            }}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'manage'
                ? 'border-b-2 border-temple-500 text-temple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Current ({assignedPriests.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('add')
              setError('')
            }}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'add'
                ? 'border-b-2 border-temple-500 text-temple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Add Priest
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Manage Tab - Show Existing Priests */}
          {activeTab === 'manage' && (
            <div className="space-y-3">
              {priestsLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">Loading priests...</p>
              ) : assignedPriests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">No priests assigned yet</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="text-temple-600 hover:text-temple-700 font-medium text-sm"
                  >
                    Add your first priest
                  </button>
                </div>
              ) : (
                assignedPriests.map((priest) => (
                  <div
                    key={priest.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {priest.priest_email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Code: <span className="font-mono">{priest.assignment_code}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => removeMutation.mutate(priest.id)}
                      disabled={removeMutation.isPending}
                      className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove priest"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add Tab - Add New Priest */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Priest Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setAssignmentCode('')
                    setError('')
                  }}
                  placeholder="priest@example.com"
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-temple-500 focus:border-transparent"
                  disabled={!!assignmentCode}
                />
              </div>

              {/* Mobile Input */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value)
                    setAssignmentCode('')
                    setError('')
                  }}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-temple-500 focus:border-transparent"
                  disabled={!!assignmentCode}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Assignment Code Section */}
              {assignmentCode ? (
                <div className="space-y-3 p-4 bg-temple-50 border border-temple-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Assignment Code Generated:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-center text-2xl font-bold text-temple-700 tracking-widest px-4 py-3 bg-white rounded-lg border border-temple-300">
                      {assignmentCode}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 hover:bg-temple-100 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-temple-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Share this code with the priest. They&apos;ll enter it in the Assigned Priest form.
                  </p>
                </div>
              ) : null}

              {/* Help Text */}
              {!assignmentCode && (
                <p className="text-sm text-gray-500">
                  Enter the priest&apos;s email and mobile number to generate a unique assignment code.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
          {activeTab === 'add' && (
            <>
              {assignmentCode ? (
                <button
                  onClick={() => assignMutation.mutate()}
                  disabled={assignMutation.isPending}
                  className="flex-1 px-4 py-2 bg-temple-500 hover:bg-temple-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Confirm & Add'}
                </button>
              ) : (
                <button
                  onClick={generateCode}
                  disabled={!email.trim() || !mobile.trim()}
                  className="flex-1 px-4 py-2 bg-temple-500 hover:bg-temple-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  Generate Code
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
