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
    <div className="glassmorphic p-6 mb-6">
      {/* Selected Date Display */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          {formatDate(selectedDate)}
        </h2>
        {isFutureDate && (
          <p className="text-sm text-amber-300 mt-2">
            This date is in the future. No sessions recorded yet.
          </p>
        )}
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        <button
          onClick={handleToday}
          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            isToday
              ? 'bg-sacred-500 text-white shadow-lg shadow-sacred-500/50'
              : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
          }`}
        >
          Today
        </button>
        <button
          onClick={handleYesterday}
          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            isYesterday
              ? 'bg-sacred-500 text-white shadow-lg shadow-sacred-500/50'
              : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
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
            className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all text-sm cursor-pointer appearance-none pr-10 placeholder-white/50"
          />
          <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-white/50 pointer-events-none" />
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <button
          onClick={handlePreviousDay}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <span className="text-xs text-white/60 font-medium">
          {selectedDate.toLocaleDateString('sv')}
        </span>

        <button
          onClick={handleNextDay}
          disabled={isFutureDate}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
            isFutureDate
              ? 'text-white/30 cursor-not-allowed'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
