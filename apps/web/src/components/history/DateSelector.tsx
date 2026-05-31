'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface DateSelectorProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isToday = selectedDate.toLocaleDateString('sv') === today.toLocaleDateString('sv')
  const isYesterday =
    selectedDate.toLocaleDateString('sv') === yesterday.toLocaleDateString('sv')

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleYesterday = () => {
    onDateChange(yesterday)
  }

  const handleCustomDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value)
    if (!isNaN(date.getTime())) {
      onDateChange(date)
    }
  }

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return date.toLocaleDateString('en-US', options)
  }

  const isFutureDate = selectedDate > today

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-temple-100 mb-6">
      {/* Selected Date Display */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {formatDate(selectedDate)}
        </h2>
        {isFutureDate && (
          <p className="text-sm text-amber-600 mt-2">
            This date is in the future. No sessions recorded yet.
          </p>
        )}
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        <button
          onClick={handleToday}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
            isToday
              ? 'bg-temple-500 text-white'
              : 'bg-temple-50 text-temple-700 hover:bg-temple-100'
          }`}
        >
          Today
        </button>
        <button
          onClick={handleYesterday}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
            isYesterday
              ? 'bg-temple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Yesterday
        </button>

        {/* Custom Date Picker */}
        <div className="relative">
          <label className="sr-only">Select date</label>
          <input
            type="date"
            value={selectedDate.toLocaleDateString('sv')}
            onChange={handleCustomDate}
            max={today.toLocaleDateString('sv')}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors text-sm cursor-pointer appearance-none pr-10"
          />
          <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-600 pointer-events-none" />
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handlePreviousDay}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <span className="text-xs text-gray-500 font-medium">
          {selectedDate.toLocaleDateString('sv')}
        </span>

        <button
          onClick={handleNextDay}
          disabled={isFutureDate}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            isFutureDate
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
