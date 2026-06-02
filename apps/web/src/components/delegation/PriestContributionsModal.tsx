'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { getGrahaContributions } from '@chanttracker/api'

interface Priest {
  priest_id: string
  priest_name: string
  completed_count: number
  assignment_type: string
  sessions_count: number
}

interface PriestContributionsModalProps {
  isOpen: boolean
  grahaName: string
  projectId: string
  grahaId: string
  onClose: () => void
}

export function PriestContributionsModal({
  isOpen,
  grahaName,
  projectId,
  grahaId,
  onClose,
}: PriestContributionsModalProps) {
  const [priests, setPriests] = useState<Priest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchContributions = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await getGrahaContributions(
          projectId,
          grahaId
        )
        if (fetchError) throw fetchError
        setPriests(data || [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load contributions'
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchContributions()
  }, [isOpen, projectId, grahaId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {grahaName} Contributors
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-500" />
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
            </div>
          ) : priests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No contributions yet
            </p>
          ) : (
            <div className="space-y-3">
              {priests.map((priest) => (
                <div
                  key={priest.priest_id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {priest.priest_name}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-temple-100 text-temple-700">
                      {priest.assignment_type === 'assigned'
                        ? 'Assigned'
                        : 'Volunteer'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {priest.completed_count.toLocaleString()} chants
                    </span>
                    <span className="text-xs">
                      {priest.sessions_count} session{priest.sessions_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
