'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useSessionCounter } from '@/hooks/useSessionCounter'
import { createClient } from '@/lib/supabase/client'
import { CounterDisplay } from '@/components/chant/CounterDisplay'
import { SessionControls } from '@/components/chant/SessionControls'
import { LanguageSelector } from '@/components/chant/LanguageSelector'

interface ProjectGraha {
  id: string
  graha_id: string
  graha_name: string
  color: string
  total_target: number
  completed_count: number
  // Full mantra texts pulled from the `mantras` reference table
  graha_mantra_devanagari: string
  adhidevata_name: string
  adhidevata_mantra_devanagari: string
  pratyadhidevata_name: string
  pratyadhidevata_mantra_devanagari: string
}

interface AssignedPriestChantPageProps {
  projectId: string
  priestId: string
  projectName: string
  initialGrahaId?: string
  onNavigateToHistory?: () => void
}

export function AssignedPriestChantPage({
  projectId,
  priestId,
  projectName,
  initialGrahaId,
  onNavigateToHistory,
}: AssignedPriestChantPageProps) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const {
    state: counterState,
    start,
    increment,
    decrement,
    pause,
    resume,
    complete,
    abandon,
  } = useSessionCounter()

  const [selectedGraha, setSelectedGraha] = useState<ProjectGraha | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  // Fetch grahas for this project
  const { data: grahas = [], isLoading: grahasLoading } = useQuery({
    queryKey: ['project-grahas', projectId],
    queryFn: async () => {
      // Join project_grahas → grahas (name/color) → mantras (via grahas.mantra_id FK)
      // and also fetch adhidevata/pratyadhidevata via mantras.parent_graha_id.
      const { data, error } = await supabase
        .from('project_grahas')
        .select(`
          id, graha_id, target_count, completed_count,
          grahas(name, color, mantra_id,
            mantras!grahas_mantra_id_fkey(
              id, name_en, mantra_telugu, devanagari
            )
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Fetch adhidevata + pratyadhidevata for all mantra IDs in one call
      const mantraIds = (data || [])
        .map((r: any) => r.grahas?.mantras?.id)
        .filter(Boolean)

      const { data: deityData } = await supabase
        .from('mantras')
        .select('id, name_en, mantra_telugu, devanagari, mantra_type, parent_graha_id')
        .in('parent_graha_id', mantraIds)
        .eq('is_active', true)
        .in('mantra_type', ['adhidevata', 'pratyadhidevata'])

      const deities = (deityData || []) as any[]
      const stripLabel = (s?: string) => (s || '').replace(/\s*\(.*\)\s*/g, '').trim()

      return (data || []).map((row: any) => {
        const g = row.grahas ?? {}
        const m = g.mantras ?? {}
        const mantraId = m.id
        const adhi  = deities.find(d => d.mantra_type === 'adhidevata'       && d.parent_graha_id === mantraId)
        const pratya = deities.find(d => d.mantra_type === 'pratyadhidevata' && d.parent_graha_id === mantraId)

        return {
          id: row.id,
          graha_id: row.graha_id,
          graha_name: g.name ?? 'Graha',
          color: g.color ?? '#f97316',
          total_target: row.target_count ?? 0,
          completed_count: row.completed_count ?? 0,
          // Use Telugu text (with swaras); fall back to Devanagari (beeja + swaras)
          graha_mantra_devanagari: m.mantra_telugu || m.devanagari || '',
          adhidevata_name: stripLabel(adhi?.name_en),
          adhidevata_mantra_devanagari: adhi?.mantra_telugu || adhi?.devanagari || '',
          pratyadhidevata_name: stripLabel(pratya?.name_en),
          pratyadhidevata_mantra_devanagari: pratya?.mantra_telugu || pratya?.devanagari || '',
        }
      }) as ProjectGraha[]
    },
  })

  // Auto-select first graha if only one exists
  useEffect(() => {
    if (grahas.length === 1 && !selectedGraha) {
      setSelectedGraha(grahas[0])
    }
  }, [grahas, selectedGraha])

  // Auto-select graha from URL param (e.g. clicking "Chant" on a specific graha card)
  useEffect(() => {
    if (initialGrahaId && grahas.length > 0 && !selectedGraha) {
      const match = grahas.find((g) => g.graha_id === initialGrahaId)
      if (match) setSelectedGraha(match)
    }
  }, [initialGrahaId, grahas, selectedGraha])

  // Mutation to start a delegation session
  const startSessionMutation = useMutation({
    mutationFn: async (grahaId: string) => {
      const today = new Date().toLocaleDateString('sv') // YYYY-MM-DD
      const { data, error } = await (supabase
        .from('delegation_sessions') as any)
        .insert({
          project_id: projectId,
          priest_id: priestId,
          graha_id: grahaId,
          count: 0,
          session_date: today,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
  })

  // Mutation to update session count
  const updateSessionCountMutation = useMutation({
    mutationFn: async ({ sessionId, count }: { sessionId: string; count: number }) => {
      const { data, error } = await (supabase
        .from('delegation_sessions') as any)
        .update({ count })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-grahas', projectId] })
    },
  })

  // Mutation to complete session
  const completeSessionMutation = useMutation({
    mutationFn: async ({
      grahaId,
      count,
      durationSeconds,
    }: {
      grahaId: string
      count: number
      durationSeconds: number
    }) => {
      const { data, error } = await (supabase.rpc as any)('log_delegation_session', {
        p_project_id: projectId,
        p_priest_id: priestId,
        p_graha_id: grahaId,
        p_count: count,
        p_duration_secs: durationSeconds,
        p_assignment_type: 'assigned',
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-grahas', projectId] })
      queryClient.invalidateQueries({ queryKey: ['delegation-sessions', projectId, priestId] })
      setSelectedGraha(null)
    },
  })

  const handleSelectGraha = async (graha: ProjectGraha) => {
    if (selectedGraha?.id === graha.id && counterState.state !== 'idle') {
      return // Already selecting this graha
    }

    setSelectedGraha(graha)
    setIsStarting(true)

    try {
      const session = await startSessionMutation.mutateAsync(graha.graha_id)

      if (!session?.id) {
        throw new Error('Session creation failed: no session ID returned')
      }

      start(session.id, graha.graha_id, graha.total_target)
    } catch (err) {
      console.error('[AssignedPriestChant] Failed to start session:', err)
      setSelectedGraha(null)
    } finally {
      setIsStarting(false)
    }
  }

  const handleIncrement = () => {
    increment()
    if (counterState.sessionId) {
      updateSessionCountMutation.mutate({
        sessionId: counterState.sessionId,
        count: counterState.count + 1,
      })
    }
  }

  const handleDecrement = () => {
    decrement()
    if (counterState.sessionId && counterState.count > 0) {
      updateSessionCountMutation.mutate({
        sessionId: counterState.sessionId,
        count: counterState.count - 1,
      })
    }
  }

  const handleComplete = () => {
    complete()
    if (counterState.sessionId && selectedGraha) {
      completeSessionMutation.mutate({
        grahaId: selectedGraha.graha_id,
        count: counterState.count,
        durationSeconds: counterState.durationSecs,
      })
    }
  }

  const handleAbandon = () => {
    abandon()
    if (counterState.sessionId) {
      // Delete the abandoned session (not saved to completion)
      (supabase
        .from('delegation_sessions') as any)
        .delete()
        .eq('id', counterState.sessionId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['delegation-sessions', projectId, priestId] })
        })
    }
    setSelectedGraha(null)
  }

  if (grahasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-orange-500" />
      </div>
    )
  }

  if (grahas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">No grahas assigned yet.</p>
        </div>
      </div>
    )
  }

  // Show graha selector if multiple grahas and no active session
  const showGrahaSelector = grahas.length > 1 && counterState.state === 'idle'

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Header with breadcrumb */}
      <div className="z-20 flex shrink-0 items-center gap-3 border-b border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md sm:px-6 sm:py-2.5">
        <div className="text-sm text-white/60">
          <span>{projectName}</span>
        </div>
        <div className="min-w-0 flex-1">

          {showGrahaSelector ? (
            <div className="text-white text-sm font-medium">Select a graha</div>
          ) : selectedGraha ? (
            <div className="text-white text-sm font-medium">{selectedGraha.graha_name}</div>
          ) : null}
        </div>
        <LanguageSelector />
      </div>

      {/* Main content area */}
      <div className="min-h-0 flex-1 px-2 py-2 sm:px-4 sm:py-3 overflow-y-auto">
        {showGrahaSelector ? (
          // Graha selector grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {grahas.map((graha) => (
              <button
                key={graha.id}
                onClick={() => handleSelectGraha(graha)}
                className="relative p-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all group"
              >
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-3"
                    style={{ backgroundColor: graha.color + '20', borderColor: graha.color, borderWidth: '2px' }}
                  />
                  <h3 className="text-white font-semibold mb-1">{graha.graha_name}</h3>
                  <p className="text-white/60 text-sm mb-3">
                    {graha.completed_count} / {graha.total_target}
                  </p>
                  <div
                    className="w-full h-2 rounded-full"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        backgroundColor: graha.color,
                        width: `${(graha.completed_count / graha.total_target) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : selectedGraha ? (
          // Counter display
          <CounterDisplay
            count={counterState.count}
            target={counterState.target}
            mantraName={selectedGraha.graha_name}
            mantra_devanagari={selectedGraha.graha_mantra_devanagari}
            adhidevata_te={selectedGraha.adhidevata_name}
            adhidevata_mantra_devanagari={selectedGraha.adhidevata_mantra_devanagari}
            pratyadhidevata_te={selectedGraha.pratyadhidevata_name}
            pratyadhidevata_mantra_devanagari={selectedGraha.pratyadhidevata_mantra_devanagari}
            durationSecs={counterState.durationSecs}
            state={counterState.state}
            color={selectedGraha.color}
            onIncrement={handleIncrement}
          />
        ) : null}
      </div>

      {/* Control bar */}
      {selectedGraha && counterState.state !== 'idle' && (
        <div className="shrink-0 border-t border-white/15 bg-white/5 backdrop-blur-md">
          <SessionControls
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onPause={pause}
            onResume={resume}
            onComplete={handleComplete}
            onAbandon={handleAbandon}
            state={counterState.state}
            sessionId={counterState.sessionId}
            count={counterState.count}
            target={counterState.target}
            durationSecs={counterState.durationSecs}
            isLoading={isStarting}
            mantraColor={selectedGraha.color}
          />
        </div>
      )}
    </div>
  )
}
