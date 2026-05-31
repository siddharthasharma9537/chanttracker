import { useState, useCallback, useEffect } from 'react'

type SessionState = 'idle' | 'active' | 'paused' | 'completed' | 'abandoned'

interface SessionCounterState {
  sessionId: string | null
  mantraId: string | null
  count: number
  target: number
  state: SessionState
  startTime: number | null
  pauseTime: number | null
  durationSecs: number
}

const initialState: SessionCounterState = {
  sessionId: null,
  mantraId: null,
  count: 0,
  target: 108,
  state: 'idle',
  startTime: null,
  pauseTime: null,
  durationSecs: 0,
}

export function useSessionCounter() {
  const [state, setState] = useState<SessionCounterState>(initialState)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  // Timer for duration tracking
  useEffect(() => {
    if (state.state === 'active' && state.startTime) {
      const interval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          durationSecs: Math.floor((Date.now() - prev.startTime!) / 1000),
        }))
      }, 1000)
      setTimerInterval(interval)
      return () => clearInterval(interval)
    }
  }, [state.state, state.startTime])

  const start = useCallback(
    (sessionId: string, mantraId: string, target = 108) => {
      setState({
        sessionId,
        mantraId,
        count: 0,
        target,
        state: 'active',
        startTime: Date.now(),
        pauseTime: null,
        durationSecs: 0,
      })
    },
    []
  )

  const increment = useCallback(() => {
    setState((prev) => (prev.state === 'active' ? { ...prev, count: prev.count + 1 } : prev))
  }, [])

  const decrement = useCallback(() => {
    setState((prev) => (prev.count > 0 ? { ...prev, count: prev.count - 1 } : prev))
  }, [])

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      state: 'paused',
      pauseTime: Date.now(),
    }))
  }, [])

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.state !== 'paused' || !prev.pauseTime || !prev.startTime) return prev
      const pausedDuration = Date.now() - prev.pauseTime
      return {
        ...prev,
        state: 'active',
        startTime: prev.startTime + pausedDuration,
        pauseTime: null,
      }
    })
  }, [])

  const complete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      state: 'completed',
    }))
  }, [])

  const abandon = useCallback(() => {
    setState((prev) => ({
      ...prev,
      state: 'abandoned',
    }))
  }, [])

  const reset = useCallback(() => {
    if (timerInterval) clearInterval(timerInterval)
    setState(initialState)
    setTimerInterval(null)
  }, [timerInterval])

  return {
    state,
    start,
    increment,
    decrement,
    pause,
    resume,
    complete,
    abandon,
    reset,
  }
}
