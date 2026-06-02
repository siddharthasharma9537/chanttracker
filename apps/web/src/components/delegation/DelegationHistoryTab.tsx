'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, ChevronDown, Download } from 'lucide-react'
import {
  useDelegationHistory,
  useProjectGrahas,
  useGrahaContributions,
  usePriestContributions,
  DelegationSession,
  ProjectGrahaBreakdown,
} from '@/hooks/useDelegationHistory'
import { HistoryDetailModal } from './HistoryDetailModal'
import { ExportButton } from './ExportButton'

interface DelegationHistoryTabProps {
  projectId: string
  clientName: string
  onNavigateBack?: () => void
}

type DetailViewType = 'priest-sessions' | 'graha-sessions' | 'priest-summary' | 'graha-summary'

export function DelegationHistoryTab({
  projectId,
  clientName,
}: DelegationHistoryTabProps) {
  // State management
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'all'>('30d')
  const [filterByPriest, setFilterByPriest] = useState<string | null>(null)
  const [filterByGraha, setFilterByGraha] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailViewType, setDetailViewType] = useState<DetailViewType | null>(null)
  const [selectedPriest, setSelectedPriest] = useState<{ id: string; name: string } | null>(null)
  const [selectedGraha, setSelectedGraha] = useState<{ id: string; name: string } | null>(null)

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date().toISOString().split('T')[0]
    const start = new Date()
    if (dateRange === '7d') start.setDate(start.getDate() - 7)
    else if (dateRange === '14d') start.setDate(start.getDate() - 14)
    else if (dateRange === '30d') start.setDate(start.getDate() - 30)
    else start.setFullYear(start.getFullYear() - 5) // All (5 years back)

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end,
    }
  }, [dateRange])

  // Data queries
  const grahasQuery = useProjectGrahas(projectId, { enabled: !!projectId })
  const historyQuery = useDelegationHistory(projectId, {
    startDate,
    endDate,
    priestId: filterByPriest,
    grahaId: filterByGraha,
    enabled: !!projectId,
  })

  const grahaContributionsQuery = useGrahaContributions(projectId, selectedGraha?.id || '', {
    enabled: !!projectId && !!selectedGraha?.id,
  })

  const priestContributionsQuery = usePriestContributions(projectId, selectedPriest?.id || '', {
    enabled: !!projectId && !!selectedPriest?.id,
  })

  // Compute summary by graha
  const grahaSummary = useMemo(() => {
    if (!grahasQuery.data) return []

    return grahasQuery.data.map((graha) => {
      const grahaHistory = (historyQuery.data || []).filter((h) => h.graha_id === graha.graha_id)

      const priestContributions = new Map<
        string,
        { name: string; count: number; type: 'assigned' | 'volunteer' }
      >()

      grahaHistory.forEach((session) => {
        const key = session.priest_id
        const existing = priestContributions.get(key) || {
          name: session.priest_name,
          count: 0,
          type: session.assignment_type,
        }
        existing.count += session.count
        priestContributions.set(key, existing)
      })

      return {
        ...graha,
        history: grahaHistory,
        priestContributions: Array.from(priestContributions.values()),
        totalCompleted: grahaHistory.reduce((sum, h) => sum + h.count, 0),
      }
    })
  }, [grahasQuery.data, historyQuery.data])

  // Handlers
  const handleShowPriestSessions = (priestId: string, priestName: string) => {
    setSelectedPriest({ id: priestId, name: priestName })
    setDetailViewType('priest-sessions')
    setShowDetailModal(true)
  }

  const handleShowGrahaSessions = (grahaId: string, grahaName: string) => {
    setSelectedGraha({ id: grahaId, name: grahaName })
    setDetailViewType('graha-sessions')
    setShowDetailModal(true)
  }

  const handleFilterByPriest = (priestId: string, priestName: string) => {
    setSelectedPriest({ id: priestId, name: priestName })
    setDetailViewType('priest-summary')
    setShowDetailModal(true)
  }

  const handleFilterByGraha = (grahaId: string, grahaName: string) => {
    setSelectedGraha({ id: grahaId, name: grahaName })
    setDetailViewType('graha-summary')
    setShowDetailModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailModal(false)
    setDetailViewType(null)
    setTimeout(() => {
      setSelectedPriest(null)
      setSelectedGraha(null)
    }, 300)
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    // Export will use all filtered history data
    // Implementation depends on the parent component passing export handler
  }

  // Render loading state
  if (grahasQuery.isLoading || historyQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Render error state
  if (grahasQuery.error || historyQuery.error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Failed to load history</h3>
            <p className="text-red-700 text-sm mt-1">
              {grahasQuery.error?.message || historyQuery.error?.message || 'An error occurred'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Get detail modal data
  const getDetailModalData = () => {
    if (detailViewType === 'priest-sessions' && selectedPriest) {
      const priestSessions = (historyQuery.data || []).filter(
        (s) => s.priest_id === selectedPriest.id
      )
      return {
        title: `${selectedPriest.name} - Session History`,
        sessions: priestSessions,
      }
    }

    if (detailViewType === 'graha-sessions' && selectedGraha) {
      const grahaSessions = (historyQuery.data || []).filter(
        (s) => s.graha_id === selectedGraha.id
      )
      return {
        title: `${selectedGraha.name} - Session History`,
        sessions: grahaSessions,
      }
    }

    if (detailViewType === 'priest-summary' && selectedPriest) {
      const sessions = (historyQuery.data || []).filter((s) => s.priest_id === selectedPriest.id)
      return {
        title: `${selectedPriest.name} - Complete Contribution`,
        sessions,
        priestContribution: priestContributionsQuery.data || [],
      }
    }

    if (detailViewType === 'graha-summary' && selectedGraha) {
      const sessions = (historyQuery.data || []).filter((s) => s.graha_id === selectedGraha.id)
      return {
        title: `${selectedGraha.name} - Priest Contributions`,
        sessions,
        grahaContributions: grahaContributionsQuery.data || [],
      }
    }

    return {
      title: 'History',
      sessions: [],
    }
  }

  const detailData = getDetailModalData()

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 font-medium text-sm">
              {clientName}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-temple-500 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          {/* Filter by Priest */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Priest</label>
            <button
              onClick={() => {
                setFilterByPriest(null)
                setSelectedPriest(null)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center justify-between"
            >
              <span>{filterByPriest ? 'Clear Filter' : 'All'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Filter by Graha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Graha</label>
            <button
              onClick={() => {
                setFilterByGraha(null)
                setSelectedGraha(null)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center justify-between"
            >
              <span>{filterByGraha ? 'Clear Filter' : 'All'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Export */}
          <div className="flex gap-2 items-end">
            <ExportButton
              projectName={clientName}
              startDate={startDate}
              endDate={endDate}
              sessions={historyQuery.data}
              format="pdf"
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
              label={
                <>
                  <Download className="w-4 h-4" />
                  PDF
                </>
              }
            />
            <ExportButton
              projectName={clientName}
              startDate={startDate}
              endDate={endDate}
              sessions={historyQuery.data}
              format="excel"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
              label={
                <>
                  <Download className="w-4 h-4" />
                  Excel
                </>
              }
            />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {grahaSummary.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">No sessions recorded for the selected period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grahaSummary.map((graha) => (
            <div
              key={graha.graha_id}
              className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              {/* Graha Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{graha.graha_name}</h3>
                    <span className="text-sm font-semibold text-gray-600">
                      {graha.completed} / {graha.target}
                    </span>
                    {graha.completion_pct === 100 && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        ✓ COMPLETE
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-temple-400 to-temple-600 transition-all duration-300"
                      style={{ width: `${Math.min(graha.completion_pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {graha.completion_pct.toFixed(1)}% complete
                  </p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleFilterByGraha(graha.graha_id, graha.graha_name)}
                  className="ml-4 px-4 py-2 text-sm font-medium text-temple-600 hover:bg-temple-50 rounded-lg transition-colors"
                >
                  View Details
                </button>
              </div>

              {/* Priest Contributions */}
              {graha.priestContributions.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                  {graha.priestContributions.map((contribution) => (
                    <button
                      key={contribution.name}
                      onClick={() =>
                        handleShowPriestSessions(
                          contribution.name, // Using name as ID since we don't have priest_id here
                          contribution.name
                        )
                      }
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-temple-600 transition-colors">
                          {contribution.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {contribution.count.toLocaleString()} japas •{' '}
                          <span
                            className={`font-medium ${
                              contribution.type === 'assigned' ? 'text-blue-600' : 'text-amber-600'
                            }`}
                          >
                            {contribution.type === 'assigned' ? 'ASSIGNED' : 'VOLUNTEER'}
                          </span>
                        </p>
                      </div>
                      <span className="text-temple-600 font-bold text-lg">
                        {contribution.count.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {graha.priestContributions.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No sessions recorded for this period</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPriest && detailViewType?.startsWith('priest') ? (
        <HistoryDetailModal
          isOpen={showDetailModal}
          title={detailData.title}
          viewType={detailViewType === 'priest-sessions' ? 'sessions' : 'contribution'}
          sessions={detailViewType === 'priest-sessions' ? detailData.sessions : undefined}
          priestContribution={
            detailViewType === 'priest-summary' ? detailData.priestContribution : undefined
          }
          isLoading={priestContributionsQuery.isLoading && detailViewType === 'priest-summary'}
          onClose={handleCloseModal}
          onExport={handleExport}
        />
      ) : null}

      {showDetailModal && selectedGraha && detailViewType?.startsWith('graha') ? (
        <HistoryDetailModal
          isOpen={showDetailModal}
          title={detailData.title}
          viewType={detailViewType === 'graha-sessions' ? 'sessions' : 'contribution'}
          sessions={detailViewType === 'graha-sessions' ? detailData.sessions : undefined}
          grahaContributions={
            detailViewType === 'graha-summary' ? detailData.grahaContributions : undefined
          }
          isLoading={grahaContributionsQuery.isLoading && detailViewType === 'graha-summary'}
          onClose={handleCloseModal}
          onExport={handleExport}
        />
      ) : null}
    </div>
  )
}
