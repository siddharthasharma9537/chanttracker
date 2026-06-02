'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { generateAssignmentCode, isValidEmail, isValidMobile } from '@/lib/assignmentCode'
import { X, Copy, Check, AlertCircle } from 'lucide-react'

interface AssignPriestModalProps {
  isOpen: boolean
  projectId: string
  projectCode: string
  onClose: () => void
  onSuccess?: () => void
}

export function AssignPriestModal({
  isOpen,
  projectId,
  projectCode,
  onClose,
  onSuccess,
}: AssignPriestModalProps) {
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [assignmentCode, setAssignmentCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

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

    const code = generateAssignmentCode(email, mobile, projectCode)
    setAssignmentCode(code)
  }

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!assignmentCode) {
        throw new Error('Please generate a code first')
      }

      const supabase = createClient()
      const { error: insertError } = await supabase
        .from('priest_assignments')
        .insert({
          project_id: projectId,
          priest_email: email.toLowerCase(),
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
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      // Handle specific constraint violations
      if (err.message?.includes('duplicate key') || err.message?.includes('unique constraint')) {
        setError('This priest is already assigned to this project. Each priest can only be assigned once per project.')
      } else {
        setError(err.message || 'Failed to assign priest')
      }
    },
  })

  const handleCopyCode = () => {
    // Try modern clipboard API first
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(assignmentCode).catch(() => {
        // Fallback to execCommand if clipboard API fails
        fallbackCopy(assignmentCode)
      })
    } else {
      // Fallback for older browsers
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
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Assign Priest</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
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
              <p className="text-sm font-medium text-gray-700">Your Assignment Code:</p>
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

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          {assignmentCode ? (
            <button
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending}
              className="flex-1 px-4 py-2 bg-temple-500 hover:bg-temple-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
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
        </div>
      </div>
    </div>
  )
}
