'use client'

import { useEffect, useRef } from 'react'

/** Keeps the screen on while `active` — chanting is done with eyes closed
 *  or between glances, and the screen shouldn't sleep mid-mala. Wake locks
 *  are released by the browser when the tab loses visibility, so we
 *  re-acquire on visibilitychange. Unsupported browsers just no-op. */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<any>(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let cancelled = false

    const acquire = async () => {
      try {
        const lock = await (navigator as any).wakeLock.request('screen')
        if (cancelled) {
          lock.release()
          return
        }
        lockRef.current = lock
      } catch {
        // Denied or unsupported in this context — chanting still works fine.
      }
    }
    acquire()

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !lockRef.current) acquire()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [active])
}
