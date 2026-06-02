'use client'

import { useCallback, ReactNode } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { DelegationSession } from '@/hooks/useDelegationHistory'

interface ExportButtonProps {
  projectName: string
  startDate?: string
  endDate?: string
  sessions?: DelegationSession[]
  summary?: Record<string, any>
  format: 'pdf' | 'excel'
  label?: ReactNode
  className?: string
}

export function ExportButton({
  projectName,
  startDate,
  endDate,
  sessions = [],
  summary = {},
  format,
  label,
  className = '',
}: ExportButtonProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'All'
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const exportToCSV = useCallback(() => {
    if (!sessions || sessions.length === 0) {
      alert('No data to export')
      return
    }

    const worksheetData = sessions.map((session) => ({
      Date: session.session_date,
      Priest: session.priest_name,
      Graha: session.graha_name,
      Count: session.count,
      'Duration (min)': session.duration_secs ? Math.floor(session.duration_secs / 60) : '-',
      Type: session.assignment_type.toUpperCase(),
    }))

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet([
      { Field: 'Project', Value: projectName },
      { Field: 'Start Date', Value: formatDate(startDate) },
      { Field: 'End Date', Value: formatDate(endDate) },
      { Field: 'Total Sessions', Value: sessions.length },
      { Field: 'Total Japas', Value: sessions.reduce((sum, s) => sum + s.count, 0) },
      { Field: 'Total Duration (hours)', Value: (sessions.reduce((sum, s) => sum + (s.duration_secs || 0), 0) / 3600).toFixed(2) },
    ])
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

    // Details sheet
    const detailsSheet = XLSX.utils.json_to_sheet(worksheetData)
    detailsSheet['!cols'] = [
      { wch: 12 }, // Date
      { wch: 18 }, // Priest
      { wch: 12 }, // Graha
      { wch: 10 }, // Count
      { wch: 14 }, // Duration
      { wch: 12 }, // Type
    ]
    XLSX.utils.book_append_sheet(wb, detailsSheet, 'Session Details')

    // Write file
    XLSX.writeFile(
      wb,
      `${projectName.replace(/\s+/g, '_')}_History_${new Date().toISOString().split('T')[0]}.xlsx`
    )
  }, [projectName, startDate, endDate, sessions])

  const exportToPDF = useCallback(() => {
    if (!sessions || sessions.length === 0) {
      alert('No data to export')
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15

    // Title
    doc.setFontSize(16)
    doc.setFont('Helvetica', 'bold')
    doc.text(`${projectName} - Session History`, margin, margin + 5)

    // Date range info
    doc.setFontSize(10)
    doc.setFont('Helvetica', 'normal')
    const dateRange = `${formatDate(startDate)} to ${formatDate(endDate)}`
    doc.text(`Period: ${dateRange}`, margin, margin + 15)

    // Summary stats
    const totalJapas = sessions.reduce((sum, s) => sum + s.count, 0)
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_secs || 0), 0)
    const hours = Math.floor(totalDuration / 3600)
    const mins = Math.floor((totalDuration % 3600) / 60)

    const summaryText = [
      `Sessions: ${sessions.length} | Total Japas: ${totalJapas.toLocaleString()} | Duration: ${hours}h ${mins}m`,
    ]

    doc.setFontSize(9)
    doc.text(summaryText, margin, margin + 22)

    // Table
    const tableData = sessions.map((session) => [
      session.session_date,
      session.priest_name,
      session.graha_name,
      session.count.toLocaleString(),
      session.duration_secs ? `${Math.floor(session.duration_secs / 60)}m` : '-',
      session.assignment_type === 'assigned' ? 'ASSIGNED' : 'VOLUNTEER',
    ])

    ;(doc as any).autoTable({
      startY: margin + 30,
      head: [['Date', 'Priest', 'Graha', 'Count', 'Duration', 'Type']],
      body: tableData,
      margin: { top: margin, right: margin, bottom: margin, left: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [139, 69, 19], // temple-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 240, 240],
      },
      columnStyles: {
        3: { halign: 'right' }, // Count
        4: { halign: 'right' }, // Duration
      },
    })

    // Footer with timestamp
    const footerY = pageHeight - 10
    doc.setFontSize(8)
    doc.setFont('Helvetica', 'normal')
    doc.text(
      `Generated: ${new Date().toLocaleString()} | ChantTracker Delegation History`,
      margin,
      footerY,
      { align: 'left' }
    )

    // Save
    doc.save(
      `${projectName.replace(/\s+/g, '_')}_History_${new Date().toISOString().split('T')[0]}.pdf`
    )
  }, [projectName, startDate, endDate, sessions])

  const handleExport = () => {
    if (format === 'pdf') {
      exportToPDF()
    } else if (format === 'excel') {
      exportToCSV()
    }
  }

  return (
    <button
      onClick={handleExport}
      className={className}
      title={`Export as ${format.toUpperCase()}`}
    >
      {label || format.toUpperCase()}
    </button>
  )
}
