'use client'

import { useState } from 'react'
import { useSessionCounter } from '@/hooks/useSessionCounter'
import { CounterDisplay } from '@/components/chant/CounterDisplay'

export default function TestCounterPage() {
  const { state: counterState, start, increment, pause, resume, complete } = useSessionCounter()
  const [mantraName] = useState('Gayatri Mantra')
  const [mantraDevanagari] = useState('गायत्री मंत्र')
  const [color] = useState('#EC4899')

  const handleStartSession = () => {
    console.log('Starting test session...')
    start('test-session-123', 'gayatri-1', 108)
  }

  const handleIncrement = () => {
    console.log('Incrementing count...')
    increment()
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Counter Test Page</h1>

        {/* State display */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>State:</strong> {counterState.state}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Count:</strong> {counterState.count}/{counterState.target}
          </p>
          <p className="text-sm text-gray-700">
            <strong>SessionId:</strong> {counterState.sessionId || 'none'}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Duration:</strong> {counterState.durationSecs}s
          </p>
        </div>

        {/* Counter Display */}
        {counterState.state !== 'idle' && (
          <CounterDisplay
            count={counterState.count}
            target={counterState.target}
            mantraName={mantraName}
            mantraDevanagari={mantraDevanagari}
            durationSecs={counterState.durationSecs}
            state={counterState.state}
            color={color}
          />
        )}

        {/* Control Buttons */}
        <div className="flex flex-col gap-2 mt-8">
          <button
            onClick={handleStartSession}
            disabled={counterState.state !== 'idle'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            Start Session
          </button>

          <button
            onClick={handleIncrement}
            disabled={counterState.state !== 'active'}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            Increment (+1)
          </button>

          <button
            onClick={pause}
            disabled={counterState.state !== 'active'}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            Pause
          </button>

          <button
            onClick={resume}
            disabled={counterState.state !== 'paused'}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            Resume
          </button>

          <button
            onClick={complete}
            disabled={counterState.state === 'idle'}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            Complete
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-8 text-center">
          This test page isolates the counter component to verify it works independently.
          Check browser console for logs.
        </p>
      </div>
    </div>
  )
}
