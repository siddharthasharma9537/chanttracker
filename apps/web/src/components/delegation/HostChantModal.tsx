'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useSessionCounter } from '@/hooks/useSessionCounter'
import { CounterDisplay } from '@/components/chant/CounterDisplay'
import { X, ChevronLeft } from 'lucide-react'

interface HostChantModalProps {
  isOpen: boolean
  projectId: string
  grahas: Array<{
    graha_id: string
    graha_name: string
    target: number
    completed: number
  }>
  onClose: () => void
  onSuccess?: () => void
}

export function HostChantModal({
  isOpen,
  projectId,
  grahas,
  onClose,
  onSuccess,
}: HostChantModalProps) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedGraha, setSelectedGraha] = useState<string | null>(null)
  const {
    state,
    start,
    increment,
    decrement,
    pause,
    resume,
    reset,
  } = useSessionCounter()

  const selectedGrahaData = grahas.find(g => g.graha_id === selectedGraha)

  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGrahaData || !selectedGraha) throw new Error('No graha selected')
      if (!user?.id) throw new Error('User not authenticated')

      // Log the delegation session
      const { error } = await supabase
        .from('delegation_sessions')
        .insert({
          project_id: projectId,
          priest_id: user!.id,
          graha_id: selectedGraha,
          count: state.count,
          duration_seconds: state.durationSecs,
          assignment_type: 'assigned',
          session_date: new Date().toLocaleDateString('sv'),
        } as any)

      if (error) throw error
    },
    onSuccess: () => {
      reset()
      setSelectedGraha(null)
      queryClient.invalidateQueries({ queryKey: ['delegationProject', projectId] })
      queryClient.invalidateQueries({ queryKey: ['delegation-sessions', projectId] })
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      console.error('Failed to log session:', {
        message: err.message,
        error: err,
        details: err.details || err.hint || 'Unknown error'
      })
      const errorMsg = err.message || 'Unknown error'
      alert(`Failed to save session: ${errorMsg}`)
    },
  })

  if (!isOpen) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Chant for Project</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!selectedGraha ? (
            // Graha Selection View
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Select a graha to chant for:
              </p>
              {grahas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No grahas in this project yet</p>
                </div>
              ) : (
                grahas.map((graha) => (
                  <button
                    key={graha.graha_id}
                    onClick={() => setSelectedGraha(graha.graha_id)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-temple-50 hover:border-temple-300 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {graha.graha_name}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
                        {graha.completed} / {graha.target}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-temple-500 to-sacred-500"
                        style={{
                          width: `${Math.min((graha.completed / graha.target) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            // Chanting Interface
            <div className="space-y-6">
              <button
                onClick={() => setSelectedGraha(null)}
                className="flex items-center gap-2 text-temple-600 hover:text-temple-700 font-medium text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Grahas
              </button>

              {selectedGrahaData && (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {selectedGrahaData.graha_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Target: {selectedGrahaData.target} • Completed: {selectedGrahaData.completed}
                    </p>
                  </div>

                  {state.state === 'idle' ? (
                    <button
                      onClick={() => start('temp', selectedGraha, selectedGrahaData.target)}
                      className="w-full px-4 py-3 bg-temple-500 hover:bg-temple-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Start Chanting
                    </button>
                  ) : (
                    <>
                      <CounterDisplay
                        count={state.count}
                        target={state.target}
                        mantraName={selectedGrahaData.graha_name}
                        durationSecs={state.durationSecs}
                        state={state.state}
                        onIncrement={increment}
                      />

                      <div className="space-y-2">
                        <div className="text-center text-sm text-gray-600 mb-3">
                          Time: {formatTime(state.durationSecs)}
                        </div>

                        <div className="flex gap-2">
                          {state.state === 'active' ? (
                            <button
                              onClick={pause}
                              className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                            >
                              Pause
                            </button>
                          ) : state.state === 'paused' ? (
                            <button
                              onClick={resume}
                              className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                            >
                              Resume
                            </button>
                          ) : null}

                          <button
                            onClick={() => {
                              decrement()
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                          >
                            −
                          </button>

                          <button
                            onClick={() => {
                              increment()
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                          >
                            +
                          </button>

                          <button
                            onClick={() => {
                              completeSessionMutation.mutate()
                            }}
                            disabled={completeSessionMutation.isPending}
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                          >
                            {completeSessionMutation.isPending ? 'Saving...' : 'Complete'}
                          </button>

                          <button
                            onClick={() => {
                              reset()
                              setSelectedGraha(null)
                            }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
