'use client'

import { useState } from 'react'
import { X, Download } from 'lucide-react'
import { DelegationSession, PriestContribution, GrahaContribution } from '@/hooks/useDelegationHistory'

type ViewType = 'sessions' | 'contribution'

interface HistoryDetailModalProps {
  isOpen: boolean
  title: string
  viewType: ViewType
  sessions?: DelegationSession[]
  priestContribution?: PriestContribution[] // For "filtered by priest" view
  grahaContributions?: GrahaContribution[] // For "filtered by graha" view
  isLoading?: boolean
  onClose: () => void
  onExport?: (format: 'pdf' | 'excel') => void
}

export function HistoryDetailModal({
  isOpen,
  title,
  viewType,
  sessions = [],
  priestContribution = [],
  grahaContributions = [],
  isLoading = false,
  onClose,
  onExport,
}: HistoryDetailModalProps) {
  const [sortBy, setSortBy] = useState<'date' | 'count'>('date')

  if (!isOpen) return null

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    }
    return b.count - a.count
  })

  const formatDuration = (secs?: number) => {
    if (!secs) return '-'
    const mins = Math.floor(secs / 60)
    return `${mins}m`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getTotalDuration = (secs: number[] | undefined) => {
    if (!secs) return 0
    const totalSecs = secs.reduce((sum, s) => sum + (s || 0), 0)
    const hours = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-temple-500 to-sacred-500 text-white p-4 sm:p-6 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
            <p className="text-white/80 text-sm mt-1">
              {viewType === 'sessions'
                ? `${sortedSessions.length} sessions recorded`
                : priestContribution.length > 0
                ? `${priestContribution.length} grahas`
                : `${grahaContributions.length} priests`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : viewType === 'sessions' && sortedSessions.length > 0 ? (
            <>
              {/* Sort Controls */}
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    sortBy === 'date'
                      ? 'bg-temple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sort by Date
                </button>
                <button
                  onClick={() => setSortBy('count')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    sortBy === 'count'
                      ? 'bg-temple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sort by Count
                </button>
              </div>

              {/* Session Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-temple-100">
                      <th className="text-left py-3 px-4 font-semibold text-temple-900">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-temple-900">
                        {priestContribution.length > 0 ? 'Graha' : 'Priest'}
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-temple-900">Count</th>
                      <th className="text-right py-3 px-4 font-semibold text-temple-900">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold text-temple-900">Type</th>
                      <th className="text-center py-3 px-4 font-semibold text-temple-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSessions.map((session, idx) => (
                      <tr
                        key={session.session_id || idx}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          {formatDate(session.session_date)}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {priestContribution.length > 0
                            ? session.graha_name
                            : session.priest_name}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-temple-600">
                          {session.count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {formatDuration(session.duration_secs)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              session.assignment_type === 'assigned'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {session.assignment_type === 'assigned'
                              ? 'ASSIGNED'
                              : 'VOLUNTEER'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-green-600 font-bold">✓</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              <div className="mt-6 p-4 bg-temple-50 rounded-lg border border-temple-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-temple-600">
                      {sortedSessions.length}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Total Sessions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-temple-600">
                      {sortedSessions.reduce((sum, s) => sum + s.count, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Total Japas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-temple-600">
                      {getTotalDuration(sortedSessions.map((s) => s.duration_secs).filter((d) => d !== undefined) as number[])}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Total Duration</p>
                  </div>
                </div>
              </div>
            </>
          ) : priestContribution.length > 0 ? (
            /* Priest Contribution View */
            <div className="space-y-6">
              {/* Assigned Grahas */}
              <div>
                <h3 className="text-lg font-bold text-temple-900 mb-4">Assigned Grahas</h3>
                <div className="space-y-3">
                  {priestContribution
                    .filter((g) => g.assignment_type === 'assigned')
                    .map((graha) => (
                      <div
                        key={graha.graha_id}
                        className="p-4 border border-temple-200 rounded-lg hover:bg-temple-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-temple-900">{graha.graha_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {graha.completed.toLocaleString()} / {graha.target.toLocaleString()} ({graha.completion_pct.toFixed(1)}%)
                            </p>
                          </div>
                          <span className="text-xl font-bold text-temple-600">
                            {graha.completion_pct === 100 ? '✓' : '⧖'}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-temple-400 to-temple-600 transition-all duration-300"
                            style={{ width: `${Math.min(graha.completion_pct, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {graha.sessions_count} sessions
                        </p>
                      </div>
                    ))}
                  {priestContribution.filter((g) => g.assignment_type === 'assigned').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No assigned grahas</p>
                  )}
                </div>
              </div>

              {/* Volunteer Grahas */}
              {priestContribution.some((g) => g.assignment_type === 'volunteer') && (
                <div>
                  <h3 className="text-lg font-bold text-temple-900 mb-4">Volunteer Grahas</h3>
                  <div className="space-y-3">
                    {priestContribution
                      .filter((g) => g.assignment_type === 'volunteer')
                      .map((graha) => (
                        <div
                          key={graha.graha_id}
                          className="p-4 border border-amber-200 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-amber-900">{graha.graha_name}</h4>
                              <p className="text-sm text-amber-700 mt-1">
                                {graha.completed.toLocaleString()} / {graha.target.toLocaleString()} ({graha.completion_pct.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                              style={{ width: `${Math.min(graha.completion_pct, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-amber-600 mt-2">
                            {graha.sessions_count} volunteer sessions
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="p-4 bg-gradient-to-r from-temple-100 to-sacred-100 rounded-lg border border-temple-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Total Assigned</p>
                    <p className="text-2xl font-bold text-temple-600 mt-1">
                      {priestContribution
                        .filter((g) => g.assignment_type === 'assigned')
                        .reduce((sum, g) => sum + g.completed, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Total Volunteer</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      {priestContribution
                        .filter((g) => g.assignment_type === 'volunteer')
                        .reduce((sum, g) => sum + g.completed, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-temple-300">
                  <p className="text-xs text-gray-600 font-medium">Total Contribution</p>
                  <p className="text-3xl font-bold text-temple-900 mt-1">
                    {priestContribution
                      .reduce((sum, g) => sum + g.completed, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : grahaContributions.length > 0 ? (
            /* Graha Contribution View */
            <div className="space-y-4">
              {grahaContributions.map((priest, idx) => (
                <div
                  key={`${priest.priest_id}-${idx}`}
                  className="p-4 border border-temple-200 rounded-lg hover:bg-temple-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-temple-900">{priest.priest_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {priest.assignment_type === 'assigned' ? 'Assigned' : 'Volunteer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-temple-600">
                        {priest.completed_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">japas</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{priest.sessions_count} sessions</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        priest.assignment_type === 'assigned'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {priest.assignment_type === 'assigned' ? 'ASSIGNED' : 'VOLUNTEER'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        {/* Footer with Export */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {onExport && (
            <>
              <button
                onClick={() => onExport('pdf')}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => onExport('excel')}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
